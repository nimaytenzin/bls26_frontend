import { Injectable } from '@angular/core';
import * as L from 'leaflet';

/**
 * Basemap configuration interface
 */
export interface BasemapConfig {
	id: string;
	name: string;
	description: string;
	url: string;
	options: L.TileLayerOptions;
	attribution: string;
	category: 'street' | 'satellite' | 'terrain' | 'light' | 'dark' | 'outline';
	thumbnail?: string;
}

/**
 * Service for managing various basemap options
 */
@Injectable({
	providedIn: 'root',
})
export class BasemapService {
	/**
	 * Available basemap configurations
	 */
	private readonly basemaps: Record<string, BasemapConfig> = {
		// OpenStreetMap Standard
		osm: {
			id: 'osm',
			name: 'OpenStreetMap',
			description: 'Standard OpenStreetMap tiles',
			url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
			attribution: '© OpenStreetMap contributors',
			category: 'street',
			options: {
				maxZoom: 19,
				minZoom: 1,
			},
		},

		// OpenStreetMap Light
		osmLight: {
			id: 'osmLight',
			name: 'OSM Light',
			description: 'Light themed OpenStreetMap',
			url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
			attribution: '© OpenStreetMap contributors © CARTO',
			category: 'light',
			options: {
				maxZoom: 20,
				minZoom: 1,
				subdomains: 'abcd',
			},
		},

		// OpenStreetMap Dark
		osmDark: {
			id: 'osmDark',
			name: 'OSM Dark',
			description: 'Dark themed OpenStreetMap',
			url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
			attribution: '© OpenStreetMap contributors © CARTO',
			category: 'dark',
			options: {
				maxZoom: 20,
				minZoom: 1,
				subdomains: 'abcd',
			},
		},

		// CartoDB Positron (Light, No Labels)
		positron: {
			id: 'positron',
			name: 'Positron',
			description: 'Clean light basemap without labels',
			url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
			attribution: '© OpenStreetMap contributors © CARTO',
			category: 'light',
			options: {
				maxZoom: 20,
				minZoom: 1,
				subdomains: 'abcd',
			},
		},

		// CartoDB Dark Matter (Dark, No Labels)
		darkMatter: {
			id: 'darkMatter',
			name: 'Dark Matter',
			description: 'Clean dark basemap without labels',
			url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
			attribution: '© OpenStreetMap contributors © CARTO',
			category: 'dark',
			options: {
				maxZoom: 20,
				minZoom: 1,
				subdomains: 'abcd',
			},
		},

		// OpenStreetMap Outline Only
		osmOutline: {
			id: 'osmOutline',
			name: 'OSM Outline',
			description: 'Minimal outline basemap',
			url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
			attribution: '© OpenStreetMap contributors © CARTO',
			category: 'outline',
			options: {
				maxZoom: 20,
				minZoom: 1,
				subdomains: 'abcd',
			},
		},

		// OpenTopoMap (Terrain)
		openTopo: {
			id: 'openTopo',
			name: 'OpenTopoMap',
			description: 'Topographic map with contours',
			url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
			attribution:
				'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
			category: 'terrain',
			options: {
				maxZoom: 17,
				minZoom: 1,
				subdomains: 'abc',
			},
		},

		// Stamen Terrain
		stamenTerrain: {
			id: 'stamenTerrain',
			name: 'Stamen Terrain',
			description: 'Terrain map with hill shading',
			url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
			attribution:
				'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under ODbL',
			category: 'terrain',
			options: {
				maxZoom: 18,
				minZoom: 0,
				subdomains: 'abcd',
			},
		},

		// Stamen Toner (High Contrast Outline)
		stamenToner: {
			id: 'stamenToner',
			name: 'Stamen Toner',
			description: 'High contrast black and white',
			url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.png',
			attribution:
				'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under ODbL',
			category: 'outline',
			options: {
				maxZoom: 20,
				minZoom: 0,
				subdomains: 'abcd',
			},
		},

		// Stamen Toner Lite (Light Outline)
		stamenTonerLite: {
			id: 'stamenTonerLite',
			name: 'Stamen Toner Lite',
			description: 'Light outline basemap',
			url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.png',
			attribution:
				'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under ODbL',
			category: 'light',
			options: {
				maxZoom: 20,
				minZoom: 0,
				subdomains: 'abcd',
			},
		},

		// Google Satellite (Note: Requires API key for production)
		googleSatellite: {
			id: 'googleSatellite',
			name: 'Google Satellite',
			description: 'Google satellite imagery',
			url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
			attribution: '© Google',
			category: 'satellite',
			options: {
				maxZoom: 20,
				minZoom: 1,
			},
		},

		// Google Hybrid (Satellite + Labels)
		googleHybrid: {
			id: 'googleHybrid',
			name: 'Google Hybrid',
			description: 'Google satellite with labels',
			url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
			attribution: '© Google',
			category: 'satellite',
			options: {
				maxZoom: 20,
				minZoom: 1,
			},
		},

		// Esri World Imagery
		esriSatellite: {
			id: 'esriSatellite',
			name: 'Esri Satellite',
			description: 'Esri world satellite imagery',
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			attribution:
				'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
			category: 'satellite',
			options: {
				maxZoom: 19,
				minZoom: 1,
			},
		},

		// Esri World Street Map
		esriStreet: {
			id: 'esriStreet',
			name: 'Esri Street',
			description: 'Esri world street map',
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
			attribution: 'Tiles © Esri',
			category: 'street',
			options: {
				maxZoom: 19,
				minZoom: 1,
			},
		},

		// Esri World Topo
		esriTopo: {
			id: 'esriTopo',
			name: 'Esri Topographic',
			description: 'Esri world topographic map',
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
			attribution:
				'Tiles © Esri — Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
			category: 'terrain',
			options: {
				maxZoom: 19,
				minZoom: 1,
			},
		},

		// Esri World Gray Canvas
		esriGray: {
			id: 'esriGray',
			name: 'Esri Gray',
			description: 'Light gray canvas basemap',
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
			attribution: 'Tiles © Esri',
			category: 'light',
			options: {
				maxZoom: 16,
				minZoom: 1,
			},
		},

		// Humanitarian OpenStreetMap
		humanitarian: {
			id: 'humanitarian',
			name: 'Humanitarian OSM',
			description: 'Humanitarian focused map style',
			url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
			attribution:
				'© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team',
			category: 'street',
			options: {
				maxZoom: 19,
				minZoom: 1,
				subdomains: 'abc',
			},
		},
	};

