# Admin Dashboard Data Models & Interfaces

## Overview
This document defines all TypeScript interfaces and data models required for the admin dashboard functionality. These interfaces ensure type safety and consistent data structure across the application.

## Core Entity Interfaces

### User & Authentication Models

```typescript
// User roles enumeration
export enum UserRole {
  ADMIN = 'ADMIN',
  THEATRE_MANAGER = 'THEATRE_MANAGER',
  EXECUTIVE_PRODUCER = 'EXECUTIVE_PRODUCER',
  COUNTER_STAFF = 'COUNTER_STAFF',
  CUSTOMER = 'CUSTOMER'
}

// User status enumeration
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

// Base user interface
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  profileImage?: string;
  permissions: string[];
}

// Admin user specific interface
export interface AdminUser extends User {
  adminLevel: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER';
  managedTheaters?: number[];
  accessLevel: 'FULL' | 'LIMITED' | 'READ_ONLY';
}

// Authentication response
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  permissions: string[];
}
```

### Movie Management Models

```typescript
// Movie status enumeration
export enum MovieStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMING_SOON = 'COMING_SOON',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED'
}

// Movie rating enumeration
export enum MovieRating {
  G = 'G',
  PG = 'PG',
  PG_13 = 'PG-13',
  R = 'R',
  NC_17 = 'NC-17'
}

// Genre interface
export interface Genre {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

// Language interface
export interface Language {
  id: number;
  name: string;
  code: string; // ISO language code
  isActive: boolean;
}

// Cast member interface
export interface CastMember {
  id: number;
  name: string;
  role: string; // 'ACTOR', 'DIRECTOR', 'PRODUCER', etc.
  character?: string; // Character name for actors
  profileImage?: string;
  biography?: string;
}

// Movie interface
export interface Movie {
  id: number;
  title: string;
  originalTitle?: string;
  description: string;
  synopsis?: string;
  durationMinutes: number;
  releaseDate: Date;
  pgRating: MovieRating;
  status: MovieStatus;
  posterImage?: string;
  landscapeImage?: string;
  trailerUrl?: string;
  genres: Genre[];
  languages: Language[];
  cast: CastMember[];
  director: string;
  producer: string;
  country: string;
  budget?: number;
  boxOfficeCollection?: number;
  imdbRating?: number;
  rottenTomatoesRating?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
}

// Movie analytics interface
export interface MovieAnalytics {
  movieId: number;
  totalBookings: number;
  totalRevenue: number;
  averageOccupancy: number;
  popularShowTimes: string[];
  revenueByDate: { date: string; revenue: number }[];
  bookingsByDate: { date: string; bookings: number }[];
  audienceRating: number;
  topTheaters: { theaterId: number; theaterName: string; bookings: number }[];
}
```

### Theater & Hall Models

```typescript
// Theater status enumeration
export enum TheaterStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  TEMPORARILY_CLOSED = 'TEMPORARILY_CLOSED'
}

// Hall type enumeration
export enum HallType {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  IMAX = 'IMAX',
  DOLBY_ATMOS = 'DOLBY_ATMOS',
  VIP = 'VIP'
}

// Seat category enumeration
export enum SeatCategory {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP',
  WHEELCHAIR_ACCESSIBLE = 'WHEELCHAIR_ACCESSIBLE'
}

// Location interface
export interface Location {
  id: number;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

// Seat interface
export interface Seat {
  id: number;
  hallId: number;
  seatNumber: string;
  row: string;
  column: number;
  category: SeatCategory;
  price: number;
  isActive: boolean;
  isBlocked: boolean;
}

// Hall interface
export interface Hall {
  id: number;
  theaterId: number;
  name: string;
  type: HallType;
  capacity: number;
  totalSeats: number;
  status: TheaterStatus;
  features: string[]; // ['AC', 'DOLBY_SOUND', 'RECLINER_SEATS']
  seats: Seat[];
  seatingLayout: string; // JSON string representing seat layout
  createdAt: Date;
  updatedAt: Date;
}

// Theater interface
export interface Theater {
  id: number;
  name: string;
  address: string;
  location: Location;
  phoneNumber: string;
  email: string;
  status: TheaterStatus;
  managerId?: number;
  totalHalls: number;
  totalCapacity: number;
  amenities: string[];
  parkingCapacity?: number;
  halls: Hall[];
  operatingHours: {
    openTime: string;
    closeTime: string;
    daysOfWeek: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Theater analytics interface
export interface TheaterAnalytics {
  theaterId: number;
  occupancyRate: number;
  totalRevenue: number;
  totalBookings: number;
  popularMovies: { movieId: number; movieTitle: string; bookings: number }[];
  revenueByHall: { hallId: number; hallName: string; revenue: number }[];
  peakHours: { hour: number; bookings: number }[];
  monthlyTrends: { month: string; occupancy: number; revenue: number }[];
}
```

### Screening & Booking Models

