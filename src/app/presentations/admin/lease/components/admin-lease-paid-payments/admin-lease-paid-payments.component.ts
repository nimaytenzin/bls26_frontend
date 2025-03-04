import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { ROWSPERPAGEOPTION, PageEvent } from 'src/app/core/constants/constants';
import { LEASETYPE } from 'src/app/core/constants/enums';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { ViewPaymentAdviceComponent } from '../../../transactions/shared-components/view-payment-advice/view-payment-advice.component';
import { AdminViewPaymentReceiptModalComponent } from '../../../transactions/shared-components/admin-view-payment-receipt-modal/admin-view-payment-receipt-modal.component';

@Component({
    selector: 'app-admin-lease-paid-payments',
    templateUrl: './admin-lease-paid-payments.component.html',
    styleUrls: ['./admin-lease-paid-payments.component.css'],
    standalone: true,
    imports: [TableModule, ButtonModule, PaginatorModule, CommonModule],
    providers: [DialogService],
})
export class AdminLeasePaidPaymentsComponent implements OnInit {
    @Input({
        required: true,
    })
    leaseAgreement: LeaseAgreeementDTO;
    ref: DynamicDialogRef;

    paginatedPaymentAdvice: PaginatedData<PaymentAdviceDto> = {
        firstPage: 0,
        currentPage: 0,
        previousPage: 0,
        nextPage: 0,
        lastPage: 0,
        limit: 0,
        count: 0,
        data: [],
    };
    selectedPaymentAdivces: PaymentAdviceDto[] = [];

    rowsPerPageOptions = ROWSPERPAGEOPTION;
    firstPageNumber = 0;
    rows = ROWSPERPAGEOPTION[0];
    currentPage = 0;

    leaseTypes = LEASETYPE;

    constructor(
        private paymentAdviceDataService: PaymentAdviceDataService,
        private dialogService: DialogService
    ) {}

    ngOnInit() {
        this.handlePagination();
        console.log('hi');
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

        console.log(queryParams);
        this.paymentAdviceDataService
            .GetPaidPaymentAdivceByLeasePaginated(
                this.leaseAgreement.id,
                queryParams
            )
            .subscribe({
                next: (res) => {
                    this.paginatedPaymentAdvice = res;
                },
                error: (err) => {
                    console.log(err);
                },
            });
    }

    downloadMasterTable() {}

    openViewPaymentReceipt(item: PaymentAdviceDto) {
        this.ref = this.dialogService.open(
            AdminViewPaymentReceiptModalComponent,
            {
                header: 'Payment Receipt',
                data: {
                    paymentReceiptId: item.paymentReceipts[0].id,
                },
            }
        );
    }
}
