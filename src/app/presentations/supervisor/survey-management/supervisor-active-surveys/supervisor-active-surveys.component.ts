import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SurveyDataService } from '../../../../core/dataservice/survey/survey.dataservice';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../../core/dataservice/auth/auth.service';
import { User } from '../../../../core/dataservice/auth/auth.interface';

interface SupervisorSurvey {
	id: number;
	name: string;
	description: string;
	startDate: string;
	endDate: string;
	year: number;
	status: string;
	dzongkhags: any[];
	totalEnumerationAreas: number;
}

@Component({
	selector: 'app-supervisor-active-surveys',
	standalone: true,
	imports: [
		CommonModule,
		CardModule,
		ButtonModule,
		TagModule,
		SkeletonModule,
		ToastModule,
	],
	providers: [MessageService],
	templateUrl: './supervisor-active-surveys.component.html',
	styleUrls: ['./supervisor-active-surveys.component.css'],
})
export class SupervisorActiveSurveysComponent implements OnInit {
	surveys: SupervisorSurvey[] = [];
	loading = false;
	currentUser: User | null = null;

	constructor(
		private surveyService: SurveyDataService,
		private router: Router,
		private messageService: MessageService,
		private authService: AuthService
	) {}

	ngOnInit() {
		this.loadCurrentUser();
		this.loadActiveSurveys();
	}

	/**
	 * Get current logged-in user ID from JWT token
	 */
	loadCurrentUser() {
		this.currentUser = this.authService.getCurrentUser();
	}

	/**
	 * Load all active surveys for the current supervisor
	 */
	loadActiveSurveys() {
		this.loading = true;
		if (!this.currentUser) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'User not authenticated',
			});
			this.loading = false;
			return;
		}
		this.surveyService.getSurveysForSupervisor(this.currentUser.id).subscribe({
			next: (surveys: SupervisorSurvey[]) => {
				this.surveys = surveys;
				console.log('Loaded surveys:', surveys);
				this.loading = false;
			},
			error: (error: any) => {
				console.error('Error loading surveys:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load surveys',
				});
				this.loading = false;
			},
		});
	}

	/**
	 * Navigate to survey detail view
	 */
	viewSurveyDetails(surveyId: number) {
		this.router.navigate(['/supervisor/survey/detailed', surveyId]);
	}

	/**
	 * Format date for display
	 */
	formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	/**
	 * Get survey status severity for tag
	 */
	getStatusSeverity(
		status: string
	): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
		return status === 'ACTIVE' ? 'success' : 'secondary';
	}

	/**
	 * Get dzongkhag names as comma-separated string
	 */
	getDzongkhagNames(survey: SupervisorSurvey): string {
		return survey.dzongkhags?.map((d) => d.name).join(', ') || 'N/A';
	}

	/**
	 * Calculate survey duration in days
	 */
	getSurveyDuration(survey: SupervisorSurvey): number {
		const start = new Date(survey.startDate);
		const end = new Date(survey.endDate);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	}
}
