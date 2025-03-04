import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import {
    DialogService,
    DynamicDialogComponent,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import {
    BuildingType,
    NumberDropDownOptions,
    NumberDropDownOptionsAsString,
} from 'src/app/core/constants/enums';
import { BuildingDataService } from 'src/app/core/dataservice/building/building.dataservice';
import { ZhicharApiService } from 'src/app/core/dataservice/externalApi/zhichar.api.service';
import { LocationDataService } from 'src/app/core/dataservice/location/location.dataservice';
import { AdministrativeZoneDTO } from 'src/app/core/dto/locations/administrative-zone.dto';
import { DzongkhagDTO } from 'src/app/core/dto/locations/dzongkhag.dto';
import { SubAdministrativeZoneDTO } from 'src/app/core/dto/locations/sub-administrative-zone.dto';
import {
    BuildingDTO,
    UpdateBuildingDto,
} from 'src/app/core/dto/properties/building.dto';

@Component({
    selector: 'app-admin-edit-building',
    standalone: true,
    imports: [
        ButtonModule,
        CommonModule,
        DropdownModule,
        ReactiveFormsModule,
        InputNumberModule,
        InputTextModule,
        CheckboxModule,
        InputTextareaModule,
        ToastModule,
        InputGroupModule,
        InputGroupAddonModule,
        CalendarModule,
    ],

    templateUrl: './admin-edit-building.component.html',
    styleUrl: './admin-edit-building.component.scss',
})
export class AdminEditBuildingComponent implements OnInit {
    instance: DynamicDialogComponent | undefined;
    building: BuildingDTO;
    isSubmitting: boolean = false;

    dzongkhags: DzongkhagDTO[];
    admninistrativeZones: AdministrativeZoneDTO[];
    subAdministrativeZones: SubAdministrativeZoneDTO[];

    selectedDzongkhag: DzongkhagDTO;

    updateBuildingForm!: FormGroup;
    searched = false;

    buildingTypes = Object.values(BuildingType);
    numberedDropDownOptions = NumberDropDownOptionsAsString;

    constructor(
        public ref: DynamicDialogRef,
        private dialogService: DialogService,
        private locationDataService: LocationDataService,
        private buildingDataService: BuildingDataService,
        private fb: FormBuilder,
        private messageService: MessageService,
        private zhicharApiService: ZhicharApiService
    ) {
        this.instance = this.dialogService.getInstance(this.ref);
        if (this.instance && this.instance.data) {
            this.building = this.instance.data;
            this.getDzongkhags();
            this.getAdminsitrativeZones(this.building.dzongkhagId);
            this.getSubadministrativeZones(this.building.administrativeZoneId);
        }
    }

    ngOnInit(): void {
        this.getAdminsitrativeZones(this.building.dzongkhagId);
        this.getSubadministrativeZones(this.building.administrativeZoneId);
        this.getDzongkhags();
        this.updateBuildingForm = this.fb.group({
            isActive: [false, Validators.required],
            zhicharBuildingId: ['', Validators.required],
            zhicharQrUuid: [''],
            name: ['', Validators.required],
            buildingType: [null, Validators.required],
            regularFloorCount: [null, Validators.required],
            basementCount: [null, Validators.required],
            stiltCount: [null, Validators.required],
            atticCount: [null, Validators.required],
            jamthogCount: [null, Validators.required],

            areaSqM: [],
            latitude: ['', Validators.required],
            longitude: ['', Validators.required],
            buildingNumber: [null, Validators.required],
            address: [''],
            landmark: [''],

            yearOfConstruction: [],
            yearOfCapitalization: [],
            buildingValue: [],
            dzongkhagId: ['', Validators.required],
            administrativeZoneId: ['', Validators.required],
            subadminsitrativeZoneId: ['', Validators.required],
        });

        this.updateBuildingForm.patchValue({
            ...this.building,
            subadminsitrativeZoneId: this.building.subadministrativeZoneId,
            regularFloorCount: this.building.regularFloorCount.toString(),
            atticCount: this.building.atticCount.toString(),
            jamthogCount: this.building.jamthogCount.toString(),
            stiltCount: this.building.stiltCount.toString(),
            basementCount: this.building.basementCount.toString(),
            isActive: this.building.isActive === 1 ? true : false,
        });
    }

    getZhicharBuildingInformation(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.searched = true;
            this.zhicharApiService
                .GetBuildDetailsByBuildingId(
                    this.updateBuildingForm.controls['zhicharBuildingId'].value
                )
                .subscribe((res: any) => {
                    if (res) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Data Fetched from Zhichar',
                            detail: 'Building Information Populated from Zhichar.bt',
                        });
                        this.updateBuildingForm.patchValue({
                            zhicharQrUuid: res.qrUuid ? res.qrUuid : null,
                            address: res.address ? res.address : null,
                            buildingNumber: res.buildingNumber,
                            latitude: res.lat,
                            longitude: res.lng,
                            buildngName: res.name,
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Couldnot Fetch Data',
                            detail: 'Data not avilable in zhichar',
                        });
                    }
                });
        }
    }

    updateBuilding() {
        if (this.updateBuildingForm.valid) {
            this.isSubmitting = true;
            const newData: UpdateBuildingDto = {
                isActive: this.updateBuildingForm.controls['isActive'].value,
                zhicharBuildingId: Number(
                    this.updateBuildingForm.controls['zhicharBuildingId'].value
                ),
                zhicharQrUuid:
                    this.updateBuildingForm.controls['zhicharQrUuid'].value,
                buildingType: BuildingType.CONTEMPORARY,
                regularFloorCount: Number(
                    this.updateBuildingForm.controls['regularFloorCount'].value
                ),
                basementCount: Number(
                    this.updateBuildingForm.controls['basementCount'].value
                ),
                stiltCount: Number(
                    this.updateBuildingForm.controls['stiltCount'].value
                ),
                atticCount: Number(
                    this.updateBuildingForm.controls['atticCount'].value
                ),
                jamthogCount: Number(
                    this.updateBuildingForm.controls['jamthogCount'].value
                ),
                areaSqM: this.updateBuildingForm.controls['areaSqM'].value,
                yearOfConstruction:
                    this.updateBuildingForm.controls['yearOfConstruction']
                        .value,
                yearOfCapitalization:
                    this.updateBuildingForm.controls['yearOfCapitalization']
                        .value,
                buildingValue:
                    this.updateBuildingForm.controls['buildingValue'].value,
                latitude: this.updateBuildingForm.controls['latitude'].value,
                longitude: this.updateBuildingForm.controls['longitude'].value,
                name: this.updateBuildingForm.controls['name'].value,
                buildingNumber:
                    this.updateBuildingForm.controls['buildingNumber'].value,
                address: this.updateBuildingForm.controls['address'].value,
                landmark: this.updateBuildingForm.controls['landmark'].value,
                dzongkhagId:
                    this.updateBuildingForm.controls['dzongkhagId'].value,
                administrativeZoneId:
                    this.updateBuildingForm.controls['administrativeZoneId']
                        .value,
                subadministrativeZoneId:
                    this.updateBuildingForm.controls['subadminsitrativeZoneId']
                        .value,
            };

            this.buildingDataService
                .UpdateBuilding(this.building.id, newData)
                .subscribe({
                    next: (res) => {
                        this.isSubmitting = false;
                        if (res) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Success',
                                detail: 'Building Details Updated',
                            });
                            this.ref.close({
                                updated: true,
                            });
                        }
                    },
                    error: (err) => {
                        this.isSubmitting = false;
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: err.error.message,
                        });
                    },
                });
        }
    }

    getDzongkhags() {
        this.locationDataService.GetAllDzonghags().subscribe((res: any) => {
            this.dzongkhags = res;
            console.log(res);
        });
    }

    getAdminsitrativeZones(dzongkhagId: number) {
        this.locationDataService
            .GetAllAdministrativeZones({
                dzongkhagId: dzongkhagId,
            })
            .subscribe((res: any) => {
                this.admninistrativeZones = res;
            });
    }

    dzongkhagSelected(e) {
        this.getAdminsitrativeZones(e.value);
    }
    administrativeZoneSelected(e) {
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
