import { PaymentMode, RefundReason } from '../../constants/enums';
import { Booking } from '../booking/booking.interface';
import { PaymentStatus } from '../payment-settlement/payment-settlement.interface';

export interface PaymentTranscation {
	id: number;
	bookingId: number;
	booking?: Booking;
	paymentInstructionNumber: string;
	bfsTransactionId: string; // BFS transaction ID
	amount: number;
	currency: string;
	status: PaymentStatus;
	paymentMode: PaymentMode;
	gatewayResponseCode: string; // Gateway response code (e.g., '00' for success)
	gatewayResponseMessage: string; // Gateway response message
	gatewayResponseData: any; // Full gateway response for debugging
	bankCode: string;
	bankName: string;
	accountNumber: string; // Masked account number for reference
	sessionId: string; // User session for tracking
	customerName: string;
	customerPhone: string;
	customerEmail: string;
	initiatedAt: Date;
	processedAt: Date;
	completedAt: Date;
	expiresAt: Date; // Payment expiry time
	refundedAmount: number;
	refundReason: RefundReason;
	refundedAt: Date;
	failureReason: string; // Detailed failure reason
	retryCount: number; // Number of retry attempts
	notes: string; // Admin notes or additional comments
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date; // For soft delete
}

export interface PaymentTransactionStatistics {
	date: string;
	totalTransactions: number;
	totalAmount: number;
	totalOnline: number;
	totalOnlineAmount: number;
	totalCounter: number;
	totalCounterAmount: number;
}
