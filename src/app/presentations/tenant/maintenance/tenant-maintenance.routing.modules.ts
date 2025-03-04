import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TenantMaintenanceComponent } from './tenant-maintenance.component';

const routes: Routes = [
    {
        path: '',
        component: TenantMaintenanceComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TenantMaintenanceRoutingModule {}
