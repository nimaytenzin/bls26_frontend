import { AdministrativeZone } from '../administrative-zone/administrative-zone.dto';

export enum SubAdministrativeZoneType {
	CHIWOG = 'chiwog',
	LAP = 'lap',
}

export interface SubAdministrativeZone {
	id: number;
	administrativeZoneId: number;
	name: string;
	areaCode?: string;
	type: SubAdministrativeZoneType;
	areaSqKm?: number;
	geom?: any; // GeoJSON geometry
	createdAt?: Date;
	updatedAt?: Date;

	administrativeZone?: AdministrativeZone;
}

export interface SubAdministrativeZoneGeoJSON {
	type: 'FeatureCollection';
	features: SubAdministrativeZoneFeature[];
}

export interface SubAdministrativeZoneFeature {
	type: 'Feature';
	id: number;
	properties: SubAdministrativeZoneProperties;
	geometry: SubAdministrativeZoneGeometry;
}

export interface SubAdministrativeZoneProperties {
	id: number;
	administrativeZoneId: number;
	name: string;
	areaCode?: string;
	type: SubAdministrativeZoneType;
	areaSqKm?: number;
	[key: string]: any; // Allow additional properties
}

export interface SubAdministrativeZoneGeometry {
	type:
		| 'MultiPolygon'
		| 'Polygon'
		| 'Point'
		| 'LineString'
		| 'MultiPoint'
		| 'MultiLineString';
	coordinates: any;
}

export interface CreateSubAdministrativeZoneDto {
	administrativeZoneId: number;
	name: string;
	areaCode?: string;
	type: SubAdministrativeZoneType;
	areaSqKm?: number;
}

export interface UpdateSubAdministrativeZoneDto {
	administrativeZoneId?: number;
	name?: string;
	areaCode?: string;
	type?: SubAdministrativeZoneType;
	areaSqKm?: number;
}

export interface ApiResponse<T> {
	statusCode: number;
	message: string;
	data: T;
}
