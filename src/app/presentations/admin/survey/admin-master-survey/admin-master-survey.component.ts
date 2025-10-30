import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SurveyDataService } from '../../../../core/dataservice/survey/survey.dataservice';
import {
	Survey,
	CreateSurveyDto,
	SurveyStatus,
} from '../../../../core/dataservice/survey/survey.dto';
import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { EnumerationArea } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { AdministrativeZone } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { SubAdministrativeZone } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { PrimeNgModules } from '../../../../primeng.modules';
import { Table } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AdminMasterSurveyCreateSurveyComponent } from './components/admin-master-survey-create-survey/admin-master-survey-create-survey.component';
import { AdminMasterSurveyCreateEnumerationAreasComponent } from './components/admin-master-survey-create-enumeration-areas/admin-master-survey-create-enumeration-areas.component';
import { AdminMasterSurveyCreateUploadEnumeratorsComponent } from './components/admin-master-survey-create-upload-enumerators/admin-master-survey-create-upload-enumerators.component';

// Interface for grouped enumeration areas by dzongkhag
interface GroupedEnumerationArea extends EnumerationArea {
	dzongkhagName: string;
	administrativeZoneName: string;
	subAdministrativeZoneName: string;
	isSelected: boolean;
}

@Component({
	selector: 'app-admin-master-survey',
	templateUrl: './admin-master-survey.component.html',
	styleUrls: ['./admin-master-survey.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService, DialogService],
})
export class AdminMasterSurveyComponent implements OnInit {
	// Table references
	@ViewChild('dt') dt!: Table;

	// Data properties
	surveys: Survey[] = [];
	enumerationAreas: EnumerationArea[] = [];
	selectedSurvey: Survey | null = null;
	loading = false;

	// Hierarchical dropdown data
	dzongkhags: Dzongkhag[] = [];
	administrativeZones: AdministrativeZone[] = [];
	subAdministrativeZones: SubAdministrativeZone[] = [];
	filteredEnumerationAreas: EnumerationArea[] = [];

	// Hierarchical selection states
	selectedDzongkhagId: number | null = null;
	selectedAdminZoneId: number | null = null;
	selectedSubAdminZoneId: number | null = null;

	// Loading states for hierarchical dropdowns
	loadingDzongkhags = false;
	loadingAdminZones = false;
	loadingSubAdminZones = false;
	loadingFilteredEAs = false;

	// Dialog states
	deleteDialog = false;
	manageEADialog = false;

	// Enumeration Area management
	selectedEAIds: number[] = [];
	availableEAs: EnumerationArea[] = [];

	// Grouped EA data for table display
	groupedEAs: GroupedEnumerationArea[] = [];
	filteredGroupedEAs: GroupedEnumerationArea[] = [];
	eaTableGlobalFilter = '';

	// Table properties
	globalFilterValue = '';

	// Survey Status Enum for template
	SurveyStatus = SurveyStatus;

	// Dynamic Dialog reference
	ref: DynamicDialogRef | undefined;

	constructor(
		private surveyService: SurveyDataService,
		private enumerationAreaService: EnumerationAreaDataService,
		private dzongkhagService: DzongkhagDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private messageService: MessageService,
		private dialogService: DialogService
	) {}

	ngOnInit() {
		this.loadSurveys();
		this.loadEnumerationAreas();
		this.loadDzongkhags();
	}

	loadSurveys() {
		this.loading = true;
		this.surveyService.findAllSurveys().subscribe({
			next: (data) => {
				this.surveys = data;
				this.loading = false;
			},
			error: (error) => {
				this.loading = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load surveys',
					life: 3000,
				});
			},
		});
	}

	loadEnumerationAreas() {
		this.enumerationAreaService.findAllEnumerationAreas().subscribe({
			next: (data) => {
				this.enumerationAreas = data;
			},
			error: (error) => {
				console.error('Error loading enumeration areas:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load enumeration areas',
					life: 3000,
				});
			},
		});
	}

	// Hierarchical Dropdown Methods
	loadDzongkhags() {
		this.loadingDzongkhags = true;
		this.dzongkhagService.findAllDzongkhags().subscribe({
			next: (data) => {
				this.dzongkhags = data;
				this.loadingDzongkhags = false;
			},
			error: (error) => {
				this.loadingDzongkhags = false;
				console.error('Error loading dzongkhags:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load dzongkhags',
					life: 3000,
				});
			},
		});
	}

	onDzongkhagChange(dzongkhagId: number | null) {
		// Reset dependent dropdowns
		this.administrativeZones = [];
		this.subAdministrativeZones = [];
		this.filteredEnumerationAreas = [];
		this.selectedAdminZoneId = null;
		this.selectedSubAdminZoneId = null;

		if (!dzongkhagId) {
			return;
		}

		this.selectedDzongkhagId = dzongkhagId;

		// Load Administrative Zones
		this.loadingAdminZones = true;
		this.administrativeZoneService
			.findAdministrativeZonesByDzongkhag(dzongkhagId)
			.subscribe({
				next: (data) => {
					this.administrativeZones = data;
					this.loadingAdminZones = false;
				},
				error: (error) => {
					this.loadingAdminZones = false;
					console.error('Error loading administrative zones:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load administrative zones',
						life: 3000,
					});
				},
			});
	}

	onAdministrativeZoneChange(adminZoneId: number | null) {
		// Reset dependent dropdowns
		this.subAdministrativeZones = [];
		this.filteredEnumerationAreas = [];
		this.selectedSubAdminZoneId = null;

		if (!adminZoneId) {
			return;
		}

		this.selectedAdminZoneId = adminZoneId;

		// Load Sub-Administrative Zones
		this.loadingSubAdminZones = true;
		this.subAdministrativeZoneService
			.findSubAdministrativeZonesByAdministrativeZone(adminZoneId)
			.subscribe({
				next: (data) => {
					this.subAdministrativeZones = data;
					this.loadingSubAdminZones = false;
				},
				error: (error) => {
					this.loadingSubAdminZones = false;
					console.error('Error loading sub-administrative zones:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load sub-administrative zones',
						life: 3000,
					});
				},
			});
	}

	onSubAdministrativeZoneChange(subAdminZoneId: number | null) {
		// Reset dependent dropdown
		this.filteredEnumerationAreas = [];

		if (!subAdminZoneId) {
			return;
		}

		this.selectedSubAdminZoneId = subAdminZoneId;

		// Load Enumeration Areas
		this.loadingFilteredEAs = true;
		this.enumerationAreaService
			.findEnumerationAreasBySubAdministrativeZone(subAdminZoneId)
			.subscribe({
				next: (data) => {
					this.filteredEnumerationAreas = data;
					this.loadingFilteredEAs = false;
				},
				error: (error) => {
					this.loadingFilteredEAs = false;
					console.error('Error loading enumeration areas:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumeration areas',
						life: 3000,
					});
				},
			});
	}

	addEnumerationAreaToSelection(eaId: number) {
		if (eaId && !this.selectedEAIds.includes(eaId)) {
			this.selectedEAIds.push(eaId);
		}
	}

	resetHierarchicalFilters() {
		this.selectedDzongkhagId = null;
		this.selectedAdminZoneId = null;
		this.selectedSubAdminZoneId = null;
		this.administrativeZones = [];
		this.subAdministrativeZones = [];
		this.filteredEnumerationAreas = [];
	}

	// CRUD Operations - Using Dynamic Dialogs
	openNew() {
		// Step 1: Create Survey Info
		this.ref = this.dialogService.open(AdminMasterSurveyCreateSurveyComponent, {
			header: 'Create New Survey',
			modal: true,
		});

		this.ref.onClose.subscribe((surveyData: any) => {
			if (surveyData && !surveyData.back) {
				// Step 2: Select Enumeration Areas
				this.openEnumerationAreasDialog(surveyData);
			}
		});
	}

	openEnumerationAreasDialog(surveyData: any) {
		this.ref = this.dialogService.open(
			AdminMasterSurveyCreateEnumerationAreasComponent,
			{
				header: 'Select Enumeration Areas',

				modal: true,
				data: {
					surveyData: surveyData,
					selectedEAIds: [],
				},
			}
		);

		this.ref.onClose.subscribe((result: any) => {
			if (result?.back) {
				// Go back to step 1 with existing data
				this.reopenSurveyDialog(surveyData);
			} else if (result?.selectedEAIds) {
				// Step 3: Upload Enumerators
				this.openUploadEnumeratorsDialog(surveyData, result.selectedEAIds);
			}
		});
	}

	openUploadEnumeratorsDialog(surveyData: any, selectedEAIds: number[]) {
		this.ref = this.dialogService.open(
			AdminMasterSurveyCreateUploadEnumeratorsComponent,
			{
				header: 'Upload Enumerators (Optional)',
				modal: true,
				data: {
					surveyData: surveyData,
					selectedEAIds: selectedEAIds,
				},
			}
		);

		this.ref.onClose.subscribe((result: any) => {
			if (result?.back) {
				// Go back to step 2
				this.openEnumerationAreasDialog(surveyData);
			} else if (result?.completed || result?.skipped) {
				// Create the survey
				this.createSurveyFromWizard(surveyData, selectedEAIds);
			}
		});
	}

	reopenSurveyDialog(existingData: any) {
		this.ref = this.dialogService.open(AdminMasterSurveyCreateSurveyComponent, {
			header: 'Create New Survey',
			width: '70vw',
			modal: true,
			data: existingData,
			breakpoints: {
				'960px': '90vw',
				'640px': '100vw',
			},
		});

		this.ref.onClose.subscribe((surveyData: any) => {
			if (surveyData && !surveyData.back) {
				this.openEnumerationAreasDialog(surveyData);
			}
		});
	}

	createSurveyFromWizard(surveyData: any, selectedEAIds: number[]) {
		const createData: CreateSurveyDto = {
			name: surveyData.name,
			description: surveyData.description,
			year: surveyData.year,
			startDate: surveyData.startDate,
			endDate: surveyData.endDate,
			status: surveyData.status,
			isSubmitted: surveyData.isSubmitted,
			isVerified: surveyData.isVerified,
			enumerationAreaIds: selectedEAIds,
		};

		this.surveyService.createSurvey(createData).subscribe({
			next: () => {
				this.loadSurveys();
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Survey created successfully',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error creating survey:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: error?.error?.message || 'Failed to create survey',
					life: 3000,
				});
			},
		});
	}

	editSurvey(survey: Survey) {
		// TODO: Implement edit with dynamic dialogs if needed
		this.messageService.add({
			severity: 'info',
			summary: 'Edit Not Implemented',
			detail: 'Edit functionality with dynamic dialogs coming soon',
			life: 3000,
		});
	}

	confirmDelete(survey: Survey) {
		this.selectedSurvey = survey;
		this.deleteDialog = true;
	}

	deleteSurvey() {
		if (this.selectedSurvey) {
			this.surveyService.deleteSurvey(this.selectedSurvey.id).subscribe({
				next: () => {
					this.loadSurveys();
					this.deleteDialog = false;
					this.selectedSurvey = null;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Survey deleted successfully',
						life: 3000,
					});
				},
				error: (error) => {
					console.error('Error deleting survey:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error?.error?.message || 'Failed to delete survey',
						life: 3000,
					});
				},
			});
		}
	}

	// Enumeration Area Management
	buildGroupedEAData() {
		this.groupedEAs = this.enumerationAreas.map((ea) => {
			// Find the sub-administrative zone
			let subAdminZone: SubAdministrativeZone | undefined;
			let adminZone: AdministrativeZone | undefined;
			let dzongkhag: Dzongkhag | undefined;

			// This assumes we need to fetch the full hierarchy
			// We'll need to get this data when loading enumeration areas
			return {
				...ea,
				dzongkhagName: 'Loading...',
				administrativeZoneName: 'Loading...',
				subAdministrativeZoneName: 'Loading...',
				isSelected: this.selectedEAIds.includes(ea.id),
			};
		});
		this.filteredGroupedEAs = [...this.groupedEAs];

		// Load hierarchical data for all EAs
		this.loadHierarchyForEAs();
	}

	async loadHierarchyForEAs() {
		// Get unique sub-admin zone IDs
		const subAdminZoneIds = [
			...new Set(this.enumerationAreas.map((ea) => ea.subAdministrativeZoneId)),
		];

		for (const subAdminZoneId of subAdminZoneIds) {
			try {
				// Fetch sub-admin zone with its hierarchy
				const subAdminZone = await this.subAdministrativeZoneService
					.findSubAdministrativeZoneById(subAdminZoneId)
					.toPromise();

				if (subAdminZone && subAdminZone.administrativeZone) {
					const adminZone = subAdminZone.administrativeZone;
					const dzongkhag = adminZone.dzongkhag;

					// Update all EAs that belong to this sub-admin zone
					this.groupedEAs.forEach((ea) => {
						if (ea.subAdministrativeZoneId === subAdminZoneId) {
							ea.subAdministrativeZoneName = subAdminZone.name;
							ea.administrativeZoneName = adminZone?.name || 'N/A';
							ea.dzongkhagName = dzongkhag?.name || 'N/A';
						}
					});
				}
			} catch (error) {
				console.error('Error loading hierarchy for sub-admin zone:', error);
			}
		}

		// Update filtered list
		this.filteredGroupedEAs = [...this.groupedEAs];
	}

	onEATableGlobalFilter(event: Event) {
		const value = (event.target as HTMLInputElement).value.toLowerCase();
		this.eaTableGlobalFilter = value;

		if (!value) {
			this.filteredGroupedEAs = [...this.groupedEAs];
			return;
		}

		this.filteredGroupedEAs = this.groupedEAs.filter((ea) => {
			return (
				ea.name.toLowerCase().includes(value) ||
				ea.areaCode.toLowerCase().includes(value) ||
				ea.dzongkhagName.toLowerCase().includes(value) ||
				ea.administrativeZoneName.toLowerCase().includes(value) ||
				ea.subAdministrativeZoneName.toLowerCase().includes(value)
			);
		});
	}

	toggleEASelection(ea: GroupedEnumerationArea) {
		const index = this.selectedEAIds.indexOf(ea.id);
		if (index > -1) {
			this.selectedEAIds.splice(index, 1);
			ea.isSelected = false;
		} else {
			this.selectedEAIds.push(ea.id);
			ea.isSelected = true;
		}
	}

	selectAllFilteredEAs() {
		this.filteredGroupedEAs.forEach((ea) => {
			if (!this.selectedEAIds.includes(ea.id)) {
				this.selectedEAIds.push(ea.id);
				ea.isSelected = true;
			}
		});
	}

	deselectAllFilteredEAs() {
		this.filteredGroupedEAs.forEach((ea) => {
			const index = this.selectedEAIds.indexOf(ea.id);
			if (index > -1) {
				this.selectedEAIds.splice(index, 1);
				ea.isSelected = false;
			}
		});
	}

	getEACountByDzongkhag(dzongkhagName: string): number {
		return this.filteredGroupedEAs.filter(
			(ea) => ea.dzongkhagName === dzongkhagName
		).length;
	}

	getSelectedEACountByDzongkhag(dzongkhagName: string): number {
		return this.filteredGroupedEAs.filter(
			(ea) => ea.dzongkhagName === dzongkhagName && ea.isSelected
		).length;
	}

	openManageEAs(survey: Survey) {
		this.selectedSurvey = survey;
		this.selectedEAIds = survey.enumerationAreas?.map((ea) => ea.id) || [];
		this.availableEAs = this.enumerationAreas;
		this.resetHierarchicalFilters();
		this.buildGroupedEAData();
		this.manageEADialog = true;
	}

	saveEAAssociations() {
		if (!this.selectedSurvey) return;

		const currentEAIds =
			this.selectedSurvey.enumerationAreas?.map((ea) => ea.id) || [];
		const newEAIds = this.selectedEAIds;

		// Find EAs to add and remove
		const toAdd = newEAIds.filter((id) => !currentEAIds.includes(id));
		const toRemove = currentEAIds.filter((id) => !newEAIds.includes(id));

		// Handle additions
		if (toAdd.length > 0) {
			this.surveyService
				.addEnumerationAreas(this.selectedSurvey.id, toAdd)
				.subscribe({
					next: () => {
						if (toRemove.length > 0) {
							this.removeEAs(toRemove);
						} else {
							this.finishEAUpdate();
						}
					},
					error: (error) => {
						console.error('Error adding enumeration areas:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to add enumeration areas',
							life: 3000,
						});
					},
				});
		} else if (toRemove.length > 0) {
			this.removeEAs(toRemove);
		} else {
			this.finishEAUpdate();
		}
	}

	private removeEAs(ids: number[]) {
		if (!this.selectedSurvey) return;

		this.surveyService
			.removeEnumerationAreas(this.selectedSurvey.id, ids)
			.subscribe({
				next: () => {
					this.finishEAUpdate();
				},
				error: (error) => {
					console.error('Error removing enumeration areas:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to remove enumeration areas',
						life: 3000,
					});
				},
			});
	}

	private finishEAUpdate() {
		this.loadSurveys();
		this.manageEADialog = false;
		this.messageService.add({
			severity: 'success',
			summary: 'Success',
			detail: 'Enumeration areas updated successfully',
			life: 3000,
		});
	}

	// Utility functions
	clear(table: any) {
		table.clear();
		this.globalFilterValue = '';
	}

	onGlobalFilter(event: Event) {
		const target = event.target as HTMLInputElement;
		this.globalFilterValue = target.value;
		if (this.dt) {
			this.dt.filterGlobal(target.value, 'contains');
		}
	}

	onRowSelect(event: any) {
		if (event.data) {
			this.selectedSurvey = event.data;
		}
	}

	// Statistics calculations
	get totalSurveys(): number {
		return this.surveys.length;
	}

	get activeSurveys(): number {
		return this.surveys.filter((s) => s.status === SurveyStatus.ACTIVE).length;
	}

	get endedSurveys(): number {
		return this.surveys.filter((s) => s.status === SurveyStatus.ENDED).length;
	}

	get submittedSurveys(): number {
		return this.surveys.filter((s) => s.isSubmitted).length;
	}

	get verifiedSurveys(): number {
		return this.surveys.filter((s) => s.isVerified).length;
	}

	// Utility methods from service
	getSurveyDuration(survey: Survey): number {
		return this.surveyService.getSurveyDuration(survey);
	}

	isSurveyActive(survey: Survey): boolean {
		return this.surveyService.isSurveyActive(survey);
	}

	isSurveyEndingSoon(survey: Survey): boolean {
		return this.surveyService.isSurveyEndingSoon(survey);
	}

	formatDate(date: string | Date): string {
		return this.surveyService.formatDate(date);
	}

	getEACount(survey: Survey): number {
		return this.surveyService.getEACount(survey);
	}

	// Get status badge class
	getStatusBadgeClass(status: SurveyStatus): string {
		return status === SurveyStatus.ACTIVE
			? 'bg-green-100 text-green-800'
			: 'bg-gray-100 text-gray-800';
	}

	// Get enumeration area names for display
	getEANames(survey: Survey): string {
		if (!survey.enumerationAreas || survey.enumerationAreas.length === 0) {
			return 'No EAs assigned';
		}
		if (survey.enumerationAreas.length <= 3) {
			return survey.enumerationAreas.map((ea) => ea.name).join(', ');
		}
		return `${survey.enumerationAreas
			.slice(0, 3)
			.map((ea) => ea.name)
			.join(', ')} and ${survey.enumerationAreas.length - 3} more`;
	}

	// Get EA name by ID
	getEANameById(eaId: number): string {
		const ea = this.enumerationAreas.find((e) => e.id === eaId);
		return ea ? ea.name : 'Unknown';
	}

	// Get EA code by ID
	getEACodeById(eaId: number): string {
		const ea = this.enumerationAreas.find((e) => e.id === eaId);
		return ea ? ea.areaCode : 'N/A';
	}

	// Remove EA from selection
	removeEAFromSelection(eaId: number): void {
		this.selectedEAIds = this.selectedEAIds.filter((id) => id !== eaId);
	}
}
