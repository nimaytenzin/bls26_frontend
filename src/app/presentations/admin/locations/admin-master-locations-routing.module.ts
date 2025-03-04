import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminMasterDzongkhagsComponent } from './admin-master-dzongkhags/admin-master-dzongkhags.component';
import { AdminMasterAdministrativeZonesComponent } from './admin-master-administrative-zones/admin-master-administrative-zones.component';
import { AdminMasterSubadministrativeZonesComponent } from './admin-master-subadministrative-zones/admin-master-subadministrative-zones.component';

const routes: Routes = [
    { path: 'dzongkhags', component: AdminMasterDzongkhagsComponent },
    {
        path: 'adm-zones',
        component: AdminMasterAdministrativeZonesComponent,
    },
    {
        path: 'subadm-zones',
        component: AdminMasterSubadministrativeZonesComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AdminMasterPropertiesRoutingModule {}
