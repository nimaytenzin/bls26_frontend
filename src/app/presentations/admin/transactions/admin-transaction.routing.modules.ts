import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminMasterTransactionsComponent } from './admin-master-transactions/admin-master-transactions.component';
import { AdminSearchPaymentAdviceComponent } from './admin-search-payment-advice/admin-search-payment-advice.component';
import { AdminPaymentAdviceRentMasterComponent } from './admin-payment-advice-rent-master/admin-payment-advice-rent-master.component';
import { AdminPaymentAdviceSecurityDepositMasterComponent } from './admin-payment-advice-security-deposit-master/admin-payment-advice-security-deposit-master.component';
import { AdminMasterTransactionsLandRentComponent } from './land/admin-master-transactions-land-rent/admin-master-transactions-land-rent.component';
import { AdminMasterTransactionsLandSecurityDepositsComponent } from './land/admin-master-transactions-land-security-deposits/admin-master-transactions-land-security-deposits.component';
import { AdminMasterTransactionsBuildingRentComponent } from './building/admin-master-transactions-building-rent/admin-master-transactions-building-rent.component';
import { AdminMasterTransactionsBuildingSecurityDepositsComponent } from './building/admin-master-transactions-building-security-deposits/admin-master-transactions-building-security-deposits.component';

const routes: Routes = [
    {
        path: '',
        component: AdminMasterTransactionsComponent,
    },
    {
        path: 'land/rent',
        component: AdminMasterTransactionsLandRentComponent,
    },
    {
        path: 'land/security-deposits',
        component: AdminMasterTransactionsLandSecurityDepositsComponent,
    },
    {
        path: 'building/rent',
        component: AdminMasterTransactionsBuildingRentComponent,
    },
    {
        path: 'building/security-deposits',
        component: AdminMasterTransactionsBuildingSecurityDepositsComponent,
    },

    {
        path: 'search',
        component: AdminSearchPaymentAdviceComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AdminMasterTransactionRoutingModule {}
