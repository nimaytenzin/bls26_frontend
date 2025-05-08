import { Component, OnInit } from '@angular/core';
import { FacilityDashboardService } from '../../core/services/facility-dashboard.service';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartOptions } from 'chart.js';

@Component({
  selector: 'app-facility-dashboard',
  standalone: true,
  templateUrl: './facility-dashboard.component.html',
  styleUrls: ['./facility-dashboard.component.scss'],
  imports: [
		CommonModule,
		NgChartsModule,
	],
})
export class FacilityDashboardComponent implements OnInit {
  totalEnrollments = 0;
  activeFacilitators = 0;
  upcomingEvents = 0;
  pendingInvoices = 0;
  dueSoonInvoices = 0;
  totalRevenue = 0;
  recentActivities: string[] = [];

	invoiceChartData = {
		labels: ['Paid', 'Pending', 'Overdue'],
		datasets: [
			{
				data: [15, 8, 3],
				backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
				hoverOffset: 4,
			},
		],
	};

	public invoiceChartOptions: ChartOptions<'doughnut'> = {
		responsive: true,
		plugins: {
			legend: {
				position: 'top' // ✅ Use only allowed values
			}
		}
	};


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
      this.dueSoonInvoices = stats.dueSoonInvoices;
      this.totalRevenue = stats.totalRevenue;
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
