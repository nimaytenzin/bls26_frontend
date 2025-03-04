import { Component, Input, OnInit } from '@angular/core';
import { TimelineModule } from 'primeng/timeline';

@Component({
    selector: 'app-admin-lease-timeline',
    templateUrl: './admin-lease-timeline.component.html',
    styleUrls: ['./admin-lease-timeline.component.css'],
    standalone: true,
    imports: [TimelineModule],
})
export class AdminLeaseTimelineComponent implements OnInit {
    @Input() leaseStartDate!: string; // Format: YYYY-MM-DD
    @Input() leaseEndDate!: string; // Format: YYYY-MM-DD

    events: any[] = [];

    ngOnInit(): void {
        this.events = [
            {
                status: 'Lease Start',
                date: this.leaseStartDate,
                icon: 'pi pi-calendar',
                color: '#4CAF50',
            },
            {
                status: 'Lease End',
                date: this.leaseEndDate,
                icon: 'pi pi-calendar-times',
                color: '#FF5252',
            },
        ];
    }
}
