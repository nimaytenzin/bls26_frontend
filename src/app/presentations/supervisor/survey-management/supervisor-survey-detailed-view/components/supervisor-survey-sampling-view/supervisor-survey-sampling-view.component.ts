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
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';
import { Subject, debounceTime, takeUntil } from 'rxjs';

import { PrimeNgModules } from '../../../../../../primeng.modules';
import { SamplingDataService } from '../../../../../../core/dataservice/sampling/sampling.dataservice';
import { SurveyDataService } from '../../../../../../core/dataservice/survey/survey.dataservice';
import {
	SamplingJobQuery,
	SamplingStatus,
	SamplingResultsResponseDto,
	SamplingResultHouseholdDto,
	SurveySamplingConfigDto,
	SurveySamplingEAListItemDto,
	SurveyEAListQuery,
	DzongkhagSamplingHierarchyDto,
	AdministrativeZoneSamplingHierarchyDto,
	SamplingEnumerationHierarchyDto,
	EnumerationAreaSamplingHierarchyDto,
} from '../../../../../../core/dataservice/sampling/sampling.dto';

interface SamplingFilterForm {
	search: string;
	status: SamplingStatus | 'all';
	method: 'all' | 'CSS' | 'SRS';
	dzongkhagId: number | null;
	administrativeZoneId: number | null;
}

