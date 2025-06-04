export interface Attendance {
  id?: number;
  childId: number;
  facilityId: number;
  date: string;
  session: string;
  status: 'Present' | 'Absent';
  note?: string;
}
