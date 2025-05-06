import { Component, EventEmitter, Output } from '@angular/core';
import { Announcement } from '../../core/services/announcement.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Input } from '@angular/core';

@Component({
  selector: 'app-announcement-modal',
  standalone: true,
  templateUrl: './announcement-modal.component.html',
  styleUrls: ['./announcement-modal.component.scss'],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class AnnouncementModalComponent {
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() post = new EventEmitter<Announcement>();

  newAnnouncement: Announcement = {
    title: '',
    message: '',
    date: '',
    type: 'announcement',
    imageUrl: ''
  };

  imagePreview: string | null = null;

  onFileChange(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.newAnnouncement.imageUrl = this.imagePreview;
      };
      reader.readAsDataURL(file);
    }
  }

  submit(): void {
    if (
      this.newAnnouncement.title.trim() &&
      this.newAnnouncement.message.trim() &&
      this.newAnnouncement.date
    ) {
      this.post.emit(this.newAnnouncement);
      this.close.emit();
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}
