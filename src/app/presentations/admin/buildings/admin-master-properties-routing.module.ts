import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminViewBuildingComponent } from './buildings/admin-view-building/admin-view-building.component';
import { AdminListBuildingsComponent } from './buildings/admin-list-buildings/admin-list-buildings.component';
import { AdminViewUnitComponent } from './building-units/admin-view-unit/admin-view-unit.component';
import { AdminMasterPropertiesComponent } from './admin-master-properties.component';
import { AdminListUnitsComponent } from './building-units/admin-list-units/admin-list-units.component';
import { AdminPropertiesMapViewComponent } from '../mapview/admin-properties-map-view/admin-properties-map-view.component';
import { AdminThramListingsComponent } from '../land/thrams/admin-thram-listings/admin-thram-listings.component';
import { AdminPlotsListingComponent } from '../land/plots/admin-plots-listing/admin-plots-listing.component';
import { AdminAllUnitListingComponent } from '../units/admin-all-unit-listing/admin-all-unit-listing.component';
import { AdminPropertySearchComponent } from '../land/shared/admin-property-search/admin-property-search.component';
import { AdminPlotDetailedViewComponent } from '../land/plots/admin-plot-detailed-view/admin-plot-detailed-view.component';

const routes: Routes = [
    {
        path: '',
        component: AdminMasterPropertiesComponent,
        children: [
            {
                path: 'thrams',
                component: AdminThramListingsComponent,
            },
            {
                path: 'plots',
                component: AdminPlotsListingComponent,
            },
            {
                path: 'plot/:plotDatabaseId',
                component: AdminPlotDetailedViewComponent,
            },
            {
                path: 'map-view',
                component: AdminPropertiesMapViewComponent,
            },
            {
                path: 'search',
                component: AdminPropertySearchComponent,
            },

            {
                path: 'list-buildings',
                component: AdminListBuildingsComponent,
            },
            {
                path: 'building/:buildingId',
                component: AdminViewBuildingComponent,
                children: [
                    {
                        path: '',
                        component: AdminListUnitsComponent,
                    },

                    { path: 'unit/:unitId', component: AdminViewUnitComponent },
                ],
            },
            {
                path: 'units',
                component: AdminAllUnitListingComponent,
            },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AdminMasterPropertiesRoutingModule {}
