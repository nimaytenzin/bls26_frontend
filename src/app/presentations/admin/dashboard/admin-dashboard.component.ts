import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { BuildingDataService } from 'src/app/core/dataservice/building/building.dataservice';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { StatsDataService } from 'src/app/core/dataservice/statistics/statistics.dataservice';
import { AdminSummaryStatisticsDTO } from 'src/app/core/dataservice/statistics/statistics.dto';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import {
    PaymentAdviceDto,
    PaymentAdviceSummaryDTO,
} from 'src/app/core/dto/payments/payment-advice.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { PARSEBUILDINGFLOORS } from 'src/app/core/utility/helper.function';

import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { GalleriaModule } from 'primeng/galleria';
import { MeterGroupModule } from 'primeng/metergroup';
import { TabViewModule } from 'primeng/tabview';
import { AdminDashboardBroadcastSmsComponent } from './components/admin-dashboard-broadcast-sms/admin-dashboard-broadcast-sms.component';
import { AuthenticatedUserDTO } from 'src/app/core/dataservice/users-and-auth/dto/auth.dto';
import { AdminDashboardLeaseActionSummaryComponent } from './components/admin-dashboard-lease-action-summary/admin-dashboard-lease-action-summary.component';
import { Router } from '@angular/router';
import { ToWords } from 'to-words';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-admin-dashboard',
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        GalleriaModule,
        MeterGroupModule,
        DividerModule,
        TabViewModule,
        ProgressBarModule,
        TooltipModule,
        TagModule,
    ],
    providers: [],
})
export class AdminDashboardComponent implements OnInit {
    constructor(private router: Router) {}

    ngOnInit() {}

    goToEnrollStudent() {
        this.router.navigate(['admin/enroll']);
    }

    goToDetailedClassView() {
        this.router.navigate(['admin/class']);
    }
}
