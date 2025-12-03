import { SurveyStatus } from '../../constants/enums';
import { User } from '../auth/auth.interface';
import { EnumerationArea } from '../location/enumeration-area/enumeration-area.dto';

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
 * Survey Enumeration Area Junction Interface
 * Represents the many-to-many relationship between surveys and enumeration areas
 * Contains submission and validation tracking at the EA level
 */
export interface SurveyEnumerationArea {
	id?: number;
	surveyId: number;
	enumerationAreaId: number;
	isSubmitted?: boolean;
	isValidated?: boolean;
	submittedBy?: number;
	submissionDate?: Date | string;
	validatedBy?: number;
	validationDate?: Date | string;
	comments?: string;
	createdAt?: Date;
	updatedAt?: Date;
	enumerationArea?: EnumerationArea;

	submitter?: User;
	validator?: User;
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
