import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Message, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import {
    AdministrativeZoneTypes,
    LocationTypes,
} from 'src/app/core/constants/enums';
import { LocationDataService } from 'src/app/core/dataservice/location/location.dataservice';
import { CreateAdministrativeZoneDTO } from 'src/app/core/dto/locations/administrative-zone.dto';
import { DzongkhagDTO } from 'src/app/core/dto/locations/dzongkhag.dto';

@Component({
    selector: 'app-admin-add-administrative-zones',
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
    templateUrl: './admin-add-administrative-zones.component.html',
    styleUrl: './admin-add-administrative-zones.component.scss',
})
export class AdminAddAdministrativeZonesComponent implements OnInit {
    constructor(
        private fb: FormBuilder,
        private dialogService: DialogService,
        private locationDataService: LocationDataService,
        public ref: DynamicDialogRef
    ) {}
    createAdministrativeZoneForm: FormGroup;
    messages: Message[] | undefined;

    dzongkhags!: DzongkhagDTO[];
    locations = Object.values(LocationTypes);
    administrativeZoneTypes = Object.values(AdministrativeZoneTypes);

    ngOnInit(): void {
        this.createAdministrativeZoneForm = this.fb.group({
            name: [null, Validators.required],
            nameDzo: [null],
            location: [null, Validators.required],
            type: [null, Validators.required],
            dzongkhagId: [null, Validators.required],
        });
        this.getAllDzongkhags();
    }
    createAdministiveZone() {
        const data: CreateAdministrativeZoneDTO = {
            name: this.createAdministrativeZoneForm.controls['name'].value,
            nameDzo: this.createAdministrativeZoneForm.controls['name'].value,
            dzongkhagId:
                this.createAdministrativeZoneForm.controls['dzongkhagId'].value,
            type: this.createAdministrativeZoneForm.controls['type'].value,
            location:
                this.createAdministrativeZoneForm.controls['location'].value,
        };

        this.locationDataService.CreateAdministrativeZone(data).subscribe({
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
                console.log('ERRORRR');
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
}
