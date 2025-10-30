import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormsModule,
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	Validators,
} from '@angular/forms';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import {
	AdministrativeZone,
	CreateAdministrativeZoneDto,
	UpdateAdministrativeZoneDto,
	AdministrativeZoneType,
} from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { PrimeNgModules } from '../../../../primeng.modules';
import { Table } from 'primeng/table';
import * as L from 'leaflet';
import { ConfirmationService } from 'primeng/api';

@Component({
	selector: 'app-admin-master-administrative-zones',
	templateUrl: './admin-master-administrative-zones.component.html',
	styleUrls: ['./admin-master-administrative-zones.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [ConfirmationService],
})
export class AdminMasterAdministrativeZonesComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	// Table references
	@ViewChild('dt') dt!: Table;
	@ViewChild('dtSplit') dtSplit!: Table;

	// Data properties
	administrativeZones: AdministrativeZone[] = [];
	selectedAdministrativeZone: AdministrativeZone | null = null;
	dzongkhags: Dzongkhag[] = [];
	loading = false;

	// Map properties
	private map?: L.Map;
	administrativeZoneGeoJSON: any;
	private allAdministrativeZonesLayer?: L.GeoJSON;
	private baseLayer?: L.TileLayer;

	// View control
	currentView: 'table' | 'split' = 'table';

	// Dialog states
	administrativeZoneDialog = false;
	deleteDialog = false;

	// Form
	administrativeZoneForm: FormGroup;
	isEditMode = false;

	// Enum for template access
	AdministrativeZoneType = AdministrativeZoneType;
	zoneTypes = Object.values(AdministrativeZoneType);

	// Table properties
	globalFilterValue = '';

	constructor(
		private administrativeZoneService: AdministrativeZoneDataService,
		private dzongkhagService: DzongkhagDataService,
		private fb: FormBuilder
	) {
		this.administrativeZoneForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			areaCode: [''],
			dzongkhagId: ['', [Validators.required]],
			type: ['', [Validators.required]],
			areaSqKm: ['', [Validators.min(0)]],
		});
	}

	ngOnInit() {
		this.loadDzongkhags();
		this.loadAdministrativeZones();
	}

	ngAfterViewInit() {
		// Map initialization will happen when views are switched or tabs are changed
	}

	// View Management
	switchView(view: 'table' | 'split') {
		this.currentView = view;
		if (view === 'split') {
			setTimeout(() => this.initializeMap(), 100);
		}
	}

	// Handle tab change for map initialization
	onTabChange(event: any) {
		if (event.index === 1) {
			setTimeout(() => this.initializeMap('administrative-zone-map-tab'), 100);
		}
	}

	ngOnDestroy() {
		if (this.map) {
			this.map.remove();
		}
	}

	loadDzongkhags() {
		this.dzongkhagService.findAllDzongkhags().subscribe({
			next: (data) => {
				this.dzongkhags = data;
			},
			error: (error) => {
				console.error('Error loading dzongkhags:', error);
			},
		});
	}

	loadAdministrativeZones() {
		this.loading = true;
		this.administrativeZoneService.findAllAdministrativeZones().subscribe({
			next: (data) => {
				this.administrativeZones = data;
				this.loading = false;
			},
			error: (error) => {
				this.loading = false;
				console.error('Error loading administrative zones:', error);
			},
		});
	}

	loadAdministrativeZoneGeoJSON() {
		this.administrativeZoneService.getAllAdministrativeZoneGeojson().subscribe({
			next: (data) => {
				this.administrativeZoneGeoJSON = data;
				if (this.map) {
					this.renderAllAdministrativeZones();
				}
			},
			error: (error) => {
				console.error('Error loading administrative zone GeoJSON:', error);
			},
		});
	}

	reloadMap() {
		this.administrativeZoneGeoJSON = undefined;

		if (this.map) {
			this.map.remove();
			this.map = undefined;
		}

		let containerId = 'administrative-zone-map';
		if (this.currentView === 'table') {
			if (document.getElementById('administrative-zone-map-tab')) {
				containerId = 'administrative-zone-map-tab';
			} else if (document.getElementById('administrative-zone-map')) {
				containerId = 'administrative-zone-map';
			}
		} else {
			containerId = 'administrative-zone-map';
		}

		const el = document.getElementById(containerId);
		if (el) {
			setTimeout(() => this.initializeMap(containerId), 100);
		} else {
			this.loadAdministrativeZoneGeoJSON();
		}
	}

	// Map Functions
	private initializeMap(containerId: string = 'administrative-zone-map') {
		const container = document.getElementById(containerId);
		if (!container) {
			console.warn(
				`Map container '${containerId}' not found. Skipping map initialization.`
			);
			return;
		}

		if (this.map) {
			this.map.remove();
		}

		this.map = L.map(containerId, {
			center: [27.5142, 90.4336],
			zoom: 8,
			zoomControl: true,
			attributionControl: false,
		});

		this.baseLayer = L.tileLayer(
			'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
			{
				maxZoom: 19,
				attribution: '© OpenStreetMap contributors',
			}
		);
		this.baseLayer.addTo(this.map);

		if (!this.administrativeZoneGeoJSON) {
			this.loadAdministrativeZoneGeoJSON();
		} else {
			this.renderAllAdministrativeZones();
		}
	}

	private renderAllAdministrativeZones() {
		if (!this.map || !this.administrativeZoneGeoJSON) return;

		if (this.allAdministrativeZonesLayer) {
			this.map.removeLayer(this.allAdministrativeZonesLayer);
		}

		this.allAdministrativeZonesLayer = L.geoJSON(
			this.administrativeZoneGeoJSON,
			{
				style: (feature) => ({
					fillColor:
						feature?.properties?.type === 'Thromde' ? '#10B981' : '#3B82F6',
					fillOpacity: 0.3,
					color:
						feature?.properties?.type === 'Thromde' ? '#059669' : '#1D4ED8',
					weight: 2,
					opacity: 1,
				}),
				onEachFeature: (feature, layer) => {
					const props = feature.properties;

					layer.bindPopup(`
      <div style="padding: 8px;">
        <p style="font-weight: bold; font-size: 1.125rem; padding: 0; margin: 0;">${
					props.name
				}</p>
        <p style="padding: 0; margin: 0;"><strong>Type:</strong> ${
					props.type
				}</p>
        <p style="padding: 0; margin: 0;"><strong>Code:</strong> ${
					props.areaCode || 'N/A'
				}</p>
        <p style="margin: 0;"><strong>Area:</strong> ${
					props.areaSqKm || 'N/A'
				} km²</p>
      </div>
      `);

					layer.bindTooltip(props.name, {
						permanent: false,
						direction: 'top',
					});

					layer.on('click', () => {
						this.selectAdministrativeZoneFromMap(props);
					});

					layer.on('mouseover', () => {
						(layer as any).setStyle({
							fillOpacity: 0.7,
							weight: 3,
						});
					});

					layer.on('mouseout', () => {
						if (this.allAdministrativeZonesLayer) {
							this.allAdministrativeZonesLayer.resetStyle(layer as any);
						}
					});
				},
			}
		);

		this.allAdministrativeZonesLayer.addTo(this.map);
		this.map.fitBounds(this.allAdministrativeZonesLayer.getBounds());
	}

	selectAdministrativeZoneFromMap(properties: any) {
		const zone = this.administrativeZones.find(
			(z) => z.id === properties.id || z.areaCode === properties.areaCode
		);
		if (zone) {
			this.selectedAdministrativeZone = zone;
		}
	}

	// Table Functions
	selectAdministrativeZone(zone: AdministrativeZone) {
		this.selectedAdministrativeZone = zone;
	}

	// CRUD Operations
	openNew() {
		this.administrativeZoneForm.reset();
		this.isEditMode = false;
		this.administrativeZoneDialog = true;
	}

	editAdministrativeZone(zone: AdministrativeZone) {
		this.administrativeZoneForm.patchValue({
			name: zone.name,
			areaCode: zone.areaCode,
			dzongkhagId: zone.dzongkhagId,
			type: zone.type,
			areaSqKm: zone.areaSqKm,
		});
		this.selectedAdministrativeZone = zone;
		this.isEditMode = true;
		this.administrativeZoneDialog = true;
	}

	saveAdministrativeZone() {
		if (this.administrativeZoneForm.invalid) return;

		const formData = this.administrativeZoneForm.value;

		if (this.isEditMode && this.selectedAdministrativeZone) {
			const updateData: UpdateAdministrativeZoneDto = formData;
			this.administrativeZoneService
				.updateAdministrativeZone(
					this.selectedAdministrativeZone.id,
					updateData
				)
				.subscribe({
					next: () => {
						this.loadAdministrativeZones();
						this.administrativeZoneDialog = false;
					},
					error: (error) =>
						console.error('Error updating administrative zone:', error),
				});
		} else {
			const createData: CreateAdministrativeZoneDto = formData;
			this.administrativeZoneService
				.createAdministrativeZone(createData)
				.subscribe({
					next: () => {
						this.loadAdministrativeZones();
						this.administrativeZoneDialog = false;
					},
					error: (error) =>
						console.error('Error creating administrative zone:', error),
				});
		}
	}

	confirmDelete(zone: AdministrativeZone) {
		this.selectedAdministrativeZone = zone;
		this.deleteDialog = true;
	}

	deleteAdministrativeZone() {
		if (this.selectedAdministrativeZone) {
			this.administrativeZoneService
				.deleteAdministrativeZone(this.selectedAdministrativeZone.id)
				.subscribe({
					next: () => {
						this.loadAdministrativeZones();
						this.deleteDialog = false;
						this.selectedAdministrativeZone = null;
					},
					error: (error) =>
						console.error('Error deleting administrative zone:', error),
				});
		}
	}

	// Utility functions
	clear(table: any) {
		table.clear();
		this.globalFilterValue = '';
	}

	get totalArea(): number {
		return this.administrativeZones.reduce((sum, z) => {
			const area =
				typeof z.areaSqKm === 'string' ? parseFloat(z.areaSqKm) : z.areaSqKm;
			return sum + (isNaN(area) ? 0 : area);
		}, 0);
	}

	get averageArea(): number {
		return this.administrativeZones.length
			? this.totalArea / this.administrativeZones.length
			: 0;
	}

	get gewogCount(): number {
		return this.administrativeZones.filter(
			(z) => z.type === AdministrativeZoneType.Gewog
		).length;
	}

	get thromdeCount(): number {
		return this.administrativeZones.filter(
			(z) => z.type === AdministrativeZoneType.Thromde
		).length;
	}

	onRowSelect(event: any) {
		if (event.data) {
			this.selectAdministrativeZone(event.data);
		}
	}

	onGlobalFilter(event: Event) {
		const target = event.target as HTMLInputElement;
		this.globalFilterValue = target.value;
		if (this.dt) {
			this.dt.filterGlobal(target.value, 'contains');
		}
		if (this.dtSplit) {
			this.dtSplit.filterGlobal(target.value, 'contains');
		}
	}

	onGlobalFilterSplit(event: Event) {
		const target = event.target as HTMLInputElement;
		this.globalFilterValue = target.value;
		if (this.dtSplit) {
			this.dtSplit.filterGlobal(target.value, 'contains');
		}
	}

	getSafeAreaValue(area: any): number {
		const value = typeof area === 'string' ? parseFloat(area) : area;
		return isNaN(value) ? 0 : value;
	}

	getDzongkhagName(dzongkhagId: number): string {
		const dzongkhag = this.dzongkhags.find((d) => d.id === dzongkhagId);
		return dzongkhag?.name || 'N/A';
	}

	hasFormError(field: string): boolean {
		const control = this.administrativeZoneForm.get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	getFormError(field: string): string {
		const control = this.administrativeZoneForm.get(field);
		if (control?.errors) {
			if (control.errors['required']) return `${field} is required`;
			if (control.errors['minlength']) return `${field} is too short`;
			if (control.errors['pattern']) return `${field} format is invalid`;
			if (control.errors['min']) return `${field} must be positive`;
		}
		return '';
	}
}
