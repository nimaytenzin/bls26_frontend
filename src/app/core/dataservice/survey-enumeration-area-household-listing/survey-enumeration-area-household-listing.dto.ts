import { User } from '../auth/auth.interface';
import { EnumerationArea } from '../location/enumeration-area/enumeration-area.dto';
import { SurveyEnumerationArea } from '../survey-enumeration-area/survey-enumeration-area.dto';
import { SurveyEnumerationAreaStructure } from '../survey-enumeration-area-structure/survey-enumeration-area-structure.dto';

/**
 * Survey Enumeration Area Household Listing Entity Interface
 */
export interface SurveyEnumerationAreaHouseholdListing {
	id: number;
	surveyEnumerationAreaId: number;
	structureId: number;
	householdIdentification: string;
	householdSerialNumber: number;
	nameOfHOH?: string;
	totalMale: number;
	totalFemale: number;
	phoneNumber?: string;
	remarks?: string;
	createdAt?: Date;
	updatedAt?: Date;
	surveyEnumerationArea?: SurveyEnumerationArea;
	structure?: SurveyEnumerationAreaStructure;
	submittedBy: number;
	submitter?: User;
}

/**
 * Create Survey Enumeration Area Household Listing DTO
 */
export interface CreateSurveyEnumerationAreaHouseholdListingDto {
	surveyEnumerationAreaId: number;
	structureId: number;
	householdIdentification: string;
	householdSerialNumber: number;
	nameOfHOH?: string;
	totalMale: number;
	totalFemale: number;
	phoneNumber?: string;
	remarks?: string;
}

/**
 * Bulk Upload Response Interface
 */
export interface BulkUploadResponse {
	success: number;
	failed: number;
	created: SurveyEnumerationAreaHouseholdListing[];
	errors: {
		listing: CreateSurveyEnumerationAreaHouseholdListingDto;
		error: string;
	}[];
}

/**
 * Household Statistics Interface
 * @deprecated Use HouseholdListingStatisticsResponseDto instead
 */
export interface HouseholdStatistics {
	totalHouseholds: number;
	totalMale: number;
	totalFemale: number;
	totalPopulation: number;
	householdsWithPhone: number;
	averageHouseholdSize: string;
}

/**
 * Response DTO for household listing statistics
 * Used for both enumeration area-level and survey-level statistics
 */
export interface HouseholdListingStatisticsResponseDto {
	/**
	 * Total number of households
	 */
	totalHouseholds: number;

	/**
	 * Total male population
	 */
	totalMale: number;

	/**
	 * Total female population
	 */
	totalFemale: number;

	/**
	 * Total population (male + female)
	 */
	totalPopulation: number;

	/**
	 * Number of households with phone numbers
	 */
	householdsWithPhone: number;

	/**
	 * Average household size (as string with 2 decimal places)
	 */
	averageHouseholdSize: string;

	/**
	 * Total number of enumeration areas (only present for survey-level statistics)
	 */
	totalEnumerationAreas?: number;
}

/**
 * Current Household Listing DTOs
 */

/**
 * Status enum for current household listing response
 */
export enum CurrentHouseholdListingStatus {
	SUCCESS = 'SUCCESS',
	NO_DATA = 'NO_DATA',
	VALIDATED_BUT_EMPTY = 'VALIDATED_BUT_EMPTY',
}

/**
 * Survey information
 */
export interface SurveyInfoDto {
	id: number;
	name: string;
	year: number;
	description?: string;
	startDate?: string | Date;
	endDate?: string | Date;
}

/**
 * Household statistics summary for current data
 */
export interface HouseholdStatisticsDto {
	totalHouseholds: number;
	totalMale: number;
	totalFemale: number;
	totalPopulation: number;
	averageHouseholdSize: number;
}

/**
 * Data payload when status is SUCCESS
 */
export interface CurrentHouseholdListingDataDto {
	survey: SurveyInfoDto;
	enumerationArea: EnumerationArea;
	surveyEnumerationArea: SurveyEnumerationArea;
	householdListings: SurveyEnumerationAreaHouseholdListing[];
	statistics: HouseholdStatisticsDto;
}

/**
 * Information about the latest survey checked
 */
export interface LatestSurveyMetadataDto {
	surveyId: number;
	surveyName: string;
	surveyYear: number;
	isSubmitted: boolean;
	isValidated: boolean;
	reason: string;
}

/**
 * Metadata about the search operation
 */
export interface CurrentHouseholdListingMetadataDto {
	totalSurveysChecked: number;
	latestSurvey?: LatestSurveyMetadataDto;
	searchedAt: Date;
}

/**
 * Main response DTO for current household listings
 */
export interface CurrentHouseholdListingResponseDto {
	status: CurrentHouseholdListingStatus;
	message: string;
	data?: CurrentHouseholdListingDataDto;
	metadata?: CurrentHouseholdListingMetadataDto;
}

/**
 * Create Blank Household Listings Request DTO
 * Used to create multiple blank household listing entries
 */
export interface CreateBlankHouseholdListingsDto {
	/**
	 * Number of blank entries to create (1-10000)
	 */
	count: number;
	/**
	 * Optional remarks for the blank entries
	 * Defaults to "No data available - Historical survey entry" if not provided
	 */
	remarks?: string;
}

/**
 * Create Blank Household Listings Response DTO
 */
export interface CreateBlankHouseholdListingsResponseDto {
	success: boolean;
	message: string;
	created: number;
	listings: SurveyEnumerationAreaHouseholdListing[];
}
