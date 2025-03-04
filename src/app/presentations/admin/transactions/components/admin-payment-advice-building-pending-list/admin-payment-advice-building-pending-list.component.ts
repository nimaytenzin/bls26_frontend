import { CommonModule } from '@angular/common';
import {
    Component,
    Input,
    OnChanges,
    OnInit,
    SimpleChanges,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';

@Component({
    selector: 'app-admin-payment-advice-building-pending-list',
    templateUrl: './admin-payment-advice-building-pending-list.component.html',
    styleUrls: ['./admin-payment-advice-building-pending-list.component.css'],
    standalone: true,
    imports: [TableModule, ButtonModule, CommonModule],
})
export class AdminPaymentAdviceBuildingPendingListComponent
    implements OnInit, OnChanges
{
    @Input({ required: true }) building: BuildingDTO;

    pendingPaymentAdvices: PaymentAdviceDto[] = [];

    constructor(private paymentAdviceDataService: PaymentAdviceDataService) {}

    ngOnInit() {
        console.log('BUILDING PASSED INTO THE COMPONENT', this.building);
        this.loadPendingPaymentAdvicesByBuilding();
    }

    loadPendingPaymentAdvicesByBuilding() {
        this.pendingPaymentAdvices = [];
        this.paymentAdviceDataService
            .GetAllPendingAdviceByBuilding(this.building.id)
            .subscribe((res) => {
                this.pendingPaymentAdvices = res;
            });
    }
    ngOnChanges(changes: SimpleChanges) {
        if (changes['building'] && !changes['building'].firstChange) {
            this.loadPendingPaymentAdvicesByBuilding();
        }
    }
}
