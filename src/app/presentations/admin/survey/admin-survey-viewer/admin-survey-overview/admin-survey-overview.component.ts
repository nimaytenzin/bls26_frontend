import {
	Component,
	OnInit,
	Input,
	OnChanges,
	SimpleChanges,
	ViewChild,
	ElementRef,
	AfterViewInit,
	OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { SurveyDataService } from '../../../../../core/dataservice/survey/survey.dataservice';
import {
	Survey,
	SurveyStatisticsResponseDto,
} from '../../../../../core/dataservice/survey/survey.dto';
import { MessageService } from 'primeng/api';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
	selector: 'app-admin-survey-overview',
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService],
	templateUrl: './admin-survey-overview.component.html',
	styleUrls: ['./admin-survey-overview.component.css'],
})
export class AdminSurveyOverviewComponent
	implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
	@Input() surveyId: number | null = null;
	@Input({
		required: true,
	})
	survey!: Survey;

	@ViewChild('progressChart') progressChartRef!: ElementRef<HTMLCanvasElement>;

	statistics: SurveyStatisticsResponseDto | null = null;
	loadingStatistics = false;

	private progressChart: Chart | null = null;

	constructor(
		private surveyService: SurveyDataService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		if (this.surveyId) {
			this.loadSurveyStatistics();
		}
	}

	ngAfterViewInit() {
		// Charts will be created after statistics are loaded
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
				// Create charts after statistics are loaded
				setTimeout(() => this.createCharts(), 100);
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

	/**
	 * Create all charts
	 */
	private createCharts(): void {
		if (!this.statistics) return;
		this.createProgressChart();
	}

	getSurveyDuration(): number {
		return this.survey ? this.surveyService.getSurveyDuration(this.survey) : 0;
	}

	/**
	 * Create progress doughnut chart
	 */
	private createProgressChart(): void {
		if (this.progressChart) {
			this.progressChart.destroy();
		}

		if (!this.progressChartRef?.nativeElement || !this.statistics) return;

		const ctx = this.progressChartRef.nativeElement.getContext('2d');
		if (!ctx) return;

		this.progressChart = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: ['Validated', 'Submitted', 'Pending'],
				datasets: [
					{
						data: [
							this.statistics.validatedEnumerationAreas,
							this.statistics.submittedEnumerationAreas -
								this.statistics.validatedEnumerationAreas,
							this.statistics.pendingEnumerationAreas,
						],
						backgroundColor: [
							'rgba(134, 239, 172, 0.8)', // green-300 muted - validated
							'rgba(253, 224, 71, 0.8)', // yellow-300 muted - submitted
							'rgba(252, 165, 165, 0.8)', // red-300 muted - pending
						],
						borderColor: '#ffffff',
						borderWidth: 2,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							padding: 15,
							font: {
								size: 12,
								family: 'Inter, sans-serif',
							},
							color: '#374151',
							usePointStyle: true,
							pointStyle: 'circle',
						},
					},
					tooltip: {
						backgroundColor: 'rgba(17, 24, 39, 0.9)',
						padding: 12,
						titleFont: {
							size: 13,
							weight: 'bold',
						},
						bodyFont: {
							size: 12,
						},
						cornerRadius: 6,
						callbacks: {
							label: function (context) {
								const label = context.label || '';
								const value = context.parsed || 0;
								const total = context.dataset.data.reduce(
									(a: number, b: number) => a + b,
									0
								);
								const percentage = ((value / total) * 100).toFixed(1);
								return `${label}: ${value} (${percentage}%)`;
							},
						},
					},
				},
			},
		});
	}

	/**
	 * Cleanup charts on component destroy
	 */
	ngOnDestroy(): void {
		if (this.progressChart) {
			this.progressChart.destroy();
		}
	}

	/**
	 * Convert string percentage to number
	 */
	getPercentageNumber(value: string): number {
		return parseFloat(value) || 0;
	}
}
