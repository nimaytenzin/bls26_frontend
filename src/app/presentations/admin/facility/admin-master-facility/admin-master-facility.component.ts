// admin-master-facility.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';

@Component({
    selector: 'app-admin-master-facility',
    templateUrl: './admin-master-facility.component.html',
    styleUrls: ['./admin-master-facility.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        DialogModule,
        FormsModule,
        CardModule,
        AvatarModule,
        ButtonModule,
    ],
})
export class AdminMasterFacilityComponent implements OnInit {
    facilityName = 'Giggles ECCD';
    facilityDescription = `Giggles ECCD is committed to providing a nurturing environment...`;
    summerTiming = `Drop off – Anytime after 8:30am.<br>
                    Pick up – Anytime before 5:30pm.<br>
                    Summer Break – As per MoESD.`;
    winterTiming = `Drop off – Anytime after 9:30am.<br>
                    Pick up – Anytime before 4:30pm.<br>
                    Winter Break – December.`;
    termsConditions = `We request parents/guardians to familiarize themselves with the center before enrolling...`;

    facilitiesAtCenter = [
        'Facilitator led activities, Child chosen activities, Outdoor activities.',
        'No screen time at the center.',
        'Learning areas include Math, Reading & Literacy, Role-Play, Blocks & Construction, Creative Arts, Games & Puzzle, Science, Sand & Water.',
        'Potty training not mandatory.',
        'Healthy & Nutritious evening snacks will be provided by the center.',
        'ECCD trained facilitators and assistants with adequate teacher to child ratio.',
        'CCTV surveillance throughout the premises.',
    ];

    importantNotes = [
        { text: 'Saturday-Sunday/Government Holidays – OFF.' },
        {
            text: 'Parents/Guardians are requested to familiarize themselves with the center before enrollment.',
        },
        {
            text: 'Enrollment may be terminated by either party if deemed unbefitting.',
        },
        {
            text: 'Any important conditions regarding your child should be informed to the center beforehand.',
        },
    ];

    constructor(private sanitizer: DomSanitizer) {}

    ngOnInit(): void {}

    editField(field: string) {}
}
