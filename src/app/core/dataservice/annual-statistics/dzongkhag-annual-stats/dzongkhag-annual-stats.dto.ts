export interface DzongkhagStatsProperties {
	id: number;
	name: string;
	areaCode: string;
	areaSqKm: number;
	year: number;
	azCount: number;
	urbanAZCount: number;
	ruralAZCount: number;
	sazCount: number;
	urbanSAZCount: number;
	ruralSAZCount: number;
	eaCount: number;
	urbanEACount: number;
	ruralEACount: number;
	totalHouseholds: number;
	urbanHouseholdCount: number;
	ruralHouseholdCount: number;
	urbanHouseholdPercentage: number;
	ruralHouseholdPercentage: number;
	totalPopulation: number;
	totalMale: number;
	totalFemale: number;
	urbanPopulation: number;
	urbanMale: number;
	urbanFemale: number;
	ruralPopulation: number;
	ruralMale: number;
	ruralFemale: number;
	urbanizationRate: number;
	populationDensity: number;
	averageHouseholdSize: number;
	genderRatio: number;
	urbanGenderRatio: number;
	ruralGenderRatio: number;
	hasData: boolean;
	lastUpdated: string;
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

export interface NationalSummary {
	totalPopulation: number;
	totalHouseholds: number;
	urbanPopulation: number;
	ruralPopulation: number;
	nationalUrbanizationRate: number;
	averageUrbanizationRate: number;
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
