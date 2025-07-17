/**
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

/**
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
