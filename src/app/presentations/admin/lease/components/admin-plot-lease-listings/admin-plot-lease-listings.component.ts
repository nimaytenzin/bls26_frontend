import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { PageEvent, ROWSPERPAGEOPTION } from 'src/app/core/constants/constants';
import { LEASESTATUS } from 'src/app/core/constants/enums';
import { PlotDataService } from 'src/app/core/dataservice/land/plot.dataservice';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { TenantDTO } from 'src/app/core/dto/users/tenant.dto';

@Component({
    selector: 'app-admin-plot-lease-listings',
    templateUrl: './admin-plot-lease-listings.component.html',
    styleUrls: ['./admin-plot-lease-listings.component.css'],
    standalone: true,
    imports: [
        TableModule,
        InputGroupModule,
        InputGroupAddonModule,
        InputNumberModule,
        InputTextModule,
        FormsModule,
        ButtonModule,
        CommonModule,
        PaginatorModule,
        TableModule,
        DividerModule,
        TooltipModule,
    ],
    providers: [DialogService],
})
export class AdminPlotLeaseListingsComponent implements OnInit {
    @Input({ required: true }) plotDatabaseId: number;

    activeLeaseAgreements: LeaseAgreeementDTO[] = [];
    upcomingExpiryLeaseAgreements: LeaseAgreeementDTO[] = [];
    pendingLeaseAgreements: LeaseAgreeementDTO[] = [];

    paginatedLeaseHistory: PaginatedData<LeaseAgreeementDTO> = {
        firstPage: 0,
        currentPage: 0,
        previousPage: 0,
        nextPage: 0,
        lastPage: 0,
        limit: 0,
        count: 0,
        data: [],
    };

    ref: DynamicDialogRef;

    rowsPerPageOptions = ROWSPERPAGEOPTION;
    firstPageNumber = 0;
    rows = ROWSPERPAGEOPTION[0];
    currentPage = 0;
    constructor(
        private leaseAgreementDataService: LeaseAgreementDataService,
        private router: Router
    ) {}

    ngOnInit() {
        this.getPaginatedLeaseHistory();
        this.findAllActiveLeaseByPlot();
        this.findPendingLeaseAgreementsByPlot();
        this.findUpcomingExpirationLeaseAgreementsByPlot();
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

    goToTenantDetailedView(tenantId: number) {
        this.router.navigate([`/admin/master-users/tenant/${tenantId}`]);
    }
    onPageChange(event: PageEvent): void {
        this.firstPageNumber = event.first;
        this.currentPage = event.page;
        this.rows = event.rows;
        this.getPaginatedLeaseHistory();
    }

    private getPaginatedLeaseHistory(): void {
        const queryParams: any = {
            pageNo: this.currentPage,
            pageSize: this.rows,
        };

        this.leaseAgreementDataService
            .GetAllNonActiveLeaseByPlotPaginated(
                this.plotDatabaseId,
                queryParams
            )
            .subscribe({
                next: (res) => {
                    this.paginatedLeaseHistory = res;
                },
                error: (err) => {
                    console.log(err);
                },
            });
    }

    findAllActiveLeaseByPlot() {
        this.leaseAgreementDataService
            .GetAllActiveLeaseAgreementsByPlot(this.plotDatabaseId)
            .subscribe({
                next: (res) => {
                    this.activeLeaseAgreements = res;
                },
            });
    }

    findPendingLeaseAgreementsByPlot() {
        this.leaseAgreementDataService
            .GetAllPendingLeaseAgreementsByPlot(this.plotDatabaseId)
            .subscribe({
                next: (res) => {
                    this.pendingLeaseAgreements = res;
                },
            });
    }

    computeMonthlyPayable(item: LeaseAgreeementDTO) {
        let total = item.rent;
        for (let i = 0; i < item.leaseSurcharges.length; i++) {
            total += item.leaseSurcharges[i].amount;
        }

        return total;
    }

    findUpcomingExpirationLeaseAgreementsByPlot() {
        this.leaseAgreementDataService
            .GetAllUpcomingExpirationLeaseAgreementsByPlot(this.plotDatabaseId)
            .subscribe({
                next: (res) => {
                    this.upcomingExpiryLeaseAgreements = res;
                },
            });
    }

    computeMonthlyCharges(lease: LeaseAgreeementDTO) {
        let total = lease.rent;
        for (let item of lease.leaseSurcharges) {
            total += item.amount;
        }
        return total;
    }
}
