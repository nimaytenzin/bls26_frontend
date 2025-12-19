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
		totalEnumerationAreas: 0,
		totalHouseholds: 0,
	};

	// Mobile State
	isMobile: boolean = false;
	isMobileDrawerOpen: boolean = false;
	isMobileControlsCollapsed: boolean = true;

	// Map
	private map?: L.Map;
	private baseLayer?: L.TileLayer;
	private currentGeoJSONLayer?: L.GeoJSON;
	selectedBasemapId = 'positron';
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
		private messageService: MessageService,
		private publicPageSettingsService: PublicPageSettingsService
	) {}

	ngOnInit(): void {
		this.initializeSettings();
		this.initializeResponsive();
		this.loadDzongkhagStatistics();
	}

	ngAfterViewInit(): void {
		setTimeout(() => {
			this.initializeMap();
			if (this.map && this.geoJsonData) {
				this.loadDzongkhagBoundaries();
			}
		}, 100);
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	// ==================== Initialization ====================

	private initializeSettings(): void {
		this.basemapCategories = this.basemapService.getBasemapCategories();
		const settings = this.publicPageSettingsService.getSettings();
		this.mapVisualizationMode = settings.mapVisualizationMode;
		this.selectedBasemapId = settings.selectedBasemapId;
	}

	private initializeResponsive(): void {
		this.checkMobileViewport();
		this.resizeListener = () => this.checkMobileViewport();
		window.addEventListener('resize', this.resizeListener);
	}

	private initializeMap(): void {
		if (!this.mapContainerRef?.nativeElement) {
			setTimeout(() => this.initializeMap(), 200);
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
					totalEnumerationAreas: props.eaCount,
					totalHouseholds: props.totalHouseholds,
				};
			});

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
		const minValue = Math.min(...values);
		const maxValue = Math.max(...values);
		const currentValue = this.getFeatureValue(props);

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

	private getFeatureValues(): number[] {
		return this.dzongkhagFeatures
			.filter((f) => f.properties.hasData)
			.map((f) => this.getFeatureValue(f.properties));
	}

	private getFeatureValue(props: DzongkhagStatsFeature['properties']): number {
		return this.mapVisualizationMode === 'households'
			? props.totalHouseholds
			: props.eaCount;
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
			const button = document.getElementById(`view-dzongkhag-${props.id}`);
			if (button) {
				button.addEventListener('click', () => {
					if (props.id) {
						this.viewDzongkhag(props.id);
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
						<span class="font-semibold text-slate-700">Households: </span>
						<span class="font-bold" style="color: #67A4CA">${props.totalHouseholds.toLocaleString()}</span>
					</div>
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Enumeration Areas: </span>
						<span class="font-bold" style="color: #67A4CA">${props.eaCount}</span>
					</div>
				</div>
			`
			: '<p class="text-sm text-gray-500 mb-3">No data available for this dzongkhag.</p>';

		return `
			<div class="p-2 min-w-[280px]">
				<h3 class="font-bold text-lg mb-3 text-slate-900">${props.name} Dzongkhag</h3>
				${dataSection}
				<button 
					id="view-dzongkhag-${props.id}" 
					class="w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded transition shadow-sm"
				>
					View Details
				</button>
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
		return this.colorScaleService.getLegendGradient(min, max, 'vertical');
	}

	getLegendBreaks(): { value: number; label: string; position: number }[] {
		if (!this.dzongkhagFeatures?.length) {
			return [];
		}

		const { min, max } = this.getLegendMinMax();
		return this.colorScaleService.getLegendBreaks(min, max, 5);
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

	downloadDzongkhagGeojson(): void {
		this.locationDownloadService.downloadAllDzongkhagsAsGeoJson().subscribe({
			next: (geoJson) => {
				this.downloadFile(
					JSON.stringify(geoJson, null, 2),
					`all_dzongkhags_${new Date().toISOString().split('T')[0]}.geojson`,
					'application/json'
				);
				this.showSuccessMessage('All Dzongkhags GeoJSON downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading Dzongkhags GeoJSON:', error);
				this.showErrorMessage('Failed to download Dzongkhags GeoJSON file');
			},
		});
	}

	downloadDzongkhagKml(): void {
		this.locationDownloadService.downloadAllDzongkhagsAsKml().subscribe({
			next: (kml) => {
				this.downloadFile(
					kml,
					`all_dzongkhags_${new Date().toISOString().split('T')[0]}.kml`,
					'application/vnd.google-earth.kml+xml'
				);
				this.showSuccessMessage('All Dzongkhags KML downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading Dzongkhags KML:', error);
				this.showErrorMessage('Failed to download Dzongkhags KML file');
			},
		});
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
