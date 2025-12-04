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
 import { SurveyStatus } from '../../../../core/constants/enums';
import { SurveyOverviewComponent } from '../../../shared/survey-view/survey-overview/survey-overview.component';
import { SurveyEaManagementComponent } from '../../../shared/survey-view/survey-ea-management/survey-ea-management.component';
import { SurveyHouseholdListingsComponent } from '../../../shared/survey-view/survey-household-listings/survey-household-listings.component';
import { SurveyUsersComponent } from '../../../shared/survey-view/survey-users/survey-users.component';

@Component({
	selector: 'app-supervisor-survey-detailed-view',
	templateUrl: './supervisor-survey-detailed-view.component.html',
	styleUrls: ['./supervisor-survey-detailed-view.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		PrimeNgModules,
   	
		SurveyOverviewComponent,
		SurveyEaManagementComponent,
		SurveyHouseholdListingsComponent,
		SurveyUsersComponent
		


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

	// Survey Status Enum for template
	SurveyStatus = SurveyStatus;

	constructor(
		private surveyService: SurveyDataService,
		private messageService: MessageService,
		private router: Router,
		private route: ActivatedRoute
	) {}

	ngOnInit(): void {
		// Get survey ID from route parameters
		this.route.params.subscribe((params) => {
			const id = params['surveyId'];
			if (id) {
				this.surveyId = Number(id);
				this.loadSurvey();
			} else {
				this.notFound = true;
			}
		});
	}

	ngOnDestroy(): void {
		// Cleanup if needed
	}

	loadSurvey(): void {
		if (!this.surveyId) return;

		this.loading = true;
		this.notFound = false;

		this.surveyService.findSurveyById(this.surveyId).subscribe({
			next: (survey) => {
				this.survey = survey;
				this.loading = false;
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
