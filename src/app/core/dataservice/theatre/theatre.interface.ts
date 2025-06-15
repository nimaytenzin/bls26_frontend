import { Dzongkhag } from '../dzonkhag/dzongkhag.interface';
import { Hall } from '../hall/hall.interface';

// Theatre interfaces
export interface Theatre {
	id: string;
	name: string;
	lat: number;
	lng: number;
	address: string;
	status: TheatreStatus;
	imageUrl?: string;
	dzongkhagId: string;
	dzongkhag?: Dzongkhag;
	halls?: Hall[];
	createdAt?: Date;
	updatedAt?: Date;
}

export enum TheatreStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	MAINTENANCE = 'MAINTENANCE',
	RENOVATION = 'RENOVATION',
	TEMPORARILY_CLOSED = 'TEMPORARILY_CLOSED',
}

export interface CreateTheatreDto {
	name: string;
	lat: number;
	lng: number;
	address: string;
	location: string;
	city: string;
	district: string;
	dzongkhagId: string;
}

export interface CreateTheatreWithImageDto {
	name: string;
	lat: number;
	lng: number;
	address: string;
	location: string;
	city: string;
	district: string;
	dzongkhagId: string;
}

export interface UpdateTheatreDto {
	name?: string;
	lat?: number;
	lng?: number;
	address?: string;
	location?: string;
	city?: string;
	district?: string;
	dzongkhagId?: string;
}

export interface ApiResponse<T> {
	statusCode: number;
	message: string;
	data: T;
}
