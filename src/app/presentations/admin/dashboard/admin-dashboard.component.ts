import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { BuildingDataService } from 'src/app/core/dataservice/building/building.dataservice';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { StatsDataService } from 'src/app/core/dataservice/statistics/statistics.dataservice';
import { AdminSummaryStatisticsDTO } from 'src/app/core/dataservice/statistics/statistics.dto';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import {
    PaymentAdviceDto,
    PaymentAdviceSummaryDTO,
} from 'src/app/core/dto/payments/payment-advice.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { PARSEBUILDINGFLOORS } from 'src/app/core/utility/helper.function';

import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { GalleriaModule } from 'primeng/galleria';
import { MeterGroupModule } from 'primeng/metergroup';
import { TabViewModule } from 'primeng/tabview';
import { AdminDashboardBroadcastSmsComponent } from './components/admin-dashboard-broadcast-sms/admin-dashboard-broadcast-sms.component';
import { AuthenticatedUserDTO } from 'src/app/core/dataservice/users-and-auth/dto/auth.dto';
import { AdminDashboardLeaseActionSummaryComponent } from './components/admin-dashboard-lease-action-summary/admin-dashboard-lease-action-summary.component';
import { Router } from '@angular/router';
import { ToWords } from 'to-words';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
    selector: 'app-admin-dashboard',
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        GalleriaModule,
        MeterGroupModule,
        DividerModule,
        TabViewModule,
        ProgressBarModule,

        AdminDashboardLeaseActionSummaryComponent,
        TooltipModule,
    ],
    providers: [DialogService],
})
export class AdminDashboardComponent implements OnInit {
    ref: DynamicDialogRef;

    buildings: BuildingDTO[] = [];
    getBuildingFloorConfiguration = PARSEBUILDINGFLOORS;
    expiringLeaseAgreements = [];

    summaryStats: AdminSummaryStatisticsDTO = {
        buildingCount: 0,
        unitCount: 0,
        activeLeaseCount: 0,
        totalRentalIncome: 0,
        pendingPaymentAmount: 0,
        thramCount: 0,
        plotCount: 0,
        pendingPaymentAdviceCount: 0,
        ownerCount: 0,
    };

    paymentSummaryStats: PaymentAdviceSummaryDTO = {
        totalMonthlyRentalIncome: 0,
        totalSecurityDepositAmount: 0,
        totalPendingRentalAmount: 0,
        totalPendingSecurityDepositAmount: 0,
    };

    totalPending: number = 0;
    authenticatedUser: AuthenticatedUserDTO;

    payments: PaymentAdviceDto[] = [];

    constructor(
        private buildingDataService: BuildingDataService,
        private statsService: StatsDataService,
        private paymentAdviceService: PaymentAdviceDataService,
        private dialogService: DialogService,
        private cdr: ChangeDetectorRef,
        private authService: AuthService,
        private router: Router,
        private paymentAdviceDataService: PaymentAdviceDataService
    ) {}

    ngOnInit() {
        this.authenticatedUser = this.authService.GetAuthenticatedUser();

        this.statsService
            .GetSummaryStatsByAdmin(this.authService.GetCurrentRole().adminId)
            .subscribe({
                next: (res) => {
                    console.log('SUMARY STATS', res);
                    this.summaryStats = res;
                },
            });
        this.getPaymentsSummary();
    }

    getPaymentsSummary() {
        this.paymentAdviceDataService
            .GetPaymentAdviceSummaryByAdmin(
                this.authService.GetCurrentRole().adminId
            )
            .subscribe({
                next: (res) => {
                    this.paymentSummaryStats = res;
                },
            });
    }

    roundUp(number: number) {
        return Math.ceil(number);
    }
    ngAfterViewChecked() {
        this.cdr.detectChanges();
    }

    openBroadcastSmsModal() {
        this.ref = this.dialogService.open(
            AdminDashboardBroadcastSmsComponent,
            {
                header: 'Broadcast SMS',
                data: {},
            }
        );
    }

    goToPayments() {
        this.router.navigate(['/admin/master-transactions']);
    }
    goToMapView() {
        this.router.navigate(['/admin/master-properties/map-view']);
    }

    getWords(number: number) {
        const toWords = new ToWords({
            localeCode: 'en-IN',
            converterOptions: {
                currency: true,
                ignoreDecimal: false,
                ignoreZeroCurrency: false,
                doNotAddOnly: false,
                currencyOptions: {
                    name: 'Ngultrum',
                    plural: 'Ngultrum',
                    symbol: 'Nu.',
                    fractionalUnit: {
                        name: 'Chetrum',
                        plural: 'Chetrums',
                        symbol: '',
                    },
                },
            },
        });

        return toWords.convert(number);
    }

    calculateDueProgress(total: number, pending: number): number {
        if (!total || total <= 0) {
            return 0;
        }
        const progress = ((total - pending) / total) * 100;
        return Math.round(Math.min(progress, 100));
    }
}
