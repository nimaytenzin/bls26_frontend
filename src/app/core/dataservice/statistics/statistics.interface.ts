export interface AdministrativeZoneCounts {
	total: number;
	gewogs: number;
	thromdes: number;
}

export interface SubAdministrativeZoneCounts {
	total: number;
	chiwogs: number;
	laps: number;
}

export interface TotalCountsResponse {
	totalDzongkhags: number;
	administrativeZones: AdministrativeZoneCounts;
	subAdministrativeZones: SubAdministrativeZoneCounts;
	totalEnumerationAreas: number;
}

export interface DzongkhagCountsResponse {
	dzongkhagId: number;
	dzongkhagName: string;
	totalAdministrativeZones: number;
	gewogs: number;
	thromdes: number;
	totalSubAdministrativeZones: number;
	chiwogs: number;
	laps: number;
	totalEnumerationAreas: number;
}
