// Enums for better type safety
export enum MovieGenre {
	ACTION = 'Action',
	ADVENTURE = 'Adventure',
	ANIMATION = 'Animation',
	BIOGRAPHY = 'Biography',
	COMEDY = 'Comedy',
	CRIME = 'Crime',
	DOCUMENTARY = 'Documentary',
	DRAMA = 'Drama',
	FAMILY = 'Family',
	FANTASY = 'Fantasy',
	HISTORY = 'History',
	HORROR = 'Horror',
	MUSIC = 'Music',
	MYSTERY = 'Mystery',
	ROMANCE = 'Romance',
	SCIENCE_FICTION = 'Science Fiction',
	SPORT = 'Sport',
	THRILLER = 'Thriller',
	WAR = 'War',
	WESTERN = 'Western',
}

export enum MovieRating {
	G = 'G', // General Audiences
	PG = 'PG', // Parental Guidance
	PG_13 = 'PG-13', // Parents Strongly Cautioned
	R = 'R', // Restricted
	NC_17 = 'NC-17', // Adults Only
	NR = 'NR', // Not Rated
	U = 'U', // Universal (UK)
	UA = 'UA', // Unrestricted Public Exhibition (India)
	A = 'A', // Adults Only (India)
}

export enum MovieStatus {
	COMING_SOON = 'Coming Soon',
	NOW_SHOWING = 'Now Showing',
	ENDED = 'Ended',
	CANCELLED = 'Cancelled',
}

export enum MovieLanguage {
	ENGLISH = 'English',
	HINDI = 'Hindi',
	SPANISH = 'Spanish',
	FRENCH = 'French',
	GERMAN = 'German',
	ITALIAN = 'Italian',
	JAPANESE = 'Japanese',
	KOREAN = 'Korean',
	CHINESE = 'Chinese',
	PORTUGUESE = 'Portuguese',
	RUSSIAN = 'Russian',
	ARABIC = 'Arabic',
}

// Supporting interfaces
export interface MovieCast {
	id: string;
	name: string;
	role: string;
	character?: string;
	profileImage?: string;
	isMainCast: boolean;
}

export interface MovieCrew {
	id: string;
	name: string;
	role: string; // Director, Producer, Writer, Cinematographer, etc.
	profileImage?: string;
}

export interface MovieRatings {
	imdb?: number; // 0-10 scale
	rottenTomatoes?: number; // 0-100 scale
	metacritic?: number; // 0-100 scale
	audienceScore?: number; // 0-100 scale
	totalReviews?: number;
	averageRating?: number; // Our platform's rating
}

export interface MovieTrailer {
	id: string;
	title: string;
	url: string;
	thumbnailUrl: string;
	duration: number; // in seconds
	isOfficial: boolean;
}

export interface MovieSchedule {
	id: string;
	theaterId: string;
	theaterName: string;
	screenId: string;
	screenName: string;
	showTime: Date;
	endTime: Date;
	availableSeats: number;
	totalSeats: number;
	basePrice: number;
	premiumPrice?: number;
	isActive: boolean;
}

export interface MovieReview {
	id: string;
	userId: string;
	userName: string;
	userAvatar?: string;
	rating: number; // 1-5 stars
	comment: string;
	createdAt: Date;
	isVerifiedBooking: boolean;
	helpfulCount: number;
	reportCount: number;
}

export interface MovieBoxOffice {
	budget?: number;
	domesticGross?: number;
	internationalGross?: number;
	worldwideGross?: number;
	currency: string;
}

export interface MovieAwards {
	id: string;
	awardName: string;
	category: string;
	year: number;
	isWinner: boolean; // true if won, false if nominated
}

// Main comprehensive movie interface
export interface IMovie {
	// Basic Information
	id: string;
	title: string;
	originalTitle?: string;
	description: string;
	synopsis?: string;
	tagline?: string;

	// Media
	posterUrl: string;
	backdropUrl?: string;
	galleryImages?: string[];
	trailers?: MovieTrailer[];

	// Classification
	genres: MovieGenre[];
	rating: MovieRating;
	language: MovieLanguage;
	subtitleLanguages?: MovieLanguage[];

	// Duration and Dates
	duration: number; // in minutes
	releaseDate: Date;
	endDate?: Date;
	status: MovieStatus;

	// People
	director: string[];
	cast: MovieCast[];
	crew: MovieCrew[];

	// Ratings and Reviews
	ratings: MovieRatings;
	reviews?: MovieReview[];

	// Business Information
	boxOffice?: MovieBoxOffice;
	awards?: MovieAwards[];

	// Technical Information
	format2D: boolean;
	format3D: boolean;
	formatIMAX: boolean;
	formatDolbyAtmos: boolean;
	aspectRatio?: string;

	// Booking Information
	schedules?: MovieSchedule[];
	isBookingOpen: boolean;
	advanceBookingDays?: number;

	// Administrative
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
	isActive: boolean;
	isPremiere?: boolean;
	isExclusive?: boolean;

	// SEO and Marketing
	seoTitle?: string;
	seoDescription?: string;
	keywords?: string[];
	promotionalText?: string;

	// Additional Metadata
	ageRestriction?: number;
	warnings?: string[]; // Content warnings
	country: string;
	productionCompany: string[];
	distributors?: string[];

	// Social Media
	officialWebsite?: string;
	socialMediaLinks?: {
		facebook?: string;
		twitter?: string;
		instagram?: string;
		youtube?: string;
	};
}

// Create Movie DTO for API requests
export interface CreateMovieRequest {
	title: string;
	description: string;
	posterUrl: string;
	genres: MovieGenre[];
	rating: MovieRating;
	language: MovieLanguage;
	duration: number;
	releaseDate: Date;
	director: string[];
	cast: Omit<MovieCast, 'id'>[];
	status: MovieStatus;
	format2D: boolean;
	format3D: boolean;
	formatIMAX: boolean;
	country: string;
	productionCompany: string[];
}

// Update Movie DTO
export interface UpdateMovieRequest extends Partial<CreateMovieRequest> {
	id: string;
}

// Movie Search/Filter DTO
export interface MovieSearchRequest {
	query?: string;
	genres?: MovieGenre[];
	language?: MovieLanguage;
	rating?: MovieRating;
	status?: MovieStatus;
	releaseDate?: {
		from?: Date;
		to?: Date;
	};
	duration?: {
		min?: number;
		max?: number;
	};
	format2D?: boolean;
	format3D?: boolean;
	formatIMAX?: boolean;
	sortBy?: 'title' | 'releaseDate' | 'rating' | 'popularity';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	limit?: number;
}

// Movie List Response DTO
export interface MovieListResponse {
	movies: IMovie[];
	totalCount: number;
	page: number;
	limit: number;
	totalPages: number;
}
