export interface Dzongkhag {
	id: number;
	name: string;
	areaCode: string;
	areaSqKm: number;
	geom: any; // GeoJSON geometry
	createdAt: Date;
	updatedAt: Date;
}

export interface DzongkhagGeoJSON {
	type: 'FeatureCollection';
	features: DzongkhagFeature[];
}

export interface DzongkhagFeature {
	type: 'Feature';
	properties: DzongkhagProperties;
	geometry: DzongkhagGeometry;
}

export interface DzongkhagProperties {
	id: number;
	name: string;
	areaCode?: string;
	areaSqKm?: number;
	[key: string]: any; // Allow additional properties
}

export interface DzongkhagGeometry {
	type:
		| 'MultiPolygon'
		| 'Polygon'
		| 'Point'
		| 'LineString'
		| 'MultiPoint'
		| 'MultiLineString';
	coordinates: any;
}

export interface CreateDzongkhagDto {
	name: string;
	areaCode?: string;
	areaSqKm?: number;
}

export interface UpdateDzongkhagDto {
	name?: string;
	areaCode?: string;
	areaSqKm?: number;
}

export interface ApiResponse<T> {
	statusCode: number;
	message: string;
	data: T;
}
