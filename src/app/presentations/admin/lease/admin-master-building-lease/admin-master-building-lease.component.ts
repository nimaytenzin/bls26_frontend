import { Component, EventEmitter, OnInit } from '@angular/core';
import { TabViewChangeEvent, TabViewModule } from 'primeng/tabview';
import { AdminBuildingLeaseListingsComponent } from '../listings/buildings/admin-building-lease-listings/admin-building-lease-listings.component';
import { ButtonModule } from 'primeng/button';
import { AdminMasterLeaseTabPreferenceService } from 'src/app/core/preferences/admin.master-lease.tab.selection.preferences';
import { AdminBuildingLeaseActiveListingsComponent } from '../listings/buildings/admin-building-lease-active-listings/admin-building-lease-active-listings.component';
import { AdminBuildingLeasePendingListingsComponent } from '../listings/buildings/admin-building-lease-pending-listings/admin-building-lease-pending-listings.component';
import { AdminBuildingLeaseUpcomingExpirationListingsComponent } from '../listings/buildings/admin-building-lease-upcoming-expiration-listings/admin-building-lease-upcoming-expiration-listings.component';
import { AdminBuildingLeasePaymentStatusComponent } from '../payment-statuses/admin-building-lease-payment-status/admin-building-lease-payment-status.component';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-master-building-lease',
    templateUrl: './admin-master-building-lease.component.html',
    styleUrls: ['./admin-master-building-lease.component.css'],
    standalone: true,
    imports: [
        TabViewModule,
        AdminBuildingLeaseListingsComponent,
        ButtonModule,
        AdminBuildingLeaseActiveListingsComponent,
        AdminBuildingLeasePendingListingsComponent,
        AdminBuildingLeaseUpcomingExpirationListingsComponent,
        AdminBuildingLeasePaymentStatusComponent,
    ],
})
export class AdminMasterBuildingLeaseComponent implements OnInit {
    refreshEvent = new EventEmitter<void>();
    activeIndex: number;

    constructor(
        private router: Router,
        private adminMasterLeaseTabSelectionPreferenceService: AdminMasterLeaseTabPreferenceService
    ) {}

    ngOnInit() {
        this.adminMasterLeaseTabSelectionPreferenceService.adminBuildingLeaseSelectedTabIndex$.subscribe(
            (tabIndex) => {
                this.activeIndex = tabIndex;
            }
        );
    }

    goToLeaseBuilder() {
        this.router.navigate(['admin/master-lease/create/property']);
    }
    handleTabChange(event: TabViewChangeEvent) {
        this.adminMasterLeaseTabSelectionPreferenceService.updateAdminBuildingLeaseSelectedTab(
            event.index
        );
    }
}
