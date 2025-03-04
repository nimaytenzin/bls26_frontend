import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { SelectButtonModule } from 'primeng/selectbutton';
import {
    LEASESTATUS,
    LEASETYPE,
    LESSEETYPE,
    LESSORTYPE,
    NOTIFICATIONTYPES,
} from 'src/app/core/constants/enums';
import {
    LeaseCreateState_LeasePurposeAndChargesDTO,
    LeaseCreateState_LeaseTermsDTO,
    LeaseCreateState_PropertySelectionStateDTO,
    LeaseCreateState_TenantSelectionStateDTO,
    LeaseCreatorStateService,
} from 'src/app/core/dataservice/lease/create-lease.dataservice';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import { CreateLeaseAgreementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { NotificationService } from 'src/app/core/dataservice/notification/notification.service';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { GETMONTHDIFF, GETTOTALMONTHS } from 'src/app/core/utility/date.helper';

@Component({
    selector: 'app-admin-lease-creator-lease-finalization',
    templateUrl: './admin-lease-creator-lease-finalization.component.html',
    styleUrls: ['./admin-lease-creator-lease-finalization.component.css'],
    standalone: true,
    imports: [
        ButtonModule,
        DividerModule,
        CommonModule,
        ConfirmPopupModule,
        DialogModule,
        SelectButtonModule,
        FormsModule,
    ],
    providers: [ConfirmationService],
})
export class AdminLeaseCreatorLeaseFinalizationComponent implements OnInit {
    leaseTypeEnum = LEASETYPE;
    calculateMonthsDifference = GETTOTALMONTHS;
    propertyDetails: LeaseCreateState_PropertySelectionStateDTO;
    tenantDetails: LeaseCreateState_TenantSelectionStateDTO;
    leasePurposeAndCharges: LeaseCreateState_LeasePurposeAndChargesDTO;
    leaseTerms: LeaseCreateState_LeaseTermsDTO;
    showConfirmLeaseCreateModal: boolean = false;

    notifyLeaseCreation: boolean = false;
    notifySecurityDepositPayment: boolean = false;
    notifyLeaseAcceptance: boolean = false;

    createdLeaseId: number;

    yesNoOptions = [
        {
            name: 'Yes',
            value: true,
        },
        {
            name: 'No',
            value: false,
        },
    ];

    constructor(
        private leaseCreatorStateService: LeaseCreatorStateService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private notificationService: NotificationService,
        private authService: AuthService,
        private leaseAgreementDataService: LeaseAgreementDataService,
        private router: Router
    ) {
        this.leaseCreatorStateService.propertySelection$.subscribe((res) => {
            this.propertyDetails = res;
        });
        this.leaseCreatorStateService.tenantSelection$.subscribe((res) => {
            this.tenantDetails = res;
        });
        this.leaseCreatorStateService.leasePurposeAndCharge$.subscribe(
            (res) => {
                this.leasePurposeAndCharges = res;
            }
        );
        this.leaseCreatorStateService.leaseTerms$.subscribe((res) => {
            this.leaseTerms = res;
        });
    }

    ngOnInit() {
        this.checkLeaseStatus();
    }

    checkLeaseStatus() {
        if (!this.propertyDetails) {
            this.router.navigate(['admin/master-lease/create/property']);
        }
    }

    getTotalMonthlyPayabe() {
        let total = Number(this.leasePurposeAndCharges.rent);
        this.leasePurposeAndCharges.leaseCharges.forEach((item) => {
            total += item.amount;
        });
        return total;
    }

    confirmCreateLeaseAgreement() {
        this.showConfirmLeaseCreateModal = true;
    }

    formatDateToLocalISO = (date: string | Date): string => {
        if (!date) return null;
        const localDate = new Date(date);
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(localDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`; // Format as 'YYYY-MM-DD'
    };

    createLeaseAgreement() {
        let data: CreateLeaseAgreementDTO = {
            // Populate the lease agreement details
            type: this.propertyDetails.leaseType,
            status: LEASESTATUS.PENDING,
            adminId: this.authService.GetCurrentRole().adminId,
            bankAccountId: this.leasePurposeAndCharges.selectedBankAcccount.id,
            lesseeType: this.tenantDetails.lesseeType,
            lessorType: this.tenantDetails.lessorType,
            entryDamageReportSubmitted: false,
            securityDepositPaid: false,
            leaseDurationMonths: this.calculateMonthsDifference(
                new Date(this.propertyDetails.leaseStartDate),
                new Date(this.propertyDetails.leaseEndDate)
            ),
            leaseStartDate: this.formatDateToLocalISO(
                this.propertyDetails.leaseStartDate
            ),
            leaseEndDate: this.formatDateToLocalISO(
                this.propertyDetails.leaseEndDate
            ),

            rent: this.leasePurposeAndCharges.rent,
            securityDepositAmount:
                this.leasePurposeAndCharges.securityDepositAmount,
            paymentDueDay: this.leaseTerms.paymentDueDay,
            penaltyPercentagePerAnnum:
                this.leaseTerms.penaltyPercentagePerAnnum,
            applyLatePaymentFee: true,
            plotId: this.propertyDetails.plot.id,
            buildingId:
                this.propertyDetails.leaseType ===
                    this.leaseTypeEnum.BUILDING ||
                this.propertyDetails.leaseType === this.leaseTypeEnum.UNIT
                    ? this.propertyDetails.building.id
                    : null,
            tenantId: this.tenantDetails.tenant.id,
            unitId:
                this.propertyDetails.leaseType === this.leaseTypeEnum.UNIT
                    ? this.propertyDetails.unit.id
                    : null,
            use: this.leasePurposeAndCharges.selectedUse,
            tenantSubletAuthority: this.leaseTerms.tenantSubletAuthority,
            tenantPrematureTermination:
                this.leaseTerms.tenantPrematureTermination,
            ownerPrematureTermination:
                this.leaseTerms.ownerPrematureTermination,
            rentIncreaseNoticePeriod: this.leaseTerms.rentIncreaseNoticePeriod,
            vacationNoticePeriod: this.leaseTerms.vacationNoticePeriod,
            evictionNoticePeriod: this.leaseTerms.evictionNoticePeriod,
            rentIncrementPercentage: this.leaseTerms.rentIncrementPercentage,
            rentIncrementDurationYear:
                this.leaseTerms.rentIncrementDurationYear,
            leaseSurcharges: this.leasePurposeAndCharges.leaseCharges,
            leaseRules: this.leaseTerms.leaseRules,
        };

        // Add additional data for land lease
        if (data.type === LEASETYPE.LAND) {
            data.ratePerArea = this.leasePurposeAndCharges.ratePerArea;
            data.areaLeased = this.leasePurposeAndCharges.areaLeased;
            data.areaUnit = this.leasePurposeAndCharges.areaUnit;
        }

        // Add organization ID for non-individual lessees
        if (data.lesseeType !== LESSEETYPE.INDIVIDUAL) {
            data.organizationId = this.tenantDetails.organization.id;
        }

        this.leaseAgreementDataService.CreateLeaseAgreement(data).subscribe({
            next: (res) => {
                if (res) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Created',
                        detail: 'Lease Agreement Created! Tenant must accept to activate.',
                    });
                    if (this.notifyLeaseCreation) {
                        this.sendLeaseCreationNotification(
                            res.id,
                            res.tenantId
                        );
                    }
                    if (this.notifySecurityDepositPayment) {
                        this.sendSecurityDepositReminder(res.id, res.tenantId);
                    }
                    if (this.notifyLeaseAcceptance) {
                        this.sendLeaseAcceptanceReminder(res.id, res.tenantId);
                    }
                    setTimeout(() => {
                        this.router.navigate([
                            'admin/master-lease/view/' + res.id,
                        ]);
                    }, 1);
                }
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed to Create',
                    detail: err.error.message,
                });
            },
        });
    }

    sendLeaseCreationNotification(leaseId: number, tenantId: number) {
        this.notificationService
            .SendNotification({
                fromUserId: this.authService.GetCurrentRole().adminId,
                toUserId: tenantId,
                notificationType: NOTIFICATIONTYPES.LEASE_CREATION,
                leaseAgreementId: leaseId,
            })
            .subscribe(() => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Notified',
                    detail: 'Lease Creation Notification Sent',
                });
            });
    }

    sendSecurityDepositReminder(leaseId: number, tenantId: number) {
        this.notificationService
            .SendNotification({
                fromUserId: this.authService.GetCurrentRole().adminId,
                toUserId: tenantId,
                notificationType:
                    NOTIFICATIONTYPES.SECUTIRYDEPOSIT_PAYMENT_REMINDER,
                leaseAgreementId: leaseId,
            })
            .subscribe(() => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Notified',
                    detail: 'Security Deposit Payment Reminder Sent',
                });
            });
    }

    sendLeaseAcceptanceReminder(leaseId: number, tenantId: number) {
        this.notificationService
            .SendNotification({
                fromUserId: this.authService.GetCurrentRole().adminId,
                toUserId: tenantId,
                notificationType: NOTIFICATIONTYPES.LEASE_SIGNING_REMINDER,
                leaseAgreementId: leaseId,
            })
            .subscribe(() => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Notified',
                    detail: 'Lease Signing Reminder Sent',
                });
            });
    }
}
