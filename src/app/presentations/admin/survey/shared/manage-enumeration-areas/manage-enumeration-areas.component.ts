import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { EnumerationArea } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { Dzongkhag } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { AdministrativeZone } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { SubAdministrativeZone } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { DzongkhagDataService } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { AdministrativeZoneDataService } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';

// Interface for grouped enumeration areas by dzongkhag
interface GroupedEnumerationArea extends EnumerationArea {
	dzongkhagName: string;
	administrativeZoneName: string;
	subAdministrativeZoneName: string;
	isSelected: boolean;
}

@Component({
	selector: 'app-manage-enumeration-areas',
	templateUrl: './manage-enumeration-areas.component.html',
	styleUrls: ['./manage-enumeration-areas.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class ManageEnumerationAreasComponent implements OnInit {
	@Input() visible = false;
	@Input() surveyName = '';
	@Input() enumerationAreas: EnumerationArea[] = [];
	@Input() selectedEAIds: number[] = [];

	@Output() visibleChange = new EventEmitter<boolean>();
	@Output() save = new EventEmitter<number[]>();
	@Output() cancel = new EventEmitter<void>();

	// Hierarchical dropdown data
	dzongkhags: Dzongkhag[] = [];
	administrativeZones: AdministrativeZone[] = [];
	subAdministrativeZones: SubAdministrativeZone[] = [];

	// Hierarchical selection states
	selectedDzongkhagId: number | null = null;
	selectedAdminZoneId: number | null = null;
	selectedSubAdminZoneId: number | null = null;

	// Loading states for hierarchical dropdowns
	loadingDzongkhags = false;
	loadingAdminZones = false;
	loadingSubAdminZones = false;

	// Grouped EA data for table display
	groupedEAs: GroupedEnumerationArea[] = [];
	filteredGroupedEAs: GroupedEnumerationArea[] = [];
	eaTableGlobalFilter = '';

	constructor(
		private dzongkhagService: DzongkhagDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		this.loadDzongkhags();
	}

	ngOnChanges(): void {
		if (this.visible && this.enumerationAreas.length > 0) {
			this.buildGroupedEAData();
		}
	}

	loadDzongkhags(): void {
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

	onDzongkhagChange(dzongkhagId: number | null): void {
		// Reset dependent dropdowns
		this.administrativeZones = [];
		this.subAdministrativeZones = [];
		this.selectedAdminZoneId = null;
		this.selectedSubAdminZoneId = null;

		if (!dzongkhagId) {
			this.buildGroupedEAData();
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
					this.buildGroupedEAData();
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

	onAdministrativeZoneChange(adminZoneId: number | null): void {
		// Reset dependent dropdowns
		this.subAdministrativeZones = [];
		this.selectedSubAdminZoneId = null;

		if (!adminZoneId) {
			this.buildGroupedEAData();
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
					this.buildGroupedEAData();
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

	onSubAdministrativeZoneChange(subAdminZoneId: number | null): void {
		this.selectedSubAdminZoneId = subAdminZoneId;
		this.buildGroupedEAData();
	}

	resetHierarchicalFilters(): void {
		this.selectedDzongkhagId = null;
		this.selectedAdminZoneId = null;
		this.selectedSubAdminZoneId = null;
		this.administrativeZones = [];
		this.subAdministrativeZones = [];
	}

	buildGroupedEAData(): void {
		this.groupedEAs = this.enumerationAreas.map((ea) => {
			return {
				...ea,
				dzongkhagName: 'Loading...',
				administrativeZoneName: 'Loading...',
				subAdministrativeZoneName: 'Loading...',
				isSelected: this.selectedEAIds.includes(ea.id),
			};
		});
		this.filteredGroupedEAs = [...this.groupedEAs];
		this.loadHierarchyForEAs();
	}

	async loadHierarchyForEAs(): Promise<void> {
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

		// Apply hierarchical filters
		this.applyHierarchicalFilters();
	}

	applyHierarchicalFilters(): void {
		let filtered = [...this.groupedEAs];

		if (this.selectedDzongkhagId) {
			const dzongkhag = this.dzongkhags.find(
				(d) => d.id === this.selectedDzongkhagId
			);
			if (dzongkhag) {
				filtered = filtered.filter((ea) => ea.dzongkhagName === dzongkhag.name);
			}
		}

		if (this.selectedAdminZoneId) {
			const adminZone = this.administrativeZones.find(
				(az) => az.id === this.selectedAdminZoneId
			);
			if (adminZone) {
				filtered = filtered.filter(
					(ea) => ea.administrativeZoneName === adminZone.name
				);
			}
		}

		if (this.selectedSubAdminZoneId) {
			const subAdminZone = this.subAdministrativeZones.find(
				(saz) => saz.id === this.selectedSubAdminZoneId
			);
			if (subAdminZone) {
				filtered = filtered.filter(
					(ea) => ea.subAdministrativeZoneName === subAdminZone.name
				);
			}
		}

		this.filteredGroupedEAs = filtered;
		this.onEATableGlobalFilter({ target: { value: this.eaTableGlobalFilter } });
	}

	onEATableGlobalFilter(event: any): void {
		const value = event.target.value.toLowerCase();
		this.eaTableGlobalFilter = value;

		if (!value) {
			this.applyHierarchicalFilters();
			return;
		}

		const baseFiltered = this.filteredGroupedEAs;
		this.filteredGroupedEAs = baseFiltered.filter((ea) => {
			return (
				ea.name.toLowerCase().includes(value) ||
				ea.areaCode.toLowerCase().includes(value) ||
				ea.dzongkhagName.toLowerCase().includes(value) ||
				ea.administrativeZoneName.toLowerCase().includes(value) ||
				ea.subAdministrativeZoneName.toLowerCase().includes(value)
			);
		});
	}

	toggleEASelection(ea: GroupedEnumerationArea): void {
		const index = this.selectedEAIds.indexOf(ea.id);
		if (index > -1) {
			this.selectedEAIds.splice(index, 1);
			ea.isSelected = false;
		} else {
			this.selectedEAIds.push(ea.id);
			ea.isSelected = true;
		}
	}

	selectAllFilteredEAs(): void {
		this.filteredGroupedEAs.forEach((ea) => {
			if (!this.selectedEAIds.includes(ea.id)) {
				this.selectedEAIds.push(ea.id);
				ea.isSelected = true;
			}
		});
	}

	deselectAllFilteredEAs(): void {
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

	onSave(): void {
		this.save.emit(this.selectedEAIds);
	}

	onCancel(): void {
		this.visible = false;
		this.visibleChange.emit(false);
		this.cancel.emit();
	}
}
