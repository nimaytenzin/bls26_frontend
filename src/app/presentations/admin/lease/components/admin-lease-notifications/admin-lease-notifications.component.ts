import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { PageEvent, ROWSPERPAGEOPTION } from 'src/app/core/constants/constants';
import { LEASESTATUS, NOTIFICATIONTYPES } from 'src/app/core/constants/enums';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';
import {
    NotificationChannelStatusEnum,
    NotificationResponseDTO,
} from 'src/app/core/dataservice/notification/notification.dto';
import {
    NotificationDTO,
    NotificationService,
} from 'src/app/core/dataservice/notification/notification.service';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';

@Component({
    selector: 'app-admin-lease-notifications',
    templateUrl: './admin-lease-notifications.component.html',
    styleUrls: ['./admin-lease-notifications.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        PaginatorModule,
        TableModule,
        DividerModule,
        ConfirmDialogModule,
        ButtonModule,
    ],
    providers: [ConfirmationService],
})
export class AdminLeaseNotificationsComponent implements OnInit {
    @Input({ required: true }) leaseAgreement: LeaseAgreeementDTO;

    paginatedNotifications: PaginatedData<NotificationDTO> = {
        firstPage: 0,
        currentPage: 0,
        previousPage: 0,
        nextPage: 0,
        lastPage: 0,
        limit: 0,
        count: 0,
        data: [],
    };
    rowsPerPageOptions = ROWSPERPAGEOPTION;
    firstPageNumber = 0;
    rows = ROWSPERPAGEOPTION[0];
    currentPage = 0;

    NOTIFICATIONCHANNELSTATUS = NotificationChannelStatusEnum;

    showNotificationButtons: boolean = true;

    constructor(
        private notificationService: NotificationService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.handlePagination();
        if (
            this.leaseAgreement.status === LEASESTATUS.ACTIVE ||
            this.leaseAgreement.status === LEASESTATUS.UPCOMING_EXPIRATION ||
            this.leaseAgreement.status === LEASESTATUS.PENDING
        ) {
            this.showNotificationButtons = true;
        } else {
            this.showNotificationButtons = false;
        }
    }

    notifyEntryDamageReportSubmission() {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Notify Entry Damage Report Submission?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptIcon: 'none',
            rejectIcon: 'none',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.notificationService
                    .SendNotification({
                        fromUserId: this.authService.GetCurrentRole().adminId,
                        toUserId: this.leaseAgreement.tenantId,
                        notificationType:
                            NOTIFICATIONTYPES.ENTRYDAMAGEREPORT_SUBMISSION_REMINDER,
                        leaseAgreementId: this.leaseAgreement.id,
                    })
                    .subscribe({
                        next: (res) => {
                            this.messageService.add({
                                severity: 'info',
                                summary: 'Success',
                                detail: 'Notification Reminder Sent',
                            });
                            this.handlePagination();
                        },
                    });
            },
        });
    }
    notifyLeaseSigning() {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Notify Tenant to sign the lease agreement?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptIcon: 'none',
            rejectIcon: 'none',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.notificationService
                    .SendNotification({
                        fromUserId: this.authService.GetCurrentRole().adminId,
                        toUserId: this.leaseAgreement.tenantId,
                        notificationType:
                            NOTIFICATIONTYPES.LEASE_SIGNING_REMINDER,
                        leaseAgreementId: this.leaseAgreement.id,
                    })
                    .subscribe({
                        next: (res) => {
                            this.messageService.add({
                                severity: 'info',
                                summary: 'Success',
                                detail: 'Notification Reminder Sent',
                            });
                            this.handlePagination();
                        },
                    });
            },
        });
    }
    notifySecurityDepositPayment() {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Notify Tenant to deposit the security deposit amount?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptIcon: 'none',
            rejectIcon: 'none',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.notificationService
                    .SendNotification({
                        fromUserId: this.authService.GetCurrentRole().adminId,
                        toUserId: this.leaseAgreement.tenantId,
                        notificationType:
                            NOTIFICATIONTYPES.SECUTIRYDEPOSIT_PAYMENT_REMINDER,
                        leaseAgreementId: this.leaseAgreement.id,
                    })
                    .subscribe({
                        next: (res) => {
                            this.messageService.add({
                                severity: 'info',
                                summary: 'Success',
                                detail: 'Notification Reminder Sent',
                            });
                            this.handlePagination();
                        },
                    });
            },
        });
    }

    getStatusObject(statusString: string): NotificationResponseDTO {
        return JSON.parse(statusString);
    }

    onPageChange(event: PageEvent): void {
        this.firstPageNumber = event.first;
        this.currentPage = event.page;
        this.rows = event.rows;
        this.handlePagination();
    }

    private handlePagination(): void {
        const queryParams: any = {
            pageNo: this.currentPage,
            pageSize: this.rows,
        };

        this.notificationService
            .GetAllNotificationsByLeaseAgreementPaginated(
                this.leaseAgreement.id,
                queryParams
            )
            .subscribe((res) => {
                this.paginatedNotifications = res;
            });
    }
}
