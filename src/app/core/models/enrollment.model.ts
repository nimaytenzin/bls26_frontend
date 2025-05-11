export interface EnrollmentDto {
  id?: string;
  childId: string;
  parentIds: string[];
	guardianIds: string [];
  facilityId: string;
  packageId: string;
  start_date: Date;
  end_date: Date;
  status: 'active' | 'inactive' | 'pending' | 'cancelled';
}
