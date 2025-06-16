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
	screening?: any; // Reference to Screening entity
	createdAt?: Date;
	updatedAt?: Date;
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
	id: number;
	uuid: string;
	bookingStatus: BookingStatusEnum;
	amount: number;
	message?: string;
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
