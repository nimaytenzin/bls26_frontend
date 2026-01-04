import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PrimeNgModules } from '../../../../primeng.modules';
import {
	Survey,
} from '../../../../core/dataservice/survey/survey.dto';
import { MessageService } from 'primeng/api';
import { SurveyDataService } from '../../../../core/dataservice/survey/survey.dataservice';
import { SupervisorEaManagementComponent } from './components/supervisor-ea-management/supervisor-ea-management.component';
import { SupervisorHouseholdListingComponent } from './components/supervisor-household-listing/supervisor-household-listing.component';
import { SupervisorEnumeratorsComponent } from './components/supervisor-enumerators/supervisor-enumerators.component';
import { SurveySamplingGlobalParametersComponent } from '../../../shared/survey-view/survey-sampling-global-parameters/survey-sampling-global-parameters.component';
import { SupervisorSurveyEnumerationAreaHouseholdListingDataService } from '../../../../core/dataservice/survey-enumeration-area-household-listing/supervisor-survey-enumeration-area-household-listing.dataservice';
import { Subject, takeUntil } from 'rxjs';
import { SupervisorSurveyDataService } from '../../../../core/dataservice/survey/supervisor-survey.dataservice';
import { DzongkhagHierarchyDto } from '../../../../core/dataservice/survey/survey-enumeration-hierarchy.dto';

@Component({
	selector: 'app-supervisor-survey-detailed-view',
	templateUrl: './supervisor-survey-detailed-view.component.html',
	styleUrls: ['./supervisor-survey-detailed-view.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		PrimeNgModules,
		SupervisorEaManagementComponent,
		SupervisorHouseholdListingComponent,
		SupervisorEnumeratorsComponent,
		SurveySamplingGlobalParametersComponent
	],
	providers: [MessageService],
})
export class SupervisorSurveyDetailedViewComponent implements OnInit, OnDestroy {
	// Main survey data
	survey: Survey | null = null;
	surveyId: number | null = null;
	loading = false;
	notFound = false;

	// Tab state - Default to Enumeration Areas (index 0)
	activeTabIndex = 0;

	// Export functionality
	dzongkhagOptions: DzongkhagHierarchyDto[] = [];
	selectedDzongkhagForExport: DzongkhagHierarchyDto | null = null;
	downloadingExport = false;

	// Subject for unsubscribing
	private destroy$ = new Subject<void>();

	constructor(
		private supervisorSurveyService: SupervisorSurveyDataService,
		private surveyService: SurveyDataService, // Keep for utility methods
		private householdService: SupervisorSurveyEnumerationAreaHouseholdListingDataService,
		private messageService: MessageService,
		private router: Router,
		private route: ActivatedRoute
	) {}

	ngOnInit(): void {
		// Get survey ID from route parameters using paramMap
		this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
			const id = params.get('surveyId');
			if (id) {
				this.surveyId = Number(id);
				if (isNaN(this.surveyId)) {
					this.notFound = true;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Invalid survey ID',
						life: 3000,
					});
					return;
				}
				this.loadSurvey();
			} else {
				this.notFound = true;
			}
		});
	}

	ngOnDestroy(): void {
		// Cleanup subscriptions
		this.destroy$.next();
		this.destroy$.complete();
	}

	loadSurvey(): void {
		if (!this.surveyId) return;

		this.loading = true;
		this.notFound = false;

		// Get survey details
		this.supervisorSurveyService.getSurveyById(this.surveyId).subscribe({
			next: (survey: Survey) => {
				if (!survey || !survey.id) {
					this.notFound = true;
					this.loading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Invalid survey data received',
						life: 3000,
					});
					return;
				}

				this.survey = survey;
				this.loading = false;
				// Load hierarchy for export options
				this.loadHierarchyForExport();
			},
			error: (error) => {
				this.loading = false;
				this.notFound = true;
				console.error('Error loading survey:', error);
				
				// Handle 404 specifically
				if (error?.status === 404) {
					this.messageService.add({
						severity: 'error',
						summary: 'Survey Not Found',
						detail: 'The survey you\'re looking for doesn\'t exist or you don\'t have access to it.',
						life: 3000,
					});
				} else {
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error?.error?.message || error?.message || 'Failed to load survey details',
						life: 3000,
					});
				}
			},
		});
	}

	// Navigation
	navigateToSurveys(): void {
		this.router.navigate(['/supervisor/survey/active']);
	}

	// Utility methods for display
	isSurveyActive(): boolean {
		return this.survey ? this.surveyService.isSurveyActive(this.survey) : false;
	}

	isSurveyEndingSoon(): boolean {
		return this.survey
			? this.surveyService.isSurveyEndingSoon(this.survey)
			: false;
	}

	getStatusColor(): string {
		if (!this.survey) return 'text-gray-600';

		if (this.isSurveyActive()) {
			return this.isSurveyEndingSoon() ? 'text-orange-600' : 'text-green-600';
		}
		return 'text-gray-600';
	}

	// Get days remaining
	getDaysRemaining(): number {
		if (!this.survey || !this.isSurveyActive()) return 0;

		const endDate = new Date(this.survey.endDate);
		const today = new Date();
		const diffTime = endDate.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return Math.max(0, diffDays);
	}

	/**
	 * Format date for display
	 */
	formatDate(date: string | Date | undefined): string {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	/**
	 * Load hierarchy for export options
	 */
	loadHierarchyForExport(): void {
		if (!this.surveyId) return;
		this.supervisorSurveyService.getSurveyEnumerationHierarchy(this.surveyId).subscribe({
			next: (response) => {
				this.dzongkhagOptions = response?.hierarchy ?? [];
			},
			error: (error) => {
				console.error('Error loading hierarchy for export:', error);
			},
		});
	}

	/**
	 * Download household count CSV for selected dzongkhag
	 */
	downloadHouseholdCountCSV(): void {
		if (!this.selectedDzongkhagForExport || !this.selectedDzongkhagForExport.id) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please select a dzongkhag to download',
			});
			return;
		}

		this.downloadingExport = true;
		this.householdService
			.exportHouseholdCountByDzongkhag(this.selectedDzongkhagForExport.id)
			.subscribe({
				next: (blob: Blob) => {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					const timestamp = new Date().toISOString().split('T')[0];
					link.download = `household_count_${this.selectedDzongkhagForExport?.name || 'dzongkhag'}_${timestamp}.csv`;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);
					this.downloadingExport = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Download Complete',
						detail: `Household count CSV for ${this.selectedDzongkhagForExport?.name || 'dzongkhag'} downloaded successfully`,
						life: 3000,
					});
				},
				error: (error) => {
					this.downloadingExport = false;
					console.error('Error downloading household count CSV:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Download Failed',
						detail: error?.error?.message || 'Failed to download household count CSV',
						life: 3000,
					});
				},
			});
	}
}
