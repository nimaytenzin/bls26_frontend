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
import { LEASETYPE } from 'src/app/core/constants/enums';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { ViewPaymentAdviceComponent } from '../../shared-components/view-payment-advice/view-payment-advice.component';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { PlotDataService } from 'src/app/core/dataservice/land/plot.dataservice';
import { AdminPlotPaymentAdviceListingsComponent } from '../admin-plot-payment-advice-listings/admin-plot-payment-advice-listings.component';
import { DividerModule } from 'primeng/divider';

@Component({
    selector: 'app-admin-payment-advice-search-by-plot',
    templateUrl: './admin-payment-advice-search-by-plot.component.html',
    styleUrls: ['./admin-payment-advice-search-by-plot.component.css'],
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
        DividerModule,
        TableModule,
        AdminPlotPaymentAdviceListingsComponent,
    ],
    providers: [DialogService],
})
export class AdminPaymentAdviceSearchByPlotComponent implements OnInit {
    plotId: string;

    plot: PlotDTO;

    constructor(
        private userDataService: UserDataService,
        private messageService: MessageService,
        private paymentAdviceDataService: PaymentAdviceDataService,
        private dialogService: DialogService,
        private plotDataService: PlotDataService
    ) {}

    ngOnInit() {}

    searchPAByPlot() {
        if (!this.plotId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Input',
                detail: 'Please Enter a Plot ID to search',
            });
            return;
        }
        this.plotDataService.SearchPlotById(this.plotId).subscribe({
            next: (res) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Found',
                    detail: 'Plot Details Found.',
                });
                this.plot = res;
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