	/**
	 * Get basemap configuration by ID
	 */
	getBasemap(id: string): BasemapConfig | null {
		return this.basemaps[id] || null;
	}

	/**
	 * Get all available basemaps
	 */
	getAllBasemaps(): BasemapConfig[] {
		return Object.values(this.basemaps);
	}

	/**
	 * Get basemaps by category
	 */
	getBasemapsByCategory(
		category: 'street' | 'satellite' | 'terrain' | 'light' | 'dark' | 'outline'
	): BasemapConfig[] {
		return Object.values(this.basemaps).filter(
			(bm) => bm.category === category
		);
	}

	/**
	 * Create Leaflet tile layer from basemap ID
	 */
	createTileLayer(id: string): L.TileLayer | null {
		const basemap = this.getBasemap(id);
		if (!basemap) return null;

		return L.tileLayer(basemap.url, {
			...basemap.options,
			attribution: basemap.attribution,
		});
	}

	/**
	 * Get default basemap (Positron - Light, No Labels)
	 */
	getDefaultBasemap(): BasemapConfig {
		return this.basemaps['positron'];
	}

	/**
	 * Get basemap IDs grouped by category
	 */
	getBasemapCategories(): Record<
		string,
		{ label: string; basemaps: BasemapConfig[] }
	> {
		return {
			street: {
				label: 'Street Maps',
				basemaps: this.getBasemapsByCategory('street'),
			},
			light: {
				label: 'Light Themes',
				basemaps: this.getBasemapsByCategory('light'),
			},
			dark: {
				label: 'Dark Themes',
				basemaps: this.getBasemapsByCategory('dark'),
			},
			satellite: {
				label: 'Satellite Imagery',
				basemaps: this.getBasemapsByCategory('satellite'),
			},
			terrain: {
				label: 'Terrain & Topographic',
				basemaps: this.getBasemapsByCategory('terrain'),
			},
			outline: {
				label: 'Outline & Minimal',
				basemaps: this.getBasemapsByCategory('outline'),
			},
		};
	}

	/**
	 * Get recommended basemaps for common use cases
	 */
	getRecommendedBasemaps(): {
		general: BasemapConfig;
		light: BasemapConfig;
		dark: BasemapConfig;
		satellite: BasemapConfig;
		outline: BasemapConfig;
	} {
		return {
			general: this.basemaps['osm'],
			light: this.basemaps['osmLight'],
			dark: this.basemaps['osmDark'],
			satellite: this.basemaps['googleSatellite'],
			outline: this.basemaps['stamenTonerLite'],
		};
	}

	/**
	 * Check if a basemap ID exists
	 */
	hasBasemap(id: string): boolean {
		return id in this.basemaps;
	}

	/**
	 * Get basemap names for dropdown/select options
	 */
	getBasemapOptions(): { value: string; label: string; category: string }[] {
		return Object.values(this.basemaps).map((bm) => ({
			value: bm.id,
			label: bm.name,
			category: bm.category,
		}));
	}
}
