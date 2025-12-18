import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	ViewChild,
	ElementRef,
	NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { BasemapService } from '../../../../core/utility/basemap.service';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import {
	DzongkhagEASummaryDataService,
	DzongkhagEASummaryResponse,
	MapDataResponse,
} from '../../../../core/dataservice/reports/dzongkhag-ea-summary.dataservice';

@Component({
	selector: 'app-dzongkhag-ea-summary',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './dzongkhag-ea-summary.component.html',
	styleUrls: ['./dzongkhag-ea-summary.component.scss'],
	providers: [MessageService],
})
export class DzongkhagEASummaryComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	@ViewChild('mapContainer', { static: false })
	mapContainerRef?: ElementRef<HTMLDivElement>;

	// Dzongkhag selection
	selectedDzongkhag: any | null = null;
	dzongkhagOptions: { label: string; value: number }[] = [];

	// Report data
	reportData: DzongkhagEASummaryResponse | null = null;
	mapData: MapDataResponse | null = null;

	// State flags
	loading = false;
	loadingMap = false;
	error: string | null = null;
	exportingPDF = false;
	exportingExcel = false;

	// Map properties
	private map?: L.Map;
	private baseLayer?: L.TileLayer;
	private dzongkhagLayer?: L.GeoJSON;
	private gewogLayers: L.GeoJSON[] = [];
	private eaLayers: L.GeoJSON[] = [];
	selectedBasemapId = 'positron'; // Default basemap

	private subscriptions = new Subscription();

	constructor(
		private reportService: DzongkhagEASummaryDataService,
		private dzongkhagService: DzongkhagDataService,
		private basemapService: BasemapService,
		private messageService: MessageService,
		private ngZone: NgZone
	) {}

	ngOnInit(): void {
		this.fixLeafletIcons();
		this.loadDzongkhags();
	}

	ngAfterViewInit(): void {
		// Initialize map after view is ready
		setTimeout(() => {
			this.initializeMap();
		}, 100);
	}

	ngOnDestroy(): void {
		this.subscriptions.unsubscribe();
		if (this.map) {
			this.map.remove();
		}
	}

	/**
	 * Fix Leaflet default icon issue
	 */
	private fixLeafletIcons(): void {
		const iconRetinaUrl = 'assets/leaflet/marker-icon-2x.png';
		const iconUrl = 'assets/leaflet/marker-icon.png';
		const shadowUrl = 'assets/leaflet/marker-shadow.png';
		const iconDefault = L.icon({
			iconRetinaUrl,
			iconUrl,
			shadowUrl,
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			tooltipAnchor: [16, -28],
			shadowSize: [41, 41],
		});

		L.Marker.prototype.options.icon = iconDefault;
	}

	/**
	 * Load list of dzongkhags for dropdown
	 */
	loadDzongkhags(): void {
		const sub = this.dzongkhagService.findAllDzongkhags().subscribe({
			next: (dzongkhags) => {
				this.dzongkhagOptions = dzongkhags.map((dz) => ({
					label: `${dz.name} (${dz.areaCode})`,
					value: dz.id,
				}));
			},
			error: (error) => {
				console.error('Error loading dzongkhags:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load dzongkhags list',
					life: 5000,
				});
			},
		});

		this.subscriptions.add(sub);
	}

	/**
	 * Handle dzongkhag selection change
	 */
	onDzongkhagChange(): void {
		if (this.selectedDzongkhag) {
			this.loadReportData(this.selectedDzongkhag);
		} else {
			this.reportData = null;
			this.mapData = null;
			this.clearMapLayers();
		}
	}

	/**
	 * Load report data for selected dzongkhag
	 */
	loadReportData(dzongkhagId: number): void {
		this.loading = true;
		this.error = null;

		// Load report data
		const reportSub = this.reportService
			.getReportData(dzongkhagId)
			.subscribe({
				next: (data) => {
					this.reportData = data;
					this.loading = false;

					// Load map data after report data is loaded
					this.loadMapData(dzongkhagId);
				},
				error: (error) => {
					console.error('Error loading report data:', error);
					this.error =
						error?.error?.message ||
						'Failed to load report data. Please try again.';
					this.loading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: this.error || undefined,
						life: 5000,
					});
				},
			});

		this.subscriptions.add(reportSub);
	}

	/**
	 * Load map data (GeoJSON FeatureCollection)
	 */
	loadMapData(dzongkhagId: number): void {
		this.loadingMap = true;

		const mapSub = this.reportService.getMapData(dzongkhagId).subscribe({
			next: (data) => {
				this.mapData = data;
				this.loadingMap = false;
				this.renderMapLayers(data);
			},
			error: (error) => {
				console.error('Error loading map data:', error);
				this.loadingMap = false;
				// Don't show error toast for map - it's not critical
				console.warn('Map data unavailable, continuing without map');
			},
		});

		this.subscriptions.add(mapSub);
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
			// Use basemap service to create tile layer
			this.baseLayer =
				this.basemapService.createTileLayer(this.selectedBasemapId) ||
				undefined;

			this.map = L.map(this.mapContainerRef.nativeElement, {
				center: [27.5142, 90.4336], // Center of Bhutan
				zoom: 8,
				layers: this.baseLayer ? [this.baseLayer] : [],
				zoomControl: true,
				attributionControl: true,
			});

			console.log('Map initialized successfully');

			// Render map layers if data is already loaded
			if (this.mapData) {
				this.renderMapLayers(this.mapData);
			}
		} catch (error) {
			console.error('Error initializing map:', error);
		}
	}

	/**
	 * Render map layers from GeoJSON FeatureCollection
	 */
	private renderMapLayers(mapData: MapDataResponse): void {
		if (!this.map) {
			console.warn('Map not initialized, cannot render layers');
			return;
		}

		// Clear existing layers
		this.clearMapLayers();

		// Group features by layer type
		const dzongkhagFeatures: any[] = [];
		const gewogFeatures: any[] = [];
		const eaFeatures: any[] = [];

		mapData.features.forEach((feature) => {
			const layerType = feature.properties?.layer;
			if (layerType === 'dzongkhag') {
				dzongkhagFeatures.push(feature);
			} else if (layerType === 'gewog') {
				gewogFeatures.push(feature);
			} else if (layerType === 'enumerationArea') {
				eaFeatures.push(feature);
			}
		});

		// Render dzongkhag boundary (thick border, distinct color)
		if (dzongkhagFeatures.length > 0) {
			this.dzongkhagLayer = L.geoJSON(dzongkhagFeatures, {
				style: {
					color: '#1e40af',
					weight: 3,
					fillColor: '#3b82f6',
					fillOpacity: 0.1,
				},
				onEachFeature: (feature, layer) => {
					if (feature.properties?.name) {
						layer.bindTooltip(feature.properties.name);
					}
				},
			}).addTo(this.map);

			// Fit bounds to dzongkhag
			this.map.fitBounds(this.dzongkhagLayer.getBounds(), {
				padding: [50, 50],
			});
		}

		// Render gewog boundaries (medium border)
		if (gewogFeatures.length > 0) {
			const gewogLayer = L.geoJSON(gewogFeatures, {
				style: {
					color: '#059669',
					weight: 2,
					fillColor: '#10b981',
					fillOpacity: 0.15,
				},
				onEachFeature: (feature, layer) => {
					if (feature.properties?.name) {
						layer.bindTooltip(feature.properties.name);
					}
				},
			}).addTo(this.map);

			this.gewogLayers.push(gewogLayer);
		}

		// Render EA boundaries (thin border)
		if (eaFeatures.length > 0) {
			const eaLayer = L.geoJSON(eaFeatures, {
				style: {
					color: '#dc2626',
					weight: 1,
					fillColor: '#ef4444',
					fillOpacity: 0.2,
				},
				onEachFeature: (feature, layer) => {
					if (feature.properties?.name) {
						layer.bindTooltip(feature.properties.name);
					}
				},
			}).addTo(this.map);

			this.eaLayers.push(eaLayer);
		}
	}

	/**
	 * Clear all map layers
	 */
	private clearMapLayers(): void {
		if (this.dzongkhagLayer) {
			this.map?.removeLayer(this.dzongkhagLayer);
			this.dzongkhagLayer = undefined;
		}

		this.gewogLayers.forEach((layer) => {
			this.map?.removeLayer(layer);
		});
		this.gewogLayers = [];

		this.eaLayers.forEach((layer) => {
			this.map?.removeLayer(layer);
		});
		this.eaLayers = [];
	}

	/**
	 * Download PDF report
	 */
	downloadPDF(): void {
		if (!this.selectedDzongkhag) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select a dzongkhag first',
				life: 3000,
			});
			return;
		}

		this.exportingPDF = true;

		const sub = this.reportService
			.downloadPDF(this.selectedDzongkhag)
			.subscribe({
				next: (blob) => {
					const dzongkhagName =
						this.reportData?.dzongkhag.name || 'dzongkhag';
					this.handleFileDownload(
						blob,
						`dzongkhag-ea-summary-${dzongkhagName}-${new Date()
							.toISOString()
							.split('T')[0]}.pdf`,
						'application/pdf'
					);
					this.exportingPDF = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'PDF report downloaded successfully',
						life: 3000,
					});
				},
				error: (error) => {
					console.error('Error downloading PDF:', error);
					this.exportingPDF = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail:
							error?.error?.message ||
							'Failed to download PDF report. Please try again.',
						life: 5000,
					});
				},
			});

		this.subscriptions.add(sub);
	}

	/**
	 * Download Excel report
	 */
	downloadExcel(): void {
		if (!this.selectedDzongkhag) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select a dzongkhag first',
				life: 3000,
			});
			return;
		}

		this.exportingExcel = true;

		const sub = this.reportService
			.downloadExcel(this.selectedDzongkhag)
			.subscribe({
				next: (blob) => {
					const dzongkhagName =
						this.reportData?.dzongkhag.name || 'dzongkhag';
					this.handleFileDownload(
						blob,
						`dzongkhag-ea-summary-${dzongkhagName}-${new Date()
							.toISOString()
							.split('T')[0]}.xlsx`,
						'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
					);
					this.exportingExcel = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Excel report downloaded successfully',
						life: 3000,
					});
				},
				error: (error) => {
					console.error('Error downloading Excel:', error);
					this.exportingExcel = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail:
							error?.error?.message ||
							'Failed to download Excel report. Please try again.',
						life: 5000,
					});
				},
			});

		this.subscriptions.add(sub);
	}

	/**
	 * Handle file download
	 */
	private handleFileDownload(
		blob: Blob,
		filename: string,
		contentType: string
	): void {
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
	 * Retry loading data
	 */
	retry(): void {
		if (this.selectedDzongkhag) {
			this.loadReportData(this.selectedDzongkhag);
		}
	}
}

