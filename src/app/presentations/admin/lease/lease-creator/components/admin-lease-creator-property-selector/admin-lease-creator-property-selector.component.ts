import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { LEASESTATUS, LEASETYPE } from 'src/app/core/constants/enums';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import {
    LeaseAgreeementDTO,
    PropertyLeaseAvailabilityCheckerReturnDTO,
    PropertyLeaseAvailabiltyCheckerDTO,
    PropertyLeaseOverDueReturnDTO,
} from 'src/app/core/dataservice/lease/lease-agreement.dto';
import {
    LeaseCreateState_PropertySelectionStateDTO,
    LeaseCreatorStateService,
} from 'src/app/core/dataservice/lease/create-lease.dataservice';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { PlotDataService } from 'src/app/core/dataservice/land/plot.dataservice';
import { PARSEBUILDINGFLOORS } from 'src/app/core/utility/helper.function';
import { DividerModule } from 'primeng/divider';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { UnitDTO } from 'src/app/core/dto/units/unit.dto';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { AccordionModule } from 'primeng/accordion';
import { Router } from '@angular/router';
import {
    GETDURATIONDIFFINYEAR,
    GETTOTALMONTHS,
} from 'src/app/core/utility/date.helper';

@Component({
    selector: 'app-admin-lease-creator-property-selector',
    templateUrl: './admin-lease-creator-property-selector.component.html',
    styleUrls: ['./admin-lease-creator-property-selector.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        CalendarModule,
        FormsModule,
        AccordionModule,

        TableModule,
        DropdownModule,
        InputTextModule,
        DividerModule,
    ],
})
export class AdminLeaseCreatorPropertySelectorComponent implements OnInit {
    getBuildingFloorConfiguration = PARSEBUILDINGFLOORS;
    calculateMonthsDifference = GETTOTALMONTHS;
    getDurationDiffInYears = GETDURATIONDIFFINYEAR;

    plotId: string;
    selectedPlot: PlotDTO;
    selectedBuilding: BuildingDTO;
    selectedUnit: UnitDTO;

    leaseStartDate;
    leaseEndDate;

    leaseTypes = Object.values(LEASETYPE);
    leaseTypeEnum = LEASETYPE;
    plotArray: PlotDTO[] = [];
    selectedLeaseType = LEASETYPE.LAND;
    searchedPlot: PlotDTO;

    propertyAvailabilityResult: PropertyLeaseAvailabilityCheckerReturnDTO;
    propertyPaymentDueResult: PropertyLeaseOverDueReturnDTO;

    constructor(
        private messageService: MessageService,
        private leaseAgreementDataService: LeaseAgreementDataService,
        private leaseCreatorStateService: LeaseCreatorStateService,
        private plotDataService: PlotDataService,
        private router: Router
    ) {}

    ngOnInit() {}

