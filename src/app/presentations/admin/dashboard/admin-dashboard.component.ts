import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../primeng.modules';

interface Movie {
	id: number;
	title: string;
	genre: string[];
	duration: string;
	rating: string;
	status: 'active' | 'inactive';
	totalBookings: number;
	revenue: number;
	image: string;
}

interface Theater {
	id: number;
	name: string;
	location: string;
	capacity: number;
	status: 'active' | 'maintenance';
	occupancy: number;
}

interface Booking {
	id: number;
	movieTitle: string;
	customerName: string;
	showTime: string;
	seats: string[];
	amount: number;
	status: 'confirmed' | 'pending' | 'cancelled';
	bookingDate: Date;
}

interface DashboardStats {
	totalRevenue: number;
	totalBookings: number;
	totalMovies: number;
	totalTheaters: number;
	todayBookings: number;
	occupancyRate: number;
}

@Component({
	selector: 'app-admin-dashboard',
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './admin-dashboard.component.html',
	styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
	stats: DashboardStats = {
		totalRevenue: 125000,
		totalBookings: 2456,
		totalMovies: 15,
		totalTheaters: 8,
		todayBookings: 87,
		occupancyRate: 76,
	};

	movies: Movie[] = [
		{
			id: 1,
			title: 'Dune: Part Two',
			genre: ['Sci-Fi', 'Adventure'],
			duration: '2h 46m',
			rating: 'PG-13',
			status: 'active',
			totalBookings: 342,
			revenue: 85500,
			image: '/movies/dune.jpg',
		},
		{
			id: 2,
			title: 'Oppenheimer',
			genre: ['Biography', 'Drama'],
			duration: '3h 0m',
			rating: 'R',
			status: 'active',
			totalBookings: 298,
			revenue: 74500,
			image: '/movies/oppenheimer.jpg',
		},
		{
			id: 3,
			title: 'Spider-Man: No Way Home',
			genre: ['Action', 'Adventure'],
			duration: '2h 28m',
			rating: 'PG-13',
			status: 'inactive',
			totalBookings: 567,
			revenue: 141750,
			image: '/movies/spiderman.jpg',
		},
		{
			id: 4,
			title: 'The Batman',
			genre: ['Action', 'Crime'],
			duration: '2h 56m',
			rating: 'PG-13',
			status: 'active',
			totalBookings: 234,
			revenue: 58500,
			image: '/movies/batman.jpg',
		},
	];

	theaters: Theater[] = [
		{
			id: 1,
			name: 'Grand Cinema Hall 1',
			location: 'Downtown',
			capacity: 150,
			status: 'active',
			occupancy: 85,
		},
		{
			id: 2,
			name: 'Royal Theater Hall 2',
			location: 'Mall Complex',
			capacity: 200,
			status: 'active',
			occupancy: 72,
		},
		{
			id: 3,
			name: 'Premium Hall 3',
			location: 'City Center',
			capacity: 120,
			status: 'maintenance',
			occupancy: 0,
		},
		{
			id: 4,
			name: 'IMAX Theater',
			location: 'Entertainment District',
			capacity: 300,
			status: 'active',
			occupancy: 91,
		},
	];

	recentBookings: Booking[] = [
		{
			id: 1001,
			movieTitle: 'Dune: Part Two',
			customerName: 'John Doe',
			showTime: '7:30 PM',
			seats: ['A1', 'A2'],
			amount: 500,
			status: 'confirmed',
			bookingDate: new Date('2025-06-06T19:30:00'),
		},
		{
			id: 1002,
			movieTitle: 'Oppenheimer',
			customerName: 'Jane Smith',
			showTime: '4:00 PM',
			seats: ['B5', 'B6', 'B7'],
			amount: 750,
			status: 'confirmed',
			bookingDate: new Date('2025-06-06T16:00:00'),
		},
		{
			id: 1003,
			movieTitle: 'The Batman',
			customerName: 'Mike Johnson',
			showTime: '9:45 PM',
			seats: ['C3', 'C4'],
			amount: 500,
			status: 'pending',
			bookingDate: new Date('2025-06-06T21:45:00'),
		},
		{
			id: 1004,
			movieTitle: 'Dune: Part Two',
			customerName: 'Sarah Wilson',
			showTime: '2:15 PM',
			seats: ['D1'],
			amount: 250,
			status: 'cancelled',
			bookingDate: new Date('2025-06-06T14:15:00'),
		},
	];

	revenueData = {
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
		datasets: [
			{
				label: 'Revenue',
				data: [15000, 18000, 22000, 19000, 25000, 28000],
				backgroundColor: 'rgba(139, 69, 19, 0.2)',
				borderColor: '#6F1C76',
				borderWidth: 2,
			},
		],
	};

	bookingData = {
		labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
		datasets: [
			{
				label: 'Bookings',
				data: [45, 52, 38, 67, 89, 125, 98],
				backgroundColor: 'rgba(75, 192, 192, 0.2)',
				borderColor: 'rgba(75, 192, 192, 1)',
				borderWidth: 2,
			},
		],
	};

	revenueChartOptions: any = {
		responsive: true,
		maintainAspectRatio: true,
		plugins: {
			legend: {
				position: 'top',
				display: false,
			},
			title: {
				display: false,
				text: 'Revenue Trend',
			},
		},
		scales: {
			y: {
				beginAtZero: true,
				ticks: {
					callback: function (value: any) {
						return 'Nu.' + value.toLocaleString();
					},
				},
				grid: {
					display: false,
				},
				border: {
					display: false, // hides the y-axis line
				},
			},
			x: {
				grid: {
					display: false,
				},
				border: {
					display: false, // hides the x-axis line
				},
			},
		},
		elements: {
			line: {
				tension: 0.4,
				borderWidth: 4, // thicker lines
			},
			point: {
				radius: 0, // no dot markers
			},
		},
	};
	ngOnInit() {
		// Initialize any additional data or subscriptions
	}

	getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
		switch (status) {
			case 'active':
			case 'confirmed':
				return 'success';
			case 'pending':
				return 'warning';
			case 'inactive':
			case 'cancelled':
				return 'danger';
			case 'maintenance':
				return 'info';
			default:
				return 'info';
		}
	}

	formatCurrency(amount: number): string {
		return `Nu. ${amount.toLocaleString()}`;
	}
}
