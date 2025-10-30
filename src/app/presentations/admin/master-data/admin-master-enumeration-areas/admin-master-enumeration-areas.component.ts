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
import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import {
	EnumerationArea,
	CreateEnumerationAreaDto,
	UpdateEnumerationAreaDto,
	BulkUploadResponse,
} from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { SubAdministrativeZone } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { PrimeNgModules } from '../../../../primeng.modules';
import { Table } from 'primeng/table';
import * as L from 'leaflet';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
	selector: 'app-admin-master-enumeration-areas',
	templateUrl: './admin-master-enumeration-areas.component.html',
	styleUrls: ['./admin-master-enumeration-areas.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [ConfirmationService, MessageService],
})
export class AdminMasterEnumerationAreasComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	// Table references
	@ViewChild('dt') dt!: Table;
	@ViewChild('dtSplit') dtSplit!: Table;

	// Data properties
	enumerationAreas: EnumerationArea[] = [];
	selectedEnumerationArea: EnumerationArea | null = null;
	subAdministrativeZones: SubAdministrativeZone[] = [];
	loading = false;

	// Map properties
	private map?: L.Map;
	enumerationAreaGeoJSON: any;
	private allEnumerationAreasLayer?: L.GeoJSON;
	private baseLayer?: L.TileLayer;

	// View control
	currentView: 'table' | 'split' = 'table';

	// Dialog states
	enumerationAreaDialog = false;
	deleteDialog = false;
	uploadGeojsonDialog = false;
	bulkUploadDialog = false;

	// Form
	enumerationAreaForm: FormGroup;
	isEditMode = false;

	// Upload properties
	selectedFile: File | null = null;
	uploadLoading = false;

	// Bulk upload properties
	bulkUploadFile: File | null = null;
	bulkUploadLoading = false;
	bulkUploadResults: BulkUploadResponse | null = null;

	// Table properties
	globalFilterValue = '';

	constructor(
		private enumerationAreaService: EnumerationAreaDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private fb: FormBuilder,
		private messageService: MessageService
	) {
		this.enumerationAreaForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			description: ['', [Validators.required]],
			areaCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],
			subAdministrativeZoneId: ['', [Validators.required]],
			areaSqKm: ['', [Validators.min(0)]],
		});
	}

	ngOnInit() {
		this.loadSubAdministrativeZones();
		this.loadEnumerationAreas();
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
			setTimeout(() => this.initializeMap('enumeration-area-map-tab'), 100);
		}
	}

	ngOnDestroy() {
		if (this.map) {
			this.map.remove();
		}
	}

	loadSubAdministrativeZones() {
		this.subAdministrativeZoneService
			.findAllSubAdministrativeZones()
			.subscribe({
				next: (data) => {
					this.subAdministrativeZones = data;
				},
				error: (error) => {
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

	loadEnumerationAreas() {
		this.loading = true;
		this.enumerationAreaService.findAllEnumerationAreas().subscribe({
			next: (data) => {
				this.enumerationAreas = data;
				this.loading = false;
			},
			error: (error) => {
				this.loading = false;
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

	loadEnumerationAreaGeoJSON() {
		this.enumerationAreaService.getAllEnumerationAreaGeojson().subscribe({
			next: (data) => {
				this.enumerationAreaGeoJSON = data;
				if (this.map) {
					this.renderAllEnumerationAreas();
				}
			},
			error: (error) => {
				console.error('Error loading enumeration area GeoJSON:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load map data',
					life: 3000,
				});
			},
		});
	}

	reloadMap() {
		this.enumerationAreaGeoJSON = undefined;

		if (this.map) {
			this.map.remove();
			this.map = undefined;
		}

		let containerId = 'enumeration-area-map';
		if (this.currentView === 'table') {
			if (document.getElementById('enumeration-area-map-tab')) {
				containerId = 'enumeration-area-map-tab';
			} else if (document.getElementById('enumeration-area-map')) {
				containerId = 'enumeration-area-map';
			}
		} else {
			containerId = 'enumeration-area-map';
		}

		const el = document.getElementById(containerId);
		if (el) {
			setTimeout(() => this.initializeMap(containerId), 100);
		} else {
			this.loadEnumerationAreaGeoJSON();
		}
	}

	// Map Functions
	private initializeMap(containerId: string = 'enumeration-area-map') {
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
			zoom: 10,
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

		if (!this.enumerationAreaGeoJSON) {
			this.loadEnumerationAreaGeoJSON();
		} else {
			this.renderAllEnumerationAreas();
		}
	}

	private renderAllEnumerationAreas() {
		if (!this.map || !this.enumerationAreaGeoJSON) return;

		if (this.allEnumerationAreasLayer) {
			this.map.removeLayer(this.allEnumerationAreasLayer);
		}

		this.allEnumerationAreasLayer = L.geoJSON(this.enumerationAreaGeoJSON, {
			style: () => ({
				fillColor: '#EC4899',
				fillOpacity: 0.3,
				color: '#DB2777',
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
    <div><span style="font-weight: 600; color: #6b7280;">Code:</span> <span style="color: #374151;">${
			props.areaCode || 'N/A'
		}</span></div>
    <div><span style="font-weight: 600; color: #6b7280;">Area:</span> <span style="color: #374151;">${
			props.areaSqKm || 'N/A'
		} km²</span></div>
    <div><span style="font-weight: 600; color: #6b7280;">Description:</span> <span style="color: #374151;">${
			props.description || 'N/A'
		}</span></div>
  </div>
</div>
`);

				layer.bindTooltip(props.name, {
					permanent: false,
					direction: 'top',
				});

				layer.on('click', () => {
					this.selectEnumerationAreaFromMap(props);
				});

				layer.on('mouseover', () => {
					(layer as any).setStyle({
						fillOpacity: 0.7,
						weight: 3,
					});
				});

				layer.on('mouseout', () => {
					if (this.allEnumerationAreasLayer) {
						this.allEnumerationAreasLayer.resetStyle(layer as any);
					}
				});
			},
		});

		this.allEnumerationAreasLayer.addTo(this.map);
		this.map.fitBounds(this.allEnumerationAreasLayer.getBounds());
	}

	selectEnumerationAreaFromMap(properties: any) {
		const area = this.enumerationAreas.find(
			(a) => a.id === properties.id || a.areaCode === properties.areaCode
		);
		if (area) {
			this.selectedEnumerationArea = area;
		}
	}

	// Table Functions
	selectEnumerationArea(area: EnumerationArea) {
		this.selectedEnumerationArea = area;
	}

	// CRUD Operations
	openNew() {
		this.enumerationAreaForm.reset();
		this.isEditMode = false;
		this.enumerationAreaDialog = true;
	}

	editEnumerationArea(area: EnumerationArea) {
		this.enumerationAreaForm.patchValue({
			name: area.name,
			description: area.description,
			areaCode: area.areaCode,
			subAdministrativeZoneId: area.subAdministrativeZoneId,
			areaSqKm: area.areaSqKm,
		});
		this.selectedEnumerationArea = area;
		this.isEditMode = true;
		this.enumerationAreaDialog = true;
	}

	saveEnumerationArea() {
		if (this.enumerationAreaForm.invalid) return;

		const formData = this.enumerationAreaForm.value;

		if (this.isEditMode && this.selectedEnumerationArea) {
			const updateData: UpdateEnumerationAreaDto = formData;
			this.enumerationAreaService
				.updateEnumerationArea(this.selectedEnumerationArea.id, updateData)
				.subscribe({
					next: () => {
						this.loadEnumerationAreas();
						this.enumerationAreaDialog = false;
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Enumeration area updated successfully',
							life: 3000,
						});
					},
					error: (error) => {
						console.error('Error updating enumeration area:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to update enumeration area',
							life: 3000,
						});
					},
				});
		} else {
			const createData: CreateEnumerationAreaDto = formData;
			this.enumerationAreaService.createEnumerationArea(createData).subscribe({
				next: () => {
					this.loadEnumerationAreas();
					this.enumerationAreaDialog = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Enumeration area created successfully',
						life: 3000,
					});
				},
				error: (error) => {
					console.error('Error creating enumeration area:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to create enumeration area',
						life: 3000,
					});
				},
			});
		}
	}

	confirmDelete(area: EnumerationArea) {
		this.selectedEnumerationArea = area;
		this.deleteDialog = true;
	}

	deleteEnumerationArea() {
		if (this.selectedEnumerationArea) {
			this.enumerationAreaService
				.deleteEnumerationArea(this.selectedEnumerationArea.id)
				.subscribe({
					next: () => {
						this.loadEnumerationAreas();
						this.deleteDialog = false;
						this.selectedEnumerationArea = null;
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Enumeration area deleted successfully',
							life: 3000,
						});
					},
					error: (error) => {
						console.error('Error deleting enumeration area:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to delete enumeration area',
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
		return this.enumerationAreas.reduce((sum, a) => {
			const area =
				typeof a.areaSqKm === 'string' ? parseFloat(a.areaSqKm) : a.areaSqKm;
			return sum + (area && !isNaN(area) ? area : 0);
		}, 0);
	}

	get averageArea(): number {
		return this.enumerationAreas.length
			? this.totalArea / this.enumerationAreas.length
			: 0;
	}

	onRowSelect(event: any) {
		if (event.data) {
			this.selectEnumerationArea(event.data);
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

	getSubAdministrativeZoneName(subAdministrativeZoneId: number): string {
		const zone = this.subAdministrativeZones.find(
			(z) => z.id === subAdministrativeZoneId
		);
		return zone?.name || 'N/A';
	}

	hasFormError(field: string): boolean {
		const control = this.enumerationAreaForm.get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	getFormError(field: string): string {
		const control = this.enumerationAreaForm.get(field);
		if (control?.errors) {
			if (control.errors['required']) return `${field} is required`;
			if (control.errors['minlength']) return `${field} is too short`;
			if (control.errors['pattern']) return `${field} format is invalid`;
			if (control.errors['min']) return `${field} must be positive`;
		}
		return '';
	}

	// Upload GeoJSON functionality
	openUploadGeojson(area: EnumerationArea) {
		this.selectedEnumerationArea = area;
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
		if (!this.selectedEnumerationArea || !this.selectedFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select a file to upload',
				life: 3000,
			});
			return;
		}

		this.uploadLoading = true;
		this.enumerationAreaService
			.uploadGeojsonByEnumerationArea(
				this.selectedEnumerationArea.id,
				this.selectedFile
			)
			.subscribe({
				next: (response) => {
					this.uploadLoading = false;
					this.uploadGeojsonDialog = false;
					this.selectedFile = null;
					this.loadEnumerationAreas();
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

	// Bulk Upload functionality
	openBulkUpload() {
		this.bulkUploadFile = null;
		this.bulkUploadResults = null;
		this.bulkUploadDialog = true;
	}

	onBulkFileSelect(event: any) {
		const files = event.files;
		if (files && files.length > 0) {
			this.bulkUploadFile = files[0];
			this.bulkUploadResults = null; // Reset results when new file is selected
		}
	}

	executeBulkUpload() {
		if (!this.bulkUploadFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select a file to upload',
				life: 3000,
			});
			return;
		}

		this.bulkUploadLoading = true;
		this.enumerationAreaService
			.bulkUploadGeojson(this.bulkUploadFile)
			.subscribe({
				next: (response) => {
					this.bulkUploadLoading = false;
					this.bulkUploadResults = response;

					// Show summary message
					const successCount = response.success;
					const skippedCount = response.skipped;
					const errorCount = response.errors.length;

					if (successCount > 0) {
						this.messageService.add({
							severity: 'success',
							summary: 'Bulk Upload Complete',
							detail: `Successfully created ${successCount} enumeration area(s)`,
							life: 5000,
						});
					}

					if (skippedCount > 0) {
						this.messageService.add({
							severity: 'info',
							summary: 'Skipped Items',
							detail: `${skippedCount} area(s) already exist`,
							life: 5000,
						});
					}

					if (errorCount > 0) {
						this.messageService.add({
							severity: 'warn',
							summary: 'Errors Encountered',
							detail: `${errorCount} feature(s) failed to process`,
							life: 5000,
						});
					}

					// Reload the enumeration areas list
					this.loadEnumerationAreas();

					// Reload map if needed
					if (this.map && successCount > 0) {
						this.reloadMap();
					}
				},
				error: (error) => {
					this.bulkUploadLoading = false;
					console.error('Error bulk uploading GeoJSON:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to bulk upload GeoJSON',
						life: 5000,
					});
				},
			});
	}

	closeBulkUpload() {
		this.bulkUploadDialog = false;
		this.bulkUploadFile = null;
		this.bulkUploadResults = null;
	}
}
