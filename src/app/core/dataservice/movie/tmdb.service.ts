import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// TMDB API Interfaces
export interface TMDBMovie {
	id: number;
	title: string;
	original_title: string;
	overview: string;
	poster_path: string;
	backdrop_path: string;
	release_date: string;
	genre_ids: number[];
	adult: boolean;
	original_language: string;
	popularity: number;
	vote_average: number;
	vote_count: number;
	video: boolean;
}

export interface TMDBMovieDetails extends TMDBMovie {
	runtime: number;
	genres: { id: number; name: string }[];
	production_companies: { id: number; name: string; logo_path: string }[];
	production_countries: { iso_3166_1: string; name: string }[];
	spoken_languages: { english_name: string; iso_639_1: string; name: string }[];
	status: string;
	tagline: string;
	budget: number;
	revenue: number;
	homepage: string;
	imdb_id: string;
}

export interface TMDBCredits {
	cast: {
		id: number;
		name: string;
		character: string;
		profile_path: string;
		order: number;
	}[];
	crew: {
		id: number;
		name: string;
		job: string;
		department: string;
		profile_path: string;
	}[];
}

export interface TMDBVideos {
	results: {
		id: string;
		key: string;
		name: string;
		site: string;
		type: string;
		official: boolean;
		size: number;
	}[];
}

export interface TMDBResponse<T> {
	page: number;
	results: T[];
	total_pages: number;
	total_results: number;
}

@Injectable({
	providedIn: 'root',
})
export class TmdbService {
	private readonly apiKey = 'YOUR_TMDB_API_KEY'; // You'll need to get this from https://www.themoviedb.org/settings/api
	private readonly baseUrl = 'https://api.themoviedb.org/3';
	private readonly imageBaseUrl = 'https://image.tmdb.org/t/p';

	// Fallback data if API key is not configured
	private readonly fallbackMovies: TMDBMovie[] = [
		{
			id: 155,
			title: 'The Dark Knight',
			original_title: 'The Dark Knight',
			overview:
				'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.',
			poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
			backdrop_path: '/hqkIcbrOHL86UncnHIsHVcVmzue.jpg',
			release_date: '2008-07-18',
			genre_ids: [28, 80, 18],
			adult: false,
			original_language: 'en',
			popularity: 123.456,
			vote_average: 9.0,
			vote_count: 32000,
			video: false,
		},
		{
			id: 27205,
			title: 'Inception',
			original_title: 'Inception',
			overview:
				'Cobb, a skilled thief who steals corporate secrets through the use of dream-sharing technology, is given the inverse task of planting an idea into the mind of a C.E.O.',
			poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
			backdrop_path: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
			release_date: '2010-07-16',
			genre_ids: [28, 878, 53],
			adult: false,
			original_language: 'en',
			popularity: 89.123,
			vote_average: 8.8,
			vote_count: 35000,
			video: false,
		},
		{
			id: 693134,
			title: 'Dune: Part Two',
			original_title: 'Dune: Part Two',
			overview:
				'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.',
			poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
			backdrop_path: '/xtUxpFx8B0yhJu9U0gFl3vBXKFh.jpg',
			release_date: '2024-02-27',
			genre_ids: [878, 12],
			adult: false,
			original_language: 'en',
			popularity: 156.789,
			vote_average: 8.5,
			vote_count: 8500,
			video: false,
		},
		{
			id: 634649,
			title: 'Spider-Man: No Way Home',
			original_title: 'Spider-Man: No Way Home',
			overview:
				'Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero.',
			poster_path: '/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
			backdrop_path: '/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg',
			release_date: '2021-12-15',
			genre_ids: [28, 12, 878],
			adult: false,
			original_language: 'en',
			popularity: 200.456,
			vote_average: 8.2,
			vote_count: 20000,
			video: false,
		},
		{
			id: 438631,
			title: 'Dune',
			original_title: 'Dune',
			overview:
				'Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe.',
			poster_path: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
			backdrop_path: '/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg',
			release_date: '2021-09-15',
			genre_ids: [878, 12],
			adult: false,
			original_language: 'en',
			popularity: 134.567,
			vote_average: 7.8,
			vote_count: 12000,
			video: false,
		},
		{
			id: 624860,
			title: 'The Matrix Resurrections',
			original_title: 'The Matrix Resurrections',
			overview:
				"Plagued by strange memories, Neo's life takes an unexpected turn when he finds himself back inside the Matrix.",
			poster_path: '/8c4a8kE7PizaGQQnditMmI1xbRp.jpg',
			backdrop_path: '/hv7o3VgfsairBoQFAawgaQ4cR1m.jpg',
			release_date: '2021-12-16',
			genre_ids: [28, 878],
			adult: false,
			original_language: 'en',
			popularity: 67.89,
			vote_average: 6.7,
			vote_count: 8900,
			video: false,
		},
	];

