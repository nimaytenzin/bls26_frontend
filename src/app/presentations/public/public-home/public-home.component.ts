import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { DzongkhagDataService } from '../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';

import { PrimeNgModules } from '../../../primeng.modules';

@Component({
	selector: 'app-public-home',
	templateUrl: './public-home.component.html',
	styleUrls: ['./public-home.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
})
export class PublicHomeComponent implements OnInit, OnDestroy, AfterViewInit {
	private map?: L.Map;
	private dzongkhagGeoJSON: any;
	private dzongkhagLayer?: L.GeoJSON;

	private baseLayer?: L.TileLayer;
	currentBasemap: 'none' | 'google' | 'osm' = 'none';

	// Control widget state
	expandedSection: 'basemaps' | 'layers' | 'legend' | 'download' | null = null;

	// Side drawer state
	drawerOpen = false;
	selectedDzongkhag: any = null;

	// Layers state
	layers = [
		{
			id: 'dzongkhag',
			name: 'Dzongkhag Boundaries',
			enabled: true,
			color: '#6D8AA3',
		},
		{
			id: 'dzongkhag-labels',
			name: 'Dzongkhag Labels',
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
				type: layer.id === 'dzongkhag' ? 'polygon' : 'text',
			}));
	}

	constructor(
		private dzongkhagService: DzongkhagDataService,
		private ngZone: NgZone,
		private router: Router
	) {}

	ngOnInit(): void {
		// Load dzongkhag GeoJSON data
		this.loadDzongkhagData();
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
			zoom: 7,
			zoomControl: false,
			attributionControl: false,
		});

		console.log('Map created successfully');

		// Render dzongkhag layer if data is already loaded
		if (this.dzongkhagGeoJSON) {
			console.log('Data already loaded, rendering layer immediately');
			this.renderDzongkhagLayer(this.dzongkhagGeoJSON);
		} else {
			console.log('No data yet, waiting for data to load');
		}
	}

	private loadDzongkhagData(): void {
		console.log('Loading dzongkhag data...');
		this.dzongkhagService.getAllDzongkhagGeojson().subscribe({
			next: (geojsonData) => {
				console.log('Dzongkhag data loaded:', geojsonData);
				// Store the data
				this.dzongkhagGeoJSON = geojsonData;
				// Render the layer if map is already initialized
				if (this.map) {
					console.log('Map exists, rendering layer immediately');
					this.renderDzongkhagLayer(geojsonData);
				} else {
					console.log(
						'Map not yet initialized, data stored for later rendering'
					);
				}
			},
			error: (error) => {
				console.error('Error loading dzongkhag GeoJSON:', error);
			},
		});
	}
	private renderDzongkhagLayer(geojson: any): void {
		if (!this.map || !geojson) {
			console.log('Cannot render layer: map or geojson missing', {
				map: !!this.map,
				geojson: !!geojson,
			});
			return;
		}

		console.log('Rendering dzongkhag layer with data:', geojson);

		// Store the geojson data
		this.dzongkhagGeoJSON = geojson;

		// Remove existing layer if it exists
		if (this.dzongkhagLayer) {
			this.map.removeLayer(this.dzongkhagLayer);
		}

		const isNoBasemap = this.currentBasemap === 'none';

		// Create GeoJSON layer
		this.dzongkhagLayer = L.geoJSON(geojson, {
			style: (feature) => ({
				fillColor: 'transparent',
				fillOpacity: 0,
				color: isNoBasemap ? '#6D8AA3' : '#3388ff',
				weight: 2,
				opacity: 1,
			}),
			onEachFeature: (feature, layer) => {
				const props = feature.properties;
				console.log('Processing feature:', props);

				// Bind tooltip for hover
				layer.bindTooltip(
					`<div style="text-align: center; font-weight: 600;">${
						props.name || 'Unknown'
					} | ${props.areaCode || 'N/A'}</div>`,
					{
						permanent: false,
						direction: 'top',
						className: 'hover-tooltip',
					}
				);

				// Add hover effects
				layer.on('mouseover', (e) => {
					(layer as any).setStyle({
						fillColor: '#6D8AA3',
						weight: 3,
						fillOpacity: 0.7,
					});
				});

				layer.on('mouseout', (e) => {
					// Only reset style if this feature is not the selected one
					if (
						!this.selectedDzongkhag ||
						this.selectedDzongkhag.id !== props.id
					) {
						this.dzongkhagLayer?.resetStyle(layer as any);
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
					if (this.dzongkhagLayer) {
						this.dzongkhagLayer.eachLayer((l: any) => {
							this.dzongkhagLayer?.resetStyle(l);
						});
					}

					// Set the clicked layer style to maintain #6D8AA3 fill
					(layer as any).setStyle({
						fillColor: '#6D8AA3',
						weight: 3,
						fillOpacity: 0.7,
					});

					// Run inside NgZone to ensure Angular change detection
					this.ngZone.run(() => {
						this.openDrawer(props);
					});
				});
			},
		});

		// Add the layer to the map
		this.dzongkhagLayer.addTo(this.map);
		console.log('Layer added to map');

		// Fit bounds to dzongkhag layer
		this.map.fitBounds(this.dzongkhagLayer.getBounds());
		console.log('Map bounds fitted');
	}

	switchBasemap(basemap: 'none' | 'google' | 'osm'): void {
		if (!this.map) return;

		// Remove existing base layer
		if (this.baseLayer) {
			this.map.removeLayer(this.baseLayer);
			this.baseLayer = undefined;
		}

		if (basemap === 'none') {
			// No base map - will show default gray background
			this.currentBasemap = 'none';
		} else {
			// Add tile layer
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

		// Re-render dzongkhag layer to update styling
		this.renderDzongkhagLayer(this.dzongkhagGeoJSON);
	}

	// Control widget methods
	toggleSection(section: 'basemaps' | 'layers' | 'legend' | 'download'): void {
		this.expandedSection = this.expandedSection === section ? null : section;
	}

	toggleLayer(layerId: string): void {
		const layer = this.layers.find((l) => l.id === layerId);
		if (layer) {
			layer.enabled = !layer.enabled;

			if (layerId === 'dzongkhag') {
				this.toggleDzongkhagLayer();
			}
		}
	}

	private toggleDzongkhagLayer(): void {
		if (!this.map || !this.dzongkhagLayer) return;

		const layer = this.layers.find((l) => l.id === 'dzongkhag');
		if (layer?.enabled) {
			this.dzongkhagLayer.addTo(this.map);
		} else {
			this.map.removeLayer(this.dzongkhagLayer);
		}
	}

	downloadMap(format: string): void {
		console.log(`Downloading map as ${format}`);
		// Implement download functionality based on format
		// For now, just logging
	}

	openDrawer(dzongkhagProps: any): void {
		// Generate fake statistics for the selected dzongkhag
		this.selectedDzongkhag = {
			id: dzongkhagProps.id,
			name: dzongkhagProps.name,
			areaCode: dzongkhagProps.areaCode,
			type: dzongkhagProps.type || 'Dzongkhag',
			region: dzongkhagProps.region || 'N/A',
			stats: {
				gewogs: Math.floor(Math.random() * 15) + 5, // Random between 5-20
				thromdes: Math.floor(Math.random() * 3), // Random between 0-2
				chiwogs: Math.floor(Math.random() * 30) + 10, // Random between 10-40
				laps: Math.floor(Math.random() * 60) + 20, // Random between 20-80
				eaAreas: Math.floor(Math.random() * 500) + 100, // Random between 100-600
			},
		};
		this.drawerOpen = true;
	}

	closeDrawer(): void {
		this.drawerOpen = false;

		// Reset all layer styles when closing drawer
		if (this.dzongkhagLayer) {
			this.dzongkhagLayer.eachLayer((layer: any) => {
				this.dzongkhagLayer?.resetStyle(layer);
			});
		}

		this.selectedDzongkhag = null;
	}

	downloadDzongkhagData(): void {
		if (this.selectedDzongkhag) {
			console.log(`Downloading data for ${this.selectedDzongkhag.name}`);
			// Implement download functionality for specific dzongkhag data
			// For now, just logging
		}
	}

	viewDzongkhagDetails(): void {
		if (this.selectedDzongkhag && this.selectedDzongkhag.id) {
			// Navigate to dzongkhag viewer with the selected dzongkhag ID
			console.log(
				'navigating to dzongkhag viewer for ID:',
				this.selectedDzongkhag.id
			);
			this.router.navigate(['/dzongkhag-viewer', this.selectedDzongkhag.id]);
		}
	}

	ngOnDestroy(): void {
		// Clean up map resources
		if (this.map) {
			this.map.remove();
		}
	}
}
