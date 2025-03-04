import { CommonModule } from '@angular/common';
import {
    AfterViewChecked,
    ChangeDetectorRef,
    Component,
    OnInit,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { GalleriaModule } from 'primeng/galleria';
import { BuildingDataService } from 'src/app/core/dataservice/building/building.dataservice';
import { StatsDataService } from 'src/app/core/dataservice/statistics/statistics.dataservice';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { PARSEBUILDINGFLOORS } from 'src/app/core/utility/helper.function';
import { MeterGroupModule } from 'primeng/metergroup';
import { DividerModule } from 'primeng/divider';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { TabViewModule } from 'primeng/tabview';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ViewPaymentAdviceComponent } from '../../admin/transactions/shared-components/view-payment-advice/view-payment-advice.component';
import { OwnerViewPaymentAdviceComponent } from '../shared/owner-view-payment-advice/owner-view-payment-advice.component';
import { OwnerBroadcastSmsComponent } from '../shared/owner-broadcast-sms/owner-broadcast-sms.component';
import { OwnerAddBuildingComponent } from '../shared/owner-add-building/owner-add-building.component';
import { OwnerGenerateLeaseStepperComponent } from '../shared/owner-generate-lease-stepper/owner-generate-lease-stepper.component';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { OwnerRentalIncomeBreakdownComponent } from '../shared/owner-rental-income-breakdown/owner-rental-income-breakdown.component';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';

@Component({
    selector: 'app-owner-dashbord',
    templateUrl: './owner-dashbord.component.html',
    styleUrls: ['./owner-dashbord.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        GalleriaModule,
        MeterGroupModule,
        DividerModule,
        TabViewModule,
    ],
    providers: [DialogService],
})
export class OwnerDashbordComponent implements OnInit, AfterViewChecked {
    ref: DynamicDialogRef;

    buildings: BuildingDTO[] = [];
    getBuildingFloorConfiguration = PARSEBUILDINGFLOORS;
    expiringLeaseAgreements = [];

    buildingImages = [
        'https://www.waytobhutan.com/wp-content/uploads/2020/02/dscf26071-1024x768.jpg',
        'https://media.architecturaldigest.com/photos/5aa7f0882ed63a101d5619f3/master/w_1600%2Cc_limit/amankora-gangtey-bhutan-dining.jpg.jpg',
    ];

    value = [{ label: 'Space used', value: 15, color: '#34d399' }];
    summaryStats;
    totalPending: number = 0;

    payments: PaymentAdviceDto[] = [];
    requests = [
        {
            type: 'Maintenance Request',
            building: {
                name: 'Rabten Apartments',
                address: 'Babesa zur lam 22 SE',
            },
            unit: { unitNumber: '01', floorLevel: 'G' },
            request: 'Water Leak',
            details: 'Water leaking from the ceiling in the kitchen.',
            dateReported: '2024-07-12',
            status: 'Pending',
            tenant: {
                firstName: 'Yeshi',
                lastName: 'Choden',
                phoneNumber: '17263764',
            },
        },
        {
            type: 'Complaint',
            building: {
                name: 'Norbu Complex',
                address: 'Changlam Plaza 10 NW',
            },
            unit: { unitNumber: '05', floorLevel: '2' },
            request: 'Noise Disturbance',
            details: 'Loud music from neighboring unit late at night.',
            dateReported: '2024-07-13',
            status: 'In Progress',
            tenant: {
                firstName: 'Tashi',
                lastName: 'Dorji',
                phoneNumber: '17485930',
            },
        },
        {
            type: 'Feedback',
            building: {
                name: 'Dema Residency',
                address: 'Olarongchhu South 45',
            },
            unit: { unitNumber: '03', floorLevel: '1' },
            request: 'Maintenance Team',
            details:
                'Very satisfied with the quick response from the maintenance team.',
            dateReported: '2024-07-14',
            status: 'Closed',
            tenant: {
                firstName: 'Pema',
                lastName: 'Wangmo',
                phoneNumber: '17654321',
            },
        },
        {
            type: 'Maintenance Request',
            building: {
                name: 'Norbu Complex',
                address: 'Changlam Plaza 10 NW',
            },
            unit: { unitNumber: '05', floorLevel: '2' },
            request: 'Broken Window',
            details: 'Living room window is cracked and needs replacement.',
            dateReported: '2024-07-15',
            status: 'In Progress',
            tenant: {
                firstName: 'Tashi',
                lastName: 'Dorji',
                phoneNumber: '17485930',
            },
        },
        {
            type: 'Complaint',
            building: {
                name: 'Rabten Apartments',
                address: 'Babesa zur lam 22 SE',
            },
            unit: { unitNumber: '01', floorLevel: 'G' },
            request: 'Pest Infestation',
            details: 'Cockroaches in the kitchen.',
            dateReported: '2024-07-16',
            status: 'Pending',
            tenant: {
                firstName: 'Yeshi',
                lastName: 'Choden',
                phoneNumber: '17263764',
            },
        },
        {
            type: 'Feedback',
            building: {
                name: 'Dema Residency',
                address: 'Olarongchhu South 45',
            },
            unit: { unitNumber: '03', floorLevel: '1' },
            request: 'Cleanliness',
            details: 'Common areas are well-maintained and clean.',
            dateReported: '2024-07-17',
            status: 'Closed',
            tenant: {
                firstName: 'Pema',
                lastName: 'Wangmo',
                phoneNumber: '17654321',
            },
        },
        {
            type: 'Maintenance Request',
            building: {
                name: 'Dema Residency',
                address: 'Olarongchhu South 45',
            },
            unit: { unitNumber: '03', floorLevel: '1' },
            request: 'No Hot Water',
            details: 'No hot water in the bathroom.',
            dateReported: '2024-07-18',
            status: 'Resolved',
            tenant: {
                firstName: 'Pema',
                lastName: 'Wangmo',
                phoneNumber: '17654321',
            },
        },
    ];

