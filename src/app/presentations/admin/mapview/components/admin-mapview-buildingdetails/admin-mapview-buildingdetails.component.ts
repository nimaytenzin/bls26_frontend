import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { BuildingDataService } from 'src/app/core/dataservice/building/building.dataservice';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { QRCodeModule } from 'angularx-qrcode';
import { PARSEBUILDINGFLOORS } from 'src/app/core/utility/helper.function';
import { AdminBuildingPhotosComponent } from '../../../buildings/buildings/components/admin-building-photos/admin-building-photos.component';
@Component({
    selector: 'app-admin-mapview-buildingdetails',
    templateUrl: './admin-mapview-buildingdetails.component.html',
    styleUrls: ['./admin-mapview-buildingdetails.component.css'],
    standalone: true,
    imports: [
        DividerModule,
        CommonModule,
        ButtonModule,
        QRCodeModule,
        AdminBuildingPhotosComponent,
    ],
})
export class AdminMapviewBuildingdetailsComponent implements OnInit {
    zhicharBuildingId: number;

    building: BuildingDTO | null = null;

    parseBuildingFloors = PARSEBUILDINGFLOORS;
    constructor(
        private config: DynamicDialogConfig,
        private buildingDataService: BuildingDataService,
        private router: Router
    ) {
        this.zhicharBuildingId = this.config.data.zhicharBuildingId;
        if (!this.zhicharBuildingId) {
            console.warn(
                'Please supply buildingId: Admin Mapview Building Details Component'
            );
        }
        this.buildingDataService
            .GetOneByZhicharBuildingId(this.zhicharBuildingId)
            .subscribe({
                next: (res) => {
                    this.building = res;
                },
            });
    }

    ngOnInit() {}

    goToBuildingDetailedView() {
        this.router.navigate([
            `admin/master-properties/building/` + this.building.id,
        ]);
    }
}
