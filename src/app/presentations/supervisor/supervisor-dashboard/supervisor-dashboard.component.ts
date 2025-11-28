import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
	selector: 'app-supervisor-dashboard',
	standalone: true,
	imports: [CommonModule, CardModule, ButtonModule],
	templateUrl: './supervisor-dashboard.component.html',
	styleUrls: ['./supervisor-dashboard.component.css'],
})
export class SupervisorDashboardComponent implements OnInit {
	constructor(private router: Router) {}

	ngOnInit() {}

	/**
	 * Navigate to active surveys
	 */
	goToSurveys() {
		this.router.navigate(['/supervisor/survey/active']);
	}
}
