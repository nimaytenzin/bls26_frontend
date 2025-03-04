import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { ROWSPERPAGEOPTION, PageEvent } from 'src/app/core/constants/constants';
import { LEASETYPE } from 'src/app/core/constants/enums';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { ViewPaymentAdviceComponent } from '../../shared-components/view-payment-advice/view-payment-advice.component';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-plot-payment-advice-listings',
    templateUrl: './admin-plot-payment-advice-listings.component.html',
    styleUrls: ['./admin-plot-payment-advice-listings.component.css'],
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
        TooltipModule,
    ],
    providers: [DialogService],
})
export class AdminPlotPaymentAdviceListingsComponent implements OnInit {
    @Input({ required: true }) plotDatabaseId: number;

    leaseTypes = LEASETYPE;

    paginatedPaidPaymentAdvice: PaginatedData<PaymentAdviceDto> = {
        firstPage: 0,
        currentPage: 0,
        previousPage: 0,
        nextPage: 0,
        lastPage: 0,
        limit: 0,
        count: 0,
        data: [],
    };
    pendingPaymentAdvices: PaymentAdviceDto[] = [];

    ref: DynamicDialogRef;

    rowsPerPageOptions = ROWSPERPAGEOPTION;
    firstPageNumber = 0;
    rows = ROWSPERPAGEOPTION[0];
    currentPage = 0;
    constructor(
        private messageService: MessageService,
        private paymentAdviceDataService: PaymentAdviceDataService,
        private dialogService: DialogService,
        private router: Router
    ) {}

    ngOnInit() {
        this.getPendingPaymentsByPlot();
        this.handlePagination();
    }

    getPendingPaymentsByPlot() {
        this.paymentAdviceDataService
            .AdminGetAllPendingByPlot(this.plotDatabaseId)
            .subscribe({
                next: (res) => {
                    this.pendingPaymentAdvices = res;
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error.message,
                    });
                },
            });
    }

    openViewPaymentReceipt(item: PaymentAdviceDto[]) {
        this.ref = this.dialogService.open(ViewPaymentAdviceComponent, {
            header: 'Payment Advice',
            data: item,
        });
    }

    goToTenantDetailedView(tenantId: number) {
        this.router.navigate([`/admin/master-users/tenant/${tenantId}`]);
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

        this.paymentAdviceDataService
            .AdminGetAllPaidPaymentAdvicesByPlotPaginated(
                this.plotDatabaseId,
                queryParams
            )
            .subscribe({
                next: (res) => {
                    this.paginatedPaidPaymentAdvice = res;
                },
                error: (err) => {
                    console.log(err);
                },
            });
    }
}
