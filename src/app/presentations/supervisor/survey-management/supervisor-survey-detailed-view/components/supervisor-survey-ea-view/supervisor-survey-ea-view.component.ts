import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../../primeng.modules';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SurveyDataService } from '../../../../../../core/dataservice/survey/survey.dataservice';
import { SurveyEnumerationAreaDataService } from '../../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dataservice';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import {
	SurveyEnumerationArea,
	SubmitSurveyEnumerationAreaDto,
} from '../../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';
import { Dzongkhag } from '../../../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { AdministrativeZone } from '../../../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { SubAdministrativeZone } from '../../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { AuthService } from '../../../../../../core/dataservice/auth/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
	selector: 'app-supervisor-survey-ea-view',
	templateUrl: './supervisor-survey-ea-view.component.html',
	styleUrls: ['./supervisor-survey-ea-view.component.scss'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
})
export class SupervisorSurveyEaViewComponent implements OnInit {
	@Input() surveyId!: number;

	// Survey EAs (already assigned to this survey)
	surveyEAs: SurveyEnumerationArea[] = [];
	groupedEAs: GroupedEA[] = [];
	loadingSurveyEAs = false;

	// Household counts map: EA ID -> household count
	householdCounts: Map<number, number> = new Map();
	loadingHouseholdCounts = false;

	// Submission Dialog
	showSubmitDialog = false;
	submitting = false;
	submissionComments = '';
	currentEAForSubmission: SurveyEnumerationArea | null = null;

	// Household listings for dialog
	householdListings: any[] = [];
	loadingHouseholdListings = false;
	householdListingsStatistics: any = null;

	// Generate Blank Entries Dialog
	showGenerateBlankDialog = false;
	generatingBlank = false;
	blankCount = 20;
	blankRemarks = 'No data available - Historical survey entry';

	// Table reference for filtering
	@ViewChild('dt') tableRef: any;

	constructor(
		private surveyService: SurveyDataService,
		private surveyEAService: SurveyEnumerationAreaDataService,
		private householdService: SurveyEnumerationAreaHouseholdListingDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private authService: AuthService
	) {}

	ngOnInit() {
		if (this.surveyId) {
			this.loadSurveyEAs();
		}
	}

	/**
	 * Load survey enumeration areas
	 */
	loadSurveyEAs() {
		this.loadingSurveyEAs = true;
		this.surveyEAService
			.getBySurvey(this.surveyId)
			.subscribe({
				next: (data: any[]) => {
					// Extract survey enumeration areas from hierarchical structure
					this.surveyEAs = this.extractSurveyEAs(data);
					this.groupEAs();
					this.loadingSurveyEAs = false;
					// Load household counts for all EAs
					this.loadHouseholdCounts();
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
			this.householdService
				.getStatisticsByEnumerationArea(ea.id)
				.pipe(
					catchError((error) => {
						console.error(
							`Error loading statistics for EA ${ea.id}:`,
							error
						);
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
	getHouseholdCount(ea: SurveyEnumerationArea): number {
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
						ea.surveyEnumerationAreas?.forEach((surveyEA: any) => {
							surveyEAs.push({
								...surveyEA,
								enumerationArea: {
									...ea,
									subAdministrativeZone: {
										...saz,
										administrativeZone: {
											...az,
											dzongkhag: dz,
										},
									},
								},
							});
						});
					});
				});
			});
		});

