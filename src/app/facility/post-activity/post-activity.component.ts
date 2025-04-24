import { Component } from '@angular/core';

@Component({
  selector: 'app-post-activity',
  standalone: false,
  templateUrl: './post-activity.component.html',
  styleUrls: ['./post-activity.component.scss'],
})
export class PostActivityComponent {
  activities: any[] = []; // List of activities
  showPostActivityModal: boolean = false; // Controls the visibility of the modal

  openPostActivityModal(): void {
    this.showPostActivityModal = true;
  }

  closePostActivityModal(): void {
    this.showPostActivityModal = false;
  }

  addActivity(activity: any): void {
    this.activities.push(activity); // Add the new activity to the list
    this.closePostActivityModal();
  }
}