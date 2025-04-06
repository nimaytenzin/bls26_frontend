import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
// class.model.ts
export interface Classroom {
    id: number;
    name: string;
    ageGroup: string;
    capacity: number;
    currentEnrollment: number;
    facilitators: Facilitator[];
    schedule: ClassSchedule;
}

export interface Facilitator {
    id: number;
    name: string;
    photo?: string;
    specialization: string;
    contact: string;
}

export interface ClassSchedule {
    days: string[];
    startTime: string;
    endTime: string;
}

export const AGE_GROUPS = [
    { label: 'Toddlers (1-2 years)', value: '1-2' },
    { label: 'Pre-Nursery (2-3 years)', value: '2-3' },
    { label: 'Nursery (3-4 years)', value: '3-4' },
    { label: 'Kindergarten (4-6 years)', value: '4-6' },
];

@Component({
    selector: 'app-admin-master-class',
    templateUrl: './admin-master-class.component.html',
    styleUrls: ['./admin-master-class.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ToastModule,
        ButtonModule,
        FormsModule,

        DropdownModule,
    ],
    providers: [DialogService],
})
export class AdminMasterClassComponent implements OnInit {
    classes: Classroom[] = [];
    ageGroups = AGE_GROUPS;
    selectedAgeGroup: any;
    ref: DynamicDialogRef | undefined;

    constructor(
        private dialogService: DialogService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadSampleData();
    }

    loadSampleData(): void {
        this.classes = [
            {
                id: 1,
                name: 'Butterflies',
                ageGroup: '2-3',
                capacity: 15,
                currentEnrollment: 12,
                facilitators: [
                    {
                        id: 1,
                        name: 'Pema Dorji',
                        photo: 'assets/facilitators/pema.jpg',
                        specialization: 'Early Childhood Development',
                        contact: 'pema@littlefeets.bt',
                    },
                    {
                        id: 2,
                        name: 'Sonam Yangchen',
                        specialization: 'Creative Arts',
                        contact: 'sonam@littlefeets.bt',
                    },
                ],
                schedule: {
                    days: ['Mon', 'Wed', 'Fri'],
                    startTime: '08:30',
                    endTime: '11:30',
                },
            },
            {
                id: 2,
                name: 'Dragon Cubs',
                ageGroup: '3-4',
                capacity: 18,
                currentEnrollment: 15,
                facilitators: [
                    {
                        id: 3,
                        name: 'Karma Wangchuk',
                        photo: 'assets/facilitators/karma.jpg',
                        specialization: 'Montessori Education',
                        contact: 'karma@littlefeets.bt',
                    },
                ],
                schedule: {
                    days: ['Tue', 'Thu'],
                    startTime: '09:00',
                    endTime: '12:00',
                },
            },
            {
                id: 3,
                name: 'Little Tigers',
                ageGroup: '4-6',
                capacity: 20,
                currentEnrollment: 18,
                facilitators: [
                    {
                        id: 4,
                        name: 'Dechen Zangmo',
                        photo: 'assets/facilitators/dechen.jpg',
                        specialization: 'Language Development',
                        contact: 'dechen@littlefeets.bt',
                    },
                    {
                        id: 5,
                        name: 'Tashi Namgay',
                        specialization: 'Physical Education',
                        contact: 'tashi@littlefeets.bt',
                    },
                ],
                schedule: {
                    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    startTime: '08:00',
                    endTime: '13:00',
                },
            },
        ];
    }

    openNewClassDialog(): void {
        // this.ref = this.dialogService.open(ClassFormComponent, {
        //     header: 'Create New Class',
        //     width: '60%',
        //     contentStyle: { 'max-height': '90vh', overflow: 'auto' },
        // });
        // this.ref.onClose.subscribe((newClass: Classroom) => {
        //     if (newClass) {
        //         this.classes.push(newClass);
        //         this.messageService.add({
        //             severity: 'success',
        //             summary: 'Success',
        //             detail: 'Class created successfully',
        //         });
        //     }
        // });
    }

    editClass(cls: Classroom): void {
        // this.ref = this.dialogService.open(ClassFormComponent, {
        //     header: 'Edit Class',
        //     width: '60%',
        //     data: { class: cls },
        //     contentStyle: { 'max-height': '90vh', overflow: 'auto' },
        // });
        // this.ref.onClose.subscribe((updatedClass: Classroom) => {
        //     if (updatedClass) {
        //         const index = this.classes.findIndex(
        //             (c) => c.id === updatedClass.id
        //         );
        //         if (index !== -1) {
        //             this.classes[index] = updatedClass;
        //         }
        //         this.messageService.add({
        //             severity: 'success',
        //             summary: 'Success',
        //             detail: 'Class updated successfully',
        //         });
        //     }
        // });
    }

    deleteClass(id: number): void {
        this.classes = this.classes.filter((c) => c.id !== id);
        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Class deleted successfully',
        });
    }

    getEnrollmentPercentage(cls: Classroom): number {
        return Math.round((cls.currentEnrollment / cls.capacity) * 100);
    }

    getDaysString(schedule: ClassSchedule): string {
        return schedule.days.join(', ');
    }

    getAgeGroupLabel() {
        return 'hi';
    }
    ngOnDestroy(): void {
        if (this.ref) {
            this.ref.close();
        }
    }
}
