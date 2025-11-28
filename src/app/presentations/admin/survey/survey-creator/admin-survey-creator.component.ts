import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { AdminSurveyCreatorDetailsComponent } from './admin-survey-creator-details/admin-survey-creator-details.component';
import { AdminSurveyCreatorEnumerationAreasComponent } from './admin-survey-creator-enumeration-areas/admin-survey-creator-enumeration-areas.component';
import { AdminSurveyCreatorEnumeratorsComponent } from './admin-survey-creator-enumerators/admin-survey-creator-enumerators.component';
import {
	CreateSurveyDto,
} from '../../../../core/dataservice/survey/survey.dto';
import { SurveyDataService } from '../../../../core/dataservice/survey/survey.dataservice';
import { SurveyEnumeratorDataService } from '../../../../core/dataservice/survey-enumerator/survey-enumerator.dataservice';
import {
	EnumeratorCSVData,
	BulkAssignCSVDto,
} from '../../../../core/dataservice/survey-enumerator/survey-enumerator.dto';
import { SurveyStatus } from '../../../../core/constants/enums';

interface SurveyFormData {
	name: string;
	description: string;
	year: number;
	startDate: string;
	endDate: string;
	status: SurveyStatus;
}

@Component({
	selector: 'app-admin-survey-creator',
	templateUrl: './admin-survey-creator.component.html',
	styleUrls: ['./admin-survey-creator.component.css'],
	standalone: true,
	imports: [
		CommonModule,
		PrimeNgModules,
		AdminSurveyCreatorDetailsComponent,
		AdminSurveyCreatorEnumerationAreasComponent,
		AdminSurveyCreatorEnumeratorsComponent,
	],
	providers: [MessageService],
})
export class AdminSurveyCreatorComponent implements OnInit {
	// Stepper state
	activeStep = 0;
	steps = [
		{ label: 'Survey Details', icon: 'pi pi-file' },
		{ label: 'Enumeration Areas', icon: 'pi pi-map-marker' },
		{ label: 'Enumerators', icon: 'pi pi-users' },
	];

	// Form data
	surveyData: Partial<SurveyFormData> = {};
	selectedEAIds: number[] = [];
	enumeratorData: EnumeratorCSVData[] = [];

	// Loading state
	submitting = false;
	createdSurveyId: number | null = null;

	constructor(
		private surveyService: SurveyDataService,
		private surveyEnumeratorService: SurveyEnumeratorDataService,
		private messageService: MessageService,
		private router: Router
	) {}

	ngOnInit(): void {}

	/**
	 * Move to the next step
	 */
	nextStep() {
		if (this.activeStep < this.steps.length - 1) {
			this.activeStep++;
		}
	}

	/**
	 * Move to the previous step
	 */
	previousStep() {
		if (this.activeStep > 0) {
			this.activeStep--;
		}
	}

	/**
	 * Handle completion of Step 1: Survey Details
	 */
	onDetailsCompleted(data: SurveyFormData) {
		this.surveyData = data;
		this.nextStep();
	}

	/**
	 * Handle completion of Step 2: Enumeration Areas
	 */
	onEnumerationAreasCompleted(eaIds: number[]) {
		this.selectedEAIds = eaIds;
		this.nextStep();
	}

	/**
	 * Handle completion of Step 3: Enumerators (can be skipped)
	 */
	onEnumeratorsCompleted(enumerators: EnumeratorCSVData[]) {
		this.enumeratorData = enumerators;
		this.submitSurvey();
	}

	/**
	 * Submit the survey creation
	 */
	submitSurvey() {
		if (!this.surveyData.name) {
			this.messageService.add({
				severity: 'error',
				summary: 'Validation Error',
				detail: 'Survey details are incomplete',
			});
			return;
		}

		this.submitting = true;

		const createData: CreateSurveyDto = {
			name: this.surveyData.name!,
			description: this.surveyData.description || '',
			year: this.surveyData.year!,
			startDate: this.surveyData.startDate!,
			endDate: this.surveyData.endDate!,
			status: this.surveyData.status || SurveyStatus.ACTIVE,
			enumerationAreaIds: this.selectedEAIds,
		};

		this.surveyService.createSurvey(createData).subscribe({
			next: (response: any) => {
				const surveyId = response?.id || response?.data?.id;
				this.createdSurveyId = surveyId;

				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Survey created successfully',
				});

				// If enumerator data was provided, upload them
				if (this.enumeratorData.length > 0 && surveyId) {
					this.uploadEnumerators(surveyId);
				} else {
					// Navigate to survey viewer
					this.navigateToSurveyViewer(surveyId);
				}
			},
			error: (error) => {
				console.error('Error creating survey:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: error?.error?.message || 'Failed to create survey',
				});
				this.submitting = false;
			},
		});
	}

	/**
	 * Upload enumerators via CSV data
	 */
	uploadEnumerators(surveyId: number) {
		const csvDto: BulkAssignCSVDto = {
			surveyId: surveyId,
			enumerators: this.enumeratorData,
		};

		this.surveyEnumeratorService.bulkAssignEnumeratorsCSV(csvDto).subscribe({
			next: (response) => {
				if (response.success > 0) {
					this.messageService.add({
						severity: 'success',
						summary: 'Enumerators Assigned',
						detail: `${response.success} enumerator(s) assigned successfully (${response.created} new, ${response.existing} existing)`,
						life: 5000,
					});
				}

				if (response.failed > 0) {
					this.messageService.add({
						severity: 'warn',
						summary: 'Some Assignments Failed',
						detail: `${response.failed} enumerator(s) could not be assigned`,
						life: 5000,
					});
				}

				// Navigate to survey viewer after delay
				this.navigateToSurveyViewer(surveyId);
			},
			error: (error) => {
				console.error('Error uploading enumerators:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Enumerator Upload Error',
					detail:
						error?.error?.message ||
						'Failed to upload enumerators. Survey was created successfully.',
					life: 5000,
				});

				// Still navigate to survey viewer
				this.navigateToSurveyViewer(surveyId);
			},
		});
	}

	/**
	 * Navigate to survey viewer page
	 */
	navigateToSurveyViewer(surveyId: number) {
		setTimeout(() => {
			if (surveyId) {
				this.router.navigate(['/admin/survey/viewer', surveyId]);
			} else {
				this.router.navigate(['/admin/survey']);
			}
		}, 2000);
	}

	/**
	 * Cancel and navigate back
	 */
	cancel() {
		this.router.navigate(['/admin/survey']);
	}
}
