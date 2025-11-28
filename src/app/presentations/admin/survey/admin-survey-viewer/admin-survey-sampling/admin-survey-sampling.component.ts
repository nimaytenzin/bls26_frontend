import {
	Component,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';
import { Subject, debounceTime, takeUntil } from 'rxjs';

import { PrimeNgModules } from '../../../../../primeng.modules';
import { SamplingDataService } from '../../../../../core/dataservice/sampling/sampling.dataservice';
import { SurveyDataService } from '../../../../../core/dataservice/survey/survey.dataservice';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import { SurveyEnumerationAreaHouseholdListing } from '../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import {
	BulkRunSamplingDto,
	RunEnumerationAreaSamplingDto,
	SamplingExistsCheckDto,
	SamplingJobDto,
	SamplingJobStatus,
	SamplingJobQuery,
	SamplingMethod,
	SamplingResultHouseholdDto,
	SamplingResultsResponseDto,
	SamplingStatus,
	SamplingEnumerationHierarchyDto,
	SamplingEnumerationHierarchySummaryDto,
	DzongkhagSamplingHierarchyDto,
	AdministrativeZoneSamplingHierarchyDto,
	SubAdministrativeZoneSamplingHierarchyDto,
	EnumerationAreaSamplingHierarchyDto,
	SurveyEnumerationAreaSamplingDto,
	SurveySamplingConfigDto,
	SurveySamplingEAListItemDto,
	SurveyEAListQuery,
	UpdateSurveySamplingConfigDto,
} from '../../../../../core/dataservice/sampling/sampling.dto';
import { AdministrativeZoneType } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';

interface SamplingFilterForm {
	search: string;
	status: SamplingStatus | 'all';
	method: 'all' | 'CSS' | 'SRS';
	dzongkhagId: number | null;
	administrativeZoneId: number | null;
	subAdministrativeZoneId: number | null;
}

@Component({
	selector: 'app-admin-survey-sampling',
	standalone: true,
	templateUrl: './admin-survey-sampling.component.html',
	styleUrls: ['./admin-survey-sampling.component.css'],
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
})
export class AdminSurveySamplingComponent implements OnInit, OnChanges, OnDestroy {
	@Input() surveyId!: number | null;
	@Input() surveyName?: string | null;

	configForm: FormGroup;
	filterForm: FormGroup;
	configLoading = false;
	configSaving = false;
	config?: SurveySamplingConfigDto | null;

	hierarchy: DzongkhagSamplingHierarchyDto[] = [];
	hierarchySummary?: SamplingEnumerationHierarchySummaryDto | null;
	samplingHierarchy?: SamplingEnumerationHierarchyDto | null;
	administrativeZoneOptions: AdministrativeZoneSamplingHierarchyDto[] = [];
	subAdministrativeZoneOptions: SubAdministrativeZoneSamplingHierarchyDto[] = [];

	eaRows: SurveySamplingEAListItemDto[] = [];
	eaLoading = false;
	eaTotalRecords = 0;
	eaPageSize = 15;
	eaPageIndex = 0;

	selectedEAIds = new Set<number>();

	selectedEA: SurveySamplingEAListItemDto | null = null;
	runDialogVisible = false;
	configDialogVisible = false;
	runForm: FormGroup;
	runningSampling = false;

	resultDialogVisible = false;
	resultLoading = false;
	currentResult: SamplingResultsResponseDto['data'] | null = null;
	selectedHouseholds: SamplingResultHouseholdDto[] = [];
	allHouseholdListings: SurveyEnumerationAreaHouseholdListing[] = [];
	loadingAllHouseholds = false;
	selectedHouseholdIds: Set<number> = new Set();

	// Bulk operation state
	bulkDialogVisible = false;
	bulkForm: FormGroup;
	bulkSubmitting = false;
	processingEAs: Set<number> = new Set();
	completedEAs: Set<number> = new Set();
	failedEAs: Map<number, string> = new Map();
	isProcessingBatch = false;

	jobs: SamplingJobDto[] = [];
	jobLoading = false;
	jobStatusFilter: SamplingJobStatus | 'all' = 'all';
	private jobPollHandle?: any;

	private destroy$ = new Subject<void>();

	constructor(
		private fb: FormBuilder,
		private samplingService: SamplingDataService,
		private surveyDataService: SurveyDataService,
		private householdService: SurveyEnumerationAreaHouseholdListingDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService
	) {
		this.configForm = this.fb.group({
			defaultMethod: ['CSS', Validators.required],
			defaultSampleSize: [12, [Validators.min(1)]],
			urbanSampleSize: [12, [Validators.min(1)]],
			ruralSampleSize: [16, [Validators.min(1)]],
		});

		this.filterForm = this.fb.group({
			search: [''],
			status: ['all'],
			method: ['all'],
			dzongkhagId: [null],
			administrativeZoneId: [null],
			subAdministrativeZoneId: [null],
		});

		this.runForm = this.fb.group({
			method: ['CSS', Validators.required],
			sampleSize: [12, [Validators.required, Validators.min(1)]],
			randomStart: [null, [Validators.min(1)]],
			overwriteExisting: [false],
		});

		this.bulkForm = this.fb.group({
			method: ['CSS', Validators.required],
			sampleSize: [12, [Validators.required, Validators.min(1)]],
			randomStart: [null, [Validators.min(1)]],
			overwriteExisting: [true],
		});
	}

