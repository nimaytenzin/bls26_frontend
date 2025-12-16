import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	Input,
	Output,
	EventEmitter,
	OnChanges,
	SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PrimeNgModules } from '../../../../../primeng.modules';
import * as L from 'leaflet';

import { EnumerationArea } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { SubAdministrativeZone } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { AdministrativeZone } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { Dzongkhag } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { EnumerationAreaDataService } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { SurveyEnumerationAreaStructureDataService } from '../../../../../core/dataservice/survey-enumeration-area-structure/survey-enumeration-area-structure.dataservice';
import { SurveyEnumerationAreaStructure } from '../../../../../core/dataservice/survey-enumeration-area-structure/survey-enumeration-area-structure.dto';
import { BasemapService } from '../../../../../core/utility/basemap.service';
import { MapFeatureColorService } from '../../../../../core/utility/map-feature-color.service';
import { GenerateFullEACode } from '../../../../../core/utility/utility.service';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'app-enumeration-area-map',
	templateUrl: './enumeration-area-map.component.html',
	styleUrls: ['./enumeration-area-map.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class EnumerationAreaMapComponent
	implements OnInit, OnDestroy, AfterViewInit, OnChanges
{
	@Input() enumerationArea: EnumerationArea | null = null;
	@Input() enumerationAreaId: number | null = null; // Alternative: pass ID instead of full object
	@Input() dzongkhagOptions: any[] = [];
	@Input() adminZoneOptions: any[] = [];
	@Input() subAdminZoneOptions: any[] = [];
	@Input() eaOptions: any[] = [];

	// Internal data (loaded by this component)
	subAdministrativeZone: SubAdministrativeZone | null = null;
	administrativeZone: AdministrativeZone | null = null;
	dzongkhag: Dzongkhag | null = null;
	eaGeoJsonData: any = null;
	subAdminGeoJsonData: any = null;
	loading: boolean = false;

	@Output() downloadKML = new EventEmitter<void>();
	@Output() downloadGeoJSON = new EventEmitter<void>();
	@Output() downloadHouseholdData = new EventEmitter<void>();
	@Output() navigateToLocation = new EventEmitter<{
		type: 'dzongkhag' | 'adminzone' | 'subadminzone' | 'ea';
		id: number;
	}>();
	@Output() dzongkhagChange = new EventEmitter<number | null>();
	@Output() adminZoneChange = new EventEmitter<number | null>();
	@Output() subAdminZoneChange = new EventEmitter<number | null>();
	@Output() hierarchyLoaded = new EventEmitter<{
		subAdministrativeZone: SubAdministrativeZone | null;
		administrativeZone: AdministrativeZone | null;
		dzongkhag: Dzongkhag | null;
	}>();

	// Map instance
	enumerationAreaMap: L.Map | null = null;
	satelliteLayer: L.TileLayer | null = null;
	openStreetMapLayer: L.TileLayer | null = null;
	eaLayer: L.GeoJSON | null = null;
	subAdminLayer: L.GeoJSON | null = null;
	structureMarkers: L.Marker[] = [];
	structureLayerGroup: L.LayerGroup | null = null;

	// State
	mapInitialized = false;
	currentBaseMap: 'streets' | 'satellite' = 'streets';

	// Layer visibility
	showEALayer = true;
	showSubAdminLayer = true;
	showStructures = true;

	// Structures data
	structures: SurveyEnumerationAreaStructure[] = [];

	// Basemap properties
	basemapCategories: any = {};
	selectedBasemapId: string = 'positron';

	// Filter/Navigation properties
	selectedDzongkhag: number | null = null;
	selectedAdminZone: number | null = null;
	selectedSubAdminZone: number | null = null;
	selectedEAFilter: number | null = null;

	getFullEACode = GenerateFullEACode;

	private destroy$ = new Subject<void>();

	constructor(
		private router: Router,
		private messageService: MessageService,
		private basemapService: BasemapService,
		private mapFeatureColorService: MapFeatureColorService,
		private enumerationAreaService: EnumerationAreaDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private structureDataService: SurveyEnumerationAreaStructureDataService
	) {}

	ngOnInit() {
		// Initialize basemap categories
		this.basemapCategories = this.basemapService.getBasemapCategories();
		this.selectedBasemapId = 'positron';

		// Load data if enumerationAreaId is provided
		if (this.enumerationAreaId && !this.enumerationArea) {
			this.loadEnumerationAreaData();
		} else if (this.enumerationArea) {
			// Check if subAdministrativeZones are loaded, if not, reload with includeSubAdminZone
			if (!this.enumerationArea.subAdministrativeZones || this.enumerationArea.subAdministrativeZones.length === 0) {
				const eaId = this.enumerationArea.id || this.enumerationAreaId;
				if (eaId) {
					this.enumerationAreaService
						.findEnumerationAreaById(eaId, false, true)
						.pipe(takeUntil(this.destroy$))
						.subscribe({
							next: (ea) => {
								this.enumerationArea = ea;
								this.loadMapData();
							},
							error: (error) => {
								console.error('Error loading enumeration area with hierarchy:', error);
								// Still try to load map data even if hierarchy fails
								this.loadMapData();
							},
						});
				} else {
					this.loadMapData();
				}
			} else {
				this.loadMapData();
			}
		}
	}

	ngAfterViewInit() {
		// Wait for view to initialize, then check if we can initialize map
		setTimeout(() => {
			if (this.enumerationArea && (this.eaGeoJsonData || this.enumerationArea.geom) && !this.loading && !this.mapInitialized) {
				this.initializeMap();
			}
		}, 200);
	}

	ngOnChanges(changes: SimpleChanges) {
		// If enumerationArea or enumerationAreaId changes, reload data
		if (changes['enumerationArea'] || changes['enumerationAreaId']) {
			if (this.enumerationAreaId && !this.enumerationArea) {
				this.loadEnumerationAreaData();
			} else if (this.enumerationArea) {
				this.loadMapData();
			}
		}

		// Initialize map when data is available
		if (
			(changes['eaGeoJsonData'] || changes['subAdminGeoJsonData'] || changes['enumerationArea']) &&
			!this.mapInitialized &&
			this.enumerationArea &&
			(this.eaGeoJsonData || this.enumerationArea.geom) &&
			!this.loading
		) {
			setTimeout(() => {
				if (!this.mapInitialized) {
					this.initializeMap();
				}
			}, 200);
		}

		// Update layers if data changes and map is already initialized
		if (
			(changes['eaGeoJsonData'] || changes['subAdminGeoJsonData']) &&
			this.mapInitialized
		) {
			this.updateLayers();
		}
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
		this.destroyMaps();
	}

	/**
	 * Load enumeration area data if only ID is provided
	 */
	loadEnumerationAreaData() {
		if (!this.enumerationAreaId) return;

		this.loading = true;
		// Include sub-administrative zones to enable hierarchy loading
		this.enumerationAreaService
			.findEnumerationAreaById(this.enumerationAreaId, false, true)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (ea) => {
					this.enumerationArea = ea;
					this.loadMapData();
				},
				error: (error) => {
					console.error('Error loading enumeration area:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumeration area details',
						life: 3000,
					});
					this.loading = false;
				},
			});
	}

	/**
	 * Load hierarchy and GeoJSON data for the map
	 */
	loadMapData() {
		if (!this.enumerationArea) return;

		this.loading = true;

		// Load hierarchy first - use first SAZ if multiple exist
		const firstSazId = this.enumerationArea.subAdministrativeZones && this.enumerationArea.subAdministrativeZones.length > 0
			? this.enumerationArea.subAdministrativeZones[0].id
			: null;
		
		if (!firstSazId) {
			console.error('Enumeration area has no sub-administrative zones. Reloading with includeSubAdminZone...');
			// If subAdministrativeZones is not loaded, reload the EA with includeSubAdminZone
			const eaId = this.enumerationArea.id || this.enumerationAreaId;
			if (eaId) {
				this.enumerationAreaService
					.findEnumerationAreaById(eaId, false, true)
					.pipe(takeUntil(this.destroy$))
					.subscribe({
						next: (ea) => {
							this.enumerationArea = ea;
							this.loadMapData(); // Retry loading map data
						},
						error: (error) => {
							console.error('Error reloading enumeration area:', error);
							this.messageService.add({
								severity: 'error',
								summary: 'Error',
								detail: 'Failed to load enumeration area hierarchy',
								life: 3000,
							});
							this.loading = false;
						},
					});
			} else {
				this.loading = false;
			}
			return;
		}

		this.subAdministrativeZoneService
			.findSubAdministrativeZoneById(firstSazId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (subAdminZone) => {
					this.subAdministrativeZone = subAdminZone;

					if (subAdminZone.administrativeZone) {
						this.administrativeZone = subAdminZone.administrativeZone;

						if (subAdminZone.administrativeZone.dzongkhag) {
							this.dzongkhag = subAdminZone.administrativeZone.dzongkhag;
						}
					}

					// Emit hierarchy data to parent
					this.hierarchyLoaded.emit({
						subAdministrativeZone: this.subAdministrativeZone,
						administrativeZone: this.administrativeZone,
						dzongkhag: this.dzongkhag,
					});

					// Load GeoJSON data
					this.loadGeoJsonData();
					
					// Load structures
					this.loadStructures();
				},
				error: (error) => {
					console.error('Error loading hierarchy:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load location hierarchy',
						life: 3000,
					});
					this.loading = false;
				},
			});
	}

	/**
	 * Load GeoJSON data for map layers
	 */
	loadGeoJsonData() {
		if (!this.enumerationArea || !this.subAdministrativeZone) {
			this.loading = false;
			return;
		}

		const eaId = this.enumerationArea.id || this.enumerationAreaId;
		if (!eaId) {
			this.loading = false;
			return;
		}

		// Load EA and sub-admin zone GeoJSON data
		const eaGeoJson$ = this.enumerationAreaService.findOneAsGeoJson(eaId);
		const subAdminGeoJson$ = this.subAdministrativeZoneService.findOneAsGeoJson(
			this.subAdministrativeZone.id
		);

		// Load all data in parallel
		forkJoin({
			eaGeoJson: eaGeoJson$,
			subAdminGeoJson: subAdminGeoJson$,
		})
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: ({ eaGeoJson, subAdminGeoJson }) => {
					// Store GeoJSON data
					this.eaGeoJsonData = eaGeoJson;
					this.subAdminGeoJsonData = subAdminGeoJson;
					
					console.log('GeoJSON data loaded:', {
						eaGeoJson: this.eaGeoJsonData,
						subAdminGeoJson: this.subAdminGeoJsonData,
						mapInitialized: this.mapInitialized
					});
					
					this.loading = false;

					// Initialize map if not already initialized, or update layers if map exists
					if (this.mapInitialized) {
						// Map already exists, update layers
						this.updateLayers();
					} else {
						// Map not initialized yet, initialize it now with the GeoJSON data
						setTimeout(() => {
							if (!this.mapInitialized && this.enumerationArea) {
								this.initializeMap();
							}
						}, 100);
					}
				},
				error: (error) => {
					console.error('Error loading GeoJSON data:', error);
					// Map component will use embedded geometry if GeoJSON fails
					this.loading = false;
					
					// Try to initialize map with embedded geometry if available
					if (!this.mapInitialized && this.enumerationArea && this.enumerationArea.geom) {
						setTimeout(() => {
							if (!this.mapInitialized) {
								this.initializeMap();
							}
						}, 100);
					}
				},
			});
	}

	/**
	 * Load structures for the enumeration area
	 */
	loadStructures() {
		if (!this.enumerationArea) return;

		// Get enumeration area ID
		const enumerationAreaId = this.enumerationArea.id || this.enumerationAreaId;
		
		if (!enumerationAreaId) {
			console.log('No enumeration area ID found');
			return;
		}

		this.structureDataService
			.getStructuresByEnumerationArea(enumerationAreaId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (structures) => {
					this.structures = structures;
					console.log('Structures loaded:', structures);
					
					// Render structures on map if map is already initialized
					if (this.mapInitialized) {
						this.renderStructures();
					}
				},
				error: (error) => {
					console.error('Error loading structures:', error);
					// Don't show error to user as structures might not exist yet
				},
			});
	}

	/**
	 * Render structures as points on the map
	 */
	renderStructures() {
		if (!this.enumerationAreaMap) return;

		// Clear existing structure markers
		this.clearStructures();

		// Create layer group for structures if it doesn't exist
		if (!this.structureLayerGroup) {
			this.structureLayerGroup = L.layerGroup();
		}

		// Filter structures that have coordinates
		const structuresWithCoords = this.structures.filter(
			(s) => s.latitude != null && s.longitude != null
		);

		structuresWithCoords.forEach((structure) => {
			if (structure.latitude && structure.longitude) {
				// Create marker icon
				const markerIcon = L.divIcon({
					className: 'structure-marker',
					html: `
						<div style="
							background-color: #ef4444;
							width: 12px;
							height: 12px;
							border-radius: 50%;
							border: 2px solid white;
							box-shadow: 0 2px 4px rgba(0,0,0,0.3);
						"></div>
					`,
					iconSize: [12, 12],
					iconAnchor: [6, 6],
				});

				// Create marker
				const marker = L.marker([structure.latitude, structure.longitude], {
					icon: markerIcon,
				});

				// Add popup with structure information
				const popupContent = `
					<div >
						<p >
						
						Strcture Number: ${structure.structureNumber}
						</p>
						
					</div>
				`;
				marker.bindPopup(popupContent);

				// Add to layer group
				marker.addTo(this.structureLayerGroup!);
				this.structureMarkers.push(marker);
			}
		});

		// Toggle visibility based on showStructures flag
		if (this.showStructures) {
			this.structureLayerGroup.addTo(this.enumerationAreaMap);
		} else {
			this.enumerationAreaMap.removeLayer(this.structureLayerGroup);
		}
	}

	/**
	 * Clear all structure markers from the map
	 */
	clearStructures() {
		if (this.structureLayerGroup) {
			this.structureLayerGroup.clearLayers();
		}
		this.structureMarkers = [];
	}

	/**
	 * Toggle structure layer visibility
	 */
	toggleStructuresLayer() {
		if (!this.enumerationAreaMap) return;

		// If structures haven't been rendered yet but we have structures data, render them
		if (!this.structureLayerGroup && this.structures.length > 0) {
			this.renderStructures();
			return;
		}

		if (!this.structureLayerGroup) return;

		if (this.showStructures) {
			this.structureLayerGroup.addTo(this.enumerationAreaMap);
		} else {
			this.enumerationAreaMap.removeLayer(this.structureLayerGroup);
		}
	}

	initializeMap() {
		if (!this.enumerationArea || this.mapInitialized) return;

		// Check if the DOM element exists
		const mapElement = document.getElementById('enumerationAreaMap');
		if (!mapElement) {
			console.warn('Map container element not found, retrying...');
			setTimeout(() => this.initializeMap(), 100);
			return;
		}

		try {
			// Destroy existing map if any
			if (this.enumerationAreaMap) {
				this.destroyMaps();
			}

			this.enumerationAreaMap = L.map('enumerationAreaMap', {
				zoomControl: false,
				scrollWheelZoom: true,
			});

			// Initialize tile layer using basemap service
			const basemap = this.basemapService.getBasemap(this.selectedBasemapId);
			if (basemap) {
				const tileLayer = L.tileLayer(basemap.url, {
					attribution: basemap.attribution,
					...basemap.options,
				});
				tileLayer.addTo(this.enumerationAreaMap);

				// Store reference based on basemap type
				if (
					basemap.id.includes('satellite') ||
					basemap.id.includes('imagery')
				) {
					this.satelliteLayer = tileLayer;
					this.currentBaseMap = 'satellite';
				} else {
					this.openStreetMapLayer = tileLayer;
					this.currentBaseMap = 'streets';
				}
			}

			this.addLayers();
			this.mapInitialized = true;

			// Render structures if they're already loaded
			if (this.structures.length > 0) {
				this.renderStructures();
			}

			// Force map to invalidate size after initialization to ensure it renders correctly
			setTimeout(() => {
				if (this.enumerationAreaMap) {
					this.enumerationAreaMap.invalidateSize();
				}
			}, 100);
		} catch (error) {
			console.error('Error initializing map:', error);
			this.messageService.add({
				severity: 'error',
				summary: 'Map Error',
				detail: 'Failed to initialize map',
				life: 3000,
			});
		}
	}

	addLayers() {
		let hasValidGeometry = false;

		// Add sub-administrative zone boundary (if available)
		if (this.subAdminGeoJsonData && this.subAdminGeoJsonData.geometry) {
			this.addSubAdminLayer(this.subAdminGeoJsonData);
			hasValidGeometry = true;
		} else if (this.subAdministrativeZone?.geom) {
			this.addSubAdminLayer({
				type: 'Feature',
				geometry: this.subAdministrativeZone.geom,
			});
			hasValidGeometry = true;
		}

		// Add enumeration area boundary (primary layer)
		if (this.eaGeoJsonData) {
			// Handle different GeoJSON structures
			let geoJsonToUse = this.eaGeoJsonData;
			
			// If it's a FeatureCollection, use the first feature
			if (this.eaGeoJsonData.type === 'FeatureCollection' && this.eaGeoJsonData.features && this.eaGeoJsonData.features.length > 0) {
				geoJsonToUse = this.eaGeoJsonData.features[0];
			}
			// If it's a Feature with geometry, use it directly
			else if (this.eaGeoJsonData.type === 'Feature' && this.eaGeoJsonData.geometry) {
				geoJsonToUse = this.eaGeoJsonData;
			}
			// If it has a geometry property directly, wrap it as a Feature
			else if (this.eaGeoJsonData.geometry) {
				geoJsonToUse = {
					type: 'Feature',
					geometry: this.eaGeoJsonData.geometry,
					properties: this.eaGeoJsonData.properties || {}
				};
			}
			
			console.log('Adding EA layer with GeoJSON:', geoJsonToUse);
			this.addEALayer(geoJsonToUse);
			hasValidGeometry = true;
		} else if (this.enumerationArea?.geom) {
			console.log('Using embedded geometry from enumerationArea');
			this.addEALayer({
				type: 'Feature',
				geometry: this.enumerationArea.geom,
				properties: {}
			});
			hasValidGeometry = true;
		}

		// If no valid geometry found, show default view
		if (!hasValidGeometry) {
			console.warn('No valid geometry found for map display');
			if (this.enumerationAreaMap) {
				this.enumerationAreaMap.setView([27.5142, 90.4336], 8); // Default to Bhutan center
			}
		}
	}

	updateLayers() {
		// Remove existing layers
		if (this.eaLayer && this.enumerationAreaMap) {
			this.enumerationAreaMap.removeLayer(this.eaLayer);
		}
		if (this.subAdminLayer && this.enumerationAreaMap) {
			this.enumerationAreaMap.removeLayer(this.subAdminLayer);
		}

		// Add updated layers
		this.addLayers();
		
		// Re-render structures
		if (this.structures.length > 0) {
			this.renderStructures();
		}
	}

	addSubAdminLayer(geoJsonData: any) {
		if (!this.enumerationAreaMap) return;

		this.subAdminLayer = L.geoJSON(geoJsonData, {
			style: {
				color: this.mapFeatureColorService.getSingleFeatureColor('secondary'),
				weight: 2,
				fillColor: 'transparent',
				fillOpacity: 0,
			},
		});

		if (this.showSubAdminLayer) {
			this.subAdminLayer.addTo(this.enumerationAreaMap);
		}

		// Add label for Sub-Admin Zone
		const bounds = this.subAdminLayer.getBounds();
		const center = bounds.getCenter();

		const labelContent = `
			<div style="
				color: #67A4CA;
				font-weight: 600;
				font-size: 9px;
				text-shadow: 
					-1.5px -1.5px 0 #fff,
					1.5px -1.5px 0 #fff,
					-1.5px 1.5px 0 #fff,
					1.5px 1.5px 0 #fff,
				text-align: center;
				white-space: nowrap;
			">
				${this.subAdministrativeZone?.name || 'Sub-Admin Zone'}
			</div>
		`;

		const label = L.tooltip({
			permanent: true,
			direction: 'center',
			className: 'saz-label',
			opacity: 1,
		})
			.setLatLng(center)
			.setContent(labelContent);

		this.subAdminLayer.bindTooltip(label);

		// Add popup
		const popupContent = `
			<div class="p-2 min-w-[240px]">
				<h3 class="font-bold text-base mb-2 text-slate-900">Sub-Administrative Zone</h3>
				<div class="space-y-0 text-sm">
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Name: </span>
						<span class="font-bold" style="color: #67A4CA">${
							this.subAdministrativeZone?.name || 'N/A'
						}</span>
					</div>
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Admin Zone: </span>
						<span class="text-slate-600">${this.administrativeZone?.name || 'N/A'}</span>
					</div>
					<div class="py-2">
						<span class="font-semibold text-slate-700">Dzongkhag: </span>
						<span class="text-slate-600">${this.dzongkhag?.name || 'N/A'}</span>
					</div>
				</div>
			</div>
		`;

		this.subAdminLayer.bindPopup(popupContent);
	}

	addEALayer(geoJsonData: any) {
		if (!this.enumerationAreaMap || !this.enumerationArea) {
			console.warn('Cannot add EA layer: map or enumerationArea not available', {
				hasMap: !!this.enumerationAreaMap,
				hasEA: !!this.enumerationArea
			});
			return;
		}

		try {
			console.log('Creating EA layer from GeoJSON:', geoJsonData);
			this.eaLayer = L.geoJSON(geoJsonData, {
				style: {
					color: this.mapFeatureColorService.getSingleFeatureColor('primary'),
					weight: 3,
					fillColor: this.mapFeatureColorService.getSingleFeatureColor('primary'),
					fillOpacity: 0.2,
				},
			});
			
			console.log('EA layer created:', this.eaLayer);
		} catch (error) {
			console.error('Error creating EA layer:', error, geoJsonData);
			return;
		}

		if (this.showEALayer) {
			this.eaLayer.addTo(this.enumerationAreaMap);
			this.enumerationAreaMap.fitBounds(this.eaLayer.getBounds(), {
				padding: [20, 20],
			});
		}

		// Add permanent label for EA
		const bounds = this.eaLayer.getBounds();
		const center = bounds.getCenter();

		const fullEACode = this.getFullEACode(this.enumerationArea);

		const labelContent = `
			<div style="
				color: black;
				font-weight: 700;
				font-size: 10px;
				text-shadow: 
					-2px -2px 0 #fff,
					2px -2px 0 #fff,
					-2px 2px 0 #fff,
					2px 2px 0 #fff,
				text-align: center;
				white-space: nowrap;
			">
				${this.enumerationArea.name}
			</div>
		`;

		const label = L.tooltip({
			permanent: true,
			direction: 'center',
			className: 'ea-label',
			opacity: 1,
		})
			.setLatLng(center)
			.setContent(labelContent);

		this.eaLayer.bindTooltip(label);

		// Add improved popup
		const popupContent = `
			<div class="p-2 min-w-[280px]">
				<h3 class="font-bold text-lg mb-3 text-slate-900">${
					this.enumerationArea.name
				}</h3>
				<div class="space-y-0 text-sm mb-3">
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Area Code: </span>
						<span class="font-bold" style="color: #67A4CA">${
							this.enumerationArea.areaCode || 'N/A'
						}</span>
					</div>
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Sub-Admin Zone: </span>
						<span class="text-slate-600">${this.subAdministrativeZone?.name || 'N/A'}</span>
					</div>
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Admin Zone: </span>
						<span class="text-slate-600">${this.administrativeZone?.name || 'N/A'}</span>
					</div>
					<div class="py-2">
						<span class="font-semibold text-slate-700">Dzongkhag: </span>
						<span class="text-slate-600">${this.dzongkhag?.name || 'N/A'}</span>
					</div>
				</div>
			</div>
		`;

		this.eaLayer.bindPopup(popupContent);
	}

	switchBasemap() {
		if (!this.enumerationAreaMap || !this.selectedBasemapId) return;

		const basemap = this.basemapService.getBasemap(this.selectedBasemapId);
		if (!basemap) return;

		// Remove existing tile layers
		if (this.openStreetMapLayer) {
			this.enumerationAreaMap.removeLayer(this.openStreetMapLayer);
		}
		if (this.satelliteLayer) {
			this.enumerationAreaMap.removeLayer(this.satelliteLayer);
		}

		// Add new tile layer
		const newLayer = L.tileLayer(basemap.url, {
			attribution: basemap.attribution,
			...basemap.options,
		});
		newLayer.addTo(this.enumerationAreaMap);

		// Store reference for cleanup
		if (basemap.id.includes('satellite') || basemap.id.includes('imagery')) {
			this.satelliteLayer = newLayer;
			this.currentBaseMap = 'satellite';
		} else {
			this.openStreetMapLayer = newLayer;
			this.currentBaseMap = 'streets';
		}
	}

	toggleEALayer() {
		if (!this.enumerationAreaMap || !this.eaLayer) return;

		if (this.showEALayer) {
			this.eaLayer.addTo(this.enumerationAreaMap);
		} else {
			this.enumerationAreaMap.removeLayer(this.eaLayer);
		}
	}

	toggleSubAdminLayer() {
		if (!this.enumerationAreaMap || !this.subAdminLayer) return;

		if (this.showSubAdminLayer) {
			this.subAdminLayer.addTo(this.enumerationAreaMap);
		} else {
			this.enumerationAreaMap.removeLayer(this.subAdminLayer);
		}
	}

	destroyMaps() {
		// Clear structures
		this.clearStructures();
		if (this.structureLayerGroup) {
			this.structureLayerGroup = null;
		}

		if (this.enumerationAreaMap) {
			this.enumerationAreaMap.remove();
			this.enumerationAreaMap = null;
		}
		if (this.openStreetMapLayer) {
			this.openStreetMapLayer = null;
		}
		if (this.satelliteLayer) {
			this.satelliteLayer = null;
		}
		this.mapInitialized = false;
	}

	// Download methods
	onDownloadKML() {
		this.downloadKML.emit();
	}

	onDownloadGeoJSON() {
		this.downloadGeoJSON.emit();
	}

	onDownloadHouseholdData() {
		this.downloadHouseholdData.emit();
	}

	// Navigation methods - emit events for parent to handle
	submitNavigation() {
		if (this.selectedEAFilter) {
			this.navigateToLocation.emit({
				type: 'ea',
				id: this.selectedEAFilter,
			});
		} else if (this.selectedSubAdminZone) {
			this.navigateToLocation.emit({
				type: 'subadminzone',
				id: this.selectedSubAdminZone,
			});
		} else if (this.selectedAdminZone) {
			this.navigateToLocation.emit({
				type: 'adminzone',
				id: this.selectedAdminZone,
			});
		} else if (this.selectedDzongkhag) {
			this.navigateToLocation.emit({
				type: 'dzongkhag',
				id: this.selectedDzongkhag,
			});
		}
	}

	// Filter change handlers - emit events for parent to handle data loading
	onDzongkhagChange() {
		// Reset dependent selections
		this.selectedAdminZone = null;
		this.selectedSubAdminZone = null;
		this.selectedEAFilter = null;
		this.dzongkhagChange.emit(this.selectedDzongkhag);
	}

	onAdminZoneChange() {
		// Reset dependent selections
		this.selectedSubAdminZone = null;
		this.selectedEAFilter = null;
		this.adminZoneChange.emit(this.selectedAdminZone);
	}

	onSubAdminZoneChange() {
		// Reset dependent selections
		this.selectedEAFilter = null;
		this.subAdminZoneChange.emit(this.selectedSubAdminZone);
	}
}