	constructor(private http: HttpClient) {}

	/**
	 * Get poster URL for display
	 */
	getPosterUrl(
		posterPath: string,
		size: 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
	): string {
		if (!posterPath) return '/assets/images/default-movie-poster.jpg';
		return `${this.imageBaseUrl}/${size}${posterPath}`;
	}

	/**
	 * Get backdrop URL for display
	 */
	getBackdropUrl(
		backdropPath: string,
		size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'
	): string {
		if (!backdropPath) return '/assets/images/default-movie-backdrop.jpg';
		return `${this.imageBaseUrl}/${size}${backdropPath}`;
	}

	/**
	 * Get profile image URL
	 */
	getProfileUrl(
		profilePath: string,
		size: 'w45' | 'w185' | 'h632' | 'original' = 'w185'
	): string {
		if (!profilePath) return '/assets/images/default-avatar.jpg';
		return `${this.imageBaseUrl}/${size}${profilePath}`;
	}

	/**
	 * Get popular movies
	 */
	getPopularMovies(page: number = 1): Observable<TMDBResponse<TMDBMovie>> {
		if (!this.isApiKeyConfigured()) {
			return this.getFallbackMovies();
		}

		return this.http
			.get<TMDBResponse<TMDBMovie>>(
				`${this.baseUrl}/movie/popular?api_key=${this.apiKey}&page=${page}`
			)
			.pipe(catchError(() => this.getFallbackMovies()));
	}

	/**
	 * Get now playing movies
	 */
	getNowPlayingMovies(page: number = 1): Observable<TMDBResponse<TMDBMovie>> {
		if (!this.isApiKeyConfigured()) {
			return this.getFallbackMovies();
		}

		return this.http
			.get<TMDBResponse<TMDBMovie>>(
				`${this.baseUrl}/movie/now_playing?api_key=${this.apiKey}&page=${page}`
			)
			.pipe(catchError(() => this.getFallbackMovies()));
	}

	/**
	 * Get upcoming movies
	 */
	getUpcomingMovies(page: number = 1): Observable<TMDBResponse<TMDBMovie>> {
		if (!this.isApiKeyConfigured()) {
			return this.getFallbackMovies();
		}

		return this.http
			.get<TMDBResponse<TMDBMovie>>(
				`${this.baseUrl}/movie/upcoming?api_key=${this.apiKey}&page=${page}`
			)
			.pipe(catchError(() => this.getFallbackMovies()));
	}

	/**
	 * Get top rated movies
	 */
	getTopRatedMovies(page: number = 1): Observable<TMDBResponse<TMDBMovie>> {
		if (!this.isApiKeyConfigured()) {
			return this.getFallbackMovies();
		}

		return this.http
			.get<TMDBResponse<TMDBMovie>>(
				`${this.baseUrl}/movie/top_rated?api_key=${this.apiKey}&page=${page}`
			)
			.pipe(catchError(() => this.getFallbackMovies()));
	}

	/**
	 * Search movies
	 */
	searchMovies(
		query: string,
		page: number = 1
	): Observable<TMDBResponse<TMDBMovie>> {
		if (!this.isApiKeyConfigured()) {
			return this.getFallbackMovies();
		}

		return this.http
			.get<TMDBResponse<TMDBMovie>>(
				`${this.baseUrl}/search/movie?api_key=${
					this.apiKey
				}&query=${encodeURIComponent(query)}&page=${page}`
			)
			.pipe(catchError(() => this.getFallbackMovies()));
	}

	/**
	 * Get movie details
	 */
	getMovieDetails(movieId: number): Observable<TMDBMovieDetails> {
		if (!this.isApiKeyConfigured()) {
			return of(this.getFallbackMovieDetails(movieId));
		}

		return this.http
			.get<TMDBMovieDetails>(
				`${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}`
			)
			.pipe(catchError(() => of(this.getFallbackMovieDetails(movieId))));
	}

