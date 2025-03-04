import { DzongkhagDTO } from './dzongkhag.dto';

export interface ThromdeDTO {
    id: number;
    name: string;
    nameDzo: string;
    dzongkhagId: number;

    dzongkhag?: DzongkhagDTO;
}

export interface CreateThromdeDTO {
    name: string;
    nameDzo: string;
    dzongkhagId: number;
}

export interface UpdateThromdeDTO {
    name?: string;
    nameDzo?: string;
    dzongkhagId?: number;
}
