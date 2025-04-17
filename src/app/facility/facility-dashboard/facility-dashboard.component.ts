import { Component } from '@angular/core';

@Component({
  selector: 'app-facility-dashboard',
  standalone: false,
  templateUrl: './facility-dashboard.component.html',
  styleUrl: './facility-dashboard.component.scss'
})
export class FacilityDashboardComponent {
  stats = {
    children: 48,
    staff: 12,
    pendingApprovals: 3,
    activities: 127
  };
}
