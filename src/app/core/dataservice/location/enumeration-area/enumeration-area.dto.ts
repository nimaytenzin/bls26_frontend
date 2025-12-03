import { SurveyEnumerationArea } from '../../survey-enumeration-area/survey-enumeration-area.dto';
import { SubAdministrativeZone } from '../sub-administrative-zone/sub-administrative-zone.dto';

export interface EnumerationArea {
	id: number;
	subAdministrativeZoneId: number;
	name: string;
	description: string;
	areaCode: string;
	areaSqKm?: number;
	geom?: any; // GeoJSON geometry
	createdAt?: Date;
	updatedAt?: Date;

	subAdministrativeZone?: SubAdministrativeZone;
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
	subAdministrativeZoneId: number;
	name: string;
	description: string;
	areaCode: string;
	areaSqKm?: number;
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
	subAdministrativeZoneId: number;
	name: string;
	description: string;
	areaCode: string;
	areaSqKm?: number;
}

export interface UpdateEnumerationAreaDto {
	subAdministrativeZoneId?: number;
	name?: string;
	description?: string;
	areaCode?: string;
	areaSqKm?: number;
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
		subAdministrativeZoneId: number;
		reason: string;
	}>;
	errors: Array<{
		feature: any;
		error: string;
	}>;
}
