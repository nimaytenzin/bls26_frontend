import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdministrativeZoneDataService } from '../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { SubAdministrativeZoneDataService } from '../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { PrimeNgModules } from '../../../primeng.modules';
import * as L from 'leaflet';
import { AdministrativeZone } from '../../../core/dataservice/location/administrative-zone/administrative-zone.dto';

@Component({
	selector: 'app-public-administrativezone-viewer',
	templateUrl: './public-administrativezone-viewer.component.html',
	styleUrls: ['./public-administrativezone-viewer.component.css'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
})
export class PublicAdministrativezoneViewerComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	administrativeZoneId: number | null = null;
	dzongkhagId: number | null = null;
	administrativeZone!: AdministrativeZone;
	loading = true;

	private map?: L.Map;
	private administrativeZoneGeoJSON: any;
	private subAdministrativeZoneGeoJSON: any;
	private administrativeZoneBackgroundLayer?: L.GeoJSON;
	private subAdministrativeZoneLayer?: L.GeoJSON;
	private baseLayer?: L.TileLayer;
	private labelMarkers: L.Marker[] = [];

	currentBasemap: 'none' | 'google' | 'osm' = 'none';

	// Control widget state
	expandedSection: 'basemaps' | 'layers' | 'legend' | 'download' | null = null;

	// Side drawer state
	drawerOpen = false;
	selectedSubAdministrativeZone: any = null;

	// Layers state
	layers = [
		{
			id: 'administrative-zone-background',
			name: 'Administrative Zone Background',
			enabled: true,
			color: '#FFFFFF',
		},
		{
			id: 'sub-administrative-zones',
			name: 'Sub-Administrative Zones',
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
				type: layer.id === 'sub-administrative-zones' ? 'polygon' : 'text',
			}));
	}

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private administrativeZoneService: AdministrativeZoneDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private ngZone: NgZone
	) {}

	ngOnInit() {
		this.route.params.subscribe((params) => {
			this.administrativeZoneId = +params['id'];
			this.dzongkhagId = +params['dzongkhagId'];
			this.administrativeZoneService
				.findAdministrativeZoneByIdWithoutGeom(this.administrativeZoneId!)
				.subscribe({
					next: (zone) => {
						this.administrativeZone = zone;
					},
					error: (error) => {
						console.error('Error fetching administrative zone:', error);
					},
				});
			if (this.administrativeZoneId && this.dzongkhagId) {
				this.loadMapData();
			}
		});
	}

	ngAfterViewInit(): void {
		// Fix for Leaflet default icon paths in Angular
		this.fixLeafletIcons();

		// Initialize Leaflet map after view is initialized
		this.initializeMap();
	}

	private fixLeafletIcons(): void {
		// Fix Leaflet default icon paths
		const iconRetinaUrl = 'assets/marker-icon-2x.png';
		const iconUrl = 'assets/marker-icon.png';
		const shadowUrl = 'assets/marker-shadow.png';

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

	private initializeMap(): void {
		console.log('Initializing map...');

		// Create the map
		this.map = L.map('map', {
			center: [27.5142, 90.4336],
			zoom: 10,
			zoomControl: false,
			attributionControl: false,
		});

		console.log('Map created successfully');

		// Render layers if data is already loaded
		// Always render background layer first
		if (this.administrativeZoneGeoJSON) {
			this.renderAdministrativeZoneBackgroundLayer(
				this.administrativeZoneGeoJSON
			);
		}

		// Then render sub-administrative zones on top
		if (this.subAdministrativeZoneGeoJSON) {
			this.renderSubAdministrativeZoneLayer(this.subAdministrativeZoneGeoJSON);
		}
	}

	private loadMapData(): void {
		if (!this.administrativeZoneId || !this.dzongkhagId) return;

		console.log(
			'Loading map data for administrative zone:',
			this.administrativeZoneId,
			'in dzongkhag:',
			this.dzongkhagId
		);

		// Load administrative zone background data (by dzongkhag ID only)
		this.administrativeZoneService
			.getAdministrativeZoneGeojsonByDzongkhag(this.dzongkhagId)
			.subscribe({
				next: (geojsonData) => {
					console.log(
						'Administrative zone background data loaded for dzongkhag:',
						this.dzongkhagId
					);
					this.administrativeZoneGeoJSON = geojsonData;
					if (this.map) {
						this.renderAdministrativeZoneBackgroundLayer(geojsonData);
					}
				},
				error: (error) => {
					console.error('Error loading administrative zone GeoJSON:', error);
				},
			});

		// Load sub-administrative zones for this specific administrative zone
		this.subAdministrativeZoneService
			.getSubAdministrativeZoneGeojsonByAdministrativeZone(
				this.administrativeZoneId
			)
			.subscribe({
				next: (data) => {
					console.log('Sub-administrative zones loaded:', data);
					this.subAdministrativeZoneGeoJSON = data;
					this.loading = false;
					if (this.map) {
						this.renderSubAdministrativeZoneLayer(data);
						// Ensure sub-administrative zones are always on top, even if loaded after background
						setTimeout(() => {
							this.ensureSubAdministrativeZoneLayerOnTop();
						}, 100);
					}
				},
				error: (error) => {
					console.error('Error loading sub-administrative zones:', error);
					this.loading = false;
				},
			});
	}

	private renderAdministrativeZoneBackgroundLayer(geojson: any): void {
		if (!this.map || !geojson) return;

		console.log('Rendering administrative zone background layer');

		// Remove existing layer if it exists
		if (this.administrativeZoneBackgroundLayer) {
			this.map.removeLayer(this.administrativeZoneBackgroundLayer);
		}

		const isNoBasemap = this.currentBasemap === 'none';

		// Create GeoJSON layer for administrative zone boundaries (background)
		this.administrativeZoneBackgroundLayer = L.geoJSON(geojson, {
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
		this.administrativeZoneBackgroundLayer.addTo(this.map);

		// Ensure sub-administrative zone layer stays on top if it exists
		this.ensureSubAdministrativeZoneLayerOnTop();
	}

	private renderSubAdministrativeZoneLayer(geojson: any): void {
		if (!this.map || !geojson) return;

		console.log('Rendering sub-administrative zone layer');

		// Remove existing layer if it exists
		if (this.subAdministrativeZoneLayer) {
			this.map.removeLayer(this.subAdministrativeZoneLayer);
		}

		const isNoBasemap = this.currentBasemap === 'none';

		// Create GeoJSON layer for sub-administrative zones (main layer)
		this.subAdministrativeZoneLayer = L.geoJSON(geojson, {
			style: (feature) => {
				const isChiwog = feature?.properties?.type === 'chiwog';
				return {
					fillColor: 'transparent',
					fillOpacity: 0,
					color: isChiwog ? '#059669' : '#7C3AED',
					weight: 2,
					opacity: 1,
				};
			},
			onEachFeature: (feature, layer) => {
				const props = feature.properties;
				console.log('Processing sub-administrative zone:', props);

				// Create combined area code for tooltip
				const combinedAreaCode = this.getCombinedAreaCode(props.areaCode);

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
					const isChiwog = props.type === 'chiwog';
					(layer as any).setStyle({
						fillColor: isChiwog ? '#10B981' : '#8B5CF6',
						fillOpacity: 0.7,
						weight: 3,
					});
				});

				layer.on('mouseout', (e) => {
					// Only reset style if this feature is not the selected one
					if (
						!this.selectedSubAdministrativeZone ||
						this.selectedSubAdministrativeZone.id !== props.id
					) {
						this.subAdministrativeZoneLayer?.resetStyle(layer as any);
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
					if (this.subAdministrativeZoneLayer) {
						this.subAdministrativeZoneLayer.eachLayer((l: any) => {
							this.subAdministrativeZoneLayer?.resetStyle(l);
						});
					}

					// Set the clicked layer style to maintain fill color
					const isChiwog = props.type === 'chiwog';
					(layer as any).setStyle({
						fillColor: isChiwog ? '#10B981' : '#8B5CF6',
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
		this.subAdministrativeZoneLayer.addTo(this.map);
		console.log('Sub-administrative zone layer added to map');

		// Add labels to the features
		this.addSubAdministrativeZoneLabels(geojson);

		// Ensure this layer is always on top
		this.subAdministrativeZoneLayer.bringToFront();

		// Fit bounds to sub-administrative zone layer
		this.map.fitBounds(this.subAdministrativeZoneLayer.getBounds());
		console.log('Map bounds fitted to sub-administrative zones');
	}

	private addSubAdministrativeZoneLabels(geojson: any): void {
		if (!this.map || !geojson) return;

		// Clear existing labels
		this.clearLabels();

		// Add labels for each sub-administrative zone
		geojson.features.forEach((feature: any) => {
			if (feature.geometry && feature.properties) {
				// Calculate the centroid of the polygon for label placement
				const bounds = L.geoJSON(feature).getBounds();
				const center = bounds.getCenter();

				// Create combined area code for label
				const combinedAreaCode = this.getCombinedAreaCode(
					feature.properties.areaCode
				);

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

	private ensureSubAdministrativeZoneLayerOnTop(): void {
		// Bring sub-administrative zone layer to front if it exists and is on the map
		if (
			this.subAdministrativeZoneLayer &&
			this.map &&
			this.map.hasLayer(this.subAdministrativeZoneLayer)
		) {
			this.subAdministrativeZoneLayer.bringToFront();
			console.log('Sub-administrative zone layer brought to front');
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
		this.renderAdministrativeZoneBackgroundLayer(
			this.administrativeZoneGeoJSON
		);
		this.renderSubAdministrativeZoneLayer(this.subAdministrativeZoneGeoJSON);

		// Ensure sub-administrative zones are always on top after re-rendering
		this.ensureSubAdministrativeZoneLayerOnTop();
	}

	// Control widget methods
	toggleSection(section: 'basemaps' | 'layers' | 'legend' | 'download'): void {
		this.expandedSection = this.expandedSection === section ? null : section;
	}

	toggleLayer(layerId: string): void {
		const layer = this.layers.find((l) => l.id === layerId);
		if (layer) {
			layer.enabled = !layer.enabled;

			if (layerId === 'administrative-zone-background') {
				this.toggleAdministrativeZoneBackgroundLayer();
			} else if (layerId === 'sub-administrative-zones') {
				this.toggleSubAdministrativeZoneLayer();
			}
		}
	}

	private toggleAdministrativeZoneBackgroundLayer(): void {
		if (!this.map || !this.administrativeZoneBackgroundLayer) return;

		const layer = this.layers.find(
			(l) => l.id === 'administrative-zone-background'
		);
		if (layer?.enabled) {
			this.administrativeZoneBackgroundLayer.addTo(this.map);
			// Ensure sub-administrative zones stay on top
			this.ensureSubAdministrativeZoneLayerOnTop();
		} else {
			this.map.removeLayer(this.administrativeZoneBackgroundLayer);
		}
	}

	private toggleSubAdministrativeZoneLayer(): void {
		if (!this.map || !this.subAdministrativeZoneLayer) return;

		const layer = this.layers.find((l) => l.id === 'sub-administrative-zones');
		if (layer?.enabled) {
			this.subAdministrativeZoneLayer.addTo(this.map);
			// Ensure it stays on top when re-added
			this.subAdministrativeZoneLayer.bringToFront();
		} else {
			this.map.removeLayer(this.subAdministrativeZoneLayer);
		}
	}

	downloadMap(format: string): void {
		console.log(`Downloading map as ${format}`);
		// Implement download functionality based on format
	}

	openDrawer(zoneProps: any): void {
		// Generate fake statistics for the selected sub-administrative zone
		this.selectedSubAdministrativeZone = {
			id: zoneProps.id,
			name: zoneProps.name,
			areaCode: zoneProps.areaCode,
			type: zoneProps.type || 'Sub-Administrative Zone',
			administrativeZoneId: this.administrativeZoneId,
			stats: {
				households: Math.floor(Math.random() * 200) + 50, // Random between 50-250
				population: Math.floor(Math.random() * 800) + 200, // Random between 200-1000
				eaAreas: Math.floor(Math.random() * 10) + 2, // Random between 2-12
				area: (Math.random() * 50 + 10).toFixed(2), // Random between 10-60 sq km
			},
		};
		this.drawerOpen = true;
	}

	closeDrawer(): void {
		this.drawerOpen = false;

		// Reset all layer styles when closing drawer
		if (this.subAdministrativeZoneLayer) {
			this.subAdministrativeZoneLayer.eachLayer((layer: any) => {
				this.subAdministrativeZoneLayer?.resetStyle(layer);
			});
		}

		this.selectedSubAdministrativeZone = null;
	}

	downloadZoneData(): void {
		if (this.selectedSubAdministrativeZone) {
			console.log(
				`Downloading data for ${this.selectedSubAdministrativeZone.name}`
			);
			// Implement download functionality for specific zone data
		}
	}

	viewSubAdministrativeZoneDetails(): void {
		if (this.selectedSubAdministrativeZone) {
			this.router.navigate([
				'/subadminzone-viewer',
				this.administrativeZoneId,
				this.selectedSubAdministrativeZone.id,
			]);
		}
	}

	goBack(): void {
		this.router.navigate([
			'dzongkhag-viewer',
			this.administrativeZone?.dzongkhag?.id,
		]);
	}

	getChiwogCount(): number {
		if (!this.subAdministrativeZoneGeoJSON?.features) return 0;
		return this.subAdministrativeZoneGeoJSON.features.filter(
			(zone: any) => zone.properties.type === 'chiwog'
		).length;
	}

	getLapCount(): number {
		if (!this.subAdministrativeZoneGeoJSON?.features) return 0;
		return this.subAdministrativeZoneGeoJSON.features.filter(
			(zone: any) => zone.properties.type === 'lap'
		).length;
	}

	get totalZones(): number {
		return this.subAdministrativeZoneGeoJSON?.features?.length || 0;
	}

	getCombinedAreaCode(subZoneAreaCode: string): string {
		if (
			!this.administrativeZone?.dzongkhag?.areaCode ||
			!this.administrativeZone?.areaCode
		) {
			return subZoneAreaCode || 'N/A';
		}

		const dzongkhagCode = this.administrativeZone.dzongkhag.areaCode;
		const adminZoneCode = this.administrativeZone.areaCode
			.toString()
			.padStart(2, '0');
		const subZoneCode = subZoneAreaCode
			? subZoneAreaCode.toString().padStart(2, '0')
			: '00';

		return `${dzongkhagCode}${adminZoneCode}${subZoneCode}`;
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
