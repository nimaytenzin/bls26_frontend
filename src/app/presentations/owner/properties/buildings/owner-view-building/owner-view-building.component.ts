import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TabViewModule } from 'primeng/tabview';
import { BuildingDataService } from 'src/app/core/dataservice/building/building.dataservice';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { OwnerBuildingSurchargeCardComponent } from './components/owner-building-surcharge-card/owner-building-surcharge-card.component';
import { OwnerBuildingRulesCardComponent } from './components/owner-building-rules-card/owner-building-rules-card.component';
import { OwnerBuildingDetailCardComponent } from './components/owner-building-detail-card/owner-building-detail-card.component';
import { OwnerBuildingAmenitiesCardComponent } from './components/owner-building-amenities-card/owner-building-amenities-card.component';
import { AdminBuildingPhotosComponent } from 'src/app/presentations/admin/buildings/buildings/components/admin-building-photos/admin-building-photos.component';

@Component({
    selector: 'app-owner-view-building',
    templateUrl: './owner-view-building.component.html',
    styleUrls: ['./owner-view-building.component.css'],
    standalone: true,
    imports: [
        TabViewModule,
        DividerModule,
        ButtonModule,
        RouterModule,
        OwnerBuildingSurchargeCardComponent,
        OwnerBuildingRulesCardComponent,
        OwnerBuildingDetailCardComponent,
        OwnerBuildingAmenitiesCardComponent,
        AdminBuildingPhotosComponent,
    ],
})
export class OwnerViewBuildingComponent implements OnInit {
    buildingId: number;
    building: BuildingDTO = {} as BuildingDTO;
    responsiveOptions: any[] | undefined;

    constructor(
        private route: ActivatedRoute,
        private buildingDataService: BuildingDataService
    ) {}
    ngOnInit(): void {
        this.buildingId = Number(
            this.route.snapshot.paramMap.get('buildingId')
        );

        this.buildingDataService
            .GetOneById(this.buildingId)
            .subscribe((res) => {
                this.building = res;
            });

        this.responsiveOptions = [
            {
                breakpoint: '1199px',
                numVisible: 1,
                numScroll: 1,
            },
            {
                breakpoint: '991px',
                numVisible: 1,
                numScroll: 1,
            },
            {
                breakpoint: '767px',
                numVisible: 1,
                numScroll: 1,
            },
        ];
    }

    getQr(val) {
        return val;
    }
}
