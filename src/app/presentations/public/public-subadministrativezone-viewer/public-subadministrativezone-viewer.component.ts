import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SubAdministrativeZoneDataService } from '../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { EnumerationAreaDataService } from '../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { PrimeNgModules } from '../../../primeng.modules';
import * as L from 'leaflet';
import * as Papa from 'papaparse';
import { SubAdministrativeZone } from '../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';

@Component({
	selector: 'app-public-subadministrativezone-viewer',
	templateUrl: './public-subadministrativezone-viewer.component.html',
	styleUrls: ['./public-subadministrativezone-viewer.component.css'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
})
export class PublicSubadministrativezoneViewerComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	subAdministrativeZoneId: number | null = null;
	administrativeZoneId: number | null = null;
	subAdministrativeZone!: SubAdministrativeZone;
	loading = true;

	private map?: L.Map;
	private enumerationAreaGeoJSON: any;
	private subAdministrativeZoneBackgroundLayer?: L.GeoJSON;
	private enumerationAreaLayer?: L.GeoJSON;
	private baseLayer?: L.TileLayer;
	private labelMarkers: L.Marker[] = [];

	currentBasemap: 'none' | 'google' | 'osm' = 'none';

	// Control widget state
	expandedSection: 'basemaps' | 'layers' | 'legend' | 'download' | null = null;

	// Side drawer state
	drawerOpen = false;
	selectedEnumerationArea: any = null;

	// CSV data for household listing
	householdData: any[] = [];
	householdColumns: string[] = [];
	csvLoading = false;

	// Layers state
	layers = [
		{
			id: 'enumeration-areas',
			name: 'Enumeration Areas',
			enabled: true,
			color: '#3B82F6',
		},
		{
			id: 'ea-labels',
			name: 'EA Labels',
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
			iconUrl: 'assets/basemapicons/openstreetmaps.png',
			key: 'osm',
		},
		{
			name: 'Google Satellite',
			url: 'https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
			iconUrl: 'basemapicons/googlesatellite.png',
			key: 'google',
		},
	];

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private http: HttpClient,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private enumerationAreaService: EnumerationAreaDataService,
		private ngZone: NgZone
	) {}

	ngOnInit() {
		this.route.params.subscribe((params) => {
			this.subAdministrativeZoneId = +params['id'];
			this.administrativeZoneId = +params['administrativeZoneId'];
			this.subAdministrativeZoneService
				.findAdministrativeZoneByIdWithoutGeom(this.subAdministrativeZoneId)
				.subscribe({
					next: (data) => {
						this.subAdministrativeZone = data;
					},
					error: (error) => {
						console.error('Error fetching sub-administrative zone:', error);
					},
				});
			if (this.subAdministrativeZoneId && this.administrativeZoneId) {
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
			zoom: 12,
			zoomControl: false,
			attributionControl: false,
		});

		console.log('Map created successfully');

		// Render layers if data is already loaded
		if (this.enumerationAreaGeoJSON) {
			this.renderEnumerationAreaLayer(this.enumerationAreaGeoJSON);
		}
	}

	private loadMapData(): void {
		if (!this.subAdministrativeZoneId || !this.administrativeZoneId) return;

		console.log(
			'Loading map data for sub-administrative zone:',
			this.subAdministrativeZoneId,
			'in administrative zone:',
			this.administrativeZoneId
		);

		// Load enumeration areas for this specific sub-administrative zone
		this.enumerationAreaService
			.getEnumerationAreaGeojsonBySubAdministrativeZone(
				this.subAdministrativeZoneId
			)
			.subscribe({
				next: (data) => {
					console.log('Enumeration areas loaded:', data);
					this.enumerationAreaGeoJSON = data;
					this.loading = false;
					if (this.map) {
						this.renderEnumerationAreaLayer(data);
					}
				},
				error: (error) => {
					console.error('Error loading enumeration areas:', error);
					this.loading = false;
				},
			});
	}

	private renderEnumerationAreaLayer(geojson: any): void {
		if (!this.map || !geojson) return;

		console.log('Rendering enumeration area layer');

		// Remove existing layer if it exists
		if (this.enumerationAreaLayer) {
			this.map.removeLayer(this.enumerationAreaLayer);
		}

		// Create GeoJSON layer for enumeration areas
		this.enumerationAreaLayer = L.geoJSON(geojson, {
			style: (feature) => ({
				fillColor: '#3B82F6',
				fillOpacity: 0.3,
				color: '#1D4ED8',
				weight: 2,
				opacity: 1,
			}),
			onEachFeature: (feature, layer) => {
				const props = feature.properties;
				console.log('Processing enumeration area:', props);

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
					(layer as any).setStyle({
						fillColor: '#2563EB',
						fillOpacity: 0.7,
						weight: 3,
					});
				});

				layer.on('mouseout', (e) => {
					// Only reset style if this feature is not the selected one
					if (
						!this.selectedEnumerationArea ||
						this.selectedEnumerationArea.id !== props.id
					) {
						this.enumerationAreaLayer?.resetStyle(layer as any);
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
					if (this.enumerationAreaLayer) {
						this.enumerationAreaLayer.eachLayer((l: any) => {
							this.enumerationAreaLayer?.resetStyle(l);
						});
					}

					// Set the clicked layer style to maintain fill color
					(layer as any).setStyle({
						fillColor: '#2563EB',
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
		this.enumerationAreaLayer.addTo(this.map);
		console.log('Enumeration area layer added to map');

		// Add labels to the features
		this.addEnumerationAreaLabels(geojson);

		// Fit bounds to enumeration area layer
		this.map.fitBounds(this.enumerationAreaLayer.getBounds());
		console.log('Map bounds fitted to enumeration areas');
	}

	private addEnumerationAreaLabels(geojson: any): void {
		if (!this.map || !geojson) return;

		// Clear existing labels
		this.clearLabels();

		// Add labels for each enumeration area
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
						className: 'ea-label',
						html: `<div class="ea-label-text">
							${feature.properties.name || feature.properties.areaCode || 'N/A'}<br>
							<span style="font-size: 9px; font-family: monospace;">${combinedAreaCode}</span>
						</div>`,
						iconSize: [80, 30],
						iconAnchor: [40, 15],
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

		// Re-render layers to update styling if needed
		this.renderEnumerationAreaLayer(this.enumerationAreaGeoJSON);
	}

	// Control widget methods
	toggleSection(section: 'basemaps' | 'layers' | 'legend' | 'download'): void {
		this.expandedSection = this.expandedSection === section ? null : section;
	}

	toggleLayer(layerId: string): void {
		const layer = this.layers.find((l) => l.id === layerId);
		if (layer) {
			layer.enabled = !layer.enabled;

			if (layerId === 'enumeration-areas') {
				this.toggleEnumerationAreaLayer();
			} else if (layerId === 'ea-labels') {
				this.toggleLabels();
			}
		}
	}

	private toggleEnumerationAreaLayer(): void {
		if (!this.map || !this.enumerationAreaLayer) return;

		const layer = this.layers.find((l) => l.id === 'enumeration-areas');
		if (layer?.enabled) {
			this.enumerationAreaLayer.addTo(this.map);
		} else {
			this.map.removeLayer(this.enumerationAreaLayer);
		}
	}

	private toggleLabels(): void {
		const layer = this.layers.find((l) => l.id === 'ea-labels');
		if (layer?.enabled) {
			this.addEnumerationAreaLabels(this.enumerationAreaGeoJSON);
		} else {
			this.clearLabels();
		}
	}

	downloadMap(format: string): void {
		console.log(`Downloading map as ${format}`);
		// Implement download functionality based on format
	}

	openDrawer(areaProps: any): void {
		// Generate statistics for the selected enumeration area
		this.selectedEnumerationArea = {
			id: areaProps.id,
			name: areaProps.name,
			areaCode: areaProps.areaCode,
			description: areaProps.description,
			subAdministrativeZoneId: this.subAdministrativeZoneId,
			stats: {
				households: Math.floor(Math.random() * 100) + 20, // Random between 20-120
				population: Math.floor(Math.random() * 400) + 80, // Random between 80-480
				buildings: Math.floor(Math.random() * 150) + 30, // Random between 30-180
				area: (Math.random() * 5 + 1).toFixed(2), // Random between 1-6 sq km
			},
		};
		this.drawerOpen = true;

		// Load household data from CSV
		this.loadHouseholdData();
	}

	closeDrawer(): void {
		this.drawerOpen = false;

		// Reset all layer styles when closing drawer
		if (this.enumerationAreaLayer) {
			this.enumerationAreaLayer.eachLayer((layer: any) => {
				this.enumerationAreaLayer?.resetStyle(layer);
			});
		}

		this.selectedEnumerationArea = null;
	}

	downloadAreaData(): void {
		if (this.selectedEnumerationArea) {
			console.log(`Downloading data for ${this.selectedEnumerationArea.name}`);
			// Implement download functionality for specific area data
		}
	}

	goBack(): void {
		this.router.navigate([
			'adminzone-viewer',
			this.subAdministrativeZone?.administrativeZone?.dzongkhag?.id,
			this.administrativeZoneId,
		]);
	}

	get totalAreas(): number {
		return this.enumerationAreaGeoJSON?.features?.length || 0;
	}

	getCombinedAreaCode(eaAreaCode: string): string {
		if (
			!this.subAdministrativeZone?.administrativeZone?.dzongkhag?.areaCode ||
			!this.subAdministrativeZone?.administrativeZone?.areaCode ||
			!this.subAdministrativeZone?.areaCode
		) {
			return eaAreaCode || 'N/A';
		}

		const dzongkhagCode =
			this.subAdministrativeZone.administrativeZone.dzongkhag.areaCode;
		const adminZoneCode = this.subAdministrativeZone.administrativeZone.areaCode
			.toString()
			.padStart(2, '0');
		const subAdminZoneCode = this.subAdministrativeZone.areaCode
			.toString()
			.padStart(2, '0');
		const enumerationAreaCode = eaAreaCode
			? eaAreaCode.toString().padStart(2, '0')
			: '00';

		return `${dzongkhagCode}${adminZoneCode}${subAdminZoneCode}${enumerationAreaCode}`;
	}

	loadHouseholdData(): void {
		this.csvLoading = true;
		this.http
			.get('sheets/samplehouseholdlisting.csv', { responseType: 'text' })
			.subscribe({
				next: (csvData) => {
					Papa.parse(csvData, {
						header: true,
						skipEmptyLines: true,
						complete: (results) => {
							this.householdData = results.data;
							this.householdColumns = results.meta.fields || [];
							this.csvLoading = false;
						},
						error: (error: any) => {
							console.error('Error parsing CSV:', error);
							this.csvLoading = false;
						},
					});
				},
				error: (error: any) => {
					console.error('Error loading CSV file:', error);
					this.csvLoading = false;
				},
			});
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
