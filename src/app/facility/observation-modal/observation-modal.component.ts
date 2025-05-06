import {
  Component, Input, Output, EventEmitter, OnChanges
} from '@angular/core';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-observation-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './observation-modal.component.html',
  styleUrls: ['./observation-modal.component.scss']
})
export class ObservationModalComponent implements OnChanges {
  @Input() show = false;
  @Input() data: any = null;
  @Input() children: { id: string; name: string; avatarUrl: string }[] = [];

  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  mediaPreview: string[] = [];
  availableOutcomes = ['Identity', 'Wellbeing', 'Learning', 'Communication'];
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link']
    ]
  };

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      childId: ['', Validators.required],
      outcomes: [[], Validators.required],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      description: ['', Validators.required],
      visibility: ['internal', Validators.required],
      media: [null]
    });
  }

  ngOnChanges(): void {
    if (this.data) {
      this.form.patchValue(this.data);
      this.mediaPreview = this.data.mediaUrls || [];
    } else {
      this.form.reset({ visibility: 'internal', outcomes: [], date: new Date().toISOString().substring(0, 10) });
      this.mediaPreview = [];
    }
  }

  toggleOutcome(outcome: string): void {
    const outcomes = this.form.value.outcomes;
    const index = outcomes.indexOf(outcome);
    if (index > -1) {
      outcomes.splice(index, 1);
    } else {
      outcomes.push(outcome);
    }
    this.form.patchValue({ outcomes });
  }

  onFileChange(event: any): void {
    const files: FileList = event.target.files;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => this.mediaPreview.push(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeMedia(index: number): void {
    this.mediaPreview.splice(index, 1);
  }

  onSubmit(): void {
    if (this.form.valid) {
      const data = {
        ...this.form.value,
        mediaUrls: this.mediaPreview
      };
      this.save.emit(data);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
