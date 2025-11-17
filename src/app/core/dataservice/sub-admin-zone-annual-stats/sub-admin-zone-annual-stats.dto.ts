/**
 * DTO for querying Sub-Administrative Zone statistics with GeoJSON
 * Used to combine geographic boundaries with annual statistics
 */
export class SAZStatsGeoJsonQueryDto {
	year?: number; // If not provided, uses current year
}

/**
 * Interface for GeoJSON Feature properties containing Sub-Administrative Zone statistics
 * This structure will be embedded in the GeoJSON Feature properties
 */
export interface SAZStatsProperties {
	// Basic SAZ information
	id: number;
	name: string;
	areaCode: string;
	type: 'chiwog' | 'lap'; // chiwog = Rural (under Gewog), lap = Urban (under Thromde)
	areaSqKm: number;

	// Parent Administrative Zone information
	administrativeZoneId: number;
	administrativeZoneName: string;
	administrativeZoneType: 'Gewog' | 'Thromde';

	// Parent Dzongkhag information
	dzongkhagId: number;
	dzongkhagName: string;

	// Statistics year
	year: number;

	// Structural counts
	eaCount: number; // Total Enumeration Areas

	// Household statistics
	totalHouseholds: number;

	// Population statistics
	totalPopulation: number;
	totalMale: number;
	totalFemale: number;

	// Calculated metrics
	populationDensity: number; // Population per sq km
	averageHouseholdSize: number; // Total population / total households
	genderRatio: number; // Males per 100 females
	malePercentage: number;
	femalePercentage: number;

	// Additional metadata
	hasData: boolean; // Whether statistics exist for this year
	lastUpdated: string; // ISO timestamp
}

/**
 * GeoJSON Feature with Sub-Administrative Zone statistics
 */
export interface SAZStatsFeature {
	type: 'Feature';
	id: number;
	geometry: {
		type: 'MultiPolygon';
		coordinates: number[][][][];
	};
	properties: SAZStatsProperties;
}

/**
 * Summary statistics aggregated at Administrative Zone level
 * Summarizes all Sub-Administrative Zones within an Administrative Zone
 */
export interface AdministrativeZoneSAZSummary {
	administrativeZoneId: number;
	administrativeZoneName: string;
	administrativeZoneType: 'Gewog' | 'Thromde';
	dzongkhagId: number;
	dzongkhagName: string;
	year: number;
	totalSAZs: number; // Total Chiwogs (if Gewog) or Laps (if Thromde)
	totalEAs: number;
	totalPopulation: number;
	totalHouseholds: number;
	totalMale: number;
	totalFemale: number;
}

/**
 * Summary statistics aggregated at Dzongkhag level
 * Summarizes all Sub-Administrative Zones across all Administrative Zones within the Dzongkhag
 */
export interface DzongkhagSAZSummary {
	dzongkhagId: number;
	dzongkhagName: string;
	year: number;
	totalAZs: number; // Total Administrative Zones
	thromdeCount: number; // Urban AZs
	gewogCount: number; // Rural AZs
	totalSAZs: number; // Total SAZs (Chiwogs + Laps)
	urbanSAZCount: number; // Total Laps (under Thromdes)
	ruralSAZCount: number; // Total Chiwogs (under Gewogs)
	totalEAs: number;
	totalPopulation: number;
	urbanPopulation: number; // Population in Laps
	ruralPopulation: number; // Population in Chiwogs
	totalHouseholds: number;
	urbanHouseholds: number;
	ruralHouseholds: number;
	urbanizationRate: number; // Percentage of population in Laps
}

/**
 * GeoJSON FeatureCollection for Sub-Administrative Zones grouped by Administrative Zone
 * Contains all SAZs (Chiwogs or Laps) within a specific Administrative Zone
 * with their geometries and annual statistics
 */
export interface SAZByAdministrativeZoneGeoJsonResponse {
	type: 'FeatureCollection';
	metadata: {
		year: number;
		administrativeZoneId: number;
		administrativeZoneName: string;
		administrativeZoneType: 'Gewog' | 'Thromde';
		dzongkhagId: number;
		dzongkhagName: string;
		generatedAt: string;
		summary: AdministrativeZoneSAZSummary;
	};
	features: SAZStatsFeature[];
}

/**
 * GeoJSON FeatureCollection for Sub-Administrative Zones grouped by Dzongkhag
 * Contains all SAZs (Chiwogs and Laps) across all Administrative Zones within a specific Dzongkhag
 * with their geometries and annual statistics
 */
export interface SAZByDzongkhagGeoJsonResponse {
	type: 'FeatureCollection';
	metadata: {
		year: number;
		dzongkhagId: number;
		dzongkhagName: string;
		generatedAt: string;
		summary: DzongkhagSAZSummary;
	};
	features: SAZStatsFeature[];
}
