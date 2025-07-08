import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../primeng.modules';
import { MessageService } from 'primeng/api';

interface DailyStats {
	ticketsSold: number;
	totalSales: number;
	walkInCustomers: number;
	onlineBookings: number;
}

interface CurrentShow {
	id: number;
	movieTitle: string;
	hallName: string;
	showTime: string;
	availableSeats: number;
	totalSeats: number;
	ticketPrice: number;
	status: string;
}

interface RecentTransaction {
	id: number;
	type: string;
	customerName: string;
	movieTitle: string;
	amount: number;
	timestamp: Date;
	paymentMethod: string;
}

@Component({
	selector: 'app-counter-staff-dashboard',
	templateUrl: './counter-staff-dashboard.component.html',
	styleUrls: ['./counter-staff-dashboard.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService],
})
export class CounterStaffDashboardComponent implements OnInit {
	loading = false;
	currentDate = new Date();

	stats: DailyStats = {
		ticketsSold: 45,
		totalSales: 22500,
		walkInCustomers: 28,
		onlineBookings: 17,
	};

	currentShows: CurrentShow[] = [
		{
			id: 1,
			movieTitle: 'Avatar: The Way of Water',
			hallName: 'Hall A',
			showTime: '2:00 PM',
			availableSeats: 25,
			totalSeats: 120,
			ticketPrice: 250,
			status: 'selling',
		},
		{
			id: 2,
			movieTitle: 'Top Gun: Maverick',
			hallName: 'Hall B',
			showTime: '4:30 PM',
			availableSeats: 45,
			totalSeats: 100,
			ticketPrice: 250,
			status: 'selling',
		},
		{
			id: 3,
			movieTitle: 'Spider-Man: No Way Home',
			hallName: 'Hall C',
			showTime: '7:00 PM',
			availableSeats: 80,
			totalSeats: 150,
			ticketPrice: 300,
			status: 'upcoming',
		},
	];

	recentTransactions: RecentTransaction[] = [
		{
			id: 1001,
			type: 'sale',
			customerName: 'Karma Tshering',
			movieTitle: 'Avatar: The Way of Water',
			amount: 500,
			timestamp: new Date(),
			paymentMethod: 'Cash',
		},
		{
			id: 1002,
			type: 'refund',
			customerName: 'Pema Wangchuk',
			movieTitle: 'Top Gun: Maverick',
			amount: 250,
			timestamp: new Date(Date.now() - 30 * 60 * 1000),
			paymentMethod: 'Card',
		},
	];

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

	getShowStatusSeverity(status: string): string {
		switch (status) {
			case 'selling':
				return 'success';
			case 'upcoming':
				return 'warning';
			case 'sold-out':
				return 'danger';
			case 'completed':
				return 'info';
			default:
				return 'info';
		}
	}

	getTransactionTypeSeverity(type: string): string {
		switch (type) {
			case 'sale':
				return 'success';
			case 'refund':
				return 'warning';
			case 'cancellation':
				return 'danger';
			default:
				return 'info';
		}
	}

	formatCurrency(amount: number): string {
		return `BTN ${amount.toLocaleString()}`;
	}

	formatTime(date: Date): string {
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	getOccupancyPercentage(show: CurrentShow): number {
		return Math.round(
			((show.totalSeats - show.availableSeats) / show.totalSeats) * 100
		);
	}

	sellTickets(show: CurrentShow): void {
		// Navigate to ticket selling interface
		console.log('Selling tickets for show:', show.movieTitle);
	}

	viewBookingDetails(transactionId: number): void {
		// Navigate to booking details
		console.log('Viewing booking details for:', transactionId);
	}

	processRefund(transactionId: number): void {
		// Process refund
		console.log('Processing refund for:', transactionId);
	}
}
