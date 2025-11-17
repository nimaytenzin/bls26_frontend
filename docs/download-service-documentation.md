# Download Service Documentation

## Overview
The `DownloadService` is a centralized utility service for handling file downloads in various formats (GeoJSON, KML, CSV). It provides easy-to-use methods for converting and downloading spatial and tabular data.

## Location
`src/app/core/utility/download.service.ts`

## Features
- **GeoJSON Downloads**: Export GeoJSON data as `.geojson` files
- **KML Conversion**: Convert GeoJSON to KML format for use in Google Earth and other GIS tools
- **CSV Export**: Extract attributes from GeoJSON or arrays and export as CSV
- **Batch Downloads**: Download all formats at once
- **Generic Downloads**: Download any JSON data or array

## Usage Examples

### Basic Setup
```typescript
import { DownloadService } from '@core/utility/download.service';

constructor(private downloadService: DownloadService) {}
```

### 1. Download GeoJSON
```typescript
this.downloadService.downloadGeoJSON({
  data: geojsonData,
  filename: 'admin_zones.geojson'
});
```

### 2. Download KML
```typescript
this.downloadService.downloadKML({
  data: geojsonData,
  filename: 'admin_zones.kml',
  layerName: 'Administrative Zones'
});
```

### 3. Download CSV from GeoJSON
```typescript
this.downloadService.downloadCSV({
  data: geojsonData,
  filename: 'admin_zones.csv',
  excludeFields: ['id', 'internalCode'],  // Optional
  includeGeometry: false  // Optional: include geometry coordinates
});
```

### 4. Download All Formats at Once
```typescript
this.downloadService.downloadAllFormats(
  geojsonData,
  'admin_zones',  // Base filename (extensions added automatically)
  {
    layerName: 'Administrative Zones',
    excludeCSVFields: ['id'],
    includeGeometryInCSV: false
  }
);
```
This will generate:
- `admin_zones.geojson`
- `admin_zones.kml`
- `admin_zones.csv`

### 5. Download Array as CSV
```typescript
const data = [
  { name: 'Zone 1', population: 1000, households: 250 },
  { name: 'Zone 2', population: 2000, households: 500 }
];

this.downloadService.downloadArrayAsCSV(
  data,
  'zones_data.csv',
  ['internalId']  // Optional: fields to exclude
);
```

### 6. Download Generic JSON
```typescript
this.downloadService.downloadJSON(
  { statistics: stats, metadata: meta },
  'report_data.json'
);
```

## API Reference

### Methods

#### `downloadGeoJSON(options: DownloadOptions)`
Downloads GeoJSON data as a `.geojson` file.

**Parameters:**
- `data`: The GeoJSON object
- `filename`: Output filename

---

#### `downloadKML(options: DownloadOptions & { layerName?: string })`
Converts GeoJSON to KML and downloads.

**Parameters:**
- `data`: The GeoJSON object
- `filename`: Output filename
- `layerName`: (Optional) Name for the KML layer

**Supported Geometry Types:**
- Point, MultiPoint
- LineString, MultiLineString
- Polygon, MultiPolygon

---

#### `downloadCSV(options: CSVOptions)`
Extracts attributes from GeoJSON features and downloads as CSV.

**Parameters:**
- `data`: The GeoJSON object
- `filename`: Output filename
- `excludeFields`: (Optional) Array of field names to exclude
- `includeGeometry`: (Optional) Whether to include geometry type and coordinates

---

#### `downloadAllFormats(geojson, baseFilename, options?)`
Downloads GeoJSON, KML, and CSV versions of the data.

**Parameters:**
- `geojson`: The GeoJSON object
- `baseFilename`: Base name (extensions added automatically)
- `options`: (Optional)
  - `layerName`: KML layer name
  - `excludeCSVFields`: Fields to exclude from CSV
  - `includeGeometryInCSV`: Include geometry in CSV

---

#### `downloadArrayAsCSV(data, filename, excludeFields?)`
Downloads an array of objects as CSV.

**Parameters:**
- `data`: Array of objects
- `filename`: Output filename
- `excludeFields`: (Optional) Field names to exclude

---

#### `downloadJSON(data, filename)`
Downloads any data as JSON.

**Parameters:**
- `data`: Any serializable data
- `filename`: Output filename

---

## Implementation Details

### KML Conversion
- Preserves all GeoJSON properties as KML descriptions
- Handles complex geometries (holes, multi-geometries)
- Uses standard KML 2.2 format
- Properly escapes XML special characters

### CSV Export
- Auto-detects all unique fields across features
- Handles missing values gracefully
- Escapes special characters (commas, quotes, newlines)
- Optional geometry export as JSON strings

### Browser Compatibility
- Uses Blob API for file creation
- Automatically cleans up object URLs
- Works in all modern browsers

## Example: Complete Download Menu

```typescript
export class DataViewerComponent {
  constructor(private downloadService: DownloadService) {}

  // Download individual formats
  downloadGeoJSON() {
    this.downloadService.downloadGeoJSON({
      data: this.boundaries,
      filename: `${this.areaName}_boundaries.geojson`
    });
  }

  downloadKML() {
    this.downloadService.downloadKML({
      data: this.boundaries,
      filename: `${this.areaName}_boundaries.kml`,
      layerName: this.areaName
    });
  }

  downloadCSV() {
    this.downloadService.downloadCSV({
      data: this.boundaries,
      filename: `${this.areaName}_data.csv`,
      excludeFields: ['id'],
      includeGeometry: false
    });
  }

  // Download all at once
  downloadAll() {
    this.downloadService.downloadAllFormats(
      this.boundaries,
      `${this.areaName}_complete`,
      {
        layerName: this.areaName,
        excludeCSVFields: ['id'],
        includeGeometryInCSV: false
      }
    );
  }
}
```

## Notes
- All downloads happen client-side (no server required)
- File size limits depend on browser memory
- Large datasets may take a moment to process before download
- CSV exports flatten nested objects (use JSON for complex structures)
