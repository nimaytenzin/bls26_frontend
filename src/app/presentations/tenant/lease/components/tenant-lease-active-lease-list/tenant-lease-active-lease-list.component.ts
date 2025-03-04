import { Component, Input, OnInit } from '@angular/core';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import { PARSEFLOORLEVELS } from 'src/app/core/utility/helper.function';
import { TenantViewLeaseDetailsComponent } from '../../../dashboard/components/tenant-view-lease-details/tenant-view-lease-details.component';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { ZHIDHAYCONTACTDETAILS } from 'src/app/core/constants/constants';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-tenant-lease-active-lease-list',
    templateUrl: './tenant-lease-active-lease-list.component.html',
    styleUrls: ['./tenant-lease-active-lease-list.component.scss'],
    imports: [DialogModule, CommonModule, DividerModule, ButtonModule],
    providers: [DialogService],
    standalone: true,
})
export class TenantLeaseActiveLeaseListComponent implements OnInit {
    @Input({
        required: true,
    })
    tenantId: number;

    zhidhayContactDetails = ZHIDHAYCONTACTDETAILS;
    showLeasePaymentBreakdownModal: boolean = false;
    selectedLease;

    ref: DynamicDialogRef | undefined;
    activeLeaseAgreements;
    parseFloorLevel = PARSEFLOORLEVELS;
    constructor(
        private leaseAgreementDataService: LeaseAgreementDataService,
        private dialogService: DialogService
    ) {}

    ngOnInit() {
        this.getActiveLeaseAgreements();
    }

    getActiveLeaseAgreements() {
        // this.leaseAgreementDataService
        //     .GetActiveLeaseAgreementsByTenant(this.tenantId)
        //     .subscribe((res) => {
        //         this.activeLeaseAgreements = res;
        //         console.log('ACTIVE LEASE AGREEMNT', res);
        //     });
    }
    computeMonthlyPayable(item) {
        let total = item.rent;
        for (let i = 0; i < item.leaseSurcharges.length; i++) {
            total += item.leaseSurcharges[i].amount;
        }
        return total;
    }

    getReadableDate(date: string) {
        return new Date(date).toDateString();
    }

    viewLease(leaeAgreement) {
        // this.ref = this.dialogService.open(AdminViewLeaseAgreementComponent, {
        //     header: 'View Lease',
        //     width: '600px',
        //     data: {
        //         leaseAgreementId: leaeAgreement.id,
        //     },
        // });
    }
    viewLeasePaymentBreakdown(item) {
        this.selectedLease = item;
        this.showLeasePaymentBreakdownModal = true;
    }

    openLeaseDetailedView(item) {
        this.ref = this.dialogService.open(TenantViewLeaseDetailsComponent, {
            header: 'Lease Details',
            width: '600px',
            data: { ...item },
        });
    }
}
