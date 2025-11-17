/**
 * Pagination Query DTO
 * Query parameters for paginated endpoints
 * Matches backend pagination structure
 */
export interface PaginationQueryDto {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC';
}

/**
 * Pagination Metadata
 * Metadata returned with paginated responses
 * Matches backend pagination response structure
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
 * Matches backend pagination response
 */
export interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
}

// ============================================================
// LEGACY INTERFACES (Deprecated - Use PaginatedResponse instead)
// Kept for backward compatibility
// ============================================================

/**
 * @deprecated Use PaginatedResponse instead
 * Pagination response interface
 */
export interface PaginatedData<T> {
	data: T[];
	pagination: {
		currentPage: number;
		pageSize: number;
		totalCount: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
		firstPage: number;
		lastPage: number;
		nextPage: number | null;
		previousPage: number | null;
	};
}

/**
 * @deprecated Use PaginationQueryDto instead
 * Pagination request parameters
 */
export interface PaginationParams {
	page: number;
	pageSize: number;
	offset?: number;
	limit?: number;
}

/**
 * Pagination filter options for screenings
 */
export interface PaginatedScreeningFilter {
	movieId?: number;
	hallId?: number;
	theatreId?: number;
	date?: string;
	searchTerm?: string;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Create pagination query parameters
 * @param page Page number (default: 1)
 * @param limit Items per page (default: 10)
 * @param sortBy Field to sort by (optional)
 * @param sortOrder Sort order ASC or DESC (default: DESC)
 * @returns PaginationQueryDto
 */
export function createPaginationQuery(
	page: number = 1,
	limit: number = 10,
	sortBy?: string,
	sortOrder: 'ASC' | 'DESC' = 'DESC'
): PaginationQueryDto {
	const query: PaginationQueryDto = {
		page,
		limit,
	};

	if (sortBy) {
		query.sortBy = sortBy;
		query.sortOrder = sortOrder;
	}

	return query;
}

/**
 * Calculate offset and limit from pagination query
 * @param query Pagination query
 * @returns Object with offset and limit
 */
export function calculatePaginationOffsetLimit(query: PaginationQueryDto): {
	offset: number;
	limit: number;
} {
	const page = query.page || 1;
	const limit = query.limit || 10;
	const offset = (page - 1) * limit;

	return { offset, limit };
}

/**
 * Create paginated response metadata
 * @param totalItems Total number of items
 * @param currentPage Current page number
 * @param itemsPerPage Items per page
 * @returns PaginationMeta
 */
export function createPaginationMeta(
	totalItems: number,
	currentPage: number,
	itemsPerPage: number
): PaginationMeta {
	const totalPages = Math.ceil(totalItems / itemsPerPage);

	return {
		currentPage,
		itemsPerPage,
		totalItems,
		totalPages,
		hasNextPage: currentPage < totalPages,
		hasPreviousPage: currentPage > 1,
	};
}

/**
 * Create complete paginated response
 * @param data Array of data items
 * @param totalItems Total number of items
 * @param query Pagination query
 * @returns PaginatedResponse<T>
 */
export function createPaginatedResponseUtil<T>(
	data: T[],
	totalItems: number,
	query: PaginationQueryDto
): PaginatedResponse<T> {
	const currentPage = query.page || 1;
	const itemsPerPage = query.limit || 10;
	const meta = createPaginationMeta(totalItems, currentPage, itemsPerPage);

	return {
		data,
		meta,
	};
}

// ============================================================
// LEGACY UTILITY FUNCTIONS (Deprecated)
// ============================================================

/**
 * @deprecated Use createPaginationQuery instead
 * Utility function to create pagination parameters
 */
export function createPaginationParams(
	page: number = 1,
	pageSize: number = 10
): PaginationParams {
	const offset = (page - 1) * pageSize;
	return {
		page,
		pageSize,
		offset,
		limit: pageSize,
	};
}

/**
 * @deprecated Use createPaginatedResponseUtil instead
 * Utility function to create paginated response
 */
export function createPaginatedResponse<T>(
	data: T[],
	totalCount: number,
	currentPage: number,
	pageSize: number
): PaginatedData<T> {
	const totalPages = Math.ceil(totalCount / pageSize);
	const hasNext = currentPage < totalPages;
	const hasPrev = currentPage > 1;

	return {
		data,
		pagination: {
			currentPage,
			pageSize,
			totalCount,
			totalPages,
			hasNext,
			hasPrev,
			firstPage: 1,
			lastPage: totalPages,
			nextPage: hasNext ? currentPage + 1 : null,
			previousPage: hasPrev ? currentPage - 1 : null,
		},
	};
}
