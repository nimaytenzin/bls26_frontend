import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import {
    LOCATIONFLAGENUM,
    PlotOwnershipENUM,
} from 'src/app/core/constants/enums';
import { CreateThramDTO } from 'src/app/core/dataservice/land/dto/thram.dto';
import { ThramDataService } from 'src/app/core/dataservice/land/thram.dataservice';
import { LocationDataService } from 'src/app/core/dataservice/location/location.dataservice';
import { OwnerDTO } from 'src/app/core/dataservice/owners/dto/owner.dto';
import { OwnerDataService } from 'src/app/core/dataservice/owners/owner.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';
import { AdministrativeZoneDTO } from 'src/app/core/dto/locations/administrative-zone.dto';
import { DzongkhagDTO } from 'src/app/core/dto/locations/dzongkhag.dto';
import { SubAdministrativeZoneDTO } from 'src/app/core/dto/locations/sub-administrative-zone.dto';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
    selector: 'app-admin-thram-create',
    templateUrl: './admin-thram-create.component.html',
    styleUrls: ['./admin-thram-create.component.css'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        DropdownModule,
        InputTextModule,
        FormsModule,
        CommonModule,
        MultiSelectModule,
    ],
})
export class AdminThramCreateComponent implements OnInit {
    isSubmitting: boolean = false;

    createThramForm: FormGroup;
    dzongkhags: DzongkhagDTO[];
    administrativeZones: AdministrativeZoneDTO[];
    subAdministrativeZones: SubAdministrativeZoneDTO[];

    owners: UserDTO[];
    ownerTypes = Object.values(PlotOwnershipENUM);
    locationFlags = Object.values(LOCATIONFLAGENUM);

    constructor(
        private fb: FormBuilder,
        private locationDataService: LocationDataService,
        private thramDataService: ThramDataService,
        private ref: DynamicDialogRef,
        private userDataService: UserDataService,
        private authService: AuthService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.createThramForm = this.fb.group({
            thramNo: ['', Validators.required],
            dzongkhagId: ['', Validators.required],
            administrativeZoneId: ['', Validators.required],
            subAdministrativeZoneId: ['', Validators.required],
            owners: ['', Validators.required],
            ownershipType: ['', Validators.required],
        });
        this.locationDataService.GetAllDzonghags().subscribe({
            next: (res) => {
                this.dzongkhags = res;
            },
        });
        this.userDataService
            .AdminGetAllOwners(this.authService.GetCurrentRole().adminId)
            .subscribe((res) => {
                this.owners = res;
            });
    }

    createThram() {
        if (this.createThramForm.valid) {
            this.isSubmitting = true;

            const newThram: CreateThramDTO = {
                dzongkhagId: this.createThramForm.value.dzongkhagId,
                administrativeZoneId:
                    this.createThramForm.value.administrativeZoneId,
                subAdministrativeZoneId:
                    this.createThramForm.value.subAdministrativeZoneId,
                thramNo: this.createThramForm.value.thramNo,
                ownershipType: this.createThramForm.value.ownershipType,
                owners: this.createThramForm.value.owners,
            };

            this.thramDataService.CreateThram(newThram).subscribe({
                next: (res) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Created',
                        detail: 'New Thram Created Successfully',
                    });
                    this.ref.close({ status: 201 });
                    this.isSubmitting = false;
                },
                error: (err) => {
                    // Show error message
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error.message,
                    });
                    this.ref.close();
                    this.isSubmitting = false;
                },
            });
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Form Validation Error',
                detail: 'Please check all the Form Inputs',
            });
            this.isSubmitting = false;
        }
    }

    getAdminsitrativeZones(dzongkhagId: number) {
        this.locationDataService
            .GetAllAdministrativeZones({
                dzongkhagId: dzongkhagId,
            })
            .subscribe((res: any) => {
                this.administrativeZones = res;
            });
    }

    dzongkhagSelected(e) {
        this.getAdminsitrativeZones(e.value);
    }
    administrativeZoneSelect(e) {
        this.getSubadministrativeZones(e.value);
    }

    getSubadministrativeZones(administrativeZoneId: number) {
        this.locationDataService
            .GetAllSubAdministrativeZones({
                administrativeZoneId: administrativeZoneId.toString(),
            })
            .subscribe((res: any) => {
                this.subAdministrativeZones = res;
            });
    }
    close() {
        this.ref.close();
    }
}
