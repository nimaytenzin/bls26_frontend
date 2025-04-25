import { Component } from '@angular/core';

@Component({
  selector: 'app-post-activity',
  standalone: false,  
  templateUrl: './post-activity.component.html',
  styleUrls: ['./post-activity.component.scss'],
})
export class PostActivityComponent {
  activities: any[] = [
    {
      title: 'Activity 1',
      description: 'Description of activity 1',
      date: '2025-04-25',
      location: 'Location 1',
      imageUrls: ['https://via.placeholder.com/150', 'https://via.placeholder.com/150'],
      likes: 0,
      comments: [],
      showComments: false,
    },
    // Add more activities as needed
  ];

  showPostActivityModal: boolean = false;
  showCarousel: boolean = false;
  currentImage: string = '';
  currentImageIndex: number = 0;
  carouselImages: string[] = [];
  newComment: string = '';

  openPostActivityModal(): void {
    this.showPostActivityModal = true;
  }

  closePostActivityModal(): void {
    this.showPostActivityModal = false;
  }

  addActivity(activity: any): void {
    if (!activity.date) {
      activity.date = new Date().toISOString().split('T')[0];
    }
    activity.likes = 0;
    activity.comments = [];
    activity.showComments = false;
    this.activities.push(activity);
    this.closePostActivityModal();
  }

  toggleLike(index: number): void {
    this.activities[index].likes++;
  }

  toggleComments(index: number): void {
    this.activities[index].showComments = !this.activities[index].showComments;
  }

  addComment(index: number): void {
    if (this.newComment.trim()) {
      this.activities[index].comments.push({
        user: 'User', // Replace with actual user data
        text: this.newComment.trim(),
      });
      this.newComment = '';
    }
  }

  openImageCarousel(images: string[], index: number): void {
    this.carouselImages = images;
    this.currentImageIndex = index;
    this.currentImage = images[index];
    this.showCarousel = true;
  }

  closeImageCarousel(): void {
    this.showCarousel = false;
    this.carouselImages = [];
    this.currentImage = '';
    this.currentImageIndex = 0;
  }

  prevImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    } else {
      this.currentImageIndex = this.carouselImages.length - 1;
    }
    this.currentImage = this.carouselImages[this.currentImageIndex];
  }

  nextImage(): void {
    if (this.currentImageIndex < this.carouselImages.length - 1) {
      this.currentImageIndex++;
    } else {
      this.currentImageIndex = 0;
    }
    this.currentImage = this.carouselImages[this.currentImageIndex];
  }
}