import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Payment } from '../../../core/models/payment.model';
import { BillingService } from '../../../core/services/billing.service';
import { ICONS } from '../../../shared/constants/icon.constants';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EditPaymentModalComponent } from '../edit-payment-modal/edit-payment-modal.component';
import { DeletePaymentModalComponent } from '../delete-payment-modal/delete-payment-modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [
		CommonModule,
		FormsModule,
		FontAwesomeModule,
		EditPaymentModalComponent,
		DeletePaymentModalComponent
	],
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss']
})
export class PaymentHistoryComponent implements OnInit {
  @Input() invoiceId!: number;
  payments: Payment[] = [];

	icons = ICONS;

	editingPayment: Payment | null = null;
	showEditModal = false;

	showDeleteModal = false;
	deletingPayment: Payment | null = null;

	showDeleted = false;


  constructor(private billingService: BillingService) {}

  ngOnInit(): void {
    this.loadPayments();
  }

	loadPayments(): void {
		this.billingService.fetchPayments(this.invoiceId).subscribe(data => {
			this.payments = this.showDeleted
				? data
				: data.filter(p => !p.deleted);
		});
	}

	toggleEdit(payment: Payment): void {
		this.editingPayment = { ...payment };
		this.showEditModal = true;
	}

	saveEditedPayment(updated: Payment): void {
		this.billingService.updatePayment(updated).subscribe(() => {
			this.showEditModal = false;
			this.loadPayments();
		});
	}

	confirmDelete(payment: Payment): void {
		this.deletingPayment = payment;
		this.showDeleteModal = true;
	}

	handleDeleteConfirmed(): void {
		if (!this.deletingPayment) return;

		const updated = { ...this.deletingPayment, deleted: true };
		this.billingService.updatePayment(updated).subscribe(() => {
			this.showDeleteModal = false;
			this.deletingPayment = null;
			this.loadPayments(); // ✅ Reload to update table & totals
		});
	}
}
