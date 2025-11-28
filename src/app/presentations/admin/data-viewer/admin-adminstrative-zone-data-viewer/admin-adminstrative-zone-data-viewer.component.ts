import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	ViewChild,
	ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { SubAdminZoneAnnualStatsDataService } from '../../../../core/dataservice/sub-admin-zone-annual-stats/sub-admin-zone-annual-stats.dataservice';
import { LocationDownloadService } from '../../../../core/dataservice/downloads/location.download.service';
import { BasemapService } from '../../../../core/utility/basemap.service';
import { MapFeatureColorService } from '../../../../core/utility/map-feature-color.service';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import * as L from 'leaflet';
import { forkJoin } from 'rxjs';

type LayerType = 'admin' | 'subAdmin' | 'ea';
type BaseMapType = 'streets' | 'satellite';

@Component({
	selector: 'app-admin-adminstrative-zone-data-viewer',
	standalone: true,
	imports: [CommonModule, PrimeNgModules, FormsModule],
	templateUrl: './admin-adminstrative-zone-data-viewer.component.html',
	styleUrls: ['./admin-adminstrative-zone-data-viewer.component.css'],
	providers: [MessageService],
})
export class AdminAdminstrativeZoneDataViewerComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	@ViewChild('mapContainer', { static: false })
	private mapContainerRef?: ElementRef<HTMLDivElement>;

	readonly layerOptions: Array<{
		value: LayerType;
		label: string;
	}> = [
		{
			value: 'admin',
			label: 'Administrative Zone Boundary',
		},
		{
			value: 'subAdmin',
			label: 'Chiwog/Lap',
		},
		{
			value: 'ea',
			label: 'Enumeration Areas',
		},
	];

	readonly baseMapOptions: Array<{
		value: BaseMapType;
		label: string;
	}> = [
		{
			value: 'streets',
			label: 'OpenStreetMap',
		},
		{
			value: 'satellite',
			label: 'Esri Satellite',
		},
	];

	readonly statsTabs: Array<{
		value: 'overview' | 'subAdmin' | 'ea';
		label: string;
		description: string;
	}> = [
		{
			value: 'overview',
			label: 'Overview',
			description: 'Key totals and highlights for the selected zone.',
		},
		{
			value: 'subAdmin',
			label: 'Chiwog/Lap',
			description: 'Granular statistics for chiwogs and sub-zones.',
		},
		{
			value: 'ea',
			label: 'Enumeration Areas',
			description: 'Household and population data for enumeration areas.',
		},
	];

	private readonly baseMapDefinitions: Record<
		BaseMapType,
		{ label: string; url: string; options: L.TileLayerOptions }
	> = {
		streets: {
			label: 'OpenStreetMap',
			url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
			options: {
				maxZoom: 19,
				attribution: '© OpenStreetMap contributors',
			},
		},
		satellite: {
			label: 'Esri Satellite',
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			options: {
				maxZoom: 19,
				attribution:
					'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
			},
		},
	};

	adminZoneId!: number;
	adminZone: any = null;
	loading = true;
	error: string | null = null;

	// Layers
	activeLayer: LayerType = 'admin';

	// Basemap properties
	selectedBasemapId = 'positron'; // Default basemap (Positron - No Labels)
	basemapCategories: Record<
		string,
		{ label: string; basemaps: Array<{ id: string; name: string }> }
	> = {};

	// Data
	adminZoneBoundary: any = null;
	subAdminZones: any[] = [];
	subAdminBoundaries: any = null;
	enumerationAreas: any = null;
	eaBoundaries: any = null;

	// Map
	private map?: L.Map;
	private baseLayer?: L.TileLayer;
	private currentGeoJSONLayer?: L.GeoJSON;
	activeBaseMap: BaseMapType = 'streets';

	// Statistics
	stats = {
		totalSubAdminZones: 0,
		totalEnumerationAreas: 0,
		totalHouseholds: 0,
		totalPopulation: 0,
		totalMale: 0,
		totalFemale: 0,
		urbanHouseholds: 0,
		ruralHouseholds: 0,
		urbanPopulation: 0,
		ruralPopulation: 0,
		urbanEA: 0,
		ruralEA: 0,
	};

	// Detailed statistics by zone
	subAdminZoneStats: any[] = [];
	eaStats: any[] = [];

	// Active tab for statistics view
	activeStatsTab: 'overview' | 'subAdmin' | 'ea' = 'overview';

	// Active main tab (insights or downloads)
	activeMainTab: 'insights' | 'downloads' = 'insights';

	// Map visualization mode
	mapVisualizationMode: 'households' | 'population' | 'enumerationAreas' =
		'households';

	// Lifecycle flags
	private isViewReady = false;
	private isDataReady = false;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private adminZoneService: AdministrativeZoneDataService,
		private subAdminZoneAnnualStatsService: SubAdminZoneAnnualStatsDataService,
		private basemapService: BasemapService,
		private colorScaleService: MapFeatureColorService,
		private locationDownloadService: LocationDownloadService,
		private messageService: MessageService
	) {
		// Initialize basemap categories
		this.basemapCategories = this.basemapService.getBasemapCategories();

		// Listen for custom navigation events from popup buttons
		window.addEventListener('navigate-subadmin', (event: any) => {
			this.navigateToSubAdminZone(event.detail);
		});

		window.addEventListener('navigate-ea', (event: any) => {
			this.navigateToEAZone(event.detail);
		});
	}

	ngOnInit() {
		this.adminZoneId = Number(this.route.snapshot.paramMap.get('id'));
		this.loadData();
	}

	ngAfterViewInit() {
		this.isViewReady = true;
		this.attemptInitializeMap();
	}

	ngOnDestroy() {
		if (this.map) {
			this.map.remove();
		}
	}

	loadData() {
		this.loading = true;
		this.error = null;

		console.log('Loading SAZ data for admin zone ID:', this.adminZoneId);

		// Load SAZ stats with GeoJSON for the administrative zone
		this.subAdminZoneAnnualStatsService
			.getAllCurrentSAZStatsGeojsonByAdministrativeZone(this.adminZoneId)
			.subscribe({
				next: (data) => {
					console.log('Loaded SAZ stats GeoJSON:', data);
					console.log('Number of SAZ features:', data.features?.length || 0);

					// Extract metadata
					if (data.metadata) {
						this.adminZone = {
							id: data.metadata.administrativeZoneId,
							name: data.metadata.administrativeZoneName,
							type: data.metadata.administrativeZoneType,
							dzongkhagId: data.metadata.dzongkhagId,
							dzongkhagName: data.metadata.dzongkhagName,
						};
						console.log('Admin zone metadata:', this.adminZone);
					}

					// Extract SAZ boundaries and data from features
					if (data && data.features) {
						this.subAdminBoundaries = data;
						this.subAdminZones = data.features.map((feature: any) => ({
							id: feature.properties.id,
							name: feature.properties.name,
							areaCode: feature.properties.areaCode,
							type: feature.properties.type,
							areaSqKm: feature.properties.areaSqKm,
							eaCount: feature.properties.eaCount,
							totalHouseholds: feature.properties.totalHouseholds,
							totalPopulation: feature.properties.totalPopulation,
							totalMale: feature.properties.totalMale,
							totalFemale: feature.properties.totalFemale,
							populationDensity: feature.properties.populationDensity,
							averageHouseholdSize: feature.properties.averageHouseholdSize,
							genderRatio: feature.properties.genderRatio,
							...feature.properties,
						}));

						console.log('Processed SAZ zones:', this.subAdminZones.length);

						// Calculate statistics from loaded data
						this.calculateStatisticsFromData(data.metadata.summary);
					}

					this.loading = false;
					this.isDataReady = true;

					console.log('Data ready, attempting to initialize map...');

					// Use setTimeout to ensure DOM is updated
					setTimeout(() => {
						this.attemptInitializeMap();
					}, 0);
				},
				error: (error) => {
					console.error('Error loading SAZ data:', error);
					this.error =
						'Failed to load sub-administrative zone data. Please try again.';
					this.loading = false;
				},
			});
	}

	calculateStatisticsFromData(summary: any) {
		if (!summary) {
			this.generateDummyStatistics();
			return;
		}

		this.stats = {
			totalSubAdminZones: summary.totalSAZs || 0,
			totalEnumerationAreas: summary.totalEAs || 0,
			totalHouseholds: summary.totalHouseholds || 0,
			totalPopulation: summary.totalPopulation || 0,
			totalMale: summary.totalMale || 0,
			totalFemale: summary.totalFemale || 0,
			// Note: SAZ level doesn't have urban/rural breakdown
			// These will be calculated based on type if needed
			urbanHouseholds: 0,
			ruralHouseholds: 0,
			urbanPopulation: 0,
			ruralPopulation: 0,
			urbanEA: 0,
			ruralEA: 0,
		};

		// Calculate urban/rural from SAZ data
		this.subAdminZones.forEach((saz) => {
			const isUrban = saz.type?.toLowerCase() === 'lap';
			if (isUrban) {
				this.stats.urbanHouseholds += saz.totalHouseholds || 0;
				this.stats.urbanPopulation += saz.totalPopulation || 0;
				this.stats.urbanEA += saz.eaCount || 0;
			} else {
				this.stats.ruralHouseholds += saz.totalHouseholds || 0;
				this.stats.ruralPopulation += saz.totalPopulation || 0;
				this.stats.ruralEA += saz.eaCount || 0;
			}
		});

		// Generate statistics for tabs
		this.generateSubAdminZoneStatistics();
		this.generateEAStatistics();
	}

	calculateStatistics() {
		// This is now handled by calculateStatisticsFromData
		// Keep this method for compatibility
		this.generateDummyStatistics();
		this.generateSubAdminZoneStatistics();
		this.generateEAStatistics();
	}

	generateDummyStatistics() {
		const baseHouseholdsPerEA = 150;
		const avgHouseholdSize = 4.5;

		this.stats.totalEnumerationAreas = 20;
		this.stats.totalHouseholds =
			this.stats.totalEnumerationAreas * baseHouseholdsPerEA;
		this.stats.totalPopulation = Math.round(
			this.stats.totalHouseholds * avgHouseholdSize
		);

		this.stats.totalFemale = Math.round(this.stats.totalPopulation * 0.51);
		this.stats.totalMale = this.stats.totalPopulation - this.stats.totalFemale;

		const urbanRatio = 0.3;
		this.stats.urbanHouseholds = Math.round(
			this.stats.totalHouseholds * urbanRatio
		);
		this.stats.ruralHouseholds =
			this.stats.totalHouseholds - this.stats.urbanHouseholds;

		this.stats.urbanPopulation = Math.round(
			this.stats.totalPopulation * urbanRatio
		);
		this.stats.ruralPopulation =
			this.stats.totalPopulation - this.stats.urbanPopulation;

		this.stats.urbanEA = Math.round(
			this.stats.totalEnumerationAreas * urbanRatio
		);
		this.stats.ruralEA = this.stats.totalEnumerationAreas - this.stats.urbanEA;

		this.stats.totalSubAdminZones = 5;
	}

	generateSubAdminZoneStatistics() {
		// Use real data from loaded SAZ zones
		this.subAdminZoneStats = this.subAdminZones
			.map((saz) => ({
				id: saz.id,
				name: saz.name,
				areaCode: saz.areaCode,
				type: saz.type?.toUpperCase() || 'CHIWOG',
				eaCount: saz.eaCount || 0,
				households: saz.totalHouseholds || 0,
				population: saz.totalPopulation || 0,
				male: saz.totalMale || 0,
				female: saz.totalFemale || 0,
			}))
			.sort((a, b) => b.households - a.households);
	}

	generateEAStatistics() {
		this.eaStats = Array.from({ length: 20 }, (_, index) => {
			const households = Math.floor(Math.random() * 250) + 50;
			const population = Math.round(households * 4.5);

			return {
				id: index + 1,
				name: `EA ${index + 1}`,
				areaCode: `EA-${String(index + 1).padStart(3, '0')}`,
				type: 'EA',
				parentZone: `Sub-Zone ${Math.floor(index / 4) + 1}`,
				households: households,
				population: population,
				male: Math.round(population * 0.49),
				female: Math.round(population * 0.51),
			};
		}).sort((a, b) => b.households - a.households);
	}

	switchStatsTab(tab: 'overview' | 'subAdmin' | 'ea'): void {
		this.activeStatsTab = tab;

		const layerMap: Record<typeof tab, LayerType> = {
			overview: 'admin',
			subAdmin: 'subAdmin',
			ea: 'ea',
		};

		this.switchLayer(layerMap[tab]);
	}

	goBack() {
		// Navigate back to parent dzongkhag or administrative zones list
		this.router.navigate(['/admin/master/administrative-zones']);
	}

	navigateToSubAdminZone(subAdminZoneId: number) {
		this.router.navigate(['/admin/data-view/sub-admzone', subAdminZoneId]);
	}

	navigateToEAZone(eaZoneId: number) {
		this.router.navigate(['/admin/data-view/eazone', eaZoneId]);
	}

	initializeMap() {
		if (this.map) {
			this.map.remove();
		}

		const container = this.mapContainerRef?.nativeElement;

		if (!container) {
			console.warn('Map container not found');
			return;
		}

		this.map = L.map(container, {
			center: [27.5142, 90.4336],
			zoom: 10,
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

		// Render the initial layer if data is loaded
		if (this.subAdminBoundaries) {
			this.renderLayer(this.activeLayer);
		}
	}

	switchLayer(layer: LayerType) {
		this.activeLayer = layer;
		this.renderLayer(layer);
	}

	changeVisualizationMode(
		mode: 'households' | 'population' | 'enumerationAreas'
	) {
		this.mapVisualizationMode = mode;
		this.renderLayer(this.activeLayer);
	}

	renderLayer(layer: LayerType) {
		console.log('Rendering layer:', layer);

		if (!this.map) {
			console.warn('Cannot render layer - map not initialized');
			return;
		}

		if (this.currentGeoJSONLayer) {
			this.map.removeLayer(this.currentGeoJSONLayer);
		}

		let geojsonData: any = null;
		let styleFunc: (feature: any) => L.PathOptions;
		let onEachFeatureFunc: (feature: any, layer: L.Layer) => void;

		switch (layer) {
			case 'admin':
				// For admin layer, use color scale based on visualization mode
				if (this.subAdminBoundaries && this.subAdminBoundaries.features) {
					geojsonData = this.subAdminBoundaries;
					console.log(
						'Admin layer - using SAZ boundaries with',
						geojsonData.features.length,
						'features'
					);

					// Calculate min/max values for color scaling
					const values = geojsonData.features.map((f: any) => {
						if (this.mapVisualizationMode === 'households') {
							return f.properties.totalHouseholds || 0;
						} else if (this.mapVisualizationMode === 'population') {
							return f.properties.totalPopulation || 0;
						} else {
							return f.properties.eaCount || 0;
						}
					});

					const minValue = Math.min(...values);
					const maxValue = Math.max(...values);

					console.log(
						`Color scale range for ${this.mapVisualizationMode}:`,
						minValue,
						'-',
						maxValue
					);

					styleFunc = (feature: any) => {
						const props = feature.properties;
						let currentValue: number;

						if (this.mapVisualizationMode === 'households') {
							currentValue = props.totalHouseholds || 0;
						} else if (this.mapVisualizationMode === 'population') {
							currentValue = props.totalPopulation || 0;
						} else {
							currentValue = props.eaCount || 0;
						}

						const color = this.colorScaleService.getInterpolatedColor(
							currentValue,
							minValue,
							maxValue
						);

						return {
							fillColor: color,
							fillOpacity: 0.7,
							color: 'darkcyan',
							weight: 0.5,
							opacity: 1,
						};
					};
				} else {
					console.warn('Admin layer - no SAZ boundaries available');
					styleFunc = () => ({
						fillColor: '#3B82F6',
						fillOpacity: 0.2,
						color: '#1E40AF',
						weight: 2,
						opacity: 1,
					});
				}
				onEachFeatureFunc = this.onEachAdminZoneFeature.bind(this);
				break;

			case 'subAdmin':
				geojsonData = this.subAdminBoundaries;
				console.log('SubAdmin layer - using SAZ boundaries:', !!geojsonData);

				if (geojsonData && geojsonData.features) {
					// Calculate min/max values for color scaling
					const values = geojsonData.features.map((f: any) => {
						if (this.mapVisualizationMode === 'households') {
							return f.properties.totalHouseholds || 0;
						} else if (this.mapVisualizationMode === 'population') {
							return f.properties.totalPopulation || 0;
						} else {
							return f.properties.eaCount || 0;
						}
					});

					const minValue = Math.min(...values);
					const maxValue = Math.max(...values);

					console.log(
						`Color scale range for ${this.mapVisualizationMode}:`,
						minValue,
						'-',
						maxValue
					);

					styleFunc = (feature: any) => {
						const props = feature.properties;
						let currentValue: number;

						if (this.mapVisualizationMode === 'households') {
							currentValue = props.totalHouseholds || 0;
						} else if (this.mapVisualizationMode === 'population') {
							currentValue = props.totalPopulation || 0;
						} else {
							currentValue = props.eaCount || 0;
						}

						const color = this.colorScaleService.getInterpolatedColor(
							currentValue,
							minValue,
							maxValue
						);

						return {
							fillColor: color,
							fillOpacity: 0.7,
							color: 'darkcyan',
							weight: 0.5,
							opacity: 1,
						};
					};
				} else {
					styleFunc = (feature) => {
						const type = feature.properties.type?.toLowerCase();
						if (type === 'lap') {
							return {
								fillColor: '#F59E0B',
								fillOpacity: 0.3,
								color: '#D97706',
								weight: 1.5,
								opacity: 1,
							};
						} else {
							return {
								fillColor: '#10B981',
								fillOpacity: 0.3,
								color: '#059669',
								weight: 1.5,
								opacity: 1,
							};
						}
					};
				}
				onEachFeatureFunc = this.onEachSubAdminFeature.bind(this);
				break;

			case 'ea':
				geojsonData = this.eaBoundaries;
				console.log('EA layer - using EA boundaries:', !!geojsonData);

				if (geojsonData && geojsonData.features) {
					// Calculate min/max values for color scaling
					const values = geojsonData.features.map((f: any) => {
						if (this.mapVisualizationMode === 'households') {
							return f.properties.totalHouseholds || 0;
						} else if (this.mapVisualizationMode === 'population') {
							return f.properties.totalPopulation || 0;
						} else {
							return f.properties.eaCount || 0;
						}
					});

					const minValue = Math.min(...values);
					const maxValue = Math.max(...values);

					console.log(
						`Color scale range for ${this.mapVisualizationMode}:`,
						minValue,
						'-',
						maxValue
					);

					styleFunc = (feature: any) => {
						const props = feature.properties;
						let currentValue: number;

						if (this.mapVisualizationMode === 'households') {
							currentValue = props.totalHouseholds || 0;
						} else if (this.mapVisualizationMode === 'population') {
							currentValue = props.totalPopulation || 0;
						} else {
							currentValue = props.eaCount || 0;
						}

						const color = this.colorScaleService.getInterpolatedColor(
							currentValue,
							minValue,
							maxValue
						);

						return {
							fillColor: color,
							fillOpacity: 0.7,
							color: 'darkcyan',
							weight: 0.5,
							opacity: 1,
						};
					};
				} else {
					styleFunc = () => ({
						fillColor: '#F59E0B',
						fillOpacity: 0.3,
						color: '#D97706',
						weight: 1,
						opacity: 1,
					});
				}
				onEachFeatureFunc = this.onEachEAFeature.bind(this);
				break;
		}

		if (geojsonData) {
			console.log('Creating GeoJSON layer with data');
			this.currentGeoJSONLayer = L.geoJSON(geojsonData, {
				style: styleFunc,
				onEachFeature: onEachFeatureFunc,
			});
			this.currentGeoJSONLayer.addTo(this.map);
			this.map.fitBounds(this.currentGeoJSONLayer.getBounds(), {
				padding: [50, 50],
			});
			console.log('Layer rendered and bounds fitted');
		} else {
			console.warn('No GeoJSON data available for layer:', layer);
		}
	}
	private onEachAdminZoneFeature(feature: any, layer: L.Layer): void {
		const props = feature.properties;
		const zoneName = props.name || 'Administrative Zone';
		const zoneType = props.type || this.adminZone?.type || '';

		// Determine suffix based on type
		let suffix = '';
		if (zoneType.toLowerCase() === 'thromde') {
			suffix = ' Thromde';
		} else if (zoneType.toLowerCase() === 'gewog') {
			suffix = ' Gewog';
		}

		// Add permanent label with white text shadow
		const labelContent = `
			<div style="
				color: black;
				font-weight: 700;
				font-size: 11px;
				text-shadow: 
					-2px -2px 0 #fff,
					2px -2px 0 #fff,
					-2px 2px 0 #fff,
					2px 2px 0 #fff;
				text-align: center;
				white-space: nowrap;
			">
				${zoneName}${suffix}
			</div>
		`;

		// Get center of the polygon for label placement
		if (
			'getBounds' in layer &&
			typeof (layer as any).getBounds === 'function'
		) {
			const bounds = (layer as L.Polygon).getBounds();
			const center = bounds.getCenter();

			const label = L.tooltip({
				permanent: true,
				direction: 'center',
				className: 'admin-zone-label',
				opacity: 1,
			})
				.setLatLng(center)
				.setContent(labelContent);

			layer.bindTooltip(label);
		}

		// Add popup with details
		const popupContent = `
			<div class="p-2 min-w-[280px]">
				<h3 class="font-bold text-lg mb-3 text-slate-900">${zoneName}${suffix}</h3>
				<div class="space-y-0 text-sm mb-3">
					<!-- Type -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Type: </span>
						<span class="font-bold" style="color: #67A4CA">${zoneType}</span>
					</div>

					<!-- Code -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Code: </span>
						<span class="font-bold" style="color: #67A4CA">${props.areaCode || 'N/A'}</span>
					</div>

					<!-- Households -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Households: </span>
						<span class="font-bold" style="color: #67A4CA">${(
							props.totalHouseholds || 0
						).toLocaleString()}</span>
					</div>

				<!-- Population -->
				<div class="py-2 border-b border-slate-200">
					<span class="font-semibold text-slate-700">Population: </span>
					<span class="font-bold" style="color: #67A4CA">${(
						props.totalPopulation || 0
					).toLocaleString()}</span>
				</div>
			</div>
			<button 
				id="view-admin-zone-${props.id}"
				class="w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded transition shadow-sm mt-3"
			>
				View Details
			</button>
		</div>
	`;

		const popup = L.popup().setContent(popupContent);
		layer.bindPopup(popup);

		// Add click listener for the button after popup opens
		layer.on('popupopen', () => {
			const button = document.getElementById(`view-admin-zone-${props.id}`);
			if (button) {
				button.addEventListener('click', () => {
					this.navigateToSubAdminZone(props.id);
				});
			}
		});
	}
	private onEachSubAdminFeature(feature: any, layer: L.Layer): void {
		const props = feature.properties;
		const zoneName = props.name || 'Sub-Admin Zone';
		const zoneType = props.type || '';

		// Determine suffix based on type (prevent duplicates)
		const lowerName = zoneName.toLowerCase();
		let suffix = '';
		if (zoneType.toLowerCase() === 'chiwog') {
			if (!lowerName.includes('chiwog')) {
				suffix = ' Chiwog';
			}
		} else if (zoneType.toLowerCase() === 'lap') {
			if (!lowerName.includes('lap')) {
				suffix = ' Lap';
			}
		}

		// Add permanent label
		const labelContent = `
			<div style="
				color: black;
				font-weight: 700;
				font-size: 10px;
				text-shadow: 
					-2px -2px 0 #fff,
					2px -2px 0 #fff,
					-2px 2px 0 #fff,
					2px 2px 0 #fff;
				text-align: center;
				white-space: nowrap;
			">
				${zoneName}${suffix}
			</div>
		`;

		if (
			'getBounds' in layer &&
			typeof (layer as any).getBounds === 'function'
		) {
			const bounds = (layer as L.Polygon).getBounds();
			const center = bounds.getCenter();

			const label = L.tooltip({
				permanent: true,
				direction: 'center',
				className: 'subadmin-zone-label',
				opacity: 1,
			})
				.setLatLng(center)
				.setContent(labelContent);

			layer.bindTooltip(label);
		}

		// Add popup with dashboard-style layout
		const popupContent = `
			<div class="p-2 min-w-[280px]">
				<h3 class="font-bold text-lg mb-3 text-slate-900">${zoneName}${suffix}</h3>
				<div class="space-y-0 text-sm mb-3">
					<!-- Type -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Type: </span>
						<span class="font-bold" style="color: #67A4CA">${
							zoneType.charAt(0).toUpperCase() + zoneType.slice(1)
						}</span>
					</div>

					<!-- Population -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Population: </span>
						<span class="font-bold" style="color: #67A4CA">${(
							props.totalPopulation || 0
						).toLocaleString()}</span>
					</div>

					<!-- Households -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Households: </span>
						<span class="font-bold" style="color: #67A4CA">${(
							props.totalHouseholds || 0
						).toLocaleString()}</span>
					</div>

					<!-- Enumeration Areas -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Enumeration Areas: </span>
						<span class="font-bold" style="color: #67A4CA">${props.eaCount || 'N/A'}</span>
					</div>

					<!-- Area -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Area: </span>
						<span class="font-bold" style="color: #67A4CA">${
							props.areaSqKm ? props.areaSqKm.toFixed(2) : 'N/A'
						} km²</span>
					</div>
				</div>
				<button 
					id="view-subadmin-zone-${props.id}"
					class="w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded transition shadow-sm"
				>
					View Details
				</button>
			</div>
		`;

		const popup = L.popup().setContent(popupContent);
		layer.bindPopup(popup);

		// Add click listener for the button after popup opens
		layer.on('popupopen', () => {
			const button = document.getElementById(`view-subadmin-zone-${props.id}`);
			if (button) {
				button.addEventListener('click', () => {
					this.navigateToSubAdminZone(props.id);
				});
			}
		});
	}

	private onEachEAFeature(feature: any, layer: L.Layer): void {
		const props = feature.properties;
		const eaName = props.name || props.areaName || `EA ${props.eaCode || ''}`;

		// Add permanent label
		const labelContent = `
			<div style="
				color: black;
				font-weight: 700;
				font-size: 9px;
				text-shadow: 
					-2px -2px 0 #fff,
					2px -2px 0 #fff,
					-2px 2px 0 #fff,
					2px 2px 0 #fff;
				text-align: center;
				white-space: nowrap;
			">
				${eaName}
			</div>
		`;

		if (
			'getBounds' in layer &&
			typeof (layer as any).getBounds === 'function'
		) {
			const bounds = (layer as L.Polygon).getBounds();
			const center = bounds.getCenter();

			const label = L.tooltip({
				permanent: true,
				direction: 'center',
				className: 'ea-label',
				opacity: 1,
			})
				.setLatLng(center)
				.setContent(labelContent);

			layer.bindTooltip(label);
		}

		// Add popup
		const popupContent = `
			<div class="p-2 min-w-[280px]">
				<h3 class="font-bold text-lg mb-3 text-slate-900">${eaName}</h3>
				<div class="space-y-0 text-sm mb-3">
					<!-- Code -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Code: </span>
						<span class="font-bold" style="color: #67A4CA">${
							props.eaCode || props.areaCode || 'N/A'
						}</span>
					</div>

					<!-- Households -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Households: </span>
						<span class="font-bold" style="color: #67A4CA">${(
							props.totalHouseholds ||
							props.households ||
							0
						).toLocaleString()}</span>
					</div>

					<!-- Population -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Population: </span>
						<span class="font-bold" style="color: #67A4CA">${(
							props.totalPopulation ||
							props.population ||
							0
						).toLocaleString()}</span>
					</div>
				</div>
				<button 
					id="view-ea-zone-${props.id}"
					class="w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded transition shadow-sm"
				>
					View Details
				</button>
			</div>
		`;

		const popup = L.popup().setContent(popupContent);
		layer.bindPopup(popup);

		// Add click listener for the button after popup opens
		layer.on('popupopen', () => {
			const button = document.getElementById(`view-ea-zone-${props.id}`);
			if (button) {
				button.addEventListener('click', () => {
					this.navigateToEAZone(props.id);
				});
			}
		});
	}

	switchBaseMap(mapType: BaseMapType) {
		if (this.activeBaseMap === mapType) {
			return;
		}

		this.activeBaseMap = mapType;

		if (this.map) {
			this.applyBaseMap();
		}
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

	private attemptInitializeMap() {
		console.log('Attempting to initialize map...', {
			isViewReady: this.isViewReady,
			isDataReady: this.isDataReady,
			hasMap: !!this.map,
			hasBoundaries: !!this.subAdminBoundaries,
		});

		if (!this.isViewReady || !this.isDataReady) {
			console.log('Map initialization postponed - view or data not ready');
			return;
		}

		if (!this.map) {
			console.log('Initializing map for the first time...');
			this.initializeMap();
		} else {
			console.log('Map already exists, rendering layer...');
			this.renderLayer(this.activeLayer);
		}
	}

	private applyBaseMap() {
		if (!this.map) {
			return;
		}

		if (this.baseLayer) {
			this.map.removeLayer(this.baseLayer);
		}

		const config = this.baseMapDefinitions[this.activeBaseMap];
		this.baseLayer = L.tileLayer(config.url, config.options);
		this.baseLayer.addTo(this.map);
	}

	getLayerButtonClass(layer: LayerType): string {
		if (this.activeLayer === layer) {
			return 'bg-primary-600 text-white border border-primary-600 shadow-sm';
		}
		return 'bg-white text-slate-600 border border-slate-200 hover:border-primary-500 hover:text-primary-600';
	}

	getStatsTabClass(tab: 'overview' | 'subAdmin' | 'ea'): string {
		return this.activeStatsTab === tab
			? 'bg-primary-600 text-white shadow-sm border border-primary-600'
			: 'bg-white text-slate-600 border border-slate-200 hover:border-primary-500 hover:text-primary-600';
	}

	get currentStatsTab() {
		return (
			this.statsTabs.find((tab) => tab.value === this.activeStatsTab) ||
			this.statsTabs[0]
		);
	}

	getPercentage(partial: number, total: number, fractionDigits = 1): string {
		if (!total || total <= 0) {
			return (0).toFixed(fractionDigits);
		}

		const percentage = (partial / total) * 100;
		return percentage.toFixed(fractionDigits);
	}

	getPercentageValue(partial: number, total: number): number {
		if (!total || total <= 0) {
			return 0;
		}

		return Math.max(0, Math.min(100, (partial / total) * 100));
	}

	getPercentageNumber(partial: number, total: number): number {
		if (!total || total <= 0) {
			return 0;
		}

		return Math.round((partial / total) * 100);
	}

	trackByZoneId(index: number, item: { id?: number; areaCode?: string }) {
		return item?.id ?? item?.areaCode ?? index;
	}

	/**
	 * @deprecated Use getLegendGradient() and getLegendBreaks() for continuous gradient legend
	 */
	getLegendItems(): { color: string; label: string; value: number }[] {
		const { min, max } = this.getLegendMinMax();
		if (min === max || (min === 0 && max === 0)) {
			return [];
		}
		return this.colorScaleService.getLegendItems(min, max, 5);
	}

	/**
	 * Get CSS gradient string for continuous legend
	 */
	getLegendGradient(): string {
		const { min, max } = this.getLegendMinMax();
		if (min === max || (min === 0 && max === 0)) {
			return '';
		}
		return this.colorScaleService.getLegendGradient(min, max, 'vertical');
	}

	/**
	 * Get legend break values with labels for continuous gradient
	 */
	getLegendBreaks(): { value: number; label: string; position: number }[] {
		const { min, max } = this.getLegendMinMax();
		if (min === max || (min === 0 && max === 0)) {
			return [];
		}
		return this.colorScaleService.getLegendBreaks(min, max, 5);
	}

	/**
	 * Get min and max values for current visualization mode and active layer
	 */
	getLegendMinMax(): { min: number; max: number } {
		let geojsonData: any = null;

		// Get the appropriate GeoJSON data based on active layer
		switch (this.activeLayer) {
			case 'admin':
				geojsonData = this.subAdminBoundaries; // Admin zones use subAdmin boundaries
				break;
			case 'subAdmin':
				geojsonData = this.subAdminBoundaries;
				break;
			case 'ea':
				geojsonData = this.eaBoundaries;
				break;
		}

		if (!geojsonData?.features || geojsonData.features.length === 0) {
			return { min: 0, max: 0 };
		}

		const values = geojsonData.features
			.map((f: any) => {
				if (this.mapVisualizationMode === 'households') {
					return f.properties.totalHouseholds || 0;
				} else if (this.mapVisualizationMode === 'population') {
					return f.properties.totalPopulation || 0;
				} else {
					return f.properties.eaCount || 0;
				}
			})
			.filter((v: number) => v > 0); // Filter out zero values

		if (values.length === 0) {
			return { min: 0, max: 0 };
		}

		return {
			min: Math.min(...values),
			max: Math.max(...values),
		};
	}

	/**
	 * Get legend title based on visualization mode
	 */
	getLegendTitle(): string {
		if (this.mapVisualizationMode === 'households') {
			return 'Households';
		} else if (this.mapVisualizationMode === 'population') {
			return 'Population';
		} else {
			return 'Enumeration Areas';
		}
	}

	getBaseMapButtonClass(mapType: BaseMapType): string {
		return this.activeBaseMap === mapType
			? 'bg-primary-600 text-white border border-primary-600 shadow-sm'
			: 'bg-white text-slate-600 border border-slate-200 hover:border-primary-500 hover:text-primary-600';
	}

	/**
	 * Download household data as CSV
	 */
	downloadHouseholdData(): void {
		// Create array of household data from sub-admin zones
		const householdData = this.subAdminZones.map((zone) => ({
			name: zone.name,
			areaCode: zone.areaCode,
			type: zone.type,
			eaCount: zone.eaCount,
			totalHouseholds: zone.totalHouseholds,
			totalPopulation: zone.totalPopulation,
			totalMale: zone.totalMale,
			totalFemale: zone.totalFemale,
			areaSqKm: zone.areaSqKm,
		}));

		const csvContent = [
			['Name', 'Area Code', 'Type', 'EA Count', 'Total Households', 'Total Population', 'Total Male', 'Total Female', 'Area (sq km)'],
			...householdData.map((zone) => [
				zone.name,
				zone.areaCode,
				zone.type,
				zone.eaCount,
				zone.totalHouseholds,
				zone.totalPopulation,
				zone.totalMale,
				zone.totalFemale,
				zone.areaSqKm,
			]),
		]
			.map((row) => row.join(','))
			.join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${this.adminZone?.name || 'admin_zone'}_household_data_${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
		window.URL.revokeObjectURL(url);
		this.messageService.add({
			severity: 'success',
			summary: 'Download Complete',
			detail: 'Household data CSV downloaded successfully',
			life: 3000,
		});
	}

	/**
	 * Download Sub-Administrative Zones (Chiwog/Lap) as GeoJSON
	 */
	downloadSubAdminZonesGeojson(): void {
		if (!this.adminZoneId) return;
		this.locationDownloadService.downloadSAZsByAdministrativeZoneAsGeoJson(this.adminZoneId).subscribe({
			next: (geoJson) => {
				const dataStr = JSON.stringify(geoJson, null, 2);
				const blob = new Blob([dataStr], { type: 'application/json' });
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `${this.adminZone?.name || 'admin_zone'}_sub_admin_zones_${new Date().toISOString().split('T')[0]}.geojson`;
				link.click();
				window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Download Complete',
					detail: 'Sub-Administrative Zones GeoJSON downloaded successfully',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error downloading Sub-Administrative Zones GeoJSON:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Download Failed',
					detail: 'Failed to download Sub-Administrative Zones GeoJSON file',
					life: 3000,
				});
			},
		});
	}

	/**
	 * Download Sub-Administrative Zones (Chiwog/Lap) as KML
	 */
	downloadSubAdminZonesKml(): void {
		if (!this.adminZoneId) return;
		this.locationDownloadService.downloadSAZsByAdministrativeZoneAsKml(this.adminZoneId).subscribe({
			next: (kml) => {
				const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `${this.adminZone?.name || 'admin_zone'}_sub_admin_zones_${new Date().toISOString().split('T')[0]}.kml`;
				link.click();
				window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Download Complete',
					detail: 'Sub-Administrative Zones KML downloaded successfully',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error downloading Sub-Administrative Zones KML:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Download Failed',
					detail: 'Failed to download Sub-Administrative Zones KML file',
					life: 3000,
				});
			},
		});
	}

	/**
	 * Download Enumeration Areas as GeoJSON
	 */
	downloadEAZonesGeojson(): void {
		if (!this.adminZoneId) return;
		this.locationDownloadService.downloadEAsByAdministrativeZoneAsGeoJson(this.adminZoneId).subscribe({
			next: (geoJson) => {
				const dataStr = JSON.stringify(geoJson, null, 2);
				const blob = new Blob([dataStr], { type: 'application/json' });
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `${this.adminZone?.name || 'admin_zone'}_enumeration_areas_${new Date().toISOString().split('T')[0]}.geojson`;
				link.click();
				window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Download Complete',
					detail: 'Enumeration Areas GeoJSON downloaded successfully',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error downloading Enumeration Areas GeoJSON:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Download Failed',
					detail: 'Failed to download Enumeration Areas GeoJSON file',
					life: 3000,
				});
			},
		});
	}

	/**
	 * Download Enumeration Areas as KML
	 */
	downloadEAZonesKml(): void {
		if (!this.adminZoneId) return;
		this.locationDownloadService.downloadEAsByAdministrativeZoneAsKml(this.adminZoneId).subscribe({
			next: (kml) => {
				const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `${this.adminZone?.name || 'admin_zone'}_enumeration_areas_${new Date().toISOString().split('T')[0]}.kml`;
				link.click();
				window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Download Complete',
					detail: 'Enumeration Areas KML downloaded successfully',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error downloading Enumeration Areas KML:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Download Failed',
					detail: 'Failed to download Enumeration Areas KML file',
					life: 3000,
				});
			},
		});
	}
}
