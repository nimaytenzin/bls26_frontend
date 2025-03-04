import { ThromdeDTO } from './thromde.dto';

export interface LocalityDTO {
    id: number;
    name: string;
    nameDzo: string;
    thromdeId: number;
    thromde?: ThromdeDTO;
}

export interface CreateLocalityDTO {
    name: string;
    nameDzo: string;
    thromdeId: number;
}

export interface UpdateLocalityDTO {
    name?: string;
    nameDzo?: string;
    thromdeId?: number;
}
