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
import { ROWSPERPAGEOPTION, PageEvent } from 'src/app/core/constants/constants';
import { LEASETYPE, LEASESTATUS } from 'src/app/core/constants/enums';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { UnitDTO } from 'src/app/core/dto/units/unit.dto';

@Component({
    selector: 'app-admin-tenant-lease',
    templateUrl: './admin-tenant-lease.component.html',
    styleUrls: ['./admin-tenant-lease.component.css'],
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
export class AdminTenantLeaseComponent implements OnInit {
    @Input({ required: true }) tenantId: number;

    leaseTypes = LEASETYPE;

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
        private userDataService: UserDataService,
        private messageService: MessageService,
        private paymentAdviceDataService: PaymentAdviceDataService,
        private dialogService: DialogService,
        private leaseAgreementDataService: LeaseAgreementDataService,
        private router: Router
    ) {}

    ngOnInit() {
        this.getPaginatedLeaseHistory();
        this.findActiveLeaseAgreementByTenant();
        this.findUpcomingExpirationLeaseAgreementsByTenant();
        this.findPendingLeaseAgreementsByTenant();
    }

    getStatusClass(status: string): string {
        switch (status) {
            case LEASESTATUS.PENDING:
                return 'bg-red-600 text-gray-100 px-2';
            case LEASESTATUS.ACTIVE:
                return 'bg-green-600 text-gray-100 px-2';
            case LEASESTATUS.UPCOMING_EXPIRATION:
                return 'bg-yellow-600 text-gray-100 px-2';
            case LEASESTATUS.EXPIRED:
                return 'bg-red-600 text-gray-100 px-2';
            default:
                return 'bg-gray-600 text-gray-100 px-2';
        }
    }

    goToLeaseDetailedView(leaseAgreement: LeaseAgreeementDTO) {
        this.router.navigate([`/admin/master-lease/view/${leaseAgreement.id}`]);
    }

    goToUnitDetailedView(item: UnitDTO) {
        this.router.navigate([
            `/admin/master-properties/building/${item.buildingId}/unit/${item.id}`,
        ]);
    }

    goToBuildingDetailedView(item: BuildingDTO) {
        this.router.navigate([`/admin/master-properties/building/${item.id}`]);
    }

    goToPlotDetailedView(item: PlotDTO) {
        this.router.navigate([`/admin/master-properties/plot/${item.id}`]);
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
            .GetAllNonActiveLeaseByTenantPaginated(this.tenantId, queryParams)
            .subscribe({
                next: (res) => {
                    this.paginatedLeaseHistory = res;
                    console.log('PAID PA TENTNTAS', res);
                },
                error: (err) => {
                    console.log(err);
                },
            });
    }

    findActiveLeaseAgreementByTenant() {
        this.leaseAgreementDataService
            .GetActiveLeaseAgreementsByTenant(this.tenantId)
            .subscribe({
                next: (res) => {
                    this.activeLeaseAgreements = res;
                },
            });
    }

    findPendingLeaseAgreementsByTenant() {
        this.leaseAgreementDataService
            .GetPendingLeaseAgreementsByTenant(this.tenantId)
            .subscribe({
                next: (res) => {
                    this.pendingLeaseAgreements = res;
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

    findUpcomingExpirationLeaseAgreementsByTenant() {
        this.leaseAgreementDataService
            .GetUpcomingExpirationLeaseAgreementsByTenant(this.tenantId)
            .subscribe({
                next: (res) => {
                    this.upcomingExpiryLeaseAgreements = res;
                },
            });
    }
}
