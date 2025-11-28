import { AdministrativeZoneType } from '../location/administrative-zone/administrative-zone.dto';
import { SurveyEnumerationAreaHouseholdListing } from '../survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';

export type SamplingMethod = 'CSS' | 'SRS';
export type SamplingStatus =
	| 'not_run'
	| 'pending'
	| 'running'
	| 'completed'
	| 'full_selection'
	| 'failed';
export type SamplingJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'partial';

export interface SurveySamplingConfigDto {
	id: number;
	surveyId: number;
	defaultMethod: SamplingMethod;
	defaultSampleSize?: number;
	urbanSampleSize?: number;
	ruralSampleSize?: number;
	createdBy?: number;
	updatedBy?: number;
	createdAt: string;
	updatedAt: string;
}

export interface UpdateSurveySamplingConfigDto {
	defaultMethod: SamplingMethod;
	defaultSampleSize?: number;
	urbanSampleSize?: number;
	ruralSampleSize?: number;
}

export interface RunEnumerationAreaSamplingDto {
	method?: SamplingMethod;
	sampleSize?: number;
	randomStart?: number;
	overwriteExisting?: boolean;
	seaIds?: number[]; // optional convenience for bulk
}

export interface SurveyEnumerationAreaSamplingDto {
	id: number;
	surveyId: number;
	surveyEnumerationAreaId: number;
	method: SamplingMethod;
	sampleSize: number;
	populationSize: number;
	samplingInterval?: number;
	randomStart?: number;
	wrapAroundCount?: number;
	isFullSelection: boolean;
	selectedIndices: number[];
	metadata: Record<string, any>;
	executedBy?: number;
	executedAt: string;
	createdAt: string;
	updatedAt: string;
	samples?: SurveyEnumerationAreaHouseholdSampleDto[];
}

export interface SurveyEnumerationAreaHouseholdSampleDto {
	id: number;
	surveyEnumerationAreaSamplingId: number;
	householdListingId: number;
	selectionOrder: number;
	isReplacement: boolean;
	createdAt: string;
	updatedAt: string;
	householdListing?: SurveyEnumerationAreaHouseholdListing;
}

export interface SamplingRunSummary {
	status: SamplingStatus;
	method?: SamplingMethod;
	sampleSize?: number;
	populationSize?: number;
	isFullSelection?: boolean;
	executedAt?: string;
	executedByName?: string;
}

export interface SurveySamplingHierarchyDzongkhagDto {
	id: number;
	name: string;
	code?: string;
	enumerationAreaCount: number;
	administrativeZones: SurveySamplingHierarchyAdminZoneDto[];
}

export interface SurveySamplingHierarchyAdminZoneDto {
	id: number;
	name: string;
	code?: string;
	type?: AdministrativeZoneType | string;
	enumerationAreaCount: number;
	subAdministrativeZones: SurveySamplingHierarchySubZoneDto[];
}

export interface SurveySamplingHierarchySubZoneDto {
	id: number;
	name: string;
	code?: string;
	enumerationAreaCount: number;
}

export interface SurveySamplingEAListItemDto {
	surveyEnumerationAreaId: number;
	enumerationAreaName: string;
	enumerationAreaCode?: string;
	dzongkhagId?: number;
	dzongkhagName?: string;
	administrativeZoneId?: number;
	administrativeZoneName?: string;
	administrativeZoneType?: AdministrativeZoneType | string;
	subAdministrativeZoneId?: number;
	subAdministrativeZoneName?: string;
	householdCount: number;
	populationCount?: number;
	status: SamplingStatus;
	method?: SamplingMethod;
	sampleSize?: number;
	populationSize?: number;
	isFullSelection?: boolean;
	lastRunAt?: string;
	lastRunBy?: string;
	lastRunJobId?: number;
	errorMessage?: string;
	// Submission and validation status
	isSubmitted?: boolean;
	submittedBy?: number | null;
	submissionDate?: string | null;
	isValidated?: boolean;
	validatedBy?: number | null;
	validationDate?: string | null;
}

export interface PaginationRequest {
	page?: number;
	pageSize?: number;
}

export interface PaginationResponse<T> {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
}

export interface SurveyEAListQuery extends PaginationRequest {
	search?: string;
	dzongkhagId?: number;
	administrativeZoneId?: number;
	subAdministrativeZoneId?: number;
	status?: SamplingStatus | 'all';
	method?: SamplingMethod | 'all';
}

export interface BulkRunSamplingDto {
	surveyEnumerationAreaIds: number[];
	method?: SamplingMethod;
	sampleSize?: number;
	randomStart?: number;
	overwriteExisting?: boolean;
}

export interface SamplingJobDto {
	id: number;
	surveyId: number;
	status: SamplingJobStatus;
	totalCount: number;
	completedCount: number;
	failedCount: number;
	queuedCount?: number;
	startedAt?: string;
	finishedAt?: string;
	createdAt: string;
	updatedAt: string;
	createdBy?: {
		id: number;
		name: string;
	};
	message?: string;
	items?: SamplingJobItemDto[];
}

