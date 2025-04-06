// admin-master-students.component.ts
import { Component, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ChipsModule } from 'primeng/chips';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { FileUploadModule } from 'primeng/fileupload';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
interface Child {
    id: number;
    studentCode: string;
    fullName: string;
    preferredName: string;
    dob: Date;
    cid: string;
    image?: string;
    classroom: string;
    attendance: number;
    mood: string;
    parent: {
        name: string;
        contact: string;
    };
    childNote: {
        medicalConditions: string[];
        specialInstructions: string;
        notes: string;
    };
}

interface FacilityDTO {
    id: number;
    name: string;
    location: string;
}

interface Classroom {
    name: string;
    studentCount: number;
    attendance: number;
}

@Component({
    selector: 'app-admin-master-students',
    templateUrl: './admin-master-students.component.html',
    styleUrls: ['./admin-master-students.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        DialogModule,
        FormsModule,
        CalendarModule,
        InputTextModule,
        InputNumberModule,
        ChipsModule,
        FileUploadModule,
        InputTextareaModule,
        DropdownModule,
        ProgressBarModule,
        TagModule,
        TooltipModule,
        ChartModule,
    ],
})
export class AdminMasterStudentsComponent implements OnInit {
    // Stats
    totalStudents: number = 0;
    attendanceToday: number = 0;
    activeClassrooms: number = 0;
    newEnrollments: number = 0;

    // Data
    students: Child[] = [];
    facilities: FacilityDTO[] = [];
    classrooms: Classroom[] = [];
    selectedFacility: FacilityDTO | null = null;

    // Dialogs
    showDialog = false;
    showViewDialog = false;
    editMode = false;
    currentStudent: Child = this.emptyStudent();
    selectedStudent: Child | null = null;

    attendanceData: any;
    moodData: any;
    bmiData: any;
    chartOptions: any;

    // Bhutanese names for dummy data
    bhutaneseNames = [
        { full: 'Tashi Dorji', preferred: 'Tashi' },
        { full: 'Pema Wangmo', preferred: 'Pema' },
        { full: 'Kinzang Choden', preferred: 'Kinzang' },
        { full: 'Dorji Penjor', preferred: 'Dorji' },
        { full: 'Sonam Lhamo', preferred: 'Sonam' },
        { full: 'Jigme Namgyel', preferred: 'Jigme' },
        { full: 'Dechen Zangmo', preferred: 'Dechen' },
        { full: 'Karma Yeshi', preferred: 'Karma' },
        { full: 'Lhamo Yangchen', preferred: 'Lhamo' },
        { full: 'Nima Wangchuk', preferred: 'Nima' },
    ];

    sonamPhotos = [
        'assets/students/sonam1.jpg',
        'assets/students/sonam2.jpg',
        'assets/students/sonam3.jpg',
        'assets/students/sonam4.jpg',
    ];

    constructor(private primengConfig: PrimeNGConfig, private router: Router) {}

    ngOnInit() {
        this.primengConfig.ripple = true;
        this.loadDummyData();
    }

    initCharts() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue(
            '--text-color-secondary'
        );
        const surfaceBorder =
            documentStyle.getPropertyValue('--surface-border');

