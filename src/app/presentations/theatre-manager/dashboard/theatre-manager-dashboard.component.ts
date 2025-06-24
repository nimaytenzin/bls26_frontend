import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../primeng.modules';

interface TheatreStats {
	totalTheatres: number;
	activeShows: number;
	todayBookings: number;
	todayRevenue: number;
}

interface RecentBooking {
	id: number;
	movieTitle: string;
	customerName: string;
	showTime: string;
	seats: string[];
	amount: number;
	status: string;
	bookingTime: Date;
}

@Component({
	selector: 'app-theatre-manager-dashboard',
	templateUrl: './theatre-manager-dashboard.component.html',
	styleUrls: ['./theatre-manager-dashboard.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
})
export class TheatreManagerDashboardComponent implements OnInit {
	loading = false;

	stats: TheatreStats = {
		totalTheatres: 3,
		activeShows: 12,
		todayBookings: 89,
		todayRevenue: 125600,
	};

	recentBookings: RecentBooking[] = [
		{
			id: 1001,
			movieTitle: 'Avatar: The Way of Water',
			customerName: 'Karma Tshering',
			showTime: '7:00 PM',
			seats: ['A1', 'A2'],
			amount: 500,
			status: 'confirmed',
			bookingTime: new Date(),
		},
		{
			id: 1002,
			movieTitle: 'Top Gun: Maverick',
			customerName: 'Pema Wangchuk',
			showTime: '4:30 PM',
			seats: ['B5', 'B6'],
			amount: 500,
			status: 'confirmed',
			bookingTime: new Date(),
		},
	];

	chartData = {
		labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
		datasets: [
			{
				label: 'Daily Revenue (BTN)',
				data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
				backgroundColor: 'rgba(54, 162, 235, 0.2)',
				borderColor: 'rgba(54, 162, 235, 1)',
				borderWidth: 2,
			},
		],
	};

	chartOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: 'top' as const,
			},
			title: {
				display: true,
				text: 'Weekly Revenue Overview',
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
			case 'confirmed':
				return 'success';
			case 'pending':
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
}
