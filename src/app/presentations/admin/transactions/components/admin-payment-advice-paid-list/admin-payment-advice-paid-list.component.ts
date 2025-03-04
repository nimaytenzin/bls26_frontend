import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { ROWSPERPAGEOPTION, PageEvent } from 'src/app/core/constants/constants';
import { LEASETYPE } from 'src/app/core/constants/enums';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { InvoiceDTO } from 'src/app/core/dto/payments/invoice/invoice.dto';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { ViewPaymentAdviceComponent } from 'src/app/presentations/admin/transactions/shared-components/view-payment-advice/view-payment-advice.component';
import { AdminViewPaymentReceiptModalComponent } from '../../shared-components/admin-view-payment-receipt-modal/admin-view-payment-receipt-modal.component';
import { PaymentReceiptDTO } from 'src/app/core/dto/payments/payment-receipt-dto';

@Component({
    selector: 'app-admin-payment-advice-paid-list',
    templateUrl: './admin-payment-advice-paid-list.component.html',
    styleUrls: ['./admin-payment-advice-paid-list.component.css'],
    standalone: true,
    imports: [TableModule, ButtonModule, PaginatorModule, CommonModule],
    providers: [DialogService],
})
export class AdminPaymentAdvicePaidListComponent implements OnInit {
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

    constructor(
        private paymentAdviceDataService: PaymentAdviceDataService,
        private dialogService: DialogService,
        private authService: AuthService
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
            .GetAllPaidPaymentAdviceByAdminPaginated(
                this.authService.GetCurrentRole().adminId,
                queryParams
            )
            .subscribe({
                next: (res) => {
                    console.log(res);
                    this.paginatedPaymentAdvice = res;
                    console.log('PAGINATED WONER WITH THRAM', res);
                },
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
