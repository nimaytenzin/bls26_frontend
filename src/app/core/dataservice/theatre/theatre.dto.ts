// Theatre Data Models and DTOs

export interface Theatre {
	id: string;
	name: string;
	location: string;
	address: string;
	city: string;
	district: string;
	phone: string;
	email: string;
	description: string;
	image: string;
	status: TheatreStatus;
	facilities: TheatreFacility[];
	operatingHours: OperatingHours;
	totalHalls: number;
	totalSeats: number;
	createdAt: Date;
	updatedAt: Date;
	halls: Hall[];
	isSelected?: boolean;
}

export interface Hall {
	id: string;
	theatreId: string;
	name: string;
	type: HallType;
	capacity: number;
	status: HallStatus;
	seatLayout: SeatLayout;
	features: HallFeature[];
	soundSystem: SoundSystem;
	projectionType: ProjectionType[];
	airConditioning: boolean;
	accessibility: AccessibilityFeature[];
	pricing: HallPricing;
	createdAt: Date;
	updatedAt: Date;
	isSelected?: boolean;
}

export interface SeatLayout {
	rows: number;
	seatsPerRow: number;
	seatTypes: SeatType[];
	aisles: AisleConfig[];
}

export interface SeatType {
	type: SeatCategory;
	count: number;
	price: number;
	color: string;
	rows: string[];
}

export interface AisleConfig {
	afterRow: number;
	width: number;
}

export interface HallPricing {
	basePrice: number;
	premiumPrice: number;
	vipPrice: number;
	weekendSurcharge: number;
	holidaySurcharge: number;
}

export interface OperatingHours {
	monday: DaySchedule;
	tuesday: DaySchedule;
	wednesday: DaySchedule;
	thursday: DaySchedule;
	friday: DaySchedule;
	saturday: DaySchedule;
	sunday: DaySchedule;
}

export interface DaySchedule {
	isOpen: boolean;
	openTime: string;
	closeTime: string;
	breaks: TimeSlot[];
}

export interface TimeSlot {
	startTime: string;
	endTime: string;
}

// Enums
export enum TheatreStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	MAINTENANCE = 'maintenance',
	RENOVATION = 'renovation',
	TEMPORARILY_CLOSED = 'temporarily_closed',
}

export enum HallStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	MAINTENANCE = 'maintenance',
	CLEANING = 'cleaning',
	BOOKED = 'booked',
}

export enum HallType {
	STANDARD = 'standard',
	PREMIUM = 'premium',
	IMAX = 'imax',
	DOLBY_ATMOS = 'dolby_atmos',
	VIP = 'vip',
	DRIVE_IN = 'drive_in',
}

export enum SeatCategory {
	REGULAR = 'regular',
	PREMIUM = 'premium',
	VIP = 'vip',
	COUPLE = 'couple',
	WHEELCHAIR = 'wheelchair',
}

export enum SoundSystem {
	STEREO = 'stereo',
	SURROUND_5_1 = 'surround_5_1',
	SURROUND_7_1 = 'surround_7_1',
	DOLBY_ATMOS = 'dolby_atmos',
	DTS_X = 'dts_x',
	IMAX_ENHANCED = 'imax_enhanced',
}

export enum ProjectionType {
	DIGITAL_2D = 'digital_2d',
	DIGITAL_3D = 'digital_3d',
	IMAX = 'imax',
	DOLBY_VISION = 'dolby_vision',
	HDR = 'hdr',
	LASER = 'laser',
}

export enum TheatreFacility {
	PARKING = 'parking',
	FOOD_COURT = 'food_court',
	RESTAURANT = 'restaurant',
	COFFEE_SHOP = 'coffee_shop',
	GIFT_SHOP = 'gift_shop',
	ATM = 'atm',
	WIFI = 'wifi',
	CHARGING_STATIONS = 'charging_stations',
	KIDS_PLAY_AREA = 'kids_play_area',
	GAMING_ZONE = 'gaming_zone',
	ELEVATORS = 'elevators',
	ESCALATORS = 'escalators',
}

export enum HallFeature {
	RECLINER_SEATS = 'recliner_seats',
	LEATHER_SEATS = 'leather_seats',
	HEATED_SEATS = 'heated_seats',
	MASSAGE_SEATS = 'massage_seats',
	DINING_SERVICE = 'dining_service',
	BEVERAGE_SERVICE = 'beverage_service',
	PRIVATE_ENTRANCE = 'private_entrance',
	BALCONY = 'balcony',
	STAGE = 'stage',
	CURTAINS = 'curtains',
}

export enum AccessibilityFeature {
	WHEELCHAIR_ACCESS = 'wheelchair_access',
	HEARING_ASSISTANCE = 'hearing_assistance',
	VISUAL_ASSISTANCE = 'visual_assistance',
	SIGN_LANGUAGE = 'sign_language',
	BRAILLE_SUPPORT = 'braille_support',
	ACCESSIBLE_RESTROOMS = 'accessible_restrooms',
	RAMPS = 'ramps',
	WIDE_DOORS = 'wide_doors',
}

// DTOs for API operations
export interface CreateTheatreDTO {
	name: string;
	location: string;
	address: string;
	city: string;
	district: string;
	phone: string;
	email: string;
	description: string;
	image?: string;
	facilities: TheatreFacility[];
	operatingHours: OperatingHours;
}

export interface UpdateTheatreDTO extends Partial<CreateTheatreDTO> {
	id: string;
	status?: TheatreStatus;
}

export interface CreateHallDTO {
	theatreId: string;
	name: string;
	type: HallType;
	capacity: number;
	seatLayout: SeatLayout;
	features: HallFeature[];
	soundSystem: SoundSystem;
	projectionType: ProjectionType[];
	airConditioning: boolean;
	accessibility: AccessibilityFeature[];
	pricing: HallPricing;
}

export interface UpdateHallDTO extends Partial<CreateHallDTO> {
	id: string;
	status?: HallStatus;
}

// Statistics and Analytics
export interface TheatreStats {
	totalTheatres: number;
	activeTheatres: number;
	totalHalls: number;
	totalSeats: number;
	averageOccupancy: number;
	topPerformingTheatre: Theatre;
	revenueByTheatre: { theatreId: string; revenue: number; name: string }[];
}

export interface HallStats {
	totalShows: number;
	totalBookings: number;
	averageOccupancy: number;
	revenue: number;
	popularShowTimes: string[];
	seatUtilization: { category: SeatCategory; utilization: number }[];
}

// Filter and Search DTOs
export interface TheatreFilter {
	status?: TheatreStatus[];
	city?: string[];
	district?: string[];
	facilities?: TheatreFacility[];
	minHalls?: number;
	maxHalls?: number;
	minSeats?: number;
	maxSeats?: number;
}

export interface HallFilter {
	theatreId?: string;
	type?: HallType[];
	status?: HallStatus[];
	features?: HallFeature[];
	soundSystem?: SoundSystem[];
	projectionType?: ProjectionType[];
	minCapacity?: number;
	maxCapacity?: number;
	accessibility?: AccessibilityFeature[];
}

export interface TheatreSearchParams {
	query?: string;
	filter?: TheatreFilter;
	sortBy?: 'name' | 'location' | 'totalHalls' | 'totalSeats' | 'createdAt';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	limit?: number;
}

export interface HallSearchParams {
	query?: string;
	filter?: HallFilter;
	sortBy?: 'name' | 'type' | 'capacity' | 'status' | 'createdAt';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	limit?: number;
}
