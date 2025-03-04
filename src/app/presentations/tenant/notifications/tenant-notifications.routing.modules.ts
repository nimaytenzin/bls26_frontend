import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TenantNotificationsComponent } from './tenant-notifications.component';

const routes: Routes = [
    {
        path: '',
        component: TenantNotificationsComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TenantNotificationsRoutingModule {}