	ngOnInit(): void {
		this.registerFilterListeners();

		if (this.surveyId) {
			this.loadAll();
		}
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (
			changes['surveyId'] &&
			changes['surveyId'].currentValue &&
			!changes['surveyId'].firstChange
		) {
			this.resetState();
			this.loadAll();
		}
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
		this.clearJobPolling();
	}

	private loadAll(): void {
		this.loadSurveyConfig();
		this.loadHierarchy();
		this.loadEnumerationAreas();
		this.loadJobs();
	}

	private resetState(): void {
		this.config = null;
		this.configForm.reset({
			defaultMethod: 'CSS',
			defaultSampleSize: 12,
			urbanSampleSize: 12,
			ruralSampleSize: 16,
		});
		this.filterForm.reset({
			search: '',
			status: 'all',
			method: 'all',
			dzongkhagId: null,
			administrativeZoneId: null,
			subAdministrativeZoneId: null,
		});
		this.selectedEAIds.clear();
		this.eaPageIndex = 0;
	}

	private registerFilterListeners(): void {
		this.filterForm.valueChanges
			.pipe(debounceTime(200), takeUntil(this.destroy$))
			.subscribe(() => {
				this.eaPageIndex = 0;
				this.loadEnumerationAreas();
			});

		this.filterForm
			.get('dzongkhagId')
			?.valueChanges.pipe(takeUntil(this.destroy$))
			.subscribe((id) => {
				const dzongkhag = this.hierarchy.find((d) => d.id === id);
				this.administrativeZoneOptions = dzongkhag?.administrativeZones ?? [];
				this.filterForm.patchValue(
					{
						administrativeZoneId: null,
						subAdministrativeZoneId: null,
					},
					{ emitEvent: false }
				);
				this.subAdministrativeZoneOptions = [];
				this.eaPageIndex = 0;
				this.loadEnumerationAreas();
			});

		this.filterForm
			.get('administrativeZoneId')
			?.valueChanges.pipe(takeUntil(this.destroy$))
			.subscribe((id) => {
				const adminZone = this.administrativeZoneOptions.find((az) => az.id === id);
				this.subAdministrativeZoneOptions = adminZone?.subAdministrativeZones ?? [];
				this.filterForm.patchValue(
					{
						subAdministrativeZoneId: null,
					},
					{ emitEvent: false }
				);
				this.eaPageIndex = 0;
				this.loadEnumerationAreas();
			});
	}

	openConfigDialog(): void {
		// Load config if not already loaded
		if (!this.config && this.surveyId && !this.configLoading) {
			this.loadSurveyConfig();
		}
		this.configDialogVisible = true;
	}

