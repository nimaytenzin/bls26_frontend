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
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import {
    PlotOwnershipENUM,
    LOCATIONFLAGENUM,
} from 'src/app/core/constants/enums';
import {
    ThramDTO,
    UpdateThramDTO,
} from 'src/app/core/dataservice/land/dto/thram.dto';
import { ThramDataService } from 'src/app/core/dataservice/land/thram.dataservice';
import { LocationDataService } from 'src/app/core/dataservice/location/location.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';
import { AdministrativeZoneDTO } from 'src/app/core/dto/locations/administrative-zone.dto';
import { DzongkhagDTO } from 'src/app/core/dto/locations/dzongkhag.dto';
import { SubAdministrativeZoneDTO } from 'src/app/core/dto/locations/sub-administrative-zone.dto';

@Component({
    selector: 'app-admin-thram-update',
    templateUrl: './admin-thram-update.component.html',
    styleUrls: ['./admin-thram-update.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DropdownModule,
        InputTextModule,
        ButtonModule,
        MultiSelectModule,
        FormsModule,
    ],
})
export class AdminThramUpdateComponent implements OnInit {
    updateThramForm: FormGroup;
    thram: ThramDTO;

    dzongkhags: DzongkhagDTO[];
    administrativeZones: AdministrativeZoneDTO[];
    subAdministrativeZones: SubAdministrativeZoneDTO[];

    owners: UserDTO[];
    selectedOwners: UserDTO[];
    ownerTypes = Object.values(PlotOwnershipENUM);
    locationFlags = Object.values(LOCATIONFLAGENUM);

    constructor(
        private fb: FormBuilder,
        private config: DynamicDialogConfig,
        private locationDataService: LocationDataService,
        private thramDataService: ThramDataService,
        private ref: DynamicDialogRef,
        private userDataService: UserDataService,
        private authService: AuthService,
        private messageService: MessageService
    ) {
        this.getAllOwners();
        this.thram = this.config.data;
        this.getAllDzongkhags();
        this.getAdminsitrativeZones(this.thram.dzongkhagId);
        this.getSubadministrativeZones(this.thram.administrativeZoneId);
        console.log('Passed thram data', this.thram);
        this.selectedOwners = this.thram.owners;
    }

    ngOnInit() {
        this.updateThramForm = this.fb.group({
            thramNo: ['', Validators.required],
            dzongkhagId: ['', Validators.required],
            administrativeZoneId: ['', Validators.required],
            subAdministrativeZoneId: ['', Validators.required],
            owners: ['', Validators.required],
            ownershipType: ['', Validators.required],
        });
        this.updateThramForm.patchValue({
            ...this.thram,
        });
    }

    updateThram() {
        if (this.updateThramForm.valid) {
            const data: UpdateThramDTO = {
                dzongkhagId: this.updateThramForm.value.dzongkhagId,
                administrativeZoneId:
                    this.updateThramForm.value.administrativeZoneId,
                subAdministrativeZoneId:
                    this.updateThramForm.value.subAdministrativeZoneId,
                thramNo: this.updateThramForm.value.thramNo,
                ownershipType: this.updateThramForm.value.ownershipType,
                owners: this.updateThramForm.value.owners,
            };
            this.thramDataService.UpdateThram(data, this.thram.id).subscribe({
                next: (res) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Thram Data Updated',
                    });
                    this.ref.close({ status: 200 });
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error.message,
                    });
                    this.ref.close();
                },
            });
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Form Validation Error',
                detail: 'Please check all the Form Inputs',
            });
        }
    }

    dzongkhagSelected(e) {
        this.getAdminsitrativeZones(e.value);
    }
    administrativeZoneSelect(e) {
        this.getSubadministrativeZones(e.value);
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

    getSubadministrativeZones(administrativeZoneId: number) {
        this.locationDataService
            .GetAllSubAdministrativeZones({
                administrativeZoneId: administrativeZoneId.toString(),
            })
            .subscribe((res: any) => {
                this.subAdministrativeZones = res;
            });
    }

    getAllOwners() {
        this.userDataService
            .AdminGetAllOwners(this.authService.GetAuthenticatedUser().id)
            .subscribe((res) => {
                console.log(res);
                this.owners = res;
            });
    }

    getAllDzongkhags() {
        this.locationDataService.GetAllDzonghags().subscribe({
            next: (res) => {
                this.dzongkhags = res;
            },
        });
    }
    close() {
        this.ref.close();
    }
}
