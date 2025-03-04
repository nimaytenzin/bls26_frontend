import { FLOORLEVELS } from '../constants/enums';
import { BuildingDTO } from '../dto/properties/building.dto';

export function PARSEBUILDINGFLOORS(building: BuildingDTO): string {
    const basementLabel = building.basementCount
        ? building.basementCount === 1
            ? 'B+'
            : `${building.basementCount}B+`
        : '';
    const stiltLabel = building.stiltCount
        ? building.stiltCount === 1
            ? 'S+'
            : `${building.stiltCount}S+`
        : '';
    const regularFloorLabel =
        building.regularFloorCount > 0
            ? building.regularFloorCount - 1 === 0
                ? `G`
                : `G+${building.regularFloorCount - 1}`
            : 'G';

    const atticLabel = building.atticCount
        ? building.atticCount === 1
            ? 'A'
            : `${building.atticCount}A`
        : '';
    const jamthogLabel = building.jamthogCount
        ? building.jamthogCount === 1
            ? 'J'
            : `${building.jamthogCount}J`
        : '';

    return `${basementLabel}${stiltLabel}${regularFloorLabel}${
        atticLabel ? `+${atticLabel}` : ''
    }${jamthogLabel ? `+${jamthogLabel}` : ''}`;
}

export function PARSEFLOORLEVELS(floorLevel: string) {
    if (!floorLevel) return null;
    switch (floorLevel.toUpperCase()) {
        case '3B':
            return 'Sub Basement 2';
        case '2B':
            return 'Sub Basement';
        case 'B':
            return 'Basemement';
        case 'S':
            return 'STILT';
        case 'G':
            return 'Ground Floor';
        case '1':
            return '1st Floor';
        case 'A':
            return 'Attic';
        case 'J':
            return 'Jamthog';
        default:
            return null; // Or handle invalid input as needed
    }
}

export function PARSEFULLNAME(firstName, middleName, lastName) {
    let fullName = '';

    if (firstName) {
        fullName += firstName + ' ';
    }

    if (middleName) {
        fullName += middleName + ' ';
    }

    if (lastName) {
        fullName += lastName;
    }

    return fullName.trim();
}

export function GETUNITCONFIGSTRING(bedroomCount, toiletCount, balconyCount) {
    const bedroomConfig = `${bedroomCount} BHK`;
    const toiletConfig = `${toiletCount} Bath${toiletCount > 1 ? 's' : ''}`;
    const balconyConfig = `${balconyCount} Balcon${
        balconyCount > 1 ? 'ies' : 'y'
    }`;

    return `${bedroomConfig}, ${toiletConfig}, ${balconyConfig}`;
}
