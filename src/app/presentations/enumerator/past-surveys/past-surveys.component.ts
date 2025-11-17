import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../primeng.modules';

@Component({
	selector: 'app-past-surveys',
	templateUrl: './past-surveys.component.html',
	styleUrls: ['./past-surveys.component.css'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
})
export class PastSurveysComponent {
	// Component logic will be implemented
}
