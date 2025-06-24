import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../primeng.modules';

interface ProducerStats {
	totalMovies: number;
	activeReleases: number;
	totalRevenue: number;
	pendingRoyalties: number;
}

interface MoviePerformance {
	id: number;
	title: string;
	releaseDate: Date;
	totalRevenue: number;
	totalBookings: number;
	averageRating: number;
	status: string;
}

@Component({
	selector: 'app-executive-producer-dashboard',
	templateUrl: './executive-producer-dashboard.component.html',
	styleUrls: ['./executive-producer-dashboard.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
})
export class ExecutiveProducerDashboardComponent implements OnInit {
	loading = false;

	stats: ProducerStats = {
		totalMovies: 8,
		activeReleases: 3,
		totalRevenue: 2850000,
		pendingRoyalties: 125000,
	};

	moviePerformance: MoviePerformance[] = [
		{
			id: 1,
			title: 'The Dragon Kingdom',
			releaseDate: new Date('2024-01-15'),
			totalRevenue: 1200000,
			totalBookings: 4800,
			averageRating: 4.5,
			status: 'active',
		},
		{
			id: 2,
			title: 'Himalayan Tales',
			releaseDate: new Date('2024-03-22'),
			totalRevenue: 850000,
			totalBookings: 3400,
			averageRating: 4.2,
			status: 'active',
		},
		{
			id: 3,
			title: 'Thunder Dragon',
			releaseDate: new Date('2024-05-10'),
			totalRevenue: 650000,
			totalBookings: 2600,
			averageRating: 3.8,
			status: 'completed',
		},
	];

	revenueData = {
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
		datasets: [
			{
				label: 'Revenue (BTN)',
				data: [150000, 280000, 420000, 380000, 650000, 580000],
				backgroundColor: 'rgba(75, 192, 192, 0.2)',
				borderColor: 'rgba(75, 192, 192, 1)',
				borderWidth: 2,
				fill: true,
			},
		],
	};

	movieDistributionData = {
		labels: ['Action', 'Drama', 'Comedy', 'Thriller', 'Romance'],
		datasets: [
			{
				data: [30, 25, 20, 15, 10],
				backgroundColor: [
					'#FF6384',
					'#36A2EB',
					'#FFCE56',
					'#4BC0C0',
					'#9966FF',
				],
			},
		],
	};

	chartOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: 'top' as const,
			},
		},
	};

	constructor() {}

	ngOnInit(): void {
		this.loadDashboardData();
	}

	loadDashboardData(): void {
		this.loading = true;
		// Simulate API call
		setTimeout(() => {
			this.loading = false;
		}, 1000);
	}

	getStatusSeverity(status: string): string {
		switch (status) {
			case 'active':
				return 'success';
			case 'completed':
				return 'info';
			case 'upcoming':
				return 'warning';
			case 'cancelled':
				return 'danger';
			default:
				return 'info';
		}
	}

	formatCurrency(amount: number): string {
		return `BTN ${amount.toLocaleString()}`;
	}

	formatRating(rating: number): string {
		return rating.toFixed(1);
	}

	formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}
}
