import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
import {
    DialogService,
    DynamicDialogComponent,
    DynamicDialogConfig,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import {
    BuildingType,
    NumberDropDownOptionsAsString,
} from 'src/app/core/constants/enums';
import { BuildingDataService } from 'src/app/core/dataservice/building/building.dataservice';
import { ZhicharApiService } from 'src/app/core/dataservice/externalApi/zhichar.api.service';
import { LocationDataService } from 'src/app/core/dataservice/location/location.dataservice';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DzongkhagDTO } from 'src/app/core/dto/locations/dzongkhag.dto';
import { AdministrativeZoneDTO } from 'src/app/core/dto/locations/administrative-zone.dto';
import { SubAdministrativeZoneDTO } from 'src/app/core/dto/locations/sub-administrative-zone.dto';
import { CreateBuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { PlotDataService } from 'src/app/core/dataservice/land/plot.dataservice';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-add-building',
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
        FormsModule,
        InputGroupAddonModule,
    ],
    providers: [DialogService],
    templateUrl: './admin-add-building.component.html',
    styleUrl: './admin-add-building.component.scss',
})
export class AdminAddBuildingComponent {
    instance: DynamicDialogComponent | undefined;

    checkingPlot: boolean = false;
    plotMappings: PlotDTO[] = [];
    searchPlotId: string;

    dzongkhags: DzongkhagDTO[];
    admninistrativeZones: AdministrativeZoneDTO[];
    subAdministrativeZones: SubAdministrativeZoneDTO[];

    selectedDzongkhag: DzongkhagDTO;
    createBuildingForm!: FormGroup;
    searched = false;

    buildingTypes = Object.values(BuildingType);
    numberedDropDownOptions = NumberDropDownOptionsAsString;

    isSubmitting = false;

    constructor(
        private zhicharApiService: ZhicharApiService,
        private fb: FormBuilder,
        private messageService: MessageService,
        private locationDataService: LocationDataService,
        private buildingDataService: BuildingDataService,
        public ref: DynamicDialogRef,
        private plotDataService: PlotDataService,
        private config: DynamicDialogConfig,
        private router: Router
    ) {
        if (this.config.data && this.config.data.plotId) {
            this.plotMappings.push(this.config.data);
        }
    }

    ngOnInit() {
        this.createBuildingForm = this.fb.group({
            isActive: [true, Validators.required],
            zhicharBuildingId: [null, Validators.required],
            zhicharQrUuid: [''],
            name: ['', Validators.required],
            buildingNumber: ['', Validators.required],
            buildingType: [BuildingType.CONTEMPORARY, Validators.required],
            regularFloorCount: [null, Validators.required],
            basementCount: [null, Validators.required],
            stiltCount: [null, Validators.required],
            atticCount: [null, Validators.required],
            jamthogCount: [null, Validators.required],
            areaSqM: [null],
            yearOfConstruction: [],
            yearOfCapitalization: [],
            buildingValue: [],

            latitude: ['', Validators.required],
            longitude: ['', Validators.required],
            address: [''],
            landmark: [''],
            dzongkhagId: ['', Validators.required],
            administrativeZoneId: ['', Validators.required],
            subadministrativeZoneId: ['', Validators.required],
        });

        this.getDzongkhags();
    }

