import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice } from '../models/invoice.model';
import { Payment } from '../models/payment.model';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private apiUrl = 'http://localhost:3000'; // if using json-server

  constructor(private http: HttpClient) {}

  fetchInvoices() {
    return this.http.get<Invoice[]>(`${this.apiUrl}/invoices`);
  }

  createInvoice(data: Partial<Invoice>) {
    return this.http.post(`${this.apiUrl}/invoices`, data);
  }

  getInvoiceDetails(id: number) {
    return this.http.get<Invoice>(`${this.apiUrl}/invoices/${id}`);
  }

	fetchPayments(invoiceId: number): Observable<Payment[]> {
		return this.http.get<Payment[]>(`${this.apiUrl}/payments?invoiceId=${invoiceId}`);
	}

  recordPayment(payment: Payment) {
    return this.http.post(`${this.apiUrl}/payments`, payment);
  }

  fetchBillingSummary() {
    return this.http.get(`${this.apiUrl}/summary`);
  }

	updateInvoice(invoice: Invoice) {
		return this.http.put<Invoice>(`${this.apiUrl}/invoices/${invoice.id}`, invoice);
	}

	voidInvoice(id: number) {
		return this.http.patch(`/api/billing/invoices/${id}`, { status: 'voided' });
	}

	updatePayment(payment: Payment) {
		return this.http.put<Payment>(`${this.apiUrl}/payments/${payment.id}`, payment);
	}

	getOverdueInvoices(): Observable<Invoice[]> {
		return this.http.get<Invoice[]>(`${this.apiUrl}/invoices`).pipe(
			map(invoices =>
				invoices.filter(inv =>
					inv.status === 'unpaid' && new Date(inv.dueDate) < new Date()
				).map(inv => ({ ...inv, status: 'overdue' }))
			)
		);
	}

	private getNextDate(pattern: 'weekly' | 'monthly', fromDate: string): string {
		const date = new Date(fromDate);
		if (pattern === 'weekly') date.setDate(date.getDate() + 7);
		else if (pattern === 'monthly') date.setMonth(date.getMonth() + 1);
		return date.toISOString().split('T')[0];
	}

	autoGenerateRecurringInvoices(): void {
		this.fetchInvoices().subscribe(invoices => {
			const today = new Date().toISOString().split('T')[0];

			invoices
				.filter(inv => inv.isRecurring && inv.nextDueDate === today)
				.forEach(inv => {
					const newInvoice: Partial<Invoice> = {
						childId: inv.childId,
						childName: inv.childName,
						dueDate: today,
						amount: inv.amount,
						status: 'unpaid' as 'unpaid',
						items: inv.items,
						isRecurring: true,
						recurrencePattern: (inv.recurrencePattern ?? 'monthly') as 'weekly' | 'monthly',
						nextDueDate: this.getNextDate(inv.recurrencePattern ?? 'monthly', today)
					};

					this.createInvoice(newInvoice).subscribe();
				});
		});
	}
}
