import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-post-activity-modal',
  standalone: false,
  templateUrl: './post-activity-modal.component.html',
  styleUrls: ['./post-activity-modal.component.scss'],
})
export class PostActivityModalComponent {
  @Input() show: boolean = false; // Controls modal visibility
  @Output() close = new EventEmitter<void>(); // Emits when the modal is closed
  @Output() post = new EventEmitter<any>(); // Emits the activity data when posted

  activity: any = {
    title: '',
    description: '',
    location: '',
    imageUrls: [],
  };

  handleFileSelection(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const reader = new FileReader();
        reader.onload = () => {
          this.activity.imageUrls.push(reader.result as string); // Add the image as a base64 string
        };
        reader.readAsDataURL(file);
      }
    }
  }

  postActivity(): void {
    this.post.emit(this.activity); // Emit the activity data
    this.resetForm(); // Reset the form after posting
  }

  private resetForm(): void {
    this.activity = {
      title: '',
      description: '',
      location: '',
      imageUrls: [],
    };
  }
}