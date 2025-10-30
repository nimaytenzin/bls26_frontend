import { EnumerationArea } from '../location/enumeration-area/enumeration-area.dto';

/**
 * Survey Status Enum
 * Represents the current status of a survey
 */
export enum SurveyStatus {
	ACTIVE = 'ACTIVE',
	ENDED = 'ENDED',
}

/**
 * Survey Entity Interface
 * Main entity representing a survey with all its properties
 */
export interface Survey {
	id: number;
	name: string;
	description: string;
	startDate: string | Date;
	endDate: string | Date;
	year: number;
	status: SurveyStatus;
	isSubmitted: boolean;
	isVerified: boolean;
	createdAt?: Date;
	updatedAt?: Date;
	enumerationAreas?: EnumerationArea[];
}

/**
 * Survey Enumeration Area Junction Interface
 * Represents the many-to-many relationship between surveys and enumeration areas
 */
export interface SurveyEnumerationArea {
	surveyId: number;
	enumerationAreaId: number;
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
	year: number; // survey year, could be drawn from the dates but just for make it faster
	status?: SurveyStatus;
	isSubmitted?: boolean;
	isVerified?: boolean;
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
	isSubmitted?: boolean;
	isVerified?: boolean;
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