	private loadSurveyConfig(): void {
		if (!this.surveyId) {
			this.configLoading = false;
			this.config = null;
			return;
		}
		
		this.configLoading = true;

		this.samplingService.getSurveyConfig(this.surveyId).subscribe({
			next: (config) => {
				this.config = config;
				this.configForm.patchValue({
					defaultMethod: config.defaultMethod,
					defaultSampleSize: config.defaultSampleSize ?? 12,
					urbanSampleSize:
						config.urbanSampleSize ?? config.defaultSampleSize ?? 12,
					ruralSampleSize:
						config.ruralSampleSize ?? config.defaultSampleSize ?? 16,
				});
				this.configLoading = false;
			},
			error: (error) => {
				this.configLoading = false;
				if (error?.status === 404) {
					// No config exists - this is normal, use defaults
					this.config = null;
					this.configForm.reset({
						defaultMethod: 'CSS',
						defaultSampleSize: 12,
						urbanSampleSize: 12,
						ruralSampleSize: 16,
					});
					return;
				}

				console.error('Error loading sampling config:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load sampling configuration',
				});
			},
		});
	}

	saveSurveyConfig(): void {
		if (!this.surveyId) {
			return;
		}

		if (this.configForm.invalid) {
			this.configForm.markAllAsTouched();
			return;
		}

		if (!this.configForm.dirty) {
			return;
		}

		const payload: UpdateSurveySamplingConfigDto = {
			defaultMethod: this.configForm.value.defaultMethod,
			defaultSampleSize: this.configForm.value.defaultSampleSize,
			urbanSampleSize: this.configForm.value.urbanSampleSize,
			ruralSampleSize: this.configForm.value.ruralSampleSize,
		};

		this.configSaving = true;
		this.samplingService.saveSurveyConfig(this.surveyId, payload).subscribe({
			next: (config) => {
				this.config = config;
				this.configSaving = false;
				this.configForm.markAsPristine();
				this.configDialogVisible = false;
				this.messageService.add({
					severity: 'success',
					summary: 'Sampling defaults saved',
					detail: 'Survey sampling configuration updated successfully',
				});
			},
			error: (error) => {
				this.configSaving = false;
				console.error('Error saving sampling config:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: error?.error?.message || 'Failed to save sampling defaults',
				});
			},
		});
	}

	private loadHierarchy(): void {
		if (!this.surveyId) return;
		this.samplingService.getEnumerationHierarchy(this.surveyId).subscribe({
			next: (response: SamplingEnumerationHierarchyDto) => {
				this.samplingHierarchy = response;
				this.hierarchy = response?.hierarchy ?? [];
				this.hierarchySummary = response?.summary;
				const selectedDzongkhagId = this.filterForm.value.dzongkhagId;
				if (selectedDzongkhagId) {
					const dzongkhag = this.hierarchy.find((d) => d.id === selectedDzongkhagId);
					this.administrativeZoneOptions = dzongkhag?.administrativeZones ?? [];
				}
			},
			error: (error) => {
				console.error('Error loading sampling hierarchy:', error);
				this.messageService.add({
					severity: 'warn',
					summary: 'Warning',
					detail: 'Failed to load EA hierarchy with sampling status',
				});
			},
		});
	}

	loadEnumerationAreas(event?: TableLazyLoadEvent): void {
		if (!this.surveyId) return;

		if (event) {
			this.eaPageSize = event.rows ?? this.eaPageSize;
			const first = event.first ?? 0;
			this.eaPageIndex = Math.floor(first / this.eaPageSize);
		}

		const page = this.eaPageIndex + 1;

		const formValue = this.filterForm.value as SamplingFilterForm;

		const params: SurveyEAListQuery = {
			page,
			pageSize: this.eaPageSize,
			search: formValue.search?.trim() || undefined,
			status: formValue.status === 'all' ? undefined : formValue.status,
			method: formValue.method === 'all' ? undefined : formValue.method,
			dzongkhagId: formValue.dzongkhagId ?? undefined,
			administrativeZoneId: formValue.administrativeZoneId ?? undefined,
			subAdministrativeZoneId: formValue.subAdministrativeZoneId ?? undefined,
		};

		this.eaLoading = true;
		// Use sampling hierarchy to get enumeration areas with sampling status
		this.samplingService.getEnumerationHierarchy(this.surveyId).subscribe({
			next: (hierarchy: SamplingEnumerationHierarchyDto) => {
				// Convert hierarchy to flat EA list
				const allEAs: SurveySamplingEAListItemDto[] = [];
				
				hierarchy.hierarchy.forEach((dzongkhag) => {
					dzongkhag.administrativeZones.forEach((adminZone) => {
						adminZone.subAdministrativeZones.forEach((subZone) => {
							subZone.enumerationAreas.forEach((ea: EnumerationAreaSamplingHierarchyDto) => {
								// Apply filters
								if (params.dzongkhagId && dzongkhag.id !== params.dzongkhagId) return;
								if (params.administrativeZoneId && adminZone.id !== params.administrativeZoneId) return;
								if (params.subAdministrativeZoneId && subZone.id !== params.subAdministrativeZoneId) return;
								
								// Apply search filter
								if (params.search) {
									const searchLower = params.search.toLowerCase();
									if (
										!ea.name.toLowerCase().includes(searchLower) &&
										!ea.areaCode.toLowerCase().includes(searchLower) &&
										!dzongkhag.name.toLowerCase().includes(searchLower) &&
										!adminZone.name.toLowerCase().includes(searchLower) &&
										!subZone.name.toLowerCase().includes(searchLower)
									) {
										return;
									}
								}

								// Determine sampling status
								let status: SamplingStatus = 'not_run';
								let method: SamplingMethod | undefined;
								let sampleSize: number | undefined;
								let populationSize: number | undefined;
								let isFullSelection = false;
								let lastRunAt: string | undefined;
								let lastRunBy: string | undefined;

								if (ea.hasSampling && ea.sampling) {
									method = ea.sampling.method;
									sampleSize = ea.sampling.sampleSize;
									populationSize = ea.sampling.populationSize;
									isFullSelection = ea.sampling.isFullSelection;
									lastRunAt = ea.sampling.executedAt 
										? (typeof ea.sampling.executedAt === 'string' 
											? ea.sampling.executedAt 
											: ea.sampling.executedAt.toISOString())
										: undefined;
									lastRunBy = ea.sampling.executedBy?.toString();
									
								// Determine status based on sampling data
								// Only "completed" or "pending" for EAs with sampling
								if (ea.sampling.executedAt) {
									status = 'completed';
								} else {
									status = 'pending';
								}
								}

								// Apply status filter
								if (params.status && params.status !== 'all') {
									if (status !== params.status) {
										return;
									}
								}

								// Apply method filter
								if (params.method && params.method !== 'all') {
									if (method !== params.method) {
										return;
									}
								}

								const eaItem: SurveySamplingEAListItemDto = {
									surveyEnumerationAreaId: ea.surveyEnumerationAreaId,
									enumerationAreaName: ea.name,
									enumerationAreaCode: ea.areaCode,
									dzongkhagId: dzongkhag.id,
									dzongkhagName: dzongkhag.name,
									administrativeZoneId: adminZone.id,
									administrativeZoneName: adminZone.name,
									administrativeZoneType: adminZone.type,
									subAdministrativeZoneId: subZone.id,
									subAdministrativeZoneName: subZone.name,
									householdCount: ea.totalHouseholdCount || 0,
									populationCount: populationSize,
									status: status,
									method: method,
									sampleSize: sampleSize,
									populationSize: populationSize,
									isFullSelection: isFullSelection,
									lastRunAt: lastRunAt,
									lastRunBy: lastRunBy,
									lastRunJobId: undefined,
									errorMessage: undefined,
									// Submission and validation status - not available in sampling hierarchy
									isSubmitted: undefined,
									submittedBy: undefined,
									submissionDate: undefined,
									isValidated: undefined,
									validatedBy: undefined,
									validationDate: undefined,
								};
								allEAs.push(eaItem);
							});
						});
					});
				});

				// Sort by hierarchy: Dzongkhag -> Admin Zone -> Sub-Admin Zone -> EA Name
				allEAs.sort((a: SurveySamplingEAListItemDto, b: SurveySamplingEAListItemDto) => {
					// First by Dzongkhag
					if (a.dzongkhagName !== b.dzongkhagName) {
						return (a.dzongkhagName || '').localeCompare(b.dzongkhagName || '');
					}
					// Then by Admin Zone
					if (a.administrativeZoneName !== b.administrativeZoneName) {
						return (a.administrativeZoneName || '').localeCompare(b.administrativeZoneName || '');
					}
					// Then by Sub-Admin Zone
					if (a.subAdministrativeZoneName !== b.subAdministrativeZoneName) {
						return (a.subAdministrativeZoneName || '').localeCompare(b.subAdministrativeZoneName || '');
					}
					// Finally by EA Name
					return (a.enumerationAreaName || '').localeCompare(b.enumerationAreaName || '');
				});

				// Apply pagination
				const startIndex = ((page || 1) - 1) * this.eaPageSize;
				const endIndex = startIndex + this.eaPageSize;
				this.eaRows = allEAs.slice(startIndex, endIndex);
				this.eaTotalRecords = allEAs.length;
				this.eaPageIndex = (page || 1) - 1;
				this.eaLoading = false;
				this.selectedEAIds.clear();
			},
			error: (error: any) => {
				console.error('Error loading enumeration areas:', error);
				this.eaLoading = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load enumeration areas',
				});
				this.eaRows = [];
				this.eaTotalRecords = 0;
			},
		});
	}

	onLazyLoad(event: TableLazyLoadEvent): void {
		this.loadEnumerationAreas(event);
	}

	isEASelected(ea: SurveySamplingEAListItemDto): boolean {
		return this.selectedEAIds.has(ea.surveyEnumerationAreaId);
	}

	toggleEASelection(ea: SurveySamplingEAListItemDto, checked: boolean): void {
		if (checked) {
			this.selectedEAIds.add(ea.surveyEnumerationAreaId);
		} else {
			this.selectedEAIds.delete(ea.surveyEnumerationAreaId);
		}
	}

	/**
	 * Check if all EAs in an Admin Zone are selected
	 */
	isAdminZoneSelected(adminZoneId: number): boolean {
		const adminZoneEAs = this.eaRows.filter(
			(ea) => ea.administrativeZoneId === adminZoneId
		);
		if (adminZoneEAs.length === 0) return false;
		return adminZoneEAs.every((ea) =>
			this.selectedEAIds.has(ea.surveyEnumerationAreaId)
		);
	}

	/**
	 * Toggle selection for all EAs in an Admin Zone
	 */
	toggleAdminZoneSelection(adminZoneId: number, checked: boolean): void {
		const adminZoneEAs = this.eaRows.filter(
			(ea) => ea.administrativeZoneId === adminZoneId
		);
		adminZoneEAs.forEach((ea) => {
			if (checked) {
				this.selectedEAIds.add(ea.surveyEnumerationAreaId);
			} else {
				this.selectedEAIds.delete(ea.surveyEnumerationAreaId);
			}
		});
	}

	/**
	 * Check if all EAs in a Sub-Admin Zone are selected
	 */
	isSubAdminZoneSelected(subAdminZoneId: number): boolean {
		const subAdminZoneEAs = this.eaRows.filter(
			(ea) => ea.subAdministrativeZoneId === subAdminZoneId
		);
		if (subAdminZoneEAs.length === 0) return false;
		return subAdminZoneEAs.every((ea) =>
			this.selectedEAIds.has(ea.surveyEnumerationAreaId)
		);
	}

	/**
	 * Toggle selection for all EAs in a Sub-Admin Zone
	 */
	toggleSubAdminZoneSelection(subAdminZoneId: number, checked: boolean): void {
		const subAdminZoneEAs = this.eaRows.filter(
			(ea) => ea.subAdministrativeZoneId === subAdminZoneId
		);
		subAdminZoneEAs.forEach((ea) => {
			if (checked) {
				this.selectedEAIds.add(ea.surveyEnumerationAreaId);
			} else {
				this.selectedEAIds.delete(ea.surveyEnumerationAreaId);
			}
		});
	}

	clearSelection(): void {
		this.selectedEAIds.clear();
	}

	openRunSamplingDialog(ea: SurveySamplingEAListItemDto): void {
		this.selectedEA = ea;
		this.runForm.reset({
			method: ea.method ?? this.configForm.value.defaultMethod ?? 'CSS',
			sampleSize:
				ea.sampleSize ??
				this.getRecommendedSampleSize(ea) ??
				this.configForm.value.defaultSampleSize ?? 12,
			randomStart: null,
			overwriteExisting: !!ea.sampleSize,
		});
		this.runDialogVisible = true;
	}

	runSampling(): void {
		if (!this.surveyId || !this.selectedEA) {
			return;
		}

		if (this.runForm.invalid) {
			this.runForm.markAllAsTouched();
			return;
		}

		// First, check if sampling already exists
		this.runningSampling = true;
		this.samplingService
			.checkSamplingExists(this.surveyId, this.selectedEA.surveyEnumerationAreaId)
			.subscribe({
				next: (checkResult: SamplingExistsCheckDto) => {
					if (checkResult.exists && checkResult.data) {
						// Sampling exists - show confirmation dialog
						this.runningSampling = false;
						this.showOverwriteConfirmation(checkResult.data);
					} else {
						// No existing sampling - proceed directly
						this.executeSampling(false);
					}
				},
				error: (error) => {
					// If check fails, proceed anyway (might be a new EA)
					console.warn('Error checking sampling existence, proceeding anyway:', error);
					this.executeSampling(false);
				},
			});
	}

	/**
	 * Show confirmation dialog when sampling already exists
	 */
	private showOverwriteConfirmation(existingSampling: SamplingExistsCheckDto['data']): void {
		if (!existingSampling) return;

		const executedDate = existingSampling.executedAt
			? new Date(existingSampling.executedAt).toLocaleString()
			: 'Unknown';

		this.confirmationService.confirm({
			message: `Sampling already exists for this enumeration area.
				<br/><br/>
				<strong>Existing Sampling Details:</strong><br/>
				Method: ${existingSampling.method}<br/>
				Sample Size: ${existingSampling.sampleSize}<br/>
				Population Size: ${existingSampling.populationSize}<br/>
				Executed At: ${executedDate}<br/><br/>
				Do you want to overwrite the existing sampling? This will delete all existing household samples and create new ones.`,
			header: 'Sampling Already Exists',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: 'p-button-danger',
			acceptLabel: 'Yes, Overwrite',
			rejectLabel: 'Cancel',
			accept: () => {
				// User confirmed - proceed with overwrite
				this.executeSampling(true);
			},
			reject: () => {
				// User cancelled - do nothing
			},
		});
	}

	/**
	 * Execute the sampling with the given payload
	 */
	private executeSampling(overwriteExisting: boolean): void {
		if (!this.surveyId || !this.selectedEA) {
			return;
		}

		const payload: RunEnumerationAreaSamplingDto = {
			method: this.runForm.value.method,
			sampleSize: this.runForm.value.sampleSize,
			randomStart: this.runForm.value.randomStart,
			overwriteExisting: overwriteExisting,
		};

		this.runningSampling = true;
		this.samplingService
			.runSampling(this.surveyId, this.selectedEA.surveyEnumerationAreaId, payload)
			.subscribe({
				next: () => {
					this.runningSampling = false;
					this.runDialogVisible = false;
					this.selectedEA = null;
					this.loadEnumerationAreas();
					this.loadJobs(true);
					this.messageService.add({
						severity: 'success',
						summary: 'Sampling completed',
						detail: overwriteExisting
							? 'Existing sampling has been overwritten successfully'
							: 'Enumeration area has been sampled successfully',
					});
				},
				error: (error) => {
					this.runningSampling = false;
					console.error('Error running sampling:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error?.error?.message || 'Failed to run sampling',
					});
				},
			});
	}

	openResultDialog(ea: SurveySamplingEAListItemDto): void {
		if (!this.surveyId) {
			return;
		}
		this.selectedEA = ea;
		this.resultDialogVisible = true;
		this.resultLoading = true;
		this.currentResult = null;
		this.selectedHouseholds = [];
		this.allHouseholdListings = [];
		this.selectedHouseholdIds.clear();

		// Load both sampling results and all household listings
		this.samplingService
			.getSamplingResults(this.surveyId, ea.surveyEnumerationAreaId)
			.subscribe({
				next: (response: SamplingResultsResponseDto) => {
					if (response.success && response.data) {
						this.currentResult = response.data;
						this.selectedHouseholds = response.data.selectedHouseholds;
						// Store selected household IDs for highlighting
						this.selectedHouseholdIds = new Set(
							this.selectedHouseholds.map((item) => item.household.id)
						);
					}
					// Load all household listings regardless of sampling results
					this.loadAllHouseholdListings(ea.surveyEnumerationAreaId);
				},
				error: (error: any) => {
					console.error('Error loading sampling results:', error);
					// Still load all household listings even if sampling fails
					this.loadAllHouseholdListings(ea.surveyEnumerationAreaId);
					if (error?.status !== 404) {
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: error?.error?.message || 'Failed to load sampling results',
						});
					}
				},
			});
	}

	/**
	 * Load all household listings for the enumeration area
	 */
	loadAllHouseholdListings(surveyEnumerationAreaId: number): void {
		this.loadingAllHouseholds = true;
		this.householdService.getBySurveyEA(surveyEnumerationAreaId).subscribe({
			next: (listings: SurveyEnumerationAreaHouseholdListing[]) => {
				this.allHouseholdListings = listings.sort(
					(a, b) => (a.householdSerialNumber || 0) - (b.householdSerialNumber || 0)
				);
				this.loadingAllHouseholds = false;
				this.resultLoading = false;
			},
			error: (error: any) => {
				console.error('Error loading household listings:', error);
				this.loadingAllHouseholds = false;
				this.resultLoading = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load household listings',
				});
			},
		});
	}

	/**
	 * Check if a household is selected (sampled)
	 */
	isHouseholdSelected(householdId: number): boolean {
		return this.selectedHouseholdIds.has(householdId);
	}

	downloadSamplingResult(): void {
		if (!this.currentResult || !this.selectedHouseholds.length) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Data',
				detail: 'No sampling results to export',
			});
			return;
		}

		const headers = [
			'Selection Order',
			'Structure Number',
			'Household ID',
			'Serial Number',
			'Head of Household',
			'Total Male',
			'Total Female',
			'Total Population',
			'Phone Number',
			'Remarks',
			'Is Replacement',
		];

		const csvData = this.selectedHouseholds.map((item) => [
			item.selectionOrder,
			item.household.structureNumber,
			item.household.householdIdentification,
			item.household.householdSerialNumber,
			item.household.nameOfHOH,
			item.household.totalMale,
			item.household.totalFemale,
			item.household.totalPopulation,
			item.household.phoneNumber || '',
			item.household.remarks || '',
			item.isReplacement ? 'Yes' : 'No',
		]);

		let csvContent = headers.join(',') + '\n';
		csvData.forEach((row) => {
			csvContent += row.map((val) => `"${val}"`).join(',') + '\n';
		});

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `sampling_results_${this.currentResult.enumerationArea.areaCode || 'ea'}_${Date.now()}.csv`;
		link.click();
		window.URL.revokeObjectURL(url);

		this.messageService.add({
			severity: 'success',
			summary: 'Success',
			detail: 'Sampling results exported successfully',
		});
	}


	loadJobs(skipPollingReset: boolean = false): void {
		if (!this.surveyId) {
			return;
		}

		const params: SamplingJobQuery = {
			page: 1,
			pageSize: 5,
			status: this.jobStatusFilter === 'all' ? undefined : this.jobStatusFilter,
		};

		// Not implemented - set empty jobs list
		this.jobLoading = false;
		this.jobs = [];
	}

	refreshJobs(): void {
		this.loadJobs(true);
	}

	private startJobPolling(): void {
		this.clearJobPolling();
		this.jobPollHandle = setInterval(() => this.loadJobs(true), 30000);
	}

	private clearJobPolling(): void {
		if (this.jobPollHandle) {
			clearInterval(this.jobPollHandle);
			this.jobPollHandle = undefined;
		}
	}

	exportEnumerationAreas(status: 'pending' | 'sampled'): void {
		if (!this.surveyId) return;
		// Not implemented - show message directly
		this.messageService.add({
			severity: 'warn',
			summary: 'Not Implemented',
			detail: 'Exporting enumeration areas is not implemented in the backend yet.',
			life: 5000,
		});
	}

	getStatusSeverity(status: SamplingStatus): string {
		switch (status) {
			case 'completed':
				return 'success';
			case 'pending':
				return 'warning';
			case 'failed':
				return 'danger';
			case 'running':
				return 'warning';
			default:
				return 'secondary';
		}
	}

	/**
	 * Get effective status for an EA (considering processing state)
	 */
	getEAStatus(ea: SurveySamplingEAListItemDto): SamplingStatus {
		if (this.processingEAs.has(ea.surveyEnumerationAreaId)) {
			return 'running';
		}
		return ea.status;
	}

	/**
	 * Check if EA is currently being processed
	 */
	isEAProcessing(ea: SurveySamplingEAListItemDto): boolean {
		return this.processingEAs.has(ea.surveyEnumerationAreaId);
	}

	/**
	 * Check if EA has been completed in current batch
	 */
	isEACompleted(ea: SurveySamplingEAListItemDto): boolean {
		return this.completedEAs.has(ea.surveyEnumerationAreaId);
	}

	/**
	 * Check if EA failed in current batch
	 */
	isEAFailed(ea: SurveySamplingEAListItemDto): boolean {
		return this.failedEAs.has(ea.surveyEnumerationAreaId);
	}

	/**
	 * Get error message for failed EA
	 */
	getEAErrorMessage(ea: SurveySamplingEAListItemDto): string | null {
		return this.failedEAs.get(ea.surveyEnumerationAreaId) || null;
	}

	/**
	 * Open bulk sampling dialog
	 */
	openBulkDialog(): void {
		if (!this.selectedEAIds.size) {
			this.messageService.add({
				severity: 'info',
				summary: 'Select enumeration areas',
				detail: 'Choose at least one enumeration area to run bulk sampling',
			});
			return;
		}

		this.bulkForm.reset({
			method: this.configForm.value.defaultMethod ?? 'CSS',
			sampleSize: this.configForm.value.defaultSampleSize ?? 12,
			randomStart: null,
			overwriteExisting: true,
		});
		this.bulkDialogVisible = true;
	}

	/**
	 * Run bulk sampling for selected EAs
	 */
	runBulkSampling(): void {
		if (!this.surveyId) {
			return;
		}

		if (this.bulkForm.invalid || this.selectedEAIds.size === 0) {
			this.bulkForm.markAllAsTouched();
			return;
		}

		// Close dialog and process sequentially
		this.bulkDialogVisible = false;
		this.bulkSubmitting = true;
		
		// Process selected EAs sequentially
		this.processSelectedEAsSequentially(
			this.bulkForm.value.method,
			this.bulkForm.value.sampleSize,
			this.bulkForm.value.randomStart
		);
	}

	/**
	 * Process selected enumeration areas sequentially (one at a time)
	 */
	async processSelectedEAsSequentially(
		method?: SamplingMethod,
		sampleSize?: number,
		randomStart?: number
	): Promise<void> {
		if (!this.surveyId || this.selectedEAIds.size === 0) {
			return;
		}

		if (this.isProcessingBatch) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Processing',
				detail: 'Already processing enumeration areas. Please wait.',
			});
			return;
		}

		this.isProcessingBatch = true;
		this.processingEAs.clear();
		this.completedEAs.clear();
		this.failedEAs.clear();

		const eaIds = Array.from(this.selectedEAIds);
		const totalEAs = eaIds.length;

		for (let i = 0; i < eaIds.length; i++) {
			const seaId = eaIds[i];
			const ea = this.eaRows.find((e) => e.surveyEnumerationAreaId === seaId);
			
			if (!ea) continue;

			this.processingEAs.add(seaId);
			
			// Show progress message
			this.messageService.add({
				severity: 'info',
				summary: 'Processing',
				detail: `Processing EA ${i + 1} of ${totalEAs}: ${ea.enumerationAreaName}`,
				life: 3000,
			});

			try {
				await this.processSingleEA(seaId, ea, method, sampleSize, randomStart);
				this.completedEAs.add(seaId);
			} catch (error: any) {
				const errorMessage = error?.error?.message || 'Unknown error';
				this.failedEAs.set(seaId, errorMessage);
				console.error(`Error processing EA ${seaId}:`, error);
			} finally {
				this.processingEAs.delete(seaId);
			}
		}

		this.isProcessingBatch = false;
		this.bulkSubmitting = false;
		this.selectedEAIds.clear();
		this.loadEnumerationAreas();

		// Show summary
		const completed = this.completedEAs.size;
		const failed = this.failedEAs.size;
		
		if (completed > 0 && failed === 0) {
			this.messageService.add({
				severity: 'success',
				summary: 'Processing Complete',
				detail: `Successfully processed ${completed} enumeration area(s)`,
				life: 5000,
			});
		} else if (completed > 0 && failed > 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Processing Complete with Errors',
				detail: `Completed: ${completed}, Failed: ${failed}`,
				life: 5000,
			});
		} else if (failed > 0) {
			this.messageService.add({
				severity: 'error',
				summary: 'Processing Failed',
				detail: `Failed to process ${failed} enumeration area(s)`,
				life: 5000,
			});
		}
	}

	/**
	 * Process a single enumeration area (check → confirm → run)
	 */
	private processSingleEA(
		seaId: number,
		ea: SurveySamplingEAListItemDto,
		method?: SamplingMethod,
		sampleSize?: number,
		randomStart?: number
	): Promise<void> {
		return new Promise((resolve, reject) => {
			// Step 1: Check if sampling exists
			this.samplingService
				.checkSamplingExists(this.surveyId!, seaId)
				.subscribe({
					next: (checkResult: SamplingExistsCheckDto) => {
						if (checkResult.exists && checkResult.data) {
							// Step 2: Show confirmation dialog
							this.confirmationService.confirm({
								message: `Sampling already exists for ${ea.enumerationAreaName}.
									<br/><br/>
									<strong>Existing Sampling Details:</strong><br/>
									Method: ${checkResult.data.method}<br/>
									Sample Size: ${checkResult.data.sampleSize}<br/>
									Population Size: ${checkResult.data.populationSize}<br/>
									Executed At: ${new Date(checkResult.data.executedAt).toLocaleString()}<br/><br/>
									Do you want to overwrite? This will delete all existing household samples and create new ones.`,
								header: 'Sampling Already Exists',
								icon: 'pi pi-exclamation-triangle',
								acceptButtonStyleClass: 'p-button-danger',
								acceptLabel: 'Yes, Overwrite',
								rejectLabel: 'Skip',
								accept: () => {
									// User confirmed - proceed with overwrite
									this.executeSamplingForEA(seaId, ea, method, sampleSize, randomStart, true)
										.then(resolve)
										.catch(reject);
								},
								reject: () => {
									// User cancelled - skip this EA
									resolve();
								},
							});
						} else {
							// No existing sampling - proceed directly
							this.executeSamplingForEA(seaId, ea, method, sampleSize, randomStart, false)
								.then(resolve)
								.catch(reject);
						}
					},
					error: (error: any) => {
						reject(error);
					},
				});
		});
	}

	/**
	 * Execute sampling for a single EA
	 */
	private executeSamplingForEA(
		seaId: number,
		ea: SurveySamplingEAListItemDto,
		method?: SamplingMethod,
		sampleSize?: number,
		randomStart?: number,
		overwriteExisting: boolean = false
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const payload: RunEnumerationAreaSamplingDto = {
				method: method || this.configForm.value.defaultMethod || 'CSS',
				sampleSize: sampleSize || this.getRecommendedSampleSize(ea) || this.configForm.value.defaultSampleSize || 12,
				randomStart: randomStart || undefined,
				overwriteExisting: overwriteExisting,
			};

			this.samplingService
				.runSampling(this.surveyId!, seaId, payload)
				.subscribe({
					next: () => {
						resolve();
					},
					error: (error: any) => {
						reject(error);
					},
				});
		});
	}

	getRecommendedSampleSize(ea: SurveySamplingEAListItemDto): number | undefined {
		const isUrban =
			ea.administrativeZoneType === AdministrativeZoneType.Thromde ||
			ea.administrativeZoneType === 'Thromde';
		if (isUrban) {
			return this.configForm.value.urbanSampleSize || this.configForm.value.defaultSampleSize;
		}
		return this.configForm.value.ruralSampleSize || this.configForm.value.defaultSampleSize;
	}

	trackByJob(_: number, job: SamplingJobDto): number {
		return job.id;
	}

	/**
	 * Get unified submission/validation status
	 */
	getUnifiedStatus(ea: SurveySamplingEAListItemDto): 'not_submitted' | 'not_validated' | 'validated' {
		if (ea.isValidated) {
			return 'validated';
		}
		if (ea.isSubmitted) {
			return 'not_validated';
		}
		return 'not_submitted';
	}

	/**
	 * Get unified status severity for PrimeNG tag
	 */
	getUnifiedStatusSeverity(status: 'not_submitted' | 'not_validated' | 'validated'): string {
		switch (status) {
			case 'validated':
				return 'success';
			case 'not_validated':
				return 'warning';
			case 'not_submitted':
				return 'secondary';
			default:
				return 'secondary';
		}
	}

	/**
	 * Get unified status label
	 */
	getUnifiedStatusLabel(status: 'not_submitted' | 'not_validated' | 'validated'): string {
		switch (status) {
			case 'validated':
				return 'Validated';
			case 'not_validated':
				return 'Not Validated';
			case 'not_submitted':
				return 'Not Submitted';
			default:
				return 'Unknown';
		}
	}

	/**
	 * Get group key for row grouping (composite of dzongkhag, admin zone, sub-admin zone)
	 */
	getGroupKey(ea: SurveySamplingEAListItemDto): string {
		return `${ea.dzongkhagId || ''}_${ea.administrativeZoneId || ''}_${ea.subAdministrativeZoneId || ''}`;
	}

	/**
	 * Check if this is the first row in a dzongkhag group
	 */
	isFirstInDzongkhagGroup(index: number, ea: SurveySamplingEAListItemDto): boolean {
		if (index === 0) return true;
		const prevEA = this.eaRows[index - 1];
		return prevEA?.dzongkhagId !== ea.dzongkhagId;
	}

	/**
	 * Check if this is the first row in an admin zone group
	 */
	isFirstInAdminZoneGroup(index: number, ea: SurveySamplingEAListItemDto): boolean {
		if (index === 0) return true;
		const prevEA = this.eaRows[index - 1];
		return (
			prevEA?.dzongkhagId !== ea.dzongkhagId ||
			prevEA?.administrativeZoneId !== ea.administrativeZoneId
		);
	}

	/**
	 * Check if this is the first row in a sub-admin zone group
	 */
	isFirstInSubAdminZoneGroup(index: number, ea: SurveySamplingEAListItemDto): boolean {
		if (index === 0) return true;
		const prevEA = this.eaRows[index - 1];
		return (
			prevEA?.dzongkhagId !== ea.dzongkhagId ||
			prevEA?.administrativeZoneId !== ea.administrativeZoneId ||
			prevEA?.subAdministrativeZoneId !== ea.subAdministrativeZoneId
		);
	}

	/**
	 * Get rowspan for dzongkhag (count of EAs in this dzongkhag)
	 */
	getDzongkhagRowspan(ea: SurveySamplingEAListItemDto): number {
		return this.eaRows.filter((e) => e.dzongkhagId === ea.dzongkhagId).length;
	}

	/**
	 * Get rowspan for admin zone (count of EAs in this admin zone within current page)
	 */
	getAdminZoneRowspan(ea: SurveySamplingEAListItemDto): number {
		return this.eaRows.filter(
			(e) =>
				e.dzongkhagId === ea.dzongkhagId &&
				e.administrativeZoneId === ea.administrativeZoneId
		).length;
	}

	/**
	 * Get rowspan for sub-admin zone (count of EAs in this sub-admin zone within current page)
	 */
	getSubAdminZoneRowspan(ea: SurveySamplingEAListItemDto): number {
		return this.eaRows.filter(
			(e) =>
				e.dzongkhagId === ea.dzongkhagId &&
				e.administrativeZoneId === ea.administrativeZoneId &&
				e.subAdministrativeZoneId === ea.subAdministrativeZoneId
		).length;
	}

	private downloadBlob(blob: Blob, filename: string): void {
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		window.URL.revokeObjectURL(url);
	}

}
