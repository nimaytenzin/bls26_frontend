import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TenantLeaseComponent } from './tenant-lease.component';

const routes: Routes = [
    {
        path: '',
        component: TenantLeaseComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TenantLeaseRoutingModule {}
