import {
	Component,
	OnInit,
	Input,
	OnChanges,
	SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../../../primeng.modules';
import { SurveyDataService } from '../../../../../../core/dataservice/survey/survey.dataservice';
import {
	Survey,
	SurveyStatisticsResponseDto,
} from '../../../../../../core/dataservice/survey/survey.dto';
import { MessageService } from 'primeng/api';

@Component({
	selector: 'app-supervisor-survey-overview',
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService],
	templateUrl: './supervisor-survey-overview.component.html',
	styleUrls: ['./supervisor-survey-overview.component.scss'],
})
export class SupervisorSurveyOverviewComponent
	implements OnInit, OnChanges
{
	@Input() surveyId: number | null = null;
	@Input({
		required: true,
	})
	survey!: Survey;

	statistics: SurveyStatisticsResponseDto | null = null;
	loadingStatistics = false;

	constructor(
		private surveyService: SurveyDataService,
		private messageService: MessageService
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
	 * Get enumerated but not sampled count
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
}

