import { EnumerationArea } from '../../location/enumeration-area/enumeration-area.dto';

/**
 * Historical Household Listing entity interface
 */
export interface HistoricalHouseholdListing {
	id: number;
	year: number;
	householdCount: number;
	enumerationAreaId: number;
	createdAt?: Date;
	updatedAt?: Date;
	enumerationArea?: EnumerationArea;
}

/**
 * DTO for creating a new historical household listing
 */
export interface CreateHistoricalHouseholdListingDto {
	year: number;
	householdCount: number;
	enumerationAreaId: number;
}

/**
 * DTO for updating an existing historical household listing
 */
export interface UpdateHistoricalHouseholdListingDto {
	year?: number;
	householdCount?: number;
	enumerationAreaId?: number;
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
	trend: 'increasing' | 'decreasing' | 'stable';
}
