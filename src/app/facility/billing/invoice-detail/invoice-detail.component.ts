import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../../../core/models/invoice.model';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ICONS } from '../../../shared/services/icon';
import { ViewChild } from '@angular/core';
import { PaymentHistoryComponent } from '../payment-history/payment-history.component';
import { RecordPaymentModalComponent } from '../record-payment-modal/record-payment-modal.component';
import { Payment } from '../../../core/models/invoice.model';
import { BillingService } from '../../../core/services/billing.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
		CommonModule,
		FormsModule,
		FontAwesomeModule,
		PaymentHistoryComponent,
		RecordPaymentModalComponent,
	],
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.scss']
})
export class InvoiceDetailComponent implements OnInit {
  @Input() invoice!: Invoice;
  @Input() onClose!: () => void;
  @Output() invoiceUpdated = new EventEmitter<Invoice>();
	@ViewChild(PaymentHistoryComponent) paymentHistoryComponent!: PaymentHistoryComponent;

  editMode = false;
	showPaymentModal = false;
	showPaymentHistory = true;

	payments: Payment[] = [];
	totalPaid: number = 0;
	remainingBalance: number = 0;

	icons = ICONS;

	constructor(private billingService: BillingService) {}

	ngOnInit(): void {
		this.loadPayments(); // ✅ initial load when invoice detail opens
	}

  getTotal(): number {
    return this.invoice.items?.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0) || 0;
  }

  toggleEdit(): void {
    this.editMode = !this.editMode;
  }

  saveChanges(): void {
    this.editMode = false;
    this.invoice.amount = this.getTotal();
    this.invoiceUpdated.emit(this.invoice);
  }
	downloadPDF(): void {
		const doc = new jsPDF();

		// Title
		doc.setFontSize(18);
		doc.text('Invoice', 105, 20, { align: 'center' });

		// Invoice Info
		doc.setFontSize(12);
		const invoiceYStart = 35;
		doc.text(`Invoice ID: ${this.invoice.id}`, 14, invoiceYStart);
		doc.text(`Child Name: ${this.invoice.childName}`, 14, invoiceYStart + 7);
		doc.text(`Due Date: ${new Date(this.invoice.dueDate).toLocaleDateString()}`, 14, invoiceYStart + 14);
		doc.text(`Status: ${this.invoice.status}`, 14, invoiceYStart + 21);

		// Items Table
		const itemsTable = this.invoice.items?.map(item => [
			item.description,
			item.quantity.toString(),
			`$${item.unitPrice.toFixed(2)}`,
			`$${(item.unitPrice * item.quantity).toFixed(2)}`
		]) || [];

		autoTable(doc, {
			startY: invoiceYStart + 30,
			head: [['Description', 'Quantity', 'Unit Price', 'Subtotal']],
			body: itemsTable,
			theme: 'grid',
			headStyles: { fillColor: [66, 112, 244], halign: 'left' },
			styles: { fontSize: 10 }
		});

		// Payment Summary
		const summaryStartY = (doc as any).lastAutoTable.finalY + 10;
		doc.setFontSize(12);
		doc.text(`Total Amount: $${this.getTotal().toFixed(2)}`, 14, summaryStartY);
		doc.text(`Total Paid: $${this.totalPaid.toFixed(2)}`, 14, summaryStartY + 7);
		doc.text(`Remaining Balance: $${this.remainingBalance.toFixed(2)}`, 14, summaryStartY + 14);

		// Payment History Table
		const allPayments = [...this.payments]; // assumes this.payments includes all (including voided)
		if (allPayments.length > 0) {
			const paymentTable = allPayments.map(p => [
				new Date(p.date).toLocaleDateString(),
				p.method,
				`$${p.amount.toFixed(2)}`,
				p.reference || '',
				p.deleted ? 'Voided' : ''
			]);

			autoTable(doc, {
				startY: summaryStartY + 24,
				head: [['Date', 'Method', 'Amount', 'Reference', 'Status']],
				body: paymentTable,
				theme: 'striped',
				headStyles: { fillColor: [90, 90, 90] },
				styles: { fontSize: 9 },
				didParseCell: (data) => {
					if (data.section === 'body') {
						const rowData = data.row.raw as string[];
						if (rowData[4] === 'Voided') {
							data.cell.styles.textColor = [160, 160, 160];
							data.cell.styles.fontStyle = 'italic';
						}
					}
				}
			});
		} else {
			doc.setFontSize(10);
			doc.text('No payments recorded.', 14, summaryStartY + 24);
		}

		// Save PDF
		doc.save(`invoice-${this.invoice.id}.pdf`);
	}

	addItem(): void {
		this.invoice.items!.push({
			description: '',
			quantity: 1,
			unitPrice: 0
		});
	}

	removeItem(index: number): void {
		if (this.invoice.items!.length > 1) {
			this.invoice.items!.splice(index, 1);
		}
	}

	refreshPayments(): void {
		this.showPaymentHistory = false;
		setTimeout(() => (this.showPaymentHistory = true), 0);
	}


	onPaymentRecorded(payment: Payment): void {
		this.billingService.recordPayment(payment).subscribe(() => {
			this.showPaymentModal = false;

			// ✅ Trigger reload of the payment history
			if (this.paymentHistoryComponent) {
				this.paymentHistoryComponent.loadPayments();
			}
		});
	}

	loadPayments(): void {
		this.billingService.fetchPayments(this.invoice.id).subscribe(data => {
			// ✅ Only include non-deleted payments
			this.payments = data.filter(p => !p.deleted);

			this.totalPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);
			this.remainingBalance = this.invoice.amount - this.totalPaid;
		});
	}

}
