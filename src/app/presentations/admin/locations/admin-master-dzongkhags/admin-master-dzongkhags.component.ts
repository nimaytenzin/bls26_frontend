import { Component, OnInit } from '@angular/core';
import { LocationDataService } from 'src/app/core/dataservice/location/location.dataservice';
import { TableModule } from 'primeng/table';
import * as L from 'leaflet';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AdminAddBuildingComponent } from '../../buildings/buildings/crud-modal/admin-add-building/admin-add-building.component';
import { AdminAddDzongkhagComponent } from '../crud-modal/admin-add-dzongkhag/admin-add-dzongkhag.component';

@Component({
    selector: 'app-admin-master-dzongkhags',
    standalone: true,
    imports: [TableModule, ButtonModule],
    providers: [DialogService],
    templateUrl: './admin-master-dzongkhags.component.html',
    styleUrl: './admin-master-dzongkhags.component.scss',
})
export class AdminMasterDzongkhagsComponent implements OnInit {
    constructor(
        private locationDataService: LocationDataService,
        private dialogService: DialogService
    ) {}
    ref: DynamicDialogRef | undefined;

    dzongkhags: any[] = [];

    ngOnInit(): void {
        this.getAllDzongkhags();
    }

    getAllDzongkhags() {
        this.locationDataService.GetAllDzonghags().subscribe((res: any) => {
            this.dzongkhags = res;
        });
    }

    openAddDzongkhagDialog() {
        this.ref = this.dialogService.open(AdminAddDzongkhagComponent, {
            header: 'Add Dzongkhag',
            width: '500px',
        });
        this.ref.onClose.subscribe((res) => {
            if (res.added) {
                this.getAllDzongkhags();
            }
        });
    }

    downloadMasterTable() {}
}
