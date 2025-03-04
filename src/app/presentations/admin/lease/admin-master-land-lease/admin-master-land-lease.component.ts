import { Component, EventEmitter, OnInit } from '@angular/core';
import { TabViewChangeEvent, TabViewModule } from 'primeng/tabview';
import { AdminLandLeaseListingsComponent } from '../listings/plots/admin-land-lease-listings/admin-land-lease-listings.component';
import { AdminLandLeasePaymentStatusComponent } from '../payment-statuses/admin-land-lease-payment-status/admin-land-lease-payment-status.component';
import { ButtonModule } from 'primeng/button';
import { AdminLandLeaseActiveListingsComponent } from '../listings/plots/admin-land-lease-active-listings/admin-land-lease-active-listings.component';
import { AdminLandLeasePendingListingsComponent } from '../listings/plots/admin-land-lease-pending-listings/admin-land-lease-pending-listings.component';
import { AdminLandLeaseUpcomingExpirationListingsComponent } from '../listings/plots/admin-land-lease-upcoming-expiration-listings/admin-land-lease-upcoming-expiration-listings.component';
import { AdminMasterLeaseTabPreferenceService } from 'src/app/core/preferences/admin.master-lease.tab.selection.preferences';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-master-land-lease',
    templateUrl: './admin-master-land-lease.component.html',
    styleUrls: ['./admin-master-land-lease.component.css'],
    standalone: true,
    imports: [
        TabViewModule,
        AdminLandLeaseListingsComponent,
        AdminLandLeasePaymentStatusComponent,
        ButtonModule,
        AdminLandLeaseActiveListingsComponent,
        AdminLandLeasePendingListingsComponent,
        AdminLandLeaseUpcomingExpirationListingsComponent,
    ],
})
export class AdminMasterLandLeaseComponent implements OnInit {
    refreshEvent = new EventEmitter<void>();
    activeIndex: number;

    constructor(
        private adminMasterLeaseTabSelectionPreferenceService: AdminMasterLeaseTabPreferenceService,
        private router: Router
    ) {}

    ngOnInit() {
        this.adminMasterLeaseTabSelectionPreferenceService.adminLandLeaseSelectedTabIndex$.subscribe(
            (tabIndex) => {
                this.activeIndex = tabIndex;
            }
        );
    }

    goToLeaseBuilder() {
        this.router.navigate(['admin/master-lease/create/property']);
    }

    handleTabChange(event: TabViewChangeEvent) {
        this.adminMasterLeaseTabSelectionPreferenceService.updateAdminLandLeaseSelectedTab(
            event.index
        );
    }
}
