import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { LEASETYPE } from 'src/app/core/constants/enums';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { ViewPaymentAdviceComponent } from '../../shared-components/view-payment-advice/view-payment-advice.component';
import { ROWSPERPAGEOPTION, PageEvent } from 'src/app/core/constants/constants';
import { PaginatorModule } from 'primeng/paginator';
import { AdminTenantPaymentsComponent } from '../../../users/admin-tenant-detailed-view/admin-tenant-payments/admin-tenant-payments.component';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-payment-advice-search-by-tenant',
    templateUrl: './admin-payment-advice-search-by-tenant.component.html',
    styleUrls: ['./admin-payment-advice-search-by-tenant.component.css'],
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
        AdminTenantPaymentsComponent,
    ],
    providers: [DialogService],
})
export class AdminPaymentAdviceSearchByTenantComponent implements OnInit {
    phoneNumber: number;
    cid: string;

    tenant: UserDTO;
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
        private userDataService: UserDataService,
        private messageService: MessageService,
        private paymentAdviceDataService: PaymentAdviceDataService,
        private dialogService: DialogService,
        private router: Router
    ) {}

    goToTenantDetailedView(tenantId: number) {
        this.router.navigate([`/admin/master-users/tenant/${tenantId}`]);
    }

    ngOnInit() {}

    searchPaByTenantPhoneNumber() {
        if (!this.phoneNumber) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Input',
                detail: 'Please Enter a Phone Number to search',
            });
            return;
        }
        this.userDataService
            .AdminFindTenantByPhoneNumber(this.phoneNumber)
            .subscribe({
                next: (res) => {
                    this.tenant = res;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Found',
                        detail: 'Tenant Details Found.',
                    });
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
    searchPaByTenantCid() {
        if (!this.cid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Input',
                detail: 'Please Enter a CID to search',
            });
            return;
        }
        this.userDataService.AdminFindTenantByCID(this.cid).subscribe({
            next: (res) => {
                this.tenant = res;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Found',
                    detail: 'Tenant Details Found.',
                });
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
}
