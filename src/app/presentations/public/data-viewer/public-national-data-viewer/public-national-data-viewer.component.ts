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
import { AnnualStatisticsDownloadService } from '../../../../core/dataservice/downloads/annual-statistics-download.service';
import { BasemapConfig, BasemapService } from '../../../../core/utility/basemap.service';
import {
	MapFeatureColorService,
	ColorScaleType,
} from '../../../../core/utility/map-feature-color.service';
import { PublicPageSettingsService } from '../../../../core/services/public-page-settings.service';
import { DownloadService } from '../../../../core/utility/download.service';

interface DzongkhagStats {
	dzongkhagId: number;
	dzongkhagName: string;
	dzongkhagCode: string;
	totalEA: number;
	urbanEA: number;
	ruralEA: number;
	totalHousehold: number;
	urbanHousehold: number;
	ruralHousehold: number;
	totalPopulation: number;
	urbanPopulation: number;
	ruralPopulation: number;
}

type VisualizationMode = 'households' | 'enumerationAreas';
type MainTab = 'insights' | 'list';

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

	// Data
	geoJsonData: DzongkhagStatsGeoJson | null = null;
	nationalSummary: NationalSummary | null = null;
	dzongkhagFeatures: DzongkhagStatsFeature[] = [];
	dzongkhagStats: DzongkhagStats[] = [];

	// UI State
	loading = true;
	errorMessage: string | null = null;
	activeMainTab: MainTab = 'insights';
	mapVisualizationMode: VisualizationMode = 'households';

	// Statistics
	stats = {
		totalDzongkhags: 0,
		totalEA: 0,
		urbanEA: 0,
		ruralEA: 0,
		totalHousehold: 0,
		urbanHousehold: 0,
		ruralHousehold: 0,
		totalPopulation: 0,
		urbanPopulation: 0,
		ruralPopulation: 0,
	};


	// Download options for statistics CSV
	showStatisticsDownloadDialog = false;
	statisticsDownloadOptions = {
		includeAZ: false,
		includeSAZ: false,
	};

	// Download dialog
	showDownloadDialog = false;
	downloadOptions = {
		includeAZ: false,
		includeSAZ: false,
	};

	// Download state tracking
	isDownloading = false;
	currentDownloadType: string | null = null;
	showDownloadProgressDialog = false;
	downloadProgress = 0;

	// Content settings
	pageTitle = 'National Sampling Frame';
	pageDescription = 'Current statistics on households and enumeration areas';
	infoBoxContent =
		'A sampling frame is a population from which a sample can be drawn, ensuring survey samples are representative and reliable.';
	infoBoxStats = '3,310 EAs total (1,464 urban, 1,846 rural)';

	// Mobile State
	isMobile: boolean = false;
	isMobileDrawerOpen: boolean = false;
	isMobileControlsCollapsed: boolean = true;

	// Map
	private map?: L.Map;
	private baseLayer?: L.TileLayer;
	private currentGeoJSONLayer?: L.GeoJSON;
	selectedBasemapId = 'positron';
	selectedColorScale: ColorScaleType = 'blue';
	showDzongkhagBoundaries = true;
	basemapCategories: Record<
		string,
		{ label: string; basemaps: BasemapConfig[] }
	> = {};

	// Lifecycle
	private resizeListener?: () => void;

	constructor(
		private dzongkhagStatsService: DzongkhagAnnualStatsDataService,
		private router: Router,
		private route: ActivatedRoute,
		private colorScaleService: MapFeatureColorService,
		private basemapService: BasemapService,
		private locationDownloadService: LocationDownloadService,
		private annualStatisticsDownloadService: AnnualStatisticsDownloadService,
		private messageService: MessageService,
		private publicPageSettingsService: PublicPageSettingsService,
		private downloadService: DownloadService
	) {}

	// Flags to track initialization state
	private settingsLoaded = false;
	private dataLoaded = false;
	private viewReady = false;

	ngOnInit(): void {
		this.initializeSettings();
		this.initializeResponsive();
		this.loadDzongkhagStatistics();
	}

	ngAfterViewInit(): void {
		this.viewReady = true;
		this.attemptMapInitialization();
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	// ==================== Initialization ====================

	private initializeSettings(): void {
		this.basemapCategories = this.basemapService.getBasemapCategories();
		
		// Load settings from API (public endpoint, no auth required)
		this.publicPageSettingsService.getPublicSettings().subscribe({
			next: (settings) => {
				this.mapVisualizationMode = settings.mapVisualizationMode;
				this.selectedBasemapId = settings.selectedBasemapId;
				this.selectedColorScale = (settings.colorScale as ColorScaleType) || 'blue';
				// Load content settings
				this.pageTitle = settings.nationalDataViewerTitle || 'National Sampling Frame';
				this.pageDescription =
					settings.nationalDataViewerDescription ||
					'Current statistics on households and enumeration areas';
				this.infoBoxContent =
					settings.nationalDataViewerInfoBoxContent ||
					'A sampling frame is a population from which a sample can be drawn, ensuring survey samples are representative and reliable.';
				this.infoBoxStats =
					settings.nationalDataViewerInfoBoxStats ||
					'3,310 EAs total (1,464 urban, 1,846 rural)';
				
				this.settingsLoaded = true;
				this.attemptMapInitialization();
			},
			error: (error) => {
				console.error('Error loading public page settings:', error);
				// Use default values on error
				const defaultSettings = this.publicPageSettingsService.getDefaultSettings();
				this.mapVisualizationMode = defaultSettings.mapVisualizationMode;
				this.selectedBasemapId = defaultSettings.selectedBasemapId;
				this.selectedColorScale = defaultSettings.colorScale as ColorScaleType;
				this.pageTitle = defaultSettings.nationalDataViewerTitle;
				this.pageDescription = defaultSettings.nationalDataViewerDescription;
				this.infoBoxContent = defaultSettings.nationalDataViewerInfoBoxContent;
				this.infoBoxStats = defaultSettings.nationalDataViewerInfoBoxStats;
				
				this.settingsLoaded = true;
				this.attemptMapInitialization();
			},
		});
	}

	private initializeResponsive(): void {
		this.checkMobileViewport();
		this.resizeListener = () => this.checkMobileViewport();
		window.addEventListener('resize', this.resizeListener);
	}

	/**
	 * Attempt to initialize the map when all prerequisites are ready
	 */
	private attemptMapInitialization(): void {
		// Only initialize if all prerequisites are met
		if (!this.settingsLoaded || !this.viewReady) {
			return;
		}

		if (!this.mapContainerRef?.nativeElement) {
			setTimeout(() => this.attemptMapInitialization(), 200);
			return;
		}

		if (this.map) {
			// Map already initialized, just load boundaries if data is available
			if (this.geoJsonData) {
				this.loadDzongkhagBoundaries();
			}
			return;
		}

		// Initialize the map
		this.initializeMap();
	}

	private initializeMap(): void {
		if (!this.mapContainerRef?.nativeElement) {
			return;
		}

		if (this.map) {
			return;
		}

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

			// Load boundaries if data is already available
			if (this.map && this.geoJsonData) {
				this.loadDzongkhagBoundaries();
			}
		} catch (error) {
			console.error('Error initializing map:', error);
		}
	}

	private cleanup(): void {
		if (this.resizeListener) {
			window.removeEventListener('resize', this.resizeListener);
		}
		if (this.map) {
			this.map.remove();
		}
	}

	// ==================== Data Loading ====================

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
				this.dataLoaded = true;

				// Attempt to initialize map if not already done
				this.attemptMapInitialization();
				
				// If map is already initialized, load boundaries
				if (this.map) {
					this.loadDzongkhagBoundaries();
				}
			},
			error: (error) => {
				console.error('Error loading dzongkhag statistics:', error);
				this.errorMessage =
					'Failed to load dzongkhag statistics. Please try again.';
				this.loading = false;
				this.dataLoaded = true; // Mark as loaded even on error to allow map init
			},
		});
	}

	private processStatistics(): void {
		if (!this.dzongkhagFeatures.length) return;

		this.dzongkhagStats = this.dzongkhagFeatures
			.filter((feature) => feature.properties.hasData)
			.map((feature) => {
				const props = feature.properties;
				return {
					dzongkhagId: props.id,
					dzongkhagName: props.name,
					dzongkhagCode: props.areaCode,
					totalEA: props.totalEA,
					urbanEA: props.urbanEA,
					ruralEA: props.ruralEA,
					totalHousehold: props.totalHousehold,
					urbanHousehold: props.urbanHousehold,
					ruralHousehold: props.ruralHousehold,
					totalPopulation: props.totalPopulation,
					urbanPopulation: props.urbanPopulation,
					ruralPopulation: props.ruralPopulation,
				};
			});

		if (this.nationalSummary) {
			this.stats = {
				totalDzongkhags: this.geoJsonData?.metadata.totalDzongkhags || 0,
				totalEA: this.nationalSummary.totalEA,
				urbanEA: this.nationalSummary.urbanEA,
				ruralEA: this.nationalSummary.ruralEA,
				totalHousehold: this.nationalSummary.totalHousehold,
				urbanHousehold: this.nationalSummary.urbanHousehold,
				ruralHousehold: this.nationalSummary.ruralHousehold,
				totalPopulation: this.nationalSummary.totalPopulation,
				urbanPopulation: this.nationalSummary.urbanPopulation,
				ruralPopulation: this.nationalSummary.ruralPopulation,
			};

		}
	}

	// ==================== Percentage Calculation Helpers ====================

	getUrbanPercentage(total: number, urban: number): number {
		return total > 0 ? (urban / total) * 100 : 0;
	}

	getRuralPercentage(total: number, rural: number): number {
		return total > 0 ? (rural / total) * 100 : 0;
	}

	// ==================== Map Operations ====================

	private loadDzongkhagBoundaries(): void {
		if (!this.geoJsonData || !this.map) return;

		if (this.currentGeoJSONLayer) {
			this.map.removeLayer(this.currentGeoJSONLayer);
		}

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

		const values = this.getFeatureValues();
		
		// Safety check: if no values, return default color
		if (values.length === 0) {
			return {
				fillColor: '#cccccc',
				fillOpacity: 0.3,
				color: '#666666',
				weight: 1,
			};
		}

		const minValue = Math.min(...values);
		const maxValue = Math.max(...values);
		const currentValue = this.getFeatureValue(props);

		// Safety check: if min equals max, all values are the same
		if (minValue === maxValue) {
			const scale = this.colorScaleService.getColorScaleArray(this.selectedColorScale);
			return {
				fillColor: scale[Math.floor(scale.length / 2)],
				fillOpacity: 0.7,
				color: 'darkcyan',
				weight: 0.5,
				opacity: 1,
			};
		}

		const color = this.colorScaleService.getInterpolatedColor(
			currentValue,
			minValue,
			maxValue,
			this.selectedColorScale
		);

		return {
			fillColor: color,
			fillOpacity: 0.7,
			color: 'darkcyan',
			weight: 0.5,
			opacity: 1,
		};
	}

	private getFeatureValues(): number[] {
		return this.dzongkhagFeatures
			.filter((f) => f.properties.hasData)
			.map((f) => this.getFeatureValue(f.properties));
	}

	private getFeatureValue(props: DzongkhagStatsFeature['properties']): number {
		return this.mapVisualizationMode === 'households'
			? props.totalHousehold
			: props.totalEA;
	}

	private onEachFeature(feature: DzongkhagStatsFeature, layer: L.Layer): void {
		const props = feature.properties;

		// Add permanent label
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
				.setContent(this.createLabelContent(props.name));

			layer.bindTooltip(label);
		}

		// Add popup
		const popup = L.popup().setContent(this.createPopupContent(props));
		layer.bindPopup(popup);

		// Add popup button listener
		layer.on('popupopen', () => {
			const viewButton = document.getElementById(`view-dzongkhag-${props.id}`);
			if (viewButton) {
				viewButton.addEventListener('click', () => {
					if (props.id) {
						this.viewDzongkhag(props.id);
					}
				});
			}

			const downloadButton = document.getElementById(`download-kml-${props.id}`);
			if (downloadButton) {
				downloadButton.addEventListener('click', () => {
					if (props.id) {
						this.downloadDzongkhagKML(props.id, props.name);
					}
				});
			}
		});

		// Add hover effects
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

	private createLabelContent(name: string): string {
		return `
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
				${name}
			</div>
		`;
	}

	private createPopupContent(props: DzongkhagStatsFeature['properties']): string {
		const dataSection = props.hasData
			? `
				<div class="space-y-0 text-sm mb-3">
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Total Households: </span>
						<span class="font-bold" style="color: #67A4CA">${props.totalHousehold.toLocaleString()}</span>
					</div>
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Urban Households: </span>
						<span class="font-bold" style="color: #67A4CA">${props.urbanHousehold.toLocaleString()}</span>
					</div>
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Rural Households: </span>
						<span class="font-bold" style="color: #67A4CA">${props.ruralHousehold.toLocaleString()}</span>
					</div>
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Total EA: </span>
						<span class="font-bold" style="color: #67A4CA">${props.totalEA}</span>
					</div>
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Urban EA: </span>
						<span class="font-bold" style="color: #67A4CA">${props.urbanEA}</span>
					</div>
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Rural EA: </span>
						<span class="font-bold" style="color: #67A4CA">${props.ruralEA}</span>
					</div>
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Total Population: </span>
						<span class="font-bold" style="color: #67A4CA">${props.totalPopulation.toLocaleString()}</span>
					</div>
				</div>
			`
			: '<p class="text-sm text-gray-500 mb-3">No data available for this dzongkhag.</p>';

		return `
			<div class="p-2 min-w-[280px]">
				<h3 class="font-bold text-lg mb-3 text-slate-900">${props.name} Dzongkhag</h3>
				${dataSection}
				<div class="flex gap-2">
					<button 
						id="view-dzongkhag-${props.id}" 
						class="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded transition shadow-sm"
					>
						View Details
					</button>
					<button 
						id="download-kml-${props.id}" 
						class="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold rounded transition shadow-sm flex items-center justify-center"
						title="Download KML"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
						</svg>
						KML
					</button>
				</div>
			</div>
		`;
	}

	// ==================== Map Controls ====================

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

	switchVisualizationMode(mode: VisualizationMode): void {
		this.mapVisualizationMode = mode;
		if (this.map && this.geoJsonData) {
			this.loadDzongkhagBoundaries();
		}

		if (this.isMobile) {
			this.closeMobileDrawer();
		}
	}

	// ==================== Legend ====================

	getLegendGradient(): string {
		if (!this.dzongkhagFeatures?.length) {
			return '';
		}

		const { min, max } = this.getLegendMinMax();
		return this.colorScaleService.getLegendGradient(
			min,
			max,
			'horizontal',
			this.selectedColorScale
		);
	}

	getLegendBreaks(): { value: number; label: string; position: number }[] {
		if (!this.dzongkhagFeatures?.length) {
			return [];
		}

		const { min, max } = this.getLegendMinMax();
		return this.colorScaleService.getLegendBreaks(min, max, 5, this.selectedColorScale);
	}

	private getLegendMinMax(): { min: number; max: number } {
		if (!this.dzongkhagFeatures?.length) {
			return { min: 0, max: 0 };
		}

		const values = this.dzongkhagFeatures
			.filter((f) => f.properties.hasData)
			.map((f) => this.getFeatureValue(f.properties));

		return {
			min: Math.min(...values),
			max: Math.max(...values),
		};
	}

	getLegendTitle(): string {
		return this.mapVisualizationMode === 'households'
			? 'Households'
			: 'Enumeration Areas';
	}

	// ==================== Navigation ====================

	viewDzongkhag(dzongkhagId: number): void {
		this.router.navigate(['dzongkhag', dzongkhagId], {
			relativeTo: this.route.parent || this.route,
		});
	}

	/**
	 * Download dzongkhag KML file
	 */
	downloadDzongkhagKML(dzongkhagId: number, dzongkhagName: string): void {
		if (this.isDownloading) return;
		
		if (!this.geoJsonData || !this.geoJsonData.features) {
			this.messageService.add({
				severity: 'error',
				summary: 'Download Failed',
				detail: 'Dzongkhag boundaries not available',
				life: 3000,
			});
			return;
		}

		// Find the specific feature for this dzongkhag
		const feature = this.geoJsonData.features.find(
			(f: any) => f.properties.id === dzongkhagId
		);

		if (!feature) {
			this.messageService.add({
				severity: 'error',
				summary: 'Download Failed',
				detail: 'Dzongkhag not found',
				life: 3000,
			});
			return;
		}

		this.startDownload(`${dzongkhagName} Dzongkhag KML`);

		// Create a GeoJSON with just this feature
		const featureGeoJSON = {
			type: 'FeatureCollection',
			features: [feature],
		};

		// Generate filename
		const sanitizedName = dzongkhagName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		const filename = `${sanitizedName}_${dzongkhagId}_${new Date().toISOString().split('T')[0]}.kml`;

		// Download the KML
		try {
			setTimeout(() => {
				this.downloadProgress = 50;
			this.downloadService.downloadKML({
				data: featureGeoJSON,
				filename: filename,
				layerName: `${dzongkhagName} Dzongkhag`,
			});
				this.completeDownload(true, `${dzongkhagName} Dzongkhag KML downloaded successfully`);
			}, 300);
		} catch (error) {
			console.error('Error downloading KML:', error);
			this.completeDownload(false, 'Failed to download KML file');
		}
	}

	/**
	 * Navigate to login page
	 */
	navigateToLogin(): void {
		this.router.navigate(['/auth/login']);
	}

	/**
	 * Navigate to geographic statistical code page
	 */
	navigateToGeographicStatisticalCode(): void {
		// Navigate to the parent route level where geographic-statistical-code is defined
		const parentRoute = this.route.parent?.parent || this.route.parent || this.route;
		this.router.navigate(['geographic-statistical-code'], {
			relativeTo: parentRoute,
		});
	}

	// ==================== Mobile Controls ====================

	checkMobileViewport(): void {
		const wasMobile = this.isMobile;
		this.isMobile = window.innerWidth < 768;

		if (wasMobile && !this.isMobile) {
			this.isMobileDrawerOpen = false;
		}
	}

	toggleMobileDrawer(): void {
		this.isMobileDrawerOpen = !this.isMobileDrawerOpen;
		this.invalidateMapSize();
	}

	closeMobileDrawer(): void {
		this.isMobileDrawerOpen = false;
		this.invalidateMapSize();
	}

	private invalidateMapSize(): void {
		setTimeout(() => {
			if (this.map) {
				this.map.invalidateSize();
			}
		}, 300);
	}

	// ==================== Downloads ====================

	private startDownload(downloadType: string): void {
		this.isDownloading = true;
		this.currentDownloadType = downloadType;
		this.downloadProgress = 0;
		this.showDownloadProgressDialog = true;
		
		// Simulate initial progress
		const progressInterval = setInterval(() => {
			if (this.downloadProgress < 30 && this.isDownloading) {
				this.downloadProgress += 5;
			} else {
				clearInterval(progressInterval);
			}
		}, 200);
	}

	private completeDownload(success: boolean, message?: string): void {
		if (success) {
			this.downloadProgress = 100;
			setTimeout(() => {
				this.showDownloadProgressDialog = false;
				if (message) {
					this.showSuccessMessage(message);
				}
				this.isDownloading = false;
				this.currentDownloadType = null;
				this.downloadProgress = 0;
			}, 500);
		} else {
			this.showDownloadProgressDialog = false;
			if (message) {
				this.showErrorMessage(message);
			}
			this.isDownloading = false;
			this.currentDownloadType = null;
			this.downloadProgress = 0;
		}
	}

	downloadDzongkhagGeojson(): void {
		if (this.isDownloading) return;
		this.startDownload('Dzongkhags GeoJSON');

		this.locationDownloadService.downloadAllDzongkhagsAsGeoJson().subscribe({
			next: (geoJson) => {
				this.downloadProgress = 50;
				setTimeout(() => {
				this.downloadFile(
					JSON.stringify(geoJson, null, 2),
					`all_dzongkhags_${new Date().toISOString().split('T')[0]}.geojson`,
					'application/json'
				);
					this.completeDownload(true, 'All Dzongkhags GeoJSON downloaded successfully');
				}, 300);
			},
			error: (error) => {
				console.error('Error downloading Dzongkhags GeoJSON:', error);
				this.completeDownload(false, 'Failed to download Dzongkhags GeoJSON file');
			},
		});
	}

	downloadDzongkhagKml(): void {
		if (this.isDownloading) return;
		this.startDownload('Dzongkhags KML');

		this.locationDownloadService.downloadAllDzongkhagsAsKml().subscribe({
			next: (kml) => {
				this.downloadProgress = 50;
				setTimeout(() => {
				this.downloadFile(
					kml,
					`all_dzongkhags_${new Date().toISOString().split('T')[0]}.kml`,
					'application/vnd.google-earth.kml+xml'
				);
					this.completeDownload(true, 'All Dzongkhags KML downloaded successfully');
				}, 300);
			},
			error: (error) => {
				console.error('Error downloading Dzongkhags KML:', error);
				this.completeDownload(false, 'Failed to download Dzongkhags KML file');
			},
		});
	}

	downloadGewogsThromdeGeojson(): void {
		if (this.isDownloading) return;
		this.startDownload('Gewogs/Thromde GeoJSON');

		this.locationDownloadService.downloadAllAZsAsGeoJson().subscribe({
			next: (geoJson) => {
				this.downloadProgress = 50;
				setTimeout(() => {
				this.downloadFile(
					JSON.stringify(geoJson, null, 2),
					`all_gewogs_thromde_${new Date().toISOString().split('T')[0]}.geojson`,
					'application/json'
				);
					this.completeDownload(true, 'All Gewogs/Thromde GeoJSON downloaded successfully');
				}, 300);
			},
			error: (error) => {
				console.error('Error downloading Gewogs/Thromde GeoJSON:', error);
				this.completeDownload(false, 'Failed to download Gewogs/Thromde GeoJSON file');
			},
		});
	}

	downloadGewogsThromdeKml(): void {
		if (this.isDownloading) return;
		this.startDownload('Gewogs/Thromde KML');

		this.locationDownloadService.downloadAllAZsAsKml().subscribe({
			next: (kml) => {
				this.downloadProgress = 50;
				setTimeout(() => {
				this.downloadFile(
					kml,
					`all_gewogs_thromde_${new Date().toISOString().split('T')[0]}.kml`,
					'application/vnd.google-earth.kml+xml'
				);
					this.completeDownload(true, 'All Gewogs/Thromde KML downloaded successfully');
				}, 300);
			},
			error: (error) => {
				console.error('Error downloading Gewogs/Thromde KML:', error);
				this.completeDownload(false, 'Failed to download Gewogs/Thromde KML file');
			},
		});
	}

	downloadChiwogsLapGeojson(): void {
		if (this.isDownloading) return;
		this.startDownload('Chiwogs/LAP GeoJSON');

		this.locationDownloadService.downloadAllSAZsAsGeoJson().subscribe({
			next: (geoJson) => {
				this.downloadProgress = 50;
				setTimeout(() => {
				this.downloadFile(
					JSON.stringify(geoJson, null, 2),
					`all_chiwogs_lap_${new Date().toISOString().split('T')[0]}.geojson`,
					'application/json'
				);
					this.completeDownload(true, 'All Chiwogs/LAP GeoJSON downloaded successfully');
				}, 300);
			},
			error: (error) => {
				console.error('Error downloading Chiwogs/LAP GeoJSON:', error);
				this.completeDownload(false, 'Failed to download Chiwogs/LAP GeoJSON file');
			},
		});
	}

	downloadChiwogsLapKml(): void {
		if (this.isDownloading) return;
		this.startDownload('Chiwogs/LAP KML');

		this.locationDownloadService.downloadAllSAZsAsKml().subscribe({
			next: (kml) => {
				this.downloadProgress = 50;
				setTimeout(() => {
				this.downloadFile(
					kml,
					`all_chiwogs_lap_${new Date().toISOString().split('T')[0]}.kml`,
					'application/vnd.google-earth.kml+xml'
				);
					this.completeDownload(true, 'All Chiwogs/LAP KML downloaded successfully');
				}, 300);
			},
			error: (error) => {
				console.error('Error downloading Chiwogs/LAP KML:', error);
				this.completeDownload(false, 'Failed to download Chiwogs/LAP KML file');
			},
		});
	}

	downloadEAsGeojson(): void {
		if (this.isDownloading) return;
		this.startDownload('Enumeration Areas GeoJSON');

		this.locationDownloadService.downloadAllEAsAsGeoJson().subscribe({
			next: (geoJson) => {
				this.downloadProgress = 50;
				setTimeout(() => {
				this.downloadFile(
					JSON.stringify(geoJson, null, 2),
					`all_enumeration_areas_${new Date().toISOString().split('T')[0]}.geojson`,
					'application/json'
				);
					this.completeDownload(true, 'All Enumeration Areas GeoJSON downloaded successfully');
				}, 300);
			},
			error: (error) => {
				console.error('Error downloading Enumeration Areas GeoJSON:', error);
				this.completeDownload(false, 'Failed to download Enumeration Areas GeoJSON file');
			},
		});
	}

	downloadEAsKml(): void {
		if (this.isDownloading) return;
		this.startDownload('Enumeration Areas KML');

		this.locationDownloadService.downloadAllEAsAsKml().subscribe({
			next: (kml) => {
				this.downloadProgress = 50;
				setTimeout(() => {
				this.downloadFile(
					kml,
					`all_enumeration_areas_${new Date().toISOString().split('T')[0]}.kml`,
					'application/vnd.google-earth.kml+xml'
				);
					this.completeDownload(true, 'All Enumeration Areas KML downloaded successfully');
				}, 300);
			},
			error: (error) => {
				console.error('Error downloading Enumeration Areas KML:', error);
				this.completeDownload(false, 'Failed to download Enumeration Areas KML file');
			},
		});
	}

	// ==================== National Viewer CSV Downloads ====================

	downloadNationalViewerDzongkhags(): void {
		if (this.isDownloading) return;
		this.startDownload('Dzongkhags CSV');

		this.annualStatisticsDownloadService.downloadNationalViewerDzongkhags().subscribe({
			next: (csv) => {
				this.downloadProgress = 50;
				setTimeout(() => {
				this.downloadFile(
					csv,
					`national_viewer_dzongkhags_${new Date().toISOString().split('T')[0]}.csv`,
					'text/csv'
				);
					this.completeDownload(true, 'All Dzongkhags CSV downloaded successfully');
				}, 300);
			},
			error: (error) => {
				console.error('Error downloading national viewer dzongkhags CSV:', error);
				this.completeDownload(false, 'Failed to download All Dzongkhags CSV file');
			},
		});
	}

	downloadNationalViewerDzongkhagGewogThromde(): void {
		if (this.isDownloading) return;
		this.startDownload('Dzongkhag → Gewog/Thromde CSV');

		this.annualStatisticsDownloadService.downloadNationalViewerDzongkhagGewogThromde().subscribe({
			next: (csv) => {
				this.downloadProgress = 50;
				setTimeout(() => {
				this.downloadFile(
					csv,
					`national_viewer_dzongkhag_gewog_thromde_${new Date().toISOString().split('T')[0]}.csv`,
					'text/csv'
				);
					this.completeDownload(true, 'Dzongkhag → Gewog/Thromde CSV downloaded successfully');
				}, 300);
			},
			error: (error) => {
				console.error('Error downloading national viewer dzongkhag-gewog-thromde CSV:', error);
				this.completeDownload(false, 'Failed to download Dzongkhag → Gewog/Thromde CSV file');
			},
		});
	}

	downloadNationalViewerDzongkhagChiwogLap(): void {
		if (this.isDownloading) return;
		this.startDownload('Dzongkhag → Chiwog/LAP CSV');

		this.annualStatisticsDownloadService.downloadNationalViewerDzongkhagChiwogLap().subscribe({
			next: (csv) => {
				this.downloadProgress = 50;
				setTimeout(() => {
				this.downloadFile(
					csv,
					`national_viewer_dzongkhag_chiwog_lap_${new Date().toISOString().split('T')[0]}.csv`,
					'text/csv'
				);
					this.completeDownload(true, 'Dzongkhag → Chiwog/LAP CSV downloaded successfully');
				}, 300);
			},
			error: (error) => {
				console.error('Error downloading national viewer dzongkhag-chiwog-lap CSV:', error);
				this.completeDownload(false, 'Failed to download Dzongkhag → Chiwog/LAP CSV file');
			},
		});
	}

	downloadNationalViewerFullHierarchy(): void {
		if (this.isDownloading) return;
		this.startDownload('National Sampling Frame Data CSV');

		this.annualStatisticsDownloadService.downloadNationalViewerFullHierarchy().subscribe({
			next: (csv) => {
				this.downloadProgress = 50;
				setTimeout(() => {
				this.downloadFile(
					csv,
					`national_viewer_full_hierarchy_${new Date().toISOString().split('T')[0]}.csv`,
					'text/csv'
				);
					this.completeDownload(true, 'National Sampling Frame Data CSV downloaded successfully');
				}, 300);
			},
			error: (error) => {
				console.error('Error downloading national viewer full hierarchy CSV:', error);
				this.completeDownload(false, 'Failed to download National Sampling Frame Data CSV file');
			},
		});
	}

	downloadRuralFullHierarchyForNationalViewer(): void {
		if (this.isDownloading) return;
		this.startDownload('Rural Sampling Frame Data CSV');

		this.annualStatisticsDownloadService.downloadRuralFullHierarchyForNationalViewer().subscribe({
			next: (csv) => {
				this.downloadProgress = 50;
				setTimeout(() => {
				this.downloadFile(
					csv,
					`national_viewer_rural_full_hierarchy_${new Date().toISOString().split('T')[0]}.csv`,
					'text/csv'
				);
					this.completeDownload(true, 'Rural Sampling Frame Data CSV downloaded successfully');
				}, 300);
			},
			error: (error) => {
				console.error('Error downloading rural full hierarchy CSV:', error);
				this.completeDownload(false, 'Failed to download Rural Sampling Frame Data CSV file');
			},
		});
	}

	downloadUrbanFullHierarchyForNationalViewer(): void {
		if (this.isDownloading) return;
		this.startDownload('Urban Sampling Frame Data CSV');

		this.annualStatisticsDownloadService.downloadUrbanFullHierarchyForNationalViewer().subscribe({
			next: (csv) => {
				this.downloadProgress = 50;
				setTimeout(() => {
				this.downloadFile(
					csv,
					`national_viewer_urban_full_hierarchy_${new Date().toISOString().split('T')[0]}.csv`,
					'text/csv'
				);
					this.completeDownload(true, 'Urban Sampling Frame Data CSV downloaded successfully');
				}, 300);
			},
			error: (error) => {
				console.error('Error downloading urban full hierarchy CSV:', error);
				this.completeDownload(false, 'Failed to download Urban Sampling Frame Data CSV file');
			},
		});
	}

	openDownloadDialog(): void {
		this.showDownloadDialog = true;
		// Reset options
		this.downloadOptions = {
			includeAZ: false,
			includeSAZ: false,
		};
	}

	closeDownloadDialog(): void {
		this.showDownloadDialog = false;
	}

	openStatisticsDownloadDialog(): void {
		this.showStatisticsDownloadDialog = true;
		// Reset options
		this.statisticsDownloadOptions = {
			includeAZ: false,
			includeSAZ: false,
		};
	}

	closeStatisticsDownloadDialog(): void {
		this.showStatisticsDownloadDialog = false;
	}

	downloadNationalStatisticsCSV(): void {
		if (this.isDownloading) return;
		
		// Use downloadOptions if dialog is open, otherwise use statisticsDownloadOptions
		const options = this.showDownloadDialog ? this.downloadOptions : this.statisticsDownloadOptions;
		const { includeAZ, includeSAZ } = options;
		
		// Validate: includeSAZ requires includeAZ
		if (includeSAZ && !includeAZ) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Invalid Options',
				detail: 'Sub-Administrative Zones can only be included if Administrative Zones are included.',
				life: 3000,
			});
			return;
		}

		this.startDownload('National Statistics CSV');

		this.annualStatisticsDownloadService
			.downloadNationalStats(undefined, includeAZ, includeSAZ)
			.subscribe({
				next: (csv) => {
					this.downloadProgress = 50;
					setTimeout(() => {
					// Build filename with options
					let filename = 'national_annual_statistics';
					if (includeAZ) {
						filename += '_with_az';
					}
					if (includeSAZ) {
						filename += '_with_saz';
					}
					filename += `_${new Date().toISOString().split('T')[0]}.csv`;

					this.downloadFile(csv, filename, 'text/csv');
						this.completeDownload(true, 'National annual statistics CSV downloaded successfully');
					if (this.showDownloadDialog) {
						this.closeDownloadDialog();
					} else {
						this.closeStatisticsDownloadDialog();
					}
					}, 300);
				},
				error: (error) => {
					console.error('Error downloading national statistics CSV:', error);
					this.completeDownload(false, 'Failed to download national statistics CSV file');
				},
			});
	}

	downloadNationalStatisticsExcel(): void {
		if (this.isDownloading) return;
		
		const { includeAZ, includeSAZ } = this.downloadOptions;
		
		// Validate: includeSAZ requires includeAZ
		if (includeSAZ && !includeAZ) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Invalid Options',
				detail: 'Sub-Administrative Zones can only be included if Administrative Zones are included.',
				life: 3000,
			});
			return;
		}

		this.startDownload('National Statistics Excel');

		this.annualStatisticsDownloadService
			.downloadNationalStats(undefined, includeAZ, includeSAZ)
			.subscribe({
				next: (csv) => {
					this.downloadProgress = 50;
					setTimeout(() => {
					// Convert CSV to Excel format
					const excelContent = this.convertCsvToExcel(csv);
					
					// Build filename with options
					let filename = 'national_annual_statistics';
					if (includeAZ) {
						filename += '_with_az';
					}
					if (includeSAZ) {
						filename += '_with_saz';
					}
					filename += `_${new Date().toISOString().split('T')[0]}.xlsx`;

					this.downloadFile(excelContent, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
						this.completeDownload(true, 'National annual statistics Excel downloaded successfully');
					this.closeDownloadDialog();
					}, 300);
				},
				error: (error) => {
					console.error('Error downloading national statistics Excel:', error);
					this.completeDownload(false, 'Failed to download national statistics Excel file');
				},
			});
	}

	private convertCsvToExcel(csv: string): string {
		// Parse CSV with proper handling of quoted fields
		const lines = csv.split('\n');
		if (lines.length === 0) return '';

		// Parse CSV line properly handling quoted fields
		const parseCsvLine = (line: string): string[] => {
			const result: string[] = [];
			let current = '';
			let inQuotes = false;

			for (let i = 0; i < line.length; i++) {
				const char = line[i];
				if (char === '"') {
					if (inQuotes && line[i + 1] === '"') {
						current += '"';
						i++; // Skip next quote
					} else {
						inQuotes = !inQuotes;
					}
				} else if (char === ',' && !inQuotes) {
					result.push(current.trim());
					current = '';
				} else {
					current += char;
				}
			}
			result.push(current.trim());
			return result;
		};

		// Create XML structure for Excel (Excel 2003 XML format)
		let xml = '<?xml version="1.0"?>\n';
		xml += '<?mso-application progid="Excel.Sheet"?>\n';
		xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
		xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
		xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
		xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
		xml += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';
		xml += '<Worksheet ss:Name="Statistics">\n';
		xml += '<Table>\n';

		lines.forEach((line) => {
			if (line.trim()) {
				const cells = parseCsvLine(line);
				xml += '<Row>\n';
				cells.forEach((cell) => {
					const cellValue = cell.replace(/^"|"$/g, ''); // Remove surrounding quotes
					// Check if it's a number (integer or decimal)
					const numValue = Number(cellValue);
					const isNumber = !isNaN(numValue) && cellValue !== '' && cellValue.trim() !== '';
					
					xml += '<Cell>\n';
					if (isNumber) {
						xml += `<Data ss:Type="Number">${cellValue}</Data>\n`;
					} else {
						xml += `<Data ss:Type="String">${this.escapeXml(cellValue)}</Data>\n`;
					}
					xml += '</Cell>\n';
				});
				xml += '</Row>\n';
			}
		});

		xml += '</Table>\n';
		xml += '</Worksheet>\n';
		xml += '</Workbook>';

		return xml;
	}

	private escapeXml(unsafe: string): string {
		return unsafe
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;');
	}

	private downloadFile(content: string, filename: string, mimeType: string): void {
		const blob = new Blob([content], { type: mimeType });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		window.URL.revokeObjectURL(url);
	}

	private showSuccessMessage(detail: string): void {
		this.messageService.add({
			severity: 'success',
			summary: 'Download Complete',
			detail,
			life: 3000,
		});
	}

	private showErrorMessage(detail: string): void {
		this.messageService.add({
			severity: 'error',
			summary: 'Download Failed',
			detail,
			life: 3000,
		});
	}

	// ==================== Utility ====================

	trackByDzongkhagId(index: number, item: DzongkhagStats): number {
		return item.dzongkhagId;
	}

	getPercentage(value: number, total: number): string {
		if (!total) return '0';
		return ((value / total) * 100).toFixed(1);
	}

	getPercentageValue(value: number, total: number): number {
		if (!total) return 0;
		return (value / total) * 100;
	}
}
