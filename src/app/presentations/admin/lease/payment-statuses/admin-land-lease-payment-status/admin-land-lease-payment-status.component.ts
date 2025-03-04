import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { API_URL } from 'src/app/core/constants/constants';
import {
    LandLeasePaymentStatusDTO,
    LeaseAgreeementDTO,
} from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { UnitDataService } from 'src/app/core/dataservice/units/unit.dataservice';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { UnitDTO } from 'src/app/core/dto/units/unit.dto';
import { AdminGenerateBuildingPaymentAdviceComponent } from '../../../payment/admin-generate-building-payment-advice/admin-generate-building-payment-advice.component';
import { ViewPaymentAdviceComponent } from '../../../transactions/shared-components/view-payment-advice/view-payment-advice.component';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { AdminGenerateLandLeasePaymentAdviceComponent } from '../../../payment/admin-generate-land-lease-payment-advice/admin-generate-land-lease-payment-advice.component';
import { LEASESTATUS } from 'src/app/core/constants/enums';
import { Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NotificationService } from 'src/app/core/dataservice/notification/notification.service';
import { AdminViewPaymentReceiptModalComponent } from '../../../transactions/shared-components/admin-view-payment-receipt-modal/admin-view-payment-receipt-modal.component';
import { PaymentReceiptDTO } from 'src/app/core/dto/payments/payment-receipt-dto';

@Component({
    selector: 'app-admin-land-lease-payment-status',
    templateUrl: './admin-land-lease-payment-status.component.html',
    styleUrls: ['./admin-land-lease-payment-status.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        CalendarModule,
        FormsModule,
        DialogModule,
        ProgressSpinnerModule,
        DividerModule,
        ConfirmDialogModule,
        TooltipModule,
    ],
    providers: [DialogService, ConfirmationService],
})
export class AdminLandLeasePaymentStatusComponent implements OnInit {
    ref: DynamicDialogRef;
    buildingId: number = 9;
    year: Date | undefined = new Date();
    showLoading: boolean = false;
    unitsWithPA: UnitDTO[] = [];

    totalPending: number = 0;
    vacantUnitCount: number = 0;

    excelDownLoadLink: string;

    landLeasePaymentStatus: LandLeasePaymentStatusDTO[];

    constructor(
        private unitDataService: UnitDataService,
        private daialogService: DialogService,
        private paDataService: PaymentAdviceDataService,
        private leaseAgreementDataService: LeaseAgreementDataService,
        private http: HttpClient,
        private dialogService: DialogService,
        private authService: AuthService,
        private router: Router,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private notificationService: NotificationService
    ) {}

    ngOnInit() {
        this.excelDownLoadLink = `${API_URL}/payment-advice/pending/report/building/${this.buildingId}`;

        this.getLandLeasePaymentStatus();
    }

    getLandLeasePaymentStatus() {
        this.leaseAgreementDataService
            .findLandLeasePaymentStatusByAdminAndYear(
                this.authService.GetCurrentRole().adminId,
                this.year.getFullYear()
            )
            .subscribe((res) => {
                console.log(res, 'Payment status');
                this.landLeasePaymentStatus = res;
            });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case LEASESTATUS.PENDING:
                return 'bg-red-100 text-red-700 px-1';
            case LEASESTATUS.ACTIVE:
                return 'bg-green-600 text-gray-100 px-1';
            case LEASESTATUS.UPCOMING_EXPIRATION:
                return 'bg-yellow-600 text-gray-100 px-1';
            default:
                return 'bg-gray-100 text-gray-700 px-1';
        }
    }

    getStatusName(status: string): string {
        switch (status) {
            case LEASESTATUS.PENDING:
                return 'Pending';
            case LEASESTATUS.ACTIVE:
                return 'Active';
            case LEASESTATUS.UPCOMING_EXPIRATION:
                return 'Expiring';
            default:
                return 'Terminated';
        }
    }

    goToDetailedView(leaseAgreement: LeaseAgreeementDTO) {
        this.router.navigate([`/admin/master-lease/view/${leaseAgreement.id}`]);
    }
    fetchPaymentData() {
        this.showLoading = true;

        this.leaseAgreementDataService
            .findLandLeasePaymentStatusByAdminAndYear(
                this.authService.GetCurrentRole().adminId,
                this.year.getFullYear()
            )
            .subscribe((res) => {
                this.landLeasePaymentStatus = res;
                setTimeout(() => {
                    this.showLoading = false;
                }, 1);
            });
    }

    goToTenantDetailedView(tenantId: number) {
        this.router.navigate([`/admin/master-users/tenant/${tenantId}`]);
    }

    openPADetails(
        advices: PaymentAdviceDto[],
        leaseAgreement: LeaseAgreeementDTO
    ) {
        console.log(advices, leaseAgreement);
        advices.forEach((item) => {
            item.leaseAgreement = leaseAgreement;
        });
        this.ref = this.daialogService.open(ViewPaymentAdviceComponent, {
            header: 'Advice',
            data: advices,
        });
    }
    openPRDetails(paymentReceipts: PaymentReceiptDTO[]) {
        console.log(paymentReceipts);
        this.ref = this.daialogService.open(
            AdminViewPaymentReceiptModalComponent,
            {
                header: 'Receipt',
                data: {
                    paymentReceiptId: paymentReceipts[0].id,
                },
            }
        );
    }

    generateBuildingPA() {
        this.ref = this.dialogService.open(
            AdminGenerateLandLeasePaymentAdviceComponent,
            {
                header: 'Generate PA',
            }
        );
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 200) {
                this.getLandLeasePaymentStatus();
            }
        });
    }

    sendLandLeasePaymentStatusReminder() {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Send  Reminder to all pending Payments?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptIcon: 'none',
            rejectIcon: 'none',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succss',
                    detail: 'Payment Reminder Sent',
                });
            },
        });
    }
}
