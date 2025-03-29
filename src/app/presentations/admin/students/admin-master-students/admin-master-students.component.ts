// admin-master-students.component.ts
import { Component, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { Child } from '../child.dto';
import { StudentService } from '../student.service';
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
import { Router } from '@angular/router';
import { FacilityDataService } from 'src/app/services/facility-data.service';
import { FacilityDTO } from 'src/app/core/dto/properties/building.dto';

@Component({
    selector: 'app-admin-master-students',
    templateUrl: './admin-master-students.component.html',
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
    ],
})
export class AdminMasterStudentsComponent implements OnInit {
    students: Child[] = [];
    showDialog = false;
    showViewDialog = false;
    editMode = false;
    currentStudent: Child = this.emptyStudent();
    selectedStudent: Child | null = null;
    facilities: FacilityDTO[] = [];
    selectedFacility: FacilityDTO;

    constructor(
        private studentService: StudentService,
        private facilityService: FacilityDataService,
        private primengConfig: PrimeNGConfig,
        private router: Router
    ) { }

    ngOnInit() {
        this.primengConfig.ripple = true;
        this.loadFacility();
    }

    viewFacility(facility: FacilityDTO) {
        this.selectedFacility = facility;
        this.loadStudents(facility.id);

    }

    async loadFacility() {
        this.facilityService.getFacilityByOwnerId(Number(localStorage.getItem('userId'))).subscribe((res) => {
            if (res) {
                this.facilities = res
            } else {
                console.error('Facility not found');
            }
        })
    }

    private emptyStudent(): Child {
        return {
            id: 0,
            studentCode: '',
            name: '',
            preferredName: '',
            dob: undefined,
            cid: '',
            registartion: {
                start_date:'',
                end_date:'',
                status: ''
            },
            parent: {
                name:''
            },
            childNote: {
                medicalConditions: [],
                specialInstructions: '',
                notes: ''
            }
        };
    }

    async loadStudents(facilityId: number) {
        this.studentService.getChildByFacility(facilityId).subscribe((res) => {
            if (res) {
                this.students = res;
            } else {
                console.error('Students not found');
            }
        });
    }

    openDialog(student?: Child) {
        this.editMode = !!student;
        this.currentStudent = student ? { ...student } : this.emptyStudent();
        this.showDialog = true;
    }

    openAdmitChildren() {
        this.router.navigateByUrl('admin/enroll');
    }

    viewStudent(student: Child) {
        this.selectedStudent = student;
        this.showViewDialog = true;
    }

    handleImageUpload(event: any) {
        // const file = event.files[0];
        // const reader = new FileReader();
        // reader.onload = () => {
        //     this.currentStudent.image = reader.result as string;
        // };
        // reader.readAsDataURL(file);
    }

    saveStudent() {
    }

    deleteStudent(id: string) {
    }
}
