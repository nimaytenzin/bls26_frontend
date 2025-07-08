import { Screening } from '../screening/screening.interface';
import { Seat } from '../seat/seat.interface';

// Booking Status Enum
export enum BookingStatusEnum {
	PROCESSING = 'PROCESSING',
	FAILED = 'FAILED',
	CANCELLED = 'CANCELLED',
	SUCCESS = 'SUCCESS',
	TIMEOUT = 'TIMEOUT',
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
	bookingStatus?: BookingStatusEnum;
	entryStatus?: EntryStatusEnum;
	notes?: string;
	paymentMethod?: string;
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
export interface OccupiedSeatResponse {
	occupiedSeats: BookingSeat[]; // Confirmed bookings and other sessions' selections
	sessionSeats: BookingSeat[]; // Current session's selected seats
}
export interface SessionSeatInfo {
	seatId: number;
	sessionId: string;
	selectedAt: string;
	expiresAt: string;
	userMetadata?: UserMetadataDto;
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
	occupiedSeats: OccupiedSeatResponse;
	timeoutSeconds: number;
	message: string;
}

export interface CleanupResponse {
	message: string;
	count: number;
	sessionId: string;
}

export interface UserMetadataDto {
	userAgent?: string;
	ipAddress?: string;
	timestamp?: string;
}

export interface SeatSelectionDto {
	seatId: number;
	screeningId: number;
	userMetadata?: UserMetadataDto;
}

export interface UpdateUserDetailsDto {
	name: string;
	email: string;
	phoneNumber: string;
	notes?: string;
}

// Payment Mode Enum
export enum PaymentMode {
	ZPSS = 'ZPSS',
	CASH = 'CASH',
	CARD = 'CARD',
	ONLINE = 'ONLINE',
}

// Mock Payment DTO
export interface MockPaymentDto {
	sessionId: string;
	screeningId: number;
	paymentMode?: PaymentMode;
	gatewayTransactionId?: string;
	paymentInstructionNumber?: string;
	bfsTransactionId?: string;
	notes?: string;
}

// Payment Success Response
export interface PaymentSuccessResponse {
	success: boolean;
	message: string;
	booking: any;
	transaction: any;
}
