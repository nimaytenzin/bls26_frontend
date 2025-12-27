import { User } from '../auth/auth.interface';

/**
 * Survey Enumerator Assignment Interface
 * Represents the many-to-many relationship between surveys and enumerators
 */
export interface SurveyEnumerator {
	userId: number;
	surveyId: number;
	assignedAt?: Date;
	user?: User;
}

/**
 * Assign Single Enumerator DTO
 * Data Transfer Object for assigning a single enumerator to a survey
 */
export interface AssignEnumeratorDto {
	userId: number;
	surveyId: number;
}

/**
 * Bulk Assign Enumerators DTO
 * Data Transfer Object for assigning multiple enumerators to a survey
 */
export interface BulkAssignEnumeratorsDto {
	surveyId: number;
	userIds: number[];
}

/**
 * Bulk Remove Enumerators DTO
 * Data Transfer Object for removing multiple enumerators from a survey
 */
export interface BulkRemoveEnumeratorsDto {
	userIds: number[];
}

/**
 * Bulk Assignment Response
 * Response from bulk assignment operations
 */
export interface BulkAssignmentResponse {
	message: string;
	assigned: SurveyEnumerator[];
	failed?: Array<{
		userId: number;
		reason: string;
	}>;
}

/**
 * Bulk Removal Response
 * Response from bulk removal operations
 */
export interface BulkRemovalResponse {
	message: string;
	removedCount: number;
}

/**
 * Enumerator Data from CSV
 * Represents enumerator information parsed from CSV file
 */
export interface EnumeratorCSVData {
	name: string;
	cid: string;
	emailAddress?: string;
	phoneNumber?: string;
	password?: string;
	dzongkhagCode: string; // Required - Two-character dzongkhag code (e.g., "01", "02")
}

/**
 * Bulk Assign Enumerators via CSV DTO
 * Data Transfer Object for bulk assigning enumerators using CSV data
 */
export interface BulkAssignCSVDto {
	surveyId: number;
	enumerators: EnumeratorCSVData[];
}

/**
 * Bulk CSV Assignment Response
 * Response from CSV bulk assignment operations
 */
export interface BulkCSVAssignmentResponse {
	success: number;
	failed: number;
	created: number;
	existing: number;
	assignments: SurveyEnumerator[];
	errors: Array<{
		enumerator: EnumeratorCSVData;
		error: string;
	}>;
}
