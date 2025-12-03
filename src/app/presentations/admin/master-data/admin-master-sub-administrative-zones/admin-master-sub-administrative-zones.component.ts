import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
	FormsModule,
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	Validators,
} from '@angular/forms';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import {
	SubAdministrativeZone,
	CreateSubAdministrativeZoneDto,
	UpdateSubAdministrativeZoneDto,
	SubAdministrativeZoneType,
} from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { AdministrativeZone } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { PrimeNgModules } from '../../../../primeng.modules';
import { Table } from 'primeng/table';
import * as L from 'leaflet';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
	selector: 'app-admin-master-sub-administrative-zones',
	templateUrl: './admin-master-sub-administrative-zones.component.html',
	styleUrls: ['./admin-master-sub-administrative-zones.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [ConfirmationService, MessageService],
})
export class AdminMasterSubAdministrativeZonesComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	// Table references
	@ViewChild('dt') dt!: Table;
	@ViewChild('dtSplit') dtSplit!: Table;

	// Data properties
	subAdministrativeZones: SubAdministrativeZone[] = [];
	selectedSubAdministrativeZone: SubAdministrativeZone | null = null;
	administrativeZones: AdministrativeZone[] = [];
	loading = false;

	// Map properties
	private map?: L.Map;
	subAdministrativeZoneGeoJSON: any;
	private allSubAdministrativeZonesLayer?: L.GeoJSON;
	private baseLayer?: L.TileLayer;

	// View control
	currentView: 'table' | 'split' = 'table';

	// Dialog states
	subAdministrativeZoneDialog = false;
	deleteDialog = false;
	uploadGeojsonDialog = false;

	// Form
	subAdministrativeZoneForm: FormGroup;
	isEditMode = false;

	// Upload properties
	selectedFile: File | null = null;
	uploadLoading = false;

	// Enum for template access
	SubAdministrativeZoneType = SubAdministrativeZoneType;
	zoneTypes = Object.values(SubAdministrativeZoneType);

	// Table properties
	globalFilterValue = '';

	constructor(
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private fb: FormBuilder,
		private messageService: MessageService,
		private router: Router
	) {
		this.subAdministrativeZoneForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			areaCode: [''],
			administrativeZoneId: ['', [Validators.required]],
			type: ['', [Validators.required]],
			areaSqKm: ['', [Validators.min(0)]],
		});
	}

	ngOnInit() {
		this.loadAdministrativeZones();
		this.loadSubAdministrativeZones();
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
			setTimeout(
				() => this.initializeMap('sub-administrative-zone-map-tab'),
				100
			);
		}
	}

	ngOnDestroy() {
		if (this.map) {
			this.map.remove();
		}
	}

	loadAdministrativeZones() {
		this.administrativeZoneService.findAllAdministrativeZones().subscribe({
			next: (data) => {
				this.administrativeZones = data;
			},
			error: (error) => {
				console.error('Error loading administrative zones:', error);
			},
		});
	}

	loadSubAdministrativeZones() {
		this.loading = true;
		this.subAdministrativeZoneService
			.findAllSubAdministrativeZones()
			.subscribe({
				next: (data) => {
					this.subAdministrativeZones = data;
					this.loading = false;
				},
				error: (error) => {
					this.loading = false;
					console.error('Error loading sub-administrative zones:', error);
				},
			});
	}

	loadSubAdministrativeZoneGeoJSON() {
		this.subAdministrativeZoneService
			.getAllSubAdministrativeZoneGeojson()
			.subscribe({
				next: (data) => {
					this.subAdministrativeZoneGeoJSON = data;
					if (this.map) {
						this.renderAllSubAdministrativeZones();
					}
				},
				error: (error) => {
					console.error(
						'Error loading sub-administrative zone GeoJSON:',
						error
					);
				},
			});
	}

	reloadMap() {
		this.subAdministrativeZoneGeoJSON = undefined;

		if (this.map) {
			this.map.remove();
			this.map = undefined;
		}

		let containerId = 'sub-administrative-zone-map';
		if (this.currentView === 'table') {
			if (document.getElementById('sub-administrative-zone-map-tab')) {
				containerId = 'sub-administrative-zone-map-tab';
			} else if (document.getElementById('sub-administrative-zone-map')) {
				containerId = 'sub-administrative-zone-map';
			}
		} else {
			containerId = 'sub-administrative-zone-map';
		}

		const el = document.getElementById(containerId);
		if (el) {
			setTimeout(() => this.initializeMap(containerId), 100);
		} else {
			this.loadSubAdministrativeZoneGeoJSON();
		}
	}

	// Map Functions
	private initializeMap(containerId: string = 'sub-administrative-zone-map') {
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
			zoom: 9,
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

		if (!this.subAdministrativeZoneGeoJSON) {
			this.loadSubAdministrativeZoneGeoJSON();
		} else {
			this.renderAllSubAdministrativeZones();
		}
	}

	private renderAllSubAdministrativeZones() {
		if (!this.map || !this.subAdministrativeZoneGeoJSON) return;

		if (this.allSubAdministrativeZonesLayer) {
			this.map.removeLayer(this.allSubAdministrativeZonesLayer);
		}

		this.allSubAdministrativeZonesLayer = L.geoJSON(
			this.subAdministrativeZoneGeoJSON,
			{
				style: (feature) => ({
					fillColor:
						feature?.properties?.type === 'lap' ? '#F59E0B' : '#8B5CF6',
					fillOpacity: 0.3,
					color: feature?.properties?.type === 'lap' ? '#D97706' : '#7C3AED',
					weight: 2,
					opacity: 1,
				}),
				onEachFeature: (feature, layer) => {
					const props = feature.properties;

					layer.bindPopup(`
<div style="padding: 12px; min-width: 200px;">
  <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px; color: #111827;">${
		props.name
	}</div>
  <div style="display: grid; gap: 4px; font-size: 13px;">
    <div><span style="font-weight: 600; color: #6b7280;">Type:</span> <span style="color: #374151;">${
			props.type
		}</span></div>
    <div><span style="font-weight: 600; color: #6b7280;">Code:</span> <span style="color: #374151;">${
			props.areaCode || 'N/A'
		}</span></div>
    <div><span style="font-weight: 600; color: #6b7280;">Area:</span> <span style="color: #374151;">${
			props.areaSqKm || 'N/A'
		} km²</span></div>
  </div>
</div>
`);

					layer.bindTooltip(props.name, {
						permanent: false,
						direction: 'top',
					});

					layer.on('click', () => {
						this.selectSubAdministrativeZoneFromMap(props);
					});

					layer.on('mouseover', () => {
						(layer as any).setStyle({
							fillOpacity: 0.7,
							weight: 3,
						});
					});

					layer.on('mouseout', () => {
						if (this.allSubAdministrativeZonesLayer) {
							this.allSubAdministrativeZonesLayer.resetStyle(layer as any);
						}
					});
				},
			}
		);

		this.allSubAdministrativeZonesLayer.addTo(this.map);
		this.map.fitBounds(this.allSubAdministrativeZonesLayer.getBounds());
	}

	selectSubAdministrativeZoneFromMap(properties: any) {
		const zone = this.subAdministrativeZones.find(
			(z) => z.id === properties.id || z.areaCode === properties.areaCode
		);
		if (zone) {
			this.selectedSubAdministrativeZone = zone;
		}
	}

	// Table Functions
	selectSubAdministrativeZone(zone: SubAdministrativeZone) {
		this.selectedSubAdministrativeZone = zone;
	}

	// CRUD Operations
	openNew() {
		this.subAdministrativeZoneForm.reset();
		this.isEditMode = false;
		this.subAdministrativeZoneDialog = true;
	}

	editSubAdministrativeZone(zone: SubAdministrativeZone) {
		this.subAdministrativeZoneForm.patchValue({
			name: zone.name,
			areaCode: zone.areaCode,
			administrativeZoneId: zone.administrativeZoneId,
			type: zone.type,
			areaSqKm: zone.areaSqKm,
		});
		this.selectedSubAdministrativeZone = zone;
		this.isEditMode = true;
		this.subAdministrativeZoneDialog = true;
	}

	saveSubAdministrativeZone() {
		if (this.subAdministrativeZoneForm.invalid) return;

		const formData = this.subAdministrativeZoneForm.value;

		if (this.isEditMode && this.selectedSubAdministrativeZone) {
			const updateData: UpdateSubAdministrativeZoneDto = formData;
			this.subAdministrativeZoneService
				.updateSubAdministrativeZone(
					this.selectedSubAdministrativeZone.id,
					updateData
				)
				.subscribe({
					next: () => {
						this.loadSubAdministrativeZones();
						this.subAdministrativeZoneDialog = false;
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Chiwog/LAP updated successfully',
							life: 3000,
						});
					},
					error: (error) => {
						console.error('Error updating sub-administrative zone:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to update chiwog/LAP',
							life: 3000,
						});
					},
				});
		} else {
			const createData: CreateSubAdministrativeZoneDto = formData;
			this.subAdministrativeZoneService
				.createSubAdministrativeZone(createData)
				.subscribe({
					next: () => {
						this.loadSubAdministrativeZones();
						this.subAdministrativeZoneDialog = false;
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Chiwog/LAP created successfully',
							life: 3000,
						});
					},
					error: (error) => {
						console.error('Error creating sub-administrative zone:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to create chiwog/LAP',
							life: 3000,
						});
					},
				});
		}
	}

	confirmDelete(zone: SubAdministrativeZone) {
		this.selectedSubAdministrativeZone = zone;
		this.deleteDialog = true;
	}

	deleteSubAdministrativeZone() {
		if (this.selectedSubAdministrativeZone) {
			this.subAdministrativeZoneService
				.deleteSubAdministrativeZone(this.selectedSubAdministrativeZone.id)
				.subscribe({
					next: () => {
						this.loadSubAdministrativeZones();
						this.deleteDialog = false;
						this.selectedSubAdministrativeZone = null;
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Chiwog/LAP deleted successfully',
							life: 3000,
						});
					},
					error: (error) => {
						console.error('Error deleting sub-administrative zone:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to delete chiwog/LAP',
							life: 3000,
						});
					},
				});
		}
	}

	// Utility functions
	clear(table: any) {
		table.clear();
		this.globalFilterValue = '';
	}

	get totalArea(): number {
		return this.subAdministrativeZones.reduce((sum, z) => {
			const area =
				typeof z.areaSqKm === 'string' ? parseFloat(z.areaSqKm) : z.areaSqKm;
			return sum + (area && !isNaN(area) ? area : 0);
		}, 0);
	}

	get averageArea(): number {
		return this.subAdministrativeZones.length
			? this.totalArea / this.subAdministrativeZones.length
			: 0;
	}

	get chiwogCount(): number {
		return this.subAdministrativeZones.filter(
			(z) => z.type === SubAdministrativeZoneType.CHIWOG
		).length;
	}

	get lapCount(): number {
		return this.subAdministrativeZones.filter(
			(z) => z.type === SubAdministrativeZoneType.LAP
		).length;
	}

	onRowSelect(event: any) {
		if (event.data) {
			this.selectSubAdministrativeZone(event.data);
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

	getAdministrativeZoneName(administrativeZoneId: number): string {
		const zone = this.administrativeZones.find(
			(z) => z.id === administrativeZoneId
		);
		return zone?.name || 'N/A';
	}

	hasFormError(field: string): boolean {
		const control = this.subAdministrativeZoneForm.get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	getFormError(field: string): string {
		const control = this.subAdministrativeZoneForm.get(field);
		if (control?.errors) {
			if (control.errors['required']) return `${field} is required`;
			if (control.errors['minlength']) return `${field} is too short`;
			if (control.errors['pattern']) return `${field} format is invalid`;
			if (control.errors['min']) return `${field} must be positive`;
		}
		return '';
	}

	// Upload GeoJSON functionality
	openUploadGeojson(zone: SubAdministrativeZone) {
		this.selectedSubAdministrativeZone = zone;
		this.selectedFile = null;
		this.uploadGeojsonDialog = true;
	}

	onFileSelect(event: any) {
		const files = event.files;
		if (files && files.length > 0) {
			this.selectedFile = files[0];
		}
	}

	uploadGeojson() {
		if (!this.selectedSubAdministrativeZone || !this.selectedFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select a file to upload',
				life: 3000,
			});
			return;
		}

		this.uploadLoading = true;
		this.subAdministrativeZoneService
			.uploadGeojsonBySubAdministrativeZone(
				this.selectedSubAdministrativeZone.id,
				this.selectedFile
			)
			.subscribe({
				next: (response) => {
					this.uploadLoading = false;
					this.uploadGeojsonDialog = false;
					this.selectedFile = null;
					this.loadSubAdministrativeZones();
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'GeoJSON uploaded successfully',
						life: 3000,
					});
				},
				error: (error) => {
					this.uploadLoading = false;
					console.error('Error uploading GeoJSON:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to upload GeoJSON',
						life: 5000,
					});
				},
			});
	}

	// Navigate to sub-administrative zone detail viewer
	viewSubAdministrativeZoneDetails(zone: SubAdministrativeZone) {
		this.router.navigate(['/admin/data-view/sub-admzone', zone.id]);
	}
}
