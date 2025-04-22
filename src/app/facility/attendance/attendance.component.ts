import { Component, OnInit } from '@angular/core';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { Attendance, AttendanceService } from '../../core/services/attendance.service';
import { FacilityService } from '../../core/services/facility.service';

@Component({
  selector: 'app-attendance',
	standalone: false,
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit {
  attendanceRecords: {
    id: number;
    name: string;
		avatarUrl: string;
    present: boolean;
    note: string;
  }[] = [];
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedSession: string = 'morning';
  selectedGroup: 'children' | 'facilitators' = 'children';
  facilityId: string = '';

  constructor(
    private attendanceService: AttendanceService,
    private facilityService: FacilityService
  ) {}

  ngOnInit(): void {
    this.facilityService.selectedFacilityId$
      .pipe(
        filter((id): id is string => id !== null),
        distinctUntilChanged()
      )
      .subscribe(id => {
        this.facilityId = id;
        this.loadAttendanceTargets();
      });

    const initialId = this.facilityService.getFacilityId();
    if (initialId !== null) {
      this.facilityId = initialId;
      this.loadAttendanceTargets();
    }
  }

  loadAttendanceTargets(): void {
    const loader = this.selectedGroup === 'children'
      ? this.attendanceService.getChildrenByFacility(this.facilityId)
      : this.attendanceService.getFacilitatorsByFacility(this.facilityId);

    loader.subscribe({
      next: data => {
        this.attendanceRecords = data.map(person => ({
          id: person.id,
          name: person.name,
          avatarUrl: person.avatarUrl || '',
          present: false,
          note: ''
        }));
      },
      error: err => console.error('Failed to load attendance targets', err)
    });
  }

  toggleStatus(record: any): void {
    record.present = !record.present;
  }

  saveAttendance(): void {
    const today = this.selectedDate;

    const recordsToSave = this.attendanceRecords.map(rec => ({
      childId: rec.id, // Change targetId to childId
      group: this.selectedGroup,
      facilityId: this.facilityId,
      date: today,
      session: this.selectedSession,
      status: rec.present ? 'Present' : 'Absent' as 'Present' | 'Absent', // Explicitly cast the status
      note: rec.note
    }));

    this.attendanceService.saveBulkAttendance(recordsToSave).subscribe({
      next: () => alert('Attendance saved successfully'),
      error: err => console.error('Save failed', err)
    });
  }
}
