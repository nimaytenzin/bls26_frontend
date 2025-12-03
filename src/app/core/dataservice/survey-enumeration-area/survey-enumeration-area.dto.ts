import { Survey } from '../survey/survey.dto';
import { EnumerationArea } from '../location/enumeration-area/enumeration-area.dto';
import { User } from '../auth/auth.interface';
import { SurveyEnumerationAreaStructure } from '../survey-enumeration-area-structure/survey-enumeration-area-structure.dto';
import { SurveyEnumerationAreaHouseholdListing } from '../survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';

/**
 * Survey Enumeration Area Entity Interface
 * Represents the many-to-many relationship between surveys and enumeration areas
 * with workflow tracking (enumeration, sampling, and publishing)
 * 
 * Workflow:
 * 1. Enumerator completes enumeration (isEnumerated = true, enumeratedBy = enumerator)
 * 2. Supervisor performs sampling (isSampled = true, sampledBy = supervisor)
 * 3. Admin publishes data (isPublished = true, publishedBy = admin)
 */
export interface SurveyEnumerationArea {
	id: number;
	surveyId: number;
	enumerationAreaId: number;
	// Enumeration Workflow Fields
	isEnumerated: boolean;
	enumeratedBy?: number;
	enumerationDate?: string | Date;
	// Sampling Workflow Fields
	isSampled: boolean;
	sampledBy?: number;
	sampledDate?: string | Date;
	// Publishing Workflow Fields
	isPublished: boolean;
	publishedBy?: number;
	publishedDate?: string | Date;
	// Optional: Rejection/Comments
	comments?: string;
	createdAt?: Date;
	updatedAt?: Date;
	// Relationships
	survey?: Survey;
	enumerationArea?: EnumerationArea;
	enumerator?: User;
	sampler?: User;
	publisher?: User;
	structures?: SurveyEnumerationAreaStructure[];
	householdListings?: SurveyEnumerationAreaHouseholdListing[];
}

/**
 * Complete Enumeration DTO
 * Used when enumerator completes enumeration for an EA
 */
export interface CompleteEnumerationDto {
	enumeratedBy: number;
	comments?: string;
}

/**
 * Publish Survey Enumeration Area DTO
 * Used when admin publishes sampled data for an EA
 */
export interface PublishSurveyEnumerationAreaDto {
	publishedBy: number;
	comments?: string;
}

/**
 * Bulk Publish DTO
 * Used when admin publishes multiple enumeration areas at once
 */
export interface BulkPublishDto {
	surveyId: number;
	enumerationAreaIds?: number[];
	publishedBy: number;
}

/**
 * Survey Enumeration Area Statistics Interface
 * Provides progress statistics for a survey
 * @deprecated May need update based on new workflow - kept for backward compatibility
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

/**
 * Bulk Upload Error Interface
 * Represents an error that occurred during bulk upload
 */
export interface BulkUploadError {
	row: number;
	codes: string;
	error: string;
}

/**
 * Bulk Upload Response Interface
 * Response from bulk upload operation
 */
export interface BulkUploadResponse {
	success: boolean;
	totalRows: number;
	successful: number;
	failed: number;
	errors: BulkUploadError[];
	created: number;
	skipped: number;
}
