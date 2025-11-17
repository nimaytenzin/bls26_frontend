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
