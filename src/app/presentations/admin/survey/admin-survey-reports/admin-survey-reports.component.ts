import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../primeng.modules';

@Component({
	selector: 'app-admin-survey-reports',
	templateUrl: './admin-survey-reports.component.html',
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
})
export class AdminSurveyReportsComponent {}
