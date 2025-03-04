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
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { ROWSPERPAGEOPTION, PageEvent } from 'src/app/core/constants/constants';
import { LEASESTATUS, LEASETYPE } from 'src/app/core/constants/enums';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { ViewPaymentAdviceComponent } from '../../../transactions/shared-components/view-payment-advice/view-payment-advice.component';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { Router } from '@angular/router';
import { DividerModule } from 'primeng/divider';
import { AdminTenantLeaseComponent } from '../../../users/admin-tenant-detailed-view/admin-tenant-lease/admin-tenant-lease.component';

@Component({
    selector: 'app-admin-lease-search-by-tenant',
    templateUrl: './admin-lease-search-by-tenant.component.html',
    styleUrls: ['./admin-lease-search-by-tenant.component.css'],
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
        AdminTenantLeaseComponent,
    ],
    providers: [DialogService],
})
export class AdminLeaseSearchByTenantComponent implements OnInit {
    phoneNumber: number;
    cid: string;

    tenant: UserDTO;
    leaseTypes = LEASETYPE;

    ref: DynamicDialogRef;

    constructor(
        private userDataService: UserDataService,
        private messageService: MessageService,
        private paymentAdviceDataService: PaymentAdviceDataService,
        private dialogService: DialogService,
        private leaseAgreementDataService: LeaseAgreementDataService,
        private router: Router
    ) {}

    ngOnInit() {}

    goToTenantDetailedView(tenantId: number) {
        this.router.navigate([`/admin/master-users/tenant/${tenantId}`]);
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

    goToDetailedView(leaseAgreement: LeaseAgreeementDTO) {
        this.router.navigate([`/admin/master-lease/view/${leaseAgreement.id}`]);
    }

    searchByTenantPhoneNumber() {
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
    searchByTenantCid() {
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
