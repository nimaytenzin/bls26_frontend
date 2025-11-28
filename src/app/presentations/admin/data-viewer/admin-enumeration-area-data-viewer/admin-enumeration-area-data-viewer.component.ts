import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PrimeNgModules } from '../../../../primeng.modules';
import * as L from 'leaflet';
import { forkJoin } from 'rxjs';

import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { EnumerationArea } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { SubAdministrativeZone } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { AdministrativeZone } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { BasemapService } from '../../../../core/utility/basemap.service';
import { MapFeatureColorService } from '../../../../core/utility/map-feature-color.service';
// Import child components
import { CurrentHouseholdListingComponent } from './current-household-listing/current-household-listing.component';
import { AdminEnumerationAreaTrendsComponent } from './admin-enumeration-area-trends/admin-enumeration-area-trends.component';
import { GenerateFullEACode } from '../../../../core/utility/utility.service';
import { LocationDownloadService } from '../../../../core/dataservice/downloads/location.download.service';

@Component({
	selector: 'app-admin-enumeration-area-data-viewer',
	templateUrl: './admin-enumeration-area-data-viewer.component.html',
	styleUrls: ['./admin-enumeration-area-data-viewer.component.css'],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		RouterModule,
		PrimeNgModules,
		CurrentHouseholdListingComponent,
		AdminEnumerationAreaTrendsComponent,
	],
	providers: [MessageService],
})
export class AdminEnumerationAreaDataViewerComponent
	implements OnInit, OnDestroy
{
	// Data
	enumerationArea: EnumerationArea | null = null;
	subAdministrativeZone: SubAdministrativeZone | null = null;
	administrativeZone: AdministrativeZone | null = null;
	dzongkhag: Dzongkhag | null = null;

	// GeoJSON Data
	eaGeoJsonData: any = null;
	subAdminGeoJsonData: any = null;

	// Maps
	enumerationAreaMap: L.Map | null = null;
	satelliteLayer: L.TileLayer | null = null;
	openStreetMapLayer: L.TileLayer | null = null;
	eaLayer: L.GeoJSON | null = null;
	subAdminLayer: L.GeoJSON | null = null;

	// State
	loading = true;
	mapInitialized = false;
	showSatelliteLayer = false;
	eaId: number = 0;
	activeMainTab: 'insights' | 'households' | 'historical-trends' = 'insights';
	activeHouseholdTab: 'current' | 'Trends' = 'current';
	currentBaseMap: 'streets' | 'satellite' = 'streets';

	// Layer visibility
	showEALayer = true;
	showSubAdminLayer = true;

	// Filter/Navigation properties
	dzongkhagOptions: any[] = [];
	adminZoneOptions: any[] = [];
	subAdminZoneOptions: any[] = [];
	eaOptions: any[] = [];
	selectedDzongkhag: number | null = null;
	selectedAdminZone: number | null = null;
	selectedSubAdminZone: number | null = null;
	selectedEAFilter: number | null = null;

	// Basemap properties
	basemapCategories: any = {};
	selectedBasemapId: string = 'positron';

	getFullEACode = GenerateFullEACode;

	// Tile layers
	private readonly tileLayer =
		'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	private readonly satelliteTileLayer =
		'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private enumerationAreaService: EnumerationAreaDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private dzongkhagService: DzongkhagDataService,
		private messageService: MessageService,
		private basemapService: BasemapService,
		private mapFeatureColorService: MapFeatureColorService,
		private locationDownloadService: LocationDownloadService
	) {}

	ngOnInit() {
		// Initialize basemap categories
		this.basemapCategories = this.basemapService.getBasemapCategories();
		this.selectedBasemapId = 'positron';

		// Load all dzongkhags for filter dropdown
		this.loadDzongkhags();

		this.route.params.subscribe((params) => {
			this.eaId = +params['id'];
			if (this.eaId) {
				this.loadData();
			}
		});
	}

	ngOnDestroy() {
		this.destroyMaps();
	}

	loadData() {
		this.loading = true;

		this.enumerationAreaService.findEnumerationAreaById(this.eaId).subscribe({
			next: (ea) => {
				this.enumerationArea = ea;
				// Load parent hierarchy
				this.loadHierarchy();
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

	loadHierarchy() {
		if (!this.enumerationArea) return;

		this.subAdministrativeZoneService
			.findSubAdministrativeZoneById(
				this.enumerationArea.subAdministrativeZoneId
			)
			.subscribe({
				next: (subAdminZone) => {
					this.subAdministrativeZone = subAdminZone;

					if (subAdminZone.administrativeZone) {
						this.administrativeZone = subAdminZone.administrativeZone;

						if (subAdminZone.administrativeZone.dzongkhag) {
							this.dzongkhag = subAdminZone.administrativeZone.dzongkhag;
						}
					}

					this.loading = false;
					// Load GeoJSON data for map initialization
					this.loadGeoJsonData();
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

	loadGeoJsonData() {
		if (!this.enumerationArea || !this.subAdministrativeZone) return;

		// Load EA and sub-admin zone GeoJSON data
		const eaGeoJson$ = this.enumerationAreaService.findOneAsGeoJson(this.eaId);
		const subAdminGeoJson$ = this.subAdministrativeZoneService.findOneAsGeoJson(
			this.subAdministrativeZone.id
		);

		// Load all data in parallel
		forkJoin({
			eaGeoJson: eaGeoJson$,
			subAdminGeoJson: subAdminGeoJson$,
		}).subscribe({
			next: ({ eaGeoJson, subAdminGeoJson }) => {
				// Store GeoJSON data
				this.eaGeoJsonData = eaGeoJson;
				this.subAdminGeoJsonData = subAdminGeoJson;

				// Initialize map with GeoJSON data
				setTimeout(() => this.initializeMaps(), 100);
			},
			error: (error) => {
				console.error('Error loading GeoJSON data:', error);
				// Fallback to original geometry if GeoJSON fails
				setTimeout(() => this.initializeMaps(), 100);
			},
		});
	}

	initializeMaps() {
		// Initialize map - will handle geometry checking internally
		this.initializeEnumerationAreaMap();
	}

	initializeEnumerationAreaMap() {
		if (!this.enumerationArea) return;

		try {
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

			let hasValidGeometry = false;

			// Add sub-administrative zone boundary (if available)
			if (this.subAdminGeoJsonData && this.subAdminGeoJsonData.geometry) {
				this.subAdminLayer = L.geoJSON(this.subAdminGeoJsonData, {
					style: {
						color:
							this.mapFeatureColorService.getSingleFeatureColor('secondary'),
						weight: 2,
						fillColor: 'transparent',
						fillOpacity: 0,
					},
				});
				this.subAdminLayer.addTo(this.enumerationAreaMap);

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
				hasValidGeometry = true;
			} else if (this.subAdministrativeZone?.geom) {
				// Fallback to embedded geometry
				this.subAdminLayer = L.geoJSON(this.subAdministrativeZone.geom, {
					style: {
						color:
							this.mapFeatureColorService.getSingleFeatureColor('secondary'),
						weight: 2,
						fillColor: 'transparent',
						fillOpacity: 0,
					},
				});
				this.subAdminLayer.addTo(this.enumerationAreaMap);

				// Add label for Sub-Admin Zone (fallback)
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
						${this.subAdministrativeZone.name}
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

				// Add popup (fallback)
				const popupContent = `
					<div class="p-2 min-w-[240px]">
						<h3 class="font-bold text-base mb-2 text-slate-900">Sub-Administrative Zone</h3>
						<div class="space-y-0 text-sm">
							<div class="py-2 border-b border-slate-200">
								<span class="font-semibold text-slate-700">Name: </span>
								<span class="font-bold" style="color: #67A4CA">${
									this.subAdministrativeZone.name
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
				hasValidGeometry = true;
			}

			// Add enumeration area boundary (primary layer)
			if (this.eaGeoJsonData && this.eaGeoJsonData.geometry) {
				this.eaLayer = L.geoJSON(this.eaGeoJsonData, {
					style: {
						color: this.mapFeatureColorService.getSingleFeatureColor('primary'),
						weight: 3,
						fillColor:
							this.mapFeatureColorService.getSingleFeatureColor('primary'),
						fillOpacity: 0.2,
					},
				});
				hasValidGeometry = true;
			} else if (this.enumerationArea.geom) {
				// Fallback to embedded geometry
				this.eaLayer = L.geoJSON(this.enumerationArea.geom, {
					style: {
						color: this.mapFeatureColorService.getSingleFeatureColor('primary'),
						weight: 3,
						fillColor:
							this.mapFeatureColorService.getSingleFeatureColor('primary'),
						fillOpacity: 0.2,
					},
				});
				hasValidGeometry = true;
			}

			if (this.eaLayer) {
				this.eaLayer.addTo(this.enumerationAreaMap);
				this.enumerationAreaMap.fitBounds(this.eaLayer.getBounds(), {
					padding: [20, 20],
				});

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
						${this.enumerationArea.name} }
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
							<!-- Area Code -->
							<div class="py-2 border-b border-slate-200">
								<span class="font-semibold text-slate-700">Area Code: </span>
								<span class="font-bold" style="color: #67A4CA">${
									this.enumerationArea.areaCode || 'N/A'
								}</span>
							</div>

							<!-- Location Hierarchy -->
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

			// If no valid geometry found, show default view
			if (!hasValidGeometry) {
				console.warn('No valid geometry found for map display');
				this.enumerationAreaMap.setView([27.5142, 90.4336], 8); // Default to Bhutan center
			}

			this.mapInitialized = true;
		} catch (error) {
			console.error('Error initializing enumeration area map:', error);
			this.messageService.add({
				severity: 'error',
				summary: 'Map Error',
				detail: 'Failed to initialize map',
				life: 3000,
			});
		}
	}

	toggleSatelliteLayer() {
		if (
			!this.enumerationAreaMap ||
			!this.openStreetMapLayer ||
			!this.satelliteLayer
		) {
			return;
		}

		if (this.showSatelliteLayer) {
			// Switch to satellite layer
			this.enumerationAreaMap.removeLayer(this.openStreetMapLayer);
			this.enumerationAreaMap.addLayer(this.satelliteLayer);
		} else {
			// Switch to OpenStreetMap layer
			this.enumerationAreaMap.removeLayer(this.satelliteLayer);
			this.enumerationAreaMap.addLayer(this.openStreetMapLayer);
		}
	}

	/**
	 * Switch between base map layers
	 */
	switchBaseMap(mapType: 'streets' | 'satellite') {
		if (
			!this.enumerationAreaMap ||
			!this.openStreetMapLayer ||
			!this.satelliteLayer
		) {
			return;
		}

		this.currentBaseMap = mapType;

		if (mapType === 'satellite') {
			this.enumerationAreaMap.removeLayer(this.openStreetMapLayer);
			this.enumerationAreaMap.addLayer(this.satelliteLayer);
		} else {
			this.enumerationAreaMap.removeLayer(this.satelliteLayer);
			this.enumerationAreaMap.addLayer(this.openStreetMapLayer);
		}
	}

	/**
	 * Get button class for base map toggle
	 */
	getBaseMapButtonClass(mapType: 'streets' | 'satellite'): string {
		return this.currentBaseMap === mapType
			? 'bg-primary-600 text-white'
			: 'bg-slate-100 text-slate-600 hover:bg-slate-200';
	}

	destroyMaps() {
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

	// Filter/Navigation methods
	loadDzongkhags() {
		this.dzongkhagService.findAllDzongkhags().subscribe({
			next: (dzongkhags) => {
				this.dzongkhagOptions = dzongkhags.map((d) => ({
					label: d.name,
					value: d.id,
				}));
			},
			error: (error) => {
				console.error('Error loading dzongkhags:', error);
			},
		});
	}

	onDzongkhagChange() {
		// Reset dependent selections
		this.selectedAdminZone = null;
		this.selectedSubAdminZone = null;
		this.selectedEAFilter = null;
		this.adminZoneOptions = [];
		this.subAdminZoneOptions = [];
		this.eaOptions = [];

		if (this.selectedDzongkhag) {
			this.administrativeZoneService
				.findAdministrativeZonesByDzongkhag(this.selectedDzongkhag)
				.subscribe({
					next: (zones: AdministrativeZone[]) => {
						this.adminZoneOptions = zones.map((z: AdministrativeZone) => ({
							label: z.name,
							value: z.id,
						}));
					},
					error: (error: any) => {
						console.error('Error loading administrative zones:', error);
					},
				});
		}
	}

	onAdminZoneChange() {
		// Reset dependent selections
		this.selectedSubAdminZone = null;
		this.selectedEAFilter = null;
		this.subAdminZoneOptions = [];
		this.eaOptions = [];

		if (this.selectedAdminZone) {
			this.subAdministrativeZoneService
				.findSubAdministrativeZonesByAdministrativeZone(this.selectedAdminZone)
				.subscribe({
					next: (subZones: SubAdministrativeZone[]) => {
						this.subAdminZoneOptions = subZones.map(
							(sz: SubAdministrativeZone) => ({
								label: sz.name,
								value: sz.id,
							})
						);
					},
					error: (error: any) => {
						console.error('Error loading sub administrative zones:', error);
					},
				});
		}
	}

	onSubAdminZoneChange() {
		// Reset dependent selections
		this.selectedEAFilter = null;
		this.eaOptions = [];

		if (this.selectedSubAdminZone) {
			this.enumerationAreaService
				.findEnumerationAreasBySubAdministrativeZone(this.selectedSubAdminZone)
				.subscribe({
					next: (eas: EnumerationArea[]) => {
						this.eaOptions = eas.map((ea: EnumerationArea) => ({
							label: `${ea.name} (${ea.areaCode})`,
							value: ea.id,
						}));
					},
					error: (error: any) => {
						console.error('Error loading enumeration areas:', error);
					},
				});
		}
	}

	submitNavigation() {
		if (this.selectedEAFilter) {
			this.router.navigate([
				'/admin/data-view/enumeration-area',
				this.selectedEAFilter,
			]);
		} else if (this.selectedSubAdminZone) {
			this.router.navigate([
				'/admin/data-view/sub-admzone',
				this.selectedSubAdminZone,
			]);
		} else if (this.selectedAdminZone) {
			this.router.navigate([
				'/admin/data-view/admzone',
				this.selectedAdminZone,
			]);
		} else if (this.selectedDzongkhag) {
			this.router.navigate([
				'/admin/data-view/dzongkhag',
				this.selectedDzongkhag,
			]);
		}
	}

	// Basemap methods
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

	navigateTo(type: 'dzongkhag' | 'adminzone' | 'subadminzone', id: number) {
		switch (type) {
			case 'dzongkhag':
				this.router.navigate(['/admin/data-view/dzongkhag', id]);
				break;
			case 'adminzone':
				this.router.navigate(['/admin/data-view/admzone', id]);
				break;
			case 'subadminzone':
				this.router.navigate(['/admin/data-view/sub-admzone', id]);
				break;
		}
	}

	goBack() {
		this.router.navigate(['/admin/master/enumeration-areas']);
	}

	onHouseholdListingUploadComplete() {
		// Refresh the current household listing data
		this.messageService.add({
			severity: 'success',
			summary: 'Upload Complete',
			detail: 'Household listing has been uploaded successfully',
			life: 5000,
		});

		// You can add logic here to refresh the current household listing component
		// or emit an event to refresh data
	}

	/**
	 * Download enumeration area as KML
	 */
	downloadKML(): void {
		if (!this.eaGeoJsonData && !this.enumerationArea?.geom) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Data',
				detail: 'No geographic data available to download',
			});
			return;
		}

		const geoJson = this.eaGeoJsonData || {
			type: 'Feature',
			geometry: this.enumerationArea!.geom,
			properties: {
				name: this.enumerationArea!.name,
				areaCode: this.enumerationArea!.areaCode,
			},
		};

		const kml = this.convertGeoJsonToKML(geoJson);
		const blob = new Blob([kml], {
			type: 'application/vnd.google-earth.kml+xml',
		});
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);

		const fileName = `${this.enumerationArea?.name.replace(
			/\s+/g,
			'_'
		)}_EA.kml`;

		link.setAttribute('href', url);
		link.setAttribute('download', fileName);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		this.messageService.add({
			severity: 'success',
			summary: 'Downloaded',
			detail: 'KML file downloaded successfully',
		});
	}

	/**
	 * Download enumeration area as GeoJSON
	 */
	downloadGeoJSON(): void {
		if (!this.eaGeoJsonData && !this.enumerationArea?.geom) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Data',
				detail: 'No geographic data available to download',
			});
			return;
		}

		const geoJson = this.eaGeoJsonData || {
			type: 'Feature',
			geometry: this.enumerationArea!.geom,
			properties: {
				name: this.enumerationArea!.name,
				areaCode: this.enumerationArea!.areaCode,
				areaSqKm: this.enumerationArea!.areaSqKm,
				description: this.enumerationArea!.description,
			},
		};

		const geoJsonString = JSON.stringify(geoJson, null, 2);
		const blob = new Blob([geoJsonString], { type: 'application/json' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);

		const fileName = `${this.enumerationArea?.name.replace(
			/\s+/g,
			'_'
		)}_EA.geojson`;

		link.setAttribute('href', url);
		link.setAttribute('download', fileName);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		this.messageService.add({
			severity: 'success',
			summary: 'Downloaded',
			detail: 'GeoJSON file downloaded successfully',
		});
	}

	/**
	 * Convert GeoJSON to KML format
	 */
	private convertGeoJsonToKML(geoJson: any): string {
		const name = geoJson.properties?.name || 'Enumeration Area';
		const description = geoJson.properties?.description || '';
		const coordinates = this.extractCoordinates(geoJson.geometry);

		return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${this.escapeXml(name)}</name>
    <description>${this.escapeXml(description)}</description>
    <Placemark>
      <name>${this.escapeXml(name)}</name>
      <description>${this.escapeXml(description)}</description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${coordinates}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;
	}

	/**
	 * Extract coordinates from GeoJSON geometry
	 */
	private extractCoordinates(geometry: any): string {
		if (!geometry || !geometry.coordinates) return '';

		// Handle Polygon
		if (geometry.type === 'Polygon') {
			return geometry.coordinates[0]
				.map((coord: number[]) => `${coord[0]},${coord[1]},0`)
				.join('\n              ');
		}

		// Handle MultiPolygon (use first polygon)
		if (geometry.type === 'MultiPolygon') {
			return geometry.coordinates[0][0]
				.map((coord: number[]) => `${coord[0]},${coord[1]},0`)
				.join('\n              ');
		}

		return '';
	}

	/**
	 * Escape XML special characters
	 */
	private escapeXml(unsafe: string): string {
		if (!unsafe) return '';
		return unsafe
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;');
	}

	/**
	 * Download household data as CSV
	 */
	downloadHouseholdData(): void {
		// For enumeration area viewer, we might not have household data directly
		// This is a placeholder - implement based on available data
		this.messageService.add({
			severity: 'info',
			summary: 'Not Available',
			detail: 'Household CSV export is available in the Households tab',
			life: 3000,
		});
	}
}
