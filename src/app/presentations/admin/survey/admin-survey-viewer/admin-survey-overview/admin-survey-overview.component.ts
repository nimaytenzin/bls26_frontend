import {
	Component,
	OnInit,
	Input,
	Output,
	OnChanges,
	SimpleChanges,
	EventEmitter,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';

import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Router } from '@angular/router';
import { Survey, SurveyStatisticsResponseDto, UpdateSurveyDto } from '../../../../../core/dataservice/survey/survey.dto';
import { SurveyDataService } from '../../../../../core/dataservice/survey/survey.dataservice';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { SurveySamplingGlobalParametersComponent } from '../../../../shared/survey-view/survey-sampling-global-parameters/survey-sampling-global-parameters.component';
import { AdminMasterSurveyEditComponent } from '../../shared/admin-master-survey-edit/admin-master-survey-edit.component';

@Component({
	selector: 'app-admin-survey-overview',
	standalone: true,
	imports: [CommonModule, PrimeNgModules, SurveySamplingGlobalParametersComponent],
	providers: [MessageService, DialogService, ConfirmationService],
	templateUrl: './admin-survey-overview.component.html',
	styleUrls: ['./admin-survey-overview.component.scss'],
})
export class AdminSurveyOverviewComponent
	implements OnInit, OnChanges
{
	@Input() surveyId: number | null = null;
	@Input({
		required: true,
	})
	survey!: Survey;

	@Output() surveyUpdated = new EventEmitter<Survey>();
	@Output() surveyDeleted = new EventEmitter<number>();

	statistics: SurveyStatisticsResponseDto | null = null;
	loadingStatistics = false;
	editDialogRef: DynamicDialogRef | undefined;
	submitting = false;
	downloadingCSV = false;

	constructor(
		private surveyService: SurveyDataService,
		private messageService: MessageService,
		private dialogService: DialogService,
		private confirmationService: ConfirmationService,
		private router: Router,
		private location: Location
	) {}

	ngOnInit() {
		if (this.surveyId) {
			this.loadSurveyStatistics();
		}
 	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['surveyId'] && !changes['surveyId'].firstChange) {
			if (this.surveyId) {
				this.loadSurveyStatistics();
			}
		}
	}

	loadSurveyStatistics(): void {
		if (!this.surveyId) return;

		this.loadingStatistics = true;

		this.surveyService.getSurveyStatistics(this.surveyId).subscribe({
			next: (stats) => {
				this.statistics = stats;
				this.loadingStatistics = false;
			},
			error: (error) => {
				this.loadingStatistics = false;
				console.error('Error loading survey statistics:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load survey statistics',
					life: 3000,
				});
			},
		});
	}

	back(): void {
		this.location.back();
	}

	getSurveyDuration(): number {
		return this.survey ? this.surveyService.getSurveyDuration(this.survey) : 0;
	}

	/**
	 * Convert string percentage to number
	 */
	getPercentageNumber(value: string): number {
		return parseFloat(value) || 0;
	}

	/**
	 * Get total enumeration areas for percentage calculations
	 */
	getTotalEnumerationAreas(): number {
		if (!this.statistics) return 0;
		return this.statistics.totalEnumerationAreas || 0;
	}

	/**
	 * Get published count
	 */
	getPublishedCount(): number {
		if (!this.statistics) return 0;
		return this.statistics.publishedEnumerationAreas || 0;
	}

	/**
	 * Get sampled but not published count
	 */
	getSampledNotPublishedCount(): number {
		if (!this.statistics) return 0;
		const sampled = this.statistics.sampledEnumerationAreas || 0;
		const published = this.statistics.publishedEnumerationAreas || 0;
		return Math.max(0, sampled - published);
	}

	/**
	 * Get listing complete but not sampled count
	 */
	getEnumeratedNotSampledCount(): number {
		if (!this.statistics) return 0;
		const enumerated = this.statistics.enumeratedEnumerationAreas || 0;
		const sampled = this.statistics.sampledEnumerationAreas || 0;
		return Math.max(0, enumerated - sampled);
	}

	/**
	 * Get pending count
	 */
	getPendingCount(): number {
		if (!this.statistics) return 0;
		return this.statistics.pendingEnumerationAreas || 0;
	}

	/**
	 * Get segment width percentage
	 */
	getSegmentWidthPercentage(count: number): number {
		const total = this.getTotalEnumerationAreas();
		if (total === 0) return 0;
		return (count / total) * 100;
	}

	/**
	 * Check if segment should be displayed (count > 0)
	 */
	shouldShowSegment(count: number): boolean {
		return count > 0;
	}

	/**
	 * Edit survey functionality
	 */
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

	/**
	 * Handle survey update submission
	 */
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
				// Emit event to parent component
				this.surveyUpdated.emit(updatedSurvey);
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

	/**
	 * Delete survey functionality (admin only)
	 */
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
						// Emit event to parent component
						this.surveyDeleted.emit(this.survey.id);
						// Navigate to master survey list
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

	/**
	 * Navigate to master survey list
	 */
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
	 * Download household count CSV for the survey
	 */
	downloadHouseholdCountCSV(): void {
		if (!this.survey || !this.survey.id) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Survey information is not available',
				life: 3000,
			});
			return;
		}

		this.downloadingCSV = true;
		this.surveyService.downloadSurveyHouseholdCountCSV(this.survey.id).subscribe({
			next: (blob: Blob) => {
				// Create download link
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				
				// Generate filename with timestamp
				const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
				const filename = `survey_${this.survey.id}_household_counts_${timestamp}.csv`;
				link.download = filename;
				
				// Trigger download
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				
				// Clean up
				window.URL.revokeObjectURL(url);
				
				this.downloadingCSV = false;
				this.messageService.add({
					severity: 'success',
					summary: 'Download Successful',
					detail: 'Household counts CSV downloaded successfully',
					life: 3000,
				});
			},
			error: (error) => {
				this.downloadingCSV = false;
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

