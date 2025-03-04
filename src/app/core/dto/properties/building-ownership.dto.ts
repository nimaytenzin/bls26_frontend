export interface BuildingOwnershipDto {
    id: number;
    buildingId: number;
    landLordId: number;
    ownershipType: string;
    ownershipPercentage: number;
}
