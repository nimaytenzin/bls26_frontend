import { Dzongkhag, User } from '../auth/auth.interface';
import { Survey } from '../survey/survey.dto';


export interface SurveyEnumerator {
	userId: number;
	surveyId: number;
	dzongkhagId: number | null;
	isActive?: boolean;
	user:User;
	survey:Survey;
	dzongkhag?:Dzongkhag
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

/**
 * Create Single Enumerator DTO
 * Data Transfer Object for creating a single enumerator with dzongkhag assignments
 */
export interface CreateSingleEnumeratorDto {
	name: string;
	cid: string;
	emailAddress?: string;
	phoneNumber?: string;
	password?: string;
	surveyId: number;
	dzongkhagIds: number[];
}

/**
 * Create Single Enumerator Response
 * Response from creating a single enumerator
 */
export interface CreateSingleEnumeratorResponse {
	user: User;
	created: boolean;
	assignments: SurveyEnumerator[];
}

/**
 * Update Enumerator DTO
 * Data Transfer Object for updating enumerator details and/or assignments
 */
export interface UpdateEnumeratorDto {
	name?: string;
	cid?: string;
	emailAddress?: string;
	phoneNumber?: string;
	surveyId?: number;
	dzongkhagIds?: number[]; // Array of dzongkhag IDs to replace assignments
}

/**
 * Reset Password DTO
 * Data Transfer Object for resetting enumerator password
 */
export interface ResetPasswordDto {
	newPassword: string;
	confirmPassword: string;
}

/**
 * Restore All Assignments Response
 * Response from restoring all assignments
 */
export interface RestoreAllAssignmentsResponse {
	message: string;
	restoredCount: number;
}
