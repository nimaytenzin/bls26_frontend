import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { SurveyDataService } from '../../../../../../core/dataservice/survey/survey.dataservice';
import { SurveyEnumeratorDataService } from '../../../../../../core/dataservice/survey-enumerator/survey-enumerator.dataservice';
import {
	SurveyEnumerator,
} from '../../../../../../core/dataservice/survey-enumerator/survey-enumerator.dto';

@Component({
	selector: 'app-supervisor-survey-enumerators-view',
	templateUrl: './supervisor-survey-enumerators-view.component.html',
	styleUrls: ['./supervisor-survey-enumerators-view.component.scss'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class SupervisorSurveyEnumeratorsViewComponent implements OnInit {
	@Input() surveyId!: number;

	// Supervisors
	supervisors: any[] = [];
	loadingSupervisors = false;

	// Enumerators
	enumerators: SurveyEnumerator[] = [];
	loadingEnumerators = false;

	// Table columns
	enumeratorColumns = [
		{ field: 'user.name', header: 'Name' },
		{ field: 'user.cid', header: 'CID' },
		{ field: 'user.emailAddress', header: 'Email' },
		{ field: 'user.phoneNumber', header: 'Phone' },
		{ field: 'assignedAt', header: 'Assigned Date' },
	];

	supervisorColumns = [
		{ field: 'user.name', header: 'Name' },
		{ field: 'user.emailAddress', header: 'Email' },
		{ field: 'dzongkhags', header: 'Assigned Dzongkhags' },
	];

	constructor(
		private surveyService: SurveyDataService,
		private surveyEnumeratorService: SurveyEnumeratorDataService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		if (this.surveyId) {
			this.loadData();
		}
	}

	/**
	 * Load all data
	 */
	loadData() {
		this.loadSupervisors();
		this.loadEnumerators();
	}

	/**
	 * Load supervisors for this survey
	 */
	loadSupervisors() {
		this.loadingSupervisors = true;
		this.surveyService.getSupervisorsForSurvey(this.surveyId).subscribe({
			next: (data) => {
				this.supervisors = data;
				this.loadingSupervisors = false;
			},
			error: (error) => {
				console.error('Error loading supervisors:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load supervisors',
					life: 3000,
				});
				this.loadingSupervisors = false;
			},
		});
	}

	/**
	 * Load enumerators for this survey
	 */
	loadEnumerators() {
		this.loadingEnumerators = true;
		this.surveyEnumeratorService
			.getEnumeratorsBySurvey(this.surveyId)
			.subscribe({
				next: (data) => {
					this.enumerators = data;
					this.loadingEnumerators = false;
				},
				error: (error) => {
					console.error('Error loading enumerators:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumerators',
						life: 3000,
					});
					this.loadingEnumerators = false;
				},
			});
	}

	/**
	 * Get dzongkhag names for supervisor
	 */
	getDzongkhagNames(supervisor: any): string {
		if (!supervisor.dzongkhags || supervisor.dzongkhags.length === 0) {
			return 'N/A';
		}
		return supervisor.dzongkhags
			.map((d: any) => d.name || d)
			.join(', ');
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
}

