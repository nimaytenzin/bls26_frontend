import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { ThramDTO } from 'src/app/core/dataservice/land/dto/thram.dto';
import { ThramDataService } from 'src/app/core/dataservice/land/thram.dataservice';
import { LocationDataService } from 'src/app/core/dataservice/location/location.dataservice';
import { AdministrativeZoneDTO } from 'src/app/core/dto/locations/administrative-zone.dto';
import { DzongkhagDTO } from 'src/app/core/dto/locations/dzongkhag.dto';
import { SubAdministrativeZoneDTO } from 'src/app/core/dto/locations/sub-administrative-zone.dto';
import { AdminMapviewPlotdetailsComponent } from '../../../mapview/components/admin-mapview-plotdetails/admin-mapview-plotdetails.component';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-admin-property-search',
    templateUrl: './admin-property-search.component.html',
    styleUrls: ['./admin-property-search.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        InputTextModule,
        DropdownModule,
        FormsModule,
        ButtonModule,
        TableModule,
        DividerModule,
        TabViewModule,
        TooltipModule,
    ],
    providers: [DialogService],
})
export class AdminPropertySearchComponent implements OnInit {
    ref: DynamicDialogRef;

    dzongkhags: DzongkhagDTO[];
    administrativeZones: AdministrativeZoneDTO[];
    subAdministrativeZones: SubAdministrativeZoneDTO[];

    selectedDzongkhag: DzongkhagDTO;
    selectedAdministrativeZone: AdministrativeZoneDTO;
    selectedSubAdministrativeZone: SubAdministrativeZoneDTO;
    thramNo: string;
    plotId: string;

    thram: ThramDTO;
    plots: PlotDTO[];

    constructor(
        private locationDataService: LocationDataService,
        private thramDataService: ThramDataService,
        private dialogService: DialogService,
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit() {
        this.getDzongkhags();
    }

    getDzongkhags() {
        this.locationDataService.GetAllDzonghags().subscribe((res) => {
            this.dzongkhags = res;
        });
    }

    getAdminsitrativeZones(dzongkhag: DzongkhagDTO) {
        this.locationDataService
            .GetAllAdministrativeZones({
                dzongkhagId: dzongkhag.id,
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

    getSubadministrativeZones(administrativeZone: AdministrativeZoneDTO) {
        this.locationDataService
            .GetAllSubAdministrativeZones({
                administrativeZoneId: administrativeZone.id.toString(),
            })
            .subscribe((res: any) => {
                this.subAdministrativeZones = res;
            });
    }

    searchThram() {
        this.thramDataService
            .SearchForThramByThramNo({
                dzongkhagId: this.selectedDzongkhag.id,
                administrativeZoneId: this.selectedAdministrativeZone.id,

                thramNo: this.thramNo,
            })
            .subscribe({
                next: (res) => {
                    if (res) {
                        this.thram = res;
                        console.log(res);
                        this.plots = res.plots;
                    } else {
                        this.thram = null;
                        this.plots = null;
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Thram not Found',
                        });
                    }
                },
            });
    }

    searchThramByPlotId() {
        console.log('Searching for thram b y plot Id', this.plotId);
        this.thramDataService.SearchForThramByPlotId(this.plotId).subscribe({
            next: (res) => {
                this.thram = res;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Thram not Found',
                });
            },
        });
    }

    viewPlotsSpatially(plot: PlotDTO) {
        this.ref = this.dialogService.open(AdminMapviewPlotdetailsComponent, {
            header: plot.plotId,

            data: {
                plotId: plot.plotId,
            },
        });
    }

    goToPlotDetailedView(plot: PlotDTO) {
        this.router.navigate([`admin/master-properties/plot/${plot.id}`]);
    }

    navigateToBuilding(buildingId: string) {
        this.router.navigate([
            `admin/master-properties/building/${buildingId}`,
        ]);
    }
}
