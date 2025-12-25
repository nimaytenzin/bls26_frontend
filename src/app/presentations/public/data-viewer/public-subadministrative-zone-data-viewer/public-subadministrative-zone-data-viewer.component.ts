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
import {
	MapFeatureColorService,
	ColorScaleType,
} from '../../../../core/utility/map-feature-color.service';
import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { LocationDownloadService } from '../../../../core/dataservice/downloads/location.download.service';
import { AnnualStatisticsDownloadService } from '../../../../core/dataservice/downloads/annual-statistics-download.service';
import { MessageService } from 'primeng/api';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { PublicPageSettingsService } from '../../../../core/services/public-page-settings.service';
import { DownloadService } from '../../../../core/utility/download.service';
import { EAAnnualStatsDataService } from '../../../../core/dataservice/household-listings/ea-annual-stats/ea-annual-stats.dataservice';

interface EnumerationAreaStats {
	id: number;
	name: string;
	areaCode: string;
	totalHouseholds: number;
}

@Component({
	selector: 'app-public-subadministrative-zone-data-viewer',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './public-subadministrative-zone-data-viewer.component.html',
	styleUrls: ['./public-subadministrative-zone-data-viewer.component.css'],
	providers: [MessageService],
})
export class PublicSubadministrativeZoneDataViewerComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	@ViewChild('mapContainer', { static: false })
	private mapContainerRef?: ElementRef<HTMLDivElement>;

	dzongkhagId!: number;
	administrativeZoneId!: number;
	subAdministrativeZoneId!: number;
	subAdministrativeZone: any = null;
	administrativeZone: any = null;
	dzongkhag: any = null;
	loading = true;
	error: string | null = null;
	noDataFound = false;

	// Data
	enumerationAreas: EnumerationAreaStats[] = [];
	enumerationAreaBoundaries: any = null;
	subAdministrativeZoneBoundary: any = null;

	// Statistics (only Households and EAs for public)
	stats = {
		totalHouseholds: 0,
		totalEnumerationAreas: 0,
	};

	// UI State
	activeMainTab: 'overview' | 'enumeration-areas' = 'overview';

	// Map visualization mode (only households for public)
	mapVisualizationMode: 'households' = 'households';

	// Mobile State
	isMobile: boolean = false;
	isMobileDrawerOpen: boolean = false;
	isMobileControlsCollapsed: boolean = true;

	// Map
	private map?: L.Map;
	private baseLayer?: L.TileLayer;
	private currentGeoJSONLayer?: L.GeoJSON;
	private subAdminZoneLayer?: L.GeoJSON;
	selectedBasemapId = 'positron';
	selectedColorScale: ColorScaleType = 'blue';
	basemapCategories: Record<
		string,
		{ label: string; basemaps: BasemapConfig[] }
	> = {};

	// Lifecycle flags
	private isViewReady = false;
	private isDataReady = false;
	private resizeListener?: () => void;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private basemapService: BasemapService,
		private colorScaleService: MapFeatureColorService,
		private enumerationAreaService: EnumerationAreaDataService,
		private locationDownloadService: LocationDownloadService,
		private annualStatisticsDownloadService: AnnualStatisticsDownloadService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private dzongkhagService: DzongkhagDataService,
		private messageService: MessageService,
		private publicPageSettingsService: PublicPageSettingsService,
		private downloadService: DownloadService,
		private eaAnnualStatsService: EAAnnualStatsDataService
	) {}

	ngOnInit() {
		this.administrativeZoneId = Number(
			this.route.snapshot.paramMap.get('administrativeZoneId')
		);
		this.subAdministrativeZoneId = Number(
			this.route.snapshot.paramMap.get('id')
		);

		// Initialize basemap categories from service
		this.basemapCategories = this.basemapService.getBasemapCategories();

		// Initialize settings (basemap and color scale)
		const settings = this.publicPageSettingsService.getSettings();
		this.selectedBasemapId = settings.selectedBasemapId;
		this.selectedColorScale = settings.colorScale || 'blue';

		// Initialize responsive
		this.initializeResponsive();

		// Load parent info
		this.loadParentInfo();
		this.loadData();
	}

	ngAfterViewInit() {
		this.isViewReady = true;
		setTimeout(() => {
			this.attemptInitializeMap();
		}, 0);
	}

	ngOnDestroy() {
		this.cleanup();
	}

	/**
	 * Initialize responsive behavior
	 */
	private initializeResponsive(): void {
		this.checkMobileViewport();
		this.resizeListener = () => this.checkMobileViewport();
		window.addEventListener('resize', this.resizeListener);
	}

	/**
	 * Cleanup resources
	 */
	private cleanup(): void {
		if (this.resizeListener) {
			window.removeEventListener('resize', this.resizeListener);
		}
		if (this.map) {
			this.map.remove();
		}
	}

	/**
	 * Load parent information (dzongkhag and administrative zone)
	 */
	loadParentInfo() {
		this.subAdministrativeZoneService
			.findSubAdministrativeZoneById(this.subAdministrativeZoneId, false, false)
			.subscribe({
				next: (subAdminZone) => {
					this.subAdministrativeZone = subAdminZone;
					if (subAdminZone.administrativeZone) {
						this.administrativeZone = subAdminZone.administrativeZone;
						this.administrativeZoneId = subAdminZone.administrativeZone.id;
						if (subAdminZone.administrativeZone.dzongkhag) {
							this.dzongkhag = subAdminZone.administrativeZone.dzongkhag;
							this.dzongkhagId = subAdminZone.administrativeZone.dzongkhag.id;
						}
					}
				},
				error: (error) => {
					console.error('Error loading sub-administrative zone info:', error);
				},
			});
	}

	/**
	 * Load all sub-administrative zone data
	 */
	loadData() {
		this.loading = true;
		this.error = null;
		this.noDataFound = false;

		// Load enumeration areas with GeoJSON
		this.enumerationAreaService
			.getEnumerationAreaGeojsonBySubAdministrativeZone(
				this.subAdministrativeZoneId
			)
			.subscribe({
				next: (data) => {
					console.log('Loaded enumeration area GeoJSON:', data);

					if (data && data.features && data.features.length > 0) {
						this.enumerationAreaBoundaries = data;

						// Load statistics for each enumeration area
						this.loadEnumerationAreaStatistics(data.features);
					} else {
						// No enumeration areas found
						this.noDataFound = true;
						this.loadSubAdministrativeZoneBoundary();
					}
				},
				error: (error) => {
					console.error('Error loading enumeration areas:', error);
					const errorMessage =
						error?.error?.message || error?.message || '';
					if (
						error?.status === 404 &&
						errorMessage.includes('No Enumeration Areas found')
					) {
						this.noDataFound = true;
						this.loadSubAdministrativeZoneBoundary();
					} else {
						this.error =
							'Failed to load sub-administrative zone data. Please try again.';
						this.loading = false;
					}
				},
			});
	}

	/**
	 * Load enumeration area statistics
	 */
	loadEnumerationAreaStatistics(features: any[]) {
		const statsPromises = features.map((feature) => {
			const eaId = feature.properties.id;
			return this.eaAnnualStatsService
				.findEAAnnualStatsByEnumerationArea(eaId)
				.toPromise()
				.then((stats) => {
					// Get the latest year's statistics
					if (stats && stats.length > 0) {
						const latestStats = stats[stats.length - 1];
						return {
							id: eaId,
							name: feature.properties.name || 'Unknown',
							areaCode: feature.properties.areaCode || '',
							totalHouseholds: latestStats.totalHouseholds || 0,
						};
					}
					return {
						id: eaId,
						name: feature.properties.name || 'Unknown',
						areaCode: feature.properties.areaCode || '',
						totalHouseholds: 0,
					};
				})
				.catch((error) => {
					console.error(
						`Error loading stats for EA ${eaId}:`,
						error
					);
					return {
						id: eaId,
						name: feature.properties.name || 'Unknown',
						areaCode: feature.properties.areaCode || '',
						totalHouseholds: 0,
					};
				});
		});

		Promise.all(statsPromises).then((statsArray) => {
			this.enumerationAreas = statsArray;
			this.calculateStatistics();
			this.loading = false;
			this.isDataReady = true;
			setTimeout(() => {
				this.attemptInitializeMap();
			}, 0);
		});
	}

	/**
	 * Load sub-administrative zone boundary when no enumeration areas exist
	 */
	loadSubAdministrativeZoneBoundary() {
		this.subAdministrativeZoneService
			.findOneAsGeoJson(this.subAdministrativeZoneId)
			.subscribe({
				next: (geojson) => {
					this.subAdministrativeZoneBoundary = geojson;
					this.loading = false;
					this.isDataReady = true;
					setTimeout(() => {
						this.attemptInitializeMap();
					}, 0);
				},
				error: (error) => {
					this.error =
						'Failed to load sub-administrative zone boundary. Please try again.';
					this.loading = false;
				},
			});
	}

	/**
	 * Calculate statistics from loaded enumeration areas
	 */
	calculateStatistics() {
		if (this.noDataFound || !this.enumerationAreas || this.enumerationAreas.length === 0) {
			this.stats = {
				totalHouseholds: 0,
				totalEnumerationAreas: 0,
			};
			return;
		}

		this.stats = {
			totalHouseholds: 0,
			totalEnumerationAreas: this.enumerationAreas.length,
		};

		this.enumerationAreas.forEach((ea) => {
			this.stats.totalHouseholds += ea.totalHouseholds || 0;
		});
	}

	/**
	 * Attempt to initialize map when both view and data are ready
	 */
	attemptInitializeMap() {
		if (this.isViewReady && this.isDataReady && this.mapContainerRef) {
			this.initializeMap();
		}
	}

	/**
	 * Initialize Leaflet map
	 */
	initializeMap() {
		if (!this.mapContainerRef || this.map) return;

		try {
			this.map = L.map(this.mapContainerRef.nativeElement, {
				center: [27.5, 90.5],
				zoom: 8,
				zoomControl: false,
			});

			// Add zoom control to bottom right
			L.control.zoom({ position: 'bottomright' }).addTo(this.map);

			// Set basemap
			this.switchBasemap();

			// Load boundaries
			if (
				this.enumerationAreaBoundaries ||
				this.subAdministrativeZoneBoundary
			) {
				this.loadBoundaries();
			}
		} catch (error) {
			console.error('Error initializing map:', error);
		}
	}

	/**
	 * Load boundaries on map
	 */
	loadBoundaries() {
		if (!this.map) return;

		// Remove existing layers
		if (this.currentGeoJSONLayer) {
			this.map.removeLayer(this.currentGeoJSONLayer);
		}
		if (this.subAdminZoneLayer) {
			this.map.removeLayer(this.subAdminZoneLayer);
		}

		// Load sub-administrative zone boundary first (as background)
		if (this.subAdministrativeZoneBoundary) {
			this.subAdminZoneLayer = L.geoJSON(
				this.subAdministrativeZoneBoundary as any,
				{
					style: () => ({
						fillColor: '#e2e8f0',
						fillOpacity: 0.2,
						color: '#94a3b8',
						weight: 2,
						opacity: 1,
					}),
				}
			);
			this.subAdminZoneLayer.addTo(this.map);
		}

		// If we have enumeration area boundaries, use those
		if (this.enumerationAreaBoundaries) {
			this.currentGeoJSONLayer = L.geoJSON(
				this.enumerationAreaBoundaries as any,
				{
					style: (feature: any) => this.getFeatureStyle(feature),
					onEachFeature: (feature: any, layer) =>
						this.onEachFeature(feature, layer),
				}
			);

			this.currentGeoJSONLayer.addTo(this.map);
			this.map.fitBounds(this.currentGeoJSONLayer.getBounds());
		}
		// If no enumeration areas but we have sub-administrative zone boundary, show that
		else if (this.subAdministrativeZoneBoundary && this.noDataFound) {
			this.map.fitBounds(this.subAdminZoneLayer!.getBounds());
		}
	}

	/**
	 * Get feature style based on data
	 */
	private getFeatureStyle(feature: any): L.PathOptions {
		const props = feature.properties;

		if (!props) {
			return {
				fillColor: '#cccccc',
				fillOpacity: 0.3,
				color: '#666666',
				weight: 1,
			};
		}

		// Get values for households
		const values = this.enumerationAreas.map((ea) => ea.totalHouseholds);

		const minValue = Math.min(...values);
		const maxValue = Math.max(...values);

		const currentValue = props.totalHouseholds || 0;

		// Get color based on value using color scale service
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

	/**
	 * Add popup and interactions to each feature
	 */
	private onEachFeature(feature: any, layer: L.Layer): void {
		const props = feature.properties;
		const eaStats = this.enumerationAreas.find((ea) => ea.id === props.id);

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
				${props.name || 'Unknown'}
			</div>
		`;

		if (layer instanceof L.Polygon) {
			const bounds = layer.getBounds();
			const center = bounds.getCenter();

			const label = L.tooltip({
				permanent: true,
				direction: 'center',
				className: 'enumeration-area-label',
				opacity: 1,
			})
				.setLatLng(center)
				.setContent(labelContent);

			layer.bindTooltip(label);
		}

		const popupContent = `
			<div class="p-2 min-w-[280px]">
				<h3 class="font-bold text-lg mb-3 text-slate-900">${props.name || 'Unknown'}</h3>
				<div class="space-y-0 text-sm mb-3">
					<!-- Households -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Households: </span>
						<span class="font-bold" style="color: #67A4CA">${(eaStats?.totalHouseholds || 0).toLocaleString()}</span>
					</div>
				</div>
				<button 
					id="download-kml-${props.id}" 
					class="w-full px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold rounded transition shadow-sm flex items-center justify-center gap-2"
					title="Download KML"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
					</svg>
					Download KML
				</button>
			</div>
		`;

		const popup = L.popup().setContent(popupContent);
		layer.bindPopup(popup);

		// Add click listener for the download button after popup opens
		layer.on('popupopen', () => {
			const downloadButton = document.getElementById(`download-kml-${props.id}`);
			if (downloadButton) {
				downloadButton.addEventListener('click', () => {
					if (props.id) {
						this.downloadEnumerationAreaKML(
							props.id,
							props.name || 'EnumerationArea'
						);
					}
				});
			}
		});

		// Hover effects
		layer.on('mouseover', () => {
			if (layer instanceof L.Path) {
				layer.setStyle({
					weight: 2,
					opacity: 1,
				});
			}
		});

		layer.on('mouseout', () => {
			if (layer instanceof L.Path) {
				const style = this.getFeatureStyle(feature);
				layer.setStyle(style);
			}
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
	 * Switch map visualization mode (only households supported for this component)
	 */
	switchVisualizationMode(mode: 'households'): void {
		this.mapVisualizationMode = mode;
		if (this.map && this.enumerationAreaBoundaries) {
			this.loadBoundaries();
		}

		if (this.isMobile) {
			this.closeMobileDrawer();
		}
	}

	/**
	 * Check if viewport is mobile
	 */
	checkMobileViewport(): void {
		this.isMobile = window.innerWidth < 768;
		if (!this.isMobile) {
			this.isMobileDrawerOpen = false;
		}
		this.invalidateMapSize();
	}

	/**
	 * Toggle mobile drawer
	 */
	toggleMobileDrawer(): void {
		this.isMobileDrawerOpen = !this.isMobileDrawerOpen;
	}

	/**
	 * Close mobile drawer
	 */
	closeMobileDrawer(): void {
		this.isMobileDrawerOpen = false;
	}

	/**
	 * Invalidate map size (useful after drawer toggle)
	 */
	private invalidateMapSize(): void {
		if (this.map) {
			setTimeout(() => {
				this.map!.invalidateSize();
			}, 300);
		}
	}

	/**
	 * Navigate back to administrative zone viewer
	 */
	goBackToAdministrativeZone(): void {
		this.router.navigate([
			'administrative-zone',
			this.dzongkhagId,
			this.administrativeZoneId,
		], {
			relativeTo: this.route.parent || this.route,
		});
	}

	/**
	 * Get percentage value
	 */
	getPercentage(value: number, total: number): string {
		if (total === 0) return '0%';
		return `${((value / total) * 100).toFixed(1)}%`;
	}

	/**
	 * Get percentage value as number
	 */
	getPercentageValue(value: number, total: number): number {
		if (total === 0) return 0;
		return (value / total) * 100;
	}

	/**
	 * Get legend gradient
	 */
	getLegendGradient(): string {
		if (!this.enumerationAreas || this.enumerationAreas.length === 0) {
			return '';
		}

		const { min, max } = this.getLegendMinMax();
		return this.colorScaleService.getLegendGradient(
			min,
			max,
			'vertical',
			this.selectedColorScale
		);
	}

	/**
	 * Get legend breaks
	 */
	getLegendBreaks(): { value: number; label: string; position: number }[] {
		if (!this.enumerationAreas || this.enumerationAreas.length === 0) {
			return [];
		}

		const values = this.enumerationAreas.map((ea) => ea.totalHouseholds);
		const minValue = Math.min(...values);
		const maxValue = Math.max(...values);

		return [
			{ value: minValue, label: minValue.toLocaleString(), position: 0 },
			{
				value: (minValue + maxValue) / 2,
				label: Math.round((minValue + maxValue) / 2).toLocaleString(),
				position: 50,
			},
			{ value: maxValue, label: maxValue.toLocaleString(), position: 100 },
		];
	}

	/**
	 * Get legend min/max
	 */
	getLegendMinMax(): { min: number; max: number } {
		if (!this.enumerationAreas || this.enumerationAreas.length === 0) {
			return { min: 0, max: 0 };
		}

		const values = this.enumerationAreas.map((ea) => ea.totalHouseholds);
		return {
			min: Math.min(...values),
			max: Math.max(...values),
		};
	}

	/**
	 * Get legend title
	 */
	getLegendTitle(): string {
		return 'Households';
	}

	/**
	 * Track by enumeration area ID
	 */
	trackByEnumerationAreaId(
		index: number,
		item: EnumerationAreaStats
	): number {
		return item.id;
	}

	/**
	 * Download enumeration areas GeoJSON
	 */
	downloadEnumerationAreasGeojson(): void {
		if (!this.enumerationAreaBoundaries) {
			this.showErrorMessage(
				'Enumeration area boundaries not available for download'
			);
			return;
		}

		this.locationDownloadService
			.downloadEAsBySubAdministrativeZoneAsGeoJson(
				this.subAdministrativeZoneId
			)
			.subscribe({
				next: (geojson: any) => {
					const filename = `enumeration_areas_${this.subAdministrativeZoneId}_${new Date().toISOString().split('T')[0]}.geojson`;
					this.downloadFile(
						JSON.stringify(geojson, null, 2),
						filename,
						'application/geo+json'
					);
					this.showSuccessMessage('Enumeration areas GeoJSON downloaded');
				},
				error: (error: any) => {
					console.error('Error downloading GeoJSON:', error);
					this.showErrorMessage('Failed to download GeoJSON file');
				},
			});
	}

	/**
	 * Download enumeration areas KML
	 */
	downloadEnumerationAreasKml(): void {
		if (!this.enumerationAreaBoundaries) {
			this.showErrorMessage(
				'Enumeration area boundaries not available for download'
			);
			return;
		}

		try {
			this.downloadService.downloadKML({
				data: this.enumerationAreaBoundaries,
				filename: `enumeration_areas_${this.subAdministrativeZoneId}_${new Date().toISOString().split('T')[0]}.kml`,
				layerName: this.subAdministrativeZone?.name || 'Enumeration Areas',
			});

			this.showSuccessMessage('Enumeration areas KML downloaded');
		} catch (error) {
			console.error('Error downloading KML:', error);
			this.showErrorMessage('Failed to download KML file');
		}
	}

	/**
	 * Download single enumeration area KML file
	 */
	downloadEnumerationAreaKML(eaId: number, eaName: string): void {
		if (!this.enumerationAreaBoundaries || !this.enumerationAreaBoundaries.features) {
			this.messageService.add({
				severity: 'error',
				summary: 'Download Failed',
				detail: 'Enumeration area boundaries not available',
				life: 3000,
			});
			return;
		}

		// Find the specific feature for this enumeration area
		const feature = this.enumerationAreaBoundaries.features.find(
			(f: any) => f.properties.id === eaId
		);

		if (!feature) {
			this.messageService.add({
				severity: 'error',
				summary: 'Download Failed',
				detail: 'Enumeration area not found',
				life: 3000,
			});
			return;
		}

		// Create a GeoJSON with just this feature
		const featureGeoJSON = {
			type: 'FeatureCollection',
			features: [feature],
		};

		// Generate filename
		const sanitizedName = eaName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		const filename = `${sanitizedName}_${eaId}_${new Date().toISOString().split('T')[0]}.kml`;

		// Download the KML
		try {
			this.downloadService.downloadKML({
				data: featureGeoJSON,
				filename: filename,
				layerName: eaName,
			});

			this.messageService.add({
				severity: 'success',
				summary: 'Download Complete',
				detail: `${eaName} KML downloaded successfully`,
				life: 3000,
			});
		} catch (error) {
			console.error('Error downloading KML:', error);
			this.messageService.add({
				severity: 'error',
				summary: 'Download Failed',
				detail: 'Failed to download KML file',
				life: 3000,
			});
		}
	}

	/**
	 * Download sub-administrative zone statistics CSV
	 */
	downloadSubAdministrativeZoneStatisticsCSV(): void {
		if (!this.subAdministrativeZoneId) return;

		this.annualStatisticsDownloadService
			.downloadSubAdministrativeZoneStats(this.subAdministrativeZoneId)
			.subscribe({
				next: (csv) => {
					const filename = `sub_administrative_zone_${this.subAdministrativeZoneId}_annual_statistics_${new Date().toISOString().split('T')[0]}.csv`;
					this.downloadFile(csv, filename, 'text/csv');
					this.showSuccessMessage('Statistics CSV downloaded');
				},
				error: (error) => {
					console.error('Error downloading statistics CSV:', error);
					this.showErrorMessage('Failed to download statistics CSV');
				},
			});
	}

	/**
	 * Download file helper
	 */
	private downloadFile(content: string, filename: string, mimeType: string): void {
		const blob = new Blob([content], { type: mimeType });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	}

	/**
	 * Show success message
	 */
	private showSuccessMessage(detail: string): void {
		this.messageService.add({
			severity: 'success',
			summary: 'Success',
			detail,
			life: 3000,
		});
	}

	/**
	 * Show error message
	 */
	private showErrorMessage(detail: string): void {
		this.messageService.add({
			severity: 'error',
			summary: 'Error',
			detail,
			life: 3000,
		});
	}
}

