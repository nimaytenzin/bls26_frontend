import {
	Component,
	Input,
	OnInit,
	OnChanges,
	SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { EAAnnualStatsDataService } from '../../../../../core/dataservice/household-listings/ea-annual-stats/ea-annual-stats.dataservice';
import {
	EAAnnualStats,
	CreateEAAnnualStatsDto,
	HistoricalStatistics,
} from '../../../../../core/dataservice/household-listings/ea-annual-stats/ea-annual-stats.dto';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';

@Component({
	selector: 'app-admin-enumeration-area-trends',
	templateUrl: './admin-enumeration-area-trends.component.html',
	styleUrls: ['./admin-enumeration-area-trends.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminEnumerationAreaTrendsComponent implements OnInit, OnChanges {
	@Input() enumerationAreaId: number | null = null;

	annualStats: EAAnnualStats[] = [];
	combinedData: EAAnnualStats[] = []; // Annual stats + Current year data
	statistics: HistoricalStatistics | null = null;
	loading = false;
	showAddDialog = false;
	submitting = false;
	currentYear = new Date().getFullYear();
	currentYearStats = {
		totalHouseholds: 0,
		totalMale: 0,
		totalFemale: 0,
	};

	// Form data for adding new annual stats record
	newAnnualStats: CreateEAAnnualStatsDto = {
		year: new Date().getFullYear(),
		totalHouseholds: 0,
		totalMale: 0,
		totalFemale: 0,
		enumerationAreaId: 0,
	};

	// Chart data for visualization
	householdChartData: any;
	populationChartData: any;
	householdChartOptions: any;
	populationChartOptions: any;

	constructor(
		private eaAnnualStatsService: EAAnnualStatsDataService,
		private messageService: MessageService
	) {
		this.initializeChartOptions();
	}

	ngOnInit(): void {
		if (this.enumerationAreaId) {
			this.loadHistoricalData();
		}
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['enumerationAreaId'] && this.enumerationAreaId) {
			this.loadHistoricalData();
			this.resetForm();
		}
	}

	loadHistoricalData(): void {
		if (!this.enumerationAreaId) return;

		this.loading = true;

		// Fetch both annual stats and current household listings
		forkJoin({
			annualStats: this.eaAnnualStatsService.getHistoricalRecords(
				this.enumerationAreaId
			),
		}).subscribe({
			next: (data) => {
				this.annualStats = data.annualStats;

				// Create combined data with current year info
				this.combinedData = this.createCombinedData();

				// Calculate statistics on combined data
				this.statistics = this.eaAnnualStatsService.calculateStatistics(
					this.combinedData
				);
				this.updateChartData();
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading annual stats data:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load annual statistics data',
				});
				this.loading = false;
			},
		});
	}

	createCombinedData(): EAAnnualStats[] {
		const combined = [...this.annualStats];

		// Check if current year already exists in annual stats
		const currentYearExists = this.annualStats.some(
			(stats) => stats.year === this.currentYear
		);

		// If current year doesn't exist in annual stats, add it
		if (!currentYearExists) {
			const currentYearData: EAAnnualStats = {
				id: 0, // Temporary ID for current year
				year: this.currentYear,
				totalHouseholds: this.currentYearStats.totalHouseholds,
				totalMale: this.currentYearStats.totalMale,
				totalFemale: this.currentYearStats.totalFemale,
				enumerationAreaId: this.enumerationAreaId!,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			combined.push(currentYearData);
		}

		// Sort by year ascending
		return combined.sort((a, b) => a.year - b.year);
	}

	addHistoricalRecord(): void {
		this.resetForm();
		this.showAddDialog = true;
	}

	resetForm(): void {
		if (this.enumerationAreaId) {
			this.newAnnualStats = {
				year: this.currentYear - 1, // Default to previous year
				totalHouseholds: 0,
				totalMale: 0,
				totalFemale: 0,
				enumerationAreaId: this.enumerationAreaId,
			};
		}
	}

	submitHistoricalRecord(): void {
		if (!this.validateForm()) return;

		this.submitting = true;
		this.eaAnnualStatsService
			.createEAAnnualStats(this.newAnnualStats)
			.subscribe({
				next: (response) => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Annual statistics record added successfully',
					});
					this.showAddDialog = false;
					this.submitting = false;
					this.loadHistoricalData(); // Reload the data
				},
				error: (error) => {
					console.error('Error creating annual stats record:', error);
					let errorMessage = 'Failed to add annual statistics record';

					// Handle duplicate year error
					if (
						error.status === 409 ||
						error.error?.message?.includes('already exists')
					) {
						errorMessage = `A record for year ${this.newAnnualStats.year} already exists`;
					}

					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: errorMessage,
					});
					this.submitting = false;
				},
			});
	}

	validateForm(): boolean {
		const currentYear = new Date().getFullYear();

		if (
			this.newAnnualStats.year < 1900 ||
			this.newAnnualStats.year >= currentYear
		) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: `Please enter a year before ${currentYear}. Current year data is automatically calculated.`,
			});
			return false;
		}

		if (this.newAnnualStats.totalHouseholds < 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Household count cannot be negative',
			});
			return false;
		}

		if (
			this.newAnnualStats.totalMale < 0 ||
			this.newAnnualStats.totalFemale < 0
		) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Male and female counts cannot be negative',
			});
			return false;
		}

		// Check if year already exists in annual stats
		if (
			this.eaAnnualStatsService.checkYearExists(
				this.annualStats,
				this.newAnnualStats.year
			)
		) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: `A record for year ${this.newAnnualStats.year} already exists`,
			});
			return false;
		}

		return true;
	}

	editHistoricalRecord(record: EAAnnualStats): void {
		// TODO: Implement edit functionality
		console.log('Edit annual stats record:', record);
		this.messageService.add({
			severity: 'info',
			summary: 'Feature Coming Soon',
			detail:
				'Edit annual statistics record functionality will be available soon',
		});
	}

	deleteHistoricalRecord(record: EAAnnualStats): void {
		// TODO: Implement delete functionality with confirmation
		console.log('Delete annual stats record:', record);
		this.messageService.add({
			severity: 'warn',
			summary: 'Feature Coming Soon',
			detail:
				'Delete annual statistics record functionality will be available soon',
		});
	}

	getTrendIcon(): string {
		if (!this.statistics) return 'pi-minus';

		switch (this.statistics.trend) {
			case 'increasing':
				return 'pi-arrow-up';
			case 'decreasing':
				return 'pi-arrow-down';
			default:
				return 'pi-minus';
		}
	}

	getTrendColor(): string {
		if (!this.statistics) return 'text-gray-500';

		switch (this.statistics.trend) {
			case 'increasing':
				return 'text-green-600';
			case 'decreasing':
				return 'text-red-600';
			default:
				return 'text-blue-600';
		}
	}

	getTrendLabel(): string {
		if (!this.statistics) return 'No Data';

		switch (this.statistics.trend) {
			case 'increasing':
				return 'Increasing';
			case 'decreasing':
				return 'Decreasing';
			default:
				return 'Stable';
		}
	}

	updateChartData(): void {
		if (this.combinedData.length === 0) {
			this.householdChartData = null;
			this.populationChartData = null;
			return;
		}

		const sortedData = [...this.combinedData].sort((a, b) => a.year - b.year);
		const labels = sortedData.map((item) => {
			const label = item.year.toString();
			return item.year === this.currentYear ? `${label} (Current)` : label;
		});

		// Household Count Chart
		this.householdChartData = {
			labels: labels,
			datasets: [
				{
					label: 'Household Count',
					data: sortedData.map((item) => item.totalHouseholds),
					borderColor: '#3b82f6',
					backgroundColor: 'rgba(59, 130, 246, 0.1)',
					fill: true,
					tension: 0.4,
					pointBackgroundColor: sortedData.map((item) =>
						item.year === this.currentYear ? '#10b981' : '#3b82f6'
					),
					pointBorderColor: sortedData.map((item) =>
						item.year === this.currentYear ? '#10b981' : '#3b82f6'
					),
					pointRadius: sortedData.map((item) =>
						item.year === this.currentYear ? 6 : 4
					),
				},
			],
		};

		// Population Chart
		this.populationChartData = {
			labels: labels,
			datasets: [
				{
					label: 'Total Population',
					data: sortedData.map((item) => item.totalMale + item.totalFemale),
					borderColor: '#10b981',
					backgroundColor: 'rgba(16, 185, 129, 0.1)',
					fill: true,
					tension: 0.4,
					pointBackgroundColor: sortedData.map((item) =>
						item.year === this.currentYear ? '#f59e0b' : '#10b981'
					),
					pointBorderColor: sortedData.map((item) =>
						item.year === this.currentYear ? '#f59e0b' : '#10b981'
					),
					pointRadius: sortedData.map((item) =>
						item.year === this.currentYear ? 6 : 4
					),
				},
			],
		};
	}

	initializeChartOptions(): void {
		// Household Chart Options
		this.householdChartOptions = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					mode: 'index',
					intersect: false,
				},
			},
			scales: {
				y: {
					beginAtZero: true,
					grid: {
						display: false,
					},
					ticks: {
						stepSize: 1,
					},
					title: {
						display: true,
						text: 'Number of Households',
					},
				},
				x: {
					grid: {
						display: false,
					},
					title: {
						display: true,
						text: 'Year',
					},
				},
			},
			elements: {
				point: {
					radius: 4,
					hoverRadius: 6,
				},
			},
		};

		// Population Chart Options
		this.populationChartOptions = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					mode: 'index',
					intersect: false,
				},
			},
			scales: {
				y: {
					beginAtZero: true,
					grid: {
						display: false,
					},
					ticks: {
						stepSize: 1,
					},
					title: {
						display: true,
						text: 'Population Count',
					},
				},
				x: {
					grid: {
						display: false,
					},
					title: {
						display: true,
						text: 'Year',
					},
				},
			},
			elements: {
				point: {
					radius: 4,
					hoverRadius: 6,
				},
			},
		};
	}
}
