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

import * as L from 'leaflet';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { DzongkhagStatsFeature, DzongkhagStatsGeoJson, DzongkhagStatsDetailedProperties, NationalSummary } from '../../../../core/dataservice/annual-statistics/dzongkhag-annual-stats/dzongkhag-annual-stats.dto';
import { DzongkhagAnnualStatsDataService } from '../../../../core/dataservice/annual-statistics/dzongkhag-annual-stats/dzongkhag-annual-stats.dataservice';
import { LocationDownloadService } from '../../../../core/dataservice/downloads/location.download.service';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { BasemapConfig, BasemapService } from '../../../../core/utility/basemap.service';
import { MapFeatureColorService } from '../../../../core/utility/map-feature-color.service';

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
	selector: 'app-admin-national-data-viewer',
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './admin-national-data-viewer.component.html',
	styleUrl: './admin-national-data-viewer.component.scss',
	providers: [MessageService],
})
export class AdminNationalDataViewerComponent
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
		private enumerationAreaService: EnumerationAreaDataService,
		private locationDownloadService: LocationDownloadService,
		private messageService: MessageService
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
			const props = feature.properties as DzongkhagStatsDetailedProperties;
			if (props.hasData) {
				this.dzongkhagStats.push({
					dzongkhagId: props.id,
					dzongkhagName: props.name,
					dzongkhagCode: props.areaCode,
					totalAdminZones: props.azCount || 0,
					totalSubAdminZones: props.sazCount || 0,
					totalEnumerationAreas: props.eaCount || props.totalEA || 0,
					urbanEnumerationAreas: props.urbanEACount || props.urbanEA || 0,
					ruralEnumerationAreas: props.ruralEACount || props.ruralEA || 0,
					totalHouseholds: props.totalHouseholds || props.totalHousehold || 0,
					totalPopulation: props.totalPopulation,
					totalMale: props.totalMale || 0,
					totalFemale: props.totalFemale || 0,
					urbanHouseholds: props.urbanHouseholdCount || props.urbanHousehold || 0,
					ruralHouseholds: props.ruralHouseholdCount || props.ruralHousehold || 0,
					urbanPopulation: props.urbanPopulation,
					ruralPopulation: props.ruralPopulation,
					urbanizationRate: props.urbanizationRate || 0,
					populationDensity: props.populationDensity || 0,
					averageHouseholdSize: props.averageHouseholdSize || 0,
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
					(sum, feature) => {
						const props = feature.properties as DzongkhagStatsDetailedProperties;
						return sum + (props.urbanEACount || props.urbanEA || 0);
					},
					0
				),
				ruralEnumerationAreas: this.dzongkhagFeatures.reduce(
					(sum, feature) => {
						const props = feature.properties as DzongkhagStatsDetailedProperties;
						return sum + (props.ruralEACount || props.ruralEA || 0);
					},
					0
				),
				totalHouseholds: this.nationalSummary.totalHouseholds || this.nationalSummary.totalHousehold || 0,
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
				const fProps = f.properties as DzongkhagStatsDetailedProperties;
				if (this.mapVisualizationMode === 'households') {
					return fProps.totalHouseholds || fProps.totalHousehold || 0;
				} else if (this.mapVisualizationMode === 'population') {
					return fProps.totalPopulation;
				} else {
					return fProps.eaCount || fProps.totalEA || 0;
				}
			});

		const minValue = Math.min(...values);
		const maxValue = Math.max(...values);

		const detailedProps = props as DzongkhagStatsDetailedProperties;
		let currentValue: number;
		if (this.mapVisualizationMode === 'households') {
			currentValue = detailedProps.totalHouseholds || detailedProps.totalHousehold || 0;
		} else if (this.mapVisualizationMode === 'population') {
			currentValue = detailedProps.totalPopulation;
		} else {
			currentValue = detailedProps.eaCount || detailedProps.totalEA || 0;
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
				const fProps = f.properties as DzongkhagStatsDetailedProperties;
				if (this.mapVisualizationMode === 'households') {
					return fProps.totalHouseholds || fProps.totalHousehold || 0;
				} else if (this.mapVisualizationMode === 'population') {
					return fProps.totalPopulation;
				} else {
					return fProps.eaCount || fProps.totalEA || 0;
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
				const fProps = f.properties as DzongkhagStatsDetailedProperties;
				if (this.mapVisualizationMode === 'households') {
					return fProps.totalHouseholds || fProps.totalHousehold || 0;
				} else if (this.mapVisualizationMode === 'population') {
					return fProps.totalPopulation;
				} else {
					return fProps.eaCount || fProps.totalEA || 0;
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
	 * Create popup content for a dzongkhag feature
	 */
	private createPopupContent(props: DzongkhagStatsFeature['properties']): string {
		const detailedProps = props as DzongkhagStatsDetailedProperties;
		const totalEA = detailedProps.eaCount || detailedProps.totalEA || 0;
		const urbanEA = detailedProps.urbanEACount || detailedProps.urbanEA || 0;
		const ruralEA = detailedProps.ruralEACount || detailedProps.ruralEA || 0;
		const totalHousehold = detailedProps.totalHouseholds || detailedProps.totalHousehold || 0;
		const urbanHousehold = detailedProps.urbanHouseholdCount || detailedProps.urbanHousehold || 0;
		const ruralHousehold = detailedProps.ruralHouseholdCount || detailedProps.ruralHousehold || 0;

		const dataSection = props.hasData
			? `
				<div class="space-y-2 text-sm mb-3">
					<!-- Enumeration Areas Section -->
					<div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
						<p class="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Enumeration Areas</p>
						<div class="space-y-1">
							<div class="flex justify-between items-center">
								<span class="text-xs text-slate-600">Total:</span>
								<span class="text-sm font-bold text-slate-900">${totalEA.toLocaleString()}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-xs text-slate-600">Urban:</span>
								<span class="text-sm font-semibold text-slate-700">${urbanEA.toLocaleString()}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-xs text-slate-600">Rural:</span>
								<span class="text-sm font-semibold text-slate-700">${ruralEA.toLocaleString()}</span>
							</div>
						</div>
					</div>
					
					<!-- Households Section -->
					<div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
						<p class="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Households</p>
						<div class="space-y-1">
							<div class="flex justify-between items-center">
								<span class="text-xs text-slate-600">Total:</span>
								<span class="text-sm font-bold" style="color: #67A4CA">${totalHousehold.toLocaleString()}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-xs text-slate-600">Urban:</span>
								<span class="text-sm font-semibold text-slate-700">${urbanHousehold.toLocaleString()}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-xs text-slate-600">Rural:</span>
								<span class="text-sm font-semibold text-slate-700">${ruralHousehold.toLocaleString()}</span>
							</div>
						</div>
					</div>
					
				
				</div>
			`
			: '<p class="text-sm text-gray-500 mb-3">No data available for this dzongkhag.</p>';

		return `
			<div class="p-3 min-w-[280px]">
				<h3 class="font-bold text-lg mb-3 text-slate-900 pb-2 border-b border-slate-200">${props.name} Dzongkhag</h3>
				${dataSection}
				<div class="flex gap-2 pt-2">
					<button 
						id="view-dzongkhag-${props.id}" 
						class="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded transition shadow-sm"
					>
						View Details
					</button>
				</div>
			</div>
		`;
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

		// Add popup
		const popup = L.popup().setContent(this.createPopupContent(props));
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
	 * Download all Enumeration Areas as GeoJSON (National)
	 */
	downloadEAsGeoJSON(): void {
		this.locationDownloadService.downloadAllEAsAsGeoJson().subscribe({
			next: (geoJson) => {
				const dataStr = JSON.stringify(geoJson, null, 2);
		const blob = new Blob([dataStr], { type: 'application/json' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
				link.download = `all_enumeration_areas_${
			new Date().toISOString().split('T')[0]
		}.geojson`;
		link.click();
		window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Download Complete',
					detail: 'All Enumeration Areas GeoJSON downloaded successfully',
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
	 * Download all Enumeration Areas as KML (National)
	 */
	downloadEAsKML(): void {
		this.locationDownloadService.downloadAllEAsAsKml().subscribe({
			next: (kml) => {
				const blob = new Blob([kml], {
					type: 'application/vnd.google-earth.kml+xml',
				});
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `all_enumeration_areas_${
					new Date().toISOString().split('T')[0]
				}.kml`;
				link.click();
				window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Download Complete',
					detail: 'All Enumeration Areas KML downloaded successfully',
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

	/**
	 * Download all Administrative Zones as GeoJSON (National)
	 */
	downloadAZsGeoJSON(): void {
		this.locationDownloadService.downloadAllAZsAsGeoJson().subscribe({
			next: (geoJson) => {
				const dataStr = JSON.stringify(geoJson, null, 2);
				const blob = new Blob([dataStr], { type: 'application/json' });
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `all_administrative_zones_${
					new Date().toISOString().split('T')[0]
				}.geojson`;
				link.click();
				window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Download Complete',
					detail: 'All Administrative Zones GeoJSON downloaded successfully',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error downloading Administrative Zones GeoJSON:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Download Failed',
					detail: 'Failed to download Administrative Zones GeoJSON file',
					life: 3000,
				});
			},
		});
	}

	/**
	 * Download all Administrative Zones as KML (National)
	 */
	downloadAZsKML(): void {
		this.locationDownloadService.downloadAllAZsAsKml().subscribe({
			next: (kml) => {
				const blob = new Blob([kml], {
					type: 'application/vnd.google-earth.kml+xml',
				});
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `all_administrative_zones_${
					new Date().toISOString().split('T')[0]
				}.kml`;
				link.click();
				window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Download Complete',
					detail: 'All Administrative Zones KML downloaded successfully',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error downloading Administrative Zones KML:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Download Failed',
					detail: 'Failed to download Administrative Zones KML file',
					life: 3000,
				});
			},
		});
	}

	/**
	 * Download all Sub-Administrative Zones as GeoJSON (National)
	 */
	downloadSAZsGeoJSON(): void {
		this.locationDownloadService.downloadAllSAZsAsGeoJson().subscribe({
			next: (geoJson) => {
				const dataStr = JSON.stringify(geoJson, null, 2);
				const blob = new Blob([dataStr], { type: 'application/json' });
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `all_sub_administrative_zones_${
					new Date().toISOString().split('T')[0]
				}.geojson`;
				link.click();
				window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Download Complete',
					detail: 'All Sub-Administrative Zones GeoJSON downloaded successfully',
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
	 * Download all Sub-Administrative Zones as KML (National)
	 */
	downloadSAZsKML(): void {
		this.locationDownloadService.downloadAllSAZsAsKml().subscribe({
			next: (kml) => {
		const blob = new Blob([kml], {
			type: 'application/vnd.google-earth.kml+xml',
		});
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
				link.download = `all_sub_administrative_zones_${
			new Date().toISOString().split('T')[0]
		}.kml`;
		link.click();
		window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Download Complete',
					detail: 'All Sub-Administrative Zones KML downloaded successfully',
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
	 * Download Sampling Frame Report as PDF (Placeholder - Not implemented)
	 */
	downloadSamplingFrameReport(): void {
		this.messageService.add({
			severity: 'info',
			summary: 'Not Available',
			detail: 'Sampling Frame Report (PDF) download is not yet implemented',
			life: 3000,
		});
	}

	/**
	 * Download Household Data as CSV
	 */
	downloadHouseholdData(): void {
		this.downloadCSV();
	}

	/**
	 * Download all Dzongkhags as KML (National)
	 */
	downloadDzongkhagKml(): void {
		this.locationDownloadService.downloadAllDzongkhagsAsKml().subscribe({
			next: (kml) => {
				const blob = new Blob([kml], {
					type: 'application/vnd.google-earth.kml+xml',
				});
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `all_dzongkhags_${
					new Date().toISOString().split('T')[0]
				}.kml`;
				link.click();
				window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Download Complete',
					detail: 'All Dzongkhags KML downloaded successfully',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error downloading Dzongkhags KML:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Download Failed',
					detail: 'Failed to download Dzongkhags KML file',
					life: 3000,
				});
			},
		});
	}

	/**
	 * Download all Dzongkhags as GeoJSON (National)
	 */
	downloadDzongkhagGeojson(): void {
		this.locationDownloadService.downloadAllDzongkhagsAsGeoJson().subscribe({
			next: (geoJson) => {
				const dataStr = JSON.stringify(geoJson, null, 2);
				const blob = new Blob([dataStr], { type: 'application/json' });
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `all_dzongkhags_${
					new Date().toISOString().split('T')[0]
				}.geojson`;
				link.click();
				window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Download Complete',
					detail: 'All Dzongkhags GeoJSON downloaded successfully',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error downloading Dzongkhags GeoJSON:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Download Failed',
					detail: 'Failed to download Dzongkhags GeoJSON file',
					life: 3000,
				});
			},
		});
	}

	/**
	 * Download Administrative Zones (Gewog/Thromde) as KML
	 */
	downloadAdminZonesKml(): void {
		this.downloadAZsKML();
	}

	/**
	 * Download Administrative Zones (Gewog/Thromde) as GeoJSON
	 */
	downloadAdminZonesGeojson(): void {
		this.downloadAZsGeoJSON();
	}

	/**
	 * Download Sub-Administrative Zones (Chiwog/Lap) as KML
	 */
	downloadSubAdminZonesKml(): void {
		this.downloadSAZsKML();
	}

	/**
	 * Download Sub-Administrative Zones (Chiwog/Lap) as GeoJSON
	 */
	downloadSubAdminZonesGeojson(): void {
		this.downloadSAZsGeoJSON();
	}

	/**
	 * Download Enumeration Areas as KML
	 */
	downloadEAZonesKml(): void {
		this.downloadEAsKML();
	}

	/**
	 * Download Enumeration Areas as GeoJSON
	 */
	downloadEAZonesGeojson(): void {
		this.downloadEAsGeoJSON();
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
