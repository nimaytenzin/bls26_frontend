import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { PageEvent, ROWSPERPAGEOPTION } from 'src/app/core/constants/constants';
import { INVOICESTATUS } from 'src/app/core/constants/enums';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import {
    CreatePaymentAdviceDto,
    PaymentAdviceDto,
} from 'src/app/core/dto/payments/payment-advice.dto';
import { AdminPgPaymentStepperComponent } from 'src/app/presentations/admin/payment/admin-pg-payment-stepper/admin-pg-payment-stepper.component';

@Component({
    selector: 'app-admin-unit-lease-history',
    templateUrl: './admin-unit-lease-history.component.html',
    styleUrls: ['./admin-unit-lease-history.component.scss'],
    standalone: true,
    imports: [TableModule, PaginatorModule, CommonModule, ButtonModule],
})
export class AdminUnitLeaseHistoryComponent implements OnInit {
    @Input({
        required: true,
    })
    unitId: number;
    ref: DynamicDialogRef | undefined;

    paginatedLeaseAgreeements: PaginatedData<LeaseAgreeementDTO> = {
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
        private leaseAgreementDataService: LeaseAgreementDataService,
        private router: Router
    ) {}

    ngOnInit() {
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
            .GetAllLeaseAgreementsByUnitPaginated(this.unitId, queryParams)
            .subscribe({
                next: (res) => {
                    console.log('PAGINATED LEASE', res);
                    this.paginatedLeaseAgreeements = res;
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

    viewLease(lease: LeaseAgreeementDTO) {
        this.router.navigate(['admin/master-lease/view/' + lease.id]);
    }
}
