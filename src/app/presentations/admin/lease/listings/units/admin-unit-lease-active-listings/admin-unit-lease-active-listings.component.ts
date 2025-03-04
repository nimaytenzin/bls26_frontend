import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ROWSPERPAGEOPTION, PageEvent } from 'src/app/core/constants/constants';
import {
    LESSORTYPE,
    LEASESTATUS,
    LEASETYPE,
} from 'src/app/core/constants/enums';
import { ExcelGeneratorDataService } from 'src/app/core/dataservice/excel.generator.dataservice';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { UnitDTO } from 'src/app/core/dto/units/unit.dto';

@Component({
    selector: 'app-admin-unit-lease-active-listings',
    templateUrl: './admin-unit-lease-active-listings.component.html',
    styleUrls: ['./admin-unit-lease-active-listings.component.css'],
    standalone: true,
    imports: [
        CheckboxModule,
        FormsModule,
        ButtonModule,
        TableModule,
        PaginatorModule,
        CommonModule,
        ToastModule,
        TagModule,
        TooltipModule,
        InputTextModule,
    ],
    providers: [DialogService],
})
export class AdminUnitLeaseActiveListingsComponent implements OnInit {
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

    ref: DynamicDialogRef | undefined;
    LessorTypes = LESSORTYPE;

    leaseStatus = LEASESTATUS;
    admin: UserDTO;
    paginatedUnitLease: PaginatedData<LeaseAgreeementDTO> = {
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
        public dialogService: DialogService,
        private router: Router,
        private leaseAgreementDataService: LeaseAgreementDataService,
        private authService: AuthService,
        private messageService: MessageService,
        private excelGeneratorService: ExcelGeneratorDataService
    ) {
        this.authService
            .GetAdminDetails(this.authService.GetCurrentRole().adminId)
            .subscribe((res) => {
                this.admin = res;
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

    goToUnitDetailedView(item: UnitDTO) {
        this.router.navigate([
            `/admin/master-properties/building/${item.buildingId}/unit/${item.id}`,
        ]);
    }

    goToBuildingDetailedView(item: BuildingDTO) {
        this.router.navigate([`/admin/master-properties/building/${item.id}`]);
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
            .GetAllActiveUnitLeaseByAdminPaginated(
                this.authService.GetCurrentRole().adminId,
                queryParams
            )
            .subscribe({
                next: (res) => {
                    this.paginatedUnitLease = res;
                },
            });
    }

    computeMonthlyPayable(item) {
        let total = item.rent;
        for (let i = 0; i < item.leaseSurcharges.length; i++) {
            total += item.leaseSurcharges[i].amount;
        }

        return total;
    }

    downloadMasterTable() {
        this.messageService.add({
            severity: 'info',
            summary: 'Downloading',
            detail: 'downloading...',
        });
        this.excelGeneratorService
            .DownloadAllActiveUnitLeaseAgreementByAdmin(
                this.authService.GetCurrentRole().adminId
            )
            .subscribe((blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Active Unit Leases.xlsx';
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
