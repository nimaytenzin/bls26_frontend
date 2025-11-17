import { Survey } from '../survey/survey.dto';
import { EnumerationArea } from '../location/enumeration-area/enumeration-area.dto';
import { User } from '../auth/auth.interface';

/**
 * Survey Enumeration Area Entity Interface
 * Represents the many-to-many relationship between surveys and enumeration areas
 */
export interface SurveyEnumerationArea {
	id: number;
	surveyId: number;
	enumerationAreaId: number;
	isSubmitted: boolean;
	isValidated: boolean;
	submittedBy?: number;
	submissionDate?: string | Date;
	validatedBy?: number;
	validationDate?: string | Date;
	comments?: string;
	createdAt?: Date;
	updatedAt?: Date;
	survey?: Survey;
	enumerationArea?: EnumerationArea;
	submitter?: User;
	validator?: User;
}

/**
 * Submit Survey Enumeration Area DTO
 * Used when supervisor submits an EA for validation
 */
export interface SubmitSurveyEnumerationAreaDto {
	submittedBy: number;
}

/**
 * Validate Survey Enumeration Area DTO
 * Used when admin validates a submitted EA
 */
export interface ValidateSurveyEnumerationAreaDto {
	validatedBy: number;
	isApproved: boolean;
	comments?: string;
}

/**
 * Survey Enumeration Area Statistics Interface
 * Provides progress statistics for a survey
 */
export interface SurveyEnumerationAreaStatistics {
	total: number;
	submitted: number;
	validated: number;
	pending: number;
	awaitingValidation: number;
	submissionRate: string;
	validationRate: string;
}
