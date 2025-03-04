import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { CardModule } from 'primeng/card';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';
import { KnobModule } from 'primeng/knob';
import { FormsModule } from '@angular/forms';
import { TabViewModule } from 'primeng/tabview';
import { AdminTenantLeaseComponent } from './admin-tenant-lease/admin-tenant-lease.component';
import { AdminTenantPaymentsComponent } from './admin-tenant-payments/admin-tenant-payments.component';
import { AdminTenantNotificationsComponent } from './admin-tenant-notifications/admin-tenant-notifications.component';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AdminUsersUpdateModalComponent } from '../components/admin-users-update-modal/admin-users-update-modal.component';
import { AdminUserAddOrganizationModalComponent } from '../components/admin-user-add-organization-modal/admin-user-add-organization-modal.component';
import { DividerModule } from 'primeng/divider';
import { OrganiztionDTO } from 'src/app/core/dataservice/organization/organization.dto';
import { AdminEditOrganizationModalComponent } from '../components/admin-edit-organization-modal/admin-edit-organization-modal.component';

@Component({
    selector: 'app-admin-tenant-detailed-view',
    templateUrl: './admin-tenant-detailed-view.component.html',
    styleUrls: ['./admin-tenant-detailed-view.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        AvatarModule,
        KnobModule,
        DividerModule,
        FormsModule,
        TabViewModule,
        AdminTenantLeaseComponent,
        AdminTenantPaymentsComponent,
        ButtonModule,
        AdminTenantNotificationsComponent,
    ],
    providers: [DialogService],
})
export class AdminTenantDetailedViewComponent implements OnInit {
    tenantId: string | null;

    tenant: UserDTO;

    tenantScore: number = 100;
    ref: DynamicDialogRef;

    constructor(
        private route: ActivatedRoute,
        private authService: AuthService,
        private userDataService: UserDataService,
        private dialogService: DialogService
    ) {
        this.tenantId = this.route.snapshot.paramMap.get('tenantId');
    }

    ngOnInit() {
        this.getTenantDetails();
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

    getTenantDetails() {
        this.userDataService
            .AdminFindTenantByUserId(Number(this.tenantId))
            .subscribe({
                next: (res) => {
                    this.tenant = res;
                },
            });
    }

    openUpdateUserDetailsModal() {
        this.ref = this.dialogService.open(AdminUsersUpdateModalComponent, {
            header: 'Update',
            data: {
                ...this.tenant,
            },
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 200) {
                this.getTenantDetails();
            }
        });
    }

    openCreateOrganizationModal() {
        this.ref = this.dialogService.open(
            AdminUserAddOrganizationModalComponent,
            {
                header: 'Add Organization',
                data: {
                    userId: this.tenantId,
                },
            }
        );
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 201) {
                this.getTenantDetails();
            }
        });
    }

    openEditOrganizationModal(item: OrganiztionDTO) {
        this.ref = this.dialogService.open(
            AdminEditOrganizationModalComponent,
            {
                header: 'Edit Organization',
                data: {
                    ...item,
                },
            }
        );
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 200) {
                this.getTenantDetails();
            }
        });
    }

    //LEASE
}
