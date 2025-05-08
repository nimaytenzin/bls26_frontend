import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice, Payment, Package } from '../models/invoice.model';


@Injectable({ providedIn: 'root' })
export class BillingService {
  private baseUrl = 'http://localhost:3000'; // if using json-server

  constructor(private http: HttpClient) {}

  fetchInvoices() {
    return this.http.get<Invoice[]>(`${this.baseUrl}/invoices`);
  }

  createInvoice(data: Partial<Invoice>) {
    return this.http.post(`${this.baseUrl}/invoices`, data);
  }

  getInvoiceDetails(id: number) {
    return this.http.get<Invoice>(`${this.baseUrl}/invoices/${id}`);
  }

	fetchPayments(invoiceId: number): Observable<Payment[]> {
		return this.http.get<Payment[]>(`${this.baseUrl}/payments?invoiceId=${invoiceId}`);
	}

  recordPayment(payment: Payment) {
    return this.http.post(`${this.baseUrl}/payments`, payment);
  }

  fetchBillingSummary() {
    return this.http.get(`${this.baseUrl}/summary`);
  }

	updateInvoice(invoice: Invoice) {
		return this.http.put<Invoice>(`${this.baseUrl}/invoices/${invoice.id}`, invoice);
	}

	voidInvoice(id: number) {
		return this.http.patch(`/api/billing/invoices/${id}`, { status: 'voided' });
	}

	updatePayment(payment: Payment) {
		return this.http.put<Payment>(`${this.baseUrl}/payments/${payment.id}`, payment);
	}

}
