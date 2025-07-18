import { Screening } from '../screening/screening.interface';
import { Seat } from '../seat/seat.interface';

export enum BookingStatusEnum {
	PENDING = 'PENDING', // User selecting seats, payment not started
	PAYMENT_PENDING = 'PAYMENT_PENDING', // Checkout complete, entering payment
	CONFIRMED = 'CONFIRMED', // Payment succeeded, booking finalized
	FAILED = 'FAILED', // Payment failed, seats released
	CANCELLED = 'CANCELLED', // User cancelled, seats released
	EXPIRED = 'EXPIRED', // Booking not completed in time, seats released
	TIMEOUT = 'TIMEOUT', // Payment process timeout
}

// Entry Status Enum
export enum EntryStatusEnum {
	ENTERED = 'ENTERED',
	VALID = 'VALID',
}

export interface Booking {
	id: number;
	screeningId: number;
	name: string;
	phoneNumber: string;
	bookingStatus: BookingStatusEnum;
	amount: number;
	uuid: string;
	entryStatus: EntryStatusEnum;
	email?: string;
	notes?: string;
	paymentMethod?: string;

	bookingSeats?: BookingSeat[]; // List of booked seats
	screening?: Screening; // Reference to Screening entity
	createdAt?: Date;
	updatedAt?: Date;
}

export interface BookingSeat {
	id: number;
	screeningId: number;
	bookingId: number;
	seatId: number;
	status: string;
	price: number;
	screening?: Screening;
	booking?: Booking;
	seat?: Seat;
}

// Booked Seat DTO (for customer bookings)
export interface BookedSeatDto {
	seatId: number;
	seatCategoryId: number;
	price: number;
}

// Customer Booking DTO
export interface CustomerBookingDto {
	screeningId: number;
	customerName: string;
	phoneNumber: string;
	email?: string;
	seats: BookedSeatDto[];
	totalAmount: number;
}

// Counter Staff Booking DTO
export interface CounterStaffCreateBookingDto {
	sessionId: string;
	screeningId: number;
	customerName: string;
	phoneNumber: string;
	email?: string;
	seats: BookedSeatDto[];
	totalAmount: number;
	notes?: string;
	paymentMethod?: string;
	bookedBy: number;
}

// Create Booking Response
export interface CreateBookingResponse {
	success: boolean;
	message: string;
	booking: Booking;
}

// Update Booking DTO
export interface UpdateBookingDto {
	bookingStatus?: BookingStatusEnum;
	entryStatus?: EntryStatusEnum;
	notes?: string;
	paymentMethod?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
	success: boolean;
	data: T;
	message?: string;
	error?: string;
}

// Booking List Response
export interface BookingListResponse {
	bookings: Booking[];
	total: number;
	page: number;
	limit: number;
}

// Session-based Seat Selection Interfaces
export interface SessionSeatOccupancyResponse {
	occupiedSeats: BookingSeat[]; // Confirmed bookings and other sessions' selections
	sessionSeats: BookingSeat[]; // Current session's selected seats
}
export interface SessionSeatInfo {
	seatId: number;
	sessionId: string;
	selectedAt: string;
	expiresAt: string;
	deviceType?: string; // "mobile", "tablet", "desktop"
	operatingSystem?: string; // "android", "ios", "windows", etc.
	country?: string; // "United States", "India", etc.
	city?: string; // "New York", "Mumbai", etc.
}

export interface SessionSeatResponse {
	selectedSeats: SessionSeatInfo[];
	sessionId: string;
	expiresAt: string | null;
	timeoutSeconds: number;
	totalSelected: number;
}

export interface BookingInfo {
	id: number;
	status: string;
	expiresAt: string;
	seats: { seatId: number }[];
}

export interface SeatSelectionResponse {
	success: boolean;
	seatId: number;
	sessionId: string;
	occupiedSeats: BookingSeat[];
	selectedSeat: BookingSeat[];
}

export interface SeatConflictResponse {
	statusCode: 409;
	message: string;
	seatId: number;
	sessionId: string;
	occupiedSeats: BookingSeat[];
}

export interface SessionInitResponse {
	sessionId: string;
	screeningId: number;
	occupiedSeats: SessionSeatOccupancyResponse;
	timeoutSeconds: number;
	message: string;
}

export interface CleanupResponse {
	message: string;
	count: number;
	sessionId: string;
}

export interface SeatSelectionDto {
	seatId: number;
	screeningId: number;
	deviceType: string; // "mobile", "tablet", "desktop"
	operatingSystem: string; // "android", "ios", "windows", etc.
	country: string; // "United States", "India", etc.
	city: string; // "New York", "Mumbai", etc.
	bookedBy?: number;
}

export interface UpdateUserDetailsDto {
	name: string;
	email: string;
	phoneNumber: string;
	notes?: string;
}

// Payment Success Response
export interface PaymentSuccessResponse {
	success: boolean;
	message: string;
	booking: any;
	transaction: any;
}