    getZhicharBuildingInformation(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.searched = true;
            this.zhicharApiService
                .GetBuildDetailsByBuildingId(
                    this.createBuildingForm.controls['zhicharBuildingId'].value
                )
                .subscribe((res: any) => {
                    if (res) {
                        this.messageService.add({
                            key: 'tst',
                            severity: 'success',
                            summary: 'Data Fetched from Zhichar',
                            detail: 'Building Information Populated from Zhichar.bt',
                        });
                        this.createBuildingForm.patchValue({
                            zhicharQrUuid: res.qrUuid ? res.qrUuid : null,
                            address: res.address ? res.address : null,
                            buildingNumber: res.buildingNumber,
                            latitude: res.lat,
                            longitude: res.lng,
                            name: res.name,
                        });
                    } else {
                        this.messageService.add({
                            key: 'tst',
                            severity: 'error',
                            summary: 'Couldnot Fetch Data',
                            detail: 'Data not avilable in zhichar',
                        });
                    }
                });
        }
    }
    createBuilding() {
        if (this.createBuildingForm.valid) {
            this.isSubmitting = true;

            const data: CreateBuildingDTO = {
                isActive: this.createBuildingForm.controls['isActive'].value,
                zhicharBuildingId: Number(
                    this.createBuildingForm.controls['zhicharBuildingId'].value
                ),
                zhicharQrUuid:
                    this.createBuildingForm.controls['zhicharQrUuid'].value,
                buildingType:
                    this.createBuildingForm.controls['buildingType'].value,
                regularFloorCount: Number(
                    this.createBuildingForm.controls['regularFloorCount'].value
                ),
                basementCount: Number(
                    this.createBuildingForm.controls['basementCount'].value
                ),
                stiltCount: Number(
                    this.createBuildingForm.controls['stiltCount'].value
                ),
                atticCount: Number(
                    this.createBuildingForm.controls['atticCount'].value
                ),
                jamthogCount: Number(
                    this.createBuildingForm.controls['jamthogCount'].value
                ),
                areaSqM: this.createBuildingForm.controls['areaSqM'].value,
                yearOfConstruction:
                    this.createBuildingForm.controls['yearOfConstruction']
                        .value,
                yearOfCapitalization:
                    this.createBuildingForm.controls['yearOfCapitalization']
                        .value,
                buildingValue:
                    this.createBuildingForm.controls['buildingValue'].value,

                latitude: Number(this.createBuildingForm.controls['latitude'].value),
                longitude: Number(this.createBuildingForm.controls['longitude'].value),
                name: this.createBuildingForm.controls['name'].value,
                buildingNumber:
                    this.createBuildingForm.controls['buildingNumber'].value,
                address: this.createBuildingForm.controls['address'].value,
                landmark: this.createBuildingForm.controls['landmark'].value,
                dzongkhagId:
                    this.createBuildingForm.controls['dzongkhagId'].value,
                administrativeZoneId:
                    this.createBuildingForm.controls['administrativeZoneId']
                        .value,
                subadministrativeZoneId:
                    this.createBuildingForm.controls['subadministrativeZoneId']
                        .value,
                plots: this.plotMappings,
            };

            this.buildingDataService.CreateNewBuilding(data).subscribe({
                next: (res) => {
                    if (res.id) {
                        this.ref.close({ status: 201 });
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Building Added',
                        });
                        this.router.navigate([
                            'admin/master-properties/building/' + res.id,
                        ]);
                    }
                    this.isSubmitting = false;
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error:' + error.status + error.statusText,
                        detail: error.error.message,
                    });
                    this.isSubmitting = false;
                },
            });
        } else {
            const invalidFields = Object.keys(this.createBuildingForm.controls)
                .filter((key) => this.createBuildingForm.controls[key].invalid)
                .map(
                    (key) =>
                        key.charAt(0).toUpperCase() +
                        key.slice(1).replace(/([A-Z])/g, ' $1')
                );

            this.messageService.add({
                severity: 'error',
                summary: 'Missing Fields',
                detail: `Please add all required fields: ${invalidFields.join(
                    ', '
                )}`,
            });
        }
    }

    convertToUppercase(event: any) {
        this.searchPlotId.toUpperCase();
    }

    clearFormValues() {
        this.searched = false;
        this.createBuildingForm.reset();
        this.createBuildingForm.enable();
    }

    checkPlotDetailsAndAdd() {
        this.plotDataService.SearchPlotById(this.searchPlotId).subscribe({
            next: (res) => {
                if (res) {
                    const exists = this.plotMappings.some(
                        (item) => item.id === res.id
                    );

                    if (exists) {
                        this.messageService.add({
                            severity: 'info',
                            summary: 'Plot Already added ',
                            detail:
                                res.plotId + ' already exists in the mapping.',
                        });
                    } else {
                        this.plotMappings.push(res);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Plot Details Found',
                            detail: res.plotId + ' added to plot mapping.',
                        });
                    }
                }
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Couldnot Fetch Data',
                    detail: err.error.message,
                });
            },
        });
    }

    removePlotMapping(plot: PlotDTO) {
        this.plotMappings = this.plotMappings.filter(
            (plotMapping) => plotMapping.plotId !== plot.plotId
        );
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
