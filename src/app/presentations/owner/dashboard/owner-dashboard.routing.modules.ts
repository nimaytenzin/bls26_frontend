import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OwnerDashbordComponent } from './owner-dashbord.component';

const routes: Routes = [
    {
        path: '',
        component: OwnerDashbordComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class OwnerDashboardRoutingModule {}
