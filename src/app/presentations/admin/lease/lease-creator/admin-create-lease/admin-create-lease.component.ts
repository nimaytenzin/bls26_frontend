import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    FormGroup,
    FormBuilder,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import {
    DialogService,
    DynamicDialogConfig,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import {
    LEASETYPE,
    LESSEETYPE,
    LEASEUSES,
    LESSORTYPE,
    LEASESTATUS,
    NOTIFICATIONTYPES,
} from 'src/app/core/constants/enums';
import { BankAccountDto } from 'src/app/core/dataservice/bankaccounts/bankaccount.dto';
import { BankAccountDataService } from 'src/app/core/dataservice/bankaccounts/bankaccounts.dataservice';
import { BuildingSurchargeDataService } from 'src/app/core/dataservice/building/building-surcharge.data.service';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { LeaseCreatorStateService } from 'src/app/core/dataservice/lease/create-lease.dataservice';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import {
    PropertyLeaseAvailabilityCheckerReturnDTO,
    CreateLeaseAgreementDTO,
} from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { LeaseRuleDTO } from 'src/app/core/dataservice/lease/lease-rule.dto';
import { LeaseSurchargeDTO } from 'src/app/core/dataservice/lease/lease-surcharge.dto';
import { NotificationService } from 'src/app/core/dataservice/notification/notification.service';
import { OrganiztionDTO } from 'src/app/core/dataservice/organization/organization.dto';
import { UnitSurchargeDataService } from 'src/app/core/dataservice/units/unit-surcharge.data.service';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';
import { BuildingSurchargeDTO } from 'src/app/core/dto/properties/building-surcharge.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { UnitSurchargeDTO } from 'src/app/core/dto/units/unit-surcharge.dto';
import { UnitDTO } from 'src/app/core/dto/units/unit.dto';
import { GETMONTHDIFF, GETDMYFROMDATE } from 'src/app/core/utility/date.helper';
import { AdminUsersCreateModalComponent } from '../../../users/components/admin-users-create-modal/admin-users-create-modal.component';
import { AdminLeaseCreatorPropertySelectorComponent } from '../components/admin-lease-creator-property-selector/admin-lease-creator-property-selector.component';
import { AdminLeaseTimelineComponent } from '../components/admin-lease-timeline/admin-lease-timeline.component';
import { StepsModule } from 'primeng/steps';

@Component({
    selector: 'app-admin-create-lease',
    templateUrl: './admin-create-lease.component.html',
    styleUrls: ['./admin-create-lease.component.css'],
    standalone: true,
    imports: [CommonModule, RouterModule, StepsModule],
    providers: [ConfirmationService],
})
export class AdminCreateLeaseComponent implements OnInit {
    items: MenuItem[] | undefined;

    constructor(private leaseCreatorStateService: LeaseCreatorStateService) {
        this.items = [
            {
                label: 'Property Selection',
                routerLink: 'property',
            },
            {
                label: 'Tenant Selection',
                routerLink: 'parties',
            },
            {
                label: 'Purpose and Charges',
                routerLink: 'general-terms',
            },
            {
                label: 'Terms and Condition',
                routerLink: 'detailed-terms',
            },
            {
                label: 'Finalization',
                routerLink: 'finalize',
            },
        ];
    }

    ngOnInit(): void {
        this.leaseCreatorStateService.propertySelection$.subscribe((res) => {
            console.log('PROPERTY SELECTED', res);
        });
        this.leaseCreatorStateService.tenantSelection$.subscribe((res) => {
            console.log('TENANT SELECTED', res);
        });
    }
}
