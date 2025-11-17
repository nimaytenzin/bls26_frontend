import { User } from '../auth/auth.interface';
import { EnumerationArea } from '../location/enumeration-area/enumeration-area.dto';
import { SurveyEnumerationArea } from '../survey/survey.dto';

/**
 * Survey Enumeration Area Household Listing Entity Interface
 */
export interface SurveyEnumerationAreaHouseholdListing {
	id: number;
	surveyEnumerationAreaId: number;
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
	surveyEnumerationArea?: any;
	submittedBy: number;
	submitter?: User;
}

/**
 * Create Survey Enumeration Area Household Listing DTO
 */
export interface CreateSurveyEnumerationAreaHouseholdListingDto {
	surveyEnumerationAreaId: number;
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
