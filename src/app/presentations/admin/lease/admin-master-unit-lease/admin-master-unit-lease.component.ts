import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { TabViewChangeEvent, TabViewModule } from 'primeng/tabview';
import { AdminUnitLeaseListingsComponent } from '../listings/units/admin-unit-lease-listings/admin-unit-lease-listings.component';
import { AdminUnitLeasePaymentStatusComponent } from '../payment-statuses/admin-unit-lease-payment-status/admin-unit-lease-payment-status.component';
import { AdminUnitLeaseActiveListingsComponent } from '../listings/units/admin-unit-lease-active-listings/admin-unit-lease-active-listings.component';
import { AdminUnitLeasePendingListingsComponent } from '../listings/units/admin-unit-lease-pending-listings/admin-unit-lease-pending-listings.component';
import { AdminUnitLeaseUpcomingExpirationListingsComponent } from '../listings/units/admin-unit-lease-upcoming-expiration-listings/admin-unit-lease-upcoming-expiration-listings.component';
import { ButtonModule } from 'primeng/button';
import { AdminMasterLeaseTabPreferenceService } from 'src/app/core/preferences/admin.master-lease.tab.selection.preferences';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-master-unit-lease',
    templateUrl: './admin-master-unit-lease.component.html',
    styleUrls: ['./admin-master-unit-lease.component.css'],
    standalone: true,
    imports: [
        TabViewModule,
        AdminUnitLeaseListingsComponent,
        AdminUnitLeasePaymentStatusComponent,
        AdminUnitLeaseActiveListingsComponent,
        AdminUnitLeasePendingListingsComponent,
        AdminUnitLeaseUpcomingExpirationListingsComponent,
        ButtonModule,
    ],
})
export class AdminMasterUnitLeaseComponent implements OnInit {
    refreshEvent = new EventEmitter<void>();
    activeIndex: number;

    constructor(
        private adminMasterLeaseTabSelectionPreferenceService: AdminMasterLeaseTabPreferenceService,
        private router: Router
    ) {}

    ngOnInit() {
        this.adminMasterLeaseTabSelectionPreferenceService.adminUnitLeaseSelectedTabIndex$.subscribe(
            (tabIndex) => {
                this.activeIndex = tabIndex;
            }
        );
    }

    goToLeaseBuilder() {
        this.router.navigate(['admin/master-lease/create/property']);
    }

    handleTabChange(event: TabViewChangeEvent) {
        this.adminMasterLeaseTabSelectionPreferenceService.updateAdminUnitLeaseSelectedTab(
            event.index
        );
    }
}
