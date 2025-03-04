export interface BuildingAmenityDTO {
    id: number;
    name: string;
    buildingId: number;
}
export interface CreateBuildingAmenityDto {
    name: string;
    buildingId: number;
}

export interface UpdateBuildingAmenityDTO {
    name: string;
}
