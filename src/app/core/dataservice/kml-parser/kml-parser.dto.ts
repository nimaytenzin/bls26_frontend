/**
 * KML Parser Data Transfer Objects
 */

export interface KmlToGeojsonResponse {
	outputname: string;
	geojson: any; // GeoJSON FeatureCollection
	features_count: number;
}

export interface DissolveGeojsonRequest {
	geojsonFile: File;
	outputName: string;
	administrativeZoneId: number;
	name: string;
	type: 'chiwog' | 'lap';
	areaCode?: string;
	areaSqKm?: number;
}

export interface DissolveGeojsonResponse {
	outputname: string;
	geojson: any; // GeoJSON FeatureCollection
	original_features_count: number;
	dissolved_features_count: number;
}

export interface AutoKmlUploadRequest {
	kmlFile: File;
	administrativeZoneId: number;
	sazName: string;
	sazAreaCode: string;
	sazType: 'chiwog' | 'lap';
	apiBaseUrl: string;
	token: string;
}

export interface AutoKmlUploadResponse {
	success: boolean;
	message: string;
	saz_id: number;
	saz_name: string;
	saz_area_code: string;
	area_sq_km: number;
	boundary_features_count: number;
	eas_features_count: number;
	eas_upload: {
		success: number;
		skipped: number;
		errors: Array<{
			feature: any;
			error: string;
		}>;
	};
}

