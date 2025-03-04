import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ROWSPERPAGEOPTION, PageEvent } from 'src/app/core/constants/constants';
import { LEASESTATUS } from 'src/app/core/constants/enums';
import { ExcelGeneratorDataService } from 'src/app/core/dataservice/excel.generator.dataservice';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';

@Component({
    selector: 'app-admin-land-lease-upcoming-expiration-listings',
    templateUrl:
        './admin-land-lease-upcoming-expiration-listings.component.html',
    styleUrls: [
        './admin-land-lease-upcoming-expiration-listings.component.css',
    ],
    standalone: true,
    imports: [
        CheckboxModule,
        FormsModule,
        ButtonModule,
        TableModule,
        PaginatorModule,
        CommonModule,
        ToastModule,
        TooltipModule,
        TagModule,
        InputTextModule,
    ],
})
export class AdminLandLeaseUpcomingExpirationListingsComponent
    implements OnInit
{
    private _refreshEvent: EventEmitter<void>;

    @Input({
        required: true,
    })
    set refreshEvent(event: EventEmitter<void>) {
        if (event) {
            this._refreshEvent = event;
            this._refreshEvent.subscribe(() => {
                this.handlePagination();
            });
        }
    }

    paginatedLandLease: PaginatedData<LeaseAgreeementDTO> = {
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

    constructor(
        private router: Router,
        private leaseAgreementDataService: LeaseAgreementDataService,
        private authService: AuthService,
        private messageService: MessageService,
        private excelGeneratorService: ExcelGeneratorDataService
    ) {}

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

    ngOnInit(): void {
        this.handlePagination();
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

        this.leaseAgreementDataService
            .GetAllUpcomingExpirationLandLeaseByAdminPaginated(
                this.authService.GetCurrentRole().adminId,
                queryParams
            )
            .subscribe({
                next: (res) => {
                    this.paginatedLandLease = res;
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

    goToDetailedView(leaseAgreement: LeaseAgreeementDTO) {
        this.router.navigate([`/admin/master-lease/view/${leaseAgreement.id}`]);
    }
    goToPlotDetailedView(item: PlotDTO) {
        this.router.navigate([`/admin/master-properties/plot/${item.id}`]);
    }

    goToTenantDetailedView(tenantId: number) {
        this.router.navigate([`/admin/master-users/tenant/${tenantId}`]);
    }

    downloadMasterTable() {
        this.messageService.add({
            severity: 'info',
            summary: 'Downloading',
            detail: 'downloading...',
        });
        this.excelGeneratorService
            .DownloadAllUpcomingExpirationLandLeaseAgreementByAdmin(
                this.authService.GetCurrentRole().adminId
            )
            .subscribe((blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Expiring Land Lease.xlsx';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Downloaded',
                    detail: 'Download Completed.',
                    life: 3000,
                });
            });
    }
}
