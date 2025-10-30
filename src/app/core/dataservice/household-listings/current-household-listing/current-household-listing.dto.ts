import { EnumerationArea } from '../../location/enumeration-area/enumeration-area.dto';

/**
 * Current Household Listing entity interface
 */
export interface CurrentHouseholdListing {
	id: number;
	eaId: number;
	structureNumber: string;
	householdIdentification: string;
	householdSerialNumber: number;
	nameOfHOH: string;
	totalMale: number;
	totalFemale: number;
	phoneNumber?: string;
	remarks?: string;
	createdAt?: Date;
	updatedAt?: Date;
	enumerationArea?: EnumerationArea;
}

/**
 * DTO for creating a new household listing
 */
export interface CreateCurrentHouseholdListingDto {
	eaId: number;
	structureNumber: string;
	householdIdentification: string;
	householdSerialNumber: number;
	nameOfHOH: string;
	totalMale: number;
	totalFemale: number;
	phoneNumber?: string;
	remarks?: string;
}

/**
 * DTO for updating an existing household listing
 */
export interface UpdateCurrentHouseholdListingDto {
	eaId?: number;
	structureNumber?: string;
	householdIdentification?: string;
	householdSerialNumber?: number;
	nameOfHOH?: string;
	totalMale?: number;
	totalFemale?: number;
	phoneNumber?: string;
	remarks?: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
	statusCode: number;
	message: string;
	data: T;
}
