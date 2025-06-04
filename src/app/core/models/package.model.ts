export interface Package {
  id?: number;                      // Optional for creation
  facilityId: number;
  name: string;
  description: string;
  price: number;
  ownerId: number;
}

export interface PackageForm {
  packageId: number;
  startDate: Date;
  endDate: Date;
}

