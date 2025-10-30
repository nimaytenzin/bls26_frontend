import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DzongkhagDataService } from '../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { AdministrativeZoneDataService } from '../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { PrimeNgModules } from '../../../primeng.modules';
import * as L from 'leaflet';
import { Dzongkhag } from '../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { AdministrativeZone } from '../../../core/dataservice/location/administrative-zone/administrative-zone.dto';

@Component({
	selector: 'app-public-dzongkhag-viewer',
	templateUrl: './public-dzongkhag-viewer.component.html',
	styleUrls: ['./public-dzongkhag-viewer.component.css'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
})
export class PublicDzongkhagViewerComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	dzongkhagId: number | null = null;
	dzongkhag!: Dzongkhag;
	loading = true;

	private map?: L.Map;
	private dzongkhagGeoJSON: any;
	private administrativeZoneGeoJSON: any;
	private dzongkhagBackgroundLayer?: L.GeoJSON;
	private administrativeZoneLayer?: L.GeoJSON;
	private baseLayer?: L.TileLayer;
	private labelMarkers: L.Marker[] = [];

	currentBasemap: 'none' | 'google' | 'osm' = 'none';

	// Control widget state
	expandedSection: 'basemaps' | 'layers' | 'legend' | 'download' | null = null;

	// Side drawer state
	drawerOpen = false;
	selectedAdministrativeZone: any = null;

	// Layers state
	layers = [
		{
			id: 'dzongkhag-background',
			name: 'Dzongkhag Background',
			enabled: true,
			color: '#FFFFFF',
		},
		{
			id: 'administrative-zones',
			name: 'Administrative Zones',
			enabled: true,
			color: '#FFFFFF',
		},
		{
			id: 'zone-labels',
			name: 'Zone Labels',
			enabled: true,
			color: '#333',
		},
	];

	baseMaps: Array<{
		name: string;
		url: string | null;
		iconUrl: string;
		key: 'none' | 'google' | 'osm';
	}> = [
		{
			name: 'No Basemap',
			url: null,
			iconUrl: 'basemapicons/nobasemap.png',
			key: 'none',
		},
		{
			name: 'OpenStreetMap',
			url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
			iconUrl: 'basemapicons/openstreetmaps.png',
			key: 'osm',
		},
		{
			name: 'Google Satellite',
			url: 'https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
			iconUrl: 'basemapicons/googlesatellite.png',
			key: 'google',
		},
	];

	// Legend items (dynamic based on active layers)
	get legendItems() {
		return this.layers
			.filter((layer) => layer.enabled)
			.map((layer) => ({
				label: layer.name,
				color: layer.color,
				type: layer.id === 'administrative-zones' ? 'polygon' : 'text',
			}));
	}

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private dzongkhagService: DzongkhagDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private ngZone: NgZone
	) {}

	ngOnInit() {
		this.route.params.subscribe((params) => {
			this.dzongkhagId = +params['id'];
			this.dzongkhagService.getDzongkhagById(this.dzongkhagId!).subscribe({
				next: (data) => {
					this.dzongkhag = data;
				},
			});
			if (this.dzongkhagId) {
				this.loadMapData();
			}
		});
	}

	ngAfterViewInit(): void {
		this.initializeMap();
	}

	private initializeMap(): void {
		console.log('Initializing map...');

		// Create the map
		this.map = L.map('map', {
			center: [27.5142, 90.4336],
			zoom: 8,
			zoomControl: false,
			attributionControl: false,
		});

		console.log('Map created successfully');

		// Render layers if data is already loaded
		// Always render background layer first
		if (this.dzongkhagGeoJSON) {
			this.renderDzongkhagBackgroundLayer(this.dzongkhagGeoJSON);
		}

		// Then render administrative zones on top
		if (this.administrativeZoneGeoJSON) {
			this.renderAdministrativeZoneLayer(this.administrativeZoneGeoJSON);
		}
	}

	private loadMapData(): void {
		if (!this.dzongkhagId) return;

		// Load dzongkhag background data (all dzongkhags)
		this.dzongkhagService.getAllDzongkhagGeojson().subscribe({
			next: (geojsonData) => {
				this.dzongkhagGeoJSON = geojsonData;
				if (this.map) {
					this.renderDzongkhagBackgroundLayer(geojsonData);
				}
			},
			error: (error) => {
				console.error('Error loading dzongkhag GeoJSON:', error);
			},
		});

		// Load administrative zones for this specific dzongkhag
		this.administrativeZoneService
			.getAdministrativeZoneGeojsonByDzongkhag(this.dzongkhagId)
			.subscribe({
				next: (data) => {
					this.administrativeZoneGeoJSON = data;
					this.loading = false;
					if (this.map) {
						this.renderAdministrativeZoneLayer(data);
						// Ensure administrative zones are always on top, even if loaded after background
						setTimeout(() => {
							this.ensureAdministrativeZoneLayerOnTop();
						}, 100);
					}
				},
				error: (error) => {
					console.error('Error loading administrative zones:', error);
					this.loading = false;
				},
			});
	}

	private renderDzongkhagBackgroundLayer(geojson: any): void {
		if (!this.map || !geojson) return;

		console.log('Rendering dzongkhag background layer');

		// Remove existing layer if it exists
		if (this.dzongkhagBackgroundLayer) {
			this.map.removeLayer(this.dzongkhagBackgroundLayer);
		}

		const isNoBasemap = this.currentBasemap === 'none';

		// Create GeoJSON layer for dzongkhag boundaries (background)
		this.dzongkhagBackgroundLayer = L.geoJSON(geojson, {
			style: (feature) => ({
				fillColor: isNoBasemap ? '#F3F4F6' : '#E5E7EB',
				fillOpacity: isNoBasemap ? 0.6 : 0.3,
				color: '#9CA3AF',
				weight: 1,
				opacity: 0.8,
			}),
			onEachFeature: (feature, layer) => {
				const props = feature.properties;
			},
		});

		// Add the background layer to the map
		this.dzongkhagBackgroundLayer.addTo(this.map);

		// Ensure administrative zone layer stays on top if it exists
		this.ensureAdministrativeZoneLayerOnTop();
	}

	viewAdministrativeZoneDetails() {
		this.router.navigate([
			'/adminzone-viewer',
			this.dzongkhagId,
			this.selectedAdministrativeZone.id,
		]);
	}

	private renderAdministrativeZoneLayer(geojson: any): void {
		if (!this.map || !geojson) return;

		console.log('Rendering administrative zone layer');

		// Remove existing layer if it exists
		if (this.administrativeZoneLayer) {
			this.map.removeLayer(this.administrativeZoneLayer);
		}

		const isNoBasemap = this.currentBasemap === 'none';

		// Create GeoJSON layer for administrative zones (main layer)
		this.administrativeZoneLayer = L.geoJSON(geojson, {
			style: (feature) => {
				const isGewog = feature?.properties?.type === 'Gewog';
				return {
					fillColor: 'transparent',
					fillOpacity: 0,
					color: isGewog ? '#059669' : '#D97706',
					weight: 2,
					opacity: 1,
				};
			},
			onEachFeature: (feature, layer) => {
				const props = feature.properties;
				console.log('Processing administrative zone:', props);

				// Create combined area code (Dzongkhag code + Administrative Zone code)
				const combinedAreaCode =
					this.dzongkhagId && props.areaCode
						? `${this.dzongkhagId}${props.areaCode.toString().padStart(2, '0')}`
						: props.areaCode || 'N/A';

				// Bind tooltip for hover
				layer.bindTooltip(
					`<div style="text-align: center; font-weight: 600;">
						${props.name || 'Unknown'}<br>
						<span style="font-size: 11px; color: #888; font-family: monospace;">
							${combinedAreaCode}
						</span>
					</div>`,
					{
						permanent: false,
						direction: 'top',
						className: 'hover-tooltip',
					}
				);

				// Add hover effects
				layer.on('mouseover', (e) => {
					const isGewog = props.type === 'Gewog';
					(layer as any).setStyle({
						fillColor: isGewog ? '#10B981' : '#F59E0B',
						fillOpacity: 0.7,
						weight: 3,
					});
				});

				layer.on('mouseout', (e) => {
					// Only reset style if this feature is not the selected one
					if (
						!this.selectedAdministrativeZone ||
						this.selectedAdministrativeZone.id !== props.id
					) {
						this.administrativeZoneLayer?.resetStyle(layer as any);
					}
				});

				// Add click event to open side drawer
				layer.on('click', (e) => {
					// Prevent default behavior and stop propagation
					L.DomEvent.stopPropagation(e);
					if (e.originalEvent) {
						e.originalEvent.preventDefault();
					}

					// Remove focus from any element that might have it
					if (document.activeElement) {
						(document.activeElement as HTMLElement).blur();
					}

					// Reset all other layers first
					if (this.administrativeZoneLayer) {
						this.administrativeZoneLayer.eachLayer((l: any) => {
							this.administrativeZoneLayer?.resetStyle(l);
						});
					}

					// Set the clicked layer style to maintain fill color
					const isGewog = props.type === 'Gewog';
					(layer as any).setStyle({
						fillColor: isGewog ? '#10B981' : '#F59E0B',
						fillOpacity: 0.7,
						weight: 3,
					});

					// Run inside NgZone to ensure Angular change detection
					this.ngZone.run(() => {
						this.openDrawer(props);
					});
				});
			},
		});

		// Add the layer to the map
		this.administrativeZoneLayer.addTo(this.map);
		console.log('Administrative zone layer added to map');

		// Add labels to the features
		this.addAdministrativeZoneLabels(geojson);

		// Ensure this layer is always on top
		this.administrativeZoneLayer.bringToFront();

		// Fit bounds to administrative zone layer
		this.map.fitBounds(this.administrativeZoneLayer.getBounds());
		console.log('Map bounds fitted to administrative zones');
	}

	private addAdministrativeZoneLabels(geojson: any): void {
		if (!this.map || !geojson) return;

		// Clear existing labels
		this.clearLabels();

		// Add labels for each administrative zone
		geojson.features.forEach((feature: any) => {
			if (feature.geometry && feature.properties) {
				// Calculate the centroid of the polygon for label placement
				const bounds = L.geoJSON(feature).getBounds();
				const center = bounds.getCenter();

				// Create combined area code for label
				const combinedAreaCode =
					this.dzongkhagId && feature.properties.areaCode
						? `${this.dzongkhagId}${feature.properties.areaCode
								.toString()
								.padStart(2, '0')}`
						: feature.properties.areaCode || 'N/A';

				// Create a marker with custom label styling
				const labelMarker = L.marker(center, {
					icon: L.divIcon({
						className: 'zone-label',
						html: `<div class="zone-label-text">
							${feature.properties.name || 'N/A'}<br>
							<span style="font-size: 10px; font-family: monospace;">${combinedAreaCode}</span>
						</div>`,
						iconSize: [100, 35],
						iconAnchor: [50, 17],
					}),
					interactive: false, // Make labels non-interactive
				});

				labelMarker.addTo(this.map!);
				this.labelMarkers.push(labelMarker);
			}
		});
	}

	private clearLabels(): void {
		// Remove all existing label markers
		this.labelMarkers.forEach((marker) => {
			if (this.map) {
				this.map.removeLayer(marker);
			}
		});
		this.labelMarkers = [];
	}

	private ensureAdministrativeZoneLayerOnTop(): void {
		// Bring administrative zone layer to front if it exists and is on the map
		if (
			this.administrativeZoneLayer &&
			this.map &&
			this.map.hasLayer(this.administrativeZoneLayer)
		) {
			this.administrativeZoneLayer.bringToFront();
			console.log('Administrative zone layer brought to front');
		}
	}

	switchBasemap(basemap: 'none' | 'google' | 'osm'): void {
		if (!this.map) return;

		// Remove existing base layer
		if (this.baseLayer) {
			this.map.removeLayer(this.baseLayer);
			this.baseLayer = undefined;
		}

		if (basemap === 'none') {
			this.currentBasemap = 'none';
		} else {
			const tileUrl =
				basemap === 'google'
					? 'https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}'
					: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

			this.baseLayer = L.tileLayer(tileUrl, {
				maxZoom: 19,
				attribution:
					basemap === 'google' ? '© Google' : '© OpenStreetMap contributors',
			});

			this.baseLayer.addTo(this.map);
			this.currentBasemap = basemap;
		}

		// Re-render layers to update styling
		this.renderDzongkhagBackgroundLayer(this.dzongkhagGeoJSON);
		this.renderAdministrativeZoneLayer(this.administrativeZoneGeoJSON);

		// Ensure administrative zones are always on top after re-rendering
		this.ensureAdministrativeZoneLayerOnTop();
	}

	// Control widget methods
	toggleSection(section: 'basemaps' | 'layers' | 'legend' | 'download'): void {
		this.expandedSection = this.expandedSection === section ? null : section;
	}

	toggleLayer(layerId: string): void {
		const layer = this.layers.find((l) => l.id === layerId);
		if (layer) {
			layer.enabled = !layer.enabled;

			if (layerId === 'dzongkhag-background') {
				this.toggleDzongkhagBackgroundLayer();
			} else if (layerId === 'administrative-zones') {
				this.toggleAdministrativeZoneLayer();
			}
		}
	}

	private toggleDzongkhagBackgroundLayer(): void {
		if (!this.map || !this.dzongkhagBackgroundLayer) return;

		const layer = this.layers.find((l) => l.id === 'dzongkhag-background');
		if (layer?.enabled) {
			this.dzongkhagBackgroundLayer.addTo(this.map);
			// Ensure administrative zones stay on top
			this.ensureAdministrativeZoneLayerOnTop();
		} else {
			this.map.removeLayer(this.dzongkhagBackgroundLayer);
		}
	}

	private toggleAdministrativeZoneLayer(): void {
		if (!this.map || !this.administrativeZoneLayer) return;

		const layer = this.layers.find((l) => l.id === 'administrative-zones');
		if (layer?.enabled) {
			this.administrativeZoneLayer.addTo(this.map);
			// Ensure it stays on top when re-added
			this.administrativeZoneLayer.bringToFront();
		} else {
			this.map.removeLayer(this.administrativeZoneLayer);
		}
	}

	downloadMap(format: string): void {
		console.log(`Downloading map as ${format}`);
		// Implement download functionality based on format
	}

	openDrawer(zoneProps: any): void {
		// Generate fake statistics for the selected administrative zone
		this.selectedAdministrativeZone = {
			id: zoneProps.id,
			name: zoneProps.name,
			areaCode: zoneProps.areaCode,
			type: zoneProps.type || 'Administrative Zone',
			dzongkhagId: this.dzongkhagId,
			stats: {
				chiwogs: Math.floor(Math.random() * 15) + 3, // Random between 3-18
				laps: Math.floor(Math.random() * 25) + 5, // Random between 5-30
				eaAreas: Math.floor(Math.random() * 100) + 20, // Random between 20-120
				households: Math.floor(Math.random() * 500) + 100, // Random between 100-600
			},
		};
		this.drawerOpen = true;
	}

	closeDrawer(): void {
		this.drawerOpen = false;

		// Reset all layer styles when closing drawer
		if (this.administrativeZoneLayer) {
			this.administrativeZoneLayer.eachLayer((layer: any) => {
				this.administrativeZoneLayer?.resetStyle(layer);
			});
		}

		this.selectedAdministrativeZone = null;
	}

	downloadZoneData(): void {
		if (this.selectedAdministrativeZone) {
			console.log(
				`Downloading data for ${this.selectedAdministrativeZone.name}`
			);
			// Implement download functionality for specific zone data
		}
	}

	goBack(): void {
		this.router.navigate(['/']);
	}

	getGewogCount(): number {
		if (!this.administrativeZoneGeoJSON?.features) return 0;
		return this.administrativeZoneGeoJSON.features.filter(
			(zone: any) => zone.properties.type === 'Gewog'
		).length;
	}

	getThromdeCount(): number {
		if (!this.administrativeZoneGeoJSON?.features) return 0;
		return this.administrativeZoneGeoJSON.features.filter(
			(zone: any) => zone.properties.type === 'Thromde'
		).length;
	}

	get totalZones(): number {
		return this.administrativeZoneGeoJSON?.features?.length || 0;
	}

	getCombinedAreaCode(zone: AdministrativeZone): string {
		return `${this.dzongkhag.areaCode}${zone.areaCode}`;
	}

	ngOnDestroy(): void {
		// Clean up labels
		this.clearLabels();

		// Clean up map resources
		if (this.map) {
			this.map.remove();
		}
	}
}
