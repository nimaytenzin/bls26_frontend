// admin-enroll-student.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
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
import { Stepper, StepperModule } from 'primeng/stepper';
import { FacilityDTO } from 'src/app/core/dto/properties/building.dto';
import { FacilityDataService } from 'src/app/services/facility-data.service';
import { PackageService } from 'src/app/services/package.service';
import { ChildDto, PackageDTO } from 'src/app/core/dto/ems';
import { ChildService } from 'src/app/services/child.service';

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
        StepperModule,
        ButtonModule,
    ],
})
export class AdminEnrollStudentComponent implements OnInit {
    @ViewChild('customStepper') customStepper!: Stepper;
    //steppers
    index: number = 0;

    // Personal Information
    childName = '';
    preferredName = '';
    dob: Date = new Date();
    gender = 'Male';
    profilePicture = null;
    studentCode = '';
    cid: string = '';

    // Enrollment
    facilities: FacilityDTO[] = [];
    selectedFacility: FacilityDTO | null = null;
    enrollmentStatus = 'Active';
    enrollmentDate: Date = new Date();
    graduationDate: Date = new Date();
    packageStartDate: Date = new Date();

    // Contacts
    parentsGuardians: ParentGuardian[] = [];
    emergencyContacts: EmergencyContact[] = [];

    // Address
    currentAddress = '';
    permanentAddress = '';

    // child notes 
    allergyRecords: AllergyRecord[] = [];
    specialNotes: SpecialNote[] = [];

    //registration packages and payments
    packages: PackageDTO[] = [];
    selectedPackage: PackageDTO | null = null;

    // Dialog Management
    displayDialog = false;
    currentDialog: 'parent' | 'emergency' | 'allergy' | 'note' | null = null;
    dialogHeader = '';


    constructor(
        private facilityService: FacilityDataService, 
        private packageService: PackageService,
        private childService: ChildService
    ) {
        this.facilityService.getFacilityByOwnerId(Number(localStorage.getItem('userId'))).subscribe((data) => {
            this.facilities = data;
        });
    }

    ngOnInit() { }

    getPackagesByFacilityId(event: any) {
        this.packageService.getAllPackagesByFacilityId(event.value.id).subscribe((data) => {
            this.packages = data;
        });
    }

    searchByStudentCode(event: any) {
        this.studentCode = event.target.value;
        if (this.studentCode.length > 0) {
            this.childService.getChildByStudentCode(this.studentCode).subscribe((data) => {
                this.childName = data.name;
                this.preferredName = data.preferredName;
                this.dob = data.dob;
                this.gender  = data.gender;
                this.profilePicture = data.avatarUrl;
            });
        } 
    }

    handlePhotoUpload(event: any) {
        console.log(event)
        const file = event.files[0];
        if (file) {
            this.childService.uploadPhoto(file).subscribe((filePath) => {
                if (filePath) {
                    this.profilePicture = filePath;
                } else {
                    console.error('Photo upload failed.');
                }
            });
        }
    }


    createChildEntity(){
        let child:ChildDto = {
            name: this.childName,
            preferredName: this.preferredName,
            cid:this.cid, 
            avatarUrl:"" ,
            studentCode: '',
            dob: undefined,
            gender: '',
            parentId: 0,
            facilityId: 0
        }
    }
    onNextStepper() {
        console.log("Next Stepper Index: ", this.index);
        this.customStepper.activeStep = this.index + 1;
    }



    submitForm() {

    }

}
