export interface DzongkhagDTO {
    id: number;
    name: string;
    nameDzo: string;
}

export interface CreateDzongkhagDTO {
    name: string;
    nameDzo: string;
}

export interface UpdateDzongkhagDTO {
    name?: string;
    nameDzo?: string;
}