	/**
	 * Get movie credits (cast and crew)
	 */
	getMovieCredits(movieId: number): Observable<TMDBCredits> {
		if (!this.isApiKeyConfigured()) {
			return of(this.getFallbackCredits());
		}

		return this.http
			.get<TMDBCredits>(
				`${this.baseUrl}/movie/${movieId}/credits?api_key=${this.apiKey}`
			)
			.pipe(catchError(() => of(this.getFallbackCredits())));
	}

	/**
	 * Get movie videos (trailers, teasers, etc.)
	 */
	getMovieVideos(movieId: number): Observable<TMDBVideos> {
		if (!this.isApiKeyConfigured()) {
			return of({ results: [] });
		}

		return this.http
			.get<TMDBVideos>(
				`${this.baseUrl}/movie/${movieId}/videos?api_key=${this.apiKey}`
			)
			.pipe(catchError(() => of({ results: [] })));
	}

	/**
	 * Get comprehensive movie data (details + credits + videos)
	 */
	getComprehensiveMovieData(movieId: number): Observable<{
		details: TMDBMovieDetails;
		credits: TMDBCredits;
		videos: TMDBVideos;
	}> {
		return forkJoin({
			details: this.getMovieDetails(movieId),
			credits: this.getMovieCredits(movieId),
			videos: this.getMovieVideos(movieId),
		});
	}

	/**
	 * Get multiple movie categories for dashboard
	 */
	getAllMovieCategories(): Observable<{
		popular: TMDBMovie[];
		nowPlaying: TMDBMovie[];
		upcoming: TMDBMovie[];
		topRated: TMDBMovie[];
	}> {
		return forkJoin({
			popular: this.getPopularMovies().pipe(
				map((response) => response.results.slice(0, 10))
			),
			nowPlaying: this.getNowPlayingMovies().pipe(
				map((response) => response.results.slice(0, 10))
			),
			upcoming: this.getUpcomingMovies().pipe(
				map((response) => response.results.slice(0, 10))
			),
			topRated: this.getTopRatedMovies().pipe(
				map((response) => response.results.slice(0, 10))
			),
		});
	}

	/**
	 * Check if API key is configured
	 */
	private isApiKeyConfigured(): boolean {
		return this.apiKey && this.apiKey !== 'YOUR_TMDB_API_KEY';
	}

	/**
	 * Get fallback movies when API is not available
	 */
	private getFallbackMovies(): Observable<TMDBResponse<TMDBMovie>> {
		return of({
			page: 1,
			results: this.fallbackMovies,
			total_pages: 1,
			total_results: this.fallbackMovies.length,
		});
	}

	/**
	 * Get fallback movie details
	 */
	private getFallbackMovieDetails(movieId: number): TMDBMovieDetails {
		const movie =
			this.fallbackMovies.find((m) => m.id === movieId) ||
			this.fallbackMovies[0];
		return {
			...movie,
			runtime: 152,
			genres: [
				{ id: 28, name: 'Action' },
				{ id: 80, name: 'Crime' },
				{ id: 18, name: 'Drama' },
			],
			production_companies: [
				{ id: 1, name: 'Warner Bros. Pictures', logo_path: '/logo.png' },
			],
			production_countries: [
				{ iso_3166_1: 'US', name: 'United States of America' },
			],
			spoken_languages: [
				{ english_name: 'English', iso_639_1: 'en', name: 'English' },
			],
			status: 'Released',
			tagline: 'Why So Serious?',
			budget: 185000000,
			revenue: 1004558444,
			homepage: '',
			imdb_id: 'tt0468569',
		};
	}

	/**
	 * Get fallback credits
	 */
	private getFallbackCredits(): TMDBCredits {
		return {
			cast: [
				{
					id: 1,
					name: 'Christian Bale',
					character: 'Bruce Wayne / Batman',
					profile_path: '/profile1.jpg',
					order: 0,
				},
				{
					id: 2,
					name: 'Heath Ledger',
					character: 'The Joker',
					profile_path: '/profile2.jpg',
					order: 1,
				},
				{
					id: 3,
					name: 'Aaron Eckhart',
					character: 'Harvey Dent',
					profile_path: '/profile3.jpg',
					order: 2,
				},
			],
			crew: [
				{
					id: 1,
					name: 'Christopher Nolan',
					job: 'Director',
					department: 'Directing',
					profile_path: '/profile4.jpg',
				},
				{
					id: 2,
					name: 'Jonathan Nolan',
					job: 'Writer',
					department: 'Writing',
					profile_path: '/profile5.jpg',
				},
			],
		};
	}
}
