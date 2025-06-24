import { Booking } from '../booking/booking.interface';

// Enums
export enum PaymentStatus {
	PAID = 'PAID',
	ERROR = 'ERROR',
	TIMEDOUT = 'TIMEDOUT',
	PROCESSING = 'PROCESSING',
}

// Request DTOs
export interface ClientInitiatePaymentDTO {
	amount: number;
	bookingId: string;
}
// Request DTOs
export interface ClientInitiatePaymentUseSessionDTO {
	screeningId: number;
	sessionId: string;
}

export interface ZPS_InitiatePaymentDTO {
	transactionRef: number;
	amount: number;
	paymentTitle: string;
	paymentDescription: string;
	beneficiaryAccountName: string;
	beneficiaryAccountNumber: string;
	beneficiaryBankName: string;
	beneficiaryBankCode: string;
}

export interface ARRequestDTO {
	amount: number;
	paymentInstructionNumber: string;
}

export interface AERequestDTO {
	bfsTransactionId: string;
	bankCode: string;
	accountNumber: string;
}

export interface DRRequestDTO {
	bfsTransactionId: string;
	otp: string;
}

export interface ZPS_PGTransactionDTO {
	transactionRef: string;
	paymentInstructionNumber: string;
	paymentTitle: string;
	paymentDescription: string;
	bfsTxnId: string;
	bfsBenfTxnTime: string;
	statusCode: string;
	amount: number;
	status: PaymentStatus;
	userId: number;
	remitterAccount?: string;
	remitterBank?: string;
	beneficiaryAccountName: string;
	beneficiaryAccountNumber: number;
	beneficiaryBankName: string;
	beneficiaryBankCode: string;
	arResponse?: string;
}

// Response DTOs
export interface PaymentInitiationResponseDTO {
	paymentInstructionNumber: string;
	bfsTransactionId: string;
	amount: number;
	bankList: PGBank[];
}

export interface ClientECMessage {
	status: string;
}

export interface ClientDebitSuccessDTO {
	statusCode: string;
	booking: Booking;
	transaction: PaymentTransaction;
}

// Bank and Transaction Models
export interface PGBank {
	code: any;
	bankCode: string;
	bankName: string;
	status: string;
}

export interface PaymentTransaction {
	id: number;
	bookingId: number;
	amount: number;
	paymentMode: string;
	status: string;
	gatewayTransactionId?: string;
	paymentInstructionNumber?: string;
	bfsTransactionId?: string;
	customerName?: string;
	customerPhone?: string;
	customerEmail?: string;
	processedAt?: Date;
	completedAt?: Date;
	notes?: string;
	gatewayResponseCode?: string;
	gatewayResponseMessage?: string;
	gatewayResponseData?: any;
	createdAt: Date;
	updatedAt: Date;
}

// BFS Message Types
export interface RCMessage {
	bfs_bfsTxnId: string;
	bfs_responseDesc: string;
	bfs_bankList: PGBank[];
	bfs_responseCode: string;
	bfs_msgType: string;
}

export interface ECMessage {
	bfs_bfsTxnId: string;
	bfs_responseDesc: string;
	bfs_responseCode: string;
	bfs_msgType: string;
}

export interface ACMessage {
	bfs_bfsTxnId: string;
	bfs_debitAuthNo: string;
	bfs_bfsTxnTime: string;
	bfs_orderNo: string;
	bfs_debitAuthCode: string;
	bfs_txnAmount: string;
}

// Error Response
export interface ErrorResponse {
	statusCode: number;
	message: string;
	details?: any;
}

// BFS Response Utilities
export interface BFSResponseCodes {
	[key: string]: string;
}

export class BFSResponse {
	static responseCodes: BFSResponseCodes = {
		'00': 'Approved',
		'03': 'Invalid Beneficiary',
		'05': 'Beneficiary Account Closed',
		'12': 'Invalid Transaction',
		'13': 'Invalid Amount',
		'14': 'Invalid Remitter Account',
		'20': 'Invalid Response',
		'30': 'Transaction Not Supported Or Format Error',
		'45': 'Duplicate Beneficiary Order Number',
		'47': 'Invalid Currency',
		'48': 'Transaction Limit Exceeded',
		'51': 'Insufficient Funds',
		'53': 'No Savings Account',
		'57': 'Transaction Not Permitted',
		'61': 'Withdrawal Limit Exceeded',
		'65': 'Withdrawal Frequency Exceeded',
		'76': 'Transaction Not Found',
		'78': 'Decryption Failed',
		'80': 'Buyer Cancel Transaction',
		'84': 'Invalid Transaction Type',
		'85': 'Internal Error At Bank System',
		BC: 'Transaction Cancelled By Customer',
		FE: 'Internal Error',
		OA: 'Session Timeout at BFS Secure Entry Page',
		OE: 'Transaction Rejected As Not In Operating Hours',
		OF: 'Transaction Timeout',
		SB: 'Invalid Beneficiary Bank Code',
		XE: 'Invalid Message',
		XT: 'Invalid Transaction Type',
		'91': 'Unknown Error Code.Amount Deducted. Record failed to updated in BFS',
		UN: 'Unknown error',
		'55': 'Wrong OTP entered during debit request',
	};

	static getResponseDescription(code: string): string {
		return this.responseCodes[code] || 'Unknown response code';
	}

	static isSuccess(code: string): boolean {
		return code === '00'; // Only '00' indicates success
	}
}

// Client Request Interfaces
export interface ClientARRequest {
	amount: number;
	paymentAdviceIds: number[];
}

export interface ClientAERequest {
	transactionId: string;
	bankCode: string;
	accountNumber: string;
}

export interface ClientDRRequest {
	transactionId: string;
	otp: string;
}
