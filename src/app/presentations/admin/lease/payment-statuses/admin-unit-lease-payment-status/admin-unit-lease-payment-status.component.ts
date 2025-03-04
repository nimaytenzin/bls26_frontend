import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { API_URL } from 'src/app/core/constants/constants';
import { LEASESTATUS } from 'src/app/core/constants/enums';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import {
    LandLeasePaymentStatusDTO,
    LeaseAgreeementDTO,
    UnitLeasePaymentStatusDTO,
} from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { UnitDataService } from 'src/app/core/dataservice/units/unit.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { UnitDTO } from 'src/app/core/dto/units/unit.dto';
import { AdminGenerateLandLeasePaymentAdviceComponent } from '../../../payment/admin-generate-land-lease-payment-advice/admin-generate-land-lease-payment-advice.component';
import { ViewPaymentAdviceComponent } from '../../../transactions/shared-components/view-payment-advice/view-payment-advice.component';
import { AdminGenerateUnitLeasePaymentAdviceComponent } from '../../../payment/admin-generate-unit-lease-payment-advice/admin-generate-unit-lease-payment-advice.component';
import { TooltipModule } from 'primeng/tooltip';
import { PaymentReceiptDTO } from 'src/app/core/dto/payments/payment-receipt-dto';
import { AdminViewPaymentReceiptModalComponent } from '../../../transactions/shared-components/admin-view-payment-receipt-modal/admin-view-payment-receipt-modal.component';

@Component({
    selector: 'app-admin-unit-lease-payment-status',
    templateUrl: './admin-unit-lease-payment-status.component.html',
    styleUrls: ['./admin-unit-lease-payment-status.component.css'],
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
        TooltipModule,
    ],
    providers: [DialogService],
})
export class AdminUnitLeasePaymentStatusComponent implements OnInit {
    ref: DynamicDialogRef;
    buildingId: number = 9;
    year: Date | undefined = new Date();
    showLoading: boolean = false;
    unitsWithPA: UnitDTO[] = [];

    totalPending: number = 0;
    vacantUnitCount: number = 0;

    excelDownLoadLink: string;

    unitLeasePaymentStatus: UnitLeasePaymentStatusDTO[];

    constructor(
        private unitDataService: UnitDataService,
        private daialogService: DialogService,
        private paDataService: PaymentAdviceDataService,
        private leaseAgreementDataService: LeaseAgreementDataService,
        private http: HttpClient,
        private dialogService: DialogService,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit() {
        this.excelDownLoadLink = `${API_URL}/payment-advice/pending/report/building/${this.buildingId}`;

        this.getUniLeasePaymentStatus();
    }

    goToTenantDetailedView(tenantId: number) {
        this.router.navigate([`/admin/master-users/tenant/${tenantId}`]);
    }

    getUniLeasePaymentStatus() {
        this.leaseAgreementDataService
            .findUnitLeasePaymentStatusByAdminAndYear(
                this.authService.GetCurrentRole().adminId,
                this.year.getFullYear()
            )
            .subscribe((res) => {
                console.log(res, 'Payment status');
                this.unitLeasePaymentStatus = res;
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
            .findUnitLeasePaymentStatusByAdminAndYear(
                this.authService.GetCurrentRole().adminId,
                this.year.getFullYear()
            )
            .subscribe((res) => {
                setTimeout(() => {
                    this.showLoading = false;
                }, 1);
                this.unitLeasePaymentStatus = res;
            });
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
        this.ref.onClose.subscribe((res) => {
            if (res && res.status) {
                this.fetchPaymentData();
            }
        });
    }

    openPRDetails(paymentReceipts: PaymentReceiptDTO[]) {
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

    generatePaymentAdvice() {
        this.ref = this.dialogService.open(
            AdminGenerateUnitLeasePaymentAdviceComponent,
            {
                header: 'Generate PA',
            }
        );
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 200) {
                this.getUniLeasePaymentStatus();
            }
        });
    }
}
