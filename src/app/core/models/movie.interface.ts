import { Hall } from './hall.interface';

export interface Movie {
	id: number;
	title: string;
	description: string;
	image: string;
	rating: string;
	duration: string;
	genre: string[];
	trailerUrl: string;
	status: 'screening' | 'coming-soon' | 'ended';
	releaseDate: Date;
	language: string;
	cast: string[];
	director: string;
	price: number;
}

export interface Screening {
	id: number;
	movieId: number;
	theatreId: number;
	theatreName: string;
	hallId: number;
	hallName: string;
	date: Date;
	time: string;
	availableSeats: number;
	totalSeats: number;
	seatPricing: {
		basic: number;
		premium: number;
	};
}

export interface Theatre {
	id: number;
	name: string;
	location: string;
	city: string;
	capacity: number;
	amenities: string[];
	halls?: Hall[];
}

export interface Seat {
	id: string;
	row: string;
	number: number;
	type: 'basic' | 'premium';
	price: number;
	isAvailable: boolean;
	isSelected?: boolean;
}

export interface BookingDetails {
	movieId: number;
	screeningId: number;
	selectedSeats: Seat[];
	totalAmount: number;
	customerInfo: {
		name: string;
		email: string;
		phone: string;
	};
}

export interface Ticket {
	id: string;
	bookingId: string;
	movieTitle: string;
	theatreName: string;
	hallName: string;
	date: Date;
	time: string;
	seats: string[];
	totalAmount: number;
	qrCode: string;
	status: 'confirmed' | 'cancelled';
}
