import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { Survey, SurveyStatus } from '../../../../../core/dataservice/survey/survey.dto';
import { SurveyDataService } from '../../../../../core/dataservice/survey/survey.dataservice';

@Component({
	selector: 'app-all-surveys-table',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './all-surveys-table.component.html',
	styleUrls: ['./all-surveys-table.component.css'],
})
export class AllSurveysTableComponent {
	@Input() surveys: Survey[] = [];
	@Input() loading = false;
	@Input() totalRecords = 0;
	@Input() rowsPerPage = 10;
	@Input() selectedSurvey: Survey | null = null;
	@Input() globalFilterValue = '';

	@Output() lazyLoad = new EventEmitter<any>();
	@Output() rowSelect = new EventEmitter<Survey>();
	@Output() viewSurvey = new EventEmitter<Survey>();
	@Output() editSurvey = new EventEmitter<Survey>();
	@Output() deleteSurvey = new EventEmitter<Survey>();
	@Output() globalFilterChange = new EventEmitter<string>();

	SurveyStatus = SurveyStatus;

	private surveyService = inject(SurveyDataService);

	onLazyLoad(event: any) {
		this.lazyLoad.emit(event);
	}

	onGlobalFilter(event: Event) {
		const target = event.target as HTMLInputElement;
		this.globalFilterValue = target.value;
		this.globalFilterChange.emit(target.value);
	}

	onRowSelect(event: any) {
		if (event.data) {
			this.rowSelect.emit(event.data);
		}
	}

	onView(survey: Survey) {
		this.viewSurvey.emit(survey);
	}

	onEdit(survey: Survey) {
		this.editSurvey.emit(survey);
	}

	onDelete(survey: Survey) {
		this.deleteSurvey.emit(survey);
	}

	// Utility methods
	formatDate(date: string | Date): string {
		return this.surveyService.formatDate(date);
	}

	isSurveyEndingSoon(survey: Survey): boolean {
		return this.surveyService.isSurveyEndingSoon(survey);
	}

	getStatusBadgeClass(status: SurveyStatus): string {
		return status === SurveyStatus.ACTIVE
			? 'bg-green-100 text-green-800'
			: 'bg-gray-100 text-gray-800';
	}
}

