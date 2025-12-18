import { SurveyEnumerationArea } from '../../survey-enumeration-area/survey-enumeration-area.dto';
import { SubAdministrativeZone } from '../sub-administrative-zone/sub-administrative-zone.dto';

export interface EnumerationArea {
	id: number;
	name: string;
	description: string;
	areaCode: string;
	geom?: any; // GeoJSON geometry
	createdAt?: Date;
	updatedAt?: Date;
	isActive?: boolean; // Default: true
	deactivatedAt?: Date; // When EA was deactivated
	deactivatedReason?: string; // Reason for deactivation

	subAdministrativeZones?: SubAdministrativeZone[]; // Array via junction table
	surveyEnumerationAreas: SurveyEnumerationArea[];
}

export interface EnumerationAreaGeoJSON {
	type: 'FeatureCollection';
	features: EnumerationAreaFeature[];
}

export interface EnumerationAreaFeature {
	type: 'Feature';
	id: number;
	properties: EnumerationAreaProperties;
	geometry: EnumerationAreaGeometry;
}

export interface EnumerationAreaProperties {
	id: number;
	subAdministrativeZoneIds?: number[]; // Array of SAZ IDs
	name: string;
	description: string;
	areaCode: string;
	[key: string]: any; // Allow additional properties
}

export interface EnumerationAreaGeometry {
	type:
		| 'MultiPolygon'
		| 'Polygon'
		| 'Point'
		| 'LineString'
		| 'MultiPoint'
		| 'MultiLineString';
	coordinates: any;
}

export interface CreateEnumerationAreaDto {
	subAdministrativeZoneIds: number[]; // Array, min 1
	name: string;
	description: string;
	areaCode: string;
	geom?: string; // Optional geometry string
}

export interface UpdateEnumerationAreaDto {
	subAdministrativeZoneIds?: number[]; // Array, min 1 if provided
	name?: string;
	description?: string;
	areaCode?: string;
}

export interface ApiResponse<T> {
	statusCode: number;
	message: string;
	data: T;
}

export interface BulkUploadResponse {
	success: number;
	skipped: number;
	created: EnumerationArea[];
	skippedItems: Array<{
		areaCode: string;
		subAdministrativeZoneIds?: number[];
		reason: string;
	}>;
	errors: Array<{
		feature: any;
		error: string;
	}>;
}

/**
 * Create Two SAZs with EA Request DTO
 * Data structure for creating two SAZs and a single EA that links to both
 */
export interface CreateTwoSazsWithEaRequest {
	saz1Data: {
		name: string;
		areaCode: string;
		type: 'chiwog' | 'lap';
		administrativeZoneId: number;
	};
	saz2Data: {
		name: string;
		areaCode: string;
		type: 'chiwog' | 'lap';
		administrativeZoneId: number;
	};
}

/**
 * Create Two SAZs with EA Response
 * Response from the create-two-sazs-with-ea endpoint
 */
export interface CreateTwoSazsWithEaResponse {
	subAdministrativeZone1: {
		id: number;
		administrativeZoneId: number;
		name: string;
		areaCode: string;
		type: 'chiwog' | 'lap';
		geom?: string;
	};
	subAdministrativeZone2: {
		id: number;
		administrativeZoneId: number;
		name: string;
		areaCode: string;
		type: 'chiwog' | 'lap';
		geom?: string;
	};
	enumerationArea: {
		id: number;
		name: string; // Always "EA1"
		areaCode: string; // Always "01"
		description: string; // "EA for [SAZ1 name] and [SAZ2 name]"
		geom?: string; // Combined geometry (ST_Union of both SAZs)
		subAdministrativeZones?: Array<{
			id: number;
			name: string;
			areaCode: string;
			type: 'chiwog' | 'lap';
			administrativeZone?: {
				id: number;
				name: string;
			};
		}>;
	};
}

/**
 * Operation Type Enum
 * Types of operations that can be performed on enumeration areas
 */
export enum OperationType {
	SPLIT = 'SPLIT',
	MERGE = 'MERGE',
}

/**
 * Enumeration Area Lineage
 * Represents a lineage record linking parent and child EAs
 */
export interface EnumerationAreaLineage {
	id: number;
	parentEaId: number;
	childEaId: number;
	operationType: OperationType;
	operationDate: Date;
	reason?: string;
}

/**
 * Split EA Request DTO
 * Data structure for splitting an enumeration area
 */
export interface SplitEaRequest {
	newEas: Array<{
		name: string;
		areaCode: string;
		description: string;
		subAdministrativeZoneIds: number[];
	}>;
	reason?: string;
}

/**
 * Merge EA Request DTO
 * Data structure for merging enumeration areas
 */
export interface MergeEaRequest {
	sourceEaIds: number[];
	mergedEa: {
		name: string;
		areaCode: string;
		description: string;
		subAdministrativeZoneIds: number[];
	};
	reason?: string;
}

/**
 * EA Lineage Node
 * Represents a node in the lineage tree
 */
export interface EaLineageNode {
	ea: EnumerationArea;
	operation?: {
		type: OperationType;
		date: Date;
		reason?: string;
		parentEaId: number;
		childEaId: number;
	};
	parents: EaLineageNode[];
	children: EaLineageNode[];
}

/**
 * EA Lineage Response
 * Response from the lineage endpoint
 */
export interface EaLineageResponse {
	ea: EnumerationArea;
	ancestors: EaLineageNode[];
	descendants: EaLineageNode[];
	operations: Array<{
		type: OperationType;
		date: Date;
		reason?: string;
		parentEaId: number;
		childEaId: number;
	}>;
}

/**
 * EA History Response
 * Response from the history endpoint
 */
export interface EaHistoryResponse {
	currentEa: EnumerationArea;
	history: {
		ancestors: EaLineageNode[];
		descendants: EaLineageNode[];
	};
}

/**
 * Pagination Meta Information
 * Metadata for paginated responses
 */
export interface PaginationMeta {
	currentPage: number;
	itemsPerPage: number;
	totalItems: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

/**
 * Paginated Response
 * Generic paginated response structure
 */
export interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
}
