import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API_URL } from '../../constants/constants';
import { CreateInvoiceDTO } from '../../dto/payments/invoice/create-invoice.dto';
import { InvoiceDTO } from '../../dto/payments/invoice/invoice.dto';
// import { LeaseAgreementDTO } from '../lease/lease-agreement.dto';
import {
    PaginatedParamsOptions,
    PaginatedData,
} from '../../dto/paginated-data.dto';
import {
    ClientAERequestDto,
    ClientArRequestDto,
    ClientDRRequestDto,
    PG_ACMessage,
    PG_ECMessage,
    PG_RCMessage,
} from '../../dto/rma-pg/rma.pg.dto';

@Injectable({
    providedIn: 'root',
})
export class RMAPGDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    //send Authoriztion Request (AR) and get Request confirmation (RC) Message with bank list and txn Id
    SendAuthorizationRequest(
        data: ClientArRequestDto
    ): Observable<PG_RCMessage> {
        return this.http.post<PG_RCMessage>(
            `${this.apiUrl}/pg-transaction/ar-request`,
            data
        );
    }

    // Send Account Enquiry Request(AE) and get Enquiry Confirmation message(EC)
    SendAccountDetails(data: ClientAERequestDto): Observable<PG_ECMessage> {
        return this.http.post<PG_ECMessage>(
            `${this.apiUrl}/pg-transaction/send-account`,
            data
        );
    }

    // Send Debit  Request(DR) and get Authorization Confirmation message(AC) which is the final acknowledgement
    SendOtp(data: ClientDRRequestDto): Observable<PG_ACMessage> {
        return this.http.post<PG_ACMessage>(
            `${this.apiUrl}/pg-transaction/send-otp`,
            data
        );
    }
}
