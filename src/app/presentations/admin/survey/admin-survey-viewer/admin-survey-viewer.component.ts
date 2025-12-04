import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PrimeNgModules } from '../../../../primeng.modules';
import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import {
	Survey,
	UpdateSurveyDto,
} from '../../../../core/dataservice/survey/survey.dto';
import { EnumerationArea } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AdminMasterSurveyEditComponent } from '../shared/admin-master-survey-edit/admin-master-survey-edit.component';
import { SurveyDataService } from '../../../../core/dataservice/survey/survey.dataservice';
 import { AdminSurveySamplingComponent } from './admin-survey-sampling/admin-survey-sampling.component';
import { SurveyStatus } from '../../../../core/constants/enums';
import { SurveyOverviewComponent } from '../../../shared/survey-view/survey-overview/survey-overview.component';
import { SurveyEaManagementComponent } from '../../../shared/survey-view/survey-ea-management/survey-ea-management.component';
import { SurveyHouseholdListingsComponent } from '../../../shared/survey-view/survey-household-listings/survey-household-listings.component';
import { SurveyUsersComponent } from '../../../shared/survey-view/survey-users/survey-users.component';

@Component({
	selector: 'app-admin-survey-viewer',
	templateUrl: './admin-survey-viewer.component.html',
	styleUrls: ['./admin-survey-viewer.component.css'],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		PrimeNgModules,
		
		AdminSurveySamplingComponent,
		
		SurveyOverviewComponent,
		SurveyEaManagementComponent,
		SurveyHouseholdListingsComponent,
		SurveyUsersComponent
	],
	providers: [MessageService, ConfirmationService, DialogService],
})
export class AdminSurveyViewerComponent implements OnInit, OnDestroy {
	// Main survey data
	survey: Survey | null = null;
	surveyId: number | null = null;
	loading = false;
	notFound = false;

	// Edit functionality
	editDialogRef: DynamicDialogRef | undefined;
	submitting = false;

	// Enumeration Areas
	enumerationAreas: EnumerationArea[] = [];
	loadingEAs = false;

	// Survey Status Enum for template
	SurveyStatus = SurveyStatus;

	constructor(
		private surveyService: SurveyDataService,
		private enumerationAreaService: EnumerationAreaDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private dialogService: DialogService,
		private router: Router,
		private route: ActivatedRoute
	) {}

	ngOnInit(): void {
		// Get survey ID from route parameters
		this.route.params.subscribe((params) => {
			const id = params['id'];
			if (id) {
				this.surveyId = Number(id);
				this.loadSurvey();
			} else {
				// Check query parameters for backward compatibility
				this.route.queryParams.subscribe((queryParams) => {
					if (queryParams['surveyId']) {
						this.surveyId = Number(queryParams['surveyId']);
						this.loadSurvey();
					} else {
						this.notFound = true;
					}
				});
			}
		});
	}

	ngOnDestroy(): void {
		// Clean up any open dialogs
		if (this.editDialogRef) {
			this.editDialogRef.close();
		}
	}

	loadSurvey(): void {
		if (!this.surveyId) return;

		this.loading = true;
		this.notFound = false;

		this.surveyService.findSurveyById(this.surveyId).subscribe({
			next: (survey) => {
				this.survey = survey;
				this.loading = false;
				this.loadEnumerationAreas();
			},
			error: (error) => {
				this.loading = false;
				this.notFound = true;
				console.error('Error loading survey:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load survey details',
					life: 3000,
				});
			},
		});
	}

	loadEnumerationAreas(): void {
		if (!this.survey?.enumerationAreas?.length) {
			this.enumerationAreas = [];
			return;
		}

		this.loadingEAs = true;
		const eaIds = this.survey.enumerationAreas.map((ea) => ea.id);

		// Load detailed EA information
		this.enumerationAreaService.findAllEnumerationAreas().subscribe({
			next: (allEAs) => {
				this.enumerationAreas = allEAs.filter((ea) => eaIds.includes(ea.id));
				this.loadingEAs = false;
			},
			error: (error) => {
				this.loadingEAs = false;
				console.error('Error loading enumeration areas:', error);
			},
		});
	}

	// Edit functionality
	editSurvey(): void {
		if (!this.survey) return;

		this.editDialogRef = this.dialogService.open(
			AdminMasterSurveyEditComponent,
			{
				header: 'Edit Survey Details',
				width: '700px',
				modal: true,
				closable: true,
				data: {
					survey: this.survey,
				},
			}
		);

		this.editDialogRef.onClose.subscribe((result) => {
			if (result) {
				this.onSurveySubmit(result);
			}
		});
	}

	onSurveySubmit(editSurveyData: UpdateSurveyDto): void {
		if (!this.survey) return;

		this.submitting = true;
		this.surveyService.updateSurvey(this.survey.id, editSurveyData).subscribe({
			next: (updatedSurvey) => {
				this.survey = updatedSurvey;
				this.editDialogRef?.close();
				this.submitting = false;
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Survey updated successfully',
					life: 3000,
				});
			},
			error: (error) => {
				this.submitting = false;
				console.error('Error updating survey:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: error?.error?.message || 'Failed to update survey',
					life: 3000,
				});
			},
		});
	}

	onSurveyCancel(): void {
		this.editDialogRef?.close();
		this.submitting = false;
	}

	deleteSurvey(): void {
		if (!this.survey) return;

		this.confirmationService.confirm({
			message: `Are you sure you want to delete the survey "${this.survey.name}"?`,
			header: 'Confirm Delete',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				if (!this.survey) return;

				this.surveyService.deleteSurvey(this.survey.id).subscribe({
					next: () => {
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Survey deleted successfully',
							life: 3000,
						});
						this.navigateToMasterSurvey();
					},
					error: (error) => {
						console.error('Error deleting survey:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: error?.error?.message || 'Failed to delete survey',
							life: 3000,
						});
					},
				});
			},
		});
	}

	// Navigation
	navigateToMasterSurvey(): void {
		this.router.navigate(['/admin/survey/master']);
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

	getStatusSeverity(status: SurveyStatus): string {
		return status === SurveyStatus.ACTIVE ? 'success' : 'secondary';
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
}
