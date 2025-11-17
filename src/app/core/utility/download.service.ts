import { Injectable } from '@angular/core';

export interface DownloadOptions {
	filename: string;
	data: any;
}

export interface CSVOptions extends DownloadOptions {
	excludeFields?: string[];
	includeGeometry?: boolean;
}

@Injectable({
	providedIn: 'root',
})
export class DownloadService {
	constructor() {}

	/**
	 * Download GeoJSON file
	 */
	downloadGeoJSON(options: DownloadOptions): void {
		const { data, filename } = options;
		const jsonStr = JSON.stringify(data, null, 2);
		this.downloadFile(jsonStr, filename, 'application/json');
	}

	/**
	 * Download KML file from GeoJSON
	 */
	downloadKML(options: DownloadOptions & { layerName?: string }): void {
		const { data, filename, layerName } = options;
		const kml = this.convertGeoJSONToKML(data, layerName || 'Layer');
		this.downloadFile(kml, filename, 'application/vnd.google-earth.kml+xml');
	}

	/**
	 * Download CSV file from GeoJSON attributes
	 */
	downloadCSV(options: CSVOptions): void {
		const {
			data,
			filename,
			excludeFields = [],
			includeGeometry = false,
		} = options;
		const csv = this.convertGeoJSONToCSV(data, excludeFields, includeGeometry);
		this.downloadFile(csv, filename, 'text/csv');
	}

	/**
	 * Convert GeoJSON to KML format
	 */
	private convertGeoJSONToKML(geojson: any, layerName: string): string {
		let placemarks = '';

		if (geojson && geojson.features) {
			geojson.features.forEach((feature: any) => {
				const name =
					feature.properties?.name || feature.properties?.areaName || 'Unnamed';
				const description = this.buildKMLDescription(feature.properties);
				const coordinates = this.extractKMLCoordinates(feature.geometry);

				placemarks += `
		<Placemark>
			<name>${this.escapeXML(name)}</name>
			<description>${this.escapeXML(description)}</description>
			${coordinates}
		</Placemark>`;
			});
		}

		return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
	<Document>
		<name>${this.escapeXML(layerName)}</name>
		<description>${this.escapeXML(layerName)} features</description>
${placemarks}
	</Document>
</kml>`;
	}

	/**
	 * Build KML description from properties
	 */
	private buildKMLDescription(properties: any): string {
		if (!properties) return '';

		const entries = Object.entries(properties)
			.filter(([key]) => key !== 'name' && key !== 'areaName')
			.map(([key, value]) => `${key}: ${value}`)
			.join('\n');

		return entries;
	}

	/**
	 * Extract coordinates from GeoJSON geometry for KML
	 */
	private extractKMLCoordinates(geometry: any): string {
		if (!geometry) return '';

		switch (geometry.type) {
			case 'Point':
				return `<Point><coordinates>${this.formatKMLCoords(
					geometry.coordinates
				)}</coordinates></Point>`;

			case 'LineString':
				return `<LineString><coordinates>${this.formatKMLCoordsArray(
					geometry.coordinates
				)}</coordinates></LineString>`;

			case 'Polygon':
				return this.formatKMLPolygon(geometry.coordinates);

			case 'MultiPolygon':
				let multiPolygonKML = '<MultiGeometry>';
				geometry.coordinates.forEach((polygon: any) => {
					multiPolygonKML += this.formatKMLPolygon(polygon);
				});
				multiPolygonKML += '</MultiGeometry>';
				return multiPolygonKML;

			case 'MultiPoint':
				let multiPointKML = '<MultiGeometry>';
				geometry.coordinates.forEach((coord: any) => {
					multiPointKML += `<Point><coordinates>${this.formatKMLCoords(
						coord
					)}</coordinates></Point>`;
				});
				multiPointKML += '</MultiGeometry>';
				return multiPointKML;

			case 'MultiLineString':
				let multiLineKML = '<MultiGeometry>';
				geometry.coordinates.forEach((lineCoords: any) => {
					multiLineKML += `<LineString><coordinates>${this.formatKMLCoordsArray(
						lineCoords
					)}</coordinates></LineString>`;
				});
				multiLineKML += '</MultiGeometry>';
				return multiLineKML;

			default:
				return '';
		}
	}

	/**
	 * Format polygon for KML
	 */
	private formatKMLPolygon(coordinates: number[][][]): string {
		const outerRing = coordinates[0];
		let polygonKML = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${this.formatKMLCoordsArray(
			outerRing
		)}</coordinates></LinearRing></outerBoundaryIs>`;

		// Handle inner rings (holes)
		for (let i = 1; i < coordinates.length; i++) {
			polygonKML += `<innerBoundaryIs><LinearRing><coordinates>${this.formatKMLCoordsArray(
				coordinates[i]
			)}</coordinates></LinearRing></innerBoundaryIs>`;
		}
		polygonKML += `</Polygon>`;
		return polygonKML;
	}

