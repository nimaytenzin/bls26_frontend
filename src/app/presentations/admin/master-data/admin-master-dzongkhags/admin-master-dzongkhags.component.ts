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
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import {
	Dzongkhag,
	CreateDzongkhagDto,
	UpdateDzongkhagDto,
} from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { PrimeNgModules } from '../../../../primeng.modules';
import { Table } from 'primeng/table';
import * as L from 'leaflet';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MapFeatureColorService } from '../../../../core/utility/map-feature-color.service';
import { BasemapService } from '../../../../core/utility/basemap.service';
import { DownloadService } from '../../../../core/utility/download.service';

@Component({
	selector: 'app-admin-master-dzongkhags',
	templateUrl: './admin-master-dzongkhags.component.html',
	styleUrls: ['./admin-master-dzongkhags.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],

	providers: [ConfirmationService, MessageService],
})
export class AdminMasterDzongkhagsComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	// Table references
	@ViewChild('dt') dt!: Table;

	// Data properties
	dzongkhags: Dzongkhag[] = [];
	selectedDzongkhag: Dzongkhag | null = null;
	loading = false;

	// Map properties
	private map: L.Map | null = null;
	dzongkhagGeoJSON: any;
	private allDzongkhagsLayer?: L.GeoJSON;
	private baseLayer?: L.TileLayer;

	// Basemap properties
	selectedBasemapId = 'positron'; // Default basemap
	basemapCategories: Record<
		string,
		{ label: string; basemaps: Array<{ id: string; name: string }> }
	> = {};

	// Dialog states
	dzongkhagDialog = false;
	deleteDialog = false;
	uploadGeojsonDialog = false;

	// Form
	dzongkhagForm: FormGroup;
	isEditMode = false;

	// Upload properties
	selectedFile: File | null = null;
	uploadLoading = false;

	// Table properties
	globalFilterValue = '';

	constructor(
		private dzongkhagService: DzongkhagDataService,
		private fb: FormBuilder,
		private messageService: MessageService,
		private router: Router,
		private mapFeatureColorService: MapFeatureColorService,
		private basemapService: BasemapService,
		private downloadService: DownloadService
	) {
		this.dzongkhagForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			areaCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],
		});
		
		// Initialize basemap categories
		this.basemapCategories = this.basemapService.getBasemapCategories();
	}

	ngOnInit() {
		this.loadDzongkhags();
	}

	ngAfterViewInit() {
		// Initialize map after view is ready
		setTimeout(() => this.initializeMap(), 100);
	}

	ngOnDestroy() {
		if (this.map) {
			this.map.remove();
			this.map = null;
		}
	}

	loadDzongkhags() {
		this.loading = true;
		this.dzongkhagService.findAllDzongkhags().subscribe({
			next: (data) => {
				this.dzongkhags = data;
				this.loading = false;
			},
			error: (error) => {
				this.loading = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load dzongkhags',
					life: 3000,
				});
			},
		});
	}

	loadDzongkhagGeoJSON() {
		this.dzongkhagService.getAllDzongkhagGeojson().subscribe({
			next: (data) => {
				this.dzongkhagGeoJSON = data;
				if (this.map) {
					this.renderAllDzongkhags();
				}
			},
			error: (error) => {
				console.error('Error loading dzongkhag GeoJSON:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load map data',
					life: 3000,
				});
			},
		});
	}

	// Map Functions
	private initializeMap() {
		const containerId = 'dzongkhag-map';
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
			center: [27.5142, 90.4336], // Center of Bhutan
			zoom: 7,
			zoomControl: false,
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

		// Load GeoJSON
		this.loadDzongkhagGeoJSON();
	}

	private renderAllDzongkhags() {
		if (!this.map || !this.dzongkhagGeoJSON) return;

		// Remove existing layer
		if (this.allDzongkhagsLayer) {
			this.map.removeLayer(this.allDzongkhagsLayer);
		}

		// Get single feature color from service
		const fillColor = this.mapFeatureColorService.getSingleFeatureColor('primary');
		const borderColor = this.mapFeatureColorService.getSingleFeatureColor('highlight');

		this.allDzongkhagsLayer = L.geoJSON(this.dzongkhagGeoJSON, {
			style: (feature) => ({
				fillColor: fillColor,
				fillOpacity: 0.3,
				color: borderColor,
				weight: 2,
				opacity: 1,
			}),
			onEachFeature: (feature, layer) => {
				const props = feature.properties;

				// Find dzongkhag in data to get full object
				const dzongkhag = this.dzongkhags.find(
					(d) => d.id === props.id || d.areaCode === props.areaCode
				);

				// Create popup content with all action buttons
				const featureId = `dz-${props.id || props.areaCode}`;
				const featureName = props.name || 'Dzongkhag';
				const popupContent = `
					<div class="p-2 min-w-[200px]">
						<h3 class="font-bold text-base mb-2 text-slate-900">${
							props.name || 'N/A'
						}</h3>
						<div class="space-y-1 text-sm mb-3">
							${props.areaCode ? `<div><strong>Code:</strong> ${props.areaCode}</div>` : ''}
						</div>
						<div class="flex flex-wrap gap-2 justify-center border-t pt-2">
							<button 
								id="download-geojson-${featureId}" 
								class="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-all shadow-sm"
								title="Download GeoJSON"
							>	
								<i class="pi pi-download mr-1"></i>GeoJSON
							</button>
							<button 
								id="download-kml-${featureId}" 
								class="px-3 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded transition-all shadow-sm"
								title="Download KML"
							>	
								<i class="pi pi-file mr-1"></i>KML
							</button>
						</div>
					</div>
				`;

				const popup = L.popup().setContent(popupContent);
				layer.bindPopup(popup);

				// Add click listeners for buttons after popup opens
				layer.on('popupopen', () => {
					setTimeout(() => {
						// Download GeoJSON button
						const downloadGeoJSONButton = document.getElementById(`download-geojson-${featureId}`);
						if (downloadGeoJSONButton) {
							const newDownloadGeoJSONButton = downloadGeoJSONButton.cloneNode(true);
							downloadGeoJSONButton.parentNode?.replaceChild(newDownloadGeoJSONButton, downloadGeoJSONButton);
							newDownloadGeoJSONButton.addEventListener('click', (e) => {
								e.stopPropagation();
								this.downloadFeatureGeoJSON(feature, featureName);
							});
						}

						// Download KML button
						const downloadKMLButton = document.getElementById(`download-kml-${featureId}`);
						if (downloadKMLButton) {
							const newDownloadKMLButton = downloadKMLButton.cloneNode(true);
							downloadKMLButton.parentNode?.replaceChild(newDownloadKMLButton, downloadKMLButton);
							newDownloadKMLButton.addEventListener('click', (e) => {
								e.stopPropagation();
								this.downloadFeatureKML(feature, featureName);
							});
						}
					}, 0);
				});

				// Bind tooltip
				layer.bindTooltip(props.name, {
					permanent: false,
					direction: 'top',
				});

				// Click event to select dzongkhag
				layer.on('click', () => {
					this.selectDzongkhagFromMap(props);
				});

				// Hover effects
				layer.on('mouseover', () => {
					(layer as any).setStyle({
						fillOpacity: 0.7,
						weight: 3,
					});
				});

				layer.on('mouseout', () => {
					if (this.allDzongkhagsLayer) {
						this.allDzongkhagsLayer.resetStyle(layer as any);
					}
				});
			},
		});

		this.allDzongkhagsLayer.addTo(this.map);
		// Fit bounds without padding to avoid bounding box appearance
		this.map.fitBounds(this.allDzongkhagsLayer.getBounds(), {
			padding: [0, 0],
			maxZoom: 10
		});
	}

	selectDzongkhagFromMap(properties: any) {
		// Find the dzongkhag in our data by matching properties
		const dzongkhag = this.dzongkhags.find(
			(d) => d.id === properties.id || d.areaCode === properties.areaCode
		);
		if (dzongkhag) {
			this.selectedDzongkhag = dzongkhag;
			// Scroll to selected row in table if needed
		}
	}

	reloadMap() {
		this.dzongkhagGeoJSON = undefined;

		if (this.map) {
			this.map.remove();
			this.map = null;
		}

		const container = document.getElementById('dzongkhag-map');
		if (container) {
			setTimeout(() => this.initializeMap(), 100);
		} else {
			this.loadDzongkhagGeoJSON();
		}
	}


	// Table Functions
	selectDzongkhag(dzongkhag: Dzongkhag) {
		this.selectedDzongkhag = dzongkhag;
	}

	// CRUD Operations
	openNew() {
		this.dzongkhagForm.reset();
		this.isEditMode = false;
		this.dzongkhagDialog = true;
	}

	/**
	 * Navigate to dzongkhag data viewer
	 */
	viewDzongkhagData(dzongkhag: Dzongkhag) {
		this.router.navigate(['/admin/data-view/dzongkhag', dzongkhag.id]);
	}

	editDzongkhag(dzongkhag: Dzongkhag) {
		this.dzongkhagForm.patchValue({
			name: dzongkhag.name,
			areaCode: dzongkhag.areaCode,
		});
		this.selectedDzongkhag = dzongkhag;
		this.isEditMode = true;
		this.dzongkhagDialog = true;
	}

	saveDzongkhag() {
		if (this.dzongkhagForm.invalid) return;

		const formData = this.dzongkhagForm.value;

		if (this.isEditMode && this.selectedDzongkhag) {
			const updateData: UpdateDzongkhagDto = formData;
			this.dzongkhagService
				.updateDzongkhag(this.selectedDzongkhag.id, updateData)
				.subscribe({
					next: () => {
						this.loadDzongkhags();
						this.dzongkhagDialog = false;
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Dzongkhag updated successfully',
							life: 3000,
						});
					},
					error: (error) => {
						console.error('Error updating dzongkhag:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to update dzongkhag',
							life: 3000,
						});
					},
				});
		} else {
			const createData: CreateDzongkhagDto = formData;
			this.dzongkhagService.createDzongkhag(createData).subscribe({
				next: () => {
					this.loadDzongkhags();
					this.dzongkhagDialog = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Dzongkhag created successfully',
						life: 3000,
					});
				},
				error: (error) => {
					console.error('Error creating dzongkhag:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to create dzongkhag',
						life: 3000,
					});
				},
			});
		}
	}

	confirmDelete(dzongkhag: Dzongkhag) {
		this.selectedDzongkhag = dzongkhag;
		this.deleteDialog = true;
	}

	deleteDzongkhag() {
		if (this.selectedDzongkhag) {
			this.dzongkhagService
				.deleteDzongkhag(this.selectedDzongkhag.id)
				.subscribe({
					next: () => {
						this.loadDzongkhags();
						this.deleteDialog = false;
						this.selectedDzongkhag = null;
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Dzongkhag deleted successfully',
							life: 3000,
						});
					},
					error: (error) => {
						console.error('Error deleting dzongkhag:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to delete dzongkhag',
							life: 3000,
						});
					},
				});
		}
	}

	// Upload GeoJSON Operations
	openUploadGeojson(dzongkhag: Dzongkhag) {
		this.selectedDzongkhag = dzongkhag;
		this.selectedFile = null;
		this.uploadGeojsonDialog = true;
	}

	onFileSelect(event: any) {
		const file = event.files?.[0];
		if (file) {
			// Validate file type
			if (!file.name.endsWith('.json') && !file.name.endsWith('.geojson')) {
				this.messageService.add({
					severity: 'warn',
					summary: 'Invalid File',
					detail: 'Please select a valid GeoJSON file (.json or .geojson)',
					life: 3000,
				});
				return;
			}
			this.selectedFile = file;
		}
	}

	uploadGeojson() {
		if (!this.selectedDzongkhag || !this.selectedFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Missing Information',
				detail: 'Please select a dzongkhag and a file',
				life: 3000,
			});
			return;
		}

		this.uploadLoading = true;
		this.dzongkhagService
			.uploadGeojsonByDzongkhag(this.selectedDzongkhag.id, this.selectedFile)
			.subscribe({
				next: (response) => {
					console.log('GeoJSON uploaded successfully:', response);
					this.uploadLoading = false;
					this.uploadGeojsonDialog = false;
					this.selectedFile = null;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'GeoJSON uploaded successfully',
						life: 3000,
					});
					// Reload data and map
					this.loadDzongkhags();
					this.reloadMap();
				},
				error: (error) => {
					console.error('Error uploading GeoJSON:', error);
					console.log(this.selectedFile);
					this.uploadLoading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Upload Failed',
						detail: error?.error?.message || 'Failed to upload GeoJSON',
						life: 5000,
					});
				},
			});
	}

	cancelUpload() {
		this.uploadGeojsonDialog = false;
		this.selectedFile = null;
		this.selectedDzongkhag = null;
	}

	// Utility functions
	clear(table: any) {
		table.clear();
		this.globalFilterValue = '';
	}


	// Handle row selection properly
	onRowSelect(event: any) {
		if (event.data) {
			this.selectDzongkhag(event.data);
		}
	}

	// Global filter methods
	onGlobalFilter(event: Event) {
		const target = event.target as HTMLInputElement;
		this.globalFilterValue = target.value;
		if (this.dt) {
			this.dt.filterGlobal(target.value, 'contains');
		}
	}

	clearSearch(): void {
		this.globalFilterValue = '';
		if (this.dt) {
			this.dt.filterGlobal('', 'contains');
		}
	}

	// Safe number conversion for display
	getSafeAreaValue(area: any): number {
		const value = typeof area === 'string' ? parseFloat(area) : area;
		return isNaN(value) ? 0 : value;
	}

	hasFormError(field: string): boolean {
		const control = this.dzongkhagForm.get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	getFormError(field: string): string {
		const control = this.dzongkhagForm.get(field);
		if (control?.errors) {
			if (control.errors['required']) return `${field} is required`;
			if (control.errors['minlength']) return `${field} is too short`;
			if (control.errors['pattern']) return `${field} format is invalid`;
			if (control.errors['min']) return `${field} must be positive`;
		}
		return '';
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

	/**
	 * Download a single feature as GeoJSON
	 */
	downloadFeatureGeoJSON(feature: any, featureName: string): void {
		// Wrap single feature in FeatureCollection
		const featureCollection = {
			type: 'FeatureCollection',
			features: [feature]
		};
		
		const filename = `${featureName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.geojson`;
		this.downloadService.downloadGeoJSON({
			data: featureCollection,
			filename: filename
		});
		
		this.messageService.add({
			severity: 'success',
			summary: 'Download Complete',
			detail: 'GeoJSON file downloaded successfully',
			life: 2000,
		});
	}

	/**
	 * Download a single feature as KML
	 */
	downloadFeatureKML(feature: any, featureName: string): void {
		// Wrap single feature in FeatureCollection
		const featureCollection = {
			type: 'FeatureCollection',
			features: [feature]
		};
		
		const filename = `${featureName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.kml`;
		this.downloadService.downloadKML({
			data: featureCollection,
			filename: filename,
			layerName: featureName
		});
		
		this.messageService.add({
			severity: 'success',
			summary: 'Download Complete',
			detail: 'KML file downloaded successfully',
			life: 2000,
		});
	}
}
