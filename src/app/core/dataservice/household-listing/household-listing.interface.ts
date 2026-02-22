export interface HouseholdListing {
	id: number;
	surveyEnumerationAreaId: number;
	structureNumber: string;
	householdIdentification: string;
	householdSerialNumber: number;
	nameOfHOH?: string;
	totalMale: number;
	totalFemale: number;
	phoneNumber?: string;
	remarks?: string;
	submittedBy?: number;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface CreateHouseholdListingDto {
	surveyEnumerationAreaId: number;
	structureNumber: string;
	householdIdentification: string;
	householdSerialNumber: number;
	nameOfHOH?: string;
	totalMale: number;
	totalFemale: number;
	phoneNumber?: string;
	remarks?: string;
}

export interface UpdateHouseholdListingDto {
	structureNumber?: string;
	householdIdentification?: string;
	householdSerialNumber?: number;
	nameOfHOH?: string;
	totalMale?: number;
	totalFemale?: number;
	phoneNumber?: string;
	remarks?: string;
}

export interface DeleteHouseholdListingResponse {
	deleted: boolean;
	message: string;
}
