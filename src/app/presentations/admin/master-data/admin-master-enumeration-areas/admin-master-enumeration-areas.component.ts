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
import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import {
	EnumerationArea,
	CreateEnumerationAreaDto,
	UpdateEnumerationAreaDto,
	BulkUploadResponse,
} from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import {
	Dzongkhag,
	DzongkhagHierarchicalResponse,
	DzongkhagEnumerationAreasResponse,
} from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { AdministrativeZone } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import {
	SubAdministrativeZone,
	SubAdministrativeZoneType,
} from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';

// Hierarchical interfaces for the component
interface HierarchicalSubAdministrativeZone
	extends Omit<SubAdministrativeZone, 'enumerationAreas'> {
	enumerationAreas?: EnumerationArea[];
}

interface HierarchicalAdministrativeZone
	extends Omit<AdministrativeZone, 'subAdministrativeZones'> {
	subAdministrativeZones?: HierarchicalSubAdministrativeZone[];
}

interface HierarchicalDzongkhagResponse
	extends Omit<Dzongkhag, 'administrativeZones'> {
	administrativeZones: HierarchicalAdministrativeZone[];
}
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
	@ViewChild('dtSplit') dtSplit!: Table;

	// Data properties
	dzongkhags: Dzongkhag[] = [];
	selectedDzongkhag: Dzongkhag | null = null;
	hierarchicalData: HierarchicalDzongkhagResponse | null = null;
	enumerationAreas: EnumerationArea[] = [];
	hierarchicalTableData: any[] = []; // For hierarchical table display
	selectedEnumerationArea: EnumerationArea | null = null;
	subAdministrativeZones: SubAdministrativeZone[] = [];
	loading = false;
	loadingEAs = false;


	// Map properties
	private map?: L.Map;
	enumerationAreaGeoJSON: any;
	private allEnumerationAreasLayer?: L.GeoJSON;
	private baseLayer?: L.TileLayer;

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
		private dzongkhagService: DzongkhagDataService,
		private fb: FormBuilder,
		private messageService: MessageService,
		private router: Router
	) {
		this.enumerationAreaForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			description: ['', [Validators.required]],
			areaCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],
			subAdministrativeZoneId: ['', [Validators.required]],
		});
	}

	ngOnInit() {
		this.loadDzongkhags();

		// Create global function for map popup navigation
		(window as any).navigateToEADetails = (id: number) => {
			this.viewEnumerationAreaDetails({ id } as EnumerationArea);
		};
	}
	ngAfterViewInit() {
		// Initialize map for split view
		setTimeout(() => this.initializeMap(), 100);
	}

	ngOnDestroy() {
		if (this.map) {
			this.map.remove();
		}

		// Clean up global function
		delete (window as any).navigateToEADetails;
	}

	loadDzongkhags() {
		this.loading = true;
		this.dzongkhagService.findAllDzongkhags().subscribe({
			next: (data) => {
				this.dzongkhags = data;
				this.loading = false;

				// Default to Thimphu dzongkhag
				const thimphu = data.find(
					(d) =>
						d.name.toLowerCase().includes('thimphu') ||
						d.name.toLowerCase().includes('thimpu')
				);

				if (thimphu) {
					this.selectedDzongkhag = thimphu;
					this.loadEnumerationAreasByDzongkhag();
				} else if (data.length > 0) {
					// Fallback to first dzongkhag if Thimphu not found
					this.selectedDzongkhag = data[0];
					this.loadEnumerationAreasByDzongkhag();
				}
			},
			error: (error) => {
				this.loading = false;
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

	loadEnumerationAreasByDzongkhag() {
		if (!this.selectedDzongkhag) return;

		this.loadingEAs = true;
		const withGeom = true; // Always load with geometry
		const includeHierarchy = true; // Always include hierarchy

		this.dzongkhagService
			.getEnumerationAreasByDzongkhag(
				this.selectedDzongkhag.id,
				withGeom,
				includeHierarchy
			)
			.subscribe({
				next: (data) => {
					this.hierarchicalData = data;
					this.enumerationAreas = this.flattenEnumerationAreas(data);
					this.buildHierarchicalTableData(); // Build hierarchical table structure
					this.loadingEAs = false;

					// Load sub-administrative zones for form dropdown
					this.loadSubAdministrativeZonesForDzongkhag();
				},
				error: (error) => {
					this.loadingEAs = false;
					console.error('Error loading enumeration areas by dzongkhag:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumeration areas',
						life: 3000,
					});
				},
			});
	}

	loadSubAdministrativeZonesForDzongkhag() {
		if (!this.selectedDzongkhag) return;

		// Extract sub-administrative zones from hierarchical data
		if (this.hierarchicalData?.administrativeZones) {
			this.subAdministrativeZones = [];
			this.hierarchicalData.administrativeZones.forEach(
				(adminZone: HierarchicalAdministrativeZone) => {
					if (adminZone.subAdministrativeZones) {
						this.subAdministrativeZones.push(
							...adminZone.subAdministrativeZones.map(
								(subZone: HierarchicalSubAdministrativeZone) => {
									const mappedType =
										subZone.type === 'chiwog'
											? SubAdministrativeZoneType.CHIWOG
											: SubAdministrativeZoneType.LAP;
									return {
										id: subZone.id,
										name: subZone.name,
										areaCode: subZone.areaCode,
										type: mappedType,
										administrativeZoneId: subZone.administrativeZoneId,
										geom: subZone.geom,
									} as SubAdministrativeZone;
								}
							)
						);
					}
				}
			);
		}
	}

	flattenEnumerationAreas(
		hierarchicalData: HierarchicalDzongkhagResponse
	): EnumerationArea[] {
		const flatAreas: EnumerationArea[] = [];

		hierarchicalData.administrativeZones?.forEach(
			(adminZone: HierarchicalAdministrativeZone) => {
				adminZone.subAdministrativeZones?.forEach(
					(subAdminZone: HierarchicalSubAdministrativeZone) => {
						if (subAdminZone.enumerationAreas) {
							flatAreas.push(...subAdminZone.enumerationAreas);
						}
					}
				);
			}
		);

		return flatAreas;
	}

	buildHierarchicalTableData() {
		this.hierarchicalTableData = [];

		if (!this.hierarchicalData?.administrativeZones) return;

		this.hierarchicalData.administrativeZones.forEach(
			(adminZone: HierarchicalAdministrativeZone) => {
				// Add Administrative Zone header row
				this.hierarchicalTableData.push({
					type: 'admin-zone',
					id: `admin-${adminZone.id}`,
					name: adminZone.name,
					areaCode: adminZone.areaCode,
					level: 0,
					isHeader: true,
					totalEAs: this.getAdminZoneEACount(adminZone),
					data: adminZone,
				});

				// Add Sub-Administrative Zones
				adminZone.subAdministrativeZones?.forEach(
					(subAdminZone: HierarchicalSubAdministrativeZone) => {
						// Add Sub-Administrative Zone header row
						this.hierarchicalTableData.push({
							type: 'sub-admin-zone',
							id: `sub-admin-${subAdminZone.id}`,
							name: subAdminZone.name,
							areaCode: subAdminZone.areaCode,
							level: 1,
							isHeader: true,
							zoneType: subAdminZone.type,
							totalEAs: subAdminZone.enumerationAreas?.length || 0,
							data: subAdminZone,
						});

						// Add Enumeration Areas under this Sub-Administrative Zone
						subAdminZone.enumerationAreas?.forEach((ea: EnumerationArea) => {
							this.hierarchicalTableData.push({
								type: 'enumeration-area',
								id: `ea-${ea.id}`,
								name: ea.name,
								areaCode: ea.areaCode,
								description: ea.description,
								level: 2,
								isHeader: false,
								hasGeom: !!ea.geom,
								data: ea,
								parentSubAdminZone: subAdminZone,
								parentAdminZone: adminZone,
							});
						});
					}
				);
			}
		);
	}

	private getAdminZoneEACount(
		adminZone: HierarchicalAdministrativeZone
	): number {
		return (
			adminZone.subAdministrativeZones?.reduce(
				(total: number, subZone: HierarchicalSubAdministrativeZone) =>
					total + (subZone.enumerationAreas?.length || 0),
				0
			) || 0
		);
	}

	onDzongkhagChange() {
		if (this.selectedDzongkhag) {
			this.loadEnumerationAreasByDzongkhag();
		} else {
			this.enumerationAreas = [];
			this.subAdministrativeZones = [];
			this.hierarchicalData = null;
		}
	}

	loadSubAdministrativeZones() {
		// This method is kept for backward compatibility but now uses dzongkhag-based loading
		if (this.selectedDzongkhag) {
			this.loadSubAdministrativeZonesForDzongkhag();
		}
	}

	loadEnumerationAreas() {
		// This method is now replaced by loadEnumerationAreasByDzongkhag
		if (this.selectedDzongkhag) {
			this.loadEnumerationAreasByDzongkhag();
		}
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

		const containerId = 'enumeration-area-map';
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

				const popupContent = `
<div style="padding: 4px; ">
  <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px; color: #111827;">${
		props.name
	}</div>
  <div style="display: grid; gap: 4px; font-size: 13px; margin-bottom: 12px;">
    <div><span style="font-weight: 600; color: #6b7280;">Code:</span> <span style="color: #374151;">${
			props.areaCode || 'N/A'
		}</span></div>
    <div><span style="font-weight: 600; color: #6b7280;">Description:</span> <span style="color: #374151;">${
			props.description || 'N/A'
		}</span></div>
  </div>
  <button 
    onclick="window.navigateToEADetails(${props.id})"
    style="
      width: 100%;
      padding: 4px 12px;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background-color 0.2s;
    "
    onmouseover="this.style.backgroundColor='#2563eb'"
    onmouseout="this.style.backgroundColor='#3b82f6'"
  >
    <i class="pi pi-eye" style="font-size: 12px;"></i>
    View Details
  </button>
</div>
`;

				layer.bindPopup(popupContent);

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
			this.selectedEnumerationArea = {
				...area,
				description: area.description || '',
			} as EnumerationArea;
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

	onRowSelectHierarchical(item: any) {
		if (item.type === 'enumeration-area') {
			this.selectedEnumerationArea = {
				...item.data,
				description: item.data.description || '',
			} as EnumerationArea;
		}
	}

	onGlobalFilterSplit(event: Event) {
		const target = event.target as HTMLInputElement;
		this.globalFilterValue = target.value;
		if (this.dtSplit) {
			this.dtSplit.filterGlobal(target.value, 'contains');
		}
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

	// Navigate to detail viewer
	viewEnumerationAreaDetails(area: EnumerationArea) {
		this.router.navigate(['/admin/data-view/eazone', area.id]);
	}

	// Navigate to sub-administrative zone detail viewer
	viewSubAdministrativeZoneDetails(subAdminZone: any) {
		this.router.navigate(['/admin/data-view/sub-admzone', subAdminZone.id]);
	}

	// Additional computed properties for statistics
	get administrativeZoneCount(): number {
		return this.hierarchicalData?.administrativeZones?.length || 0;
	}

	get subAdministrativeZoneCount(): number {
		return this.subAdministrativeZones.length;
	}
}
