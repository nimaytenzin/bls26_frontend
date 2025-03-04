import { Component, OnInit } from '@angular/core';
import {
    DynamicDialogComponent,
    DynamicDialogRef,
    DialogService,
} from 'primeng/dynamicdialog';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import {
    ExtractMonthAndYear,
    GETMONTHNAME,
} from 'src/app/core/utility/date.helper';
import {
    CreatePaymentAdviceDto,
    PaymentAdviceItemDto,
} from 'src/app/core/dto/payments/payment-advice.dto';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';

@Component({
    selector: 'app-admin-generate-unit-payment-advice',
    templateUrl: './admin-generate-unit-payment-advice.component.html',
    styleUrls: ['./admin-generate-unit-payment-advice.component.css'],
    standalone: true,
    imports: [DropdownModule, FormsModule, CalendarModule],
})
export class AdminGenerateUnitPaymentAdviceComponent implements OnInit {
    instance: DynamicDialogComponent | undefined;
    leaseAgreement;
    date: Date | undefined;

    extractMonthYear = ExtractMonthAndYear;
    getMonthName = GETMONTHNAME;
    constructor(
        private ref: DynamicDialogRef,
        private dialogService: DialogService,
        private paymentAdviceDataService: PaymentAdviceDataService
    ) {
        this.instance = this.dialogService.getInstance(this.ref);
        this.leaseAgreement = this.instance.data;
    }

    ngOnInit() {}

    generatePa() {
        const monthYear = this.extractMonthYear(this.date.toDateString());
        const total = this.computeMonthlyPayable(this.leaseAgreement);
        const unitName =
            this.leaseAgreement.unit.floorLevel +
            '-' +
            this.leaseAgreement.unit.unitNumber;
        const monthName = this.getMonthName(monthYear.month);
        // const newPaymentAdvice: CreatePaymentAdviceDto = {
        //     unitId: this.leaseAgreement.unitId,
        //     buildingId: this.leaseAgreement.buildingId,
        //     tenantId: this.leaseAgreement.tenantId,
        //     leaseAgreementId: this.leaseAgreement.id,
        //     ownerId: this.leaseAgreement.ownerId,
        //     title:
        //         'Payment for the month of ' +
        //         monthName +
        //         '-' +
        //         monthYear.year +
        //         ' for unit ' +
        //         unitName,
        //     month: monthYear.month,
        //     year: monthYear.year,
        //     totalAmount: total,
        //     amountDue: total,
        //     status: 'DUE',
        //     paymentAdviseItem: [
        //         {
        //             particular: 'Rent',
        //             amount: this.leaseAgreement.rent,
        //         },
        //     ],
        // };

        // this.leaseAgreement.leaseSurcharges.forEach((item) => {
        //     newPaymentAdvice.paymentAdviseItem.push({
        //         particular: item.particular,
        //         amount: item.amount,
        //     });
        // });
        // console.log(newPaymentAdvice);

        // this.paymentAdviceDataService
        //     .CreatePaymentAdvice(newPaymentAdvice)
        //     .subscribe((res) => {
        //         console.log(res);
        //     });
    }

    computeMonthlyPayable(item) {
        let total = item.rent;
        for (let i = 0; i < item.leaseSurcharges.length; i++) {
            total += item.leaseSurcharges[i].amount;
        }
        return total;
    }
}
