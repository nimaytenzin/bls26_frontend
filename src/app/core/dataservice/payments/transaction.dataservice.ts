import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API_URL } from '../../constants/constants';
import { CreateInvoiceDTO } from '../../dto/payments/invoice/create-invoice.dto';
import { InvoiceDTO } from '../../dto/payments/invoice/invoice.dto';
import {
    PaginatedParamsOptions,
    PaginatedData,
} from '../../dto/paginated-data.dto';
import { CreateTransactionDTO } from '../../dto/payments/transaction/create-transaction.dto';

@Injectable({
    providedIn: 'root',
})
export class TransactionDataservice {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateTransaction(data: CreateTransactionDTO) {
        return this.http.post(`${this.apiUrl}/payment-transaction`, data);
    }
}