```typescript
// Screening status enumeration
export enum ScreeningStatus {
  SCHEDULED = 'SCHEDULED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED'
}

// Booking status enumeration
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  NO_SHOW = 'NO_SHOW'
}

// Payment status enumeration
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

// Screening interface
export interface Screening {
  id: number;
  movieId: number;
  movie: Movie;
  hallId: number;
  hall: Hall;
  startTime: Date;
  endTime: Date;
  status: ScreeningStatus;
  basePrice: number;
  premiumPrice: number;
  vipPrice: number;
  availableSeats: number;
  totalSeats: number;
  bookedSeats: string[]; // Array of seat IDs
  createdAt: Date;
  updatedAt: Date;
}

// Booking interface
export interface Booking {
  id: number;
  bookingNumber: string;
  customerId: number;
  customer: User;
  screeningId: number;
  screening: Screening;
  seats: Seat[];
  totalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  bookingDate: Date;
  confirmationDate?: Date;
  cancellationDate?: Date;
  refundAmount?: number;
  specialRequests?: string;
  promoCode?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number; // For counter bookings
}

// Booking analytics interface
export interface BookingAnalytics {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  cancellationRate: number;
  refundRate: number;
  bookingsByStatus: { status: BookingStatus; count: number }[];
  revenueByDay: { date: string; revenue: number }[];
  popularShowTimes: { time: string; bookings: number }[];
  customerRetentionRate: number;
}
```

### Dashboard & Analytics Models

```typescript
// Dashboard statistics interface
export interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  totalMovies: number;
  totalTheaters: number;
  totalCustomers: number;
  todayBookings: number;
  todayRevenue: number;
  occupancyRate: number;
  averageTicketPrice: number;
  revenueGrowth: number; // Percentage
  bookingGrowth: number; // Percentage
  topPerformingMovie: {
    movieId: number;
    title: string;
    revenue: number;
  };
  topPerformingTheater: {
    theaterId: number;
    name: string;
    revenue: number;
  };
}

// Revenue trend data
export interface RevenueTrend {
  date: string;
  revenue: number;
  bookings: number;
  occupancy: number;
}

// Popular movie data
export interface PopularMovie {
  movieId: number;
  title: string;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  posterImage: string;
  status: MovieStatus;
}

// Theater performance data
export interface TheaterPerformance {
  theaterId: number;
  name: string;
  location: string;
  occupancyRate: number;
  totalRevenue: number;
  totalBookings: number;
  status: TheaterStatus;
}

// Recent activity interface
export interface RecentActivity {
  id: number;
  type: 'BOOKING' | 'CANCELLATION' | 'REFUND' | 'NEW_MOVIE' | 'THEATER_UPDATE';
  description: string;
  timestamp: Date;
  userId?: number;
  userName?: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
}
```

### Financial Models

```typescript
// Payment method interface
export interface PaymentMethod {
  id: number;
  name: string;
  type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'DIGITAL_WALLET' | 'BANK_TRANSFER' | 'CASH';
  isActive: boolean;
  processingFee: number;
  minAmount?: number;
  maxAmount?: number;
  configuration: any; // Payment gateway specific config
}

// Pricing rule interface
export interface PricingRule {
  id: number;
  name: string;
  movieId?: number;
  theaterId?: number;
  hallId?: number;
  dayOfWeek?: string[];
  timeSlot?: { start: string; end: string };
  adjustmentType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  adjustmentValue: number;
  isActive: boolean;
  validFrom: Date;
  validTo?: Date;
}

// Financial report interface
export interface FinancialReport {
  id: number;
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  periodStart: Date;
  periodEnd: Date;
  totalRevenue: number;
  totalBookings: number;
  totalRefunds: number;
  netRevenue: number;
  averageTicketPrice: number;
  revenueByCategory: { category: string; amount: number }[];
  revenueByTheater: { theaterId: number; theaterName: string; amount: number }[];
  revenueByMovie: { movieId: number; movieTitle: string; amount: number }[];
  generatedAt: Date;
  generatedBy: number;
}
```

### System Configuration Models

```typescript
// System setting interface
export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  category: 'GENERAL' | 'SECURITY' | 'PAYMENT' | 'NOTIFICATION' | 'FEATURE_FLAG';
  description: string;
  isEditable: boolean;
  updatedAt: Date;
  updatedBy: number;
}

// Audit log interface
export interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  entityType: string;
  entityId: number;
  oldValues?: any;
  newValues?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  module: string;
}

// Notification interface
export interface Notification {
  id: number;
  recipientId: number;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}
```

### API Response Models

```typescript
// Generic API response interface
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: string[];
  timestamp: Date;
}

// Paginated response interface
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message: string;
}

// Error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}
```

### Form & Filter Models

```typescript
// Search filters interface
export interface SearchFilters {
  query?: string;
  status?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  category?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

// Movie filters interface
export interface MovieFilters extends SearchFilters {
  genres?: number[];
  languages?: number[];
  rating?: MovieRating[];
  releaseYear?: number[];
  duration?: { min: number; max: number };
}

// Booking filters interface
export interface BookingFilters extends SearchFilters {
  bookingStatus?: BookingStatus[];
  paymentStatus?: PaymentStatus[];
  theaterId?: number[];
  movieId?: number[];
  customerId?: number;
  amountRange?: { min: number; max: number };
}

// User filters interface
export interface UserFilters extends SearchFilters {
  roles?: UserRole[];
  userStatus?: UserStatus[];
  lastLoginFrom?: Date;
  lastLoginTo?: Date;
}
```

## Usage Examples

```typescript
// Service method example
@Injectable()
export class AdminDashboardService {
  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>('/api/admin/dashboard/stats');
  }

  getPopularMovies(filters: MovieFilters): Observable<PaginatedResponse<PopularMovie>> {
    return this.http.get<PaginatedResponse<PopularMovie>>('/api/admin/movies/popular', {
      params: this.createParams(filters)
    });
  }
}

// Component usage example
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats;
  movies: PopularMovie[] = [];
  theaters: TheaterPerformance[] = [];

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.dashboardService.getDashboardStats().subscribe(
      response => this.stats = response.data
    );
  }
}
```

These interfaces provide complete type safety for the admin dashboard and ensure consistent data structure across all components and services.
