import { Component } from '@angular/core';

@Component({
  selector: 'eccd-dashboard',
  standalone: false,
  templateUrl: './eccd-dashboard.component.html',
  styleUrl: './eccd-dashboard.component.scss'
})
export class EccdDashboardComponent {
  stats = {
    children: 48,
    staff: 12,
    pendingApprovals: 3,
    activities: 127
  };
}
