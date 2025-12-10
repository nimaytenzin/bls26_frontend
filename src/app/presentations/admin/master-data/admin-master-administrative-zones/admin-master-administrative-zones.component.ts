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
	BulkUploadResponse,
} from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { PrimeNgModules } from '../../../../primeng.modules';
import { Table } from 'primeng/table';
import { FileUpload } from 'primeng/fileupload';
import * as L from 'leaflet';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { BasemapService } from '../../../../core/utility/basemap.service';
import { LocationSelectionService } from '../../../../core/services/location-selection.service';

@Component({
	selector: 'app-admin-master-administrative-zones',
	templateUrl: './admin-master-administrative-zones.component.html',
	styleUrls: ['./admin-master-administrative-zones.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [ConfirmationService, MessageService],
})
export class AdminMasterAdministrativeZonesComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	// Table reference
	@ViewChild('dtSplit') dtSplit!: Table;

	// Data properties
	administrativeZones: AdministrativeZone[] = [];
	selectedAdministrativeZone: AdministrativeZone | null = null;
	dzongkhags: Dzongkhag[] = [];
	selectedDzongkhag: Dzongkhag | null = null;
	loading = false;

	// Map properties
	private map?: L.Map;
	administrativeZoneGeoJSON: any;
	private allAdministrativeZonesLayer?: L.GeoJSON;
	private baseLayer?: L.TileLayer;

	// Basemap properties
	selectedBasemapId = 'positron'; // Default basemap
	basemapCategories: Record<
		string,
		{ label: string; basemaps: Array<{ id: string; name: string }> }
	> = {};


	// Dialog states
	administrativeZoneDialog = false;
	deleteDialog = false;
	uploadGeojsonDialog = false;
	selectedZoneForUpload: AdministrativeZone | null = null;
	selectedFile: File | null = null;
	uploadGeojsonLoading = false;

	// Bulk Upload Dialog
	bulkUploadDialog = false;
	bulkUploadFile: File | null = null;
	selectedDzongkhagForBulkUpload: Dzongkhag | null = null;
	bulkUploadLoading = false;
	bulkUploadProgress = 0;
	bulkUploadResults: BulkUploadResponse | null = null;

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
		private fb: FormBuilder,
		private messageService: MessageService,
		private router: Router,
		private basemapService: BasemapService,
		private locationSelectionService: LocationSelectionService
	) {
		this.administrativeZoneForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			areaCode: [''],
			dzongkhagId: ['', [Validators.required]],
			type: ['', [Validators.required]],
			areaSqKm: ['', [Validators.min(0)]],
		});
		
		// Initialize basemap categories
		this.basemapCategories = this.basemapService.getBasemapCategories();
	}

	ngOnInit() {
		// Restore selections from service
		const savedDzongkhag = this.locationSelectionService.getSelectedDzongkhag();
		const savedAdministrativeZone = this.locationSelectionService.getSelectedAdministrativeZone();
		
		if (savedDzongkhag) {
			this.selectedDzongkhag = savedDzongkhag;
		}
		if (savedAdministrativeZone) {
			this.selectedAdministrativeZone = savedAdministrativeZone;
		}
		
		this.loadDzongkhags();
		
		// Subscribe to selection changes
		this.locationSelectionService.selectedDzongkhag$.subscribe((dzongkhag) => {
			if (dzongkhag && dzongkhag.id !== this.selectedDzongkhag?.id) {
				this.selectedDzongkhag = dzongkhag;
				this.loadAdministrativeZones();
				this.loadAdministrativeZoneGeoJSON();
			}
		});
		
		this.locationSelectionService.selectedAdministrativeZone$.subscribe((adminZone) => {
			if (adminZone && adminZone.id !== this.selectedAdministrativeZone?.id) {
				this.selectedAdministrativeZone = adminZone;
			}
		});
	}

	ngAfterViewInit() {
		// Map initialization is now handled in loadDzongkhags() after auto-selection
		// This prevents race conditions with async data loading
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
				// Restore saved dzongkhag if available, otherwise auto-select first
				if (data && data.length > 0) {
					if (this.selectedDzongkhag) {
						// Find the saved dzongkhag in the list
						const foundDzongkhag = data.find(d => d.id === this.selectedDzongkhag!.id);
						if (foundDzongkhag) {
							this.selectedDzongkhag = foundDzongkhag;
							this.locationSelectionService.setSelectedDzongkhag(foundDzongkhag);
						} else {
							// Saved dzongkhag not found, use first one
							this.selectedDzongkhag = data[0];
							this.locationSelectionService.setSelectedDzongkhag(data[0]);
						}
					} else {
						// No saved selection, auto-select first
						this.selectedDzongkhag = data[0];
						this.locationSelectionService.setSelectedDzongkhag(data[0]);
					}
					
					// Load data for the selected dzongkhag
					this.loadAdministrativeZones();
					// Initialize map first, then load GeoJSON (which will render when ready)
					setTimeout(() => {
						this.initializeMap();
						// Load GeoJSON after map initialization starts
						setTimeout(() => {
							this.loadAdministrativeZoneGeoJSON();
						}, 200);
					}, 400);
				}
			},
			error: (error) => {
				console.error('Error loading dzongkhags:', error);
			},
		});
	}

	loadAdministrativeZones() {
		if (!this.selectedDzongkhag) {
			this.administrativeZones = [];
			return;
		}

		this.loading = true;
		this.administrativeZoneService
			.findAdministrativeZonesByDzongkhag(this.selectedDzongkhag.id)
			.subscribe({
				next: (data) => {
					this.administrativeZones = data;
					this.loading = false;
					
					// Restore saved administrative zone if available
					const savedAdminZone = this.locationSelectionService.getSelectedAdministrativeZone();
					if (savedAdminZone && data.find(az => az.id === savedAdminZone.id)) {
						this.selectedAdministrativeZone = savedAdminZone;
					}
				},
				error: (error) => {
					this.loading = false;
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

	loadAdministrativeZoneGeoJSON() {
		if (!this.selectedDzongkhag) {
			this.administrativeZoneGeoJSON = null;
			if (this.map && this.allAdministrativeZonesLayer) {
				this.map.removeLayer(this.allAdministrativeZonesLayer);
				this.allAdministrativeZonesLayer = undefined;
			}
			return;
		}

		this.administrativeZoneService
			.getAdministrativeZoneGeojsonByDzongkhag(this.selectedDzongkhag.id)
			.subscribe({
				next: (data) => {
					this.administrativeZoneGeoJSON = data;
					// If map exists, render immediately; otherwise initialize map first
					if (this.map) {
						// Small delay to ensure map is fully ready
						setTimeout(() => {
							this.renderAllAdministrativeZones();
						}, 150);
					} else {
						// Map not initialized yet, initialize it and it will render the data
						setTimeout(() => {
							this.initializeMap();
						}, 300);
					}
				},
				error: (error) => {
					console.error('Error loading administrative zone GeoJSON:', error);
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
		if (!this.selectedDzongkhag) {
			return;
		}

		this.administrativeZoneGeoJSON = undefined;

		if (this.map) {
			this.map.remove();
			this.map = undefined;
		}

		const containerId = 'administrative-zone-map';
		const el = document.getElementById(containerId);
		if (el) {
			setTimeout(() => this.initializeMap(containerId), 100);
		} else {
			this.loadAdministrativeZoneGeoJSON();
		}
	}

	onDzongkhagChange() {
		// Save selection to service
		if (this.selectedDzongkhag) {
			this.locationSelectionService.setSelectedDzongkhag(this.selectedDzongkhag);
		}
		
		// Reset selections
		this.selectedAdministrativeZone = null;
		this.locationSelectionService.setSelectedAdministrativeZone(null);
		this.administrativeZones = [];
		this.administrativeZoneGeoJSON = null;

		// Clear map
		if (this.map) {
			if (this.allAdministrativeZonesLayer) {
				this.map.removeLayer(this.allAdministrativeZonesLayer);
				this.allAdministrativeZonesLayer = undefined;
			}
			this.map.remove();
			this.map = undefined;
		}

		// Load data for selected dzongkhag
		if (this.selectedDzongkhag) {
			this.loadAdministrativeZones();
			this.loadAdministrativeZoneGeoJSON();
			// Initialize map after a short delay to ensure container is ready
			setTimeout(() => {
				this.initializeMap();
			}, 300);
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

		// Check if container has dimensions
		if (container.offsetWidth === 0 || container.offsetHeight === 0) {
			console.warn('Map container has no dimensions. Retrying...');
			setTimeout(() => this.initializeMap(containerId), 100);
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

		// Use basemap service for base layer
		this.baseLayer =
			this.basemapService.createTileLayer(this.selectedBasemapId) ||
			L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '© OpenStreetMap contributors',
			});
		this.baseLayer.addTo(this.map);

		// Invalidate map size to ensure proper rendering
		setTimeout(() => {
			if (this.map) {
				this.map.invalidateSize();
				// After map is ready, check if we have data to render
				if (this.selectedDzongkhag) {
					if (!this.administrativeZoneGeoJSON) {
						// Data not loaded yet, load it (it will render when ready)
						this.loadAdministrativeZoneGeoJSON();
					} else {
						// Data already loaded, render it now
						setTimeout(() => {
							this.renderAllAdministrativeZones();
						}, 100);
					}
				}
			}
		}, 100);
	}

	private renderAllAdministrativeZones() {
		if (!this.map || !this.administrativeZoneGeoJSON) return;

		// Check if GeoJSON has features
		if (!this.administrativeZoneGeoJSON.features || this.administrativeZoneGeoJSON.features.length === 0) {
			// Empty GeoJSON - just remove any existing layer and return silently
			if (this.allAdministrativeZonesLayer) {
				this.map.removeLayer(this.allAdministrativeZonesLayer);
				this.allAdministrativeZonesLayer = undefined;
			}
			return;
		}

		// Validate GeoJSON structure before rendering
		if (!this.isValidGeoJSON(this.administrativeZoneGeoJSON)) {
			console.error('Invalid GeoJSON data structure');
			if (this.allAdministrativeZonesLayer) {
				this.map.removeLayer(this.allAdministrativeZonesLayer);
				this.allAdministrativeZonesLayer = undefined;
			}
			this.messageService.add({
				severity: 'error',
				summary: 'Invalid Data',
				detail: 'The map data is invalid or corrupted',
				life: 3000,
			});
			return;
		}

		if (this.allAdministrativeZonesLayer) {
			this.map.removeLayer(this.allAdministrativeZonesLayer);
		}

		try {
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

						// Find administrative zone in data to get full object
						const zone = this.administrativeZones.find(
							(z) => z.id === props.id || z.areaCode === props.areaCode
						);

						// Create popup content with icon buttons
						const popupContent = `
							<div class="p-1">
								<div class="mb-2">
									<p class="font-semibold text-sm m-0 p-0 text-slate-900" style="line-height: 1.2; margin-bottom: 0;">${props.name || 'N/A'}</p>
									<p class="text-xs m-0 p-0 text-slate-500" style="line-height: 1.2; margin-top: 0; margin-bottom: 0;">Code: ${props.areaCode || 'N/A'}</p>
									<p class="text-xs m-0 p-0 text-slate-500" style="line-height: 1.2; margin-top: 2px; margin-bottom: 0;">Type: ${props.type || 'N/A'}</p>
									<p class="text-xs m-0 p-0 text-slate-500" style="line-height: 1.2; margin-top: 2px; margin-bottom: 0;">Area: ${props.areaSqKm || 'N/A'} km²</p>
								</div>
								<div class="flex gap-1.5 justify-center">
									<button 
										id="view-data-${props.id || props.areaCode}" 
										class="w-8 h-8 flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded transition-all shadow-sm hover:shadow"
										title="View Data"
									>	
										<i class="pi pi-chart-bar text-xs"></i>
									</button>
								</div>
							</div>
						`;

						const popup = L.popup().setContent(popupContent);
						layer.bindPopup(popup);

						// Add click listener for data viewer button after popup opens
						layer.on('popupopen', () => {
							const viewButton = document.getElementById(
								`view-data-${props.id || props.areaCode}`
							);
							if (viewButton && zone) {
								viewButton.addEventListener('click', () => {
									this.viewAdministrativeZoneData(zone);
									this.map?.closePopup();
								});
							}
						});

						layer.bindTooltip(props.name || 'N/A', {
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
			
			// Safely fit bounds
			try {
				const bounds = this.allAdministrativeZonesLayer.getBounds();
				if (bounds.isValid()) {
					this.map.fitBounds(bounds);
				}
			} catch (error) {
				console.warn('Could not fit bounds:', error);
			}
		} catch (error) {
			console.error('Error rendering administrative zones:', error);
			this.messageService.add({
				severity: 'error',
				summary: 'Rendering Error',
				detail: 'Failed to render map features. Please check the data format.',
				life: 3000,
			});
		}
	}

	/**
	 * Validate GeoJSON structure
	 */
	private isValidGeoJSON(geojson: any): boolean {
		if (!geojson) return false;

		// Check if it's a FeatureCollection
		if (geojson.type === 'FeatureCollection') {
			if (!Array.isArray(geojson.features)) return false;
			// Validate each feature has valid geometry
			return geojson.features.every((feature: any) => {
				return (
					feature &&
					feature.type === 'Feature' &&
					feature.geometry &&
					feature.geometry.type &&
					feature.geometry.coordinates &&
					Array.isArray(feature.geometry.coordinates)
				);
			});
		}

		// Check if it's a single Feature
		if (geojson.type === 'Feature') {
			return (
				geojson.geometry &&
				geojson.geometry.type &&
				geojson.geometry.coordinates &&
				Array.isArray(geojson.geometry.coordinates)
			);
		}

		// Check if it's a Geometry object
		if (geojson.type && ['Point', 'LineString', 'Polygon', 'MultiPolygon'].includes(geojson.type)) {
			return (
				geojson.coordinates &&
				Array.isArray(geojson.coordinates)
			);
		}

		return false;
	}

	selectAdministrativeZoneFromMap(properties: any) {
		const zone = this.administrativeZones.find(
			(z) => z.id === properties.id || z.areaCode === properties.areaCode
		);
		if (zone) {
			this.selectedAdministrativeZone = zone;
			this.locationSelectionService.setSelectedAdministrativeZone(zone);
		}
	}

	/**
	 * Navigate to administrative zone data viewer
	 */
	viewAdministrativeZoneData(zone: AdministrativeZone) {
		this.router.navigate(['/admin/data-view/admzone', zone.id]);
	}

	// Table Functions
	selectAdministrativeZone(zone: AdministrativeZone) {
		this.selectedAdministrativeZone = zone;
		this.locationSelectionService.setSelectedAdministrativeZone(zone);
	}

	// CRUD Operations
	openNew() {
		this.administrativeZoneForm.reset();
		// Pre-fill dzongkhag if one is selected
		if (this.selectedDzongkhag) {
			this.administrativeZoneForm.patchValue({
				dzongkhagId: this.selectedDzongkhag.id,
			});
		}
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
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Administrative zone updated successfully',
							life: 3000,
						});
						this.loadAdministrativeZones();
						this.loadAdministrativeZoneGeoJSON();
						this.administrativeZoneDialog = false;
					},
					error: (error) => {
						console.error('Error updating administrative zone:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to update administrative zone',
							life: 3000,
						});
					},
				});
		} else {
			const createData: CreateAdministrativeZoneDto = formData;
			this.administrativeZoneService
				.createAdministrativeZone(createData)
				.subscribe({
					next: () => {
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Administrative zone created successfully',
							life: 3000,
						});
						this.loadAdministrativeZones();
						this.loadAdministrativeZoneGeoJSON();
						this.administrativeZoneDialog = false;
					},
					error: (error) => {
						console.error('Error creating administrative zone:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to create administrative zone',
							life: 3000,
						});
					},
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
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Administrative zone deleted successfully',
							life: 3000,
						});
						this.loadAdministrativeZones();
						this.loadAdministrativeZoneGeoJSON();
						this.deleteDialog = false;
						this.selectedAdministrativeZone = null;
					},
					error: (error) => {
						console.error('Error deleting administrative zone:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to delete administrative zone',
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

	get geoJSONFeatureCount(): number {
		if (!this.administrativeZoneGeoJSON || !this.administrativeZoneGeoJSON.features) {
			return 0;
		}
		return Array.isArray(this.administrativeZoneGeoJSON.features)
			? this.administrativeZoneGeoJSON.features.length
			: 0;
	}

	onRowSelect(event: any) {
		if (event.data) {
			this.selectAdministrativeZone(event.data);
		}
	}

	onGlobalFilterSplit(event: Event) {
		const target = event.target as HTMLInputElement;
		this.globalFilterValue = target.value;
		if (this.dtSplit) {
			this.dtSplit.filterGlobal(target.value, 'contains');
		}
	}

	clearSearch(): void {
		this.globalFilterValue = '';
		if (this.dtSplit) {
			this.dtSplit.filterGlobal('', 'contains');
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

	// Upload GeoJSON methods
	openUploadGeojsonDialog(zone: AdministrativeZone) {
		this.selectedZoneForUpload = zone;
		this.selectedFile = null;
		this.uploadGeojsonDialog = true;
	}

	onFileSelect(event: any) {
		const file = event.files[0];
		if (file) {
			this.selectedFile = file;
		}
	}

	uploadGeojson() {
		if (!this.selectedFile || !this.selectedZoneForUpload) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Missing Information',
				detail: 'Please select a file and administrative zone',
				life: 3000,
			});
			return;
		}

		// Validate file type
		if (!this.selectedFile.name.endsWith('.json') && !this.selectedFile.name.endsWith('.geojson')) {
			this.messageService.add({
				severity: 'error',
				summary: 'Invalid File Type',
				detail: 'Please select a .json or .geojson file',
				life: 3000,
			});
			return;
		}

		// Validate file size (50MB max)
		const maxSize = 50 * 1024 * 1024; // 50MB in bytes
		if (this.selectedFile.size > maxSize) {
			this.messageService.add({
				severity: 'error',
				summary: 'File Too Large',
				detail: 'File size must be less than 50MB',
				life: 3000,
			});
			return;
		}

		this.uploadGeojsonLoading = true;

		this.administrativeZoneService
			.uploadGeojsonByAdministrativeZone(
				this.selectedZoneForUpload.id,
				this.selectedFile
			)
			.subscribe({
				next: (response) => {
					this.uploadGeojsonLoading = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'GeoJSON geometry updated successfully',
						life: 3000,
					});
					this.uploadGeojsonDialog = false;
					this.selectedFile = null;
					this.selectedZoneForUpload = null;
					// Reload data to reflect changes
					this.loadAdministrativeZones();
					this.loadAdministrativeZoneGeoJSON();
				},
				error: (error) => {
					this.uploadGeojsonLoading = false;
					console.error('Error uploading GeoJSON:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Upload Failed',
						detail:
							error.error?.message ||
							error.error?.detail ||
							'Failed to upload GeoJSON. Please check the file format and try again.',
						life: 5000,
					});
				},
			});
	}

	cancelUploadGeojson() {
		this.uploadGeojsonDialog = false;
		this.selectedFile = null;
		this.selectedZoneForUpload = null;
	}

	// Bulk Upload Methods
	openBulkUploadDialog() {
		this.bulkUploadDialog = true;
		this.bulkUploadFile = null;
		// Pre-fill with selected dzongkhag if available
		this.selectedDzongkhagForBulkUpload = this.selectedDzongkhag;
		this.bulkUploadResults = null;
		this.bulkUploadProgress = 0;
	}

	closeBulkUploadDialog() {
		this.bulkUploadDialog = false;
		this.bulkUploadFile = null;
		this.selectedDzongkhagForBulkUpload = null;
		this.bulkUploadResults = null;
		this.bulkUploadProgress = 0;
	}

	onBulkUploadFileSelect(event: any) {
		const file = event.files?.[0];
		if (file) {
			// Validate file type
			if (!file.name.endsWith('.json') && !file.name.endsWith('.geojson')) {
				this.messageService.add({
					severity: 'error',
					summary: 'Invalid File Type',
					detail: 'Please select a .json or .geojson file',
					life: 3000,
				});
				return;
			}

			// Validate file size (50MB limit)
			if (file.size > 50 * 1024 * 1024) {
				this.messageService.add({
					severity: 'error',
					summary: 'File Too Large',
					detail: 'File size exceeds 50MB limit',
					life: 3000,
				});
				return;
			}

			this.bulkUploadFile = file;
			this.bulkUploadResults = null;
		}
	}

	onBulkUploadFileRemove() {
		this.bulkUploadFile = null;
		this.bulkUploadResults = null;
	}

	uploadBulkAdministrativeZones() {
		if (!this.selectedDzongkhagForBulkUpload) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please select a Dzongkhag',
				life: 3000,
			});
			return;
		}

		if (!this.bulkUploadFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please select a GeoJSON file to upload',
				life: 3000,
			});
			return;
		}

		this.bulkUploadLoading = true;
		this.bulkUploadProgress = 0;
		this.bulkUploadResults = null;

		this.administrativeZoneService
			.bulkUploadByDzongkhag(
				this.selectedDzongkhagForBulkUpload.id,
				this.bulkUploadFile
			)
			.subscribe({
				next: (response: BulkUploadResponse) => {
					this.bulkUploadLoading = false;
					this.bulkUploadProgress = 100;
					this.bulkUploadResults = response;

					// Show success messages
					if (response.success > 0) {
						this.messageService.add({
							severity: 'success',
							summary: 'Upload Complete',
							detail: `Successfully created ${response.success} administrative zone(s)`,
							life: 5000,
						});
					}

					if (response.skipped > 0) {
						this.messageService.add({
							severity: 'info',
							summary: 'Items Skipped',
							detail: `${response.skipped} administrative zone(s) already exist and were skipped`,
							life: 5000,
						});
					}

					if (response.errors.length > 0) {
						this.messageService.add({
							severity: 'warn',
							summary: 'Errors Encountered',
							detail: `${response.errors.length} feature(s) failed to process`,
							life: 5000,
						});
					}

					// Refresh data
					this.loadAdministrativeZones();
					this.loadAdministrativeZoneGeoJSON();
				},
				error: (error) => {
					this.bulkUploadLoading = false;
					this.bulkUploadProgress = 0;
					console.error('Error bulk uploading administrative zones:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Upload Failed',
						detail:
							error?.error?.message ||
							'Failed to upload administrative zones. Please try again.',
						life: 5000,
					});
				},
			});
	}

	switchBasemap(): void {
		if (!this.map || !this.basemapService.hasBasemap(this.selectedBasemapId)) {
			console.error(`Basemap ${this.selectedBasemapId} not found`);
			return;
		}

		// Remove existing basemap layer
		if (this.baseLayer) {
			this.map.removeLayer(this.baseLayer);
			this.baseLayer = undefined;
		}

		// Add new basemap layer
		this.baseLayer =
			this.basemapService.createTileLayer(this.selectedBasemapId) || undefined;

		if (this.baseLayer) {
			this.baseLayer.addTo(this.map);
			this.baseLayer.bringToBack();
		}
	}
}