@Component({
	selector: 'app-supervisor-survey-sampling-view',
	standalone: true,
	templateUrl: './supervisor-survey-sampling-view.component.html',
	styleUrls: ['./supervisor-survey-sampling-view.component.scss'],
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class SupervisorSurveySamplingViewComponent
	implements OnInit, OnChanges, OnDestroy
{
	@Input() surveyId!: number | null;
	@Input() surveyName?: string | null;

	filterForm: FormGroup;
	configLoading = false;
	config?: SurveySamplingConfigDto | null;

	hierarchy: DzongkhagSamplingHierarchyDto[] = [];
	administrativeZoneOptions: AdministrativeZoneSamplingHierarchyDto[] = [];

	eaRows: SurveySamplingEAListItemDto[] = [];
	eaLoading = false;
	eaTotalRecords = 0;
	eaPageSize = 15;
	eaPageIndex = 0;

	selectedEA: SurveySamplingEAListItemDto | null = null;
	resultDialogVisible = false;
	resultLoading = false;
	currentResult: SamplingResultsResponseDto['data'] | null = null;
	selectedHouseholds: SamplingResultHouseholdDto[] = [];

	private destroy$ = new Subject<void>();

	constructor(
		private fb: FormBuilder,
		private samplingService: SamplingDataService,
		private surveyDataService: SurveyDataService,
		private messageService: MessageService
	) {
		this.filterForm = this.fb.group({
			search: [''],
			status: ['all'],
			method: ['all'],
			dzongkhagId: [null],
			administrativeZoneId: [null],
		});
	}

	ngOnInit() {
		if (this.surveyId) {
			this.loadConfig();
			this.loadHierarchy();
			this.loadEAList();
		}

		// Setup filter form changes
		this.filterForm.valueChanges
			.pipe(debounceTime(300), takeUntil(this.destroy$))
			.subscribe(() => {
				this.eaPageIndex = 0;
				this.loadEAList();
			});
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['surveyId'] && !changes['surveyId'].firstChange) {
			if (this.surveyId) {
				this.loadConfig();
				this.loadHierarchy();
				this.loadEAList();
			}
		}
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	loadConfig(): void {
		if (!this.surveyId) return;

		this.configLoading = true;
		this.samplingService.getSurveyConfig(this.surveyId).subscribe({
			next: (config: SurveySamplingConfigDto) => {
				this.config = config;
				this.configLoading = false;
			},
			error: (error: any) => {
				console.error('Error loading config:', error);
				this.configLoading = false;
				// Config might not exist yet, that's okay
				if (error?.status !== 404) {
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load sampling configuration',
						life: 3000,
					});
				}
			},
		});
	}

	loadHierarchy(): void {
		if (!this.surveyId) return;

		this.samplingService
			.getEnumerationHierarchy(this.surveyId)
			.subscribe({
				next: (hierarchy: SamplingEnumerationHierarchyDto) => {
					this.hierarchy = hierarchy.hierarchy;
					this.updateAdminZoneOptions();
				},
				error: (error: any) => {
					console.error('Error loading hierarchy:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load location hierarchy',
						life: 3000,
					});
				},
			});
	}

	updateAdminZoneOptions(): void {
		const dzongkhagId = this.filterForm.get('dzongkhagId')?.value;
		if (!dzongkhagId) {
			this.administrativeZoneOptions = [];
			return;
		}

		const dzongkhag = this.hierarchy.find((d) => d.id === dzongkhagId);
		this.administrativeZoneOptions = dzongkhag?.administrativeZones || [];
	}

	onDzongkhagChange(): void {
		this.filterForm.patchValue({ administrativeZoneId: null });
		this.updateAdminZoneOptions();
	}

	loadEAList(event?: TableLazyLoadEvent): void {
		if (!this.surveyId) return;

		if (event) {
			this.eaPageSize = event.rows ?? this.eaPageSize;
			const first = event.first ?? 0;
			this.eaPageIndex = Math.floor(first / this.eaPageSize);
		}

		this.eaLoading = true;

		const filters = this.filterForm.value;
		const params: SurveyEAListQuery = {
			page: this.eaPageIndex + 1,
			pageSize: this.eaPageSize,
			search: filters.search?.trim() || undefined,
			status:
				filters.status && filters.status !== 'all'
					? filters.status
					: undefined,
			method:
				filters.method && filters.method !== 'all'
					? filters.method
					: undefined,
			dzongkhagId: filters.dzongkhagId || undefined,
			administrativeZoneId: filters.administrativeZoneId || undefined,
		};

		// Use sampling hierarchy to get enumeration areas with sampling status
		this.samplingService.getEnumerationHierarchy(this.surveyId).subscribe({
			next: (hierarchy: SamplingEnumerationHierarchyDto) => {
				// Convert hierarchy to flat EA list
				const allEAs: SurveySamplingEAListItemDto[] = [];

				hierarchy.hierarchy.forEach((dzongkhag) => {
					dzongkhag.administrativeZones.forEach((adminZone) => {
						adminZone.subAdministrativeZones.forEach((subZone) => {
							subZone.enumerationAreas.forEach(
								(ea: EnumerationAreaSamplingHierarchyDto) => {
									// Apply filters
									if (
										params.dzongkhagId &&
										dzongkhag.id !== params.dzongkhagId
									)
										return;
									if (
										params.administrativeZoneId &&
										adminZone.id !== params.administrativeZoneId
									)
										return;

									// Apply search filter
									if (params.search) {
										const searchLower = params.search.toLowerCase();
										if (
											!ea.name.toLowerCase().includes(searchLower) &&
											!ea.areaCode?.toLowerCase().includes(searchLower) &&
											!dzongkhag.name.toLowerCase().includes(searchLower) &&
											!adminZone.name.toLowerCase().includes(searchLower) &&
											!subZone.name.toLowerCase().includes(searchLower)
										) {
											return;
										}
									}

									// Apply status filter
									if (params.status) {
										const eaStatus = ea.hasSampling
											? 'completed'
											: 'not_run';
										if (eaStatus !== params.status) return;
									}

									// Apply method filter
									if (params.method && ea.sampling?.method !== params.method) {
										return;
									}

									// Convert to EA list item
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
										householdCount: ea.totalHouseholdCount,
										status: ea.hasSampling ? 'completed' : 'not_run',
										method: ea.sampling?.method,
										sampleSize: ea.sampling?.sampleSize,
										populationSize: ea.sampling?.populationSize,
										isFullSelection: ea.sampling?.isFullSelection,
										lastRunAt: ea.sampling?.executedAt 
											? (typeof ea.sampling.executedAt === 'string' 
												? ea.sampling.executedAt 
												: ea.sampling.executedAt.toISOString())
											: undefined,
									};

									allEAs.push(eaItem);
								}
							);
						});
					});
				});

				// Apply pagination
				const start = (this.eaPageIndex) * this.eaPageSize;
				const end = start + this.eaPageSize;
				this.eaRows = allEAs.slice(start, end);
				this.eaTotalRecords = allEAs.length;
				this.eaLoading = false;
			},
			error: (error: any) => {
				console.error('Error loading EA list:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load enumeration areas',
					life: 3000,
				});
				this.eaLoading = false;
			},
		});
	}

	viewResults(ea: SurveySamplingEAListItemDto): void {
		if (!this.surveyId || !ea.surveyEnumerationAreaId) return;

		this.selectedEA = ea;
		this.resultDialogVisible = true;
		this.resultLoading = true;
		this.currentResult = null;
		this.selectedHouseholds = [];

		this.samplingService
			.getSamplingResults(this.surveyId, ea.surveyEnumerationAreaId)
			.subscribe({
				next: (response: SamplingResultsResponseDto) => {
					this.currentResult = response.data;
					this.selectedHouseholds = response.data.selectedHouseholds || [];
					this.resultLoading = false;
				},
				error: (error: any) => {
					console.error('Error loading sampling results:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load sampling results',
						life: 3000,
					});
					this.resultLoading = false;
				},
			});
	}

	getStatusSeverity(status: SamplingStatus): string {
		switch (status) {
			case 'completed':
				return 'success';
			case 'pending':
				return 'warning';
			case 'not_run':
				return 'secondary';
			default:
				return 'secondary';
		}
	}

	getStatusLabel(status: SamplingStatus): string {
		switch (status) {
			case 'completed':
				return 'Completed';
			case 'pending':
				return 'Pending';
			case 'not_run':
				return 'Not Run';
			default:
				return 'Unknown';
		}
	}

	formatDate(date: string | Date | undefined): string {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}
}

