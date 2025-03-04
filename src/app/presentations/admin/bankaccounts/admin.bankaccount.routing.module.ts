import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminBankAccountListComponent } from './admin-bank-account-list/admin-bank-account-list.component';

const routes: Routes = [
    {
        path: '',
        component: AdminBankAccountListComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AdminMasterBankAccountRoutingModule {}
