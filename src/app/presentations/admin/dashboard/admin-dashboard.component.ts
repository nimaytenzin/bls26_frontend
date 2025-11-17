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
import { Router } from '@angular/router';
import { PrimeNgModules } from '../../../primeng.modules';
import { DzongkhagAnnualStatsDataService } from '../../../core/dataservice/dzongkhag-annual-stats/dzongkhag-annual-stats.dataservice';
import {
	DzongkhagStatsGeoJson,
	DzongkhagStatsFeature,
	NationalSummary,
} from '../../../core/dataservice/dzongkhag-annual-stats/dzongkhag-annual-stats.dto';
import { MapFeatureColorService } from '../../../core/utility/map-feature-color.service';
import { BasemapService } from '../../../core/utility/basemap.service';
import { AdministrativeZoneDataService } from '../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { SubAdministrativeZoneDataService } from '../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { EnumerationAreaDataService } from '../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import * as L from 'leaflet';
import { BasemapConfig } from '../../../core/utility/basemap.service';

interface DzongkhagStats {
	dzongkhagId: number;
	dzongkhagName: string;
	dzongkhagCode: string;
	totalAdminZones: number;
	totalSubAdminZones: number;
	totalEnumerationAreas: number;
	urbanEnumerationAreas: number;
	ruralEnumerationAreas: number;
	totalHouseholds: number;
	totalPopulation: number;
	totalMale: number;
	totalFemale: number;
	urbanHouseholds: number;
	ruralHouseholds: number;
	urbanPopulation: number;
	ruralPopulation: number;
	urbanizationRate: number;
	populationDensity: number;
	averageHouseholdSize: number;
}

