import { SurveyEnumerationArea } from '../../survey-enumeration-area/survey-enumeration-area.dto';
import { SubAdministrativeZone } from '../sub-administrative-zone/sub-administrative-zone.dto';

export interface EnumerationArea {
	id: number;
	name: string;
	description: string;
	areaCode: string;
	geom?: any; // GeoJSON geometry
	createdAt?: Date;
	updatedAt?: Date;

	subAdministrativeZones?: SubAdministrativeZone[]; // Array via junction table
	surveyEnumerationAreas: SurveyEnumerationArea[];
}

export interface EnumerationAreaGeoJSON {
	type: 'FeatureCollection';
	features: EnumerationAreaFeature[];
}

export interface EnumerationAreaFeature {
	type: 'Feature';
	id: number;
	properties: EnumerationAreaProperties;
	geometry: EnumerationAreaGeometry;
}

export interface EnumerationAreaProperties {
	id: number;
	subAdministrativeZoneIds?: number[]; // Array of SAZ IDs
	name: string;
	description: string;
	areaCode: string;
	[key: string]: any; // Allow additional properties
}

export interface EnumerationAreaGeometry {
	type:
		| 'MultiPolygon'
		| 'Polygon'
		| 'Point'
		| 'LineString'
		| 'MultiPoint'
		| 'MultiLineString';
	coordinates: any;
}

export interface CreateEnumerationAreaDto {
	subAdministrativeZoneIds: number[]; // Array, min 1
	name: string;
	description: string;
	areaCode: string;
	geom?: string; // Optional geometry string
}

export interface UpdateEnumerationAreaDto {
	subAdministrativeZoneIds?: number[]; // Array, min 1 if provided
	name?: string;
	description?: string;
	areaCode?: string;
}

export interface ApiResponse<T> {
	statusCode: number;
	message: string;
	data: T;
}

export interface BulkUploadResponse {
	success: number;
	skipped: number;
	created: EnumerationArea[];
	skippedItems: Array<{
		areaCode: string;
		subAdministrativeZoneIds?: number[];
		reason: string;
	}>;
	errors: Array<{
		feature: any;
		error: string;
	}>;
}
