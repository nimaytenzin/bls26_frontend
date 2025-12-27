import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table } from 'primeng/table';
import { SurveyDataService } from '../../../../../core/dataservice/survey/survey.dataservice';
import { Survey } from '../../../../../core/dataservice/survey/survey.dto';
import { PrimeNgModules } from '../../../../../primeng.modules';

@Component({
	selector: 'app-active-surveys-table',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './active-surveys-table.component.html',
	styleUrls: ['./active-surveys-table.component.css'],
})
export class ActiveSurveysTableComponent {
	@ViewChild('dt') dt!: Table;

	@Input() surveys: Survey[] = [];
	@Input() loading = false;
	@Input() selectedSurvey: Survey | null = null;
	@Input() globalFilterValue = '';

	@Output() rowSelect = new EventEmitter<Survey>();
	@Output() viewSurvey = new EventEmitter<Survey>();
	@Output() editSurvey = new EventEmitter<Survey>();
	@Output() deleteSurvey = new EventEmitter<Survey>();
	@Output() downloadHouseholdCounts = new EventEmitter<Survey>();
	@Output() globalFilterChange = new EventEmitter<string>();

	constructor(private surveyService: SurveyDataService) {}

	onGlobalFilter(event: Event) {
		const target = event.target as HTMLInputElement;
		this.globalFilterValue = target.value;
		if (this.dt) {
			this.dt.filterGlobal(target.value, 'contains');
		}
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

	onDownloadHouseholdCounts(survey: Survey) {
		this.downloadHouseholdCounts.emit(survey);
	}

	// Utility methods
	formatDate(date: string | Date): string {
		return this.surveyService.formatDate(date);
	}

	isSurveyEndingSoon(survey: Survey): boolean {
		return this.surveyService.isSurveyEndingSoon(survey);
	}
}

