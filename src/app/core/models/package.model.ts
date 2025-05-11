export interface Package {
  id?: number;                      // Optional for creation
  facilityId: string;
  name: string;
  description: string;
  price: number;
  ownerId: number;
}

export interface PackageForm {
  packageId: string;
  startDate: Date;
  endDate: Date;
}

