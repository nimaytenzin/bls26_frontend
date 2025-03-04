import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { QRCodeModule } from 'angularx-qrcode';
import { MenuItem } from 'primeng/api';
import { TabViewChangeEvent, TabViewModule } from 'primeng/tabview';
import { BuildingDataService } from 'src/app/core/dataservice/building/building.dataservice';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { CommonModule } from '@angular/common';
import { GalleriaModule } from 'primeng/galleria';
import { PARSEBUILDINGFLOORS } from 'src/app/core/utility/helper.function';
import { ButtonModule } from 'primeng/button';
import { AdminListUnitsComponent } from '../../building-units/admin-list-units/admin-list-units.component';
import { AdminBuildingDetailsCardComponent } from '../components/admin-building-details-card/admin-building-details-card.component';
import { AdminBuildingSurchargesComponent } from '../components/admin-building-surcharges/admin-building-surcharges.component';
import { AdminBuildingRulesComponent } from '../components/admin-building-rules/admin-building-rules.component';
import { AdminBuildingOwnershipCardComponent } from '../components/admin-building-ownership-card/admin-building-ownership-card.component';
import { AdminBuildingAmenitiesComponent } from '../components/admin-building-amenities/admin-building-amenities.component';
import { AdminBuildingMapComponent } from '../components/admin-building-map/admin-building-map.component';
import { CarouselModule } from 'primeng/carousel';
import { AdminBuildingPhotosComponent } from '../components/admin-building-photos/admin-building-photos.component';
import { AdminBuildingPlotComponent } from '../components/admin-building-plot/admin-building-plot.component';
import { DividerModule } from 'primeng/divider';
import { TenantDTO } from 'src/app/core/dto/users/tenant.dto';
import { TenantDataService } from 'src/app/core/dataservice/users-and-auth/tenant.dataservice';
import { AdminBuildingTenantListingComponent } from '../components/admin-building-tenant-listing/admin-building-tenant-listing.component';
import { AdminBuildingUnitPaymentSheetComponent } from '../components/admin-building-unit-payment-sheet/admin-building-unit-payment-sheet.component';
import { AdminTabPreferenceService } from 'src/app/core/preferences/admin.tab.selection.preferences';

@Component({
    selector: 'app-admin-view-building',
    standalone: true,
    imports: [
        TabViewModule,
        QRCodeModule,
        CommonModule,
        GalleriaModule,
        ButtonModule,
        AdminListUnitsComponent,
        AdminBuildingDetailsCardComponent,
        AdminBuildingSurchargesComponent,
        AdminBuildingRulesComponent,
        RouterModule,
        AdminBuildingOwnershipCardComponent,
        AdminBuildingAmenitiesComponent,
        AdminBuildingMapComponent,
        CarouselModule,
        AdminBuildingPhotosComponent,
        AdminBuildingPlotComponent,
        DividerModule,
        AdminBuildingTenantListingComponent,
        AdminBuildingUnitPaymentSheetComponent,
    ],
    templateUrl: './admin-view-building.component.html',
    styleUrl: './admin-view-building.component.scss',
})
export class AdminViewBuildingComponent implements OnInit {
    buildingId: number;
    building: BuildingDTO = {} as BuildingDTO;
    responsiveOptions: any[] | undefined;
    tenants: TenantDTO[];
    activeIndex: number;

    constructor(
        private route: ActivatedRoute,
        private buildingDataService: BuildingDataService,
        private tenantDataService: TenantDataService,
        private adminTabSelectionPreferenceService: AdminTabPreferenceService
    ) {}
    ngOnInit(): void {
        this.adminTabSelectionPreferenceService.adminViewBuildingSelectedTabIndex$.subscribe(
            (tabIndex) => {
                this.activeIndex = tabIndex;
            }
        );

        this.buildingId = Number(
            this.route.snapshot.paramMap.get('buildingId')
        );
        this.getBuilding();

        this.tenantDataService
            .GetActiveTenantsByBuilding(this.buildingId)
            .subscribe((res) => {
                this.tenants = res;
                console.log(this.tenants);
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

    handleTabChange(event: TabViewChangeEvent) {
        this.adminTabSelectionPreferenceService.updateAdminViewBuildingSelectedTab(
            event.index
        );
    }

    getQr(val) {
        return val;
    }

    getBuilding() {
        this.buildingDataService
            .GetOneById(this.buildingId)
            .subscribe((res) => {
                this.building = res;
            });
    }
}
