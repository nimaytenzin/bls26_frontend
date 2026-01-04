import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
  
import { PrimeNgModules } from '../../../../../../primeng.modules';
import { SupervisorSurveyEnumerationAreaHouseholdListingDataService } from '../../../../../../core/dataservice/survey-enumeration-area-household-listing/supervisor-survey-enumeration-area-household-listing.dataservice';
import { SupervisorSamplingDataService } from '../../../../../../core/dataservice/sampling/supervisor-sampling.dataservice';
import { SurveyEnumerationArea } from '../../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';
import { AdministrativeZone, AdministrativeZoneType } from '../../../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { SubAdministrativeZone } from '../../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { Dzongkhag } from '../../../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { DzongkhagHierarchyDto } from '../../../../../../core/dataservice/survey/survey-enumeration-hierarchy.dto';
import { SurveyEnumerationAreaHouseholdListing, CreateBlankHouseholdListingsResponseDto } from '../../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import { RunEnumerationAreaSamplingDto, SamplingExistsCheckDto, SamplingMethod, SurveySamplingConfigDto } from '../../../../../../core/dataservice/sampling/sampling.dto';
import { AuthService } from '../../../../../../core/dataservice/auth/auth.service';
import { User, UserRole } from '../../../../../../core/dataservice/auth/auth.interface';
import { SurveyListingViewerComponent } from '../../../../../shared/survey-view/survey-enumeration-result-viewer/survey-listing-viewer.component';
import { finalize } from 'rxjs/operators';
import { SupervisorSurveyEnumerationAreaDataService } from '../../../../../../core/dataservice/survey-enumeration-area/supervisor-survey-enumeration-area.dataservice';
import { SupervisorSurveyDataService } from '../../../../../../core/dataservice/survey/supervisor-survey.dataservice';
import { SupervisorDzongkhagAssignment } from '../../../../../../core/dataservice/auth/auth.interface';

interface GroupedEA {
	dzongkhag: Dzongkhag;
	administrativeZones: Array<{
		adminZone: AdministrativeZone;
		subAdministrativeZones: Array<{
			subAdminZone: SubAdministrativeZone;
			enumerationAreas: SurveyEnumerationArea[];
		}>;
	}>;
}

@Component({
	selector: 'app-supervisor-ea-management',
	templateUrl: './supervisor-ea-management.component.html',
	styleUrls: ['./supervisor-ea-management.component.scss'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService, DialogService],
})
export class SupervisorEaManagementComponent implements OnInit {
	@Input() surveyId!: number;
	@Input() hierarchy: DzongkhagHierarchyDto[] | null = null; // Optional: hierarchy data from parent

	// Authenticated user for role-based access
	authenticatedUser: User | null = null;
	UserRole = UserRole; // Expose to template

	// Survey EAs (already assigned to this survey)
	surveyEAs: SurveyEnumerationArea[] = [];
	filteredSurveyEAs: SurveyEnumerationArea[] = [];
	groupedEAs: GroupedEA[] = [];
	loadingSurveyEAs = false;

	// Filter properties
	availableDzongkhags: Dzongkhag[] = [];
	availableAdminZones: AdministrativeZone[] = [];
	availableSubAdminZones: SubAdministrativeZone[] = [];
	selectedDzongkhagId: number | null = null;
	selectedAdminZoneId: number | null = null;
	selectedSubAdminZoneId: number | null = null;
	selectedStatus: string | null = null;
	statusOptions = [
		{ label: 'All', value: null },
		{ label: 'Listing Complete', value: 'enumerated' },
		{ label: 'Sampled', value: 'sampled' },
		{ label: 'Published', value: 'published' },
	];

	// Household counts map: EA ID -> household count
	householdCounts: Map<number, number> = new Map();
	loadingHouseholdCounts = false;
	downloadingDzongkhagExport = false;
	downloadingEAExport: Map<number, boolean> = new Map(); // Track downloading state per EA

	// Submission Dialog
	showSubmitDialog = false;
	submitting = false;
	submissionComments = '';
	currentEAForSubmission: SurveyEnumerationArea | null = null;

	// Household listings for dialog
	householdListings: SurveyEnumerationAreaHouseholdListing[] = [];
	loadingHouseholdListings = false;
	householdListingsStatistics: any = null;

	// Generate Blank Entries Dialog
	showGenerateBlankDialog = false;
	generatingBlank = false;
	blankCount = 20;
	blankRemarks = 'No data available - Historical survey entry';

	// Global Sampling Configuration (loaded for use in sampling dialogs)
	samplingConfig: SurveySamplingConfigDto | null = null;
	configForm: FormGroup; // Used only for accessing default values in forms

	// Single EA Sampling Dialog
	showSamplingDialog = false;
	runForm: FormGroup;
	runningSampling = false;
	currentEAForSampling: SurveyEnumerationArea | null = null;

	// Bulk Sampling
	selectedEAIds = new Set<number>();
	bulkDialogVisible = false;
	bulkForm: FormGroup;
	bulkSubmitting = false;
	processingEAs: Set<number> = new Set();
	completedEAs: Set<number> = new Set();
	failedEAs: Map<number, string> = new Map();
	isProcessingBatch = false;

	// Results Viewing
	// Dynamic Dialog References
	householdDialogRef: DynamicDialogRef | undefined;
	resultDialogRef: DynamicDialogRef | undefined;

	// Table reference for filtering
	@ViewChild('dt') tableRef: any;

	constructor(
		private fb: FormBuilder,
		private surveyEAService: SupervisorSurveyEnumerationAreaDataService,
		private supervisorSurveyService: SupervisorSurveyDataService,
		private householdService: SupervisorSurveyEnumerationAreaHouseholdListingDataService,
		private samplingService: SupervisorSamplingDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private authService: AuthService,
		private dialogService: DialogService
	) {
		// Initialize config form (for accessing default values)
		this.configForm = this.fb.group({
			defaultMethod: ['CSS'],
			defaultSampleSize: [12],
			urbanSampleSize: [12],
			ruralSampleSize: [16],
		});

		// Initialize run form
		this.runForm = this.fb.group({
			method: ['CSS', Validators.required],
			sampleSize: [12, [Validators.required, Validators.min(1)]],
			overwriteExisting: [false],
		});

		// Initialize bulk form
		this.bulkForm = this.fb.group({
			method: ['CSS', Validators.required],
			sampleSize: [12, [Validators.required, Validators.min(1)]],
			overwriteExisting: [true],
		});
	}

