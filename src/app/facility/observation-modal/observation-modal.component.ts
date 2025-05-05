import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observation } from '../../core/models/observation.model';

@Component({
  selector: 'app-observation-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './observation-modal.component.html',
  styleUrls: ['./observation-modal.component.scss']
})
export class ObservationModalComponent implements OnChanges {
  @Input() show = false;
  @Input() data: Observation | null = null;
  @Output() save = new EventEmitter<Observation>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  availableOutcomes = ['Identity', 'Wellbeing', 'Learning', 'Communication'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      childId: ['', Validators.required],
      outcomes: [[], Validators.required],
      description: ['', Validators.required],
      visibility: ['internal', Validators.required],
      media: [null]
    });
  }

  ngOnChanges(): void {
    if (this.data) {
      this.form.patchValue(this.data);
    } else {
      this.form.reset({ visibility: 'internal', outcomes: [] });
    }
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    this.form.patchValue({ media: file });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const { media, ...cleaned } = this.form.value;
      this.save.emit(cleaned);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
