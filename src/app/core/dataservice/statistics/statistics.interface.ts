// Statistics Interface Definitions

export interface MovieStatistics {
	movieId: number;
	movieTitle: string;
	totalScreenings: number;
	totalTicketsSold: number;
	totalRevenue: number;
	averageOccupancyRate: number;
	firstScreeningDate?: string;
	lastScreeningDate?: string;
}

export interface MovieStatisticsResponse {
	success: boolean;
	statistics: MovieStatistics;
}

export interface CountResponse {
	success: boolean;
	movieId: number;
	totalScreenings?: number;
	totalTicketsSold?: number;
}

export interface RevenueResponse {
	success: boolean;
	movieId: number;
	totalRevenue: number;
}

export interface OccupancyResponse {
	success: boolean;
	movieId: number;
	averageOccupancyRate: number;
}

export interface ApiErrorResponse {
	statusCode: number;
	message: string;
}
