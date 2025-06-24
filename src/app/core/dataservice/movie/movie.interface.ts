import { User } from '../auth/auth.interface';
import { Genre } from '../genre/genre.interface';
import { Language } from '../language/language.interface';

export interface CreateMovieDto {
	name: string;
	description?: string;
	casts: string;
	pgRating?: string;
	durationMin?: number;
	releaseDate: string;
	trailerURL?: string;
	productionHouse?: string;
	producerId: number;

	screeningStatus?: ScreeningStatusEnum;
	genreIds?: number[];
	languageIds?: number[];
	subtitleLanguageIds?: number[];
}

export interface UpdateMovieDto {
	name?: string;
	description?: string;
	pgRating?: string;
	durationMin?: number;
	releaseDate?: string;
	trailerURL?: string;
	producerId?: number;
	productionHouse?: string;
	screeningStatus?: ScreeningStatusEnum;
	genreIds?: number[];
	languageIds?: number[];
	subtitleLanguageIds?: number[];
}

export interface Movie {
	id: number;
	name: string;
	description?: string;
	casts: string;
	pgRating?: string;
	durationMin?: number;
	releaseDate?: Date;
	trailerURL?: string;
	productionHouse?: string;
	producerId: number;
	screeningStatus: ScreeningStatusEnum;
	media: MovieMedia[];
	languages?: Language[];
	subtitleLanguages?: Language[];
	genres?: Genre[];
	createdAt?: Date;
	updatedAt?: Date;
	producer?: User;
}

export interface MovieMedia {
	id: number;
	movieId: number;
	name: string;
	type: string;
	uri: string;
	orientation: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface MovieMediaUploadResponse {
	id: number;
	movieId: number;
	name: string;
	uri: string;
	orientation: 'LANDSCAPE' | 'PORTRAIT';
	type: 'IMAGE' | 'VIDEO';
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateMovieMediaDto {
	name: string;
	orientation: 'LANDSCAPE' | 'PORTRAIT';
	movieId: number;
	type: 'IMAGE' | 'VIDEO';
}

export enum ScreeningStatusEnum {
	UPCOMING = 'upcoming',
	NOW_SHOWING = 'now_showing',
	ENDED = 'ended',
	CANCELLED = 'cancelled',
}

export interface ApiResponse<T> {
	statusCode: number;
	message: string;
	data: T;
}
