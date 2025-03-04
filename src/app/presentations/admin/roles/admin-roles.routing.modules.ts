import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminRoleListingComponent } from './admin-role-listing/admin-role-listing.component';

const routes: Routes = [
    {
        path: '',
        component: AdminRoleListingComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AdminMasterRolesRoutingModule {}
