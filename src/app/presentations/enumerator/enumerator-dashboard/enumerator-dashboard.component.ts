import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EnumeratorDataService } from '../../../core/dataservice/enumerator-service/enumerator.dataservice';
import {
	Survey,
	SurveyStatus,
} from '../../../core/dataservice/survey/survey.dto';
import { PrimeNgModules } from '../../../primeng.modules';

@Component({
	selector: 'app-enumerator-dashboard',
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	templateUrl: './enumerator-dashboard.component.html',
	styleUrls: ['./enumerator-dashboard.component.css'],
})
export class EnumeratorDashboardComponent implements OnInit {
	surveys: Survey[] = [];
	loading = true;
	error: string | null = null;

	constructor(
		private enumeratorService: EnumeratorDataService,
		private router: Router
	) {}

	ngOnInit() {
		this.loadActiveSurveys();
	}

	/**
	 * Load active surveys assigned to the enumerator
	 */
	loadActiveSurveys() {
		this.loading = true;
		this.error = null;

		this.enumeratorService.getMySurveys().subscribe({
			next: (surveys) => {
				this.surveys = surveys;
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading surveys:', error);
				this.error = 'Failed to load surveys. Please try again.';
				this.loading = false;
			},
		});
	}

	/**
	 * Navigate to survey details or enumeration form
	 */
	selectSurvey(survey: Survey) {
		this.router.navigate(['/enumerator/survey', survey.id]);
	}

	/**
	 * Refresh the surveys list
	 */
	refresh() {
		this.loadActiveSurveys();
	}

	/**
	 * Format date for display
	 */
	formatDate(date: string | Date): string {
		if (!date) return 'N/A';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	/**
	 * Get status badge severity
	 */
	getStatusSeverity(
		status: SurveyStatus
	): 'success' | 'danger' | 'warning' | 'info' {
		switch (status) {
			case SurveyStatus.ACTIVE:
				return 'success';
			case SurveyStatus.ENDED:
				return 'danger';
			default:
				return 'info';
		}
	}

	/**
	 * Calculate days remaining for survey
	 */
	getDaysRemaining(endDate: string | Date): number {
		if (!endDate) return 0;
		const end = new Date(endDate);
		const today = new Date();
		const diffTime = end.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}

	/**
	 * Check if survey is ending soon (within 7 days)
	 */
	isEndingSoon(endDate: string | Date): boolean {
		const daysRemaining = this.getDaysRemaining(endDate);
		return daysRemaining > 0 && daysRemaining <= 7;
	}
}
