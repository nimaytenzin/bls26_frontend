import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Payment } from '../../../core/models/invoice.model';

@Component({
  selector: 'app-edit-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-payment-modal.component.html',
  styleUrls: ['./edit-payment-modal.component.scss']
})
export class EditPaymentModalComponent {
  @Input() payment!: Payment;
  @Output() paymentUpdated = new EventEmitter<Payment>();
  @Output() cancelled = new EventEmitter<void>();

  methods = ['cash', 'card', 'bank', 'online'];

  save(): void {
    this.paymentUpdated.emit(this.payment);
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
