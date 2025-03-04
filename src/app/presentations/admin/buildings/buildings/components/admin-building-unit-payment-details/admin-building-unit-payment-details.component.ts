import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { ZHIDHAYCONTACTDETAILS } from 'src/app/core/constants/constants';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { ViewPaymentAdviceComponent } from 'src/app/presentations/admin/transactions/shared-components/view-payment-advice/view-payment-advice.component';

@Component({
    selector: 'app-admin-building-unit-payment-details',
    templateUrl: './admin-building-unit-payment-details.component.html',
    styleUrls: ['./admin-building-unit-payment-details.component.css'],
    standalone: true,
    imports: [
        TableModule,
        ButtonModule,
        TabViewModule,
        CommonModule,
        ViewPaymentAdviceComponent,
        DividerModule,
    ],
})
export class AdminBuildingUnitPaymentDetailsComponent implements OnInit {
    companyDetails = ZHIDHAYCONTACTDETAILS;
    paymentAdvice: PaymentAdviceDto;
    constructor(
        private paymentAdviceDataService: PaymentAdviceDataService,
        private config: DynamicDialogConfig
    ) {
        this.paymentAdvice = config.data;
    }

    ngOnInit() {}
}
