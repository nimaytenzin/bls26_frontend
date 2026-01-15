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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { SubAdminZoneAnnualStatsDataService } from '../../../../core/dataservice/annual-statistics/sub-admin-zone-annual-stats/sub-admin-zone-annual-stats.dataservice';
import { LocationDownloadService } from '../../../../core/dataservice/downloads/location.download.service';
import { AnnualStatisticsDownloadService } from '../../../../core/dataservice/downloads/annual-statistics-download.service';
import { MessageService } from 'primeng/api';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { PublicPageSettingsService } from '../../../../core/services/public-page-settings.service';
import { DownloadService } from '../../../../core/utility/download.service';

interface SubAdminZoneStats {
	id: number;
	name: string;
	type: string;
	areaCode: string;
	totalHouseholds: number;
	totalEnumerationAreas: number;
}

@Component({
	selector: 'app-public-administrative-zone-data-viewer',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule, PrimeNgModules],
	templateUrl: './public-administrative-zone-data-viewer.component.html',
	styleUrls: ['./public-administrative-zone-data-viewer.component.css'],
	providers: [MessageService],
})
export class PublicAdministrativeZoneDataViewerComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	@ViewChild('mapContainer', { static: false })
	private mapContainerRef?: ElementRef<HTMLDivElement>;

	dzongkhagId!: number;
	administrativeZoneId!: number;
	administrativeZone: any = null;
	dzongkhag: any = null;
	loading = true;
	error: string | null = null;
	noDataFound = false;

	// Data
	subAdminZones: SubAdminZoneStats[] = [];
	subAdminZoneBoundaries: any = null;
	administrativeZoneBoundary: any = null;

	// Statistics (only Households and EAs for public)
	stats = {
		totalHouseholds: 0,
		totalEnumerationAreas: 0,
		totalSubAdminZones: 0,
		totalChiwogs: 0,
		totalLAPs: 0,
	};

	// UI State
	activeMainTab: 'overview' | 'chiwogs-laps' = 'overview';

	// Map visualization mode (only households and EAs for public)
	mapVisualizationMode: 'households' | 'enumerationAreas' = 'households';

	// Download dialog
	showDownloadDialog = false;

	// Mobile State
	isMobile: boolean = false;
	isMobileDrawerOpen: boolean = false;
	isMobileControlsCollapsed: boolean = true;

	// Breadcrumb
	home: any = {
		label: 'Home',
		url: '/'
	};
	items: any[] = [];

	// Quick Navigation Panel
	allDzongkhags: any[] = [];
	quickNavAdminZones: any[] = [];
	quickNavSubAdminZones: any[] = [];
	selectedDzongkhag: any = null;
	selectedAdminZone: any = null;
	selectedSubAdminZone: any = null;
	loadingLocations = false;

	// Map
	private map?: L.Map;
	private baseLayer?: L.TileLayer;
	private currentGeoJSONLayer?: L.GeoJSON;
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
		private subAdminZoneAnnualStatsDataService: SubAdminZoneAnnualStatsDataService,
		private locationDownloadService: LocationDownloadService,
		private annualStatisticsDownloadService: AnnualStatisticsDownloadService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private messageService: MessageService,
		private publicPageSettingsService: PublicPageSettingsService,
		private downloadService: DownloadService,
		private dzongkhagService: DzongkhagDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService
	) {}

	ngOnInit() {
		this.dzongkhagId = Number(this.route.snapshot.paramMap.get('dzongkhagId'));
		this.administrativeZoneId = Number(
			this.route.snapshot.paramMap.get('id')
		);

		// Initialize basemap categories from service
		this.basemapCategories = this.basemapService.getBasemapCategories();

		// Initialize responsive
		this.initializeResponsive();

		// Load settings from API (public endpoint, no auth required)
		this.publicPageSettingsService.getPublicSettings().subscribe({
			next: (settings) => {
				this.selectedBasemapId = settings.selectedBasemapId;
				this.selectedColorScale = (settings.colorScale as ColorScaleType) || 'blue';
				
				// Initialize map after settings are loaded
				if (this.isViewReady) {
					setTimeout(() => {
						this.attemptInitializeMap();
					}, 100);
				}
			},
			error: (error) => {
				console.error('Error loading public page settings:', error);
				// Use default values on error
				const defaultSettings = this.publicPageSettingsService.getDefaultSettings();
				this.selectedBasemapId = defaultSettings.selectedBasemapId;
				this.selectedColorScale = defaultSettings.colorScale as ColorScaleType;
			},
		});

		// Load administrative zone info
		this.loadAdministrativeZoneInfo();
		this.loadData();
		// Load location lists for quick navigation
		this.loadLocationLists();
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
	 * Load administrative zone basic information
	 */
	loadAdministrativeZoneInfo() {
		this.administrativeZoneService
			.findAdministrativeZoneById(this.administrativeZoneId)
			.subscribe({
				next: (adminZone) => {
					this.administrativeZone = adminZone;
					if (adminZone.dzongkhag) {
						this.dzongkhag = adminZone.dzongkhag;
					}
					// Update breadcrumb items
					this.updateBreadcrumbItems();
				},
				error: (error) => {
					console.error('Error loading administrative zone info:', error);
				},
			});
	}

	/**
	 * Load all administrative zone data
	 */
	loadData() {
		this.loading = true;
		this.error = null;
		this.noDataFound = false;

		// Load sub-admin zone stats GeoJSON - contains boundaries and statistics
		this.subAdminZoneAnnualStatsDataService
			.getAllCurrentSAZStatsGeojsonByAdministrativeZone(
				this.administrativeZoneId
			)
			.subscribe({
				next: (data) => {
					console.log('Loaded sub-admin zone stats GeoJSON:', data);

					// Extract metadata if available
					if (data.metadata) {
						if (!this.administrativeZone) {
							this.administrativeZone = {
								id: data.metadata.administrativeZoneId,
								name: data.metadata.administrativeZoneName,
								type: data.metadata.administrativeZoneType,
							};
						}
						if (!this.dzongkhag && data.metadata.dzongkhagId) {
							this.dzongkhag = {
								id: data.metadata.dzongkhagId,
								name: data.metadata.dzongkhagName,
							};
						}
					}

					// Extract sub-admin zones and boundaries from combined GeoJSON stats
					if (data && data.features && data.features.length > 0) {
						// Extract boundaries as GeoJSON
						this.subAdminZoneBoundaries = data;
						// Extract sub-admin zone data from features
						this.subAdminZones = data.features.map((feature: any) => ({
							id: feature.properties.id,
							name: feature.properties.name,
							type: feature.properties.type,
							areaCode: feature.properties.areaCode,
							totalHouseholds: feature.properties.totalHouseholds || 0,
							totalEnumerationAreas: feature.properties.eaCount || 0,
						}));

						// Calculate statistics from the loaded data
						this.calculateStatistics();
					} else {
						// No sub-admin zones found, but administrative zone exists
						this.noDataFound = true;
						this.loadAdministrativeZoneBoundary();
					}

					this.loading = false;
					this.isDataReady = true;

					// Use setTimeout to ensure DOM is updated after *ngIf="!loading"
					setTimeout(() => {
						this.attemptInitializeMap();
					}, 0);
				},
				error: (error) => {
					console.error('Error loading administrative zone data:', error);

					// Check if this is a "No Sub-Administrative Zones found" error
					const errorMessage =
						error?.error?.message || error?.message || '';
					if (
						error?.status === 404 &&
						errorMessage.includes('No Sub-Administrative Zones found')
					) {
						// This is not a real error - just no data available
						this.noDataFound = true;
						this.loadAdministrativeZoneBoundary();
					} else {
						// This is a real error
						this.error =
							'Failed to load administrative zone data. Please try again.';
						this.loading = false;
					}
				},
			});
	}

	/**
	 * Load administrative zone boundary when no sub-admin zones exist
	 */
	loadAdministrativeZoneBoundary() {
		// Try to get administrative zone with geometry
		this.administrativeZoneService
			.findAdministrativeZoneById(this.administrativeZoneId)
			.subscribe({
				next: (adminZone) => {
					if (adminZone.geom) {
						// Create GeoJSON feature from geometry
						this.administrativeZoneBoundary = {
							type: 'FeatureCollection',
							features: [
								{
									type: 'Feature',
									geometry: adminZone.geom,
									properties: {
										id: adminZone.id,
										name: adminZone.name,
										type: adminZone.type,
									},
								},
							],
						};
					}
					this.loading = false;
					this.isDataReady = true;

					setTimeout(() => {
						this.attemptInitializeMap();
					}, 0);
				},
				error: (error) => {
					console.error('Error loading administrative zone boundary:', error);
					this.error =
						'Failed to load administrative zone data. Please try again.';
					this.loading = false;
				},
			});
	}

	/**
	 * Calculate statistics from loaded sub-admin zones (only Households and EAs)
	 */
	calculateStatistics() {
		if (this.noDataFound || !this.subAdminZones || this.subAdminZones.length === 0) {
			this.stats = {
				totalHouseholds: 0,
				totalEnumerationAreas: 0,
				totalSubAdminZones: 0,
				totalChiwogs: 0,
				totalLAPs: 0,
			};
			return;
		}

		this.stats = {
			totalHouseholds: 0,
			totalEnumerationAreas: 0,
			totalSubAdminZones: this.subAdminZones.length,
			totalChiwogs: 0,
			totalLAPs: 0,
		};

		this.subAdminZones.forEach((zone) => {
			const isLAP = zone.type === 'LAP';

			// Households
			this.stats.totalHouseholds += zone.totalHouseholds || 0;

			// Enumeration Areas
			this.stats.totalEnumerationAreas += zone.totalEnumerationAreas || 0;

			// Sub-admin zone types
			if (isLAP) {
				this.stats.totalLAPs += 1;
			} else {
				this.stats.totalChiwogs += 1;
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

		const container = this.mapContainerRef.nativeElement;

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

			// Invalidate size to ensure proper rendering
			setTimeout(() => {
				if (this.map) {
					this.map.invalidateSize();
				}
			}, 100);

			// Load boundaries if data is ready
			if (this.subAdminZoneBoundaries || this.administrativeZoneBoundary) {
				this.loadSubAdminZoneBoundaries();
			}
		} catch (error) {
			console.error('Error initializing map:', error);
		}
	}

	/**
	 * Load sub-administrative zone boundaries on map
	 */
	loadSubAdminZoneBoundaries() {
		if (!this.map) return;

		if (this.currentGeoJSONLayer) {
			this.map.removeLayer(this.currentGeoJSONLayer);
		}

		// If we have sub-admin zone boundaries, use those
		if (this.subAdminZoneBoundaries) {
			console.log('Loading sub-admin zone GeoJSON data with statistics');

			this.currentGeoJSONLayer = L.geoJSON(
				this.subAdminZoneBoundaries as any,
				{
					style: (feature: any) => this.getFeatureStyle(feature),
					onEachFeature: (feature: any, layer) =>
						this.onEachFeature(feature, layer),
				}
			);

			this.currentGeoJSONLayer.addTo(this.map);
			this.map.fitBounds(this.currentGeoJSONLayer.getBounds());
		}
		// If no sub-admin zones but we have administrative zone boundary, show that
		else if (this.administrativeZoneBoundary && this.noDataFound) {
			console.log(
				'Loading administrative zone boundary (no sub-admin zones available)'
			);

			this.currentGeoJSONLayer = L.geoJSON(
				this.administrativeZoneBoundary as any,
				{
					style: () => ({
						fillColor: '#e2e8f0',
						fillOpacity: 0.3,
						color: '#94a3b8',
						weight: 2,
						opacity: 1,
					}),
					onEachFeature: (feature: any, layer) => {
						// Add simple popup with administrative zone name
						const props = feature.properties;
						const popupContent = `
							<div class="p-2 min-w-[200px]">
								<h3 class="font-bold text-lg mb-2 text-slate-900">${this.administrativeZone?.name || 'Administrative Zone'}</h3>
								<p class="text-sm text-slate-600">No sub-administrative zone data available</p>
							</div>
						`;
						layer.bindPopup(popupContent);
					},
				}
			);

			this.currentGeoJSONLayer.addTo(this.map);
			this.map.fitBounds(this.currentGeoJSONLayer.getBounds());
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

		// Get values based on visualization mode
		const values = this.subAdminZones.map((zone) => {
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
				className: 'sub-admin-zone-label',
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
				<div class="flex gap-2">
					<button 
						id="view-saz-${props.id}" 
						class="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded transition shadow-sm"
					>
						View Details
					</button>
				</div>
			</div>
		`;

		const popup = L.popup().setContent(popupContent);
		layer.bindPopup(popup);

		// Add click listener for the button after popup opens
		layer.on('popupopen', () => {
			const viewButton = document.getElementById(`view-saz-${props.id}`);
			if (viewButton) {
				viewButton.addEventListener('click', () => {
					if (props.id) {
						this.viewSubAdministrativeZone(props.id);
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
		if (this.map && this.subAdminZoneBoundaries) {
			this.loadSubAdminZoneBoundaries();
		}

		if (this.isMobile) {
			this.closeMobileDrawer();
		}
	}

	// ==================== Mobile Controls ====================

	/**
	 * Check if viewport is mobile
	 */
	checkMobileViewport(): void {
		const wasMobile = this.isMobile;
		this.isMobile = window.innerWidth < 768;

		if (wasMobile && !this.isMobile) {
			this.isMobileDrawerOpen = false;
		}
	}

	/**
	 * Toggle mobile drawer
	 */
	toggleMobileDrawer(): void {
		this.isMobileDrawerOpen = !this.isMobileDrawerOpen;
		this.invalidateMapSize();
	}

	/**
	 * Close mobile drawer
	 */
	closeMobileDrawer(): void {
		this.isMobileDrawerOpen = false;
		this.invalidateMapSize();
	}

	/**
	 * Invalidate map size after drawer animations
	 */
	private invalidateMapSize(): void {
		setTimeout(() => {
			if (this.map) {
				this.map.invalidateSize();
			}
		}, 300);
	}

	/**
	 * Update breadcrumb items
	 */
	updateBreadcrumbItems(): void {
		this.items = [
			{
				label: (this.dzongkhag?.name || 'Dzongkhag') + ' Dzongkhag',
				url: '/dzongkhag/' + this.dzongkhagId
			},
			{
				label: (this.administrativeZone?.name || 'Gewog/Thromde') + ' (' + (this.administrativeZone?.type || '') + ')',
			}
		];
	}

	/**
	 * Navigate back to dzongkhag viewer with the same dzongkhag ID
	 */
	goBack(): void {
		this.router.navigate(['dzongkhag', this.dzongkhagId], {
			relativeTo: this.route.parent || this.route,
		});
	}

	/**
	 * Navigate to home page
	 */
	navigateToHome(): void {
		this.router.navigate(['/']);
	}

	/**
	 * Load location lists for quick navigation
	 */
	loadLocationLists(): void {
		this.loadingLocations = true;
		// Load all dzongkhags
		this.dzongkhagService.findAllDzongkhags(false, false, false, false).subscribe({
			next: (dzongkhags) => {
				// Sort dzongkhags alphabetically by name (ascending)
				this.allDzongkhags = (dzongkhags || []).sort((a, b) => {
					const nameA = (a.name || '').toLowerCase();
					const nameB = (b.name || '').toLowerCase();
					return nameA.localeCompare(nameB);
				});
				// Set current dzongkhag as selected
				if (this.dzongkhag) {
					this.selectedDzongkhag = this.dzongkhag;
					this.loadAdminZonesForQuickNav(this.dzongkhag.id);
				}
				this.loadingLocations = false;
			},
			error: (error) => {
				console.error('Error loading dzongkhags:', error);
				this.loadingLocations = false;
			},
		});
	}

	/**
	 * Load administrative zones for quick navigation
	 */
	loadAdminZonesForQuickNav(dzongkhagId: number): void {
		this.administrativeZoneService.findAdministrativeZonesByDzongkhag(dzongkhagId).subscribe({
			next: (adminZones) => {
				this.quickNavAdminZones = adminZones || [];
				// Set current admin zone if available
				if (this.administrativeZone) {
					this.selectedAdminZone = this.quickNavAdminZones.find(az => az.id === this.administrativeZone.id) || this.administrativeZone;
					if (this.selectedAdminZone) {
						this.loadSubAdminZonesForQuickNav(this.selectedAdminZone.id);
					}
				}
			},
			error: (error) => {
				console.error('Error loading administrative zones:', error);
				this.quickNavAdminZones = [];
			},
		});
	}

	/**
	 * Load sub-administrative zones for quick navigation
	 */
	loadSubAdminZonesForQuickNav(administrativeZoneId: number): void {
		this.subAdministrativeZoneService.findSubAdministrativeZonesByAdministrativeZone(administrativeZoneId).subscribe({
			next: (subAdminZones) => {
				this.quickNavSubAdminZones = subAdminZones || [];
			},
			error: (error) => {
				console.error('Error loading sub-administrative zones:', error);
				this.quickNavSubAdminZones = [];
			},
		});
	}

	/**
	 * Handle quick navigation dzongkhag change
	 */
	onQuickNavDzongkhagChange(event: any): void {
		const selectedDzongkhag = event.value;
		if (selectedDzongkhag) {
			this.router.navigate(['dzongkhag', selectedDzongkhag.id], {
				relativeTo: this.route.parent || this.route,
			});
		}
	}

	/**
	 * Handle quick navigation administrative zone change
	 */
	onQuickNavAdminZoneChange(event: any): void {
		const selectedAdminZone = event.value;
		if (selectedAdminZone && this.selectedDzongkhag) {
			this.loadSubAdminZonesForQuickNav(selectedAdminZone.id);
			this.router.navigate([
				'administrative-zone',
				this.selectedDzongkhag.id,
				selectedAdminZone.id,
			], {
				relativeTo: this.route.parent || this.route,
			});
		}
	}

	/**
	 * Handle quick navigation sub-administrative zone change
	 */
	onQuickNavSubAdminZoneChange(event: any): void {
		const selectedSubAdminZone = event.value;
		if (selectedSubAdminZone && this.selectedAdminZone) {
			const adminZoneId = selectedSubAdminZone.administrativeZoneId || this.selectedAdminZone.id;
			this.router.navigate([
				'sub-administrative-zone',
				adminZoneId,
				selectedSubAdminZone.id,
			], {
				relativeTo: this.route.parent || this.route,
			});
		}
	}

	/**
	 * Navigate to sub-administrative zone viewer
	 */
	viewSubAdministrativeZone(subAdminZoneId: number): void {
		this.router.navigate([
			'sub-administrative-zone',
			this.administrativeZoneId,
			subAdminZoneId,
		], {
			relativeTo: this.route.parent || this.route,
		});
	}

	/**
	 * Handle dzongkhag dropdown change
	 */
	onDzongkhagDropdownChange(): void {
		if (this.selectedDzongkhag) {
			this.loadAdminZonesForQuickNav(this.selectedDzongkhag.id);
			// Reset admin zone and sub-admin zone selections
			this.selectedAdminZone = null;
			this.selectedSubAdminZone = null;
			this.quickNavSubAdminZones = [];
		} else {
			this.selectedAdminZone = null;
			this.selectedSubAdminZone = null;
			this.quickNavAdminZones = [];
			this.quickNavSubAdminZones = [];
		}
	}

	/**
	 * Handle admin zone dropdown change
	 */
	onAdminZoneDropdownChange(): void {
		if (this.selectedAdminZone) {
			this.loadSubAdminZonesForQuickNav(this.selectedAdminZone.id);
			// Reset sub-admin zone selection
			this.selectedSubAdminZone = null;
		} else {
			this.selectedSubAdminZone = null;
			this.quickNavSubAdminZones = [];
		}
	}

	/**
	 * Check if navigation is possible
	 */
	canNavigate(): boolean {
		return !!(this.selectedDzongkhag || this.selectedAdminZone || this.selectedSubAdminZone);
	}

	/**
	 * Navigate to the selected location
	 */
	navigateToSelection(): void {
		// Priority: Chiwog/LAP > Gewog/Thromde > Dzongkhag
		if (this.selectedSubAdminZone && this.selectedAdminZone) {
			// Navigate to sub-administrative zone
			const adminZoneId = this.selectedSubAdminZone.administrativeZoneId || this.selectedAdminZone.id;
			const navPath = ['sub-administrative-zone', adminZoneId, this.selectedSubAdminZone.id];
			this.messageService.add({
				severity: 'info',
				summary: 'Navigating',
				detail: `Navigating to ${this.selectedSubAdminZone.name} (${this.selectedSubAdminZone.type})`,
				life: 2000,
			});
			this.router.navigate(navPath, {
				relativeTo: this.route.parent || this.route,
			}).catch((error) => {
				this.messageService.add({
					severity: 'error',
					summary: 'Navigation Failed',
					detail: `Failed to navigate to ${this.selectedSubAdminZone.name}`,
					life: 3000,
				});
			});
		} else if (this.selectedAdminZone && this.selectedDzongkhag) {
			// Navigate to administrative zone
			const navPath = ['administrative-zone', this.selectedDzongkhag.id, this.selectedAdminZone.id];
			this.messageService.add({
				severity: 'info',
				summary: 'Navigating',
				detail: `Navigating to ${this.selectedAdminZone.name} (${this.selectedAdminZone.type})`,
				life: 2000,
			});
			this.router.navigate(navPath, {
				relativeTo: this.route.parent || this.route,
			}).catch((error) => {
				this.messageService.add({
					severity: 'error',
					summary: 'Navigation Failed',
					detail: `Failed to navigate to ${this.selectedAdminZone.name}`,
					life: 3000,
				});
			});
		} else if (this.selectedDzongkhag) {
			// Navigate to dzongkhag
			const navPath = ['dzongkhag', this.selectedDzongkhag.id];
			// Check if already on this dzongkhag
			if (this.selectedDzongkhag.id === this.dzongkhagId) {
				this.messageService.add({
					severity: 'info',
					summary: 'Already Viewing',
					detail: `You are already viewing ${this.selectedDzongkhag.name} Dzongkhag`,
					life: 2000,
				});
				return;
			}
			this.messageService.add({
				severity: 'info',
				summary: 'Navigating',
				detail: `Navigating to ${this.selectedDzongkhag.name} Dzongkhag`,
				life: 2000,
			});
			this.router.navigate(navPath, {
				relativeTo: this.route.parent || this.route,
			}).catch((error) => {
				console.error('Error navigating to dzongkhag:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Navigation Failed',
					detail: `Failed to navigate to ${this.selectedDzongkhag.name}`,
					life: 3000,
				});
			});
		} else {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Selection',
				detail: 'Please select a location to navigate to',
				life: 2000,
			});
		}
	}

	/**
	 * Navigate back to national viewer
	 */
	goBackToNational(): void {
		this.router.navigate(['/']);
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

	/**
	 * Get CSS gradient string for continuous color scale legend
	 */
	getLegendGradient(): string {
		if (!this.subAdminZones || this.subAdminZones.length === 0) {
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

	/**
	 * Get legend break values with labels for continuous gradient
	 */
	getLegendBreaks(): { value: number; label: string; position: number }[] {
		if (!this.subAdminZones || this.subAdminZones.length === 0) {
			return [];
		}

		const { min, max } = this.getLegendMinMax();
		return this.colorScaleService.getLegendBreaks(
			min,
			max,
			5,
			this.selectedColorScale
		);
	}

	/**
	 * Get min and max values for current visualization mode
	 */
	getLegendMinMax(): { min: number; max: number } {
		if (!this.subAdminZones || this.subAdminZones.length === 0) {
			return { min: 0, max: 0 };
		}

		const values = this.subAdminZones.map((zone) => {
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
	 * TrackBy function for sub-admin zone list
	 */
	trackBySubAdminZoneId(index: number, item: SubAdminZoneStats): number {
		return item.id;
	}

	/**
	 * Download Sub-Administrative Zones as GeoJSON
	 */
	downloadSubAdminZonesGeojson(): void {
		if (!this.administrativeZoneId) return;
		this.locationDownloadService
			.downloadSAZsByAdministrativeZoneAsGeoJson(this.administrativeZoneId)
			.subscribe({
				next: (geoJson) => {
					this.downloadFile(
						JSON.stringify(geoJson, null, 2),
						`${this.administrativeZone?.name || 'admin_zone'}_sub_admin_zones_${new Date().toISOString().split('T')[0]}.geojson`,
						'application/json'
					);
					this.showSuccessMessage(
						'Sub-Administrative Zones GeoJSON downloaded successfully'
					);
				},
				error: (error) => {
					console.error(
						'Error downloading Sub-Administrative Zones GeoJSON:',
						error
					);
					this.showErrorMessage(
						'Failed to download Sub-Administrative Zones GeoJSON file'
					);
				},
			});
	}

	/**
	 * Download single sub-administrative zone KML file
	 */
	downloadSubAdminZoneKML(subAdminZoneId: number, subAdminZoneName: string): void {
		if (!this.subAdminZoneBoundaries || !this.subAdminZoneBoundaries.features) {
			this.messageService.add({
				severity: 'error',
				summary: 'Download Failed',
				detail: 'Sub-administrative zone boundaries not available',
				life: 3000,
			});
			return;
		}

		// Find the specific feature for this sub-admin zone
		const feature = this.subAdminZoneBoundaries.features.find(
			(f: any) => f.properties.id === subAdminZoneId
		);

		if (!feature) {
			this.messageService.add({
				severity: 'error',
				summary: 'Download Failed',
				detail: 'Sub-administrative zone not found',
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
		const sanitizedName = subAdminZoneName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		const filename = `${sanitizedName}_${subAdminZoneId}_${new Date().toISOString().split('T')[0]}.kml`;

		// Download the KML
		try {
			this.downloadService.downloadKML({
				data: featureGeoJSON,
				filename: filename,
				layerName: subAdminZoneName,
			});

			this.messageService.add({
				severity: 'success',
				summary: 'Download Complete',
				detail: `${subAdminZoneName} KML downloaded successfully`,
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
	 * Download Sub-Administrative Zones as KML
	 */
	downloadSubAdminZonesKml(): void {
		if (!this.administrativeZoneId) return;
		this.locationDownloadService
			.downloadSAZsByAdministrativeZoneAsKml(this.administrativeZoneId)
			.subscribe({
				next: (kml) => {
					this.downloadFile(
						kml,
						`${this.administrativeZone?.name || 'admin_zone'}_sub_admin_zones_${new Date().toISOString().split('T')[0]}.kml`,
						'application/vnd.google-earth.kml+xml'
					);
					this.showSuccessMessage(
						'Sub-Administrative Zones KML downloaded successfully'
					);
				},
				error: (error) => {
					console.error('Error downloading Sub-Administrative Zones KML:', error);
					this.showErrorMessage(
						'Failed to download Sub-Administrative Zones KML file'
					);
				},
			});
	}

	/**
	 * Download Administrative Zone annual statistics as CSV
	 */
	downloadAdministrativeZoneStatisticsCSV(): void {
		if (!this.administrativeZoneId) return;

		this.annualStatisticsDownloadService
			.downloadAdministrativeZoneStats(this.administrativeZoneId)
			.subscribe({
				next: (csv) => {
					this.downloadFile(
						csv,
						`${this.administrativeZone?.name || 'admin_zone'}_annual_statistics_${new Date().toISOString().split('T')[0]}.csv`,
						'text/csv'
					);
					this.showSuccessMessage(
						'Administrative Zone annual statistics CSV downloaded successfully'
					);
				},
				error: (error) => {
					console.error(
						'Error downloading administrative zone statistics CSV:',
						error
					);
					this.showErrorMessage(
						'Failed to download administrative zone statistics CSV file'
					);
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
		link.click();
		window.URL.revokeObjectURL(url);
	}

	/**
	 * Show success message
	 */
	private showSuccessMessage(detail: string): void {
		this.messageService.add({
			severity: 'success',
			summary: 'Download Complete',
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
			summary: 'Download Failed',
			detail,
			life: 3000,
		});
	}

	// ==================== Download Dialog ====================

	openDownloadDialog(): void {
		this.showDownloadDialog = true;
	}

	closeDownloadDialog(): void {
		this.showDownloadDialog = false;
	}

	// ==================== CSV Downloads ====================

	/**
	 * Download Administrative Zone Sampling Frame as CSV
	 */
	downloadAdministrativeZoneSamplingFrame(): void {
		if (!this.administrativeZoneId) return;
		
		this.annualStatisticsDownloadService.downloadAdministrativeZoneSamplingFrame(this.administrativeZoneId).subscribe({
			next: (csv) => {
				this.downloadFile(
					csv,
					`${this.administrativeZone?.name || 'admin_zone'}_sampling_frame_${new Date().toISOString().split('T')[0]}.csv`,
					'text/csv'
				);
				this.showSuccessMessage('Administrative Zone Sampling Frame CSV downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading administrative zone sampling frame CSV:', error);
				this.showErrorMessage('Failed to download Administrative Zone Sampling Frame CSV file');
			},
		});
	}

	// ==================== GeoJSON/KML Downloads ====================

	/**
	 * Download Chiwogs as GeoJSON (only for Gewog)
	 */
	downloadChiwogsGeojson(): void {
		if (!this.administrativeZoneId || this.administrativeZone?.type !== 'Gewog') return;
		
		this.locationDownloadService.downloadChiwogsByAdministrativeZoneAsGeoJson(this.administrativeZoneId).subscribe({
			next: (geoJson) => {
				this.downloadFile(
					JSON.stringify(geoJson, null, 2),
					`${this.administrativeZone?.name || 'gewog'}_chiwogs_${new Date().toISOString().split('T')[0]}.geojson`,
					'application/json'
				);
				this.showSuccessMessage('Chiwogs GeoJSON downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading Chiwogs GeoJSON:', error);
				this.showErrorMessage('Failed to download Chiwogs GeoJSON file');
			},
		});
	}

	/**
	 * Download Chiwogs as KML (only for Gewog)
	 */
	downloadChiwogsKml(): void {
		if (!this.administrativeZoneId || this.administrativeZone?.type !== 'Gewog') return;
		
		this.locationDownloadService.downloadChiwogsByAdministrativeZoneAsKml(this.administrativeZoneId).subscribe({
			next: (kml) => {
				this.downloadFile(
					kml,
					`${this.administrativeZone?.name || 'gewog'}_chiwogs_${new Date().toISOString().split('T')[0]}.kml`,
					'application/vnd.google-earth.kml+xml'
				);
				this.showSuccessMessage('Chiwogs KML downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading Chiwogs KML:', error);
				this.showErrorMessage('Failed to download Chiwogs KML file');
			},
		});
	}

	/**
	 * Download EAs (Enumeration Areas) as GeoJSON
	 */
	downloadEAsGeojson(): void {
		if (!this.administrativeZoneId) return;
		
		this.locationDownloadService.downloadEAsByAdministrativeZoneAsGeoJsonPublic(this.administrativeZoneId).subscribe({
			next: (geoJson) => {
				this.downloadFile(
					JSON.stringify(geoJson, null, 2),
					`${this.administrativeZone?.name || 'admin_zone'}_enumeration_areas_${new Date().toISOString().split('T')[0]}.geojson`,
					'application/json'
				);
				this.showSuccessMessage('Enumeration Areas GeoJSON downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading Enumeration Areas GeoJSON:', error);
				this.showErrorMessage('Failed to download Enumeration Areas GeoJSON file');
			},
		});
	}

	/**
	 * Download EAs (Enumeration Areas) as KML
	 */
	downloadEAsKml(): void {
		if (!this.administrativeZoneId) return;
		
		this.locationDownloadService.downloadEAsByAdministrativeZoneAsKmlPublic(this.administrativeZoneId).subscribe({
			next: (kml) => {
				this.downloadFile(
					kml,
					`${this.administrativeZone?.name || 'admin_zone'}_enumeration_areas_${new Date().toISOString().split('T')[0]}.kml`,
					'application/vnd.google-earth.kml+xml'
				);
				this.showSuccessMessage('Enumeration Areas KML downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading Enumeration Areas KML:', error);
				this.showErrorMessage('Failed to download Enumeration Areas KML file');
			},
		});
	}
}