@Component({
	selector: 'app-admin-dashboard',
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './admin-dashboard.component.html',
	styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	@ViewChild('mapContainer', { static: false })
	private mapContainerRef?: ElementRef<HTMLDivElement>;

	geoJsonData: DzongkhagStatsGeoJson | null = null;
	nationalSummary: NationalSummary | null = null;
	dzongkhagFeatures: DzongkhagStatsFeature[] = [];
	dzongkhagStats: DzongkhagStats[] = [];
	loading = true;
	errorMessage: string | null = null;

	// Summary statistics
	stats = {
		totalDzongkhags: 0,
		totalAdminZones: 0,
		totalSubAdminZones: 0,
		totalEnumerationAreas: 0,
		urbanEnumerationAreas: 0,
		ruralEnumerationAreas: 0,
		totalHouseholds: 0,
		totalPopulation: 0,
		totalMale: 0,
		totalFemale: 0,
		urbanHouseholds: 0,
		ruralHouseholds: 0,
		urbanPopulation: 0,
		ruralPopulation: 0,
	};

	// Active tab for viewing mode
	activeMainTab: 'insights' | 'list' = 'insights';

	// Map visualization mode
	mapVisualizationMode: 'households' | 'population' | 'enumerationAreas' =
		'households';

	// Map
	private map?: L.Map;
	private baseLayer?: L.TileLayer;
	private currentGeoJSONLayer?: L.GeoJSON;
	selectedBasemapId = 'positron'; // Default basemap (Positron - No Labels)
	showDzongkhagBoundaries = true;
	basemapCategories: Record<
		string,
		{ label: string; basemaps: BasemapConfig[] }
	> = {};

	// Filter properties
	selectedDzongkhag: number | null = null;
	selectedAdminZone: number | null = null;
	selectedSubAdminZone: number | null = null;
	selectedEA: number | null = null;

	// Dropdown options (to be populated from API)
	dzongkhagOptions: { label: string; value: number }[] = [];
	adminZoneOptions: { label: string; value: number }[] = [];
	subAdminZoneOptions: { label: string; value: number }[] = [];
	eaOptions: { label: string; value: number }[] = [];

	constructor(
		private dzongkhagStatsService: DzongkhagAnnualStatsDataService,
		private router: Router,
		private colorScaleService: MapFeatureColorService,
		private basemapService: BasemapService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private enumerationAreaService: EnumerationAreaDataService
	) {}

	ngOnInit() {
		// Initialize basemap categories from service
		this.basemapCategories = this.basemapService.getBasemapCategories();

		this.loadDzongkhagStatistics();
	}

	ngAfterViewInit(): void {
		// Initialize map after view is ready
		setTimeout(() => {
			this.initializeMap();
		}, 100);
	}

	ngOnDestroy(): void {
		if (this.map) {
			this.map.remove();
		}
	}

	/**
	 * Initialize Leaflet map
	 */
	private initializeMap(): void {
		if (!this.mapContainerRef?.nativeElement) {
			console.warn('Map container not available, will retry...');
			// Retry after a short delay
			setTimeout(() => this.initializeMap(), 200);
			return;
		}

		// Check if map is already initialized
		if (this.map) {
			console.log('Map already initialized');
			return;
		}

		console.log('Initializing map...');
		try {
			// Use basemap service to create tile layer
			this.baseLayer =
				this.basemapService.createTileLayer(this.selectedBasemapId) ||
				undefined;

			this.map = L.map(this.mapContainerRef.nativeElement, {
				center: [27.5, 90.5],
				zoom: 2,
				layers: this.baseLayer ? [this.baseLayer] : [],
				zoomControl: false,
			});

			console.log('Map initialized successfully');

			// Load boundaries on map if map is already initialized
			if (this.map && this.geoJsonData) {
				this.loadDzongkhagBoundaries();
			}
		} catch (error) {
			console.error('Error initializing map:', error);
		}
	}

	/**
	 * Load dzongkhag statistics from API
	 */
	loadDzongkhagStatistics(): void {
		this.loading = true;
		this.errorMessage = null;

		this.dzongkhagStatsService.getAllDzongkhagsCurrentStatsGeoJson().subscribe({
			next: (data) => {
				this.geoJsonData = data;
				this.nationalSummary = data.metadata.nationalSummary;
				this.dzongkhagFeatures = data.features;
				this.processStatistics();
				this.loading = false;

				// Load boundaries on map if map is already initialized
				if (this.map) {
					this.loadDzongkhagBoundaries();
				}
			},
			error: (error) => {
				console.error('Error loading dzongkhag statistics:', error);
				this.errorMessage =
					'Failed to load dzongkhag statistics. Please try again.';
				this.loading = false;
			},
		});
	}

	/**
	 * Process statistics from features
	 */
	private processStatistics(): void {
		if (!this.dzongkhagFeatures.length) return;

		this.dzongkhagStats = [];

		this.dzongkhagFeatures.forEach((feature) => {
			const props = feature.properties;
			if (props.hasData) {
				this.dzongkhagStats.push({
					dzongkhagId: props.id,
					dzongkhagName: props.name,
					dzongkhagCode: props.areaCode,
					totalAdminZones: props.azCount,
					totalSubAdminZones: props.sazCount,
					totalEnumerationAreas: props.eaCount,
					urbanEnumerationAreas: props.urbanEACount || 0,
					ruralEnumerationAreas: props.ruralEACount || 0,
					totalHouseholds: props.totalHouseholds,
					totalPopulation: props.totalPopulation,
					totalMale: props.totalMale,
					totalFemale: props.totalFemale,
					urbanHouseholds: props.urbanHouseholdCount,
					ruralHouseholds: props.ruralHouseholdCount,
					urbanPopulation: props.urbanPopulation,
					ruralPopulation: props.ruralPopulation,
					urbanizationRate: props.urbanizationRate,
					populationDensity: props.populationDensity,
					averageHouseholdSize: props.averageHouseholdSize,
				});
			}
		});

		// Update summary stats from national summary
		if (this.nationalSummary) {
			this.stats = {
				totalDzongkhags: this.geoJsonData?.metadata.totalDzongkhags || 0,
				totalAdminZones: this.dzongkhagStats.reduce(
					(sum, stat) => sum + stat.totalAdminZones,
					0
				),
				totalSubAdminZones: this.dzongkhagStats.reduce(
					(sum, stat) => sum + stat.totalSubAdminZones,
					0
				),
				totalEnumerationAreas: this.dzongkhagStats.reduce(
					(sum, stat) => sum + stat.totalEnumerationAreas,
					0
				),
				urbanEnumerationAreas: this.dzongkhagFeatures.reduce(
					(sum, feature) => sum + (feature.properties.urbanEACount || 0),
					0
				),
				ruralEnumerationAreas: this.dzongkhagFeatures.reduce(
					(sum, feature) => sum + (feature.properties.ruralEACount || 0),
					0
				),
				totalHouseholds: this.nationalSummary.totalHouseholds,
				totalPopulation: this.nationalSummary.totalPopulation,
				totalMale: this.dzongkhagStats.reduce(
					(sum, stat) => sum + stat.totalMale,
					0
				),
				totalFemale: this.dzongkhagStats.reduce(
					(sum, stat) => sum + stat.totalFemale,
					0
				),
				urbanHouseholds: this.dzongkhagStats.reduce(
					(sum, stat) => sum + stat.urbanHouseholds,
					0
				),
				ruralHouseholds: this.dzongkhagStats.reduce(
					(sum, stat) => sum + stat.ruralHouseholds,
					0
				),
				urbanPopulation: this.nationalSummary.urbanPopulation,
				ruralPopulation: this.nationalSummary.ruralPopulation,
			};
		}

		// Populate dzongkhag options for filter dropdown
		this.populateDzongkhagOptions();
	}

	/**
	 * Load dzongkhag boundaries on map with statistics
	 */
	private loadDzongkhagBoundaries(): void {
		if (!this.geoJsonData || !this.map) return;

		if (this.currentGeoJSONLayer) {
			this.map.removeLayer(this.currentGeoJSONLayer);
		}

		console.log('Loading dzongkhag GeoJSON data with statistics');

		this.currentGeoJSONLayer = L.geoJSON(this.geoJsonData as any, {
			style: (feature: any) => this.getFeatureStyle(feature),
			onEachFeature: (feature: any, layer) =>
				this.onEachFeature(feature, layer),
		});

		if (this.showDzongkhagBoundaries) {
			this.currentGeoJSONLayer.addTo(this.map);
			this.map.fitBounds(this.currentGeoJSONLayer.getBounds());
		}
	}

	/**
	 * Get feature style based on data
	 */
	private getFeatureStyle(feature: DzongkhagStatsFeature): L.PathOptions {
		const props = feature.properties;

		if (!props.hasData) {
			return {
				fillColor: '#cccccc',
				fillOpacity: 0.3,
				color: '#666666',
				weight: 1,
			};
		}

		// Get values based on visualization mode
		const values = this.dzongkhagFeatures
			.filter((f) => f.properties.hasData)
			.map((f) => {
				if (this.mapVisualizationMode === 'households') {
					return f.properties.totalHouseholds;
				} else if (this.mapVisualizationMode === 'population') {
					return f.properties.totalPopulation;
				} else {
					return f.properties.eaCount;
				}
			});

		const minValue = Math.min(...values);
		const maxValue = Math.max(...values);

		let currentValue: number;
		if (this.mapVisualizationMode === 'households') {
			currentValue = props.totalHouseholds;
		} else if (this.mapVisualizationMode === 'population') {
			currentValue = props.totalPopulation;
		} else {
			currentValue = props.eaCount;
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
	}

	/**
	 * Get legend items for map based on visualization mode
	 * @deprecated Use getLegendGradient() and getLegendBreaks() for continuous gradient legend
	 */
	getLegendItems(): { color: string; label: string; value: number }[] {
		if (!this.dzongkhagFeatures || this.dzongkhagFeatures.length === 0) {
			return [];
		}

		const values = this.dzongkhagFeatures
			.filter((f) => f.properties.hasData)
			.map((f) => {
				if (this.mapVisualizationMode === 'households') {
					return f.properties.totalHouseholds;
				} else if (this.mapVisualizationMode === 'population') {
					return f.properties.totalPopulation;
				} else {
					return f.properties.eaCount;
				}
			});

		const minValue = Math.min(...values);
		const maxValue = Math.max(...values);

		return this.colorScaleService.getLegendItems(minValue, maxValue, 5);
	}

	/**
	 * Get population legend items for map (legacy - kept for compatibility)
	 */
	getPopulationLegend(): { color: string; label: string; value: number }[] {
		return this.getLegendItems();
	}

	/**
	 * Get CSS gradient string for continuous color scale legend
	 */
	getLegendGradient(): string {
		if (!this.dzongkhagFeatures || this.dzongkhagFeatures.length === 0) {
			return '';
		}

		const { min, max } = this.getLegendMinMax();
		return this.colorScaleService.getLegendGradient(min, max, 'vertical');
	}

	/**
	 * Get legend break values with labels for continuous gradient
	 */
	getLegendBreaks(): { value: number; label: string; position: number }[] {
		if (!this.dzongkhagFeatures || this.dzongkhagFeatures.length === 0) {
			return [];
		}

		const { min, max } = this.getLegendMinMax();
		return this.colorScaleService.getLegendBreaks(min, max, 5);
	}

	/**
	 * Get min and max values for current visualization mode
	 */
	getLegendMinMax(): { min: number; max: number } {
		if (!this.dzongkhagFeatures || this.dzongkhagFeatures.length === 0) {
			return { min: 0, max: 0 };
		}

		const values = this.dzongkhagFeatures
			.filter((f) => f.properties.hasData)
			.map((f) => {
				if (this.mapVisualizationMode === 'households') {
					return f.properties.totalHouseholds;
				} else if (this.mapVisualizationMode === 'population') {
					return f.properties.totalPopulation;
				} else {
					return f.properties.eaCount;
				}
			});

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

	/**
	 * Switch map visualization mode and reload boundaries
	 */
	switchVisualizationMode(
		mode: 'households' | 'population' | 'enumerationAreas'
	): void {
		this.mapVisualizationMode = mode;
		// Reload boundaries to update colors
		if (this.map && this.geoJsonData) {
			this.loadDzongkhagBoundaries();
		}
	}

	/**
	 * Add popup and interactions to each feature
	 */
	private onEachFeature(feature: DzongkhagStatsFeature, layer: L.Layer): void {
		const props = feature.properties;

		// Add permanent label with green text buffer
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
				${props.name}
			</div>
		`;

		// Get center of the polygon for label placement
		if (layer instanceof L.Polygon) {
			const bounds = layer.getBounds();
			const center = bounds.getCenter();

			const label = L.tooltip({
				permanent: true,
				direction: 'center',
				className: 'dzongkhag-label',
				opacity: 1,
			})
				.setLatLng(center)
				.setContent(labelContent);

			layer.bindTooltip(label);
		}

		// Calculate percentages
		const urbanPopPct =
			props.totalPopulation > 0
				? ((props.urbanPopulation / props.totalPopulation) * 100).toFixed(1)
				: '0.0';
		const urbanHHPct =
			props.totalHouseholds > 0
				? ((props.urbanHouseholdCount / props.totalHouseholds) * 100).toFixed(1)
				: '0.0';
		const urbanEAPct =
			props.eaCount > 0
				? (((props.urbanEACount || 0) / props.eaCount) * 100).toFixed(1)
				: '0.0';

		const popupContent = `
			<div class="p-2 min-w-[280px]">
				<h3 class="font-bold text-lg mb-3 text-slate-900">${props.name} Dzongkhag</h3>
				${
					props.hasData
						? `
				<div class="space-y-0 text-sm mb-3">
					<!-- Population -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Population: </span>
						<span class="font-bold" style="color: #67A4CA">${props.totalPopulation.toLocaleString()}</span>
						<span class="text-slate-600"> (${urbanPopPct}% Urban)</span>
					</div>

					<!-- Households -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Households: </span>
						<span class="font-bold" style="color: #67A4CA">${props.totalHouseholds.toLocaleString()}</span>
						<span class="text-slate-600"> (${urbanHHPct}% Urban)</span>
					</div>

					<!-- Enumeration Areas -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Enumeration Areas: </span>
						<span class="font-bold" style="color: #67A4CA">${props.eaCount}</span>
						<span class="text-slate-600"> (${urbanEAPct}% Urban)</span>
					</div>
				</div>
				`
						: '<p class="text-sm text-gray-500 mb-3">No data available for this dzongkhag.</p>'
				}
				<button 
					id="view-dzongkhag-${props.id}" 
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
			const button = document.getElementById(`view-dzongkhag-${props.id}`);
			if (button) {
				button.addEventListener('click', () => {
					if (props.id) {
						this.viewDzongkhag(props.id);
					}
				});
			}
		});

		// Hover effects
		layer.on({
			mouseover: (e) => {
				const target = e.target as L.Path;
				target.setStyle({
					weight: 3,
					fillOpacity: 0.9,
				});
			},
			mouseout: (e) => {
				this.currentGeoJSONLayer?.resetStyle(e.target);
			},
		});
	}

	/**
	 * Switch basemap
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
	 * Toggle dzongkhag boundaries visibility
	 */
	toggleDzongkhagBoundaries(): void {
		this.showDzongkhagBoundaries = !this.showDzongkhagBoundaries;

		if (this.map && this.currentGeoJSONLayer) {
			if (this.showDzongkhagBoundaries) {
				this.currentGeoJSONLayer.addTo(this.map);
			} else {
				this.map.removeLayer(this.currentGeoJSONLayer);
			}
		}
	}

	/**
	 * Navigate to dzongkhag data viewer
	 */
	viewDzongkhag(dzongkhagId: number): void {
		this.router.navigate(['/admin/data-view/dzongkhag', dzongkhagId]);
	}

	/**
	 * Calculate percentage for visual bars
	 */
	getPercentage(value: number, total: number): string {
		if (!total) return '0';
		return ((value / total) * 100).toFixed(1);
	}

	/**
	 * Get percentage as numeric value
	 */
	getPercentageValue(value: number, total: number): number {
		if (!total) return 0;
		return (value / total) * 100;
	}

	/**
	 * TrackBy function for dzongkhag list
	 */
	trackByDzongkhagId(index: number, item: DzongkhagStats): number {
		return item.dzongkhagId;
	}

	/**
	 * Download GeoJSON data
	 */
	downloadGeoJSON(): void {
		if (!this.geoJsonData) return;

		const dataStr = JSON.stringify(this.geoJsonData, null, 2);
		const blob = new Blob([dataStr], { type: 'application/json' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `dzongkhag-statistics-${
			new Date().toISOString().split('T')[0]
		}.geojson`;
		link.click();
		window.URL.revokeObjectURL(url);
	}

	/**
	 * Download KML data
	 */
	downloadKML(): void {
		if (!this.geoJsonData) return;

		// Convert GeoJSON to KML (basic conversion)
		let kml = '<?xml version="1.0" encoding="UTF-8"?>\n';
		kml += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
		kml += '<Document>\n';
		kml += '<name>Dzongkhag Statistics</name>\n';

		this.geoJsonData.features.forEach((feature) => {
			const props = feature.properties;
			kml += '<Placemark>\n';
			kml += `  <name>${props.name}</name>\n`;
			kml += '  <description><![CDATA[\n';
			kml += `    Population: ${props.totalPopulation}<br/>\n`;
			kml += `    Households: ${props.totalHouseholds}<br/>\n`;
			kml += `    EAs: ${props.eaCount}\n`;
			kml += '  ]]></description>\n';
			// Note: Full geometry conversion would require coordinate transformation
			kml += '</Placemark>\n';
		});

		kml += '</Document>\n';
		kml += '</kml>';

		const blob = new Blob([kml], {
			type: 'application/vnd.google-earth.kml+xml',
		});
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `dzongkhag-statistics-${
			new Date().toISOString().split('T')[0]
		}.kml`;
		link.click();
		window.URL.revokeObjectURL(url);
	}

	/**
	 * Download attributes as CSV
	 */
	downloadCSV(): void {
		if (!this.dzongkhagStats.length) return;

		// CSV headers
		const headers = [
			'Dzongkhag ID',
			'Dzongkhag Name',
			'Dzongkhag Code',
			'Total Admin Zones',
			'Total Sub Admin Zones',
			'Total Enumeration Areas',
			'Urban EAs',
			'Rural EAs',
			'Total Households',
			'Urban Households',
			'Rural Households',
			'Total Population',
			'Urban Population',
			'Rural Population',
			'Total Male',
			'Total Female',
			'Urbanization Rate',
			'Population Density',
			'Average Household Size',
		];

		// CSV rows
		const rows = this.dzongkhagStats.map((stat) => [
			stat.dzongkhagId,
			stat.dzongkhagName,
			stat.dzongkhagCode,
			stat.totalAdminZones,
			stat.totalSubAdminZones,
			stat.totalEnumerationAreas,
			stat.urbanEnumerationAreas,
			stat.ruralEnumerationAreas,
			stat.totalHouseholds,
			stat.urbanHouseholds,
			stat.ruralHouseholds,
			stat.totalPopulation,
			stat.urbanPopulation,
			stat.ruralPopulation,
			stat.totalMale,
			stat.totalFemale,
			stat.urbanizationRate,
			stat.populationDensity,
			stat.averageHouseholdSize,
		]);

		// Combine headers and rows
		const csvContent = [
			headers.join(','),
			...rows.map((row) => row.join(',')),
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `dzongkhag-attributes-${
			new Date().toISOString().split('T')[0]
		}.csv`;
		link.click();
		window.URL.revokeObjectURL(url);
	}

	/**
	 * Populate dzongkhag options for filter dropdown
	 */
	populateDzongkhagOptions(): void {
		this.dzongkhagOptions = this.dzongkhagStats.map((stat) => ({
			label: stat.dzongkhagName,
			value: stat.dzongkhagId,
		}));
	}

	/**
	 * Handle dzongkhag selection change
	 */
	onDzongkhagChange(): void {
		// Reset dependent dropdowns
		this.selectedAdminZone = null;
		this.selectedSubAdminZone = null;
		this.selectedEA = null;
		this.adminZoneOptions = [];
		this.subAdminZoneOptions = [];
		this.eaOptions = [];

		// Load admin zones for selected dzongkhag
		if (this.selectedDzongkhag) {
			this.administrativeZoneService
				.findAdministrativeZonesByDzongkhag(this.selectedDzongkhag)
				.subscribe({
					next: (adminZones) => {
						this.adminZoneOptions = adminZones.map((zone) => ({
							label: zone.name,
							value: zone.id,
						}));
					},
					error: (error) => {
						console.error('Error loading administrative zones:', error);
					},
				});
		}
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
		} else if (this.selectedDzongkhag) {
			// Navigate to dzongkhag data viewer
			this.router.navigate([
				'/admin/data-view/dzongkhag',
				this.selectedDzongkhag,
			]);
		}
	}
}
