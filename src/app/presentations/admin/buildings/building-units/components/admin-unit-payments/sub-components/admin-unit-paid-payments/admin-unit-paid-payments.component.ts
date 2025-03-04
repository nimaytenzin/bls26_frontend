import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { PageEvent, ROWSPERPAGEOPTION } from 'src/app/core/constants/constants';
import { LEASETYPE } from 'src/app/core/constants/enums';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { PaymentReceiptDTO } from 'src/app/core/dto/payments/payment-receipt-dto';
import { AdminViewPaymentReceiptModalComponent } from 'src/app/presentations/admin/transactions/shared-components/admin-view-payment-receipt-modal/admin-view-payment-receipt-modal.component';

@Component({
    selector: 'app-admin-unit-paid-payments',
    templateUrl: './admin-unit-paid-payments.component.html',
    styleUrls: ['./admin-unit-paid-payments.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        DividerModule,
        ButtonModule,
        PaginatorModule,
    ],
})
export class AdminUnitPaidPaymentsComponent implements OnInit {
    @Input({ required: true }) unitId: number;

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

    rowsPerPageOptions = ROWSPERPAGEOPTION;
    firstPageNumber = 0;
    rows = ROWSPERPAGEOPTION[0];
    currentPage = 0;

    leaseTypes = LEASETYPE;

    paidPayments: PaymentAdviceDto[] = [];

    constructor(
        private dialogService: DialogService,
        private paymentAdviceDataService: PaymentAdviceDataService
    ) {}

    ngOnInit() {
        this.handlePagination();
    }

    onPageChange(event: PageEvent): void {
        console.log('PAGE CHANGE VENT', event);
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
            .GetAllPaidPaymentAdvicesByUnitPaginated(this.unitId, queryParams)
            .subscribe((res) => {
                this.paginatedPaymentAdvice = res;
            });
    }

    downloadMasterTable() {}

    openViewPaymentReceipt(item: PaymentReceiptDTO) {
        this.ref = this.dialogService.open(
            AdminViewPaymentReceiptModalComponent,
            {
                header: 'Payment Receipt',
                data: { paymentReceiptId: item.id },
            }
        );
    }
}
