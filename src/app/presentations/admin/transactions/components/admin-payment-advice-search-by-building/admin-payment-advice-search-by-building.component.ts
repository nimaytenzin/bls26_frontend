import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { PlotDataService } from 'src/app/core/dataservice/land/plot.dataservice';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { AdminPaymentAdviceBuildingPendingListComponent } from '../admin-payment-advice-building-pending-list/admin-payment-advice-building-pending-list.component';
import { AdminPaymentAdviceBuildingPaidListComponent } from '../admin-payment-advice-building-paid-list/admin-payment-advice-building-paid-list.component';

@Component({
    selector: 'app-admin-payment-advice-search-by-building',
    templateUrl: './admin-payment-advice-search-by-building.component.html',
    styleUrls: ['./admin-payment-advice-search-by-building.component.css'],
    standalone: true,
    imports: [
        InputTextModule,
        FormsModule,
        ButtonModule,
        InputGroupModule,
        CommonModule,
        DividerModule,
        TableModule,
        TabViewModule,
        AdminPaymentAdviceBuildingPendingListComponent,
        AdminPaymentAdviceBuildingPaidListComponent,
    ],
})
export class AdminPaymentAdviceSearchByBuildingComponent implements OnInit {
    plotId: string;
    plot: PlotDTO;

    pendingPaymentAdvices: PaymentAdviceDto[];

    dataLoadTriggered: boolean = false;
    selectedBuilding: BuildingDTO;

    constructor(
        private plotDataService: PlotDataService,
        private messageService: MessageService,
        private paymentAdviceDataService: PaymentAdviceDataService
    ) {}

    ngOnInit() {}

    searchBuildingByPlot() {
        this.plot = null;
        // this.plotDataService.GetBuildingsByPlot(this.plotId).subscribe({
        //     next: (res) => {
        //         if (res) {
        //             this.messageService.add({
        //                 severity: 'success',
        //                 summary: 'Details Found',
        //                 detail: 'Plot Details Loaded',
        //             });
        //             this.plot = res;
        //         } else {
        //             this.messageService.add({
        //                 severity: 'info',
        //                 summary: 'No Plot Data',
        //                 detail: 'Plot Details not found. Please check the PlotID',
        //             });
        //         }
        //     },
        // });
    }

    loadData(building: BuildingDTO) {
        this.dataLoadTriggered = true;
        this.selectedBuilding = building;
    }
}
