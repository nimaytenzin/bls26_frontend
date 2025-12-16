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
import { Observable } from 'rxjs';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import {
	SubAdministrativeZone,
	CreateSubAdministrativeZoneDto,
	UpdateSubAdministrativeZoneDto,
	SubAdministrativeZoneType,
	BulkUploadResponse,
} from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { AdministrativeZone } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { PrimeNgModules } from '../../../../primeng.modules';
import { Table } from 'primeng/table';
import * as L from 'leaflet';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BasemapService } from '../../../../core/utility/basemap.service';
import { BulkUploadEaComponent } from '../admin-master-enumeration-areas/bulk-upload-ea/bulk-upload-ea.component';
import { BulkUploadResponse as EABulkUploadResponse } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { LocationSelectionService } from '../../../../core/services/location-selection.service';
import { DownloadService } from '../../../../core/utility/download.service';

@Component({
	selector: 'app-admin-master-sub-administrative-zones',
	templateUrl: './admin-master-sub-administrative-zones.component.html',
	styleUrls: ['./admin-master-sub-administrative-zones.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules, BulkUploadEaComponent],
	providers: [ConfirmationService, MessageService],
})
export class AdminMasterSubAdministrativeZonesComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	// Table references
	@ViewChild('dtSplit') dtSplit!: Table;

	// Data properties
	subAdministrativeZones: SubAdministrativeZone[] = [];
	selectedSubAdministrativeZone: SubAdministrativeZone | null = null;
	administrativeZones: AdministrativeZone[] = [];
	selectedAdministrativeZone: AdministrativeZone | null = null;
	dzongkhags: Dzongkhag[] = [];
	selectedDzongkhag: Dzongkhag | null = null;
	loading = false;
	
	// Data availability flags
	noAdministrativeZones = false;
	noSubAdministrativeZones = false;
	noGeoJSON = false;

	// Map properties
	private map?: L.Map;
	subAdministrativeZoneGeoJSON: any;
	administrativeZoneGeoJSON: any;
	dzongkhagGeoJSON: any = null;
	private allSubAdministrativeZonesLayer?: L.GeoJSON;
	private administrativeZonesLayer?: L.GeoJSON;
	private dzongkhagLayer?: L.GeoJSON;
	private baseLayer?: L.TileLayer;
	showAdministrativeZoneLayer = false;
	showDzongkhagLayer = false;
	
	// Performance optimization: debounce and render queue
	private renderTimeout?: any;
	private isRendering = false;

	// Basemap properties
	selectedBasemapId = 'positron'; // Default basemap
	basemapCategories: Record<
		string,
		{ label: string; basemaps: Array<{ id: string; name: string }> }
	> = {};


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

	// Bulk Upload Dialog
	bulkUploadDialog = false;
	bulkUploadFile: File | null = null;
	selectedAdministrativeZoneForBulkUpload: AdministrativeZone | null = null;
	bulkUploadLoading = false;
	bulkUploadProgress = 0;
	bulkUploadResults: BulkUploadResponse | null = null;

	// Bulk Upload EA Dialog
	bulkUploadEADialog = false;
	selectedSubAdministrativeZoneForBulkUploadEA: SubAdministrativeZone | null = null;

	// Enum for template access
	SubAdministrativeZoneType = SubAdministrativeZoneType;
	zoneTypes = Object.values(SubAdministrativeZoneType);

	// Table properties
	globalFilterValue = '';

	constructor(
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private dzongkhagService: DzongkhagDataService,
		private fb: FormBuilder,
		private messageService: MessageService,
		private router: Router,
		private basemapService: BasemapService,
		private locationSelectionService: LocationSelectionService,
		private downloadService: DownloadService
	) {
		this.subAdministrativeZoneForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			areaCode: [''],
			administrativeZoneId: ['', [Validators.required]],
			type: ['', [Validators.required]],
		});
		
		// Initialize basemap categories
		this.basemapCategories = this.basemapService.getBasemapCategories();
	}

	ngOnInit() {
		// Restore selections from service
		const savedDzongkhag = this.locationSelectionService.getSelectedDzongkhag();
		const savedAdministrativeZone = this.locationSelectionService.getSelectedAdministrativeZone();
		const savedSubAdministrativeZone = this.locationSelectionService.getSelectedSubAdministrativeZone();
		
		if (savedDzongkhag) {
			this.selectedDzongkhag = savedDzongkhag;
		}
		if (savedAdministrativeZone) {
			this.selectedAdministrativeZone = savedAdministrativeZone;
		}
		if (savedSubAdministrativeZone) {
			this.selectedSubAdministrativeZone = savedSubAdministrativeZone;
		}
		
		this.loadDzongkhags();
		
		// Subscribe to selection changes
		this.locationSelectionService.selectedDzongkhag$.subscribe((dzongkhag) => {
			if (dzongkhag && dzongkhag.id !== this.selectedDzongkhag?.id) {
				this.selectedDzongkhag = dzongkhag;
				this.loadAdministrativeZones();
				this.loadSubAdministrativeZones();
				this.loadSubAdministrativeZoneGeoJSON();
			}
		});
		
		this.locationSelectionService.selectedAdministrativeZone$.subscribe((adminZone) => {
			if (adminZone && adminZone.id !== this.selectedAdministrativeZone?.id) {
				this.selectedAdministrativeZone = adminZone;
				this.loadSubAdministrativeZones();
				this.loadSubAdministrativeZoneGeoJSON();
			}
		});
		
		this.locationSelectionService.selectedSubAdministrativeZone$.subscribe((subAdminZone) => {
			if (subAdminZone && subAdminZone.id !== this.selectedSubAdministrativeZone?.id) {
				this.selectedSubAdministrativeZone = subAdminZone;
			}
		});
	}

	ngAfterViewInit() {
		// Initialize map if dzongkhag or administrative zone is already selected
		if (this.selectedDzongkhag || this.selectedAdministrativeZone) {
			setTimeout(() => {
				this.initializeMap();
			}, 300);
		}
	}

	ngOnDestroy() {
		// Clear any pending timeouts
		if (this.renderTimeout) {
			clearTimeout(this.renderTimeout);
		}
		
		if (this.map) {
			this.removeDzongkhagLayer();
			if (this.administrativeZonesLayer) {
				this.map.removeLayer(this.administrativeZonesLayer);
			}
			if (this.allSubAdministrativeZonesLayer) {
				this.map.removeLayer(this.allSubAdministrativeZonesLayer);
			}
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
					
					// Load data and initialize map for the selected dzongkhag
					this.loadAdministrativeZones();
					this.loadSubAdministrativeZones();
					this.loadSubAdministrativeZoneGeoJSON();
					this.loadAdministrativeZoneGeoJSON();
					// Initialize map after view is ready
					setTimeout(() => {
						this.initializeMap();
					}, 300);
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
			this.noAdministrativeZones = false;
			return;
		}

		this.administrativeZoneService
			.findAdministrativeZonesByDzongkhag(this.selectedDzongkhag.id)
			.subscribe({
				next: (data) => {
					this.administrativeZones = data || [];
					this.noAdministrativeZones = !data || data.length === 0;
					
					// Restore saved administrative zone if available
					const savedAdminZone = this.locationSelectionService.getSelectedAdministrativeZone();
					if (savedAdminZone && data && data.find(az => az.id === savedAdminZone.id)) {
						this.selectedAdministrativeZone = savedAdminZone;
					}
				},
				error: (error) => {
					console.error('Error loading administrative zones:', error);
					this.administrativeZones = [];
					this.noAdministrativeZones = true;
				},
			});
	}

	loadSubAdministrativeZones() {
		// If administrative zone is selected, load by administrative zone
		if (this.selectedAdministrativeZone) {
			this.loading = true;
			this.noSubAdministrativeZones = false;
			this.subAdministrativeZoneService
				.findSubAdministrativeZonesByAdministrativeZone(
					this.selectedAdministrativeZone.id
				)
				.subscribe({
					next: (data) => {
						this.subAdministrativeZones = data || [];
						this.noSubAdministrativeZones = !data || data.length === 0;
						this.loading = false;
						
						// Restore saved sub-administrative zone if available
						const savedSubAdminZone = this.locationSelectionService.getSelectedSubAdministrativeZone();
						if (savedSubAdminZone && data && data.find(saz => saz.id === savedSubAdminZone.id)) {
							this.selectedSubAdministrativeZone = savedSubAdminZone;
						}
					},
					error: (error) => {
						this.loading = false;
						this.subAdministrativeZones = [];
						this.noSubAdministrativeZones = true;
						console.error('Error loading sub-administrative zones:', error);
					},
				});
			return;
		}

		// Otherwise, load by dzongkhag
		if (!this.selectedDzongkhag) {
			this.subAdministrativeZones = [];
			this.noSubAdministrativeZones = false;
			return;
		}

		this.loading = true;
		this.noSubAdministrativeZones = false;
		this.subAdministrativeZoneService
			.findSubAdministrativeZonesByDzongkhag(this.selectedDzongkhag.id)
			.subscribe({
				next: (data) => {
					this.subAdministrativeZones = data || [];
					this.noSubAdministrativeZones = !data || data.length === 0;
					this.loading = false;
					
					// Restore saved sub-administrative zone if available
					const savedSubAdminZone = this.locationSelectionService.getSelectedSubAdministrativeZone();
					if (savedSubAdminZone && data && data.find(saz => saz.id === savedSubAdminZone.id)) {
						this.selectedSubAdministrativeZone = savedSubAdminZone;
					}
				},
				error: (error) => {
					this.loading = false;
					this.subAdministrativeZones = [];
					this.noSubAdministrativeZones = true;
					console.error('Error loading sub-administrative zones:', error);
				},
			});
	}

	loadSubAdministrativeZoneGeoJSON() {
		// Reset state
		this.subAdministrativeZoneGeoJSON = null;
		this.noGeoJSON = false;

		// Determine which service method to use
		let request: Observable<any>;
		
		if (this.selectedAdministrativeZone) {
			request = this.subAdministrativeZoneService
				.getSubAdministrativeZoneGeojsonByAdministrativeZone(
					this.selectedAdministrativeZone.id
				);
		} else if (this.selectedDzongkhag) {
			request = this.subAdministrativeZoneService
				.getSubAdministrativeZoneGeojsonByDzongkhag(this.selectedDzongkhag.id);
		} else {
			// No selection - clear map and return
			this.clearMapLayer();
			return;
		}

		// Load GeoJSON data
		request.subscribe({
			next: (data) => {
				if (this.isEmptyGeoJSON(data)) {
					this.handleEmptyGeoJSON();
				} else {
					this.subAdministrativeZoneGeoJSON = data;
					this.noGeoJSON = false;
					if (this.map) {
						// Use requestAnimationFrame for smoother rendering
						requestAnimationFrame(() => {
							this.renderAllSubAdministrativeZones();
						});
					}
				}
			},
			error: (error) => {
				console.error('Error loading GeoJSON:', error);
				this.handleEmptyGeoJSON();
			},
		});
	}

	/**
	 * Check if GeoJSON data is empty
	 */
	private isEmptyGeoJSON(data: any): boolean {
		return !data || 
			typeof data !== 'object' ||
			!data.features || 
			!Array.isArray(data.features) || 
			data.features.length === 0;
	}

	/**
	 * Handle empty GeoJSON response
	 */
	private handleEmptyGeoJSON() {
		this.subAdministrativeZoneGeoJSON = null;
		this.noGeoJSON = true;
		this.clearMapLayer();
	}

	/**
	 * Clear map layer if it exists
	 */
	private clearMapLayer() {
		if (this.map && this.allSubAdministrativeZonesLayer) {
			this.map.removeLayer(this.allSubAdministrativeZonesLayer);
			this.allSubAdministrativeZonesLayer = undefined;
		}
	}

	loadAdministrativeZoneGeoJSON() {
		if (!this.selectedDzongkhag) {
			this.administrativeZoneGeoJSON = null;
			return;
		}

		this.administrativeZoneService
			.getAdministrativeZoneGeojsonByDzongkhag(this.selectedDzongkhag.id)
			.subscribe({
				next: (data) => {
					this.administrativeZoneGeoJSON = data;
					if (this.map && this.showAdministrativeZoneLayer) {
						// Use requestAnimationFrame for smoother rendering
						requestAnimationFrame(() => {
							this.renderAdministrativeZoneLayer();
						});
					}
				},
				error: (error) => {
					console.error('Error loading administrative zone GeoJSON:', error);
				},
			});
	}

	onDzongkhagChange() {
		// Reset administrative zone selection when dzongkhag changes
		this.selectedAdministrativeZone = null;
		
		// Reset selections
		this.selectedSubAdministrativeZone = null;
		this.subAdministrativeZones = [];
		this.subAdministrativeZoneGeoJSON = null;
		this.administrativeZoneGeoJSON = null;
		this.dzongkhagGeoJSON = null;
		
		// Reset data availability flags
		this.noAdministrativeZones = false;
		this.noSubAdministrativeZones = false;
		this.noGeoJSON = false;

		// Clear map
		if (this.map) {
			if (this.allSubAdministrativeZonesLayer) {
				this.map.removeLayer(this.allSubAdministrativeZonesLayer);
				this.allSubAdministrativeZonesLayer = undefined;
			}
			if (this.administrativeZonesLayer) {
				this.map.removeLayer(this.administrativeZonesLayer);
				this.administrativeZonesLayer = undefined;
			}
			if (this.dzongkhagLayer) {
				this.map.removeLayer(this.dzongkhagLayer);
				this.dzongkhagLayer = undefined;
			}
			this.map.remove();
			this.map = undefined;
		}

		// Load data for selected dzongkhag
		if (this.selectedDzongkhag) {
			this.loadAdministrativeZones();
			this.loadSubAdministrativeZones();
			this.loadSubAdministrativeZoneGeoJSON();
			this.loadAdministrativeZoneGeoJSON();
			this.loadDzongkhagGeoJSON();
			// Initialize map after a short delay to ensure container is ready
			setTimeout(() => {
				this.initializeMap();
			}, 300);
		}
	}

	onAdministrativeZoneChange() {
		// Save selection to service
		if (this.selectedAdministrativeZone) {
			this.locationSelectionService.setSelectedAdministrativeZone(this.selectedAdministrativeZone);
		}
		
		// Reset selections
		this.selectedSubAdministrativeZone = null;
		this.locationSelectionService.setSelectedSubAdministrativeZone(null);
		this.subAdministrativeZones = [];
		this.subAdministrativeZoneGeoJSON = null;
		
		// Reset data availability flags
		this.noSubAdministrativeZones = false;
		this.noGeoJSON = false;

		// Clear map layers
		if (this.map) {
			if (this.allSubAdministrativeZonesLayer) {
				this.map.removeLayer(this.allSubAdministrativeZonesLayer);
				this.allSubAdministrativeZonesLayer = undefined;
			}
		}

		// Load data for selected administrative zone
		if (this.selectedAdministrativeZone) {
			this.loadSubAdministrativeZones();
			this.loadSubAdministrativeZoneGeoJSON();
			// Initialize map if not already initialized
			if (!this.map) {
				setTimeout(() => {
					this.initializeMap();
				}, 300);
			} else {
				// Map exists, just render the data
				setTimeout(() => {
					if (this.subAdministrativeZoneGeoJSON) {
						this.renderAllSubAdministrativeZones();
					}
				}, 150);
			}
		} else {
			// Administrative zone cleared, reload by dzongkhag if selected
			if (this.selectedDzongkhag) {
				this.loadSubAdministrativeZones();
				this.loadSubAdministrativeZoneGeoJSON();
			}
		}
	}

	reloadMap() {
		if (!this.selectedDzongkhag && !this.selectedAdministrativeZone) {
			return;
		}

		this.subAdministrativeZoneGeoJSON = undefined;

		if (this.map) {
			this.map.remove();
			this.map = undefined;
		}

		const containerId = 'sub-administrative-zone-map';
		const el = document.getElementById(containerId);
		if (el) {
			setTimeout(() => this.initializeMap(containerId), 100);
		} else {
			this.loadSubAdministrativeZoneGeoJSON();
			if (this.selectedDzongkhag) {
				this.administrativeZoneGeoJSON = undefined;
				this.loadAdministrativeZoneGeoJSON();
			}
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
			zoom: 9,
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
			}
		}, 100);

		if (this.selectedDzongkhag || this.selectedAdministrativeZone) {
			if (!this.subAdministrativeZoneGeoJSON) {
				this.loadSubAdministrativeZoneGeoJSON();
			} else {
				// Use requestAnimationFrame for smoother rendering
				requestAnimationFrame(() => {
					this.renderAllSubAdministrativeZones();
				});
			}

			if (this.selectedDzongkhag) {
				// Batch load/render layers for better performance
				this.batchLoadLayers();
			}
		}
	}

	private renderAllSubAdministrativeZones() {
		if (!this.map || !this.subAdministrativeZoneGeoJSON) {
			this.noGeoJSON = !this.subAdministrativeZoneGeoJSON;
			return;
		}

		// Check if empty
		if (this.isEmptyGeoJSON(this.subAdministrativeZoneGeoJSON)) {
			this.handleEmptyGeoJSON();
			return;
		}

		// Validate structure
		if (!this.isValidGeoJSON(this.subAdministrativeZoneGeoJSON)) {
			console.error('Invalid GeoJSON data structure');
			this.handleEmptyGeoJSON();
			this.messageService.add({
				severity: 'error',
				summary: 'Invalid Data',
				detail: 'The map data is invalid or corrupted',
				life: 3000,
			});
			return;
		}

		this.noGeoJSON = false;

		if (this.allSubAdministrativeZonesLayer) {
			this.map.removeLayer(this.allSubAdministrativeZonesLayer);
		}

		try {
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
						const featureId = `saz-${props.id || props.areaCode || Math.random()}`;
						const featureName = props.name || 'Sub-Administrative Zone';
						const popup = `
							<div class="p-2 min-w-[200px]">
								<h3 class="font-bold text-base mb-2 text-slate-900">${
									props.name || 'N/A'
								}</h3>
								<div class="space-y-1 text-sm mb-3">
									<div><strong>Type:</strong> ${props.type || 'N/A'}</div>
									${props.areaCode ? `<div><strong>Code:</strong> ${props.areaCode}</div>` : ''}
								</div>
								<div class="flex gap-2 justify-center border-t pt-2">
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
						layer.bindPopup(popup);
						
						// Optimized: Use single event listener with event delegation
						layer.on('popupopen', () => {
							// Use setTimeout to ensure DOM is ready
							setTimeout(() => {
								const downloadGeoJSONButton = document.getElementById(`download-geojson-${featureId}`);
								const downloadKMLButton = document.getElementById(`download-kml-${featureId}`);
								
								if (downloadGeoJSONButton) {
									// Remove existing listener if any
									const newButton = downloadGeoJSONButton.cloneNode(true);
									downloadGeoJSONButton.parentNode?.replaceChild(newButton, downloadGeoJSONButton);
									newButton.addEventListener('click', (e) => {
										e.stopPropagation();
										this.downloadFeatureGeoJSON(feature, featureName);
									});
								}
								
								if (downloadKMLButton) {
									// Remove existing listener if any
									const newButton = downloadKMLButton.cloneNode(true);
									downloadKMLButton.parentNode?.replaceChild(newButton, downloadKMLButton);
									newButton.addEventListener('click', (e) => {
										e.stopPropagation();
										this.downloadFeatureKML(feature, featureName);
									});
								}
							}, 0);
						});

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

			// Batch render other layers using requestAnimationFrame for better performance
			this.batchRenderLayers();

			// Safely fit bounds
			try {
				const bounds = this.allSubAdministrativeZonesLayer.getBounds();
				if (bounds.isValid()) {
					this.map.fitBounds(bounds);
				}
			} catch (error) {
				console.warn('Could not fit bounds:', error);
			}
		} catch (error) {
			console.error('Error rendering sub-administrative zones:', error);
			this.messageService.add({
				severity: 'error',
				summary: 'Rendering Error',
				detail: 'Failed to render map features. Please check the data format.',
				life: 3000,
			});
		}
	}

	private renderAdministrativeZoneLayer() {
		if (!this.map || !this.administrativeZoneGeoJSON || !this.showAdministrativeZoneLayer) {
			return;
		}

		// Validate GeoJSON structure
		if (!this.isValidGeoJSON(this.administrativeZoneGeoJSON)) {
			console.error('Invalid Administrative Zone GeoJSON data structure');
			return;
		}

		if (this.administrativeZonesLayer) {
			this.map.removeLayer(this.administrativeZonesLayer);
		}

		try {
			this.administrativeZonesLayer = L.geoJSON(
				this.administrativeZoneGeoJSON,
				{
					style: (feature) => ({
						fillColor: feature?.properties?.type === 'Thromde' ? '#10B981' : '#3B82F6',
						fillOpacity: 0.2,
						color: feature?.properties?.type === 'Thromde' ? '#059669' : '#1D4ED8',
						weight: 2,
						opacity: 0.8,
					}),
					onEachFeature: (feature, layer) => {
						const props = feature.properties || {};
						const featureId = `az-${props.id || props.areaCode || Math.random()}`;
						const featureName = props.name || 'Administrative Zone';
						const popup = `
							<div class="p-2 min-w-[200px]">
								<h3 class="font-bold text-base mb-2 text-slate-900">${
									props.name || 'N/A'
								}</h3>
								<div class="space-y-1 text-sm mb-3">
									<div><strong>Type:</strong> ${props.type || 'N/A'}</div>
									${props.areaCode ? `<div><strong>Code:</strong> ${props.areaCode}</div>` : ''}
								</div>
								<div class="flex gap-2 justify-center border-t pt-2">
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
						layer.bindPopup(popup);
						
						// Optimized: Use single event listener with event delegation
						layer.on('popupopen', () => {
							// Use setTimeout to ensure DOM is ready
							setTimeout(() => {
								const downloadGeoJSONButton = document.getElementById(`download-geojson-${featureId}`);
								const downloadKMLButton = document.getElementById(`download-kml-${featureId}`);
								
								if (downloadGeoJSONButton) {
									// Remove existing listener if any
									const newButton = downloadGeoJSONButton.cloneNode(true);
									downloadGeoJSONButton.parentNode?.replaceChild(newButton, downloadGeoJSONButton);
									newButton.addEventListener('click', (e) => {
										e.stopPropagation();
										this.downloadFeatureGeoJSON(feature, featureName);
									});
								}
								
								if (downloadKMLButton) {
									// Remove existing listener if any
									const newButton = downloadKMLButton.cloneNode(true);
									downloadKMLButton.parentNode?.replaceChild(newButton, downloadKMLButton);
									newButton.addEventListener('click', (e) => {
										e.stopPropagation();
										this.downloadFeatureKML(feature, featureName);
									});
								}
							}, 0);
						});
						
						layer.bindTooltip(props.name || 'N/A', {
							permanent: false,
							direction: 'top',
						});
					},
				}
			);

			// Add to map but ensure SAZ layer is on top
			this.administrativeZonesLayer.addTo(this.map);

			// Move administrative zones layer to back
			this.administrativeZonesLayer.bringToBack();
		} catch (error) {
			console.error('Error rendering administrative zone layer:', error);
		}
	}

	/**
	 * Batch render layers for better performance
	 */
	private batchRenderLayers() {
		if (this.isRendering) return;
		
		this.isRendering = true;
		requestAnimationFrame(() => {
			if (this.showDzongkhagLayer && this.dzongkhagGeoJSON && this.map) {
				this.renderDzongkhag();
			}
			if (this.showAdministrativeZoneLayer && this.administrativeZoneGeoJSON && this.map) {
				this.renderAdministrativeZoneLayer();
			}
			this.isRendering = false;
		});
	}

	/**
	 * Batch load layers for better performance
	 */
	private batchLoadLayers() {
		// Load/render dzongkhag layer if toggle is enabled
		if (this.showDzongkhagLayer && !this.dzongkhagGeoJSON) {
			this.loadDzongkhagGeoJSON();
		} else if (this.showDzongkhagLayer && this.dzongkhagGeoJSON && this.map) {
			requestAnimationFrame(() => {
				this.renderDzongkhag();
			});
		}
		
		// Load/render administrative zone layer if toggle is enabled
		if (this.showAdministrativeZoneLayer && !this.administrativeZoneGeoJSON) {
			this.loadAdministrativeZoneGeoJSON();
		} else if (this.showAdministrativeZoneLayer && this.administrativeZoneGeoJSON && this.map) {
			requestAnimationFrame(() => {
				this.renderAdministrativeZoneLayer();
			});
		}
	}

	toggleAdministrativeZoneLayer(event: any) {
		if (!this.selectedDzongkhag) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select a dzongkhag first',
				life: 3000,
			});
			// Reset the switch if dzongkhag is not selected
			this.showAdministrativeZoneLayer = false;
			return;
		}

		// Clear any pending renders
		if (this.renderTimeout) {
			clearTimeout(this.renderTimeout);
		}

		// Get the new value from the event
		const newValue = event.checked;
		this.showAdministrativeZoneLayer = newValue;

		// Use visibility instead of remove/add for better performance
		if (this.administrativeZonesLayer && this.map) {
			if (newValue) {
				// Check if layer is already on the map
				if (!this.map.hasLayer(this.administrativeZonesLayer)) {
					this.map.addLayer(this.administrativeZonesLayer);
				}
			} else {
				// Remove layer if it exists on the map
				if (this.map.hasLayer(this.administrativeZonesLayer)) {
					this.map.removeLayer(this.administrativeZonesLayer);
				}
			}
		} else if (newValue) {
			// Only load/render if layer doesn't exist and we're turning it on
			if (!this.administrativeZoneGeoJSON) {
				this.loadAdministrativeZoneGeoJSON();
			} else {
				// Debounce render
				this.renderTimeout = setTimeout(() => {
					this.renderAdministrativeZoneLayer();
				}, 100);
			}
		}
	}

	/**
	 * Load Dzongkhag GeoJSON
	 */
	loadDzongkhagGeoJSON() {
		if (!this.selectedDzongkhag) {
			this.dzongkhagGeoJSON = null;
			this.removeDzongkhagLayer();
			return;
		}

		this.dzongkhagService
			.getDzongkhagGeojson(this.selectedDzongkhag.id)
			.subscribe({
				next: (data) => {
					this.dzongkhagGeoJSON = data;
					if (this.map && this.showDzongkhagLayer) {
						// Use requestAnimationFrame for smoother rendering
						requestAnimationFrame(() => {
							this.renderDzongkhag();
						});
					}
				},
				error: (error) => {
					console.error('Error loading dzongkhag GeoJSON:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load dzongkhag map data',
						life: 3000,
					});
				},
			});
	}

	/**
	 * Render Dzongkhag layer on map
	 */
	private renderDzongkhag() {
		if (!this.map || !this.dzongkhagGeoJSON || !this.showDzongkhagLayer) return;

		// Remove existing layer
		this.removeDzongkhagLayer();

		// Validate GeoJSON
		if (!this.isValidGeoJSON(this.dzongkhagGeoJSON)) {
			console.error('Invalid Dzongkhag GeoJSON data structure');
			return;
		}

		try {
			// Wrap single feature in FeatureCollection if needed
			let geoJsonData = this.dzongkhagGeoJSON;
			if (geoJsonData.type === 'Feature') {
				geoJsonData = {
					type: 'FeatureCollection',
					features: [geoJsonData]
				};
			}

			this.dzongkhagLayer = L.geoJSON(geoJsonData, {
				style: {
					color: '#dc2626', // Red color for dzongkhag
					weight: 3,
					fillColor: '#fee2e2',
					fillOpacity: 0, // Transparent fill
				},
				onEachFeature: (feature, layer) => {
					const props = feature.properties || {};
					const featureId = `dz-${props.id || props.areaCode || Math.random()}`;
					const featureName = props.name || 'Dzongkhag';
					const popup = `
						<div class="p-2 min-w-[200px]">
							<h3 class="font-bold text-base mb-2 text-slate-900">${
								props.name || 'N/A'
							}</h3>
							<div class="space-y-1 text-sm mb-3">
								${props.areaCode ? `<div><strong>Code:</strong> ${props.areaCode}</div>` : ''}
							</div>
							<div class="flex gap-2 justify-center border-t pt-2">
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
					layer.bindPopup(popup);
					
					// Optimized: Use single event listener with event delegation
					layer.on('popupopen', () => {
						// Use setTimeout to ensure DOM is ready
						setTimeout(() => {
							const downloadGeoJSONButton = document.getElementById(`download-geojson-${featureId}`);
							const downloadKMLButton = document.getElementById(`download-kml-${featureId}`);
							
							if (downloadGeoJSONButton) {
								// Remove existing listener if any
								const newButton = downloadGeoJSONButton.cloneNode(true);
								downloadGeoJSONButton.parentNode?.replaceChild(newButton, downloadGeoJSONButton);
								newButton.addEventListener('click', (e) => {
									e.stopPropagation();
									this.downloadFeatureGeoJSON(feature, featureName);
								});
							}
							
							if (downloadKMLButton) {
								// Remove existing listener if any
								const newButton = downloadKMLButton.cloneNode(true);
								downloadKMLButton.parentNode?.replaceChild(newButton, downloadKMLButton);
								newButton.addEventListener('click', (e) => {
									e.stopPropagation();
									this.downloadFeatureKML(feature, featureName);
								});
							}
						}, 0);
					});
				},
			});

			this.dzongkhagLayer.addTo(this.map);
			this.dzongkhagLayer.bringToBack();
		} catch (error) {
			console.error('Error rendering dzongkhag layer:', error);
		}
	}

	/**
	 * Remove Dzongkhag layer
	 */
	private removeDzongkhagLayer(): void {
		if (this.dzongkhagLayer) {
			this.map?.removeLayer(this.dzongkhagLayer);
			this.dzongkhagLayer = undefined;
		}
	}

	/**
	 * Toggle Dzongkhag layer visibility
	 */
	toggleDzongkhagLayer(event: any) {
		if (!this.selectedDzongkhag) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select a dzongkhag first',
				life: 3000,
			});
			// Reset the switch if dzongkhag is not selected
			this.showDzongkhagLayer = false;
			return;
		}

		// Clear any pending renders
		if (this.renderTimeout) {
			clearTimeout(this.renderTimeout);
		}

		// Get the new value from the event
		const newValue = event.checked;
		this.showDzongkhagLayer = newValue;

		// Use visibility instead of remove/add for better performance
		if (this.dzongkhagLayer && this.map) {
			if (newValue) {
				// Check if layer is already on the map
				if (!this.map.hasLayer(this.dzongkhagLayer)) {
					this.map.addLayer(this.dzongkhagLayer);
				}
			} else {
				// Remove layer if it exists on the map
				if (this.map.hasLayer(this.dzongkhagLayer)) {
					this.map.removeLayer(this.dzongkhagLayer);
				}
			}
		} else if (newValue) {
			// Only load/render if layer doesn't exist and we're turning it on
			if (!this.dzongkhagGeoJSON) {
				this.loadDzongkhagGeoJSON();
			} else {
				// Debounce render
				this.renderTimeout = setTimeout(() => {
					this.renderDzongkhag();
				}, 100);
			}
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

	selectSubAdministrativeZoneFromMap(properties: any) {
		const zone = this.subAdministrativeZones.find(
			(z) => z.id === properties.id || z.areaCode === properties.areaCode
		);
		if (zone) {
			this.selectedSubAdministrativeZone = zone;
			this.locationSelectionService.setSelectedSubAdministrativeZone(zone);
		}
	}

	// Table Functions
	selectSubAdministrativeZone(zone: SubAdministrativeZone) {
		this.selectedSubAdministrativeZone = zone;
		this.locationSelectionService.setSelectedSubAdministrativeZone(zone);
	}

	// CRUD Operations
	openNew() {
		if (!this.selectedDzongkhag && !this.selectedAdministrativeZone) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please select a dzongkhag or administrative zone first',
				life: 3000,
			});
			return;
		}
		this.subAdministrativeZoneForm.reset();
		// Pre-fill administrative zones for selected dzongkhag
		if (this.selectedDzongkhag) {
			this.loadAdministrativeZones();
		}
		// Pre-select administrative zone if one is selected
		if (this.selectedAdministrativeZone) {
			this.subAdministrativeZoneForm.patchValue({
				administrativeZoneId: this.selectedAdministrativeZone.id,
			});
		}
		this.isEditMode = false;
		this.subAdministrativeZoneDialog = true;
	}

	editSubAdministrativeZone(zone: SubAdministrativeZone) {
		this.subAdministrativeZoneForm.patchValue({
			name: zone.name,
			areaCode: zone.areaCode,
			administrativeZoneId: zone.administrativeZoneId,
			type: zone.type,
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
						this.loadSubAdministrativeZoneGeoJSON();
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
						this.loadSubAdministrativeZoneGeoJSON();
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
						this.loadSubAdministrativeZoneGeoJSON();
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
		// Area calculation removed - areaSqKm field no longer exists
		return 0;
	}

	get averageArea(): number {
		// Area calculation removed - areaSqKm field no longer exists
		return 0;
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

	get geoJSONFeatureCount(): number {
		if (!this.subAdministrativeZoneGeoJSON || !this.subAdministrativeZoneGeoJSON.features) {
			return 0;
		}
		return Array.isArray(this.subAdministrativeZoneGeoJSON.features)
			? this.subAdministrativeZoneGeoJSON.features.length
			: 0;
	}

	onRowSelect(event: any) {
		if (event.data) {
			this.selectSubAdministrativeZone(event.data);
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

	getAdministrativeZoneName(administrativeZoneId: number): string {
		const zone = this.administrativeZones.find(
			(z) => z.id === administrativeZoneId
		);
		return zone?.name || 'N/A';
	}

	getDzongkhagName(dzongkhagId: number): string {
		const dzongkhag = this.dzongkhags.find((d) => d.id === dzongkhagId);
		return dzongkhag?.name || 'N/A';
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

	openBulkUploadEA(zone: SubAdministrativeZone) {
		this.selectedSubAdministrativeZoneForBulkUploadEA = zone;
		this.bulkUploadEADialog = true;
	}

	closeBulkUploadEADialog() {
		this.bulkUploadEADialog = false;
		this.selectedSubAdministrativeZoneForBulkUploadEA = null;
	}

	onBulkUploadEASuccess(response: EABulkUploadResponse) {
		this.messageService.add({
			severity: 'success',
			summary: 'Bulk Upload Complete',
			detail: `Successfully processed ${response.success} enumeration area(s)`,
			life: 5000,
		});
		// Optionally refresh data if needed
		// this.loadSubAdministrativeZones();
	}

	onBulkUploadEACancel() {
		this.closeBulkUploadEADialog();
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
					this.loadSubAdministrativeZoneGeoJSON();
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

	// Bulk Upload Methods
	openBulkUploadDialog() {
		this.bulkUploadDialog = true;
		this.bulkUploadFile = null;
		// Pre-fill with selected administrative zone if available
		this.selectedAdministrativeZoneForBulkUpload = this.selectedAdministrativeZone;
		this.bulkUploadResults = null;
		this.bulkUploadProgress = 0;
		// Load administrative zones if not already loaded
		if (this.selectedDzongkhag && this.administrativeZones.length === 0) {
			this.loadAdministrativeZones();
		}
	}

	closeBulkUploadDialog() {
		this.bulkUploadDialog = false;
		this.bulkUploadFile = null;
		this.selectedAdministrativeZoneForBulkUpload = null;
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

	uploadBulkSubAdministrativeZones() {
		// Use selected administrative zone from dialog or main view
		const administrativeZoneToUse = this.selectedAdministrativeZoneForBulkUpload || this.selectedAdministrativeZone;
		
		if (!administrativeZoneToUse) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please select an Administrative Zone',
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

		this.subAdministrativeZoneService
			.bulkUploadGeojsonByAdministrativeZone(
				administrativeZoneToUse.id,
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
							detail: `Successfully created ${response.success} chiwog/LAP(s)`,
							life: 5000,
						});
					}

					if (response.skipped > 0) {
						this.messageService.add({
							severity: 'info',
							summary: 'Items Skipped',
							detail: `${response.skipped} chiwog/LAP(s) already exist and were skipped`,
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
					this.loadSubAdministrativeZones();
					this.loadSubAdministrativeZoneGeoJSON();
				},
				error: (error) => {
					this.bulkUploadLoading = false;
					this.bulkUploadProgress = 0;
					console.error('Error bulk uploading sub-administrative zones:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Upload Failed',
						detail:
							error?.error?.message ||
							'Failed to upload chiwogs/LAPs. Please try again.',
						life: 5000,
					});
				},
			});
	}

	// Navigate to sub-administrative zone detail viewer
	viewSubAdministrativeZoneDetails(zone: SubAdministrativeZone) {
		this.router.navigate(['/admin/data-view/sub-admzone', zone.id]);
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
