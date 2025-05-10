export interface Attendance {
  id?: number;
  childId: number;
  facilityId: string;
  date: string;
  session: string;
  status: 'Present' | 'Absent';
  note?: string;
}
