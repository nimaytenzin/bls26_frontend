import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Facilitator } from '../../core/services/facilitator.service';

@Component({
  selector: 'app-facilitator-modal',
  standalone: false,
  templateUrl: './facilitator-modal.component.html',
  styleUrls: ['./facilitator-modal.component.scss'],
})
export class FacilitatorModalComponent {
  @Input() show: boolean = false; // Add the `show` property
  @Input() facilitator: Partial<Facilitator> = {}; // Ensure `facilitator` is defined
  @Output() save = new EventEmitter<Partial<Facilitator>>();
  @Output() close = new EventEmitter<void>();

  selectedImageFile: File | null = null; // Store the selected image file

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImageFile = input.files[0];
      console.log('Selected Image File:', this.selectedImageFile.name);
    }
  }

  onSave(): void {
    if (this.selectedImageFile) {
      // Handle the file upload logic here (e.g., send it to the server)
      console.log('Uploading file:', this.selectedImageFile);
    }
    this.save.emit(this.facilitator);
  }

  onCancel(): void {
    this.close.emit();
  }
}