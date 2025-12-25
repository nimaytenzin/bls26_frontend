import { EnumerationArea } from '../../location/enumeration-area/enumeration-area.dto';

/**
 * EA Annual Stats entity interface
 */
export interface EAAnnualStats {
	id: number;
	enumerationAreaId: number;
	year: number;
	totalHouseholds: number;
	totalMale: number;
	totalFemale: number;
	createdAt?: Date;
	updatedAt?: Date;
	enumerationArea?: EnumerationArea;
}

/**
 * DTO for creating new EA annual statistics
 */
export interface CreateEAAnnualStatsDto {
	enumerationAreaId: number;
	year: number;
	totalHouseholds: number;
	totalMale: number;
	totalFemale: number;
}

/**
 * DTO for updating existing EA annual statistics
 */
export interface UpdateEAAnnualStatsDto {
	year?: number;
	totalHouseholds?: number;
	totalMale?: number;
	totalFemale?: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
	statusCode: number;
	message: string;
	data: T;
}

/**
 * Historical statistics interface for aggregated data
 */
export interface HistoricalStatistics {
	totalYears: number;
	firstYear: number;
	lastYear: number;
	averageHouseholds: number;
	maxHouseholds: number;
	minHouseholds: number;
	averageMale: number;
	averageFemale: number;
	averagePopulation: number;
	trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Interface for GeoJSON Feature properties containing EA statistics
 * This structure will be embedded in the GeoJSON Feature properties
 */
export interface EAStatsProperties {
	// Basic EA information
	id: number;
	name: string;
	areaCode: string;
	description: string;

	// Parent references
	subAdministrativeZoneId: number | null;
	subAdministrativeZoneName: string | null;
	subAdministrativeZoneType: 'chiwog' | 'lap' | null;
	administrativeZoneId: number;
	administrativeZoneName: string;
	administrativeZoneType: 'Gewog' | 'Thromde';
	dzongkhagId: number;
	dzongkhagName: string;

	// Statistics year
	year: number;

	// Household statistics
	totalHouseholds: number;

	// Population statistics
	totalPopulation: number;
	totalMale: number;
	totalFemale: number;

	// Calculated metrics
	averageHouseholdSize: number; // Total population / total households
	genderRatio: number; // Males per 100 females
	malePercentage: number;
	femalePercentage: number;

	// Additional metadata
	hasData: boolean; // Whether statistics exist for this year
	lastUpdated: string; // ISO timestamp
}

/**
 * GeoJSON Feature with EA statistics
 */
export interface EAStatsFeature {
	type: 'Feature';
	id: number;
	geometry: {
		type: 'MultiPolygon';
		coordinates: number[][][][];
	};
	properties: EAStatsProperties;
}

/**
 * Summary statistics aggregated at Sub-Administrative Zone level
 */
export interface SubAdministrativeZoneEASummary {
	subAdministrativeZoneId: number;
	subAdministrativeZoneName: string;
	subAdministrativeZoneType: 'chiwog' | 'lap' | null;
	administrativeZoneId: number;
	administrativeZoneName: string;
	administrativeZoneType: 'Gewog' | 'Thromde';
	dzongkhagId: number;
	dzongkhagName: string;
	year: number;
	totalEAs: number;
	totalPopulation: number;
	totalHouseholds: number;
	totalMale: number;
	totalFemale: number;
}

/**
 * GeoJSON FeatureCollection for EAs grouped by Sub-Administrative Zone
 * Contains all EAs within a specific Sub-Administrative Zone
 * with their geometries and annual statistics
 */
export interface EABySubAdministrativeZoneGeoJsonResponse {
	type: 'FeatureCollection';
	metadata: {
		year: number;
		subAdministrativeZoneId: number;
		subAdministrativeZoneName: string;
		subAdministrativeZoneType: 'chiwog' | 'lap' | null;
		administrativeZoneId: number;
		administrativeZoneName: string;
		administrativeZoneType: 'Gewog' | 'Thromde';
		dzongkhagId: number;
		dzongkhagName: string;
		generatedAt: string;
		summary: SubAdministrativeZoneEASummary;
	};
	features: EAStatsFeature[];
}
