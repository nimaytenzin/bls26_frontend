import { Dzongkhag } from '../dzongkhag/dzongkhag.interface';
export enum AdministrativeZoneType {
	Gewog = 'Gewog',
	Thromde = 'Thromde',
}
export interface AdministrativeZone {
	id: number;
	dzongkhagId: number;
	name: string;
	areaCode: string;
	type: AdministrativeZoneType;
	areaSqKm: number;
	geom: any; // GeoJSON geometry
	dzongkhag?: Dzongkhag;
}

export interface AdministrativeZoneGeoJSON {
	type: 'FeatureCollection';
	features: AdministrativeZoneFeature[];
}

export interface AdministrativeZoneFeature {
	type: 'Feature';
	id: number;
	properties: AdministrativeZoneProperties;
	geometry: AdministrativeZoneGeometry;
}

export interface AdministrativeZoneProperties {
	id: number;
	dzongkhagId: number;
	name: string;
	areaCode?: string;
	type: AdministrativeZoneType;
	areaSqKm?: number;
	[key: string]: any; // Allow additional properties
}

export interface AdministrativeZoneGeometry {
	type:
		| 'MultiPolygon'
		| 'Polygon'
		| 'Point'
		| 'LineString'
		| 'MultiPoint'
		| 'MultiLineString';
	coordinates: any;
}

export interface CreateAdministrativeZoneDto {
	dzongkhagId: number;
	name: string;
	areaCode?: string;
	type: AdministrativeZoneType;
	areaSqKm?: number;
}

export interface UpdateAdministrativeZoneDto {
	dzongkhagId?: number;
	name?: string;
	areaCode?: string;
	type?: AdministrativeZoneType;
	areaSqKm?: number;
}

export interface ApiResponse<T> {
	statusCode: number;
	message: string;
	data: T;
}
