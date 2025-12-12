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
import { Router, ActivatedRoute } from '@angular/router';

import * as L from 'leaflet';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import {
	DzongkhagStatsFeature,
	DzongkhagStatsGeoJson,
	NationalSummary,
} from '../../../../core/dataservice/annual-statistics/dzongkhag-annual-stats/dzongkhag-annual-stats.dto';
import { DzongkhagAnnualStatsDataService } from '../../../../core/dataservice/annual-statistics/dzongkhag-annual-stats/dzongkhag-annual-stats.dataservice';
import { LocationDownloadService } from '../../../../core/dataservice/downloads/location.download.service';
import { BasemapConfig, BasemapService } from '../../../../core/utility/basemap.service';
import { MapFeatureColorService } from '../../../../core/utility/map-feature-color.service';
import { PublicPageSettingsService } from '../../../../core/services/public-page-settings.service';

interface DzongkhagStats {
	dzongkhagId: number;
	dzongkhagName: string;
	dzongkhagCode: string;
	totalEnumerationAreas: number;
	totalHouseholds: number;
}

@Component({
	selector: 'app-public-national-data-viewer',
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './public-national-data-viewer.component.html',
	styleUrl: './public-national-data-viewer.component.scss',
	providers: [MessageService],
	standalone: true,
})
export class PublicNationalDataViewerComponent
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

	// Summary statistics (only Households and EAs for public)
	stats = {
		totalDzongkhags: 0,
		totalEnumerationAreas: 0,
		totalHouseholds: 0,
	};

	// Active tab for viewing mode
	activeMainTab: 'insights' | 'list' = 'insights';

	// Map visualization mode (only households and EAs for public)
	mapVisualizationMode: 'households' | 'enumerationAreas' = 'households';

	// Map
	private map?: L.Map;
	private baseLayer?: L.TileLayer;
	private currentGeoJSONLayer?: L.GeoJSON;
	selectedBasemapId = 'positron'; // Default basemap (will be overridden by settings)
	showDzongkhagBoundaries = true;
	basemapCategories: Record<
		string,
		{ label: string; basemaps: BasemapConfig[] }
	> = {};

	constructor(
		private dzongkhagStatsService: DzongkhagAnnualStatsDataService,
		private router: Router,
		private route: ActivatedRoute,
		private colorScaleService: MapFeatureColorService,
		private basemapService: BasemapService,
		private locationDownloadService: LocationDownloadService,
		private messageService: MessageService,
		private publicPageSettingsService: PublicPageSettingsService
	) {}

	ngOnInit() {
		// Initialize basemap categories from service
		this.basemapCategories = this.basemapService.getBasemapCategories();

		// Load settings from localStorage
		const settings = this.publicPageSettingsService.getSettings();
		this.mapVisualizationMode = settings.mapVisualizationMode;
		this.selectedBasemapId = settings.selectedBasemapId;

		this.loadDzongkhagStatistics();
	}

	ngAfterViewInit(): void {
		// Initialize map after view is ready
		setTimeout(() => {
			this.initializeMap();
			// If data is already loaded, apply visualization mode from settings
			if (this.map && this.geoJsonData) {
				this.loadDzongkhagBoundaries();
			}
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
			setTimeout(() => this.initializeMap(), 200);
			return;
		}

		if (this.map) {
			console.log('Map already initialized');
			return;
		}

		console.log('Initializing map...');
		try {
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
	 * Process statistics from features (only Households and EAs)
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
					totalEnumerationAreas: props.eaCount,
					totalHouseholds: props.totalHouseholds,
				});
			}
		});

		// Update summary stats
		if (this.nationalSummary) {
			this.stats = {
				totalDzongkhags: this.geoJsonData?.metadata.totalDzongkhags || 0,
				totalEnumerationAreas: this.dzongkhagStats.reduce(
					(sum, stat) => sum + stat.totalEnumerationAreas,
					0
				),
				totalHouseholds: this.nationalSummary.totalHouseholds,
			};
		}
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
				} else {
					return f.properties.eaCount;
				}
			});

		const minValue = Math.min(...values);
		const maxValue = Math.max(...values);

		let currentValue: number;
		if (this.mapVisualizationMode === 'households') {
			currentValue = props.totalHouseholds;
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
		} else {
			return 'Enumeration Areas';
		}
	}

	/**
	 * Switch map visualization mode and reload boundaries
	 */
	switchVisualizationMode(
		mode: 'households' | 'enumerationAreas'
	): void {
		this.mapVisualizationMode = mode;
		if (this.map && this.geoJsonData) {
			this.loadDzongkhagBoundaries();
		}
	}

	/**
	 * Add popup and interactions to each feature
	 */
	private onEachFeature(feature: DzongkhagStatsFeature, layer: L.Layer): void {
		const props = feature.properties;

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
				${props.name}
			</div>
		`;

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

		const popupContent = `
			<div class="p-2 min-w-[280px]">
				<h3 class="font-bold text-lg mb-3 text-slate-900">${props.name} Dzongkhag</h3>
				${
					props.hasData
						? `
				<div class="space-y-0 text-sm mb-3">
					<!-- Households -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Households: </span>
						<span class="font-bold" style="color: #67A4CA">${props.totalHouseholds.toLocaleString()}</span>
					</div>

					<!-- Enumeration Areas -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Enumeration Areas: </span>
						<span class="font-bold" style="color: #67A4CA">${props.eaCount}</span>
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

		if (this.baseLayer) {
			this.map.removeLayer(this.baseLayer);
		}

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
	 * Navigate to dzongkhag data viewer (public route)
	 */
	viewDzongkhag(dzongkhagId: number): void {
		// Navigate to dzongkhag viewer - using relative path from current route
		this.router.navigate(['dzongkhag', dzongkhagId], { relativeTo: this.route.parent || this.route });
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
}

