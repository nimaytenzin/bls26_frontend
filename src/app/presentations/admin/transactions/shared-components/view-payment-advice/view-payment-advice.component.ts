import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import {
    DialogService,
    DynamicDialogConfig,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import {
    API_URL,
    ZHIDHAYCONTACTDETAILS,
} from 'src/app/core/constants/constants';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { AdminPgPaymentStepperComponent } from '../../../payment/admin-pg-payment-stepper/admin-pg-payment-stepper.component';
import { AdminReceivePaymentPaymentAdviceModalComponent } from '../admin-receive-payment-payment-advice-modal/admin-receive-payment-payment-advice-modal.component';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { ImageModule } from 'primeng/image';
import { Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-view-payment-advice',
    templateUrl: './view-payment-advice.component.html',
    styleUrls: ['./view-payment-advice.component.scss'],
    standalone: true,
    imports: [
        DividerModule,
        CommonModule,
        TableModule,
        ButtonModule,
        TooltipModule,
        ImageModule,
    ],
})
export class ViewPaymentAdviceComponent implements OnInit {
    @Input()
    paymentAdvices: PaymentAdviceDto[];

    openDialogRef: DynamicDialogRef;

    totalAmmount: number = 0;
    totalAmountDue: number = 0;

    admin: UserDTO;

    adminProfileUri: string;

    constructor(
        private config: DynamicDialogConfig,
        private dialogService: DialogService,
        private authService: AuthService,
        private router: Router,
        private ref: DynamicDialogRef
    ) {
        this.paymentAdvices = this.config.data;
        for (let item of this.paymentAdvices) {
            this.totalAmmount += item.totalAmount;
            this.totalAmountDue += item.amountDue;
        }
    }

    goToTenantDetailedView(tenantId: number) {
        this.router.navigate([`/admin/master-users/tenant/${tenantId}`]);
    }

    ngOnInit() {
        this.authService
            .GetAdminDetails(this.authService.GetCurrentRole().adminId)
            .subscribe((res) => {
                this.admin = res;
                this.adminProfileUri = API_URL + '/' + this.admin.profileUri;
            });
    }

    receivePayment() {
        this.openDialogRef = this.dialogService.open(
            AdminReceivePaymentPaymentAdviceModalComponent,
            {
                header: 'Receive Payment',
                width: '600px',
                data: this.paymentAdvices,
            }
        );
        this.openDialogRef.onClose.subscribe((res) => {
            if (res && res.status === 200) {
                this.ref.close({ status: 200 });
            }
        });
    }
}
