import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { LocationDataService } from 'src/app/core/dataservice/location/location.dataservice';
import { AdminAddDzongkhagComponent } from '../crud-modal/admin-add-dzongkhag/admin-add-dzongkhag.component';
import { AdminAddSubadministrativeZonesComponent } from '../crud-modal/admin-add-subadministrative-zones/admin-add-subadministrative-zones.component';
import { AdministrativeZoneDTO } from 'src/app/core/dto/locations/administrative-zone.dto';
import { DzongkhagDTO } from 'src/app/core/dto/locations/dzongkhag.dto';
import { SubAdministrativeZoneDTO } from 'src/app/core/dto/locations/sub-administrative-zone.dto';

@Component({
    selector: 'app-admin-master-subadministrative-zones',
    standalone: true,
    imports: [TableModule, ButtonModule],
    providers: [DialogService],
    templateUrl: './admin-master-subadministrative-zones.component.html',
    styleUrl: './admin-master-subadministrative-zones.component.scss',
})
export class AdminMasterSubadministrativeZonesComponent {
    constructor(
        private locationDataService: LocationDataService,
        private dialogService: DialogService
    ) {}
    ref: DynamicDialogRef | undefined;

    dzongkhags: DzongkhagDTO[];
    administrativeZones: AdministrativeZoneDTO[];
    subadministrativeZones: SubAdministrativeZoneDTO[];
    ngOnInit(): void {
        this.getAllSubAdministrativeZones();
    }

    getAllSubAdministrativeZones() {
        this.locationDataService.GetAllSubAdministrativeZones().subscribe({
            next: (res) => {
                console.log('res', res);
                this.subadministrativeZones = res;
            },
        });
    }

    openAddSubadministrativeZoneModal() {
        this.ref = this.dialogService.open(
            AdminAddSubadministrativeZonesComponent,
            {
                header: 'Add Sub Administrative Zone',
                width: '500px',
            }
        );
        this.ref.onClose.subscribe((res) => {
            if (res && res.added) {
                this.getAllSubAdministrativeZones();
            }
        });
    }
    downloadMasterTable() {}
}