		return surveyEAs;
	}

	/**
	 * Group EAs by location hierarchy
	 */
	groupEAs() {
		const grouped = new Map<number, GroupedEA>();

		for (const surveyEA of this.surveyEAs) {
			const ea = surveyEA.enumerationArea;
			if (!ea) continue;

			const subAdminZone = ea.subAdministrativeZone;
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
		return this.surveyEAs.length;
	}

	/**
	 * Get validated EA count
	 */
	getValidatedEACount(): number {
		return this.surveyEAs.filter((ea) => ea.isValidated).length;
	}

	/**
	 * Get submitted EA count
	 */
	getSubmittedEACount(): number {
		return this.surveyEAs.filter((ea) => ea.isSubmitted).length;
	}

	/**
	 * Get status badge severity
	 */
	getStatusSeverity(ea: SurveyEnumerationArea): string {
		if (ea.isValidated) return 'success';
		if (ea.isSubmitted) return 'warning';
		return 'secondary';
	}

	/**
	 * Get status label
	 */
	getStatusLabel(ea: SurveyEnumerationArea): string {
		if (ea.isValidated) return 'Validated';
		if (ea.isSubmitted) return 'Submitted';
		return 'Pending';
	}

	/**
	 * Check if EA can be submitted
	 */
	canSubmit(ea: SurveyEnumerationArea): boolean {
		return !ea.isSubmitted && !ea.isValidated;
	}

	/**
	 * Open submit dialog and load household listings
	 */
	openSubmitDialog(ea: SurveyEnumerationArea) {
		if (!this.canSubmit(ea)) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'This enumeration area cannot be submitted',
			});
			return;
		}
		this.currentEAForSubmission = ea;
		this.submissionComments = '';
		this.householdListings = [];
		this.householdListingsStatistics = null;
		this.showSubmitDialog = true;
		this.loadHouseholdListingsForDialog(ea.id);
	}

	/**
	 * Load household listings for the dialog
	 */
	loadHouseholdListingsForDialog(surveyEAId: number) {
		this.loadingHouseholdListings = true;
		
		// Load household listings
		this.householdService.getBySurveyEA(surveyEAId).subscribe({
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
		this.householdService.getStatisticsByEnumerationArea(surveyEAId).subscribe({
			next: (stats) => {
				this.householdListingsStatistics = stats;
			},
			error: (error) => {
				console.error('Error loading statistics:', error);
			},
		});
	}

	/**
	 * Submit enumeration area for validation
	 */
	submitEnumerationArea() {
		if (!this.currentEAForSubmission) return;

		const currentUser = this.authService.getCurrentUser();
		if (!currentUser || !currentUser.id) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Unable to get authenticated user information',
			});
			return;
		}

		this.submitting = true;

		const submitDto: SubmitSurveyEnumerationAreaDto = {
			submittedBy: currentUser.id,
			comments: this.submissionComments?.trim() || undefined,
		};

		this.surveyEAService.submit(this.currentEAForSubmission.id, submitDto).subscribe({
			next: (updatedEA) => {
				this.submitting = false;
				this.showSubmitDialog = false;
				this.submissionComments = '';
				this.currentEAForSubmission = null;

				// Update the EA in the list
				const index = this.surveyEAs.findIndex(
					(item) => item.id === updatedEA.id
				);
				if (index !== -1) {
					this.surveyEAs[index] = updatedEA;
					// Rebuild grouped data
					this.groupEAs();
				}

				this.messageService.add({
					severity: 'success',
					summary: 'Submitted',
					detail: 'Enumeration area has been submitted for validation',
					life: 3000,
				});
			},
			error: (error) => {
				this.submitting = false;
				console.error('Error submitting enumeration area:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail:
						error?.error?.message ||
						'Failed to submit enumeration area for validation',
					life: 3000,
				});
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
			.createBlankHouseholdListings(this.currentEAForSubmission.id, dto)
			.subscribe({
				next: (response) => {
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
				error: (error) => {
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
		if (ea.subAdministrativeZone?.administrativeZone?.dzongkhag?.name) {
			parts.push(ea.subAdministrativeZone.administrativeZone.dzongkhag.name);
		}
		if (ea.subAdministrativeZone?.administrativeZone?.name) {
			parts.push(ea.subAdministrativeZone.administrativeZone.name);
		}
		if (ea.subAdministrativeZone?.name) {
			parts.push(ea.subAdministrativeZone.name);
		}
		return parts.length > 0 ? parts.join(' > ') : 'N/A';
	}
}
