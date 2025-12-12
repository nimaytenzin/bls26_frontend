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
import { AdminZoneAnnualStatsDataService } from '../../../../core/dataservice/annual-statistics/admin-zone-annual-stats/admin-zone-annual-stats.dataservice';
import { LocationDownloadService } from '../../../../core/dataservice/downloads/location.download.service';
import { MessageService } from 'primeng/api';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';

interface AdminZoneStats {
	id: number;
	name: string;
	type: string;
	areaCode: string;
	totalHouseholds: number;
	totalEnumerationAreas: number;
}

@Component({
	selector: 'app-public-dzongkhag-data-viewer',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './public-dzongkhag-data-viewer.component.html',
	styleUrls: ['./public-dzongkhag-data-viewer.component.css'],
	providers: [MessageService],
})
export class PublicDzongkhagDataViewerComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	@ViewChild('mapContainer', { static: false })
	private mapContainerRef?: ElementRef<HTMLDivElement>;

	dzongkhagId!: number;
	dzongkhag: any = null;
	loading = true;
	error: string | null = null;

	// Data
	adminZones: AdminZoneStats[] = [];
	adminZoneBoundaries: any = null;

	// Statistics (only Households and EAs for public)
	stats = {
		totalHouseholds: 0,
		totalEnumerationAreas: 0,
		totalAdminZones: 0,
		totalGewogs: 0,
		totalThromdes: 0,
	};

	// UI State
	activeMainTab: 'overview' | 'gewogs-thromdes' = 'overview';

	// Map visualization mode (only households and EAs for public)
	mapVisualizationMode: 'households' | 'enumerationAreas' = 'households';

	// Map
	private map?: L.Map;
	private baseLayer?: L.TileLayer;
	private currentGeoJSONLayer?: L.GeoJSON;
	selectedBasemapId = 'positron';
	basemapCategories: Record<
		string,
		{ label: string; basemaps: BasemapConfig[] }
	> = {};

	// Lifecycle flags
	private isViewReady = false;
	private isDataReady = false;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private basemapService: BasemapService,
		private colorScaleService: MapFeatureColorService,
		private adminZoneAnnualStatsDataService: AdminZoneAnnualStatsDataService,
		private locationDownloadService: LocationDownloadService,
		private dzongkhagService: DzongkhagDataService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		this.dzongkhagId = Number(this.route.snapshot.paramMap.get('id'));

		// Initialize basemap categories from service
		this.basemapCategories = this.basemapService.getBasemapCategories();

		// Load dzongkhag info
		this.loadDzongkhagInfo();
		this.loadData();
	}

	ngAfterViewInit() {
		this.isViewReady = true;
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
	 * Load dzongkhag basic information
	 */
	loadDzongkhagInfo() {
		this.dzongkhagService.getDzongkhagById(this.dzongkhagId, false).subscribe({
			next: (dzongkhag) => {
				this.dzongkhag = dzongkhag;
			},
			error: (error) => {
				console.error('Error loading dzongkhag info:', error);
			},
		});
	}

	/**
	 * Load all dzongkhag data
	 */
	loadData() {
		this.loading = true;
		this.error = null;

		// Load admin zone stats GeoJSON - contains boundaries and statistics
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
							type: feature.properties.type,
							areaCode: feature.properties.areaCode,
							totalHouseholds: feature.properties.totalHouseholds || 0,
							totalEnumerationAreas: feature.properties.eaCount || 0,
						}));

						// Calculate statistics from the loaded data
						this.calculateStatistics();
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
	 * Calculate statistics from loaded admin zones (only Households and EAs)
	 */
	calculateStatistics() {
		this.stats = {
			totalHouseholds: 0,
			totalEnumerationAreas: 0,
			totalAdminZones: this.adminZones.length,
			totalGewogs: 0,
			totalThromdes: 0,
		};

		this.adminZones.forEach((zone) => {
			const isUrban = zone.type === 'Thromde';

			// Households
			this.stats.totalHouseholds += zone.totalHouseholds || 0;

			// Enumeration Areas
			this.stats.totalEnumerationAreas += zone.totalEnumerationAreas || 0;

			// Admin zone types
			if (isUrban) {
				this.stats.totalThromdes += 1;
			} else {
				this.stats.totalGewogs += 1;
			}
		});
	}

	/**
	 * Attempt to initialize map when both view and data are ready
	 */
	attemptInitializeMap() {
		if (this.isViewReady && this.isDataReady && !this.map) {
			this.initializeMap();
		}
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
				zoom: 7,
				layers: this.baseLayer ? [this.baseLayer] : [],
				zoomControl: false,
			});

			console.log('Map initialized successfully');

			// Load admin zone boundaries if data is ready
			if (this.adminZoneBoundaries) {
				this.loadAdminZoneBoundaries();
			}
		} catch (error) {
			console.error('Error initializing map:', error);
		}
	}

	/**
	 * Load administrative zone boundaries on map
	 */
	loadAdminZoneBoundaries() {
		if (!this.adminZoneBoundaries || !this.map) return;

		if (this.currentGeoJSONLayer) {
			this.map.removeLayer(this.currentGeoJSONLayer);
		}

		console.log('Loading admin zone GeoJSON data with statistics');

		this.currentGeoJSONLayer = L.geoJSON(this.adminZoneBoundaries as any, {
			style: (feature: any) => this.getFeatureStyle(feature),
			onEachFeature: (feature: any, layer) =>
				this.onEachFeature(feature, layer),
		});

		this.currentGeoJSONLayer.addTo(this.map);
		this.map.fitBounds(this.currentGeoJSONLayer.getBounds());
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

		// Get values based on visualization mode
		const values = this.adminZones.map((zone) => {
			if (this.mapVisualizationMode === 'households') {
				return zone.totalHouseholds;
			} else {
				return zone.totalEnumerationAreas;
			}
		});

		const minValue = Math.min(...values);
		const maxValue = Math.max(...values);

		let currentValue: number;
		if (this.mapVisualizationMode === 'households') {
			currentValue = props.totalHouseholds || 0;
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
	}

	/**
	 * Add popup and interactions to each feature
	 */
	private onEachFeature(feature: any, layer: L.Layer): void {
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
				${props.name || 'Unknown'}
			</div>
		`;

		if (layer instanceof L.Polygon) {
			const bounds = layer.getBounds();
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

		const popupContent = `
			<div class="p-2 min-w-[280px]">
				<h3 class="font-bold text-lg mb-3 text-slate-900">${props.name || 'Unknown'}</h3>
				<div class="space-y-0 text-sm mb-3">
					<!-- Households -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Households: </span>
						<span class="font-bold" style="color: #67A4CA">${(props.totalHouseholds || 0).toLocaleString()}</span>
					</div>

					<!-- Enumeration Areas -->
					<div class="py-2 border-b border-slate-200">
						<span class="font-semibold text-slate-700">Enumeration Areas: </span>
						<span class="font-bold" style="color: #67A4CA">${props.eaCount || 0}</span>
					</div>
				</div>
				<button 
					id="view-adminzone-${props.id}" 
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
			const button = document.getElementById(`view-adminzone-${props.id}`);
			if (button) {
				button.addEventListener('click', () => {
					if (props.id) {
						this.viewAdministrativeZone(props.id);
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
	 * Switch map visualization mode and reload boundaries
	 */
	switchVisualizationMode(
		mode: 'households' | 'enumerationAreas'
	): void {
		this.mapVisualizationMode = mode;
		if (this.map && this.adminZoneBoundaries) {
			this.loadAdminZoneBoundaries();
		}
	}

	/**
	 * Navigate to administrative zone data viewer (public route)
	 */
	viewAdministrativeZone(adminZoneId: number): void {
		this.router.navigate([
			'/public/data-viewer/administrative-zone',
			this.dzongkhagId,
			adminZoneId,
		]);
	}

	/**
	 * Navigate back to national viewer
	 */
	goBack(): void {
		this.router.navigate(['/public/data-viewer/national']);
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
	 * Get CSS gradient string for continuous color scale legend
	 */
	getLegendGradient(): string {
		if (!this.adminZones || this.adminZones.length === 0) {
			return '';
		}

		const { min, max } = this.getLegendMinMax();
		return this.colorScaleService.getLegendGradient(min, max, 'vertical');
	}

	/**
	 * Get legend break values with labels for continuous gradient
	 */
	getLegendBreaks(): { value: number; label: string; position: number }[] {
		if (!this.adminZones || this.adminZones.length === 0) {
			return [];
		}

		const { min, max } = this.getLegendMinMax();
		return this.colorScaleService.getLegendBreaks(min, max, 5);
	}

	/**
	 * Get min and max values for current visualization mode
	 */
	getLegendMinMax(): { min: number; max: number } {
		if (!this.adminZones || this.adminZones.length === 0) {
			return { min: 0, max: 0 };
		}

		const values = this.adminZones.map((zone) => {
			if (this.mapVisualizationMode === 'households') {
				return zone.totalHouseholds;
			} else {
				return zone.totalEnumerationAreas;
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
	 * TrackBy function for admin zone list
	 */
	trackByAdminZoneId(index: number, item: AdminZoneStats): number {
		return item.id;
	}

	/**
	 * Download Administrative Zones as GeoJSON
	 */
	downloadAdminZonesGeojson(): void {
		if (!this.dzongkhagId) return;
		this.locationDownloadService
			.downloadAZsByDzongkhagAsGeoJson(this.dzongkhagId)
			.subscribe({
				next: (geoJson) => {
					const dataStr = JSON.stringify(geoJson, null, 2);
					const blob = new Blob([dataStr], { type: 'application/json' });
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `${this.dzongkhag?.name || 'dzongkhag'}_admin_zones_${new Date().toISOString().split('T')[0]}.geojson`;
					link.click();
					window.URL.revokeObjectURL(url);
					this.messageService.add({
						severity: 'success',
						summary: 'Download Complete',
						detail: 'Administrative Zones GeoJSON downloaded successfully',
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
	 * Download Administrative Zones as KML
	 */
	downloadAdminZonesKml(): void {
		if (!this.dzongkhagId) return;
		this.locationDownloadService
			.downloadAZsByDzongkhagAsKml(this.dzongkhagId)
			.subscribe({
				next: (kml) => {
					const blob = new Blob([kml], {
						type: 'application/vnd.google-earth.kml+xml',
					});
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `${this.dzongkhag?.name || 'dzongkhag'}_admin_zones_${new Date().toISOString().split('T')[0]}.kml`;
					link.click();
					window.URL.revokeObjectURL(url);
					this.messageService.add({
						severity: 'success',
						summary: 'Download Complete',
						detail: 'Administrative Zones KML downloaded successfully',
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
}