export interface SamplingJobItemDto {
	surveyEnumerationAreaId: number;
	enumerationAreaName?: string;
	status: SamplingStatus;
	message?: string;
	method?: SamplingMethod;
	sampleSize?: number;
	populationSize?: number;
	isFullSelection?: boolean;
}

export interface SamplingJobQuery extends PaginationRequest {
	status?: SamplingJobStatus | 'all';
}

export interface ExportSurveyEAsParams {
	status?: 'pending' | 'sampled' | 'all';
	dzongkhagId?: number;
	administrativeZoneId?: number;
	subAdministrativeZoneId?: number;
}

export interface SamplingExistsCheckDto {
	exists: boolean;
	message: string;
	data: {
		samplingId: number;
		surveyEnumerationAreaId: number;
		method: SamplingMethod;
		sampleSize: number;
		populationSize: number;
		isFullSelection: boolean;
		executedAt: string;
		executedBy: number;
	} | null;
}

/**
 * Selected household in sampling results
 */
export interface SamplingResultHouseholdDto {
	selectionOrder: number;
	isReplacement: boolean;
	household: {
		id: number;
		structureNumber: string;
		householdIdentification: string;
		householdSerialNumber: number;
		nameOfHOH: string;
		totalMale: number;
		totalFemale: number;
		totalPopulation: number;
		phoneNumber: string | null;
		remarks: string | null;
		createdAt: string;
	};
}

/**
 * Enumeration area info in sampling results
 */
export interface SamplingResultEADto {
	id: number;
	name: string;
	areaCode: string;
	subAdminZone: {
		name: string;
		areaCode: string;
		type: string;
	};
	adminZone: {
		name: string;
		areaCode: string;
		type: string;
	};
}

/**
 * Sampling metadata in results
 */
export interface SamplingResultSamplingDto {
	id: number;
	method: SamplingMethod;
	sampleSize: number;
	populationSize: number;
	samplingInterval: number | null;
	randomStart: number | null;
	wrapAroundCount: number;
	isFullSelection: boolean;
	selectedIndices: number[];
	metadata: Record<string, any>;
	executedAt: string;
	executedBy: number | null;
}

/**
 * Complete sampling results response
 */
export interface SamplingResultsResponseDto {
	success: boolean;
	message: string;
	data: {
		sampling: SamplingResultSamplingDto;
		enumerationArea: SamplingResultEADto;
		selectedHouseholds: SamplingResultHouseholdDto[];
	};
}

/**
 * Enumeration Area with sampling information in hierarchy
 */
export interface EnumerationAreaSamplingHierarchyDto {
	id: number;
	name: string;
	areaCode: string;
	surveyEnumerationAreaId: number;
	totalHouseholdCount: number;
	// Submission status
	isSubmitted: boolean;
	submittedBy: number | null;
	submissionDate: string | Date | null;
	// Validation status
	isValidated: boolean;
	validatedBy: number | null;
	validationDate: string | Date | null;
	// Sampling status
	hasSampling: boolean;
		sampling?: {
		id: number;
		method: SamplingMethod;
		sampleSize: number;
		populationSize: number;
		isFullSelection: boolean;
		executedAt: string | Date | null;
		executedBy: number | null;
	} | null;
}

/**
 * Sub-Administrative Zone with enumeration areas in sampling hierarchy
 */
export interface SubAdministrativeZoneSamplingHierarchyDto {
	id: number;
	name: string;
	areaCode: string;
	type: string;
	enumerationAreas: EnumerationAreaSamplingHierarchyDto[];
}

/**
 * Administrative Zone with sub-zones in sampling hierarchy
 */
export interface AdministrativeZoneSamplingHierarchyDto {
	id: number;
	name: string;
	areaCode: string;
	type: AdministrativeZoneType;
	subAdministrativeZones: SubAdministrativeZoneSamplingHierarchyDto[];
}

/**
 * Dzongkhag with administrative zones in sampling hierarchy
 */
export interface DzongkhagSamplingHierarchyDto {
	id: number;
	name: string;
	areaCode: string;
	areaSqKm: number;
	administrativeZones: AdministrativeZoneSamplingHierarchyDto[];
}

/**
 * Summary statistics for sampling enumeration hierarchy
 */
export interface SamplingEnumerationHierarchySummaryDto {
	totalDzongkhags: number;
	totalAdministrativeZones: number;
	totalSubAdministrativeZones: number;
	totalEnumerationAreas: number;
	totalWithSampling: number;
	totalWithoutSampling: number;
}

/**
 * Complete sampling enumeration hierarchy response
 */
export interface SamplingEnumerationHierarchyDto {
	survey: {
		id: number;
		name: string;
		year: number;
	};
	summary: SamplingEnumerationHierarchySummaryDto;
	hierarchy: DzongkhagSamplingHierarchyDto[];
}

