import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OwnerListBuildingsComponent } from './buildings/owner-list-buildings/owner-list-buildings.component';
import { OwnerViewBuildingComponent } from './buildings/owner-view-building/owner-view-building.component';
import { OwnerListUnitsByBuildingComponent } from './units/owner-list-units-by-building/owner-list-units-by-building.component';
import { OwnerViewUnitComponent } from './units/owner-view-unit/owner-view-unit.component';

const routes: Routes = [
    {
        path: '',
        component: OwnerListBuildingsComponent,
    },
    {
        path: 'building/:buildingId',
        component: OwnerViewBuildingComponent,
        children: [
            {
                path: '',
                component: OwnerListUnitsByBuildingComponent,
            },

            { path: 'unit/:unitId', component: OwnerViewUnitComponent },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class OwnerPropertiesRoutingModule {}
