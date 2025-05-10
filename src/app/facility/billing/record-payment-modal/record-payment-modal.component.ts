import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Payment } from '../../../core/models/payment.model';

@Component({
  selector: 'app-record-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './record-payment-modal.component.html',
  styleUrls: ['./record-payment-modal.component.scss']
})
export class RecordPaymentModalComponent {
  @Input() invoiceId!: number;
	 @Input() remainingBalance!: number;
  @Output() paymentRecorded = new EventEmitter<Payment>();
  @Output() cancelled = new EventEmitter<void>();

  paymentForm: FormGroup;

  methods = ['cash', 'card', 'bank', 'online'];
	exceedsBalance: boolean = false;

  constructor(private fb: FormBuilder) {
    this.paymentForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      method: ['cash', Validators.required],
      reference: ['']
    });
  }

	onSubmit(): void {
		const amount = this.paymentForm.value.amount;

		// ✅ Show inline message instead of alert
		if (amount > this.remainingBalance) {
			this.exceedsBalance = true;
			return;
		}

		this.exceedsBalance = false;

		if (this.paymentForm.valid) {
			const payment: Payment = {
				id: 0,
				invoiceId: this.invoiceId,
				...this.paymentForm.value
			};
			this.paymentRecorded.emit(payment);
		}
	}

  onCancel(): void {
    this.cancelled.emit();
  }

	ngOnInit(): void {
		this.paymentForm.get('amount')?.valueChanges.subscribe(() => {
			this.exceedsBalance = false;
		});
	}
}
