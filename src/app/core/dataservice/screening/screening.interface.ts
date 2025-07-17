import { Movie } from '../movie/movie.interface';
import { Hall } from '../hall/hall.interface';
import { Language } from '../language/language.interface';
import { SeatCategory } from '../seat-category/seat-category.interface';
import { Booking } from '../booking/booking.interface';

export interface Screening {
	id: number;
	hallId: number;
	movieId: number;
	date: string;
	startTime: string;
	endTime: string;
	audioLanguageId?: number;
	subtitleLanguageId?: number;
	createdAt?: Date;
	updatedAt?: Date;
	movie: Movie;
	hall: Hall;
	audioLanguage?: Language;
	subtitleLanguage?: Language;
	screeningSeatPrices?: ScreeningSeatPrice[];
	bookings?: Booking[];
}

export interface ScreeningSeatPrice {
	id: number;
	screeningId: number;
	seatCategoryId: number;
	price: number;
	seatCategory?: SeatCategory;
}

export interface SeatCategoryPriceDto {
	seatCategoryId: number;
	price: number;
}

export interface CreateScreeningDto {
	hallId: number;
	movieId: number;
	date: string;
	startTime: string;
	endTime: string;
	audioLanguageId?: number;
	subtitleLanguageId?: number;
}

export interface CreateScreeningWithPricesDto extends CreateScreeningDto {
	seatCategoryPrices: SeatCategoryPriceDto[];
}

export interface UpdateScreeningDto {
	hallId?: number;
	movieId?: number;
	date?: string;
	startTime?: string;
	endTime?: string;
	audioLanguageId?: number;
	subtitleLanguageId?: number;
}

export interface ScreeningFilter {
	movieId?: number;
	hallId?: number;
	date?: string;
	theatreId?: number;
}

export interface ApiResponse<T> {
	data: T;
	message?: string;
	success?: boolean;
}

export interface SeatAvailabilityByScreeningDto {
	seatsAvailable: number;
	seatsBooked: number;
	totalSeats: number;
	occupancyPercent: number;
}
