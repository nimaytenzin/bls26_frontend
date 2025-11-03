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
import { HistoricalHouseholdListingDataService } from '../../../../../core/dataservice/household-listings/historical-household-listing/historical-household-listing.dataservice';
import { CurrentHouseholdListingDataService } from '../../../../../core/dataservice/household-listings/current-household-listing/current-household-listing.dataservice';
import {
	HistoricalHouseholdListing,
	CreateHistoricalHouseholdListingDto,
	HistoricalStatistics,
} from '../../../../../core/dataservice/household-listings/historical-household-listing/historical-household-listing.dto';
import { CurrentHouseholdListing } from '../../../../../core/dataservice/household-listings/current-household-listing/current-household-listing.dto';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';

@Component({
	selector: 'app-history',
	templateUrl: './history.component.html',
	styleUrls: ['./history.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class HistoryComponent implements OnInit, OnChanges {
	@Input() enumerationAreaId: number | null = null;

	historicalListings: HistoricalHouseholdListing[] = [];
	currentHouseholdListings: CurrentHouseholdListing[] = [];
	combinedData: HistoricalHouseholdListing[] = []; // Historical + Current year data
	statistics: HistoricalStatistics | null = null;
	loading = false;
	showAddDialog = false;
	submitting = false;
	currentYear = new Date().getFullYear();
	currentYearCount = 0;

	// Form data for adding new historical record
	newHistoricalRecord: CreateHistoricalHouseholdListingDto = {
		year: new Date().getFullYear(),
		householdCount: 0,
		enumerationAreaId: 0,
	};

	// Chart data for visualization
	chartData: any;
	chartOptions: any;

	constructor(
		private historicalService: HistoricalHouseholdListingDataService,
		private currentHouseholdService: CurrentHouseholdListingDataService,
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

		// Fetch both historical data and current household listings
		forkJoin({
			historical:
				this.historicalService.findHistoricalListingsByEnumerationArea(
					this.enumerationAreaId
				),
			current:
				this.currentHouseholdService.findHouseholdListingsByEnumerationArea(
					this.enumerationAreaId
				),
		}).subscribe({
			next: (data) => {
				this.historicalListings = data.historical;
				this.currentHouseholdListings = data.current;
				this.currentYearCount = data.current.length;

				// Create combined data with current year info
				this.combinedData = this.createCombinedData();

				// Calculate statistics on combined data
				this.statistics = this.historicalService.calculateStatistics(
					this.combinedData
				);
				this.updateChartData();
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading historical data:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load historical data',
				});
				this.loading = false;
			},
		});
	}

	createCombinedData(): HistoricalHouseholdListing[] {
		const combined = [...this.historicalListings];

		// Check if current year already exists in historical data
		const currentYearExists = this.historicalListings.some(
			(listing) => listing.year === this.currentYear
		);

		// If current year doesn't exist in historical data, add it
		if (!currentYearExists) {
			const currentYearData: HistoricalHouseholdListing = {
				id: 0, // Temporary ID for current year
				year: this.currentYear,
				householdCount: this.currentYearCount,
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
			this.newHistoricalRecord = {
				year: this.currentYear - 1, // Default to previous year
				householdCount: 0,
				enumerationAreaId: this.enumerationAreaId,
			};
		}
	}

	submitHistoricalRecord(): void {
		if (!this.validateForm()) return;

		this.submitting = true;
		this.historicalService
			.createHistoricalListing(this.newHistoricalRecord)
			.subscribe({
				next: (response) => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Historical record added successfully',
					});
					this.showAddDialog = false;
					this.submitting = false;
					this.loadHistoricalData(); // Reload the data
				},
				error: (error) => {
					console.error('Error creating historical record:', error);
					let errorMessage = 'Failed to add historical record';

					// Handle duplicate year error
					if (
						error.status === 409 ||
						error.error?.message?.includes('already exists')
					) {
						errorMessage = `A record for year ${this.newHistoricalRecord.year} already exists`;
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
			this.newHistoricalRecord.year < 1900 ||
			this.newHistoricalRecord.year >= currentYear
		) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: `Please enter a year before ${currentYear}. Current year data is automatically calculated.`,
			});
			return false;
		}

		if (this.newHistoricalRecord.householdCount < 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Household count cannot be negative',
			});
			return false;
		}

		// Check if year already exists in historical data
		if (
			this.historicalService.checkYearExists(
				this.historicalListings,
				this.newHistoricalRecord.year
			)
		) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: `A record for year ${this.newHistoricalRecord.year} already exists`,
			});
			return false;
		}

		return true;
	}

	editHistoricalRecord(record: HistoricalHouseholdListing): void {
		// TODO: Implement edit functionality
		console.log('Edit historical record:', record);
		this.messageService.add({
			severity: 'info',
			summary: 'Feature Coming Soon',
			detail: 'Edit historical record functionality will be available soon',
		});
	}

	deleteHistoricalRecord(record: HistoricalHouseholdListing): void {
		// TODO: Implement delete functionality with confirmation
		console.log('Delete historical record:', record);
		this.messageService.add({
			severity: 'warn',
			summary: 'Feature Coming Soon',
			detail: 'Delete historical record functionality will be available soon',
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
			this.chartData = null;
			return;
		}

		const sortedData = [...this.combinedData].sort((a, b) => a.year - b.year);

		this.chartData = {
			labels: sortedData.map((item) => {
				const label = item.year.toString();
				return item.year === this.currentYear ? `${label} (Current)` : label;
			}),
			datasets: [
				{
					label: 'Household Count',
					data: sortedData.map((item) => item.householdCount),
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
	}

	initializeChartOptions(): void {
		this.chartOptions = {
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
	}
}
