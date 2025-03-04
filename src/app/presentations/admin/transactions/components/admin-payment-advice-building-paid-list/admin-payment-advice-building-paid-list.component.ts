import {
    Component,
    Input,
    OnChanges,
    OnInit,
    SimpleChanges,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';

@Component({
    selector: 'app-admin-payment-advice-building-paid-list',
    templateUrl: './admin-payment-advice-building-paid-list.component.html',
    styleUrls: ['./admin-payment-advice-building-paid-list.component.css'],
    standalone: true,
    imports: [TableModule, ButtonModule, PaginatorModule],
})
export class AdminPaymentAdviceBuildingPaidListComponent
    implements OnInit, OnChanges
{
    @Input({ required: true }) building: BuildingDTO;

    paginatedPaymentAdvice: PaginatedData<PaymentAdviceDto> = {
        firstPage: 0,
        currentPage: 0,
        previousPage: 0,
        nextPage: 0,
        lastPage: 0,
        limit: 0,
        count: 0,
        data: [],
    };
    constructor(private paymentAdviceDataService: PaymentAdviceDataService) {}

    ngOnInit() {
        this.loadPendingPaymentAdvicesByBuilding();
    }

    downloadMasterTable() {}

    loadPendingPaymentAdvicesByBuilding() {
        // this.paginatedPaymentAdvice = null;
        // this.paymentAdviceDataService
        //     .GetAllPaidPaymentAdvicePaginatedByBuilding(this.building.id)
        //     .subscribe((res) => {
        //         console.log('PADINGATED BY BUILDING PAID', res);
        //         this.paginatedPaymentAdvice = res;
        //     });
    }
    ngOnChanges(changes: SimpleChanges) {
        if (changes['building'] && !changes['building'].firstChange) {
            this.loadPendingPaymentAdvicesByBuilding();
        }
    }
    onPageChange(e) {
        console.log(e);
        // this.paymentAdviceDataService
        //     .GetAllPaidPaymentAdvicePaginatedByBuilding(this.building.id, {
        //         page: e.page,
        //         limit: e.rows,
        //     })
        //     .subscribe((res) => {
        //         this.paginatedPaymentAdvice = res;
        //     });
    }
}