    constructor(
        private buildingDataService: BuildingDataService,
        private statsService: StatsDataService,
        private paymentAdviceService: PaymentAdviceDataService,
        private dialogService: DialogService,
        private cdr: ChangeDetectorRef,
        private authService: AuthService,
        private leaseaDataService: LeaseAgreementDataService
    ) {}

    ngOnInit() {
        // console.log(this.authService.GetAuthenticatedUser());
        // this.statsService.(1).subscribe({
        //     next: (res) => {
        //         this.summaryStats = res;
        //         this.fetchPendingPAByBuilding(res.buildings[0].id);
        //     },
        // });
        this.getExpiringLease();
    }
    ngAfterViewChecked() {
        this.cdr.detectChanges();
    }

    getTypeClass(type) {
        switch (type) {
            case 'Maintenance Request':
                return 'bg-orange-100 text-orange-800';
            case 'Complaint':
                return 'bg-red-100 text-red-800';
            case 'Feedback':
                return 'bg-green-100 text-green-800';
            default:
                return '';
        }
    }

    loadPaymentAdvice(event) {
        const selectedIndex = event.index;
        const selectedBuilding = this.summaryStats.buildings[selectedIndex];

        this.fetchPendingPAByBuilding(selectedBuilding.id);
    }

    fetchPendingPAByBuilding(buildingId) {
        this.totalPending = 0;
        this.paymentAdviceService
            .GetAllPendingAdviceByBuilding(buildingId)
            .subscribe({
                next: (res) => {
                    console.log('FETCH EVENT TRIGGERED', res);
                    console.log('BUILDINGID', buildingId);
                    if (res) {
                        this.payments = res;
                        for (let i of res) {
                            this.totalPending += i.totalAmount;
                        }
                        this.cdr.detectChanges();
                    } else {
                        this.payments = [];
                    }
                },
            });
    }

    getExpiringLease() {
        // this.leaseaDataService
        //     .GetExpiringLeaseByBuilding(1)
        //     .subscribe((res) => {
        //         console.log('LEASE AGREEMENT');
        //         console.log(res);
        //         this.expiringLeaseAgreements = res;
        //     });
    }

    openViewPaymentAdvice(item: PaymentAdviceDto) {
        this.ref = this.dialogService.open(OwnerViewPaymentAdviceComponent, {
            header: 'Payment Advice',
            data: { ...item },
        });
    }

    openBroadcastSmsModal() {
        this.ref = this.dialogService.open(OwnerBroadcastSmsComponent, {
            header: 'Broadcast SMS',
            data: {
                buildings: this.summaryStats.buildings,
            },
        });
    }
    openAddBuildingModal() {
        this.ref = this.dialogService.open(OwnerAddBuildingComponent, {
            header: 'Add Building',
        });
    }
    openAddLeaseAgreementModal() {
        this.ref = this.dialogService.open(OwnerGenerateLeaseStepperComponent, {
            header: 'Generate Lease Agreement',
        });
    }

    openRentalIncomeBreakdownReport() {
        this.ref = this.dialogService.open(
            OwnerRentalIncomeBreakdownComponent,
            {
                header: 'Rental Income Breakdown',
            }
        );
    }

    getDaysUntilExpiry(expirationDate: string): number {
        const today = new Date();
        const endDate = new Date(expirationDate);
        const timeDifference = endDate.getTime() - today.getTime();
        const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
        return daysDifference;
    }
}
