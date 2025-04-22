import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-facility-modal',
	standalone: false,
  templateUrl: './facility-modal.component.html',
  styleUrls: ['./facility-modal.component.scss']
})
export class FacilityModalComponent implements OnChanges {
  @Input() data: any = null; // Can be facility data or null
  @Input() show = false;
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  facilityForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.facilityForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      location: ['', Validators.required]
    });
  }

  ngOnChanges(): void {
    if (this.data) {
      this.facilityForm.patchValue(this.data);
    } else {
      this.facilityForm.reset();
    }
  }

  onSave(): void {
    if (this.facilityForm.valid) {
      const cleanedData = Object.fromEntries(
        Object.entries(this.facilityForm.value).map(([key, value]) => [
          key,
          typeof value === 'string' ? value.trim() : value
        ])
      );
      this.save.emit(cleanedData);
    } else {
      this.facilityForm.markAllAsTouched();
    }
  }
 
  onCancel(): void {
    this.cancel.emit();
  }
}
