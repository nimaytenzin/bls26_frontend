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
import {
    CreatePaymentAdviceDto,
    GenerateBuildingPADto,
    PaymentAdviceDto,
    ReceivePaymentDTO,
} from '../../dto/payments/payment-advice.dto';
import { UnitDTO } from '../../dto/units/unit.dto';
import { PaymentReceiptDTO } from '../../dto/payments/payment-receipt-dto';

@Injectable({
    providedIn: 'root',
})
export class PaymentReceiptDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    FindOne(adviceId: number): Observable<PaymentReceiptDTO> {
        return this.http.get<PaymentReceiptDTO>(
            `${this.apiUrl}/payment-receipt/${adviceId}`
        );
    }
}
