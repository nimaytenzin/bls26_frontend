import { AdministrativeZone } from '../administrative-zone/administrative-zone.dto';
import { EnumerationArea } from '../enumeration-area/enumeration-area.dto';

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
	enumerationAreas: EnumerationArea[];
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

/**
 * Bulk Upload Response Interface
 * Response from bulk upload operations for sub-administrative zones
 */
export interface BulkUploadResponse {
	success: number;
	skipped: number;
	created: SubAdministrativeZone[];
	skippedItems: Array<{
		areaCode: string;
		administrativeZoneId: number;
		reason: string;
	}>;
	errors: Array<{
		feature: any;
		error: string;
	}>;
}

/**
 * SAZ + EA Upload Request DTO
 * Data Transfer Object for uploading a single SAZ with its corresponding EA
 */
export interface SazEaUploadDto {
	administrativeZoneId: number;
	name: string;
	areaCode: string;
	type: 'chiwog' | 'lap';
	areaSqKm: number;
	file: File; // GeoJSON file
}

/**
 * SAZ + EA Upload Response
 * Response from the upload-saz-ea endpoint
 */
export interface SazEaUploadResponse {
	subAdministrativeZone: {
		id: number;
		administrativeZoneId: number;
		name: string;
		areaCode: string;
		type: 'chiwog' | 'lap';
		areaSqKm: number;
		createdAt: string;
		updatedAt: string;
	};
	enumerationArea: {
		id: number;
		subAdministrativeZoneId: number;
		name: string; // Always "EA1"
		areaCode: string; // Always "01"
		description: string;
		areaSqKm: number; // Always 22.22
		createdAt: string;
		updatedAt: string;
	};
}
