import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import { TenantActiveLeasecomponent } from './components/tenant-active-lease/tenant-active-lease.component';
import { TenantPendingPaymentComponent } from './components/tenant-pending-payments/tenant-pending-payments.component';
import { BadgeModule } from 'primeng/badge';
import { TenantDTO } from 'src/app/core/dto/users/tenant.dto';
import { TenantDataService } from 'src/app/core/dataservice/users-and-auth/tenant.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { DialogModule } from 'primeng/dialog';
import {
    DialogService,
    DynamicDialogModule,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { TenantUpdatePincodeComponent } from '../shared/tenant-update-pincode/tenant-update-pincode.component';
import { TenantPaymentReceiptComponent } from '../shared/tenant-payment-receipt/tenant-payment-receipt.component';
import { TenantPaymentPaidPaymentsComponent } from '../payments/components/tenant-payment-paid-payments/tenant-payment-paid-payments.component';

import { OverlayPanelModule } from 'primeng/overlaypanel';
import {
    API_URL,
    ZHIDHAYCONTACTDETAILS,
} from 'src/app/core/constants/constants';
import { TenantNotificationsSummaryComponent } from './components/tenant-notifications-summary/tenant-notifications-summary.component';
import { GETELAPSEDTIME } from 'src/app/core/utility/date.helper';
import { DividerModule } from 'primeng/divider';
import { TabViewModule } from 'primeng/tabview';
import { TenantTopbarComponent } from '../../layout/tenant/tenant-topbar/tenant-topbar.component';
import { TenantHeaderComponent } from '../../layout/tenant/tenant-header/tenant-header.component';
import { MessageService } from 'primeng/api';
import {
    NotificationDTO,
    NotificationService,
} from 'src/app/core/dataservice/notification/notification.service';
import { AuthenticatedUserDTO } from 'src/app/core/dataservice/users-and-auth/dto/auth.dto';

@Component({
    selector: 'app-tenant-dashboard',
    templateUrl: './tenant-dashboard.component.html',
    styleUrls: ['./tenant-dashboard.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TenantActiveLeasecomponent,
        TenantPendingPaymentComponent,
        BadgeModule,
        DynamicDialogModule,
        TenantPaymentReceiptComponent,
        TenantPaymentPaidPaymentsComponent,
        TenantNotificationsSummaryComponent,
        OverlayPanelModule,
        DialogModule,
        DividerModule,
        TabViewModule,
        TenantHeaderComponent,
    ],
    providers: [DialogService],
})
export class TenantDashboardComponent implements OnInit {
    ref: DynamicDialogRef;
    tenantDetails: TenantDTO;
    authenticatedUser: AuthenticatedUserDTO;
    profileUri: string;
    apiUrl = API_URL;

    getElapsedTime = GETELAPSEDTIME;
    showUpdatePinModal: boolean = false;
    notifications: NotificationDTO[] = [];
    unReadNotifications: NotificationDTO[] = [];
    unReadNotificationExists: boolean = false;
    zhidhayContactDetails = ZHIDHAYCONTACTDETAILS;
    constructor(
        private tenantDataService: TenantDataService,
        private authService: AuthService,
        private dialogService: DialogService,
        private notificationService: NotificationService,
        private messageService: MessageService
    ) {
        this.authenticatedUser = this.authService.GetAuthenticatedUser();
        console.log(this.authenticatedUser);
        if (!this.authenticatedUser.isVerified) {
            this.showUpdatePinDialog();
        }

        this.getAndCheckNotifications();
    }

    ngOnInit() {}

    ngOnDestroy() {}

    getAndCheckNotifications() {
        this.notificationService
            .GetNotificationsByTenant(this.authenticatedUser.userAuthId)
            .subscribe({
                next: (res) => {
                    this.notifications = res;
                    for (const item of this.notifications) {
                        if (!item.isRead) {
                            this.unReadNotificationExists = true;
                            this.unReadNotifications.push(item);
                        } else {
                            this.unReadNotificationExists = false;
                        }
                    }
                },
            });
    }
    showUpdatePinDialog() {
        this.ref = this.dialogService.open(TenantUpdatePincodeComponent, {
            header: 'update pin',
            closable: false,
        });
    }

    markAsRead(item: NotificationDTO) {
        this.notificationService
            .MarkNotificationAsRead(item.id)
            .subscribe((res) => {
                this.getAndCheckNotifications();
            });
    }
}
