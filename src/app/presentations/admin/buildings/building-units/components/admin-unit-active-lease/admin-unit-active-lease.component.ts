import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { AdminPgPaymentStepperComponent } from 'src/app/presentations/admin/payment/admin-pg-payment-stepper/admin-pg-payment-stepper.component';
import { TagModule } from 'primeng/tag';
import { AdminGenerateUnitPaymentAdviceComponent } from 'src/app/presentations/admin/payment/admin-generate-unit-payment-advice/admin-generate-unit-payment-advice.component';
import { AdminDetailedViewLeaseAgreementComponent } from 'src/app/presentations/admin/lease/admin-detailed-view-lease-agreement/admin-detailed-view-lease-agreement.component';
import { Router } from '@angular/router';
import { LESSEETYPE } from 'src/app/core/constants/enums';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';

@Component({
    selector: 'app-admin-unit-active-lease',
    templateUrl: './admin-unit-active-lease.component.html',
    styleUrls: ['./admin-unit-active-lease.component.scss'],
    standalone: true,
    imports: [CommonModule, ButtonModule, ChipModule, DividerModule, TagModule],
})
export class AdminUnitActiveLeaseComponent implements OnInit {
    @Input({
        required: true,
    })
    unitId: number;

    LESSEETYPES = LESSEETYPE;

    ref: DynamicDialogRef | undefined;
    activeLeaseAgreement: LeaseAgreeementDTO | null = null;

    constructor(
        private leaseAgreementDataService: LeaseAgreementDataService,
        private dialogService: DialogService,
        private router: Router
    ) {}

    ngOnInit() {
        this.leaseAgreementDataService
            .GetActiveLeaseAgreementByUnit(this.unitId)
            .subscribe({
                next: (res) => {
                    console.log(res, 'ACTIV ELEASE');
                    this.activeLeaseAgreement = res;
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

    getReadableDate(date: string) {
        return new Date(date).toDateString();
    }

    viewLease() {
        this.router.navigate([
            'admin/master-lease/view/' + this.activeLeaseAgreement.id,
        ]);
    }
}
