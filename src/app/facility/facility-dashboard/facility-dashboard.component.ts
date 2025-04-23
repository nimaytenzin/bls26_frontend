import { Component, OnInit } from '@angular/core';
import { FacilityDashboardService } from '../../core/services/facility-dashboard.service';

@Component({
  selector: 'app-facility-dashboard',
  standalone: false,
  templateUrl: './facility-dashboard.component.html',
  styleUrls: ['./facility-dashboard.component.scss'],
})
export class FacilityDashboardComponent implements OnInit {
  totalEnrollments: number = 0;
  activeFacilitators: number = 0;
  upcomingEvents: number = 0;
  pendingInvoices: number = 0;
  recentActivities: string[] = [];

  constructor(private facilityDashboardService: FacilityDashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.facilityDashboardService.getDashboardStats().subscribe((stats) => {
      this.totalEnrollments = stats.totalEnrollments;
      this.activeFacilitators = stats.activeFacilitators;
      this.upcomingEvents = stats.upcomingEvents;
      this.pendingInvoices = stats.pendingInvoices;
    });

    this.facilityDashboardService.getRecentActivities().subscribe((activities) => {
      this.recentActivities = activities;
    });
  }

  addFacilitator(): void {
    console.log('Add Facilitator clicked');
  }

  enrollChild(): void {
    console.log('Enroll Child clicked');
  }

  postAnnouncement(): void {
    console.log('Post Announcement clicked');
  }

  generateReport(): void {
    console.log('Generate Report clicked');
  }
}