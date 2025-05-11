import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime } from 'rxjs/operators';
import { Announcement } from '../../core/models/announcement.model';
import { AnnouncementService } from '../../core/services/announcement.service';
import { AuthService } from '../../auth/auth.service';
import { ICONS } from '../../shared/constants/icon.constants';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AnnouncementModalComponent } from '../announcement-modal/announcement-modal.component';

@Component({
  selector: 'app-announcement-events',
  standalone: true,
  templateUrl: './announcement-events.component.html',
  styleUrls: ['./announcement-events.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    AnnouncementModalComponent
  ]
})
export class AnnouncementEventsComponent implements OnInit {
  announcements: Announcement[] = [];
  grouped: { [range: string]: Announcement[] } = {};
  showModal = false;
  selectedTab: 'announcement' | 'event' = 'announcement';
  filterDateRange: 'all' | 'today' | 'thisWeek' = 'all';
  searchControl = new FormControl('');
  currentUser = '';
  isOwner = true;
  editingAnnouncement: Announcement | null = null;
  icons = ICONS;

  selectedImage: string | null = null;
  lightboxImages: string[] = [];
  lightboxIndex: number = 0;

  constructor(
    private announcementService: AnnouncementService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUser = user?.email || '';
    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(() => this.loadData());
    this.loadData();
  }

  loadData(): void {
    this.announcementService.fetchAnnouncements().subscribe(data => {
      const term = this.searchControl.value?.toLowerCase() || '';
      const filtered = data
        .filter(a => a.type === this.selectedTab)
        .filter(a =>
          term === '' ||
          a.title.toLowerCase().includes(term) ||
          a.message.toLowerCase().includes(term)
        );
      this.announcements = filtered;
      this.groupAnnouncementsByDate();
    });
  }

  selectTab(tab: 'announcement' | 'event') {
    this.selectedTab = tab;
    this.loadData();
  }

  groupAnnouncementsByDate() {
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - 7);
    this.grouped = { Today: [], 'This Week': [], Earlier: [] };
    for (const ann of this.announcements) {
      const annDate = new Date(ann.date);
      if (annDate.toDateString() === today.toDateString()) {
        this.grouped['Today'].push(ann);
      } else if (annDate > thisWeekStart) {
        this.grouped['This Week'].push(ann);
      } else {
        this.grouped['Earlier'].push(ann);
      }
    }
  }

  openModal(): void {
    this.editingAnnouncement = null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  handlePost(post: Announcement): void {
    const save$ = this.editingAnnouncement
      ? this.announcementService.updateAnnouncement(this.editingAnnouncement.id!, post)
      : this.announcementService.addAnnouncement({ ...post, createdBy: this.currentUser });
    save$.subscribe(() => {
      this.closeModal();
      this.loadData();
    });
  }

  likePost(announcement: Announcement): void {
    const userId = this.currentUser;
    const updatedLikes = announcement.likes?.includes(userId)
      ? announcement.likes!.filter(uid => uid !== userId)
      : [...(announcement.likes || []), userId];
    this.announcementService.updateAnnouncement(announcement.id!, { likes: updatedLikes })
      .subscribe(() => this.loadData());
  }

  deletePost(id: number): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.announcementService.deleteAnnouncement(id).subscribe(() => this.loadData());
    }
  }

  startEdit(announcement: Announcement): void {
    this.editingAnnouncement = announcement;
    this.showModal = true;
  }

  addComment(announcement: Announcement, commentText: string): void {
    const comment = {
      user: this.currentUser,
      text: commentText,
      date: new Date().toISOString()
    };
    const updatedComments = [...(announcement.comments || []), comment];
    this.announcementService.updateAnnouncement(announcement.id!, { comments: updatedComments })
      .subscribe(() => this.loadData());
  }

  openLightbox(imageUrls: string[], index: number): void {
    this.lightboxImages = imageUrls;
    this.lightboxIndex = index;
    this.selectedImage = imageUrls[index];
  }

  closeLightbox(): void {
    this.selectedImage = null;
    this.lightboxImages = [];
    this.lightboxIndex = 0;
  }

  nextImage(): void {
    if (this.lightboxIndex < this.lightboxImages.length - 1) {
      this.lightboxIndex++;
      this.selectedImage = this.lightboxImages[this.lightboxIndex];
    }
  }

  prevImage(): void {
    if (this.lightboxIndex > 0) {
      this.lightboxIndex--;
      this.selectedImage = this.lightboxImages[this.lightboxIndex];
    }
  }
}
