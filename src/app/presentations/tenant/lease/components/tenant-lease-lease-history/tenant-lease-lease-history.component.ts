import { Component, Input, OnInit } from '@angular/core';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { ZHIDHAYCONTACTDETAILS } from 'src/app/core/constants/constants';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import { PARSEFLOORLEVELS } from 'src/app/core/utility/helper.function';
import { TenantViewLeaseDetailsComponent } from '../../../dashboard/components/tenant-view-lease-details/tenant-view-lease-details.component';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { TenantSubmitDamageReportModalComponent } from '../../../shared/tenant-submit-damage-report-modal/tenant-submit-damage-report-modal.component';

@Component({
    selector: 'app-tenant-lease-lease-history',
    templateUrl: './tenant-lease-lease-history.component.html',
    styleUrls: ['./tenant-lease-lease-history.component.scss'],
    standalone: true,
    imports: [CommonModule, DividerModule, ButtonModule],
    providers: [DialogService],
})
export class TenantLeaseLeaseHistoryComponent implements OnInit {
    @Input({
        required: true,
    })
    tenantId: number;

    zhidhayContactDetails = ZHIDHAYCONTACTDETAILS;
    showLeasePaymentBreakdownModal: boolean = false;
    selectedLease;

    ref: DynamicDialogRef | undefined;
    leaseHistory = [];
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
        //         this.leaseHistory = res;
        //         console.log(' LEASE AGREEMNT', res);
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
        // this.ref = this.dialogService.open(AdminViewLeaseAgreementComponent, {
        //     header: 'Lease Details',
        //     width: '600px',
        //     data: { ...item },
        // });
    }
    openLeaseSumaryView(item) {
        this.ref = this.dialogService.open(TenantViewLeaseDetailsComponent, {
            header: 'Lease Details',
            width: '600px',
            data: { ...item },
        });
    }

    openSubmitDamageReportModal(item) {
        this.ref = this.dialogService.open(
            TenantSubmitDamageReportModalComponent,
            {
                header: 'Entry Damage Report',
                data: {
                    ...item,
                },
            }
        );
    }
}
