import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TenantPaymentsComponent } from './tenant-payments.component';

const routes: Routes = [
    {
        path: '',
        component: TenantPaymentsComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TenantPaymentsRoutingModule {}
