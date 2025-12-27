import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
	Survey,
	PaginationQueryDto,
	PaginatedResponse,
} from '../../../../core/dataservice/survey/survey.dto';
import { PrimeNgModules } from '../../../../primeng.modules';
import { Table } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { SurveyDataService } from '../../../../core/dataservice/survey/survey.dataservice';
import { ActiveSurveysTableComponent } from './components/active-surveys-table.component';
import { AllSurveysTableComponent } from './components/all-surveys-table.component';
import { SurveyStatus } from '../../../../core/constants/enums';

@Component({
	selector: 'app-admin-master-survey',
	templateUrl: './admin-master-survey.component.html',
	styleUrls: ['./admin-master-survey.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules, ActiveSurveysTableComponent, AllSurveysTableComponent],
	providers: [MessageService],
})
export class AdminMasterSurveyComponent implements OnInit {
	// Table references (kept for backward compatibility if needed)
	@ViewChild('dt') dt!: Table;

	// Tab control
	activeTabIndex = 0;

	// Data properties - Active Surveys (Tab 0)
	activeSurveys: Survey[] = [];

	// Data properties - All Surveys Paginated (Tab 1)
	allSurveysPaginated: Survey[] = [];
	totalRecords = 0;
	currentPage = 1;
	rowsPerPage = 10;

	// Common properties
	selectedSurvey: Survey | null = null;
	loading = false;

	// Dialog states
	deleteDialog = false;

	// Table properties
	globalFilterValue = '';

	// Survey Status Enum for template
	SurveyStatus = SurveyStatus;

	constructor(
		private surveyService: SurveyDataService,
		private messageService: MessageService,
		private router: Router
	) {}

	ngOnInit() {
		this.loadActiveSurveys();
	}

	/**
	 * Load active surveys for Tab 0
	 */
	loadActiveSurveys() {
		this.loading = true;
		this.surveyService.findAllActiveSurveys().subscribe({
			next: (data: Survey[]) => {
				this.activeSurveys = data;
				this.loading = false;
			},
			error: (error: any) => {
				this.loading = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load active surveys',
					life: 3000,
				});
			},
		});
	}

	/**
	 * Load all surveys with pagination for Tab 1
	 */
	loadAllSurveysPaginated(event?: any) {
		this.loading = true;

		const query: PaginationQueryDto = {
			page: event ? event.first / event.rows + 1 : this.currentPage,
			limit: event ? event.rows : this.rowsPerPage,
			sortBy: event?.sortField || 'id',
			sortOrder: event?.sortOrder === 1 ? 'ASC' : 'DESC',
		};

		this.surveyService.findAllSurveysPaginated(query).subscribe({
			next: (response: PaginatedResponse<Survey>) => {
				this.allSurveysPaginated = response.data;
				this.totalRecords = response.meta.totalItems;
				this.currentPage = response.meta.currentPage;
				this.loading = false;
			},
			error: (error: any) => {
				this.loading = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load surveys',
					life: 3000,
				});
			},
		});
	}

	/**
	 * Handle tab change event
	 */
	onTabChange(event: any) {
		this.activeTabIndex = event.index;
		if (event.index === 1 && this.allSurveysPaginated.length === 0) {
			// Load paginated data when switching to "All Surveys" tab for the first time
			this.loadAllSurveysPaginated();
		}
	}

	// CRUD Operations
	navigateToSurveyCreator() {
		this.router.navigate(['/admin/survey/create']);
	}

	editSurvey(survey: Survey) {
		// TODO: Implement edit with dynamic dialogs if needed
		this.messageService.add({
			severity: 'info',
			summary: 'Edit Not Implemented',
			detail: 'Edit functionality with dynamic dialogs coming soon',
			life: 3000,
		});
	}

	viewSurvey(survey: Survey) {
		// Navigate to the survey viewer component with survey ID as path parameter
		this.router.navigate(['/admin/survey/viewer', survey.id]);
	}

	confirmDelete(survey: Survey) {
		this.selectedSurvey = survey;
		this.deleteDialog = true;
	}

	deleteSurvey() {
		if (this.selectedSurvey) {
			this.surveyService.deleteSurvey(this.selectedSurvey.id).subscribe({
				next: () => {
					this.refreshCurrentTab();
					this.deleteDialog = false;
					this.selectedSurvey = null;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Survey deleted successfully',
						life: 3000,
					});
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
		}
	}

	/**
	 * Refresh current tab data
	 */
	refreshCurrentTab() {
		if (this.activeTabIndex === 0) {
			this.loadActiveSurveys();
		} else {
			this.loadAllSurveysPaginated();
		}
	}

	// Utility functions
	clear(table: any) {
		table.clear();
		this.globalFilterValue = '';
	}

	onGlobalFilter(event: Event) {
		const target = event.target as HTMLInputElement;
		this.globalFilterValue = target.value;
		if (this.dt) {
			this.dt.filterGlobal(target.value, 'contains');
		}
	}

	onActiveSurveyFilterChange(value: string) {
		this.globalFilterValue = value;
	}

	onAllSurveyFilterChange(value: string) {
		this.globalFilterValue = value;
	}

	onAllSurveyLazyLoad(event: any) {
		this.loadAllSurveysPaginated(event);
	}

	onRowSelect(survey: Survey) {
		this.selectedSurvey = survey;
	}

	onActiveSurveyRowSelect(survey: Survey) {
		this.onRowSelect(survey);
	}

	onAllSurveyRowSelect(survey: Survey) {
		this.onRowSelect(survey);
	}

	// Utility methods from service
	getSurveyDuration(survey: Survey): number {
		return this.surveyService.getSurveyDuration(survey);
	}

	isSurveyActive(survey: Survey): boolean {
		return this.surveyService.isSurveyActive(survey);
	}

	isSurveyEndingSoon(survey: Survey): boolean {
		return this.surveyService.isSurveyEndingSoon(survey);
	}

	formatDate(date: string | Date): string {
		return this.surveyService.formatDate(date);
	}

	getEACount(survey: Survey): number {
		return this.surveyService.getEACount(survey);
	}

	// Get status badge class
	getStatusBadgeClass(status: SurveyStatus): string {
		return status === SurveyStatus.ACTIVE
			? 'bg-green-100 text-green-800'
			: 'bg-gray-100 text-gray-800';
	}

	// Get enumeration area names for display
	getEANames(survey: Survey): string {
		if (!survey.enumerationAreas || survey.enumerationAreas.length === 0) {
			return 'No EAs assigned';
		}
		if (survey.enumerationAreas.length <= 3) {
			return survey.enumerationAreas.map((ea) => ea.name).join(', ');
		}
		return `${survey.enumerationAreas
			.slice(0, 3)
			.map((ea) => ea.name)
			.join(', ')} and ${survey.enumerationAreas.length - 3} more`;
	}

	/**
	 * Download household counts CSV for a survey
	 * @param survey Survey object
	 */
	downloadHouseholdCountCSV(survey: Survey): void {
		if (!survey || !survey.id) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Invalid Survey',
				detail: 'Please select a valid survey',
				life: 3000,
			});
			return;
		}

		this.surveyService.downloadSurveyHouseholdCountCSV(survey.id).subscribe({
			next: (blob: Blob) => {
				// Create download link
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				
				// Generate filename with timestamp
				const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
				const filename = `survey_${survey.id}_household_counts_${timestamp}.csv`;
				link.download = filename;
				
				// Trigger download
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				
				// Clean up
				window.URL.revokeObjectURL(url);
				
				this.messageService.add({
					severity: 'success',
					summary: 'Download Successful',
					detail: 'Household counts CSV downloaded successfully',
					life: 3000,
				});
			},
			error: (error: any) => {
				console.error('Error downloading household counts CSV:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Download Failed',
					detail: error?.error?.message || 'Failed to download household counts CSV',
					life: 3000,
				});
			},
		});
	}
}
