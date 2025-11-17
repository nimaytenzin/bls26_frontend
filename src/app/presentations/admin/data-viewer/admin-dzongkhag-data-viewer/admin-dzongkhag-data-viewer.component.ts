import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	ViewChild,
	ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PrimeNgModules } from '../../../../primeng.modules';
import * as L from 'leaflet';
import {
	BasemapService,
	BasemapConfig,
} from '../../../../core/utility/basemap.service';
import { MapFeatureColorService } from '../../../../core/utility/map-feature-color.service';
import { DownloadService } from '../../../../core/utility/download.service';
import { DzongkhagAnnualStatsDataService } from '../../../../core/dataservice/dzongkhag-annual-stats/dzongkhag-annual-stats.dataservice';
import { AdminZoneAnnualStatsDataService } from '../../../../core/dataservice/admin-zone-annual-stats/admin-zone-annual-stats.dataservice';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';

@Component({
	selector: 'app-admin-dzongkhag-data-viewer',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './admin-dzongkhag-data-viewer.component.html',
	styleUrls: ['./admin-dzongkhag-data-viewer.component.css'],
})
export class AdminDzongkhagDataViewerComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	@ViewChild('mapContainer', { static: false })
	private mapContainerRef?: ElementRef<HTMLDivElement>;

	dzongkhagId!: number;
	dzongkhag: any = null;
	loading = true;
	error: string | null = null;

	// Data
	adminZones: any[] = [];
	adminZoneBoundaries: any = null;
	subAdminZones: any[] = [];
	subAdminBoundaries: any = null;
	dzongkhagBoundary: any = null;
	eaBoundaries: any = null;

	// Statistics
	stats = {
		totalHouseholds: 0,
		urbanHouseholds: 0,
		ruralHouseholds: 0,
		totalPopulation: 0,
		urbanPopulation: 0,
		ruralPopulation: 0,
		totalMale: 0,
		totalFemale: 0,
		totalAdminZones: 0,
		totalGewogs: 0,
		totalThromdes: 0,
		totalEnumerationAreas: 0,
		urbanEnumerationAreas: 0,
		ruralEnumerationAreas: 0,
		totalArea: 0,
	};

	// UI State
	activeMainTab: 'overview' | 'gewogs-thromdes' = 'overview';

	// Map visualization mode
	mapVisualizationMode: 'households' | 'population' | 'enumerationAreas' =
		'households';

	// Map
	private map?: L.Map;
	private baseLayer?: L.TileLayer;
	private currentGeoJSONLayer?: L.GeoJSON;
	selectedBasemapId = 'positron'; // Default basemap (Positron - No Labels)
	basemapCategories: Record<
		string,
		{ label: string; basemaps: BasemapConfig[] }
	> = {};

	// Lifecycle flags
	private isViewReady = false;
	private isDataReady = false;

	// Filter state
	selectedAdminZone: number | null = null;
	selectedSubAdminZone: number | null = null;
	selectedEA: number | null = null;
	adminZoneOptions: { label: string; value: number }[] = [];
	subAdminZoneOptions: { label: string; value: number }[] = [];
	eaOptions: { label: string; value: number }[] = [];

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private basemapService: BasemapService,
		private colorScaleService: MapFeatureColorService,
		private downloadService: DownloadService,
		private adminZoneAnnualStatsDataService: AdminZoneAnnualStatsDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private enumerationAreaService: EnumerationAreaDataService
	) {}

	ngOnInit() {
		this.dzongkhagId = Number(this.route.snapshot.paramMap.get('id'));

		// Initialize basemap categories from service
		this.basemapCategories = this.basemapService.getBasemapCategories();

		this.loadData();
	}

	ngAfterViewInit() {
		this.isViewReady = true;
		// Use setTimeout to ensure DOM is ready after *ngIf renders
		setTimeout(() => {
			this.attemptInitializeMap();
		}, 0);
	}

	ngOnDestroy() {
		if (this.map) {
			this.map.remove();
		}
	}

	/**
	 * Load all dzongkhag data
	 */
	loadData() {
		this.loading = true;
		this.error = null;

		// Only load admin zone stats GeoJSON - contains boundaries and statistics
		this.adminZoneAnnualStatsDataService
			.getAllCurrentAdminZoneStatsGeojsonByDzongkhag(this.dzongkhagId)
			.subscribe({
			next: (data) => {
					console.log('Loaded admin zone stats GeoJSON:', data);

					// Extract admin zones and boundaries from combined GeoJSON stats
					if (data && data.features) {
						// Extract boundaries as GeoJSON
						this.adminZoneBoundaries = data;
						// Extract admin zone data from features
						this.adminZones = data.features.map((feature: any) => ({
							id: feature.properties.id,
							name: feature.properties.name,
							nameDzo: feature.properties.nameDzo,
							dzongkhagId: this.dzongkhagId,
							type: feature.properties.type,
							areaCode: feature.properties.areaCode,
							areaSqKm: feature.properties.areaSqKm,
							sazCount: feature.properties.sazCount,
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

						// Calculate statistics from the loaded data
				this.calculateStatistics();

						// Populate admin zone filter options
						this.populateAdminZoneOptions();
					}

					this.loading = false;
					this.isDataReady = true;

					// Use setTimeout to ensure DOM is updated after *ngIf="!loading"
					setTimeout(() => {
						this.attemptInitializeMap();
					}, 0);
			},
			error: (error) => {
				console.error('Error loading dzongkhag data:', error);
				this.error = 'Failed to load dzongkhag data. Please try again.';
				this.loading = false;
			},
		});
	}

	/**
	 * Calculate statistics from loaded admin zones
	 */
	calculateStatistics() {
		this.stats = {
			totalHouseholds: 0,
			urbanHouseholds: 0,
			ruralHouseholds: 0,
			totalPopulation: 0,
			urbanPopulation: 0,
			ruralPopulation: 0,
			totalMale: 0,
			totalFemale: 0,
			totalAdminZones: this.adminZones.length,
			totalGewogs: 0,
			totalThromdes: 0,
			totalEnumerationAreas: 0,
			urbanEnumerationAreas: 0,
			ruralEnumerationAreas: 0,
			totalArea: 0,
		};

		this.adminZones.forEach((zone) => {
			const isUrban = zone.type === 'Thromde';

			// Households
			this.stats.totalHouseholds += zone.totalHouseholds || 0;
			if (isUrban) {
				this.stats.urbanHouseholds += zone.totalHouseholds || 0;
			} else {
				this.stats.ruralHouseholds += zone.totalHouseholds || 0;
			}

			// Population
			this.stats.totalPopulation += zone.totalPopulation || 0;
			if (isUrban) {
				this.stats.urbanPopulation += zone.totalPopulation || 0;
			} else {
				this.stats.ruralPopulation += zone.totalPopulation || 0;
			}

			// Gender
			this.stats.totalMale += zone.totalMale || 0;
			this.stats.totalFemale += zone.totalFemale || 0;

			// Enumeration Areas
			this.stats.totalEnumerationAreas += zone.eaCount || 0;
			if (isUrban) {
				this.stats.urbanEnumerationAreas += zone.eaCount || 0;
			} else {
				this.stats.ruralEnumerationAreas += zone.eaCount || 0;
			}

			// Admin zone types
			if (isUrban) {
				this.stats.totalThromdes += 1;
			} else {
				this.stats.totalGewogs += 1;
			}

			// Area
			this.stats.totalArea += zone.areaSqKm || 0;
		});
	}

	/**
	 * Download household data as CSV
	 */
	downloadHouseholdData() {
		// Create array of household data from admin zones
		const householdData = this.adminZones.map((zone) => ({
				name: zone.name,
			nameDzo: zone.nameDzo,
				type: zone.type,
			areaCode: zone.areaCode,
			totalHouseholds: zone.totalHouseholds,
			totalPopulation: zone.totalPopulation,
			totalMale: zone.totalMale,
			totalFemale: zone.totalFemale,
			eaCount: zone.eaCount,
			areaSqKm: zone.areaSqKm,
			populationDensity: zone.populationDensity,
			averageHouseholdSize: zone.averageHouseholdSize,
			genderRatio: zone.genderRatio,
		}));

		const filename = `${
			this.dzongkhag?.name || 'dzongkhag'
		}_household_data.csv`;
		this.downloadService.downloadArrayAsCSV(householdData, filename);
	}

	/**
	 * Download GeoJSON files
	 */
	downloadDzongkhagGeojson() {
		if (!this.dzongkhagBoundary) return;
		this.downloadService.downloadGeoJSON({
			data: this.dzongkhagBoundary,
			filename: `${this.dzongkhag?.name || 'dzongkhag'}_boundary.geojson`,
		});
	}

	downloadAdminZonesGeojson() {
		if (!this.adminZoneBoundaries) return;
		this.downloadService.downloadGeoJSON({
			data: this.adminZoneBoundaries,
			filename: `${this.dzongkhag?.name || 'dzongkhag'}_admin_zones.geojson`,
		});
	}

	downloadSubAdminZonesGeojson() {
		if (!this.subAdminBoundaries) return;
		this.downloadService.downloadGeoJSON({
			data: this.subAdminBoundaries,
			filename: `${
				this.dzongkhag?.name || 'dzongkhag'
			}_sub_admin_zones.geojson`,
		});
	}

	downloadEAZonesGeojson() {
		if (!this.eaBoundaries) return;
		this.downloadService.downloadGeoJSON({
			data: this.eaBoundaries,
			filename: `${
				this.dzongkhag?.name || 'dzongkhag'
			}_enumeration_areas.geojson`,
		});
	}

	/**
	 * Download KML files
	 */
	downloadDzongkhagKml() {
		if (!this.dzongkhagBoundary) return;
		this.downloadService.downloadKML({
			data: this.dzongkhagBoundary,
			filename: `${this.dzongkhag?.name || 'dzongkhag'}_boundary.kml`,
			layerName: 'Dzongkhag Boundary',
		});
	}

	downloadAdminZonesKml() {
		if (!this.adminZoneBoundaries) return;
		this.downloadService.downloadKML({
			data: this.adminZoneBoundaries,
			filename: `${this.dzongkhag?.name || 'dzongkhag'}_gewog_thromde.kml`,
			layerName: 'Gewog/Thromde',
		});
	}

	downloadSubAdminZonesKml() {
		if (!this.subAdminBoundaries) return;
		this.downloadService.downloadKML({
			data: this.subAdminBoundaries,
			filename: `${this.dzongkhag?.name || 'dzongkhag'}_chiwog_lap.kml`,
			layerName: 'Chiwog/Lap',
		});
	}

	downloadEAZonesKml() {
		if (!this.eaBoundaries) return;
		this.downloadService.downloadKML({
			data: this.eaBoundaries,
			filename: `${this.dzongkhag?.name || 'dzongkhag'}_enumeration_areas.kml`,
			layerName: 'Enumeration Areas',
		});
	}

	/**
	 * Download admin zones as CSV
	 */
	downloadAdminZonesCSV() {
		if (!this.adminZoneBoundaries) return;
		this.downloadService.downloadCSV({
			data: this.adminZoneBoundaries,
			filename: `${this.dzongkhag?.name || 'dzongkhag'}_admin_zones.csv`,
			excludeFields: ['id'], // Exclude internal IDs if needed
			includeGeometry: false,
		});
	}

	/**
	 * Download all admin zone data formats at once
	 */
	downloadAllAdminZoneFormats() {
		if (!this.adminZoneBoundaries) return;
		this.downloadService.downloadAllFormats(
			this.adminZoneBoundaries,
			`${this.dzongkhag?.name || 'dzongkhag'}_admin_zones`,
			{
				layerName: 'Gewog/Thromde',
				excludeCSVFields: ['id'],
				includeGeometryInCSV: false,
			}
		);
	}

	/**
	 * Download Sampling Frame Report as PDF
	 */
	downloadSamplingFrameReport() {
		// For now, we'll create a simple HTML report and open it in a new window
	}

	/**
	 * Initialize Leaflet map
	 */
	initializeMap() {
		if (this.map) {
			this.map.remove();
		}

		const container = this.mapContainerRef?.nativeElement;

		if (!container) {
			console.warn('Map container not found');
			return;
		}

		console.log('Initializing map...');
		try {
			// Use basemap service to create tile layer
			this.baseLayer =
				this.basemapService.createTileLayer(this.selectedBasemapId) ||
				undefined;

			this.map = L.map(container, {
				center: [27.5, 90.5],
				zoom: 8,
				layers: this.baseLayer ? [this.baseLayer] : [],
				zoomControl: false,
				attributionControl: false,
			});
			console.log('Map initialized successfully');

			// Render the admin zones layer if available
			if (this.adminZoneBoundaries) {
				this.renderAdminZonesLayer();
			}
		} catch (error) {
			console.error('Error initializing map:', error);
		}
	}
	/**
	 * Switch basemap using basemap service
	 */
	switchBasemap(): void {
		if (!this.map || !this.basemapService.hasBasemap(this.selectedBasemapId)) {
			console.error(`Basemap ${this.selectedBasemapId} not found`);
			return;
		}

		// Remove current basemap layer
		if (this.baseLayer) {
			this.map.removeLayer(this.baseLayer);
		}

		// Create and add new basemap layer
		this.baseLayer =
			this.basemapService.createTileLayer(this.selectedBasemapId) || undefined;
		if (this.baseLayer) {
			this.baseLayer.addTo(this.map);
		}
	}

	/**
	 * Render admin zones GeoJSON layer on map
	 */
	renderAdminZonesLayer() {
		if (!this.map) return;

		// Remove current layer
		if (this.currentGeoJSONLayer) {
			this.map.removeLayer(this.currentGeoJSONLayer);
		}

		if (!this.adminZoneBoundaries) return;

		// Debug: Log admin zones data
		console.log('Admin zones count:', this.adminZones.length);
		console.log('Visualization mode:', this.mapVisualizationMode);
		console.log('First 3 zones sample:', this.adminZones.slice(0, 3));

		// Get values based on visualization mode - include ALL values including zeros
		const values = this.adminZones.map((zone) => {
			if (this.mapVisualizationMode === 'households') {
				return zone.totalHouseholds || 0;
			} else if (this.mapVisualizationMode === 'population') {
				return zone.totalPopulation || 0;
			} else {
				return zone.eaCount || 0;
			}
		});

		// Debug: Log extracted values
		console.log('Extracted values (including zeros):', values);
		console.log('Values count:', values.length);

		// Handle case where no data exists
		if (values.length === 0) {
			console.warn(
				'No data for visualization mode:',
				this.mapVisualizationMode
			);
			return;
		}

		let minValue = Math.min(...values);
		let maxValue = Math.max(...values);

		// Handle edge case where all values are the same
		if (minValue === maxValue) {
			// Create a small range around the value for color scaling
			minValue = Math.max(0, minValue - 1);
			maxValue = maxValue + 1;
			console.log(
				`Adjusted range (all values equal) for ${this.mapVisualizationMode}:`,
				minValue,
				'-',
				maxValue
			);
		} else {
			console.log(
				`Color scale range for ${this.mapVisualizationMode}:`,
				minValue,
				'-',
				maxValue
			);
		}

		const style = (feature: any) => {
			const props = feature.properties;

			// Get current value based on visualization mode
			let currentValue: number;
			if (this.mapVisualizationMode === 'households') {
				currentValue = props.totalHouseholds || 0;
			} else if (this.mapVisualizationMode === 'population') {
				currentValue = props.totalPopulation || 0;
			} else {
				currentValue = props.eaCount || 0;
			}

			// Get color based on value using color scale service
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

		const onEachFeature = (feature: any, leafletLayer: L.Layer) => {
			const props = feature.properties;

			// Add permanent label with white text shadow (dashboard style)
			const zoneName = props.name || 'Administrative Zone';
			const zoneType = props.type || '';

			// Only add suffix if not already present in the name
			let displayName = zoneName;
			const lowerName = zoneName.toLowerCase();

			if (
				zoneType.toLowerCase() === 'thromde' &&
				!lowerName.includes('thromde')
			) {
				displayName = zoneName + ' Thromde';
			} else if (
				zoneType.toLowerCase() === 'gewog' &&
				!lowerName.includes('gewog')
			) {
				displayName = zoneName + ' Gewog';
			}

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
					${displayName}
  </div>
			`;

			// Get center of the polygon for label placement
			if (
				'getBounds' in leafletLayer &&
				typeof (leafletLayer as any).getBounds === 'function'
			) {
				const bounds = (leafletLayer as L.Polygon).getBounds();
				const center = bounds.getCenter();

				const label = L.tooltip({
					permanent: true,
					direction: 'center',
					className: 'admin-zone-label',
					opacity: 1,
				})
					.setLatLng(center)
					.setContent(labelContent);

				leafletLayer.bindTooltip(label);
			}

			// Create popup content (dashboard style)
			const popupContent = `
				<div class="p-2 min-w-[280px]">
					<h3 class="font-bold text-lg mb-3 text-slate-900">${displayName}</h3>
					<div class="space-y-0 text-sm mb-3">
						<!-- Population -->
						<div class="py-2 border-b border-slate-200">
							<span class="font-semibold text-slate-700">Population: </span>
							<span class="font-bold" style="color: #67A4CA">${
								props.totalPopulation?.toLocaleString() || '0'
							}</span>
      </div>

						<!-- Households -->
						<div class="py-2 border-b border-slate-200">
							<span class="font-semibold text-slate-700">Households: </span>
							<span class="font-bold" style="color: #67A4CA">${
								props.totalHouseholds?.toLocaleString() || '0'
							}</span>
      </div>

						<!-- Enumeration Areas -->
						<div class="py-2 border-b border-slate-200">
							<span class="font-semibold text-slate-700">Enumeration Areas: </span>
							<span class="font-bold" style="color: #67A4CA">${props.eaCount || 'N/A'}</span>
      </div>
      </div>
					<button 
						id="view-admin-zone-${props.id}" 
						class="w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded transition shadow-sm"
					>
						View Details
					</button>
      </div>
			`;

			const popup = L.popup().setContent(popupContent);
			leafletLayer.bindPopup(popup);

			// Add click listener for the button after popup opens
			leafletLayer.on('popupopen', () => {
				const button = document.getElementById(`view-admin-zone-${props.id}`);
				if (button) {
					button.addEventListener('click', () => {
						this.navigateToAdminZone(props.id);
					});
				}
			});

			// Hover effects
			leafletLayer.on({
				mouseover: (e) => {
					const target = e.target as L.Path;
					target.setStyle({
						weight: 3,
						fillOpacity: 0.9,
					});
				},
				mouseout: (e) => {
					if (this.currentGeoJSONLayer) {
						this.currentGeoJSONLayer.resetStyle(e.target);
					}
				},
			});
		};

		this.currentGeoJSONLayer = L.geoJSON(this.adminZoneBoundaries, {
			style: style,
			onEachFeature: onEachFeature,
		});
		this.currentGeoJSONLayer.addTo(this.map);
		this.map.fitBounds(this.currentGeoJSONLayer.getBounds(), {
			padding: [20, 20],
		});
	}

	/**
	 * Go back to previous page
	 */
	goBack() {
		this.router.navigate(['/admin/master/dzongkhags']);
	}

	/**
	 * Get legend items for map based on visualization mode
	 * @deprecated Use getLegendGradient() and getLegendBreaks() for continuous gradient legend
	 */
	getLegendItems(): { color: string; label: string; value: number }[] {
		if (!this.adminZones || this.adminZones.length === 0) {
			return [];
		}

		const { min, max } = this.getLegendMinMax();
		if (min === max || min === 0 && max === 0) {
			return [];
		}

		return this.colorScaleService.getLegendItems(min, max, 5);
	}

	/**
	 * Get CSS gradient string for continuous color scale legend
	 */
	getLegendGradient(): string {
		const { min, max } = this.getLegendMinMax();
		if (min === max || min === 0 && max === 0) {
			return '';
		}
		return this.colorScaleService.getLegendGradient(min, max, 'vertical');
	}

	/**
	 * Get legend break values with labels for continuous gradient
	 */
	getLegendBreaks(): { value: number; label: string; position: number }[] {
		const { min, max } = this.getLegendMinMax();
		if (min === max || min === 0 && max === 0) {
			return [];
		}
		return this.colorScaleService.getLegendBreaks(min, max, 5);
	}

	/**
	 * Get min and max values for current visualization mode
	 */
	getLegendMinMax(): { min: number; max: number } {
		if (!this.adminZones || this.adminZones.length === 0) {
			return { min: 0, max: 0 };
		}

		// Get values based on visualization mode
		const values = this.adminZones.map((zone) => {
			if (this.mapVisualizationMode === 'households') {
				return zone.totalHouseholds || 0;
			} else if (this.mapVisualizationMode === 'population') {
				return zone.totalPopulation || 0;
			} else {
				return zone.eaCount || 0;
			}
		});

		if (values.length === 0) {
			return { min: 0, max: 0 };
		}

		let minValue = Math.min(...values);
		let maxValue = Math.max(...values);

		// Handle edge case where all values are the same
		if (minValue === maxValue) {
			// Create a small range around the value for color scaling
			minValue = Math.max(0, minValue - 1);
			maxValue = maxValue + 1;
		}

		return { min: minValue, max: maxValue };
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

	/**
	 * Switch map visualization mode and reload boundaries
	 */
	switchVisualizationMode(
		mode: 'households' | 'population' | 'enumerationAreas'
	): void {
		this.mapVisualizationMode = mode;
		// Reload boundaries to update colors
		if (this.map && this.adminZoneBoundaries) {
			this.renderAdminZonesLayer();
		}
	}

	/**
	 * Navigate to administrative zone data viewer
	 */
	navigateToAdminZone(adminZoneId: number) {
		this.router.navigate(['/admin/data-view/admzone', adminZoneId]);
	}

	/**
	 * Navigate to sub-administrative zone data viewer
	 */
	navigateToSubAdminZone(subAdminZoneId: number) {
		this.router.navigate(['/admin/data-view/sub-admzone', subAdminZoneId]);
	}

	/**
	 * Navigate to enumeration area data viewer
	 */
	navigateToEAZone(eaZoneId: number) {
		this.router.navigate(['/admin/data-view/eazone', eaZoneId]);
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

	trackByZoneId(index: number, item: { id?: number; areaCode?: string }) {
		return item?.id ?? item?.areaCode ?? index;
	}

	/**
	 * Get percentage of zone value relative to maximum in the dataset
	 */
	getZonePercentage(value: number, field: 'population' | 'households' | 'ea'): number {
		if (!this.adminZones || this.adminZones.length === 0 || !value) {
			return 0;
		}

		const maxValue = Math.max(
			...this.adminZones.map((zone) => {
				if (field === 'population') {
					return zone.totalPopulation || 0;
				} else if (field === 'households') {
					return zone.totalHouseholds || 0;
				} else {
					return zone.eaCount || 0;
				}
			})
		);

		if (maxValue === 0) return 0;
		return (value / maxValue) * 100;
	}

	/**
	 * Get treemap data for visualization
	 */
	getTreemapData(): Array<{ zone: any; size: number; percentage: number }> {
		if (!this.adminZones || this.adminZones.length === 0) {
			return [];
		}

		// Use population as the size metric for treemap
		const total = this.adminZones.reduce(
			(sum, zone) => sum + (zone.totalPopulation || 0),
			0
		);

		return this.adminZones
			.map((zone) => ({
				zone,
				size: zone.totalPopulation || 0,
				percentage: total > 0 ? ((zone.totalPopulation || 0) / total) * 100 : 0,
			}))
			.filter((item) => item.size > 0)
			.sort((a, b) => b.size - a.size);
	}

	/**
	 * Get treemap cell style
	 */
	getTreemapCellStyle(item: { zone: any; size: number; percentage: number }): any {
		const treemapData = this.getTreemapData();
		if (treemapData.length === 0) {
			return {};
		}

		const maxSize = Math.max(...treemapData.map((d) => d.size));
		const minSize = Math.min(...treemapData.map((d) => d.size));

		// Use color scale service for consistent coloring
		const color = this.colorScaleService.getInterpolatedColor(
			item.size,
			minSize,
			maxSize
		);

		return {
			'background-color': color,
			opacity: 0.85,
		};
	}

	/**
	 * Calculate treemap position using simple row-based layout
	 */
	getTreemapPosition(item: { zone: any; size: number; percentage: number }): {
		x: number;
		y: number;
		width: number;
		height: number;
	} {
		const data = this.getTreemapData();
		if (data.length === 0) {
			return { x: 0, y: 0, width: 0, height: 0 };
		}

		const total = data.reduce((sum, d) => sum + d.size, 0);
		const itemIndex = data.findIndex((d) => d.zone.id === item.zone.id);

		if (itemIndex === -1) {
			return { x: 0, y: 0, width: 0, height: 0 };
		}

		// Simple row-based layout: calculate which row and position
		const rows = this.calculateTreemapRows(data);
		let currentY = 0;

		for (const row of rows) {
			const rowHeight = (row.totalSize / total) * 100;
			const rowIndex = row.items.findIndex((d) => d.zone.id === item.zone.id);

			if (rowIndex !== -1) {
				let currentX = 0;
				for (let i = 0; i < rowIndex; i++) {
					currentX += (row.items[i].size / row.totalSize) * 100;
				}
				const cellWidth = (item.size / row.totalSize) * 100;

				return {
					x: currentX,
					y: currentY,
					width: cellWidth,
					height: rowHeight,
				};
			}

			currentY += rowHeight;
		}

		return { x: 0, y: 0, width: 0, height: 0 };
	}

	/**
	 * Calculate treemap rows using simplified squarified algorithm
	 */
	private calculateTreemapRows(
		data: Array<{ zone: any; size: number; percentage: number }>
	): Array<{ items: typeof data; totalSize: number }> {
		if (data.length === 0) {
			return [];
		}

		const rows: Array<{ items: typeof data; totalSize: number }> = [];
		const total = data.reduce((sum, d) => sum + d.size, 0);
		let currentRow: typeof data = [];
		let currentRowSize = 0;

		// Simple squarified algorithm: try to make cells as square as possible
		for (const item of data) {
			const testRow = [...currentRow, item];
			const testRowSize = currentRowSize + item.size;
			const rowHeight = (testRowSize / total) * 100;

			// Calculate worst aspect ratio for this row
			let worstAspect = 0;
			for (const rowItem of testRow) {
				const cellWidth = (rowItem.size / testRowSize) * 100;
				const aspect = Math.max(cellWidth / rowHeight, rowHeight / cellWidth);
				worstAspect = Math.max(worstAspect, aspect);
			}

			// Calculate worst aspect ratio for current row
			let currentWorstAspect = Infinity;
			if (currentRow.length > 0) {
				const currentRowHeight = (currentRowSize / total) * 100;
				for (const rowItem of currentRow) {
					const cellWidth = (rowItem.size / currentRowSize) * 100;
					const aspect = Math.max(cellWidth / currentRowHeight, currentRowHeight / cellWidth);
					currentWorstAspect = Math.max(currentWorstAspect, aspect);
				}
			}

			// If adding this item improves or maintains aspect ratio, add it to current row
			if (currentRow.length === 0 || worstAspect <= currentWorstAspect) {
				currentRow = testRow;
				currentRowSize = testRowSize;
			} else {
				// Start a new row
				rows.push({ items: currentRow, totalSize: currentRowSize });
				currentRow = [item];
				currentRowSize = item.size;
			}
		}

		// Add the last row
		if (currentRow.length > 0) {
			rows.push({ items: currentRow, totalSize: currentRowSize });
		}

		return rows;
	}

	private attemptInitializeMap() {
		if (!this.isViewReady || !this.isDataReady) {
			return;
		}

		if (!this.map) {
			this.initializeMap();
		} else {
			this.renderAdminZonesLayer();
		}
	}

	// ==================== Filter Methods ====================

	/**
	 * Populate admin zone options from current dzongkhag's zones
	 */
	populateAdminZoneOptions(): void {
		this.adminZoneOptions = this.adminZones.map((zone) => ({
			label: zone.name,
			value: zone.id,
		}));
	}

	/**
	 * Handle admin zone selection change
	 */
	onAdminZoneChange(): void {
		// Reset dependent dropdowns
		this.selectedSubAdminZone = null;
		this.selectedEA = null;
		this.subAdminZoneOptions = [];
		this.eaOptions = [];

		// Load sub admin zones for selected admin zone
		if (this.selectedAdminZone) {
			this.subAdministrativeZoneService
				.findSubAdministrativeZonesByAdministrativeZone(this.selectedAdminZone)
				.subscribe({
					next: (subAdminZones) => {
						this.subAdminZoneOptions = subAdminZones.map((zone) => ({
							label: zone.name,
							value: zone.id,
						}));
					},
					error: (error) => {
						console.error('Error loading sub-administrative zones:', error);
					},
				});
		}
	}

	/**
	 * Handle sub admin zone selection change
	 */
	onSubAdminZoneChange(): void {
		// Reset dependent dropdown
		this.selectedEA = null;
		this.eaOptions = [];

		// Load EAs for selected sub admin zone
		if (this.selectedSubAdminZone) {
			this.enumerationAreaService
				.findEnumerationAreasBySubAdministrativeZone(this.selectedSubAdminZone)
				.subscribe({
					next: (eas) => {
						this.eaOptions = eas.map((ea) => ({
							label: ea.name,
							value: ea.id,
						}));
					},
					error: (error) => {
						console.error('Error loading enumeration areas:', error);
					},
				});
		}
	}

	/**
	 * Submit filter and navigate to appropriate data viewer
	 */
	submitFilter(): void {
		if (this.selectedEA) {
			// Navigate to EA data viewer
			this.router.navigate(['/admin/data-view/eazone', this.selectedEA]);
		} else if (this.selectedSubAdminZone) {
			// Navigate to sub admin zone data viewer
			this.router.navigate([
				'/admin/data-view/sub-admzone',
				this.selectedSubAdminZone,
			]);
		} else if (this.selectedAdminZone) {
			// Navigate to admin zone data viewer
			this.router.navigate([
				'/admin/data-view/admzone',
				this.selectedAdminZone,
			]);
		}
	}
}