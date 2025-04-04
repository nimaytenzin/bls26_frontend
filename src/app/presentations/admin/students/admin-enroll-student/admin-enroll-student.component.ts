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
import { ChildDto, ChildNoteDto, PackageDTO, RegistrationDto, UserDTO } from 'src/app/core/dto/ems';
import { ChildService } from 'src/app/services/child.service';
import { MessageService } from 'primeng/api';
import { EMSUserDataService } from 'src/app/services/ems-user-data.service';
import { RegistrationService } from 'src/app/services/registration.service';
import { ChildNoteService } from 'src/app/services/child-note.service';

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
    graduationDate: Date = null;
    packageStartDate: Date = new Date();
    packageEndDate: Date = null;

    //parent 
    parentName = '';
    parentEmail = '';
    parentContact = '';
    parentCid = '';

    //childnotes
    medicalConditions = '';
    specialInstruction = '';
    notes = '';

    // Address
    currentAddress = '';
    permanentAddress = '';

    //registration packages and payments
    packages: PackageDTO[] = [];
    selectedPackage: PackageDTO | null = null;

    createRegistrationEntity: RegistrationDto = {
        childId: 0,
        parentId: 0,
        facilityId: 0,
        start_date: undefined,
        end_date: undefined,
        status: '',
        packageId: 0
    };


    constructor(
        private facilityService: FacilityDataService,
        private packageService: PackageService,
        private messageService: MessageService,
        private userService: EMSUserDataService,
        private registrationService: RegistrationService,
        private childNoteService: ChildNoteService,
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

    private showMessage(summary: string, detail: string): void {
        this.messageService.add({
            severity: 'error',
            summary,
            detail,
        });
    }


    searchByStudentCode() {
        if (this.studentCode.length > 0) {
            this.childService.getChildByStudentCode(this.studentCode).subscribe((data) => {
                this.childName = data.name;
                this.preferredName = data.preferredName;
                this.dob = data.dob;
                this.gender = data.gender;
                this.profilePicture = data.avatarUrl;
            });
        }
    }

    handlePhotoUpload(event: any) {
        const file = event.files[0];
        if (file) {
            this.childService.uploadPhoto(file).subscribe((filePath) => {
                if (filePath) {
                    console.log('Photo uploaded successfully:', filePath);
                    this.profilePicture = filePath;
                } else {
                    console.error('Photo upload failed.');
                }
            });
        }
    }


    // create a child entity or return childid
    async createChildEntity(): Promise<boolean> {
        const existingChild: ChildDto = await this.childService.getChildByStudentCode(this.studentCode).toPromise();
        if (existingChild) {
            this.createRegistrationEntity.childId = existingChild.id;
            return true;
        } else {
            if (!this.childName || !this.dob || !this.gender) {
                this.showMessage('Validation Error', 'Child Name, Date of Birth, and Gender are required fields.');
                return false;
            }
            if (this.profilePicture == null) {
                this.showMessage('Validation Error', 'Profile picture is required.');
                return false;
            }

            if(this.createRegistrationEntity.parentId == 0) {
                this.showMessage('Validation Error', 'Parent ID is required.');
                return false;
            }

            let child: ChildDto = {
                name: this.childName,
                preferredName: this.preferredName,
                cid: this.cid,
                avatarUrl: this.profilePicture,
                studentCode: '',
                dob: this.dob,
                gender: this.gender,
                parentId: this.createRegistrationEntity.parentId,
            }
            const createdChild = await this.childService.createChild(child).toPromise();
            if (createdChild) {
                return true
            } else {
                return false
            }
        }
    }

    onNextStepper(index: number) {
        console.log("Next Stepper Index: ", index);
        switch (index) {
            case 0:
                this.createParentEntity().then((result) => {
                    console.log(result)
                    if (result) {
                        this.customStepper.activeStep = index + 1;
                    } else {
                        this.showMessage("Validation Error", "There are errors in the form")
                    }
                });
                break;
            case 1:
                this.createChildEntity().then((result) => {
                    if (result) {
                        this.customStepper.activeStep = index + 1;
                    } else {
                        this.showMessage("Validation Error", "There are errors in the form")
                    }
                })
                break;
            case 2:
                this.customStepper.activeStep = index + 1;
                break;
            case 3:
                this.customStepper.activeStep = index + 1;
                break;
        }
    }

    async searchParentByCid() {
        if (this.parentCid == "") {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Parent CID is required.',
            });
        }
        const parent = await this.userService.getParentByCid(this.parentCid).toPromise();
        if (parent) {
            this.parentName = parent.name;
            this.parentEmail = parent.email;
            this.parentContact = parent.phone;
        }
    }

    async clearParentForm() {
        this.parentName = '';
        this.parentEmail = '';
        this.parentContact = '';
        this.parentCid = '';
    }

    validateParentForm(): boolean {
        if (!this.parentName || !this.parentEmail || !this.parentContact) {
            this.showMessage('Validation Error', 'Parent Name, Email, and Contact are required fields.');
            return false;
        }

        if (this.parentCid == '') {
            this.showMessage('Validation Error', 'Parent CID is required.');
            return false;
        }

        if (this.parentEmail == '') {
            this.showMessage('Validation Error', 'Parent Email is required.');
            return false;
        }

        if (this.parentContact == '') {
            this.showMessage('Validation Error', 'Parent Contact is required.');
            return false;
        }
        return true;
    }

    // create a new parent if not exists or return existing id
    async createParentEntity(): Promise<boolean> {
        const isvalid = this.validateParentForm();
        if (!isvalid) {
            this.showMessage('Validation Error', 'Parent Name, Email, and Contact are required fields.');
            return false;
        }

        const parent: UserDTO = await this.userService.getParentByCid(this.parentCid).toPromise();
        if (parent) {
            this.createRegistrationEntity.parentId = parent.id;
            return true
        } else {
            const createdParent = await this.userService.createParent({
                name: this.parentName,
                cid: this.parentCid,
                email: this.parentEmail,
                phone: this.parentContact,
            }).toPromise().catch((error) => {
                this.showMessage('Error', 'Failed to create parent: ' + error.message);
            });
            if (createdParent) {
                this.createRegistrationEntity.parentId = createdParent.id;
                return true
            } else {
                return false
            }
        }
    }

    async createRegistration(subscriptionId: number): Promise<boolean> {
        if (this.createRegistrationEntity.childId == 0) {
            this.showMessage('Validation Error', 'Child ID is required.');
            return false;
        }

        if (this.createRegistrationEntity.parentId == 0) {
            this.showMessage('Validation Error', 'Parent ID is required.');
            return false;
        }

        if (!this.selectedFacility.id) {
            this.showMessage('Validation Error', 'Facility ID is required.');
            return false;
        }

        if (!this.selectedPackage.id) {
            this.showMessage('Validation Error', 'Package ID is required.');
            return false;
        }

        if (!this.createRegistrationEntity.start_date) {
            this.showMessage('Validation Error', 'Start date is required.');
            return false;
        }

        if (!this.createRegistrationEntity.end_date) {
            this.showMessage('Validation Error', 'End date is required.');
            return false;
        }

        this.createRegistrationEntity.facilityId = this.selectedFacility.id;
        this.createRegistrationEntity.packageId = this.selectedPackage.id;
        const createdRegistration = await this.registrationService.createRegistration(this.createRegistrationEntity).toPromise();
        if (createdRegistration) {
            return true
        }

        return true
    }

    async createChildNotes(): Promise<boolean> {
        if (!this.createRegistrationEntity.childId) {
            this.showMessage('Validation Error', 'Child ID is required.');
            return false;
        }
        let childNotes: ChildNoteDto = {
            childId: this.createRegistrationEntity.childId,
            medicalCondition: this.medicalConditions,
            specialInstruction: this.specialInstruction,
            notes: this.notes,
        }

        return true
    }

    submitForm() {

    }

}
