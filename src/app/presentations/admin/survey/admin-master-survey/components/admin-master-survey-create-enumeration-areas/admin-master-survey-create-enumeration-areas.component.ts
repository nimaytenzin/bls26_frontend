import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../../primeng.modules';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { EnumerationAreaDataService } from '../../../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { EnumerationArea } from '../../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { DzongkhagDataService } from '../../../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { Dzongkhag } from '../../../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { AdministrativeZoneDataService } from '../../../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { AdministrativeZone } from '../../../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { SubAdministrativeZoneDataService } from '../../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { SubAdministrativeZone } from '../../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';

interface GroupedEnumerationArea extends EnumerationArea {
	dzongkhagName: string;
	administrativeZoneName: string;
	subAdministrativeZoneName: string;
	isSelected: boolean;
}

@Component({
	selector: 'app-admin-master-survey-create-enumeration-areas',
	templateUrl: './admin-master-survey-create-enumeration-areas.component.html',
	styleUrls: ['./admin-master-survey-create-enumeration-areas.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminMasterSurveyCreateEnumerationAreasComponent
	implements OnInit
{
	enumerationAreas: EnumerationArea[] = [];
	groupedEAs: GroupedEnumerationArea[] = [];
	filteredGroupedEAs: GroupedEnumerationArea[] = [];
	selectedEAIds: number[] = [];

	dzongkhags: Dzongkhag[] = [];
	administrativeZones: AdministrativeZone[] = [];
	subAdministrativeZones: SubAdministrativeZone[] = [];

	selectedDzongkhagId: number | null = null;
	selectedAdminZoneId: number | null = null;
	selectedSubAdminZoneId: number | null = null;
	searchTerm: string = '';

	loading = false;
	loadingDzongkhags = false;
	loadingAdminZones = false;
	loadingSubAdminZones = false;

	constructor(
		private enumerationAreaService: EnumerationAreaDataService,
		private dzongkhagService: DzongkhagDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private messageService: MessageService,
		public ref: DynamicDialogRef,
		public config: DynamicDialogConfig
	) {}

	ngOnInit() {
		this.selectedEAIds = this.config.data?.selectedEAIds || [];
		this.loadData();
	}

	loadData() {
		this.loading = true;
		this.loadDzongkhags();
		this.loadEnumerationAreas();
	}

	loadDzongkhags() {
		this.loadingDzongkhags = true;
		this.dzongkhagService.findAllDzongkhags().subscribe({
			next: (data) => {
				this.dzongkhags = data;
				this.loadingDzongkhags = false;
			},
			error: (error) => {
				console.error('Error loading dzongkhags:', error);
				this.loadingDzongkhags = false;
			},
		});
	}

	loadEnumerationAreas() {
		this.enumerationAreaService.findAllEnumerationAreas().subscribe({
			next: (data) => {
				this.enumerationAreas = data;
				this.buildGroupedData();
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading enumeration areas:', error);
				this.loading = false;
			},
		});
	}

	async buildGroupedData() {
		this.groupedEAs = this.enumerationAreas.map((ea) => ({
			...ea,
			dzongkhagName: 'Loading...',
			administrativeZoneName: 'Loading...',
			subAdministrativeZoneName: 'Loading...',
			isSelected: this.selectedEAIds.includes(ea.id),
		}));

		this.filteredGroupedEAs = [...this.groupedEAs];
		await this.loadHierarchy();
	}

	async loadHierarchy() {
		const subAdminZoneIds = [
			...new Set(this.enumerationAreas.map((ea) => ea.subAdministrativeZoneId)),
		];

		for (const subAdminZoneId of subAdminZoneIds) {
			try {
				const subAdminZone = await this.subAdministrativeZoneService
					.findSubAdministrativeZoneById(subAdminZoneId)
					.toPromise();

				if (subAdminZone && subAdminZone.administrativeZone) {
					const adminZone = subAdminZone.administrativeZone;
					const dzongkhag = adminZone.dzongkhag;

					this.groupedEAs.forEach((ea) => {
						if (ea.subAdministrativeZoneId === subAdminZoneId) {
							ea.subAdministrativeZoneName = subAdminZone.name;
							ea.administrativeZoneName = adminZone?.name || 'N/A';
							ea.dzongkhagName = dzongkhag?.name || 'N/A';
						}
					});
				}
			} catch (error) {
				console.error('Error loading hierarchy:', error);
			}
		}

		this.applyFilters();
	}

	onDzongkhagChange(dzongkhagId: number | null) {
		this.administrativeZones = [];
		this.subAdministrativeZones = [];
		this.selectedAdminZoneId = null;
		this.selectedSubAdminZoneId = null;

		if (dzongkhagId) {
			this.loadingAdminZones = true;
			this.administrativeZoneService
				.findAdministrativeZonesByDzongkhag(dzongkhagId)
				.subscribe({
					next: (data) => {
						this.administrativeZones = data;
						this.loadingAdminZones = false;
						this.applyFilters();
					},
					error: (error) => {
						console.error('Error loading admin zones:', error);
						this.loadingAdminZones = false;
					},
				});
		} else {
			this.applyFilters();
		}
	}

	onAdministrativeZoneChange(adminZoneId: number | null) {
		this.subAdministrativeZones = [];
		this.selectedSubAdminZoneId = null;

		if (adminZoneId) {
			this.loadingSubAdminZones = true;
			this.subAdministrativeZoneService
				.findSubAdministrativeZonesByAdministrativeZone(adminZoneId)
				.subscribe({
					next: (data) => {
						this.subAdministrativeZones = data;
						this.loadingSubAdminZones = false;
						this.applyFilters();
					},
					error: (error) => {
						console.error('Error loading sub-admin zones:', error);
						this.loadingSubAdminZones = false;
					},
				});
		} else {
			this.applyFilters();
		}
	}

	applyFilters() {
		let filtered = [...this.groupedEAs];

		if (this.selectedDzongkhagId) {
			const selectedDzongkhag = this.dzongkhags.find(
				(d) => d.id === this.selectedDzongkhagId
			);
			if (selectedDzongkhag) {
				filtered = filtered.filter(
					(ea) => ea.dzongkhagName === selectedDzongkhag.name
				);
			}
		}

		if (this.selectedAdminZoneId) {
			const selectedAdminZone = this.administrativeZones.find(
				(az) => az.id === this.selectedAdminZoneId
			);
			if (selectedAdminZone) {
				filtered = filtered.filter(
					(ea) => ea.administrativeZoneName === selectedAdminZone.name
				);
			}
		}

		if (this.selectedSubAdminZoneId) {
			const selectedSubAdminZone = this.subAdministrativeZones.find(
				(saz) => saz.id === this.selectedSubAdminZoneId
			);
			if (selectedSubAdminZone) {
				filtered = filtered.filter(
					(ea) => ea.subAdministrativeZoneName === selectedSubAdminZone.name
				);
			}
		}

		if (this.searchTerm) {
			const term = this.searchTerm.toLowerCase();
			filtered = filtered.filter(
				(ea) =>
					ea.name.toLowerCase().includes(term) ||
					ea.areaCode.toLowerCase().includes(term) ||
					ea.dzongkhagName.toLowerCase().includes(term) ||
					ea.administrativeZoneName.toLowerCase().includes(term) ||
					ea.subAdministrativeZoneName.toLowerCase().includes(term)
			);
		}

		this.filteredGroupedEAs = filtered;
	}

	resetFilters() {
		this.selectedDzongkhagId = null;
		this.selectedAdminZoneId = null;
		this.selectedSubAdminZoneId = null;
		this.searchTerm = '';
		this.administrativeZones = [];
		this.subAdministrativeZones = [];
		this.applyFilters();
	}

	toggleSelection(ea: GroupedEnumerationArea) {
		const index = this.selectedEAIds.indexOf(ea.id);
		if (index > -1) {
			this.selectedEAIds.splice(index, 1);
		} else {
			this.selectedEAIds.push(ea.id);
		}
	}

	selectAllFiltered() {
		this.filteredGroupedEAs.forEach((ea) => {
			if (!this.selectedEAIds.includes(ea.id)) {
				this.selectedEAIds.push(ea.id);
				ea.isSelected = true;
			}
		});
	}

	deselectAll() {
		this.selectedEAIds = [];
		this.groupedEAs.forEach((ea) => {
			ea.isSelected = false;
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

	back() {
		this.ref.close({ back: true });
	}

	next() {
		if (this.selectedEAIds.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Selection',
				detail: 'Please select at least one enumeration area',
				life: 3000,
			});
			return;
		}
		this.ref.close({ selectedEAIds: this.selectedEAIds });
	}
}
