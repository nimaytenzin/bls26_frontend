import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { LocationDataService } from 'src/app/core/dataservice/location/location.dataservice';
import { AdminAddAdministrativeZonesComponent } from '../crud-modal/admin-add-administrative-zones/admin-add-administrative-zones.component';
import { AdministrativeZoneDTO } from 'src/app/core/dto/locations/administrative-zone.dto';

@Component({
    selector: 'app-admin-master-administrative-zones',
    standalone: true,
    imports: [TableModule, ButtonModule],
    providers: [DialogService],
    templateUrl: './admin-master-administrative-zones.component.html',
    styleUrl: './admin-master-administrative-zones.component.scss',
})
export class AdminMasterAdministrativeZonesComponent {
    constructor(
        private locationDataService: LocationDataService,
        private dialogService: DialogService
    ) {}
    ref: DynamicDialogRef | undefined;

    adminstrativeZones: AdministrativeZoneDTO[];

    ngOnInit(): void {
        this.getAllAdministrativeZones();
    }

    getAllAdministrativeZones() {
        this.locationDataService
            .GetAllAdministrativeZones()
            .subscribe((res) => {
                this.adminstrativeZones = res;
            });
    }

    openAddAdministrativezoneDialog() {
        this.ref = this.dialogService.open(
            AdminAddAdministrativeZonesComponent,
            {
                header: 'Add Administrative Zone',
                width: '500px',
            }
        );
        this.ref.onClose.subscribe((res) => {
            if (res.added) {
                this.getAllAdministrativeZones();
            }
        });
    }
    downloadMasterTable() {}
}
