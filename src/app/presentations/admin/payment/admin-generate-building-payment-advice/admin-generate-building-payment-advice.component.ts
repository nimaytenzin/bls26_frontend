import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import {
    DialogService,
    DynamicDialogComponent,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { PAType } from 'src/app/core/constants/enums';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import {
    ExtractMonthAndYear,
    GETMONTHNAME,
} from 'src/app/core/utility/date.helper';

@Component({
    selector: 'app-admin-generate-building-payment-advice',
    templateUrl: './admin-generate-building-payment-advice.component.html',
    styleUrls: ['./admin-generate-building-payment-advice.component.scss'],
    standalone: true,
    imports: [CalendarModule, ButtonModule, FormsModule, CommonModule],
})
export class AdminGenerateBuildingPaymentAdviceComponent implements OnInit {
    instance: DynamicDialogComponent | undefined;
    date: Date;
    buildingId: number;
    extractMonthYear = ExtractMonthAndYear;
    getMonthName = GETMONTHNAME;

    results: any[];
    constructor(
        private ref: DynamicDialogRef,
        private dialogService: DialogService,
        private paymentAdviceDataService: PaymentAdviceDataService
    ) {
        this.instance = this.dialogService.getInstance(this.ref);
        this.buildingId = this.instance.data.buildingId;
    }

    ngOnInit() {}

    generatePa() {
        const monthYear = this.extractMonthYear(this.date.toDateString());

        this.paymentAdviceDataService
            .GenerateBuildingPA({
                buildingId: this.buildingId,
                month: monthYear.month,
                year: monthYear.year,
                type: PAType.RECURRING,
            })
            .subscribe((res: any) => {
                console.log(res);
                this.results = res;
            });
    }

    formatDate(date: Date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
        }).format(date);
    }
}
