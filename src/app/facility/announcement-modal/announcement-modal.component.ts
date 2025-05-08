import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Announcement } from '../../core/models/announcement.model';

@Component({
  selector: 'app-announcement-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './announcement-modal.component.html',
  styleUrls: ['./announcement-modal.component.scss']
})
export class AnnouncementModalComponent implements OnChanges {
  @Input() show: boolean = false;
  @Input() announcement: Announcement | null | undefined;

  @Output() close = new EventEmitter<void>();
  @Output() post = new EventEmitter<Announcement>();

  newAnnouncement: Announcement = {
    title: '',
    message: '',
    date: '',
    type: 'announcement',
    imageUrls: [],
    visibility: 'all'
  };

  imagePreviews: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['announcement']) {
      if (this.announcement) {
        this.newAnnouncement = { ...this.announcement };
        this.imagePreviews = [...(this.announcement.imageUrls || [])];
      } else {
        this.resetForm();
      }
    }
  }

  onFileChange(event: any): void {
    const files: FileList = event.target.files;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.imagePreviews.push(result);
        this.newAnnouncement.imageUrls!.push(result);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.imagePreviews.splice(index, 1);
    this.newAnnouncement.imageUrls!.splice(index, 1);
  }

  submit(): void {
    if (
      this.newAnnouncement.title.trim() &&
      this.newAnnouncement.message.trim() &&
      this.newAnnouncement.date
    ) {
      this.post.emit(this.newAnnouncement);
      this.close.emit();
      this.resetForm();
    }
  }

  onCancel(): void {
    this.close.emit();
    this.resetForm();
  }

  private resetForm(): void {
    this.newAnnouncement = {
      title: '',
      message: '',
      date: '',
      type: 'announcement',
      imageUrls: [],
      visibility: 'all'
    };
    this.imagePreviews = [];
  }
}
