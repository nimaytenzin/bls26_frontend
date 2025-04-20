import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-facility-modal',
	standalone: false,
  templateUrl: './facility-modal.component.html',
  styleUrls: ['./facility-modal.component.scss']
})
export class FacilityModalComponent {
  @Input() show = false;
  @Input() data: any = null;
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
    }
  }

  onSave(): void {
    if (this.facilityForm.valid) {
      this.save.emit(this.facilityForm.value);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
