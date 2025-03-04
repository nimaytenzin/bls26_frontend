export interface PaginatedData<T> {
    firstPage: number;
    currentPage: number;
    previousPage: number;
    nextPage: number;
    lastPage: number;
    limit: number;
    count: number;
    data: T[];
}

export interface PaginatedParamsOptions {
    pageNo?: number;
    pageSize?: number;
}
