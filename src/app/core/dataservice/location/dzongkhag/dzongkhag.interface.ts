import { AdministrativeZone } from '../administrative-zone/administrative-zone.dto';
import { EnumerationArea } from '../enumeration-area/enumeration-area.dto';

export interface Dzongkhag {
	id: number;
	name: string;
	areaCode: string;
	areaSqKm: number;
	geom: any; // GeoJSON geometry
	createdAt: Date;
	updatedAt: Date;
	administrativeZones?: AdministrativeZone[]; // For hierarchical responses
}

export interface DzongkhagEnumerationAreasResponse {
	dzongkhagId: number;
	dzongkhagName: string;
	totalCount: number;
	enumerationAreas: EnumerationArea[];
}

export interface DzongkhagHierarchicalResponse extends Dzongkhag {
	administrativeZones: AdministrativeZone[];
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
