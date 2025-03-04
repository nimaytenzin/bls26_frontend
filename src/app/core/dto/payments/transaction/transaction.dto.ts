export interface TransactionDTO {
    id: number;
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
