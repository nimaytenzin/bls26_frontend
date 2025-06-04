export interface EnrollmentDto {
  id?: number;
  childId: number;
  parentIds: number[];
	guardianIds: number [];
  facilityId: number;
  packageId: number;
  start_date: Date;
  end_date: Date;
  status: 'active' | 'inactive' | 'pending' | 'cancelled';
}
