import {
    INVOICETRANSACTIONMODES,
    INVOICETRANSACTIONTYPES,
} from 'src/app/core/constants/enums';

export interface CreateTransactionDTO {
    invoiceId: number;
    transactionType: string;
    paymentMode: string;
    transactionAmount: number;
    transactionRef: string;

    senderName: string;
    senderPhoneNumber: number;
    senderBankName: string;
    senderAccountName: string;
    senderAccountNumber: string;

    receiverName: string;
    receiverPhoneNumber: number;
    recieverBankName: string;
    receiverAccountName: string;
    receiverAccountNumber: string;

    transactionDate: string;
}
