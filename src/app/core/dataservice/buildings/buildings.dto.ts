/**
 * Building Entity Interface
 */
export interface Building {
	id: number;
	structureId: number;
	enumerationAreaId: number;
	source?: string;
	geom?: any; // Geometry data
	enumerationArea?: any; // Enumeration area reference
}

/**
 * Update Building DTO
 */
export interface UpdateBuildingDto {
	structureId?: number;
	enumerationAreaId?: number;
	source?: string;
	geom?: any;
}

/**
 * Building GeoJSON Feature Interface
 */
export interface BuildingGeoJsonFeature {
	type: 'Feature';
	geometry: {
		type: 'MultiPolygon' | 'Polygon';
		coordinates: number[][][] | number[][][][];
	};
	properties: {
		id: number;
		structureId: number;
		enumerationAreaId: number;
		source?: string;
	};
}

/**
 * Building GeoJSON FeatureCollection Interface
 */
export interface BuildingGeoJsonFeatureCollection {
	type: 'FeatureCollection';
	features: BuildingGeoJsonFeature[];
}

/**
 * Building Statistics Interface
 */
export interface BuildingStatistics {
	totalBuildings: number;
	enumerationAreaId: number;
	averageArea?: number;
	maxArea?: number;
	minArea?: number;
}