    fetchPlotDetails() {
        this.plotArray = [];
        this.propertyPaymentDueResult = null;
        this.propertyAvailabilityResult = null;

        this.selectedBuilding = null;
        this.selectedPlot = null;
        this.selectedUnit = null;

        this.plotDataService.SearchPlotById(this.plotId).subscribe({
            next: (res) => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Found',
                    detail: 'Plot Found',
                });
                this.searchedPlot = res;
                this.plotArray.push(res);
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Not Found',
                    detail: err.error.message,
                });
            },
        });
    }

    selectPlot() {
        if (this.selectedLeaseType !== this.leaseTypeEnum.LAND) {
            this.messageService.add({
                severity: 'info',
                summary: 'Lease Type Error',
                detail: 'Lease Type Selected is ' + this.selectedLeaseType,
            });
            return;
        }
        this.selectedPlot = this.searchedPlot;
    }
    removePlotSelection() {
        this.selectedBuilding = null;
        this.selectedPlot = null;
        this.selectedUnit = null;
        this.propertyAvailabilityResult = null;
        this.propertyPaymentDueResult = null;
    }

    selectBuilding(item: BuildingDTO) {
        if (this.selectedLeaseType !== this.leaseTypeEnum.BUILDING) {
            this.messageService.add({
                severity: 'info',
                summary: 'Lease Type Error',
                detail: 'Lease Type Selected is ' + this.selectedLeaseType,
            });
            return;
        }
        this.selectedPlot = this.searchedPlot;
        this.selectedBuilding = item;
    }
    removeBuildingSelection() {
        this.selectedBuilding = null;
        this.selectedPlot = null;
        this.selectedUnit = null;
        this.propertyAvailabilityResult = null;
        this.propertyPaymentDueResult = null;
    }

    selectUnit(item: UnitDTO, building: BuildingDTO) {
        if (this.selectedLeaseType !== this.leaseTypeEnum.UNIT) {
            this.messageService.add({
                severity: 'info',
                summary: 'Lease Type Error',
                detail: 'Lease Type Selected is ' + this.selectedLeaseType,
            });
            return;
        }
        this.selectedBuilding = building;
        this.selectedPlot = this.searchedPlot;
        this.selectedUnit = item;
    }
    removeUnitSelection() {
        this.selectedBuilding = null;
        this.selectedPlot = null;
        this.selectedUnit = null;
        this.propertyAvailabilityResult = null;
        this.propertyPaymentDueResult = null;
    }

    checkPropertyAvailabilityForLease() {
        this.messageService.add({
            severity: 'info',
            summary: 'Checking',
            detail: 'Checking Property availability for lease.',
        });

        let data: PropertyLeaseAvailabiltyCheckerDTO = {
            leaseType: this.selectedLeaseType,
            plotId: this.selectedPlot ? this.selectedPlot.id : null,
            buildingId: this.selectedBuilding ? this.selectedBuilding.id : null,
            unitId: this.selectedUnit ? this.selectedUnit.id : null,
            leaseStartDate: this.leaseStartDate,
            leaseEndDate: this.leaseEndDate,
        };
        this.leaseAgreementDataService
            .CheckPropertyAvailabilityForLease(data)
            .subscribe({
                next: (res) => {
                    this.propertyAvailabilityResult = res;
                    this.getPropertyPaymentDues();
                },

                error: (err) => {
                    console.log(err);
                },
            });
    }

    getPropertyPaymentDues() {
        this.messageService.add({
            severity: 'info',
            summary: 'Fetching',
            detail: 'Getting Payment dues for the property.',
        });
        this.leaseAgreementDataService
            .CheckPropertyPaymentDue({
                leaseType: this.selectedLeaseType,
                plotId: this.selectedPlot ? this.selectedPlot.id : null,
                buildingId: this.selectedBuilding
                    ? this.selectedBuilding.id
                    : null,
                unitId: this.selectedUnit ? this.selectedUnit.id : null,
            })
            .subscribe((res) => {
                console.log('PROEPTY DEUS', res);
                this.propertyPaymentDueResult = res;
            });
    }

    clearPlotSelection() {
        this.selectedPlot = null;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case LEASESTATUS.PENDING:
                return 'bg-red-100 text-red-700 px-1';
            case LEASESTATUS.ACTIVE:
                return 'bg-green-600 text-gray-100 px-1';
            case LEASESTATUS.UPCOMING_EXPIRATION:
                return 'bg-yellow-600 text-gray-100 px-1';
            default:
                return 'bg-gray-100 text-gray-700 px-1';
        }
    }

    getPaymentStatusClass(status: string): string {
        switch (status) {
            case 'DUE':
                return 'bg-red-100 text-red-700 px-1';

            default:
                return 'bg-green-100 text-green-700 px-1';
        }
    }

    getStatusName(status: string): string {
        switch (status) {
            case LEASESTATUS.PENDING:
                return 'Pending';
            case LEASESTATUS.ACTIVE:
                return 'Active';
            case LEASESTATUS.UPCOMING_EXPIRATION:
                return 'Expiring';
            default:
                return 'Terminated';
        }
    }

    computeMonthlyPayable(item: LeaseAgreeementDTO) {
        let total = item.rent;
        for (let i = 0; i < item.leaseSurcharges.length; i++) {
            total += item.leaseSurcharges[i].amount;
        }

        return total;
    }

    openTerminateLeaseModal(item: LeaseAgreeementDTO) {
        this.messageService.add({
            severity: 'info',
            summary: 'Terminating Lease Agreement',
            detail: 'Terminating lease agreement',
        });
    }
    writeOffPaymentAdvice(item: PaymentAdviceDto) {
        this.messageService.add({
            severity: 'info',
            summary: 'Writing off Payment advice',
            detail: 'Writing off payment advice',
        });
    }

    confirmPropertySelection() {
        let propertySelectionData: LeaseCreateState_PropertySelectionStateDTO =
            {
                unit: this.selectedUnit ? this.selectedUnit : null,
                building: this.selectedBuilding ? this.selectedBuilding : null,
                plot: this.selectedPlot ? this.selectedPlot : null,
                leaseType: this.selectedLeaseType,
                leaseStartDate: this.leaseStartDate,
                leaseEndDate: this.getEndDateForTheMonth(this.leaseEndDate),
            };
        this.leaseCreatorStateService.setPropertySelection(
            propertySelectionData
        );
        this.router.navigate(['admin/master-lease/create/parties']);
    }

    getEndDateForTheMonth(selectedDate: Date): Date {
        return new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            0
        );
    }
}
