import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-post-activity-modal',
  standalone: false,
  templateUrl: './post-activity-modal.component.html',
  styleUrls: ['./post-activity-modal.component.scss'],
})
export class PostActivityModalComponent {
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() post = new EventEmitter<any>();

  activity = {
    title: '',
    description: '',
    date: '',
    location: '',
  };
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

  onSubmit(): void {
    const newActivity = {
      ...this.activity,
      imageUrl: this.imagePreview,
    };
    this.post.emit(newActivity);
    this.resetForm();
  }

  onCancel(): void {
    this.close.emit();
  }

  resetForm(): void {
    this.activity = {
      title: '',
      description: '',
      date: '',
      location: '',
    };
    this.selectedImageFile = null;
    this.imagePreview = null;
  }
}