	/**
	 * Format single coordinate for KML (lon,lat,alt)
	 */
	private formatKMLCoords(coords: number[]): string {
		const lon = coords[0];
		const lat = coords[1];
		const alt = coords[2] || 0;
		return `${lon},${lat},${alt}`;
	}

	/**
	 * Format array of coordinates for KML
	 */
	private formatKMLCoordsArray(coordsArray: number[][]): string {
		return coordsArray.map((coord) => this.formatKMLCoords(coord)).join(' ');
	}

	/**
	 * Escape XML special characters
	 */
	private escapeXML(str: string): string {
		if (!str) return '';
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;');
	}

	/**
	 * Convert GeoJSON to CSV format
	 */
	private convertGeoJSONToCSV(
		geojson: any,
		excludeFields: string[] = [],
		includeGeometry: boolean = false
	): string {
		if (!geojson || !geojson.features || geojson.features.length === 0) {
			return '';
		}

		// Get all unique property keys from all features
		const allKeys = new Set<string>();
		geojson.features.forEach((feature: any) => {
			if (feature.properties) {
				Object.keys(feature.properties).forEach((key) => allKeys.add(key));
			}
		});

		// Filter out excluded fields
		const headers = Array.from(allKeys).filter(
			(key) => !excludeFields.includes(key)
		);

		// Add geometry columns if requested
		if (includeGeometry) {
			headers.push('geometry_type', 'geometry_coordinates');
		}

		// Create CSV header
		const csvRows: string[] = [];
		csvRows.push(headers.map((h) => this.escapeCSV(h)).join(','));

		// Create CSV rows
		geojson.features.forEach((feature: any) => {
			const row: string[] = [];

			// Add property values
			headers.forEach((header) => {
				if (header === 'geometry_type' && includeGeometry) {
					row.push(this.escapeCSV(feature.geometry?.type || ''));
				} else if (header === 'geometry_coordinates' && includeGeometry) {
					row.push(
						this.escapeCSV(JSON.stringify(feature.geometry?.coordinates || ''))
					);
				} else {
					const value = feature.properties?.[header];
					row.push(this.escapeCSV(value));
				}
			});

			csvRows.push(row.join(','));
		});

		return csvRows.join('\n');
	}

	/**
	 * Escape CSV special characters
	 */
	private escapeCSV(value: any): string {
		if (value === null || value === undefined) {
			return '';
		}

		const str = String(value);

		// If the string contains comma, newline, or quotes, wrap it in quotes
		if (str.includes(',') || str.includes('\n') || str.includes('"')) {
			// Escape quotes by doubling them
			return `"${str.replace(/"/g, '""')}"`;
		}

		return str;
	}

	/**
	 * Generic file download helper
	 */
	private downloadFile(
		content: string,
		filename: string,
		mimeType: string
	): void {
		const blob = new Blob([content], { type: mimeType });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);

		link.setAttribute('href', url);
		link.setAttribute('download', filename);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Clean up the URL object
		setTimeout(() => URL.revokeObjectURL(url), 100);
	}

	/**
	 * Download multiple formats at once
	 */
	downloadAllFormats(
		geojson: any,
		baseFilename: string,
		options?: {
			layerName?: string;
			excludeCSVFields?: string[];
			includeGeometryInCSV?: boolean;
		}
	): void {
		const {
			layerName = 'Layer',
			excludeCSVFields = [],
			includeGeometryInCSV = false,
		} = options || {};

		// Download GeoJSON
		this.downloadGeoJSON({
			data: geojson,
			filename: `${baseFilename}.geojson`,
		});

		// Download KML
		this.downloadKML({
			data: geojson,
			filename: `${baseFilename}.kml`,
			layerName,
		});

		// Download CSV
		this.downloadCSV({
			data: geojson,
			filename: `${baseFilename}.csv`,
			excludeFields: excludeCSVFields,
			includeGeometry: includeGeometryInCSV,
		});
	}

	/**
	 * Download data as JSON (for non-GeoJSON data)
	 */
	downloadJSON(data: any, filename: string): void {
		const jsonStr = JSON.stringify(data, null, 2);
		this.downloadFile(jsonStr, filename, 'application/json');
	}

	/**
	 * Download array of objects as CSV
	 */
	downloadArrayAsCSV(
		data: any[],
		filename: string,
		excludeFields: string[] = []
	): void {
		if (!data || data.length === 0) {
			console.warn('No data to download');
			return;
		}

		// Get all unique keys
		const allKeys = new Set<string>();
		data.forEach((item) => {
			Object.keys(item).forEach((key) => allKeys.add(key));
		});

		// Filter out excluded fields
		const headers = Array.from(allKeys).filter(
			(key) => !excludeFields.includes(key)
		);

		// Create CSV
		const csvRows: string[] = [];
		csvRows.push(headers.map((h) => this.escapeCSV(h)).join(','));

		data.forEach((item) => {
			const row = headers.map((header) => this.escapeCSV(item[header]));
			csvRows.push(row.join(','));
		});

		this.downloadFile(csvRows.join('\n'), filename, 'text/csv');
	}
}
