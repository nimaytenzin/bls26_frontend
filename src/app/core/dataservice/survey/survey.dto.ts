import { SurveyStatus } from '../../constants/enums';
import { User } from '../auth/auth.interface';
import { EnumerationArea } from '../location/enumeration-area/enumeration-area.dto';
import { SurveyEnumerationArea } from '../survey-enumeration-area/survey-enumeration-area.dto';

// Import and re-export pagination interfaces from utility
export type {
	PaginationQueryDto,
	PaginationMeta,
	PaginatedResponse,
} from '../../utility/pagination.utility.service';

/**
 * Survey Entity Interface
 * Main entity representing a survey with all its properties
 * Note: isSubmitted and isVerified are properties of SurveyEnumerationArea, not Survey
 */
export interface Survey {
	id: number;
	name: string;
	description: string;
	startDate: string | Date;
	endDate: string | Date;
	year: number;
	status: SurveyStatus;
	isFullyValidated?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
	enumerationAreas?: EnumerationArea[];
	surveyEnumerationAreas?: SurveyEnumerationArea[];
}

/**
 * Create Survey DTO
 * Data Transfer Object for creating a new survey
 */
export interface CreateSurveyDto {
	name: string;
	description: string;
	startDate: string; // ISO date string (YYYY-MM-DD)
	endDate: string; // ISO date string (YYYY-MM-DD)
	year: number; // Survey year
	status?: SurveyStatus;
	enumerationAreaIds?: number[]; // Array of EA IDs to associate
}

/**
 * Update Survey DTO
 * Data Transfer Object for updating an existing survey
 * All fields are optional for partial updates
 */
export interface UpdateSurveyDto {
	name?: string;
	description?: string;
	startDate?: string; // ISO date string (YYYY-MM-DD)
	endDate?: string; // ISO date string (YYYY-MM-DD)
	status?: SurveyStatus;
	enumerationAreaIds?: number[]; // Update associated EAs
}

/**
 * API Response Wrapper
 * Generic wrapper for API responses
 */
export interface ApiResponse<T> {
	data?: T;
	message?: string;
	error?: string;
}

/**
 * Add/Remove Enumeration Areas DTO
 * Used for managing enumeration area associations
 */
export interface ManageEnumerationAreasDto {
	enumerationAreaIds: number[];
}

export interface SurveyStatisticsResponseDto {
	surveyId: number;
	surveyName: string;
	surveyStatus: SurveyStatus;
	surveyYear: number;

	isFullyValidated: boolean;
	isFullyPublished?: boolean;
	totalDzongkhags: number;
	totalEnumerationAreas: number;
	submittedEnumerationAreas: number;
	validatedEnumerationAreas: number;
	enumeratedEnumerationAreas?: number;
	sampledEnumerationAreas?: number;
	publishedEnumerationAreas?: number;
	pendingEnumerationAreas: number;
	submissionPercentage: string;
	validationPercentage: string;
	enumerationPercentage?: string;
	samplingPercentage?: string;
	publishingPercentage?: string;
	totalEnumerators: number;
	totalHouseholds: number;

	totalMale: number;
	totalFemale: number;
	totalPopulation: number;
	averageHouseholdSize: string;
}

/**
 * Auto Household Upload Item DTO
 * Represents a single item in the auto household upload request
 */
export interface AutoHouseholdUploadItemDto {
	enumerationAreaId: number;
	surveyId: number;
	householdCount: number;
}

/**
 * Auto Household Upload Request DTO
 * Request body for bulk uploading household counts
 */
export interface AutoHouseholdUploadRequestDto {
	items: AutoHouseholdUploadItemDto[];
}

/**
 * Auto Household Upload Error DTO
 * Represents an error for a specific item in the upload
 */
export interface AutoHouseholdUploadErrorDto {
	enumerationAreaId: number;
	surveyId: number;
	householdCount: number;
	reason: string;
}

/**
 * Auto Household Upload Response DTO
 * Response from the auto household upload endpoint
 */
export interface AutoHouseholdUploadResponseDto {
	totalItems: number;
	created: number;
	skipped: number;
	householdListingsCreated: number;
	errors: AutoHouseholdUploadErrorDto[];
}
