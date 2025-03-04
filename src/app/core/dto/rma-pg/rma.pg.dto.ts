export interface ClientArRequestDto {
    amount: number;
    paymentAdviceIds: number[];
}

export interface PG_RCMessage {
    bfs_bfsTxnId: string;
    bfs_responseDesc: string;
    bfs_bankList: PG_Bank[];
    bfs_responseCode: string;
    bfs_msgType: string;
}

export interface ClientAERequestDto {
    transactionId: string;
    bankCode: string;
    accountNumber: string;
}

export interface PG_ECMessage {
    bfs_bfsTxnId: string;
    bfs_responseDesc: string;
    bfs_responseCode: string;
    bfs_msgType: string;
}

export interface ClientDRRequestDto {
    transactionId: string;
    otp: string;
    paymentAdviceId: number;
}

export interface PG_Bank {
    bankCode: string;
    bankName: string;
    status: string;
}

export interface PG_ACMessage {
    bfs_bfsTxnId: string;
    bfs_bfsTxnTime: string;
    bfs_debitAuthCode: string;
    bfs_debitAuthNo: string;
    bfs_orderNo: string;
    bfs_txnAmount: string;
}
