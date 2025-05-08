import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { BillingService } from '../../../core/services/billing.service';
import { Invoice } from '../../../core/models/invoice.model';

@Component({
  selector: 'app-create-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.scss']
})
export class CreateInvoiceComponent {
  @Output() invoiceCreated = new EventEmitter<void>();
	@Output() cancelled = new EventEmitter<void>();
  invoiceForm: FormGroup;

  constructor(private fb: FormBuilder, private billingService: BillingService) {
    this.invoiceForm = this.fb.group({
      childName: ['', Validators.required],
      dueDate: ['', Validators.required],
      items: this.fb.array([
        this.fb.group({
          description: ['', Validators.required],
          quantity: [1, [Validators.required, Validators.min(1)]],
          unitPrice: [0, [Validators.required, Validators.min(0)]]
        })
      ])
    });
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  addItem(): void {
    this.items.push(this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]]
    }));
  }

  removeItem(index: number): void {
    if (this.items.length > 1) this.items.removeAt(index);
  }

  getTotal(): number {
    return this.items.value.reduce((acc: number, item: any) => {
      return acc + item.quantity * item.unitPrice;
    }, 0);
  }

  onSubmit(): void {
    if (this.invoiceForm.valid) {
      const formValue = this.invoiceForm.value;
      const newInvoice: Partial<Invoice> = {
        childName: formValue.childName,
        dueDate: formValue.dueDate,
        amount: this.getTotal(),
        status: 'unpaid',
        items: formValue.items
      };

      this.billingService.createInvoice(newInvoice).subscribe(() => {
        this.invoiceCreated.emit();
        this.invoiceForm.reset();
        this.items.clear();
        this.addItem(); // reset with one item
      });
    }
  }

	onCancel(): void {
		this.cancelled.emit(); // Notifies parent to close the modal
	}
}
