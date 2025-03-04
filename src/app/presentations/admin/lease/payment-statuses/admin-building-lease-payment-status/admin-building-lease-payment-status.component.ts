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
import { TooltipModule } from 'primeng/tooltip';
import { API_URL } from 'src/app/core/constants/constants';
import { LEASESTATUS } from 'src/app/core/constants/enums';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import {
    UnitLeasePaymentStatusDTO,
    LeaseAgreeementDTO,
    BuildingLeasePaymentStatusDTO,
} from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { UnitDataService } from 'src/app/core/dataservice/units/unit.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { UnitDTO } from 'src/app/core/dto/units/unit.dto';
import { AdminGenerateUnitLeasePaymentAdviceComponent } from '../../../payment/admin-generate-unit-lease-payment-advice/admin-generate-unit-lease-payment-advice.component';
import { ViewPaymentAdviceComponent } from '../../../transactions/shared-components/view-payment-advice/view-payment-advice.component';

@Component({
    selector: 'app-admin-building-lease-payment-status',
    templateUrl: './admin-building-lease-payment-status.component.html',
    styleUrls: ['./admin-building-lease-payment-status.component.css'],
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
export class AdminBuildingLeasePaymentStatusComponent implements OnInit {
    ref: DynamicDialogRef;
    buildingId: number = 9;
    year: Date | undefined = new Date();
    showLoading: boolean = false;
    unitsWithPA: UnitDTO[] = [];

    totalPending: number = 0;
    vacantUnitCount: number = 0;

    excelDownLoadLink: string;

    buildingLeasePaymentStatus: BuildingLeasePaymentStatusDTO[];

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
            .findBuildingLeasePaymentStatusByAdminAndYear(
                this.authService.GetCurrentRole().adminId,
                this.year.getFullYear()
            )
            .subscribe((res) => {
                console.log(res, 'Payment status');
                this.buildingLeasePaymentStatus = res;
            });
    }

    getStatusClass(status: LEASESTATUS): string {
        switch (status) {
            case LEASESTATUS.ACTIVE:
                return 'text-green-600 font-bold';
            case LEASESTATUS.UPCOMING_EXPIRATION:
                return 'text-yellow-600 font-bold';
            case LEASESTATUS.EXPIRED:
            case LEASESTATUS.CANCELLED:
            case LEASESTATUS.TERMINATED_BY_TENANT:
            case LEASESTATUS.TERMINATED_BY_OWNER:
                return 'text-red-600 font-bold';
            case LEASESTATUS.PENDING:
                return 'text-blue-600 font-bold';
            case LEASESTATUS.HOLDOVER:
                return 'text-orange-600 font-bold';
            case LEASESTATUS.SUSPENDED:
                return 'text-purple-600 font-bold';
            default:
                return 'text-gray-600'; // Default for any other or unknown statuses
        }
    }

    goToDetailedView(leaseAgreement: LeaseAgreeementDTO) {
        this.router.navigate([`/admin/master-lease/view/${leaseAgreement.id}`]);
    }
    fetchPaymentData() {
        this.showLoading = true;
        this.leaseAgreementDataService
            .findBuildingLeasePaymentStatusByAdminAndYear(
                this.authService.GetCurrentRole().adminId,
                this.year.getFullYear()
            )
            .subscribe((res) => {
                setTimeout(() => {
                    this.showLoading = false;
                }, 1);
                this.buildingLeasePaymentStatus = res;
            });
    }

    openPADetails(
        advices: PaymentAdviceDto[],
        leaseAgreement: LeaseAgreeementDTO
    ) {
        advices.forEach((item) => {
            item.leaseAgreement = leaseAgreement;
        });
        this.ref = this.daialogService.open(ViewPaymentAdviceComponent, {
            header: 'Details',
            data: advices,
        });
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
