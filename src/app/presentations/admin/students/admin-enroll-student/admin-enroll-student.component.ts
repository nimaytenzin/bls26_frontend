// admin-enroll-student.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';

interface Classroom {
    name: string;
}

interface ParentGuardian {
    name: string;
    contact: string;
    email: string;
    relationship: string;
}

interface EmergencyContact {
    name: string;
    contact: string;
    relationship: string;
}

interface AllergyRecord {
    severity: string;
    remarks: string;
}

interface SpecialNote {
    type: string;
    remarks: string;
}

@Component({
    selector: 'app-admin-enroll-student',
    templateUrl: './admin-enroll-student.component.html',
    styleUrls: ['./admin-enroll-student.component.css'],
    standalone: true,
    imports: [
        InputTextModule,
        FormsModule,
        CalendarModule,
        RadioButtonModule,
        FileUploadModule,
        DividerModule,
        DropdownModule,
        DialogModule,
        CommonModule,
        InputTextareaModule,
        CheckboxModule,
        ButtonModule,
    ],
})
export class AdminEnrollStudentComponent implements OnInit {
    // Personal Information
    firstName = '';
    middleName = '';
    lastName = '';
    preferredName = '';
    dob: Date = new Date();
    gender = 'Male';
    profilePicture = '';
    studentCode = '';

    // Enrollment
    classrooms: Classroom[] = [{ name: 'Class A' }, { name: 'Class B' }];
    selectedClassRoom: Classroom | null = null;
    enrollmentStatus = 'Active';
    enrollmentDate: Date = new Date();
    graduationDate: Date = new Date();
    daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    selectedDays: { [key: string]: boolean } = {};

    // Contacts
    parentsGuardians: ParentGuardian[] = [];
    emergencyContacts: EmergencyContact[] = [];

    // Address
    currentAddress = '';
    permanentAddress = '';

    // Medical
    allergyRecords: AllergyRecord[] = [];

    // Notes
    specialNotes: SpecialNote[] = [];

    // Dialog Management
    displayDialog = false;
    currentDialog: 'parent' | 'emergency' | 'allergy' | 'note' | null = null;
    dialogHeader = '';

    // Dialog Data
    relationships = ['Parent', 'Guardian', 'Other'];
    severityLevels = ['Low', 'Moderate', 'Severe'];
    noteTypes = [
        'Favorite Things',
        'Special Instruction',
        'Schedule',
        'Others',
    ];

    tempParent: Partial<ParentGuardian> = {};
    tempEmergency: Partial<EmergencyContact> = {};
    tempAllergy: Partial<AllergyRecord> = {};
    tempNote: Partial<SpecialNote> = {};

    ngOnInit() {}

    handleImageUpload(event: any) {
        const file = event.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            this.profilePicture = reader.result as string;
        };
        reader.readAsDataURL(file);
    }

    openDialog(type: 'parent' | 'emergency' | 'allergy' | 'note') {
        this.currentDialog = type;
        this.displayDialog = true;

        switch (type) {
            case 'parent':
                this.dialogHeader = 'Add Parent/Guardian';
                this.tempParent = {};
                break;
            case 'emergency':
                this.dialogHeader = 'Add Emergency Contact';
                this.tempEmergency = {};
                break;
            case 'allergy':
                this.dialogHeader = 'Add Allergy Record';
                this.tempAllergy = {};
                break;
            case 'note':
                this.dialogHeader = 'Add Special Note';
                this.tempNote = {};
                break;
        }
    }

    saveEntry() {
        switch (this.currentDialog) {
            case 'parent':
                this.parentsGuardians.push({
                    ...this.tempParent,
                } as ParentGuardian);
                break;
            case 'emergency':
                this.emergencyContacts.push({
                    ...this.tempEmergency,
                } as EmergencyContact);
                break;
            case 'allergy':
                this.allergyRecords.push({
                    ...this.tempAllergy,
                } as AllergyRecord);
                break;
            case 'note':
                this.specialNotes.push({ ...this.tempNote } as SpecialNote);
                break;
        }
        this.closeDialog();
    }

    closeDialog() {
        this.displayDialog = false;
        this.currentDialog;
    }
}
