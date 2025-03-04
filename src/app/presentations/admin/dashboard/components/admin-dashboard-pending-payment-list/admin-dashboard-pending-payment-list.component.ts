import { CommonModule } from '@angular/common';
import {
    Component,
    Input,
    OnChanges,
    OnInit,
    SimpleChanges,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { PageEvent, ROWSPERPAGEOPTION } from 'src/app/core/constants/constants';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import {
    PaymentAdviceDto,
    PaymentAdviceSummaryDTO,
} from 'src/app/core/dto/payments/payment-advice.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { ViewPaymentAdviceComponent } from '../../../transactions/shared-components/view-payment-advice/view-payment-advice.component';
import { DividerModule } from 'primeng/divider';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-dashboard-pending-payment-list',
    templateUrl: './admin-dashboard-pending-payment-list.component.html',
    styleUrls: ['./admin-dashboard-pending-payment-list.component.css'],
    standalone: true,
    imports: [
        TableModule,
        ButtonModule,
        CommonModule,
        PaginatorModule,
        DividerModule,
    ],
    providers: [DialogService],
})
export class AdminDashboardPendingPaymentListComponent implements OnInit {
    paginatedPayemntAdvice: PaginatedData<PaymentAdviceDto> = {
        firstPage: 0,
        currentPage: 0,
        previousPage: 0,
        nextPage: 0,
        lastPage: 0,
        limit: 0,
        count: 0,
        data: [],
    };

    summary: PaymentAdviceSummaryDTO = {
        totalMonthlyIncome: 0,
        totalPendingAmount: 0,
        totalPendingAdvices: 0,
    };
    rowsPerPageOptions = ROWSPERPAGEOPTION;
    firstPageNumber = 0;
    rows = ROWSPERPAGEOPTION[0];
    currentPage = 0;
    ref: DynamicDialogRef;
    constructor(
        private paymentAdviceDataService: PaymentAdviceDataService,
        private authService: AuthService,
        private dialogService: DialogService,
        private router: Router
    ) {}

    ngOnInit() {
        // this.handlePagination();
        // this.getSummary();
    }

    getSummary() {
        this.paymentAdviceDataService
            .GetPaymentAdviceSummaryByAdmin(
                this.authService.GetCurrentRole().adminId
            )
            .subscribe({
                next: (res) => {
                    this.summary = res;
                },
            });
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
            .GetAllPendingPaymentAdviceByAdminPaginated(
                this.authService.GetAuthenticatedUser().id,
                queryParams
            )
            .subscribe((res) => {
                console.log('PAGINATED PA', res);
                this.paginatedPayemntAdvice = res;
            });
    }

    openViewPaymentAdviceModal(item) {
        this.ref = this.dialogService.open(ViewPaymentAdviceComponent, {
            header: 'Payment Advice',
            data: item,
        });
    }
}