        // Attendance Chart
        this.attendanceData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            datasets: [
                {
                    label: 'Average Attendance',
                    data: [85, 90, 88, 92, 87],
                    fill: false,
                    borderColor:
                        documentStyle.getPropertyValue('--primary-500'),
                    tension: 0.4,
                },
            ],
        };

        // Mood Chart
        this.moodData = {
            labels: ['Happy', 'Neutral', 'Sad'],
            datasets: [
                {
                    data: [15, 8, 2],
                    backgroundColor: [
                        documentStyle.getPropertyValue('--green-500'),
                        documentStyle.getPropertyValue('--yellow-500'),
                        documentStyle.getPropertyValue('--red-500'),
                    ],
                    hoverBackgroundColor: [
                        documentStyle.getPropertyValue('--green-400'),
                        documentStyle.getPropertyValue('--yellow-400'),
                        documentStyle.getPropertyValue('--red-400'),
                    ],
                },
            ],
        };

        // BMI Chart
        this.bmiData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [
                {
                    label: 'Average BMI',
                    data: [15.2, 15.4, 15.5, 15.6, 15.8],
                    fill: false,
                    borderColor: documentStyle.getPropertyValue('--blue-500'),
                    tension: 0.4,
                },
            ],
        };

        this.chartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                    },
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary,
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false,
                    },
                },
                y: {
                    ticks: {
                        color: textColorSecondary,
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false,
                    },
                },
            },
        };
    }

    loadDummyData() {
        // Facilities
        this.facilities = [
            { id: 1, name: 'Little Dragon ECCD', location: 'Thimphu' },
            { id: 2, name: 'Rainbow Kids Academy', location: 'Paro' },
            { id: 3, name: 'Happiness Child Care', location: 'Punakha' },
        ];

        // Classrooms
        this.classrooms = [
            {
                name: 'Tiger Cubs (3-4 years)',
                studentCount: 12,
                attendance: 92,
            },
            {
                name: 'Little Pandas (4-5 years)',
                studentCount: 15,
                attendance: 87,
            },
            {
                name: 'Dragon Kids (5-6 years)',
                studentCount: 10,
                attendance: 95,
            },
        ];

        // Generate dummy students
        this.students = Array.from({ length: 25 }, (_, i) => {
            const name = this.bhutaneseNames[i % this.bhutaneseNames.length];
            return {
                id: i + 1,
                studentCode: `STU-${1000 + i}`,
                fullName: name.full,
                preferredName: name.preferred,
                dob: new Date(2018 + Math.floor(Math.random() * 3)),
                cid: `CID${Math.floor(100000 + Math.random() * 900000)}`,
                image: i % 3 === 0 ? 'assets/images/tshotsho.jpeg' : undefined,
                classroom:
                    this.classrooms[
                        Math.floor(Math.random() * this.classrooms.length)
                    ].name,
                attendance: Math.floor(70 + Math.random() * 30),
                mood: ['happy', 'neutral', 'sad'][
                    Math.floor(Math.random() * 3)
                ],
                parent: {
                    name: `${
                        ['Dorji', 'Pema', 'Sonam'][
                            Math.floor(Math.random() * 3)
                        ]
                    } ${name.full.split(' ')[1]}`,
                    contact: `17${Math.floor(100000 + Math.random() * 900000)}`,
                },
                childNote: {
                    medicalConditions: Math.random() > 0.7 ? ['Asthma'] : [],
                    specialInstructions:
                        Math.random() > 0.7
                            ? 'Needs special attention during outdoor activities'
                            : '',
                    notes:
                        Math.random() > 0.5
                            ? 'Excellent participation in group activities'
                            : '',
                },
            };
        });

        // Update stats
        this.totalStudents = this.students.length;
        this.attendanceToday = Math.round(
            this.students.reduce((sum, s) => sum + s.attendance, 0) /
                this.students.length
        );
        this.activeClassrooms = this.classrooms.length;
        this.newEnrollments = Math.floor(Math.random() * 5);
    }

    getAttendanceSeverity(attendance: number): string {
        if (attendance >= 90) return 'success';
        if (attendance >= 75) return 'info';
        if (attendance >= 50) return 'warning';
        return 'danger';
    }

    viewFacility(facility: FacilityDTO) {
        this.selectedFacility = facility;
        // Filter students by facility in a real app
    }

    openAdmitChildren() {
        this.router.navigateByUrl('admin/enroll');
    }

    viewStudent(student: Child) {
        this.router.navigateByUrl('admin/student/detailed');
    }

    openDialog(student?: Child) {
        this.editMode = !!student;
        this.currentStudent = student ? { ...student } : this.emptyStudent();
        this.showDialog = true;
    }

    private emptyStudent(): Child {
        return {
            id: 0,
            studentCode: '',
            fullName: '',
            preferredName: '',
            dob: new Date(),
            cid: '',
            classroom: '',
            attendance: 100,
            mood: 'neutral',
            parent: {
                name: '',
                contact: '',
            },
            childNote: {
                medicalConditions: [],
                specialInstructions: '',
                notes: '',
            },
        };
    }

    saveStudent() {
        // Save logic here
        this.showDialog = false;
    }

    deleteStudent(id: number) {
        // Delete logic here
    }

    getAttendanceStatus(attendance: number): string {
        if (attendance >= 90) return 'Present';
        if (attendance >= 75) return 'Late';
        if (attendance >= 50) return 'Half-day';
        return 'Absent';
    }

    getMoodIcon(mood: string): string {
        switch (mood) {
            case 'happy':
                return 'pi pi-smile';
            case 'neutral':
                return 'pi pi-meh';
            case 'sad':
                return 'pi pi-frown';
            default:
                return 'pi pi-question-circle';
        }
    }

    getMoodColor(mood: string): string {
        switch (mood) {
            case 'happy':
                return '#22C55E'; // green
            case 'neutral':
                return '#F59E0B'; // amber
            case 'sad':
                return '#EF4444'; // red
            default:
                return '#64748B'; // slate
        }
    }
}
