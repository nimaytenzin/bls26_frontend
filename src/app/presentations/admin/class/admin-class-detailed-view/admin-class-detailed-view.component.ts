import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { PanelModule } from 'primeng/panel';
import { Student } from '../../students/student.dto';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

interface Facilitator {
    id: number;
    name: string;
    email: string;
    phone: string;
}

@Component({
    selector: 'app-admin-class-detailed-view',
    templateUrl: './admin-class-detailed-view.component.html',
    styleUrls: ['./admin-class-detailed-view.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        TabViewModule,
        AccordionModule,
        TableModule,
        PanelModule,
        AvatarModule,
        ButtonModule,
    ],
})
export class AdminClassDetailedViewComponent implements OnInit {
    classDetails = {
        id: 1,
        name: 'Class A',
        startTime: '09:30 AM',
        endTime: '4:00 PM',
        ageGroup: '3 - 5 years',
        description: 'Basic early learning activities for kids',
    };

    facilitators: Facilitator[] = [
        {
            id: 1,
            name: 'Choki Lhamo',
            email: 'chokilhamo@gmail.com',
            phone: '17263764',
        },
    ];

    students = [
        {
            id: 1,
            name: 'Sonam Dechen Tshogyal',
            profile: 'assets/images/tshotsho.jpeg',
            age: 4,
            preferredName: 'Tsho Tsho',
            status: 'Checked-in',
        },
        {
            id: 1,
            name: 'Yeshi Choden',
            profile: 'assets/images/yeshi.png',
            age: 4,
            preferredName: 'Daza',
            status: 'Checked-in',
        },
    ];

    constructor() {}

    ngOnInit(): void {}
}
