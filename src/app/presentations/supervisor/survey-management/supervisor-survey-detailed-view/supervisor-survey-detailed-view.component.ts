import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SurveyDataService } from '../../../../core/dataservice/survey/survey.dataservice';
import { MessageService } from 'primeng/api';
import { Survey } from '../../../../core/dataservice/survey/survey.dto';
import { PrimeNgModules } from '../../../../primeng.modules';
import { SupervisorSurveyHouseholdListingsComponent } from './components/supervisor-survey-household-listings/supervisor-survey-household-listings.component';

@Component({
	selector: 'app-supervisor-survey-detailed-view',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		PrimeNgModules,
		SupervisorSurveyHouseholdListingsComponent,
	],
	providers: [MessageService],
	templateUrl: './supervisor-survey-detailed-view.component.html',
	styleUrls: ['./supervisor-survey-detailed-view.component.css'],
})
export class SupervisorSurveyDetailedViewComponent implements OnInit {
	surveyId!: number;
	survey: Survey | null = null;
	loading = false;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private surveyService: SurveyDataService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		this.route.params.subscribe((params) => {
			this.surveyId = +params['surveyId'];
			if (this.surveyId) {
				this.loadSurveyDetails();
			}
		});
	}

	/**
	 * Load survey details
	 */
	loadSurveyDetails() {
		this.loading = true;
		this.surveyService.findSurveyById(this.surveyId).subscribe({
			next: (survey: Survey) => {
				this.survey = survey;
				this.loading = false;
			},
			error: (error: any) => {
				console.error('Error loading survey details:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load survey details',
				});
				this.loading = false;
			},
		});
	}

	/**
	 * Navigate back to surveys list
	 */
	goBack() {
		this.router.navigate(['/supervisor']);
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
