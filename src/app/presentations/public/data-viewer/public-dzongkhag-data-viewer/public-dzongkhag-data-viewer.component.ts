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
import { Subscription } from 'rxjs';
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
import { AdminZoneAnnualStatsDataService } from '../../../../core/dataservice/annual-statistics/admin-zone-annual-stats/admin-zone-annual-stats.dataservice';
import { LocationDownloadService } from '../../../../core/dataservice/downloads/location.download.service';
import { AnnualStatisticsDownloadService } from '../../../../core/dataservice/downloads/annual-statistics-download.service';
import { MessageService } from 'primeng/api';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { PublicPageSettingsService } from '../../../../core/services/public-page-settings.service';
import { DownloadService } from '../../../../core/utility/download.service';

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
	noDataFound = false; // Flag for when no administrative zones exist but dzongkhag exists

	// Data
	adminZones: AdminZoneStats[] = [];
	adminZoneBoundaries: any = null;
	dzongkhagBoundary: any = null; // Dzongkhag boundary when no admin zones exist

	// Statistics (only Households and EAs for public)
	stats = {
		totalHouseholds: 0,
		urbanHouseholds: 0,
		ruralHouseholds: 0,
		totalEnumerationAreas: 0,
		urbanEnumerationAreas: 0,
		ruralEnumerationAreas: 0,
		totalAdminZones: 0,
		totalGewogs: 0,
		totalThromdes: 0,
	};

	// UI State
	activeMainTab: 'overview' | 'gewogs-thromdes' = 'overview';

	// Map visualization mode (only households and EAs for public)
	mapVisualizationMode: 'households' | 'enumerationAreas' = 'households';

	// Download dialog
	showDownloadDialog = false;

	// Mobile State
	isMobile: boolean = false;
	isMobileDrawerOpen: boolean = false;
	isMobileControlsCollapsed: boolean = true;

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
	private routeParamsSubscription?: Subscription;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private basemapService: BasemapService,
		private colorScaleService: MapFeatureColorService,
		private adminZoneAnnualStatsDataService: AdminZoneAnnualStatsDataService,
		private locationDownloadService: LocationDownloadService,
		private annualStatisticsDownloadService: AnnualStatisticsDownloadService,
		private dzongkhagService: DzongkhagDataService,
		private messageService: MessageService,
		private publicPageSettingsService: PublicPageSettingsService,
		private downloadService: DownloadService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService
	) {}

	ngOnInit() {
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

		// Subscribe to route parameter changes
		this.routeParamsSubscription = this.route.paramMap.subscribe((params) => {
			const newDzongkhagId = Number(params.get('id'));
			
			// Only reload if the dzongkhag ID actually changed
			if (newDzongkhagId !== this.dzongkhagId) {
				this.dzongkhagId = newDzongkhagId;
				this.onRouteParamsChanged();
			} else if (!this.dzongkhagId) {
				// Initial load
				this.dzongkhagId = newDzongkhagId;
				this.onRouteParamsChanged();
			}
		});
	}

	/**
	 * Handle route parameter changes
	 */
	private onRouteParamsChanged(): void {
		// Reset map state
		if (this.map) {
			this.map.remove();
			this.map = undefined;
		}
		if (this.currentGeoJSONLayer) {
			this.currentGeoJSONLayer = undefined;
		}
		
		// Reset data flags
		this.isDataReady = false;
		this.dzongkhag = null;
		this.adminZones = [];
		this.adminZoneBoundaries = null;
		this.dzongkhagBoundary = null;
		this.error = null;
		this.noDataFound = false;
		
		// Reset quick navigation selections
		this.selectedAdminZone = null;
		this.selectedSubAdminZone = null;
		this.quickNavAdminZones = [];
		this.quickNavSubAdminZones = [];

		// Load dzongkhag info
		this.loadDzongkhagInfo();
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
		if (this.routeParamsSubscription) {
			this.routeParamsSubscription.unsubscribe();
		}
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
	 * Load dzongkhag basic information
	 */
	loadDzongkhagInfo() {
		this.dzongkhagService.getDzongkhagById(this.dzongkhagId, false).subscribe({
			next: (dzongkhag) => {
				this.dzongkhag = dzongkhag;
				// Update quick nav selection - find in allDzongkhags or use the loaded dzongkhag
				if (this.allDzongkhags.length > 0) {
					this.selectedDzongkhag = this.allDzongkhags.find(d => d.id === dzongkhag.id) || dzongkhag;
					this.loadAdminZonesForQuickNav(dzongkhag.id);
				} else {
					// If allDzongkhags not loaded yet, set directly (will be updated when loadLocationLists completes)
					this.selectedDzongkhag = dzongkhag;
				}
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
		this.noDataFound = false;

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
					
					// Check if this is a "No Administrative Zones found" error
					const errorMessage = error?.error?.message || error?.message || '';
					if (error?.status === 404 && errorMessage.includes('No Administrative Zones found')) {
						// This is not a real error - just no data available
						this.noDataFound = true;
						this.loadDzongkhagBoundary();
					} else {
						// This is a real error
						this.error = 'Failed to load dzongkhag data. Please try again.';
						this.loading = false;
					}
				},
			});
	}

	/**
	 * Load dzongkhag boundary when no administrative zones exist
	 */
	loadDzongkhagBoundary() {
		this.dzongkhagService.getDzongkhagGeojson(this.dzongkhagId).subscribe({
			next: (geojson) => {
				this.dzongkhagBoundary = geojson;
				this.loading = false;
				this.isDataReady = true;
				
				// Initialize map with dzongkhag boundary
				setTimeout(() => {
					this.attemptInitializeMap();
				}, 0);
			},
			error: (error) => {
				console.error('Error loading dzongkhag boundary:', error);
				// If we can't even load the boundary, show error
				this.error = 'Failed to load dzongkhag data. Please try again.';
				this.loading = false;
			},
		});
	}

	/**
	 * Calculate statistics from loaded admin zones (only Households and EAs)
	 */
	calculateStatistics() {
		if (this.noDataFound || !this.adminZones || this.adminZones.length === 0) {
			this.stats = {
				totalHouseholds: 0,
				urbanHouseholds: 0,
				ruralHouseholds: 0,
				totalEnumerationAreas: 0,
				urbanEnumerationAreas: 0,
				ruralEnumerationAreas: 0,
				totalAdminZones: 0,
				totalGewogs: 0,
				totalThromdes: 0,
			};
			return;
		}

		this.stats = {
			totalHouseholds: 0,
			urbanHouseholds: 0,
			ruralHouseholds: 0,
			totalEnumerationAreas: 0,
			urbanEnumerationAreas: 0,
			ruralEnumerationAreas: 0,
			totalAdminZones: this.adminZones.length,
			totalGewogs: 0,
			totalThromdes: 0,
		};

		this.adminZones.forEach((zone) => {
			const isUrban = zone.type === 'Thromde';
			const households = zone.totalHouseholds || 0;
			const enumerationAreas = zone.totalEnumerationAreas || 0;

			// Households
			this.stats.totalHouseholds += households;
			if (isUrban) {
				this.stats.urbanHouseholds += households;
			} else {
				this.stats.ruralHouseholds += households;
			}

			// Enumeration Areas
			this.stats.totalEnumerationAreas += enumerationAreas;
			if (isUrban) {
				this.stats.urbanEnumerationAreas += enumerationAreas;
			} else {
				this.stats.ruralEnumerationAreas += enumerationAreas;
			}

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

			// Load boundaries if data is ready
			if (this.adminZoneBoundaries || this.dzongkhagBoundary) {
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
		if (!this.map) return;

		if (this.currentGeoJSONLayer) {
			this.map.removeLayer(this.currentGeoJSONLayer);
		}

		// If we have admin zone boundaries, use those
		if (this.adminZoneBoundaries) {
			console.log('Loading admin zone GeoJSON data with statistics');

			this.currentGeoJSONLayer = L.geoJSON(this.adminZoneBoundaries as any, {
				style: (feature: any) => this.getFeatureStyle(feature),
				onEachFeature: (feature: any, layer) =>
					this.onEachFeature(feature, layer),
			});

			this.currentGeoJSONLayer.addTo(this.map);
			this.map.fitBounds(this.currentGeoJSONLayer.getBounds());
		} 
		// If no admin zones but we have dzongkhag boundary, show that
		else if (this.dzongkhagBoundary && this.noDataFound) {
			console.log('Loading dzongkhag boundary (no admin zones available)');

			this.currentGeoJSONLayer = L.geoJSON(this.dzongkhagBoundary as any, {
				style: () => ({
					fillColor: '#e2e8f0',
					fillOpacity: 0.3,
					color: '#94a3b8',
					weight: 2,
					opacity: 1,
				}),
				onEachFeature: (feature: any, layer) => {
					// Add simple popup with dzongkhag name
					const props = feature.properties;
					const popupContent = `
						<div class="p-2 min-w-[200px]">
							<h3 class="font-bold text-lg mb-2 text-slate-900">${this.dzongkhag?.name || 'Dzongkhag'}</h3>
							<p class="text-sm text-slate-600">No administrative zone data available</p>
						</div>
					`;
					layer.bindPopup(popupContent);
				},
			});

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
				<div class="flex gap-2">
					<button 
						id="view-adminzone-${props.id}" 
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
			const viewButton = document.getElementById(`view-adminzone-${props.id}`);
			if (viewButton) {
				viewButton.addEventListener('click', () => {
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
	 * Navigate to administrative zone data viewer (public route)
	 */
	viewAdministrativeZone(adminZoneId: number): void {
		this.router.navigate([
			'administrative-zone',
			this.dzongkhagId,
			adminZoneId,
		], {
			relativeTo: this.route.parent || this.route,
		});
	}

	/**
	 * Navigate back to national viewer
	 */
	goBack(): void {
		console.log('Going back to national viewer');
		this.router.navigate(['/']);
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
				// Set current dzongkhag as selected - find it in the list or use the loaded dzongkhag
				if (this.dzongkhag) {
					this.selectedDzongkhag = this.allDzongkhags.find(d => d.id === this.dzongkhag.id) || this.dzongkhag;
					// Load admin zones for quick nav if not already loaded
					if (this.quickNavAdminZones.length === 0) {
						this.loadAdminZonesForQuickNav(this.dzongkhag.id);
					}
				} else if (this.dzongkhagId) {
					// If dzongkhag not loaded yet, find it by ID
					const currentDzongkhag = this.allDzongkhags.find(d => d.id === this.dzongkhagId);
					if (currentDzongkhag) {
						this.selectedDzongkhag = currentDzongkhag;
						this.loadAdminZonesForQuickNav(this.dzongkhagId);
					}
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
				// Do not auto-select admin zone - let user choose manually
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
			this.router.navigate(navPath).catch((error) => {
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
	 * Download administrative zone KML file
	 */
	downloadAdminZoneKML(adminZoneId: number, adminZoneName: string): void {
		if (!this.adminZoneBoundaries || !this.adminZoneBoundaries.features) {
			this.messageService.add({
				severity: 'error',
				summary: 'Download Failed',
				detail: 'Administrative zone boundaries not available',
				life: 3000,
			});
			return;
		}

		// Find the specific feature for this admin zone
		const feature = this.adminZoneBoundaries.features.find(
			(f: any) => f.properties.id === adminZoneId
		);

		if (!feature) {
			this.messageService.add({
				severity: 'error',
				summary: 'Download Failed',
				detail: 'Administrative zone not found',
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
		const sanitizedName = adminZoneName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		const filename = `${sanitizedName}_${adminZoneId}_${new Date().toISOString().split('T')[0]}.kml`;

		// Download the KML
		try {
			this.downloadService.downloadKML({
				data: featureGeoJSON,
				filename: filename,
				layerName: adminZoneName,
			});

			this.messageService.add({
				severity: 'success',
				summary: 'Download Complete',
				detail: `${adminZoneName} KML downloaded successfully`,
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
		if (!this.adminZones || this.adminZones.length === 0) {
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
					this.downloadFile(
						JSON.stringify(geoJson, null, 2),
						`${this.dzongkhag?.name || 'dzongkhag'}_admin_zones_${new Date().toISOString().split('T')[0]}.geojson`,
						'application/json'
					);
					this.showSuccessMessage('Administrative Zones GeoJSON downloaded successfully');
				},
				error: (error) => {
					console.error('Error downloading Administrative Zones GeoJSON:', error);
					this.showErrorMessage('Failed to download Administrative Zones GeoJSON file');
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
					this.downloadFile(
						kml,
						`${this.dzongkhag?.name || 'dzongkhag'}_admin_zones_${new Date().toISOString().split('T')[0]}.kml`,
						'application/vnd.google-earth.kml+xml'
					);
					this.showSuccessMessage('Administrative Zones KML downloaded successfully');
				},
				error: (error) => {
					console.error('Error downloading Administrative Zones KML:', error);
					this.showErrorMessage('Failed to download Administrative Zones KML file');
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

	/**
	 * Download Dzongkhag annual statistics as CSV
	 */
	downloadDzongkhagStatisticsCSV(): void {
		if (!this.dzongkhagId) return;
		
		this.annualStatisticsDownloadService.downloadDzongkhagStats(this.dzongkhagId).subscribe({
			next: (csv) => {
				this.downloadFile(
					csv,
					`${this.dzongkhag?.name || 'dzongkhag'}_annual_statistics_${new Date().toISOString().split('T')[0]}.csv`,
					'text/csv'
				);
				this.showSuccessMessage('Dzongkhag annual statistics CSV downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading dzongkhag statistics CSV:', error);
				this.showErrorMessage('Failed to download dzongkhag statistics CSV file');
			},
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
	 * Download Dzongkhag Sampling Frame (Overall) as CSV
	 */
	downloadDzongkhagSamplingFrame(): void {
		if (!this.dzongkhagId) return;
		
		this.annualStatisticsDownloadService.downloadDzongkhagSamplingFrame(this.dzongkhagId).subscribe({
			next: (csv) => {
				this.downloadFile(
					csv,
					`${this.dzongkhag?.name || 'dzongkhag'}_sampling_frame_${new Date().toISOString().split('T')[0]}.csv`,
					'text/csv'
				);
				this.showSuccessMessage('Dzongkhag Sampling Frame CSV downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading dzongkhag sampling frame CSV:', error);
				this.showErrorMessage('Failed to download Dzongkhag Sampling Frame CSV file');
			},
		});
	}

	/**
	 * Download Dzongkhag Rural Sampling Frame as CSV
	 */
	downloadDzongkhagRuralSamplingFrame(): void {
		if (!this.dzongkhagId) return;
		
		this.annualStatisticsDownloadService.downloadDzongkhagRuralSamplingFrame(this.dzongkhagId).subscribe({
			next: (csv) => {
				this.downloadFile(
					csv,
					`${this.dzongkhag?.name || 'dzongkhag'}_rural_sampling_frame_${new Date().toISOString().split('T')[0]}.csv`,
					'text/csv'
				);
				this.showSuccessMessage('Dzongkhag Rural Sampling Frame CSV downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading dzongkhag rural sampling frame CSV:', error);
				this.showErrorMessage('Failed to download Dzongkhag Rural Sampling Frame CSV file');
			},
		});
	}

	/**
	 * Download Dzongkhag Urban Sampling Frame as CSV
	 */
	downloadDzongkhagUrbanSamplingFrame(): void {
		if (!this.dzongkhagId) return;
		
		this.annualStatisticsDownloadService.downloadDzongkhagUrbanSamplingFrame(this.dzongkhagId).subscribe({
			next: (csv) => {
				this.downloadFile(
					csv,
					`${this.dzongkhag?.name || 'dzongkhag'}_urban_sampling_frame_${new Date().toISOString().split('T')[0]}.csv`,
					'text/csv'
				);
				this.showSuccessMessage('Dzongkhag Urban Sampling Frame CSV downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading dzongkhag urban sampling frame CSV:', error);
				this.showErrorMessage('Failed to download Dzongkhag Urban Sampling Frame CSV file');
			},
		});
	}

	// ==================== GeoJSON/KML Downloads ====================

	/**
	 * Download Gewog/Thromde (Administrative Zones) as GeoJSON
	 */
	downloadGewogThromdeGeojson(): void {
		if (!this.dzongkhagId) return;
		
		this.locationDownloadService.downloadGewogThromdeByDzongkhagAsGeoJson(this.dzongkhagId).subscribe({
			next: (geoJson) => {
				this.downloadFile(
					JSON.stringify(geoJson, null, 2),
					`${this.dzongkhag?.name || 'dzongkhag'}_gewog_thromde_${new Date().toISOString().split('T')[0]}.geojson`,
					'application/json'
				);
				this.showSuccessMessage('Gewog/Thromde GeoJSON downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading Gewog/Thromde GeoJSON:', error);
				this.showErrorMessage('Failed to download Gewog/Thromde GeoJSON file');
			},
		});
	}

	/**
	 * Download Gewog/Thromde (Administrative Zones) as KML
	 */
	downloadGewogThromdeKml(): void {
		if (!this.dzongkhagId) return;
		
		this.locationDownloadService.downloadGewogThromdeByDzongkhagAsKml(this.dzongkhagId).subscribe({
			next: (kml) => {
				this.downloadFile(
					kml,
					`${this.dzongkhag?.name || 'dzongkhag'}_gewog_thromde_${new Date().toISOString().split('T')[0]}.kml`,
					'application/vnd.google-earth.kml+xml'
				);
				this.showSuccessMessage('Gewog/Thromde KML downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading Gewog/Thromde KML:', error);
				this.showErrorMessage('Failed to download Gewog/Thromde KML file');
			},
		});
	}

	/**
	 * Download Chiwog/LAP (Sub-Administrative Zones) as GeoJSON
	 */
	downloadChiwogLapGeojson(): void {
		if (!this.dzongkhagId) return;
		
		this.locationDownloadService.downloadChiwogLapByDzongkhagAsGeoJson(this.dzongkhagId).subscribe({
			next: (geoJson) => {
				this.downloadFile(
					JSON.stringify(geoJson, null, 2),
					`${this.dzongkhag?.name || 'dzongkhag'}_chiwog_lap_${new Date().toISOString().split('T')[0]}.geojson`,
					'application/json'
				);
				this.showSuccessMessage('Chiwog/LAP GeoJSON downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading Chiwog/LAP GeoJSON:', error);
				this.showErrorMessage('Failed to download Chiwog/LAP GeoJSON file');
			},
		});
	}

	/**
	 * Download Chiwog/LAP (Sub-Administrative Zones) as KML
	 */
	downloadChiwogLapKml(): void {
		if (!this.dzongkhagId) return;
		
		this.locationDownloadService.downloadChiwogLapByDzongkhagAsKml(this.dzongkhagId).subscribe({
			next: (kml) => {
				this.downloadFile(
					kml,
					`${this.dzongkhag?.name || 'dzongkhag'}_chiwog_lap_${new Date().toISOString().split('T')[0]}.kml`,
					'application/vnd.google-earth.kml+xml'
				);
				this.showSuccessMessage('Chiwog/LAP KML downloaded successfully');
			},
			error: (error) => {
				console.error('Error downloading Chiwog/LAP KML:', error);
				this.showErrorMessage('Failed to download Chiwog/LAP KML file');
			},
		});
	}

	/**
	 * Download EAs (Enumeration Areas) as GeoJSON
	 */
	downloadEAsGeojson(): void {
		if (!this.dzongkhagId) return;
		
		this.locationDownloadService.downloadEAsByDzongkhagAsGeoJsonPublic(this.dzongkhagId).subscribe({
			next: (geoJson) => {
				this.downloadFile(
					JSON.stringify(geoJson, null, 2),
					`${this.dzongkhag?.name || 'dzongkhag'}_enumeration_areas_${new Date().toISOString().split('T')[0]}.geojson`,
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
		if (!this.dzongkhagId) return;
		
		this.locationDownloadService.downloadEAsByDzongkhagAsKmlPublic(this.dzongkhagId).subscribe({
			next: (kml) => {
				this.downloadFile(
					kml,
					`${this.dzongkhag?.name || 'dzongkhag'}_enumeration_areas_${new Date().toISOString().split('T')[0]}.kml`,
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

