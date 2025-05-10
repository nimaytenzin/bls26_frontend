import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators} from '@angular/forms';
import { BillingService } from '../../../core/services/billing.service';
import { Invoice } from '../../../core/models/invoice.model';
import { ChildService } from '../../../core/services/child.service';
import { Child } from '../../../core/models/child.model';

@Component({
  selector: 'app-create-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.scss']
})
export class CreateInvoiceComponent implements OnInit {
  @Output() invoiceCreated = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  invoiceForm: FormGroup;
  children: Child[] = [];

	isRecurring: boolean = false;
	recurrencePattern: 'weekly' | 'monthly' = 'monthly';

  constructor(
    private fb: FormBuilder,
    private billingService: BillingService,
    private childService: ChildService
  ) {
		this.invoiceForm = this.fb.group({
			childId: [null, Validators.required],
			dueDate: ['', Validators.required],
			isRecurring: [false], // ✅ Add this
			recurrencePattern: ['monthly'], // ✅ Add this (or leave empty string as default)
			items: this.fb.array([this.createItemGroup()])
		});
  }

  ngOnInit(): void {
    this.childService.getChildren().subscribe(data => {
      this.children = data;
    });
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  createItemGroup(): FormGroup {
    return this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]]
    });
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  getTotal(): number {
    return this.items.value.reduce(
      (acc: number, item: any) => acc + item.quantity * item.unitPrice,
      0
    );
  }

	getChildName(childId: number): string {
		const child = this.children.find(c => c.id === String(childId));
		return child ? child.name : '';
	}

  onSubmit(): void {
    if (this.invoiceForm.valid) {
      const formValue = this.invoiceForm.value;
      const selectedChild = this.children.find(c => c.id === formValue.childId);

			const newInvoice: Partial<Invoice> = {
				childId: formValue.childId,
				childName: this.getChildName(formValue.childId), // assuming method or map
				dueDate: formValue.dueDate,
				amount: this.getTotal(),
				status: 'unpaid',
				items: formValue.items,
				isRecurring: formValue.isRecurring,
				recurrencePattern: formValue.recurrencePattern,
				nextDueDate: formValue.isRecurring ? formValue.dueDate : undefined
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
    this.cancelled.emit();
  }
}
