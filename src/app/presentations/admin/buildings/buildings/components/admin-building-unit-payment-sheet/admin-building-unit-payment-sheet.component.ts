import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { UnitDataService } from 'src/app/core/dataservice/units/unit.dataservice';
import { UnitDTO } from 'src/app/core/dto/units/unit.dto';
import { AdminBuildingUnitPaymentDetailsComponent } from '../admin-building-unit-payment-details/admin-building-unit-payment-details.component';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { HttpClient } from '@angular/common/http';
import { API_URL } from 'src/app/core/constants/constants';
import { AdminGenerateBuildingPaymentAdviceComponent } from 'src/app/presentations/admin/payment/admin-generate-building-payment-advice/admin-generate-building-payment-advice.component';
import { ViewPaymentAdviceComponent } from 'src/app/presentations/admin/transactions/shared-components/view-payment-advice/view-payment-advice.component';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';

@Component({
    selector: 'app-admin-building-unit-payment-sheet',
    templateUrl: './admin-building-unit-payment-sheet.component.html',
    styleUrls: ['./admin-building-unit-payment-sheet.component.scss'],
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
    ],
    providers: [DialogService],
})
export class AdminBuildingUnitPaymentSheetComponent implements OnInit {
    ref: DynamicDialogRef;
    @Input({ required: true }) buildingId: number;
    year: Date | undefined = new Date();
    showLoading: boolean = false;
    unitsWithPA: UnitDTO[] = [];

    totalPending: number = 0;
    vacantUnitCount: number = 0;

    excelDownLoadLink: string;

    constructor(
        private unitDataService: UnitDataService,
        private daialogService: DialogService,
        private paDataService: PaymentAdviceDataService,
        private http: HttpClient,
        private dialogService: DialogService
    ) {}

    ngOnInit() {
        this.excelDownLoadLink = `${API_URL}/payment-advice/pending/report/building/${this.buildingId}`;
        this.paDataService
            .GetPaymentAdivicesByBuildingUnitsByYear(
                this.buildingId,
                this.year.getFullYear()
            )
            .subscribe({
                next: (res) => {
                    this.unitsWithPA = res;
                    console.log(res, 'UNITS WITH PA');
                    if (res) {
                        for (const unit of res) {
                            console.log(unit);
                            if (!unit.activeLeaseAgreement) {
                                this.vacantUnitCount++;
                            }
                            for (const advice of unit.paymentAdvices) {
                                if (advice && advice.status === 'DUE') {
                                    this.totalPending += advice.totalAmount;
                                }
                            }
                        }
                    }
                },
                error: (err) => {
                    console.log(err);
                },
            });
    }

    fetchPaymentData() {
        this.showLoading = true;
        setTimeout(() => {
            this.showLoading = false;
        }, 2000);
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

    generateBuildingPA() {
        this.ref = this.dialogService.open(
            AdminGenerateBuildingPaymentAdviceComponent,
            {
                header: 'Generate PA for Building ID: ' + this.buildingId,
                data: {
                    buildingId: this.buildingId,
                },
            }
        );
    }
}
