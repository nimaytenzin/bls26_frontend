import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { DzongkhagDataService } from '../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import {
	BasemapService,
	BasemapConfig,
} from '../../../core/utility/basemap.service';

import { PrimeNgModules } from '../../../primeng.modules';

@Component({
	selector: 'app-public-home',
	templateUrl: './public-home.component.html',
	styleUrls: ['./public-home.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules, FormsModule],
})
export class PublicHomeComponent implements OnInit, OnDestroy, AfterViewInit {
	private map?: L.Map;
	private dzongkhagGeoJSON: any;
	private dzongkhagLayer?: L.GeoJSON;

	private baseLayer?: L.TileLayer;
	selectedBasemapId = 'positron'; // Default basemap
	basemapCategories: Record<
		string,
		{ label: string; basemaps: BasemapConfig[] }
	> = {};

	// Tab state
	activeTab: 'overview' | 'dzongkhags' = 'overview';

	// Side drawer state
	drawerOpen = false;
	selectedDzongkhag: any = null;

	// Boundaries toggle
	showBoundaries = true;

	// Dzongkhag list
	dzongkhagList: any[] = [];

	// Filter properties
	selectedFilterDzongkhag: number | null = null;
	dzongkhagFilterOptions: { label: string; value: number }[] = [];

	constructor(
		private dzongkhagService: DzongkhagDataService,
		private ngZone: NgZone,
		private router: Router,
		private basemapService: BasemapService
	) {}

	ngOnInit(): void {
		// Initialize basemap categories from service
		this.basemapCategories = this.basemapService.getBasemapCategories();

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

		// Add default basemap
		this.switchBasemap();

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

				// Build dzongkhag list from GeoJSON
				if (geojsonData && geojsonData.features) {
					this.dzongkhagList = geojsonData.features.map((feature: any) => ({
						id: feature.properties.id,
						name: feature.properties.name,
						areaCode: feature.properties.areaCode,
						type: feature.properties.type,
					}));

					// Build filter options
					this.dzongkhagFilterOptions = geojsonData.features.map(
						(feature: any) => ({
							label: feature.properties.name,
							value: feature.properties.id,
						})
					);
				}

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

		// Create GeoJSON layer
		this.dzongkhagLayer = L.geoJSON(geojson, {
			style: (feature) => ({
				fillColor: 'transparent',
				fillOpacity: 0,
				color: '#6D8AA3',
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

	switchBasemap(): void {
		if (!this.map) return;

		// Remove existing base layer
		if (this.baseLayer) {
			this.map.removeLayer(this.baseLayer);
			this.baseLayer = undefined;
		}

		// Get basemap configuration
		const basemapConfig = this.basemapService.getBasemap(
			this.selectedBasemapId
		);

		if (!basemapConfig) {
			console.warn('Basemap not found:', this.selectedBasemapId);
			return;
		}

		// Add new base layer
		this.baseLayer = L.tileLayer(basemapConfig.url, {
			...basemapConfig.options,
			attribution: basemapConfig.attribution,
		});

		this.baseLayer.addTo(this.map);

		// Re-render dzongkhag layer to update styling if needed
		if (this.dzongkhagGeoJSON) {
			this.renderDzongkhagLayer(this.dzongkhagGeoJSON);
		}
	}

	// Control methods
	toggleBoundaries(): void {
		if (!this.map || !this.dzongkhagLayer) return;

		if (this.showBoundaries) {
			this.dzongkhagLayer.addTo(this.map);
		} else {
			this.map.removeLayer(this.dzongkhagLayer);
		}
	}

	selectDzongkhag(dzongkhag: any): void {
		this.openDrawer(dzongkhag);
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
				gewogs: Math.floor(Math.random() * 15) + 5,
				thromdes: Math.floor(Math.random() * 3),
				chiwogs: Math.floor(Math.random() * 30) + 10,
				laps: Math.floor(Math.random() * 60) + 20,
				eaAreas: Math.floor(Math.random() * 500) + 100,
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

	// Download methods
	downloadGeoJSON(): void {
		if (!this.dzongkhagGeoJSON) {
			console.warn('No GeoJSON data available to download');
			return;
		}

		const dataStr = JSON.stringify(this.dzongkhagGeoJSON, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'dzongkhag-data.geojson';
		link.click();
		URL.revokeObjectURL(url);
	}

	downloadKML(): void {
		if (!this.dzongkhagGeoJSON) {
			console.warn('No GeoJSON data available to convert to KML');
			return;
		}

		// Simple GeoJSON to KML conversion
		let kml = '<?xml version="1.0" encoding="UTF-8"?>\n';
		kml += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
		kml += '  <Document>\n';
		kml += '    <name>Dzongkhag Data</name>\n';

		this.dzongkhagGeoJSON.features.forEach((feature: any) => {
			const props = feature.properties;
			const coords = feature.geometry.coordinates;

			kml += '    <Placemark>\n';
			kml += `      <name>${props.name || 'Unknown'}</name>\n`;
			kml += '      <description>\n';
			kml += `        Area Code: ${props.areaCode || 'N/A'}\n`;
			kml += `        Type: ${props.type || 'N/A'}\n`;
			kml += '      </description>\n';

			// Simple polygon coordinates (assuming MultiPolygon)
			if (feature.geometry.type === 'MultiPolygon') {
				kml += '      <MultiGeometry>\n';
				coords.forEach((polygon: any) => {
					kml += '        <Polygon>\n';
					kml += '          <outerBoundaryIs>\n';
					kml += '            <LinearRing>\n';
					kml += '              <coordinates>\n';
					polygon[0].forEach((coord: any) => {
						kml += `                ${coord[0]},${coord[1]},0\n`;
					});
					kml += '              </coordinates>\n';
					kml += '            </LinearRing>\n';
					kml += '          </outerBoundaryIs>\n';
					kml += '        </Polygon>\n';
				});
				kml += '      </MultiGeometry>\n';
			}

			kml += '    </Placemark>\n';
		});

		kml += '  </Document>\n';
		kml += '</kml>';

		const dataBlob = new Blob([kml], {
			type: 'application/vnd.google-earth.kml+xml',
		});
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'dzongkhag-data.kml';
		link.click();
		URL.revokeObjectURL(url);
	}

	downloadCSV(): void {
		if (!this.dzongkhagGeoJSON) {
			console.warn('No data available to download as CSV');
			return;
		}

		// Create CSV header
		let csv = 'ID,Name,Area Code,Type\n';

		// Add data rows
		this.dzongkhagGeoJSON.features.forEach((feature: any) => {
			const props = feature.properties;
			csv += `${props.id || ''},${props.name || ''},${props.areaCode || ''},${
				props.type || ''
			}\n`;
		});

		const dataBlob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'dzongkhag-attributes.csv';
		link.click();
		URL.revokeObjectURL(url);
	}

	// Filter method
	applyFilter(): void {
		if (!this.selectedFilterDzongkhag) {
			return;
		}

		// Find the selected dzongkhag in the list
		const dzongkhag = this.dzongkhagList.find(
			(d) => d.id === this.selectedFilterDzongkhag
		);

		if (dzongkhag) {
			// Open the drawer with the selected dzongkhag
			this.selectDzongkhag(dzongkhag);

			// Optionally zoom to the selected dzongkhag
			if (this.map && this.dzongkhagLayer) {
				this.dzongkhagLayer.eachLayer((layer: any) => {
					if (layer.feature.properties.id === this.selectedFilterDzongkhag) {
						const bounds = layer.getBounds();
						this.map?.fitBounds(bounds);
					}
				});
			}
		}
	}

	// Navigation method
	navigateToLogin(): void {
		this.router.navigate(['/auth/login']);
	}

	ngOnDestroy(): void {
		// Clean up map resources
		if (this.map) {
			this.map.remove();
		}
	}
}
