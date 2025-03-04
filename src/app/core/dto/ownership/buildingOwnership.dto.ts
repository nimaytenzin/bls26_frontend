import { BUILDINGOWNERSHIPTYPES } from '../../constants/enums';

export interface CreateBuildingOwnershipDto {
    buildingId: number;
    landlordId: number;
    ownershipType: string;
    ownershipPercentage: number;
}
