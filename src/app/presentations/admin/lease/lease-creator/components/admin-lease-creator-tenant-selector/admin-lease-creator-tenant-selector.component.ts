import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { KnobModule } from 'primeng/knob';
import {
    LEASEUSES,
    LESSEETYPE,
    LESSORTYPE,
} from 'src/app/core/constants/enums';
import {
    LeaseCreateState_TenantSelectionStateDTO,
    LeaseCreatorStateService,
} from 'src/app/core/dataservice/lease/create-lease.dataservice';
import { OrganiztionDTO } from 'src/app/core/dataservice/organization/organization.dto';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';

@Component({
    selector: 'app-admin-lease-creator-tenant-selector',
    templateUrl: './admin-lease-creator-tenant-selector.component.html',
    styleUrls: ['./admin-lease-creator-tenant-selector.component.css'],
    standalone: true,
    imports: [
        RouterModule,
        DividerModule,
        DropdownModule,
        InputNumberModule,
        InputGroupModule,
        InputGroupAddonModule,
        FormsModule,
        ButtonModule,
        CommonModule,
        AvatarModule,
        KnobModule,
    ],
})
export class AdminLeaseCreatorTenantSelectorComponent implements OnInit {
    selectedOrganization: OrganiztionDTO | null = null;
    searchPhoneNumber: number;
    searchedUser: UserDTO;

    selectedTenant: UserDTO;

    tenantScore: number = 100;

    lesseeTypeEnum = LESSEETYPE;
    lesseeTypes = Object.values(LESSEETYPE);
    selectedLesseeType: LESSEETYPE = LESSEETYPE.INDIVIDUAL;

    lessorTypes = Object.values(LESSORTYPE);
    selectedLessorType: LESSORTYPE = LESSORTYPE.ADMIN;

    constructor(
        private router: Router,
        private leaseCreatorStateService: LeaseCreatorStateService,
        private messageService: MessageService,
        private userDataService: UserDataService
    ) {}

    ngOnInit() {
        // this.checkIfPropertyVerified();
    }

    checkIfPropertyVerified() {
        this.leaseCreatorStateService.propertySelection$.subscribe((res) => {
            if (res === null) {
                this.router.navigate(['admin/master-lease/create']);
            }
        });
    }

    getColorForScore(score: number): string {
        if (score < 30) {
            return 'Crimson';
        } else if (score < 60) {
            return 'DarkOrange';
        } else if (score < 80) {
            return 'Gold';
        } else if (score < 90) {
            return 'MediumSeaGreen';
        } else {
            return 'MediumSlateBlue';
        }
    }

    SearchTenantByPhoneNumber() {
        this.userDataService
            .AdminSearchTenantByPhoneNumber(this.searchPhoneNumber)
            .subscribe({
                next: (res) => {
                    this.searchedUser = res;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Tenant Found!',
                        detail:
                            'Tenant with phone ' +
                            this.searchedUser.phoneNumber +
                            '  found.',
                    });
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Tenant Not Found!',
                        detail:
                            'Tenant with phone ' +
                            this.searchPhoneNumber +
                            ' not found.',
                    });
                },
            });
    }

    confirmTenantPartySelection() {
        this.selectedTenant = this.searchedUser;
    }

    saveAndProceed() {
        let tenantSelectionData: LeaseCreateState_TenantSelectionStateDTO = {
            lessorType: this.selectedLessorType,
            lesseeType: this.selectedLesseeType,
            tenant: this.searchedUser,
            organization: this.selectedOrganization,
        };
        this.leaseCreatorStateService.setTenantSelection(tenantSelectionData);
        this.router.navigate(['admin/master-lease/create/general-terms']);
    }
}
