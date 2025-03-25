// admin-master-students.component.ts
import { Component, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { Student } from '../student.dto';
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
import { Router } from '@angular/router';

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
    ],
})
export class AdminMasterStudentsComponent implements OnInit {
    students: Student[] = [];
    showDialog = false;
    showViewDialog = false;
    editMode = false;
    currentStudent: Student = this.emptyStudent();
    selectedStudent: Student | null = null;

    constructor(
        private studentService: StudentService,
        private primengConfig: PrimeNGConfig,
        private router: Router
    ) {}

    ngOnInit() {
        this.primengConfig.ripple = true;
        this.loadStudents();
    }

    private emptyStudent(): Student {
        return {
            id: '',
            studentCode: '',
            cid: '',
            fullName: '',
            preferredName: '',
            dob: new Date(),
            parentName: '',
            contactNumber: '',
            alternateContact: '',
            registrationDate: new Date(),
            medicalConditions: [],
            notes: '',
            specialInstructions: '',
        };
    }

    loadStudents() {
        this.students = this.studentService.getAllStudents();
    }

    openDialog(student?: Student) {
        this.editMode = !!student;
        this.currentStudent = student ? { ...student } : this.emptyStudent();
        this.showDialog = true;
    }

    openAdmitChildren() {
        this.router.navigateByUrl('admin/enroll');
    }

    viewStudent(student: Student) {
        this.selectedStudent = student;
        this.showViewDialog = true;
    }

    handleImageUpload(event: any) {
        const file = event.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            this.currentStudent.image = reader.result as string;
        };
        reader.readAsDataURL(file);
    }

    saveStudent() {
        this.studentService.saveStudent(this.currentStudent);
        this.showDialog = false;
        this.loadStudents();
    }

    deleteStudent(id: string) {
        this.studentService.deleteStudent(id);
        this.loadStudents();
    }
}
