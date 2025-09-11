import { Movie } from '../movie/movie.interface';
import { Booking } from '../booking/booking.interface';
import { Screening } from '../screening/screening.interface';
import { Theatre } from '../theatre/theatre.interface';

// Base API Response Interface
export interface ApiResponse<T> {
	success: boolean;
	message: string;
	data: T;
	count?: number;
	error?: string;
}

// Dashboard Interfaces
export interface MovieDashboardData {
	movieId: number;
	movieTitle: string;
	totalRevenue: number;
	totalBookings: number;
	totalTicketsSold: number;
	averageOccupancyRate: number;
	totalScreenings: number;
	activeScreenings: number;
	upcomingScreenings: number;
	completedScreenings: number;
	topPerformingTheatres: TheatrePerformance[];
	recentBookings: Booking[];
	revenueByDay: DailyRevenue[];
	occupancyTrend: OccupancyTrend[];
}

export interface DashboardOverview {
	totalMovies: number;
	activeReleases: number;
	totalRevenue: number;
	totalBookings: number;
	totalTicketsSold: number;
	averageOccupancyRate: number;
	topPerformingMovies: MoviePerformance[];
	recentActivity: RecentActivity[];
	revenueGrowth: number;
	bookingGrowth: number;
}

// Revenue Interfaces
export interface MovieRevenueData {
	movieId: number;
	movieTitle: string;
	totalRevenue: number;
	totalBookings: number;
	totalTicketsSold: number;
	averageTicketPrice: number;
	revenueByTheatre: TheatreRevenue[];
	revenueByPeriod: PeriodRevenue[];
	topPerformingScreenings: ScreeningPerformance[];
}

export interface RevenueTrendData {
	period: string;
	revenue: number;
	bookings: number;
	ticketsSold: number;
	averageTicketPrice: number;
	occupancyRate: number;
}

// Booking Analytics Interfaces
export interface MovieBookingsData {
	movieId: number;
	movieTitle: string;
	totalBookings: number;
	totalTicketsSold: number;
	bookings: Booking[];
	bookingsByStatus: BookingStatusCount[];
	bookingsByTheatre: TheatreBookings[];
	bookingsByPeriod: PeriodBookings[];
}

export interface BookingAnalyticsData {
	movieId: number;
	movieTitle: string;
	totalBookings: number;
	analytics: {
		peakBookingHours: HourlyBookings[];
		bookingPatterns: BookingPattern[];
		customerSegmentation: CustomerSegment[];
		deviceAnalytics: DeviceAnalytics[];
		locationAnalytics: LocationAnalytics[];
		paymentMethodAnalytics: PaymentMethodAnalytics[];
		conversionRates: ConversionRate[];
		cancellationAnalytics: CancellationAnalytics;
	};
}

// Performance Metrics Interfaces
export interface MoviePerformanceMetrics {
	movieId: number;
	movieTitle: string;
	performanceScore: number;
	metrics: {
		financial: FinancialMetrics;
		operational: OperationalMetrics;
		customer: CustomerMetrics;
		comparative: ComparativeMetrics;
	};
}

export interface FinancialMetrics {
	totalRevenue: number;
	averageRevenuePerScreening: number;
	revenueGrowthRate: number;
	profitMargin: number;
	returnOnInvestment: number;
	ticketPriceOptimization: number;
}

export interface OperationalMetrics {
	totalScreenings: number;
	averageOccupancyRate: number;
	capacityUtilization: number;
	screeningEfficiency: number;
	theatrePerformanceVariance: number;
	timeSlotOptimization: number;
}

export interface CustomerMetrics {
	customerSatisfactionScore: number;
	repeatCustomerRate: number;
	averageBookingValue: number;
	customerAcquisitionCost: number;
	customerLifetimeValue: number;
	bookingConversionRate: number;
}

export interface ComparativeMetrics {
	industryBenchmark: number;
	genreComparison: number;
	theatreRanking: number;
	seasonalPerformance: number;
	competitorComparison: number;
}

// Supporting Interfaces
export interface TheatrePerformance {
	theatreId: number;
	theatreName: string;
	revenue: number;
	bookings: number;
	occupancyRate: number;
	screenings: number;
}

export interface MoviePerformance {
	movieId: number;
	movieTitle: string;
	revenue: number;
	bookings: number;
	occupancyRate: number;
	rating: number;
	status: string;
}

export interface RecentActivity {
	id: number;
	type: 'booking' | 'screening' | 'revenue' | 'review';
	description: string;
	timestamp: Date;
	movieId: number;
	movieTitle: string;
	amount?: number;
}

export interface DailyRevenue {
	date: string;
	revenue: number;
	bookings: number;
	occupancyRate: number;
}

export interface OccupancyTrend {
	period: string;
	occupancyRate: number;
	capacity: number;
	ticketsSold: number;
}

export interface TheatreRevenue {
	theatreId: number;
	theatreName: string;
	revenue: number;
	bookings: number;
	screenings: number;
	occupancyRate: number;
}

export interface PeriodRevenue {
	period: string;
	revenue: number;
	bookings: number;
	ticketsSold: number;
	averageTicketPrice: number;
}

export interface ScreeningPerformance {
	screeningId: number;
	screeningTime: Date;
	theatreId: number;
	theatreName: string;
	revenue: number;
	bookings: number;
	occupancyRate: number;
	capacity: number;
}

export interface BookingStatusCount {
	status: string;
	count: number;
	percentage: number;
}

export interface TheatreBookings {
	theatreId: number;
	theatreName: string;
	bookings: number;
	revenue: number;
	occupancyRate: number;
}

export interface PeriodBookings {
	period: string;
	bookings: number;
	revenue: number;
	ticketsSold: number;
}

export interface HourlyBookings {
	hour: number;
	bookings: number;
	revenue: number;
}

export interface BookingPattern {
	pattern: string;
	frequency: number;
	percentage: number;
}

export interface CustomerSegment {
	segment: string;
	count: number;
	percentage: number;
	averageSpending: number;
}

export interface DeviceAnalytics {
	deviceType: string;
	bookings: number;
	percentage: number;
	conversionRate: number;
}

export interface LocationAnalytics {
	location: string;
	bookings: number;
	percentage: number;
	averageSpending: number;
}

export interface PaymentMethodAnalytics {
	paymentMethod: string;
	bookings: number;
	percentage: number;
	averageTransactionValue: number;
}

export interface ConversionRate {
	stage: string;
	rate: number;
	dropoffCount: number;
}

export interface CancellationAnalytics {
	totalCancellations: number;
	cancellationRate: number;
	reasonBreakdown: CancellationReason[];
	refundAmount: number;
	timingAnalysis: CancellationTiming[];
}

export interface CancellationReason {
	reason: string;
	count: number;
	percentage: number;
}

export interface CancellationTiming {
	timeBeforeScreening: string;
	count: number;
	percentage: number;
}

// Movie Summary Interface
export interface MovieSummary {
	movieId: number;
	movieTitle: string;
	description: string;
	durationMin: number;
	releaseDate: string;
	status: string;
	totalRevenue: number;
	totalBookings: number;
	totalScreenings: number;
	averageOccupancyRate: number;
	averageRating: number;
	performanceScore: number;
}

// Query Parameters Interfaces
export interface RevenueTrendParams {
	period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
	startDate?: string;
	endDate?: string;
	movieId?: number;
}

export interface AnalyticsFilterParams {
	startDate?: string;
	endDate?: string;
	theatreId?: number;
	status?: string;
}
