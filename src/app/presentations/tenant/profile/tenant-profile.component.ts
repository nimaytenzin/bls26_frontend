import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { LocationDataService } from 'src/app/core/dataservice/location/location.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { TenantDataService } from 'src/app/core/dataservice/users-and-auth/tenant.dataservice';
import { AdministrativeZoneDTO } from 'src/app/core/dto/locations/administrative-zone.dto';
import { DzongkhagDTO } from 'src/app/core/dto/locations/dzongkhag.dto';
import { SubAdministrativeZoneDTO } from 'src/app/core/dto/locations/sub-administrative-zone.dto';
import { TenantDTO } from 'src/app/core/dto/users/tenant.dto';
import { TenantUpdatePincodeComponent } from '../shared/tenant-update-pincode/tenant-update-pincode.component';
import { FileUploadModule } from 'primeng/fileupload';
import { CommonModule } from '@angular/common';
import { FileUploadService } from 'src/app/core/dataservice/fileupload.dataservice';
import { API_URL } from 'src/app/core/constants/constants';
import { AuthenticatedUserDTO } from 'src/app/core/dataservice/users-and-auth/dto/auth.dto';

interface UploadEvent {
    originalEvent: Event;
    files: File[];
}

@Component({
    selector: 'app-tenant-profile',
    templateUrl: './tenant-profile.component.html',
    styleUrls: ['./tenant-profile.component.scss'],
    standalone: true,
    imports: [
        AvatarModule,
        ButtonModule,
        DividerModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        DropdownModule,
        ReactiveFormsModule,
        FileUploadModule,
        CommonModule,
    ],
    providers: [DialogService],
})
export class TenantProfileComponent implements OnInit {
    showEditProfileDialog: boolean = false;
    showUploadProfile: boolean = false;
    showUploadSignatureModal: boolean = false;

    ref: DynamicDialogRef;
    editProfileForm: FormGroup;

    tenantDetails: TenantDTO;
    dzongkhags: DzongkhagDTO[];
    administrativeZones: AdministrativeZoneDTO[];
    subAdministrativeZones: SubAdministrativeZoneDTO[];

    authenticatedUser: AuthenticatedUserDTO;
    selectedProfilePicture: any;
    selectedSignature: any;

    profileUri: string;
    signatureUri: string;

    apiUrl = API_URL;
    constructor(
        private fb: FormBuilder,
        private dialogService: DialogService,
        private tenantDataService: TenantDataService,
        private locationDataService: LocationDataService,
        private authService: AuthService,
        private fileUploadService: FileUploadService
    ) {
        this.authenticatedUser = this.authService.GetAuthenticatedUser();
        this.locationDataService.GetAllDzonghags().subscribe((res) => {
            this.dzongkhags = res;
        });
        this.editProfileForm = this.fb.group({
            firstName: [''],
            middleName: [''],
            lastName: [''],
            cid: [''],
            phoneNumber: [''],
            email: [''],
            dzongkhagId: [],
            administrativeZoneId: [],
            subAdministrativeZoneId: [],
        });
        this.fetchTenantDetails();
    }

    ngOnInit() {}

    fetchTenantDetails() {
        this.tenantDataService
            .SearchTenant({
                id: this.authenticatedUser.id,
            })
            .subscribe((res) => {
                this.tenantDetails = res;
                this.editProfileForm.patchValue({
                    firstName: res.firstName,
                    middleName: res.middleName,
                    lastName: res.lastName,
                    cid: res.cid,
                    phoneNumber: res.phoneNumber,
                    email: res.email,
                    dzongkhagId: res.dzongkhagId,
                    administrativeZoneId: res.administrativeZoneId,
                    subAdministrativeZoneId: res.subadministrativeZoneId,
                });

                if (this.tenantDetails.profileUri) {
                    this.profileUri =
                        this.apiUrl + '/' + this.tenantDetails.profileUri;
                }
                if (this.tenantDetails.signatureUri) {
                    this.signatureUri =
                        this.apiUrl + '/' + this.tenantDetails.signatureUri;
                }
                this.locationDataService
                    .GetAllAdministrativeZones({
                        dzongkhagId: res.dzongkhagId,
                    })
                    .subscribe((zones) => {
                        this.administrativeZones = zones;
                    });
                if (res.administrativeZone) {
                    this.locationDataService
                        .GetAllSubAdministrativeZones({
                            administrativeZoneId:
                                res.administrativeZoneId.toString(),
                        })
                        .subscribe((subzones) => {
                            this.subAdministrativeZones = subzones;
                        });
                }
            });
    }

    cancel() {
        this.editProfileForm.reset();
    }

    getReadableDate(date: string) {
        return new Date(date).toDateString();
    }
    updateProfileDetails() {
        console.log(this.editProfileForm.value);
        this.tenantDataService
            .UpdateTenantDetails(
                { ...this.editProfileForm.value },
                this.authenticatedUser.id
            )
            .subscribe((res) => {
                if (res) {
                    this.fetchTenantDetails();
                    this.showEditProfileDialog = false;
                }
            });
        // Implement your save logic here
    }

    updatePin() {
        this.ref = this.dialogService.open(TenantUpdatePincodeComponent, {
            header: 'update pin',
        });
    }

    openUploadProfileModal() {
        this.showUploadProfile = true;
    }

    onSelect(event: UploadEvent) {
        this.selectedProfilePicture = event.files[0];
    }
    onSignatureSelect(event: UploadEvent) {
        this.selectedSignature = event.files[0];
    }

    onUpload(event: UploadEvent) {
        const file = this.selectedProfilePicture;
        const formData = new FormData();
        formData.append('file', file, file.name);
        console.log(formData);
        this.fileUploadService
            .UploadTenantProfilePicture(formData, this.authenticatedUser.id)
            .subscribe((res) => {
                this.fetchTenantDetails();
                this.showUploadProfile = false;
            });
    }

    onSignatureUpload(event: UploadEvent) {
        const file = this.selectedSignature;
        const formData = new FormData();
        formData.append('file', file, file.name);
        console.log(formData);
        this.fileUploadService
            .UploadTenantSignature(formData, this.authenticatedUser.id)
            .subscribe((res) => {
                this.fetchTenantDetails();
                this.showUploadSignatureModal = false;
            });
    }
}