	ngOnInit() {
		this.authenticatedUser = this.authService.getCurrentUser();
		if (this.surveyId) {
			// If hierarchy is provided from parent, use it directly; otherwise load from API
			if (this.hierarchy && this.hierarchy.length > 0) {
				this.processHierarchyData(this.hierarchy);
			} else {
				this.loadSurveyEAs();
			}
			this.loadSurveyConfigForSampling();
			this.loadScopedDzongkhags();
		}
	}

	/**
	 * Process hierarchy data (used when passed from parent component)
	 */
	private processHierarchyData(hierarchy: DzongkhagHierarchyDto[]) {
		this.loadingSurveyEAs = true;
		// Extract survey enumeration areas from hierarchical structure
		this.surveyEAs = this.extractSurveyEAs(hierarchy);
		this.extractFilterOptions();
		// Scope dzongkhags after extracting filter options
		this.scopeDzongkhagsBySupervisor();
		this.updateAdminZoneOptions();
		this.updateSubAdminZoneOptions();
		this.applyFilters();
		this.groupEAs();
		this.loadingSurveyEAs = false;
		// Load household counts for all EAs
		this.loadHouseholdCounts();
	}

	/**
	 * Load survey enumeration areas from API using enumeration hierarchy (fallback if hierarchy not provided)
	 */
	loadSurveyEAs() {
		this.loadingSurveyEAs = true;
		this.supervisorSurveyService.getSurveyEnumerationHierarchy(this.surveyId).subscribe({
			next: (response) => {
				// Extract hierarchy from response
				const hierarchy = response?.hierarchy || [];
				this.processHierarchyData(hierarchy);
			},
			error: (error: any) => {
				console.error('Error loading survey enumeration areas:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load enumeration areas',
					life: 3000,
				});
				this.loadingSurveyEAs = false;
			},
		});
	}

	/**
	 * Load household counts for all enumeration areas
	 */
	loadHouseholdCounts() {
		if (this.surveyEAs.length === 0) return;

		this.loadingHouseholdCounts = true;
		const statisticsRequests = this.surveyEAs.map((ea) =>
			this.householdService.getHouseholdCount(ea.id).pipe(
				catchError((error) => {
					console.error(`Error loading statistics for EA ${ea.id}:`, error);
					// Return null on error, we'll handle it in the map
					return of(null);
				})
			)
		);

		forkJoin(statisticsRequests).subscribe({
			next: (results) => {
				results.forEach((stats, index) => {
					if (stats && this.surveyEAs[index]) {
						this.householdCounts.set(
							this.surveyEAs[index].id,
							stats.totalHouseholds || 0
						);
					} else {
						// Set to 0 if stats failed to load
						if (this.surveyEAs[index]) {
							this.householdCounts.set(this.surveyEAs[index].id, 0);
						}
					}
				});
				this.loadingHouseholdCounts = false;
			},
			error: (error) => {
				console.error('Error loading household counts:', error);
				this.loadingHouseholdCounts = false;
			},
		});
	}

	/**
	 * Get household count for an enumeration area
	 */
	getHouseholdCount(ea: SurveyEnumerationArea | null): number {
		if (!ea || !ea.id) return 0;
		return this.householdCounts.get(ea.id) || 0;
	}

	/**
	 * Extract survey enumeration areas from hierarchical data
	 */
	private extractSurveyEAs(dzongkhags: any[]): SurveyEnumerationArea[] {
		const surveyEAs: SurveyEnumerationArea[] = [];

		dzongkhags.forEach((dz) => {
			dz.administrativeZones?.forEach((az: any) => {
				az.subAdministrativeZones?.forEach((saz: any) => {
					saz.enumerationAreas?.forEach((ea: any) => {
						// Case 1: surveyEnumerationAreas array present (old shape)
						if (ea.surveyEnumerationAreas && ea.surveyEnumerationAreas.length) {
							ea.surveyEnumerationAreas.forEach((surveyEA: any) => {
								surveyEAs.push(
									this.toSurveyEAFromAssociation(surveyEA, ea, saz, az, dz)
								);
							});
							return;
						}

						// Case 2: flattened shape with surveyEnumerationAreaId on EA (new shape)
						if (ea.surveyEnumerationAreaId) {
							surveyEAs.push(
								this.toSurveyEAFromFlattenedEA(ea, saz, az, dz)
							);
						}
					});
				});
			});
		});

		return surveyEAs;
	}

	/**
	 * Map legacy association object to SurveyEnumerationArea
	 */
	private toSurveyEAFromAssociation(
		surveyEA: any,
		ea: any,
		saz: any,
		az: any,
		dz: any
	): SurveyEnumerationArea {
		return {
			...surveyEA,
			enumerationAreaId: surveyEA.enumerationAreaId || ea.id,
			surveyId: surveyEA.surveyId || this.surveyId,
			enumerationArea: {
				...ea,
				subAdministrativeZones: [
					{
						...saz,
						administrativeZone: {
							...az,
							dzongkhag: dz,
						},
					},
				],
			},
		};
	}

	/**
	 * Map flattened EA (with surveyEnumerationAreaId) to SurveyEnumerationArea
	 */
	private toSurveyEAFromFlattenedEA(
		ea: any,
		saz: any,
		az: any,
		dz: any
	): SurveyEnumerationArea {
		return {
			id: ea.surveyEnumerationAreaId,
			surveyId: this.surveyId,
			enumerationAreaId: ea.id,
			isEnumerated: !!ea.isEnumerated,
			isSampled: !!ea.isSampled,
			isPublished: !!ea.isPublished,
			enumeratedBy: ea.enumeratedBy,
			enumerationDate: ea.enumerationDate,
			sampledBy: ea.sampledBy,
			sampledDate: ea.sampledDate,
			publishedBy: ea.publishedBy,
			publishedDate: ea.publishedDate,
			enumerationArea: {
				...ea,
				subAdministrativeZones: [
					{
						...saz,
						administrativeZone: {
							...az,
							dzongkhag: dz,
						},
					},
				],
			},
		};
	}

	/**
	 * Extract unique dzongkhags, admin zones and sub admin zones from survey EAs
	 */
	extractFilterOptions() {
		const dzongkhagMap = new Map<number, Dzongkhag>();
		const adminZoneMap = new Map<number, AdministrativeZone>();
		const subAdminZoneMap = new Map<number, SubAdministrativeZone>();

		for (const surveyEA of this.surveyEAs) {
			const ea = surveyEA.enumerationArea;
			if (!ea) continue;

			// Handle multiple SAZs - add all unique SAZs and their admin zones
			if (ea.subAdministrativeZones && ea.subAdministrativeZones.length > 0) {
				ea.subAdministrativeZones.forEach((subAdminZone) => {
					if (!subAdminZoneMap.has(subAdminZone.id)) {
						subAdminZoneMap.set(subAdminZone.id, subAdminZone);
					}

					const adminZone = subAdminZone?.administrativeZone;
					if (adminZone && !adminZoneMap.has(adminZone.id)) {
						adminZoneMap.set(adminZone.id, adminZone);
					}

					// Extract dzongkhag from admin zone
					const dzongkhag = adminZone?.dzongkhag;
					if (dzongkhag && !dzongkhagMap.has(dzongkhag.id)) {
						dzongkhagMap.set(dzongkhag.id, dzongkhag);
					}
				});
			}
		}

		this.availableDzongkhags = Array.from(dzongkhagMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);
		this.availableAdminZones = Array.from(adminZoneMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);
		this.availableSubAdminZones = Array.from(subAdminZoneMap.values()).sort(
			(a, b) => a.name.localeCompare(b.name)
		);
	}

	/**
	 * Load scoped dzongkhags for current supervisor
	 * This ensures only dzongkhags assigned to the current supervisor are available in filters
	 */
	loadScopedDzongkhags() {
		// This method is called from ngOnInit, but we need to scope after extractFilterOptions
		// So we'll use scopeDzongkhagsBySupervisor instead
		this.scopeDzongkhagsBySupervisor();
	}

	/**
	 * Scope dzongkhags by current supervisor's assignments
	 * This filters availableDzongkhags to only show dzongkhags assigned to the current supervisor
	 */
	private scopeDzongkhagsBySupervisor() {
		const currentUser = this.authService.getCurrentUser();
		if (!currentUser) {
			console.warn('No current user found, cannot scope dzongkhags');
			return;
		}

		this.authService.getMyDzongkhagAssignments().subscribe({
			next: (assignments: SupervisorDzongkhagAssignment[]) => {
				// Extract dzongkhag IDs from assignments
				const scopedDzongkhagIds = new Set<number>();
				const scopedDzongkhags: Dzongkhag[] = [];

				assignments.forEach((assignment: any) => {
					// Handle different response shapes
					if (assignment.dzongkhagId) {
						scopedDzongkhagIds.add(assignment.dzongkhagId);
					}
					// If assignment includes dzongkhag object (checking for typo in interface)
					if (assignment.dzonkghags && Array.isArray(assignment.dzonkghags)) {
						assignment.dzonkghags.forEach((dz: Dzongkhag) => {
							if (!scopedDzongkhagIds.has(dz.id)) {
								scopedDzongkhagIds.add(dz.id);
								scopedDzongkhags.push(dz);
							}
						});
					}
					// Also check for correct spelling
					if (assignment.dzongkhags && Array.isArray(assignment.dzongkhags)) {
						assignment.dzongkhags.forEach((dz: Dzongkhag) => {
							if (!scopedDzongkhagIds.has(dz.id)) {
								scopedDzongkhagIds.add(dz.id);
								scopedDzongkhags.push(dz);
							}
						});
					}
					// If assignment has dzongkhag object directly
					if (assignment.dzongkhag && !scopedDzongkhagIds.has(assignment.dzongkhag.id)) {
						scopedDzongkhagIds.add(assignment.dzongkhag.id);
						scopedDzongkhags.push(assignment.dzongkhag);
					}
				});

				// Filter available dzongkhags by scoped IDs
				if (scopedDzongkhagIds.size > 0) {
					this.availableDzongkhags = this.availableDzongkhags.filter((dz: Dzongkhag) =>
						scopedDzongkhagIds.has(dz.id)
					);
				}
			},
			error: (error) => {
				console.error('Error loading scoped dzongkhags:', error);
				// Fallback to using all available dzongkhags if API fails
				this.messageService.add({
					severity: 'warn',
					summary: 'Warning',
					detail: 'Could not load supervisor dzongkhag assignments. Showing all available dzongkhags.',
					life: 3000,
				});
			},
		});
	}

	/**
	 * Apply filters to survey EAs
	 */
	applyFilters() {
		let filtered = [...this.surveyEAs];

		// Filter by dzongkhag
		if (this.selectedDzongkhagId !== null) {
			filtered = filtered.filter(
				(ea) =>
					ea.enumerationArea?.subAdministrativeZones?.some(
						saz => saz.administrativeZone?.dzongkhag?.id === this.selectedDzongkhagId
					) || false
			);
		}

		// Filter by admin zone
		if (this.selectedAdminZoneId !== null) {
			filtered = filtered.filter(
				(ea) =>
					ea.enumerationArea?.subAdministrativeZones?.some(
						saz => saz.administrativeZone?.id === this.selectedAdminZoneId
					) || false
			);
		}

		// Filter by sub admin zone
		if (this.selectedSubAdminZoneId !== null) {
			filtered = filtered.filter(
				(ea) =>
					ea.enumerationArea?.subAdministrativeZones?.some(
						saz => saz.id === this.selectedSubAdminZoneId
					) || false
			);
		}

		// Filter by status
		if (this.selectedStatus !== null) {
			switch (this.selectedStatus) {
				case 'enumerated':
					filtered = filtered.filter((ea) => ea.isEnumerated === true);
					break;
				case 'sampled':
					filtered = filtered.filter(
						(ea) => ea.isSampled === true && ea.isPublished !== true
					);
					break;
				case 'published':
					filtered = filtered.filter((ea) => ea.isPublished === true);
					break;
			}
		}

		this.filteredSurveyEAs = filtered;
	}

	/**
	 * Handle dzongkhag filter change
	 */
	onDzongkhagFilterChange() {
		// Reset admin zone and sub admin zone filters when dzongkhag changes
		this.selectedAdminZoneId = null;
		this.selectedSubAdminZoneId = null;
		this.updateAdminZoneOptions();
		this.updateSubAdminZoneOptions();
		this.applyFilters();
	}

	/**
	 * Handle admin zone filter change
	 */
	onAdminZoneFilterChange() {
		// Reset sub admin zone filter when admin zone changes
		this.selectedSubAdminZoneId = null;
		this.updateSubAdminZoneOptions();
		this.applyFilters();
	}

	/**
	 * Handle sub admin zone filter change
	 */
	onSubAdminZoneFilterChange() {
		this.applyFilters();
	}

	/**
	 * Handle status filter change
	 */
	onStatusFilterChange() {
		this.applyFilters();
	}

	/**
	 * Update admin zone options based on selected dzongkhag
	 */
	updateAdminZoneOptions() {
		let filteredEAs = [...this.surveyEAs];

		// Filter by dzongkhag if selected
		if (this.selectedDzongkhagId !== null) {
			filteredEAs = filteredEAs.filter(
				(ea) =>
					ea.enumerationArea?.subAdministrativeZones?.some(
						saz => saz.administrativeZone?.dzongkhag?.id === this.selectedDzongkhagId
					) || false
			);
		}

		const adminZoneMap = new Map<number, AdministrativeZone>();
		for (const surveyEA of filteredEAs) {
			const ea = surveyEA.enumerationArea;
			if (ea?.subAdministrativeZones && ea.subAdministrativeZones.length > 0) {
				ea.subAdministrativeZones.forEach((subAdminZone) => {
					const adminZone = subAdminZone?.administrativeZone;
					if (adminZone && !adminZoneMap.has(adminZone.id)) {
						adminZoneMap.set(adminZone.id, adminZone);
					}
				});
			}
		}
		this.availableAdminZones = Array.from(adminZoneMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);
	}

	/**
	 * Update sub admin zone options based on selected admin zone and dzongkhag
	 */
	updateSubAdminZoneOptions() {
		let filteredEAs = [...this.surveyEAs];

		// Filter by dzongkhag if selected
		if (this.selectedDzongkhagId !== null) {
			filteredEAs = filteredEAs.filter(
				(ea) =>
					ea.enumerationArea?.subAdministrativeZones?.some(
						saz => saz.administrativeZone?.dzongkhag?.id === this.selectedDzongkhagId
					) || false
			);
		}

		const subAdminZoneMap = new Map<number, SubAdministrativeZone>();
		for (const surveyEA of filteredEAs) {
			const ea = surveyEA.enumerationArea;
			if (ea?.subAdministrativeZones && ea.subAdministrativeZones.length > 0) {
				ea.subAdministrativeZones.forEach((subAdminZone) => {
					// If admin zone is selected, only show sub admin zones for that admin zone
					if (this.selectedAdminZoneId !== null) {
						if (
							subAdminZone.administrativeZone?.id === this.selectedAdminZoneId &&
							!subAdminZoneMap.has(subAdminZone.id)
						) {
							subAdminZoneMap.set(subAdminZone.id, subAdminZone);
						}
					} else {
						// Show all sub admin zones (filtered by dzongkhag if selected)
						if (!subAdminZoneMap.has(subAdminZone.id)) {
							subAdminZoneMap.set(subAdminZone.id, subAdminZone);
						}
					}
				});
			}
		}
		this.availableSubAdminZones = Array.from(subAdminZoneMap.values()).sort(
			(a, b) => a.name.localeCompare(b.name)
		);
	}

	/**
	 * Clear all filters
	 */
	clearFilters() {
		this.selectedDzongkhagId = null;
		this.selectedAdminZoneId = null;
		this.selectedSubAdminZoneId = null;
		this.selectedStatus = null;
		this.updateAdminZoneOptions();
		this.updateSubAdminZoneOptions();
		this.applyFilters();
	}

	/**
	 * Group EAs by location hierarchy
	 */
	groupEAs() {
		const grouped = new Map<number, GroupedEA>();

		for (const surveyEA of this.filteredSurveyEAs) {
			const ea = surveyEA.enumerationArea;
			if (!ea) continue;

			// Use first SAZ if multiple exist
			const subAdminZone = ea.subAdministrativeZones && ea.subAdministrativeZones.length > 0
				? ea.subAdministrativeZones[0]
				: null;
			if (!subAdminZone) continue;

			const adminZone = subAdminZone.administrativeZone;
			if (!adminZone) continue;

			const dzongkhag = adminZone.dzongkhag;
			if (!dzongkhag) continue;

			// Get or create dzongkhag group
			let dzGroup = grouped.get(dzongkhag.id);
			if (!dzGroup) {
				dzGroup = {
					dzongkhag,
					administrativeZones: [],
				};
				grouped.set(dzongkhag.id, dzGroup);
			}

			// Get or create admin zone group
			let azGroup = dzGroup.administrativeZones.find(
				(g) => g.adminZone.id === adminZone.id
			);
			if (!azGroup) {
				azGroup = {
					adminZone,
					subAdministrativeZones: [],
				};
				dzGroup.administrativeZones.push(azGroup);
			}

			// Get or create sub-admin zone group
			let sazGroup = azGroup.subAdministrativeZones.find(
				(g) => g.subAdminZone.id === subAdminZone.id
			);
			if (!sazGroup) {
				sazGroup = {
					subAdminZone,
					enumerationAreas: [],
				};
				azGroup.subAdministrativeZones.push(sazGroup);
			}

			// Add EA to group
			sazGroup.enumerationAreas.push(surveyEA);
		}

		this.groupedEAs = Array.from(grouped.values());
	}

	/**
	 * Get total EA count
	 */
	getTotalEACount(): number {
		return this.filteredSurveyEAs.length;
	}

	/**
	 * Get enumerated EA count
	 */
	getEnumeratedCount(): number {
		return this.filteredSurveyEAs.filter((ea) => ea.isEnumerated === true)
			.length;
	}

	/**
	 * Get sampled EA count (sampled but not published)
	 */
	getSampledCount(): number {
		return this.filteredSurveyEAs.filter(
			(ea) => ea.isSampled === true && ea.isPublished !== true
		).length;
	}

	/**
	 * Get published EA count
	 */
	getPublishedCount(): number {
		return this.filteredSurveyEAs.filter((ea) => ea.isPublished === true)
			.length;
	}

	/**
	 * Get pending EA count (not enumerated yet)
	 */
	getPendingCount(): number {
		return this.filteredSurveyEAs.filter((ea) => !ea.isEnumerated).length;
	}

	/**
	 * Download household count CSV for selected dzongkhag
	 */
	downloadDzongkhagHouseholdCount(): void {
		if (!this.selectedDzongkhagId) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please select a dzongkhag first',
			});
			return;
		}

		this.downloadingDzongkhagExport = true;
		this.householdService
			.exportHouseholdCountByDzongkhag(this.selectedDzongkhagId)
			.subscribe({
				next: (blob: Blob) => {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					const selectedDzongkhag = this.availableDzongkhags.find(d => d.id === this.selectedDzongkhagId);
					const timestamp = new Date().toISOString().split('T')[0];
					link.download = `household_count_${selectedDzongkhag?.name || 'dzongkhag'}_${timestamp}.csv`;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);
					this.downloadingDzongkhagExport = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Household count CSV downloaded successfully',
						life: 3000,
					});
				},
				error: (error) => {
					this.downloadingDzongkhagExport = false;
					console.error('Error downloading dzongkhag household count:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error?.error?.message || 'Failed to download household count CSV',
						life: 3000,
					});
				},
			});
	}

	/**
	 * Load household listings for the dialog
	 */
	loadHouseholdListingsForDialog(surveyEAId: number) {
		this.loadingHouseholdListings = true;

		// Load household listings
		this.householdService.getHouseholdsByEA(surveyEAId).subscribe({
			next: (listings: any[]) => {
				this.householdListings = listings;
				this.loadingHouseholdListings = false;
			},
			error: (error) => {
				console.error('Error loading household listings:', error);
				this.loadingHouseholdListings = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load household listings',
					life: 3000,
				});
			},
		});

		// Load statistics
		this.householdService.getHouseholdCount(surveyEAId).subscribe({
			next: (stats) => {
				this.householdListingsStatistics = stats;
			},
			error: (error) => {
				console.error('Error loading statistics:', error);
			},
		});
	}

	/**
	 * Close submit dialog
	 */
	closeSubmitDialog() {
		this.showSubmitDialog = false;
		this.submissionComments = '';
		this.currentEAForSubmission = null;
		this.householdListings = [];
		this.householdListingsStatistics = null;
	}

	/**
	 * Open generate blank entries dialog
	 */
	openGenerateBlankDialog() {
		if (!this.currentEAForSubmission) return;
		this.blankCount = 20;
		this.blankRemarks = 'No data available - Historical survey entry';
		this.showGenerateBlankDialog = true;
	}

	/**
	 * Close generate blank entries dialog
	 */
	closeGenerateBlankDialog() {
		this.showGenerateBlankDialog = false;
		this.blankCount = 20;
		this.blankRemarks = 'No data available - Historical survey entry';
	}

	/**
	 * Generate blank household listings
	 */
	generateBlankHouseholdListings() {
		if (!this.currentEAForSubmission) return;

		if (this.blankCount < 1 || this.blankCount > 10000) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Invalid Count',
				detail: 'Count must be between 1 and 10000',
				life: 3000,
			});
			return;
		}

		this.generatingBlank = true;

		const dto = {
			count: this.blankCount,
			remarks: this.blankRemarks?.trim() || undefined,
		};

		this.householdService
			.createBlankHouseholds(this.currentEAForSubmission.id, dto)
			.subscribe({
				next: (response: CreateBlankHouseholdListingsResponseDto) => {
					this.generatingBlank = false;
					this.showGenerateBlankDialog = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: `Successfully created ${response.created} blank household listing entries`,
						life: 3000,
					});
					// Reload household listings and statistics
					if (this.currentEAForSubmission) {
						this.loadHouseholdListingsForDialog(this.currentEAForSubmission.id);
					}
				},
				error: (error: any) => {
					this.generatingBlank = false;
					console.error('Error generating blank household listings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail:
							error?.error?.message ||
							'Failed to generate blank household listings',
						life: 3000,
					});
				},
			});
	}

	/**
	 * Handle table search
	 */
	onTableSearch(event: any) {
		if (this.tableRef) {
			this.tableRef.filterGlobal(event.target.value, 'contains');
		}
	}

	/**
	 * Get location hierarchy display text
	 */
	getLocationHierarchy(ea: any): string {
		if (!ea) return 'N/A';
		const parts: string[] = [];
		// Use first SAZ if multiple exist
		const firstSaz = ea.subAdministrativeZones && ea.subAdministrativeZones.length > 0
			? ea.subAdministrativeZones[0]
			: null;
		if (firstSaz?.administrativeZone?.dzongkhag?.name) {
			parts.push(firstSaz.administrativeZone.dzongkhag.name);
		}
		if (firstSaz?.administrativeZone?.name) {
			parts.push(firstSaz.administrativeZone.name);
		}
		if (firstSaz?.name) {
			parts.push(firstSaz.name);
		}
		return parts.length > 0 ? parts.join(' > ') : 'N/A';
	}

	/**
	 * Get Dzongkhag name from enumeration area
	 */
	getDzongkhag(ea: any): string {
		if (!ea?.subAdministrativeZones?.length) return 'N/A';
		return ea.subAdministrativeZones[0]?.administrativeZone?.dzongkhag?.name || 'N/A';
	}

	/**
	 * Get Gewog/Thromde name from enumeration area
	 */
	getGewog(ea: any): string {
		if (!ea?.subAdministrativeZones?.length) return 'N/A';
		return ea.subAdministrativeZones[0]?.administrativeZone?.name || 'N/A';
	}

	/**
	 * Get Chiwog/Lap name from enumeration area
	 */
	getChiwog(ea: any): string {
		if (!ea?.subAdministrativeZones?.length) return 'N/A';
		return ea.subAdministrativeZones[0]?.name || 'N/A';
	}

	/**
	 * Get Dzongkhag code from enumeration area
	 */
	getDzongkhagCode(ea: any): string {
		if (!ea?.subAdministrativeZones?.length) return 'N/A';
		return ea.subAdministrativeZones[0]?.administrativeZone?.dzongkhag?.areaCode || 'N/A';
	}

	/**
	 * Get Gewog/Thromde code from enumeration area
	 */
	getGewogCode(ea: any): string {
		if (!ea?.subAdministrativeZones?.length) return 'N/A';
		return ea.subAdministrativeZones[0]?.administrativeZone?.areaCode || 'N/A';
	}

	/**
	 * Get Chiwog/Lap code from enumeration area
	 */
	getChiwogCode(ea: any): string {
		if (!ea?.subAdministrativeZones?.length) return 'N/A';
		return ea.subAdministrativeZones[0]?.areaCode || 'N/A';
	}

	// ==================== Config Loading for Sampling ====================

	/**
	 * Load survey sampling configuration (for use in sampling dialogs)
	 * Returns Observable for chaining
	 */
	loadSurveyConfigForSampling(): Observable<SurveySamplingConfigDto | null> {
		if (!this.surveyId) {
			this.samplingConfig = null;
			return of(null);
		}

		return this.samplingService.getSurveyConfig(this.surveyId).pipe(
			tap((config) => {
				if (!config) {
					// No config exists - use defaults
					this.samplingConfig = null;
					return;
				}
				this.samplingConfig = config;
				// Update configForm with loaded values for use in forms
				this.configForm.patchValue(
					{
						defaultMethod: config.defaultMethod,
						defaultSampleSize: config.defaultSampleSize ?? 12,
						urbanSampleSize:
							config.urbanSampleSize ?? config.defaultSampleSize ?? 12,
						ruralSampleSize:
							config.ruralSampleSize ?? config.defaultSampleSize ?? 16,
					},
					{ emitEvent: false }
				);
			}),
			catchError((error) => {
				if (error?.status === 404) {
					// No config exists - this is normal, use defaults
					this.samplingConfig = null;
					return of(null);
				}
				console.error('Error loading sampling config:', error);
				// Don't show error message - config is optional
				return of(null);
			})
		);
	}

	// ==================== Single EA Sampling ====================

	/**
	 * Open sampling dialog for single EA
	 */
	openSamplingDialog(ea: SurveyEnumerationArea) {
		if (!this.canSelectEA(ea)) {
			return;
		}

		this.currentEAForSampling = ea;
		
		// Fetch latest sampling config before opening dialog
		this.loadSurveyConfigForSampling().subscribe({
			next: (config) => {
				const recommendedSize = this.getRecommendedSampleSize(ea);
				// Use config values if available, otherwise use form defaults
				const defaultMethod = config?.defaultMethod ?? this.configForm.value.defaultMethod ?? 'CSS';
				const defaultSampleSize = config?.defaultSampleSize ?? this.configForm.value.defaultSampleSize ?? 12;
				
				this.runForm.reset({
					method: defaultMethod,
					sampleSize: recommendedSize ?? defaultSampleSize,
					overwriteExisting: false,
				});
				this.showSamplingDialog = true;
			}
		});
	}

	/**
	 * Close sampling dialog
	 */
	closeSamplingDialog() {
		this.showSamplingDialog = false;
		this.currentEAForSampling = null;
		this.runningSampling = false;
	}

	/**
	 * Run sampling for single enumeration area
	 */
	runSampling(): void {
		if (!this.surveyId || !this.currentEAForSampling) {
			return;
		}

		if (this.runForm.invalid) {
			this.runForm.markAllAsTouched();
			return;
		}

		// First, check if sampling already exists using getSamplingResults
		this.runningSampling = true;
		this.samplingService
			.getSamplingResults(this.surveyId, this.currentEAForSampling.id)
			.subscribe({
				next: (results) => {
					if (results.success && results.data?.sampling) {
						// Sampling exists - show confirmation dialog
						this.runningSampling = false;
						const sampling = results.data.sampling;
						this.showOverwriteConfirmation({
							method: sampling.method,
							sampleSize: sampling.sampleSize,
							populationSize: sampling.populationSize,
							executedAt: sampling.executedAt,
						} as any);
					} else {
						// No existing sampling - proceed directly
						this.executeSampling(false);
					}
				},
				error: (error) => {
					// If check fails (404 or other), proceed anyway (might be a new EA)
					if (error?.status === 404) {
						// No sampling exists - proceed
						this.executeSampling(false);
					} else {
						console.warn(
							'Error checking sampling existence, proceeding anyway:',
							error
						);
						this.executeSampling(false);
					}
				},
			});
	}

	/**
	 * Show confirmation dialog when sampling already exists
	 */
	private showOverwriteConfirmation(
		existingSampling: SamplingExistsCheckDto['data']
	): void {
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
		if (!this.surveyId || !this.currentEAForSampling) {
			return;
		}

		const payload = {
			method: this.runForm.value.method,
			sampleSize: this.runForm.value.sampleSize,
			overwriteExisting: overwriteExisting,
		};

		this.runningSampling = true;
		this.samplingService
			.runSampling(this.surveyId, this.currentEAForSampling.id, payload)
			.subscribe({
				next: () => {
					this.runningSampling = false;
					this.showSamplingDialog = false;
					this.currentEAForSampling = null;
					this.loadSurveyEAs();
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

	// ==================== Bulk Sampling ====================

	/**
	 * Check if EA can be selected (must be enumerated)
	 */
	canSelectEA(ea: SurveyEnumerationArea): boolean {
		return ea.isEnumerated === true;
	}

	/**
	 * Check if EA is selected
	 */
	isEASelected(ea: SurveyEnumerationArea): boolean {
		return this.selectedEAIds.has(ea.id);
	}

	/**
	 * Toggle EA selection
	 */
	toggleEASelection(ea: SurveyEnumerationArea, checked: boolean): void {
		if (!this.canSelectEA(ea)) {
			return;
		}
		if (checked) {
			this.selectedEAIds.add(ea.id);
		} else {
			this.selectedEAIds.delete(ea.id);
		}
	}

	/**
	 * Get selected enumerated EAs
	 */
	getSelectedEnumeratedEAs(): SurveyEnumerationArea[] {
		return this.filteredSurveyEAs.filter(
			(ea) => this.selectedEAIds.has(ea.id) && this.canSelectEA(ea)
		);
	}

	/**
	 * Clear selection
	 */
	clearSelection(): void {
		this.selectedEAIds.clear();
	}

	/**
	 * Open bulk sampling dialog
	 */
	openBulkDialog(): void {
		const selectedEAs = this.getSelectedEnumeratedEAs();
		if (selectedEAs.length === 0) {
			this.messageService.add({
				severity: 'info',
				summary: 'Select enumeration areas',
				detail:
					'Choose at least one enumerated enumeration area to run bulk sampling',
			});
			return;
		}

		// Fetch latest sampling config before opening dialog
		this.loadSurveyConfigForSampling().subscribe({
			next: (config) => {
				// Use config values if available, otherwise use form defaults
				const defaultMethod = config?.defaultMethod ?? this.configForm.value.defaultMethod ?? 'CSS';
				const defaultSampleSize = config?.defaultSampleSize ?? this.configForm.value.defaultSampleSize ?? 12;
				
				this.bulkForm.reset({
					method: defaultMethod,
					sampleSize: defaultSampleSize,
					overwriteExisting: true,
				});
				this.bulkDialogVisible = true;
			}
		});
	}

	/**
	 * Run bulk sampling for selected EAs
	 */
	runBulkSampling(): void {
		if (!this.surveyId) {
			return;
		}

		if (this.bulkForm.invalid) {
			this.bulkForm.markAllAsTouched();
			return;
		}

		const selectedEAs = this.getSelectedEnumeratedEAs();
		if (selectedEAs.length === 0) {
			this.messageService.add({
				severity: 'info',
				summary: 'Select enumeration areas',
				detail:
					'Choose at least one enumerated enumeration area to run bulk sampling',
			});
			return;
		}

		// Close dialog and process sequentially
		this.bulkDialogVisible = false;
		this.bulkSubmitting = true;

		// Process selected EAs sequentially
		this.processSelectedEAsSequentially(
			this.bulkForm.value.method,
			this.bulkForm.value.sampleSize
		);
	}

	/**
	 * Process selected enumeration areas sequentially (one at a time)
	 */
	async processSelectedEAsSequentially(
		method?: SamplingMethod,
		sampleSize?: number
	): Promise<void> {
		if (!this.surveyId) {
			return;
		}

		const selectedEAs = this.getSelectedEnumeratedEAs();
		if (selectedEAs.length === 0) {
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

		const totalEAs = selectedEAs.length;

		for (let i = 0; i < selectedEAs.length; i++) {
			const ea = selectedEAs[i];
			this.processingEAs.add(ea.id);

			// Show progress message
			this.messageService.add({
				severity: 'info',
				summary: 'Processing',
				detail: `Processing EA ${i + 1} of ${totalEAs}: ${
					ea.enumerationArea?.name || 'N/A'
				}`,
				life: 3000,
			});

			try {
				await this.processSingleEA(ea, method, sampleSize);
				this.completedEAs.add(ea.id);
			} catch (error: any) {
				const errorMessage = error?.error?.message || 'Unknown error';
				this.failedEAs.set(ea.id, errorMessage);
				console.error(`Error processing EA ${ea.id}:`, error);
			} finally {
				this.processingEAs.delete(ea.id);
			}
		}

		this.isProcessingBatch = false;
		this.bulkSubmitting = false;
		this.selectedEAIds.clear();
		this.loadSurveyEAs();

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
		ea: SurveyEnumerationArea,
		method?: SamplingMethod,
		sampleSize?: number
	): Promise<void> {
		return new Promise((resolve, reject) => {
			// Step 1: Check if sampling exists using getSamplingResults
			this.samplingService
				.getSamplingResults(this.surveyId!, ea.id)
				.subscribe({
					next: (results) => {
						if (results.success && results.data?.sampling) {
							// Step 2: Show confirmation dialog
							const sampling = results.data.sampling;
							this.confirmationService.confirm({
								message: `Sampling already exists for ${
									ea.enumerationArea?.name || 'this EA'
								}.
									<br/><br/>
									<strong>Existing Sampling Details:</strong><br/>
									Method: ${sampling.method}<br/>
									Sample Size: ${sampling.sampleSize}<br/>
									Population Size: ${sampling.populationSize}<br/>
									Executed At: ${new Date(sampling.executedAt).toLocaleString()}<br/><br/>
									Do you want to overwrite? This will delete all existing household samples and create new ones.`,
								header: 'Sampling Already Exists',
								icon: 'pi pi-exclamation-triangle',
								acceptButtonStyleClass: 'p-button-danger',
								acceptLabel: 'Yes, Overwrite',
								rejectLabel: 'Skip',
								accept: () => {
									// User confirmed - proceed with overwrite
									this.executeSamplingForEA(ea, method, sampleSize, true)
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
							this.executeSamplingForEA(ea, method, sampleSize, false)
								.then(resolve)
								.catch(reject);
						}
					},
					error: (error: any) => {
						// If 404, no sampling exists - proceed
						if (error?.status === 404) {
							this.executeSamplingForEA(ea, method, sampleSize, false)
								.then(resolve)
								.catch(reject);
						} else {
							reject(error);
						}
					},
				});
		});
	}

	/**
	 * Execute sampling for a single EA
	 */
	private executeSamplingForEA(
		ea: SurveyEnumerationArea,
		method?: SamplingMethod,
		sampleSize?: number,
		overwriteExisting: boolean = false
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const payload = {
				method: method || this.configForm.value.defaultMethod || 'CSS',
				sampleSize:
					sampleSize ||
					this.getRecommendedSampleSize(ea) ||
					this.configForm.value.defaultSampleSize ||
					12,
				overwriteExisting: overwriteExisting,
			};

			this.samplingService
				.runSampling(this.surveyId!, ea.id, payload)
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

	/**
	 * Get recommended sample size based on urban/rural
	 */
	getRecommendedSampleSize(ea: SurveyEnumerationArea): number | undefined {
		const adminZone =
			ea.enumerationArea?.subAdministrativeZones && ea.enumerationArea.subAdministrativeZones.length > 0
				? ea.enumerationArea.subAdministrativeZones[0].administrativeZone
				: null;
		const isUrban = adminZone?.type === AdministrativeZoneType.Thromde;
		if (isUrban) {
			return (
				this.configForm.value.urbanSampleSize ||
				this.configForm.value.defaultSampleSize
			);
		}
		return (
			this.configForm.value.ruralSampleSize ||
			this.configForm.value.defaultSampleSize
		);
	}

	/**
	 * Check if EA is currently being processed
	 */
	isEAProcessing(ea: SurveyEnumerationArea): boolean {
		return this.processingEAs.has(ea.id);
	}

	/**
	 * Check if EA has been completed in current batch
	 */
	isEACompleted(ea: SurveyEnumerationArea): boolean {
		return this.completedEAs.has(ea.id);
	}

	/**
	 * Check if EA failed in current batch
	 */
	isEAFailed(ea: SurveyEnumerationArea): boolean {
		return this.failedEAs.has(ea.id);
	}

	/**
	 * Get error message for failed EA
	 */
	getEAErrorMessage(ea: SurveyEnumerationArea): string | null {
		return this.failedEAs.get(ea.id) || null;
	}

	// ==================== Results Viewing ====================

	/**
	 * Open results dialog using dynamic dialog service
	 */
	openResultDialog(ea: SurveyEnumerationArea): void {
		if (!this.surveyId) {
			return;
		}

		this.resultDialogRef = this.dialogService.open(
			SurveyListingViewerComponent,
			{
				header: 'Household Listings',
				width: '90vw',
				style: { 'max-width': '1200px' },
				modal: true,
				closable: true,
				data: {
					surveyId: this.surveyId,
					enumerationArea: ea,
				},
			}
		);

		// Handle dialog close
		this.resultDialogRef.onClose.subscribe(() => {
			this.resultDialogRef = undefined;
		});
	}

	/**
	 * Open sampled households dialog
	 */
	openSampledHouseholdsDialog(ea: SurveyEnumerationArea): void {
		if (!this.surveyId) {
			return;
		}

		this.resultDialogRef = this.dialogService.open(
			SurveyListingViewerComponent,
			{
				header: 'Sampled Households',
				width: '90vw',
				style: { 'max-width': '1200px' },
				modal: true,
				closable: true,
				data: {
					surveyId: this.surveyId,
					enumerationArea: ea,
					showSampledOnly: true,
				},
			}
		);

		// Handle dialog close
		this.resultDialogRef.onClose.subscribe(() => {
			this.resultDialogRef = undefined;
		});
	}

	/**
	 * Download household listing CSV for enumeration area
	 */
	downloadHouseholdListingCSV(ea: SurveyEnumerationArea): void {
		if (!ea || !ea.id) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Invalid enumeration area',
			});
			return;
		}

		this.downloadingEAExport.set(ea.id, true);
		this.householdService
			.exportHouseholdListingCSVByEA(ea.id)
			.subscribe({
				next: (blob: Blob) => {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
					const eaName = ea.enumerationArea?.name || `EA_${ea.id}`;
					link.download = `household_listing_ea_${ea.id}_${timestamp}.csv`;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);
					this.downloadingEAExport.set(ea.id, false);
					this.messageService.add({
						severity: 'success',
						summary: 'Download Complete',
						detail: `Household listing CSV for ${eaName} downloaded successfully`,
						life: 3000,
					});
				},
				error: (error) => {
					this.downloadingEAExport.set(ea.id, false);
					console.error('Error downloading household listing CSV:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Download Failed',
						detail: error?.error?.message || 'Failed to download household listing CSV',
						life: 3000,
					});
				},
			});
	}

	/**
	 * Check if EA is downloading
	 */
	isDownloadingEA(ea: SurveyEnumerationArea): boolean {
		return this.downloadingEAExport.get(ea.id) || false;
	}

	/**
	 * Check if EA is enumerated (can view households)
	 */
	canViewHouseholds(ea: SurveyEnumerationArea): boolean {
		return ea.isEnumerated === true;
	}

	/**
	 * Check if EA is ready for sampling (enumerated but not sampled and not published)
	 */
	isReadyForSampling(ea: SurveyEnumerationArea): boolean {
		return ea.isEnumerated === true && !ea.isSampled && !ea.isPublished;
	}

	/**
	 * Check if EA has been sampled (show view results option)
	 */
	isSampled(ea: SurveyEnumerationArea): boolean {
		return ea.isSampled === true;
	}
}

