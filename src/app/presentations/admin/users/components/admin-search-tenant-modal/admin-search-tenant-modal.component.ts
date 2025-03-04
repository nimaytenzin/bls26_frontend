import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import {
    DialogService,
    DynamicDialogConfig,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { AdminUserAddOrganizationModalComponent } from '../admin-user-add-organization-modal/admin-user-add-organization-modal.component';
import { AdminEditOrganizationModalComponent } from '../admin-edit-organization-modal/admin-edit-organization-modal.component';
import { OrganiztionDTO } from 'src/app/core/dataservice/organization/organization.dto';
import { AdminUsersUpdateModalComponent } from '../admin-users-update-modal/admin-users-update-modal.component';

@Component({
    selector: 'app-admin-search-tenant-modal',
    templateUrl: './admin-search-tenant-modal.component.html',
    styleUrls: ['./admin-search-tenant-modal.component.css'],
    standalone: true,
    imports: [CommonModule, DividerModule, ButtonModule],
})
export class AdminSearchTenantModalComponent implements OnInit {
    phoneNumber: number | null = null;
    tenant: UserDTO | null = null;
    tenantFound: boolean = false;

    constructor(
        private config: DynamicDialogConfig,
        private messageService: MessageService,
        private ref: DynamicDialogRef,
        private authService: AuthService,
        private dialogService: DialogService
    ) {
        if (!this.config.data.phoneNumber) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Input',
                detail: 'Please Supply a phone number',
            });
            this.ref.close();
        } else {
            this.phoneNumber = this.config.data.phoneNumber;
            this.authService.GetTenantDetails(this.phoneNumber).subscribe({
                next: (res) => {
                    this.tenantFound = true;
                    this.tenant = res;
                },
                error: (err) => {
                    this.tenantFound = false;

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Not Found',
                        detail: err.error.message,
                    });
                },
            });
        }
    }

    getUpdatedTenantDetails() {
        this.authService.GetTenantDetails(this.phoneNumber).subscribe({
            next: (res) => {
                this.tenantFound = true;
                this.tenant = res;
            },
        });
    }

    openUpdateUserModal() {
        this.ref = this.dialogService.open(AdminUsersUpdateModalComponent, {
            header: 'Update',
            data: {
                ...this.tenant,
            },
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 200) {
                this.getUpdatedTenantDetails();
            }
        });
    }

    ngOnInit() {}

    close() {
        console.log('CLISE');
        this.ref.close();
    }

    openCreateOrganizationModal() {
        this.ref = this.dialogService.open(
            AdminUserAddOrganizationModalComponent,
            {
                header: 'Add Organization',
                data: {
                    userId: this.tenant.id,
                },
            }
        );
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 201) {
                this.getUpdatedTenantDetails();
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
                this.getUpdatedTenantDetails();
            }
        });
    }
}
