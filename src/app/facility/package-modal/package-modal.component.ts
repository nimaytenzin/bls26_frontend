import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Package } from '../../core/services/package.service';

@Component({
  selector: 'app-package-modal',
  standalone: false,
  templateUrl: './package-modal.component.html',
  styleUrls: ['./package-modal.component.scss']
})
export class PackageModalComponent implements OnChanges {
  @Input() show = false;
  @Input() data: Partial<Package> | null = null;
  @Output() save = new EventEmitter<Partial<Package>>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.form.patchValue({
        name: this.data.name || '',
        description: this.data.description || '',
        price: this.data.price ?? 0
      });
    }

    if (changes['show'] && !this.show) {
      this.form.reset();
    }
  }

  onSave(): void {
    if (this.form.valid) {
      const trimmedData: Partial<Package> = {
        name: this.form.value.name.trim(),
        description: this.form.value.description.trim(),
        price: this.form.value.price
      };
      this.save.emit(trimmedData);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
