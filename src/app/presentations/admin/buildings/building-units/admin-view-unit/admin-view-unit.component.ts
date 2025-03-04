import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QRCodeModule } from 'angularx-qrcode';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { UnitDataService } from 'src/app/core/dataservice/units/unit.dataservice';
import { UnitDTO } from 'src/app/core/dto/units/unit.dto';
import {
    PARSEFLOORLEVELS,
    PARSEFULLNAME,
} from 'src/app/core/utility/helper.function';
import { AdminUnitDetailsCardComponent } from '../components/admin-unit-details-card/admin-unit-details-card.component';
import { AdminUnitRulesCardComponent } from '../components/admin-unit-rules-card/admin-unit-rules-card.component';
import { AdminUnitSurchargesCardComponent } from '../components/admin-unit-surcharges-card/admin-unit-surcharges-card.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AdminEditUnitComponent } from '../crud-modals/admin-edit-unit/admin-edit-unit.component';
import { AdminCreateUnitBankLinkageComponent } from '../../../bankaccounts/admin-create-unit-bank-linkage/admin-create-unit-bank-linkage.component';
import { CommonModule } from '@angular/common';
import { BankAccountDataService } from 'src/app/core/dataservice/bankaccounts/bankaccounts.dataservice';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import { TableModule } from 'primeng/table';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { PaginatorModule } from 'primeng/paginator';
import {
    CreatePaymentAdviceDto,
    PaymentAdviceDto,
} from 'src/app/core/dto/payments/payment-advice.dto';
import { INVOICESTATUS, LEASESTATUS } from 'src/app/core/constants/enums';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { AdminPgPaymentStepperComponent } from '../../../payment/admin-pg-payment-stepper/admin-pg-payment-stepper.component';
import { TagModule } from 'primeng/tag';
import { AdminUnitActiveLeaseComponent } from '../components/admin-unit-active-lease/admin-unit-active-lease.component';
import { DividerModule } from 'primeng/divider';
import { AdminUnitLeaseHistoryComponent } from '../components/admin-unit-lease-history/admin-unit-lease-history.component';
import { AdminUnitPaymentsComponent } from '../components/admin-unit-payments/admin-unit-payments.component';

@Component({
    selector: 'app-admin-view-unit',
    standalone: true,
    imports: [
        ButtonModule,
        TabViewModule,
        QRCodeModule,
        AdminUnitDetailsCardComponent,
        AdminUnitRulesCardComponent,
        AdminUnitSurchargesCardComponent,
        BreadcrumbModule,
        CommonModule,
        ConfirmDialogModule,
        TableModule,
        PaginatorModule,
        TagModule,
        DividerModule,
        AdminUnitActiveLeaseComponent,
        AdminUnitLeaseHistoryComponent,
        TagModule,
        AdminUnitPaymentsComponent,
    ],

    templateUrl: './admin-view-unit.component.html',
    styleUrl: './admin-view-unit.component.scss',
    providers: [DialogService, ConfirmationService],
})
export class AdminViewUnitComponent implements OnInit {
    ref: DynamicDialogRef | undefined;
    unitId: number;
    buildingId: number;

    unit: UnitDTO = {} as UnitDTO;
    items: MenuItem[] | undefined;
    home: MenuItem | undefined;
    bankList = [];

    parseFloorLevel = PARSEFLOORLEVELS;

    totalAmountDue: number = 0;

    constructor(
        private route: ActivatedRoute,
        private unitDataService: UnitDataService,
        private router: Router,
        private dialogService: DialogService,
        private messageService: MessageService
    ) {
        this.unitId = Number(this.route.snapshot.paramMap.get('unitId'));

        this.home = { icon: 'pi pi-home', routerLink: '/' };

        this.route.parent.paramMap.subscribe((params) => {
            this.buildingId = Number(params.get('buildingId'));
        });

        this.getUnit();
    }

    ngOnInit(): void {}

    getUnit() {
        this.unitDataService.GetUnit(this.unitId).subscribe((res) => {
            this.unit = res;
            this.items = [
                { label: 'Building' },
                { label: 'Units' },
                { label: this.unit.floorLevel + '-' + this.unit.unitNumber },
            ];
        });
    }

    goBack() {
        this.router.navigate([
            '/admin/master-properties/building/' + this.buildingId,
        ]);
    }

    openEditUnitModal() {
        this.ref = this.dialogService.open(AdminEditUnitComponent, {
            header: 'Edit Unit',
            data: { ...this.unit },
            width: '600px',
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 200) {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Updated',
                    detail: 'Details Updated Successfully',
                });
                this.getUnit();
            }
        });
    }
}
