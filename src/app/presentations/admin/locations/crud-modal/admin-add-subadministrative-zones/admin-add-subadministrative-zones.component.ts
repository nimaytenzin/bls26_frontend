import { Component } from '@angular/core';
import {
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { MessageService, Message } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import {
    LocationTypes,
    AdministrativeZoneTypes,
    SubAdministrativeZoneTypes,
} from 'src/app/core/constants/enums';
import { LocationDataService } from 'src/app/core/dataservice/location/location.dataservice';
import {
    AdministrativeZoneDTO,
    CreateAdministrativeZoneDTO,
} from 'src/app/core/dto/locations/administrative-zone.dto';
import { DzongkhagDTO } from 'src/app/core/dto/locations/dzongkhag.dto';
import { CreateSubAdministrativeZoneDTO } from 'src/app/core/dto/locations/sub-administrative-zone.dto';

@Component({
    selector: 'app-admin-add-subadministrative-zones',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        InputNumberModule,
        DropdownModule,
        ButtonModule,
        MessagesModule,
        InputTextModule,
    ],
    providers: [MessageService, DialogService],
    templateUrl: './admin-add-subadministrative-zones.component.html',
    styleUrl: './admin-add-subadministrative-zones.component.scss',
})
export class AdminAddSubadministrativeZonesComponent {
    constructor(
        private fb: FormBuilder,
        private dialogService: DialogService,
        private locationDataService: LocationDataService,
        public ref: DynamicDialogRef
    ) {}
    createSubAdministrativeZoneForm: FormGroup;
    messages: Message[] | undefined;

    dzongkhags!: DzongkhagDTO[];
    locations = Object.values(LocationTypes);
    subadministrativeZoneTypes = Object.values(SubAdministrativeZoneTypes);
    administrativeZones: AdministrativeZoneDTO[];
    ngOnInit(): void {
        this.createSubAdministrativeZoneForm = this.fb.group({
            name: ['', Validators.required],
            nameDzo: [''],
            location: ['', Validators.required],
            type: ['', Validators.required],
            dzongkhagId: ['', Validators.required],
            administrativeZoneId: ['', Validators.required],
        });
        this.getAllDzongkhags();
    }
    createSubAdministiveZone() {
        const data: CreateSubAdministrativeZoneDTO = {
            name: this.createSubAdministrativeZoneForm.controls['name'].value,
            nameDzo:
                this.createSubAdministrativeZoneForm.controls['nameDzo'].value,
            dzongkhagId:
                this.createSubAdministrativeZoneForm.controls['dzongkhagId']
                    .value,
            administrativeZoneId:
                this.createSubAdministrativeZoneForm.controls[
                    'administrativeZoneId'
                ].value,
            type: this.createSubAdministrativeZoneForm.controls['type'].value,
            location:
                this.createSubAdministrativeZoneForm.controls['location'].value,
        };

        this.locationDataService.CreateSubAdministrativeZone(data).subscribe({
            next: (res: any) => {
                this.messages = [
                    {
                        severity: 'success',
                        summary: 'Entry Created',
                        detail: res.message,
                    },
                ];
                setTimeout(() => {
                    this.ref.close({
                        added: true,
                    });
                }, 0);
            },
            error: (err) => {
                console.log(err);
                this.messages = [
                    {
                        severity: 'error',
                        summary: 'Error: ' + err.error.statusCode,
                        detail: err.error.message,
                    },
                ];
            },
        });
    }

    getAllDzongkhags() {
        this.locationDataService.GetAllDzonghags().subscribe({
            next: (res) => {
                this.dzongkhags = res;
            },
        });
    }

    getAdministrativeZonesByDzongkhag(event) {
        this.locationDataService
            .GetAllAdministrativeZones({
                dzongkhagId: event.value,
            })
            .subscribe((res) => {
                this.administrativeZones = res;
            });
    }
}
