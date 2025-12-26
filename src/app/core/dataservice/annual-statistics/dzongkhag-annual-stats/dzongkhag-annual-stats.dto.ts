// Simplified properties for public API (geojson&Stats endpoint)
export interface DzongkhagStatsProperties {
	// Basic Dzongkhag information
	id: number;
	name: string;
	areaCode: string;
	
	// Statistics year
	year: number;
	
	// Enumeration Area counts
	totalEA: number;
	urbanEA: number;
	ruralEA: number;
	
	// Household counts
	totalHousehold: number;
	urbanHousehold: number;
	ruralHousehold: number;
	
	// Population statistics
	totalPopulation: number;
	urbanPopulation: number;
	ruralPopulation: number;
	
	// Metadata
	hasData: boolean;
	lastUpdated: string;
}

// Detailed properties for admin API (includes additional calculated fields)
export interface DzongkhagStatsDetailedProperties extends DzongkhagStatsProperties {
	// Additional area information
	areaSqKm?: number;
	
	// Administrative zone counts
	azCount?: number;
	urbanAZCount?: number;
	ruralAZCount?: number;
	
	// Sub-administrative zone counts
	sazCount?: number;
	urbanSAZCount?: number;
	ruralSAZCount?: number;
	
	// Legacy EA property names (for backward compatibility)
	eaCount?: number;
	urbanEACount?: number;
	ruralEACount?: number;
	
	// Legacy household property names (for backward compatibility)
	totalHouseholds?: number;
	urbanHouseholdCount?: number;
	ruralHouseholdCount?: number;
	urbanHouseholdPercentage?: number;
	ruralHouseholdPercentage?: number;
	
	// Gender breakdowns
	totalMale?: number;
	totalFemale?: number;
	urbanMale?: number;
	urbanFemale?: number;
	ruralMale?: number;
	ruralFemale?: number;
	
	// Calculated fields
	urbanizationRate?: number;
	populationDensity?: number;
	averageHouseholdSize?: number;
	genderRatio?: number;
	urbanGenderRatio?: number;
	ruralGenderRatio?: number;
}

export interface DzongkhagStatsFeature {
	type: 'Feature';
	id: number;
	geometry: {
		type: 'MultiPolygon';
		coordinates: number[][][][];
	};
	properties: DzongkhagStatsProperties;
}

// Detailed feature for admin components
export interface DzongkhagStatsDetailedFeature {
	type: 'Feature';
	id: number;
	geometry: {
		type: 'MultiPolygon';
		coordinates: number[][][][];
	};
	properties: DzongkhagStatsDetailedProperties;
}

export interface NationalSummary {
	totalEA: number;
	urbanEA: number;
	ruralEA: number;
	totalHousehold: number;
	urbanHousehold: number;
	ruralHousehold: number;
	totalPopulation: number;
	urbanPopulation: number;
	ruralPopulation: number;
	// Legacy property names for backward compatibility
	totalHouseholds?: number;
}

export interface DzongkhagStatsGeoJson {
	type: 'FeatureCollection';
	metadata: {
		year: number;
		totalDzongkhags: number;
		generatedAt: string;
		nationalSummary: NationalSummary;
	};
	features: DzongkhagStatsFeature[];
}
