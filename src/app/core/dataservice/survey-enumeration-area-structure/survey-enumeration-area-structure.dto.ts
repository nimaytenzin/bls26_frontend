import { User } from '../auth/auth.interface';
import { SurveyEnumerationAreaHouseholdListing } from '../survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import { SurveyEnumerationArea } from '../survey-enumeration-area/survey-enumeration-area.dto';

/**
 * Survey Enumeration Area Structure Entity Interface
 */
export interface SurveyEnumerationAreaStructure {
	id: number;
	surveyEnumerationAreaId: number;
	structureNumber: string;
	latitude?: number;
	longitude?: number;
	submittedBy?: number;
	createdAt?: Date;
	updatedAt?: Date;
	surveyEnumerationArea?: SurveyEnumerationArea;
	submitter?: User;
	householdListings:SurveyEnumerationAreaHouseholdListing[]
}

/**
 * Create Survey Enumeration Area Structure DTO
 */
export interface CreateSurveyEnumerationAreaStructureDto {
	surveyEnumerationAreaId: number;
	structureNumber: string;
	latitude?: number;
	longitude?: number;
	submittedBy?: number;
}

/**
 * Update Survey Enumeration Area Structure DTO
 */
export interface UpdateSurveyEnumerationAreaStructureDto {
	structureNumber?: string;
	latitude?: number;
	longitude?: number;
}

/**
 * Survey Enumeration Area Structure Response DTO
 */
export interface SurveyEnumerationAreaStructureResponseDto {
	id: number;
	surveyEnumerationAreaId: number;
	structureNumber: string;
	latitude?: number;
	longitude?: number;
	submittedBy?: number;
	createdAt?: Date;
	updatedAt?: Date;
}

