import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Payment } from '../../../core/models/payment.model';

@Component({
  selector: 'app-delete-payment-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-payment-modal.component.html',
  styleUrls: ['./delete-payment-modal.component.scss']
})
export class DeletePaymentModalComponent {
  @Input() payment!: Payment;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  confirmDelete(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
