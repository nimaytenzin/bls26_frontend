import { Dzongkhag } from '../dzonkhag/dzongkhag.interface';
import { Hall } from '../hall/hall.interface';

// Theatre interfaces
export interface Theatre {
	id: string;
	name: string;

	address: string;

	googleMapAddressUrl: string;
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
	address: string;
	googleMapAddressUrl: string;
	dzongkhagId: string;
}

export interface CreateTheatreWithImageDto {
	name: string;
	address: string;
	googleMapAddressUrl: string;
	dzongkhagId: string;
}

export interface UpdateTheatreDto {
	name?: string;
	googleMapAddressUrl?: string;
	address?: string;
	dzongkhagId?: string;
}

export interface ApiResponse<T> {
	statusCode: number;
	message: string;
	data: T;
}
