import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnnouncementService } from '../../core/services/announcement.service';
import { Announcement } from '../../core/models/annoucement.model';
import { AnnouncementModalComponent } from '../announcement-modal/announcement-modal.component';

@Component({
  selector: 'app-announcement-events',
  standalone: true,
  imports: [
    CommonModule, 
    AnnouncementModalComponent
  ],
  templateUrl: './announcement-events.component.html',
  styleUrls: ['./announcement-events.component.scss']
})
export class AnnouncementEventsComponent implements OnInit {
  groupedAnnouncements: { [key: string]: Announcement[] } = {};
  showModal = false;

  constructor(private announcementService: AnnouncementService) {}

  ngOnInit(): void {
    this.fetchAndGroup();
  }

  fetchAndGroup(): void {
    this.announcementService.fetchAnnouncements().subscribe(data => {
      const sorted = [...data].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      this.groupedAnnouncements = sorted.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
      }, {} as { [key: string]: Announcement[] });
    });
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  handlePost(newItem: Announcement): void {
    this.announcementService.addAnnouncement(newItem).subscribe(() => {
      this.closeModal();
      this.fetchAndGroup();
    });
  }
}
