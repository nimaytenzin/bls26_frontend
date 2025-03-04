import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { OwnerDTO } from 'src/app/core/dataservice/owners/dto/owner.dto';
import { OwnerDataService } from 'src/app/core/dataservice/owners/owner.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';
import { AdminUserAddOrganizationModalComponent } from '../components/admin-user-add-organization-modal/admin-user-add-organization-modal.component';
import { OrganiztionDTO } from 'src/app/core/dataservice/organization/organization.dto';
import { AdminEditOrganizationModalComponent } from '../components/admin-edit-organization-modal/admin-edit-organization-modal.component';
import { AdminUsersCreateModalComponent } from '../components/admin-users-create-modal/admin-users-create-modal.component';
import { USERROLESENUM } from 'src/app/core/constants/enums';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FormsModule } from '@angular/forms';
import { AdminSearchTenantModalComponent } from '../components/admin-search-tenant-modal/admin-search-tenant-modal.component';
import { AdminUsersUpdateModalComponent } from '../components/admin-users-update-modal/admin-users-update-modal.component';
import { Router } from '@angular/router';
import { AdminUsersUpdatePhoneNumberModalComponent } from '../components/admin-users-update-phone-number-modal/admin-users-update-phone-number-modal.component';

@Component({
    selector: 'app-admin-tenant-listing',
    templateUrl: './admin-tenant-listing.component.html',
    styleUrls: ['./admin-tenant-listing.component.css'],
    standalone: true,
    imports: [
        TableModule,
        ButtonModule,
        CommonModule,
        ConfirmDialogModule,
        ChipModule,
        DividerModule,
        InputGroupModule,
        InputNumberModule,
        InputGroupAddonModule,
        FormsModule,
    ],
    providers: [DialogService, ConfirmationService],
})
export class AdminTenantListingComponent implements OnInit {
    ref: DynamicDialogRef;

    owners: UserDTO[];

    searchTenantPhoneNumber: number;

    constructor(
        private dialogService: DialogService,
        private ownerDataService: OwnerDataService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private userDataService: UserDataService,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit() {
        this.getAllTenantsByAdmin();
    }

    openCreateUserModal() {
        this.ref = this.dialogService.open(AdminUsersCreateModalComponent, {
            header: 'Create User',
            data: {
                role: USERROLESENUM.TENANT,
                allowLoginAccess: true,
                adminId: this.authService.GetCurrentRole().adminId,
            },
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 201) {
                this.ref = this.dialogService.open(
                    AdminSearchTenantModalComponent,
                    {
                        header: 'Tenant Details',
                        data: {
                            phoneNumber: res.phoneNumber,
                        },
                    }
                );
            }
        });
    }

    searchTenant() {
        if (!this.searchTenantPhoneNumber) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Input',
                detail: 'Please Enter a phone number to search',
            });
            return;
        }
        this.ref = this.dialogService.open(AdminSearchTenantModalComponent, {
            header: 'Search Tenant',
            data: {
                phoneNumber: this.searchTenantPhoneNumber,
            },
            closable: false,
        });
    }

    openUpdateUserModal(user: UserDTO) {
        this.ref = this.dialogService.open(AdminUsersUpdateModalComponent, {
            header: 'Update',
            data: {
                ...user,
            },
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 200) {
                this.getAllTenantsByAdmin();
            }
        });
    }

    openUpdatePhoneNumberModal(user: UserDTO) {
        this.ref = this.dialogService.open(
            AdminUsersUpdatePhoneNumberModalComponent,
            {
                header: 'Update Phone Number',
                data: {
                    ...user,
                },
            }
        );
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 200) {
                this.getAllTenantsByAdmin();
            }
        });
    }
    openDeleteOwnerModal(owner: OwnerDTO) {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message:
                'Do you want to delete this record?Associated Data with the owners may get affected.',
            header: 'Delete Confirmation',
            icon: 'pi pi-info-circle',
            acceptButtonStyleClass: 'p-button-danger p-button-text',
            rejectButtonStyleClass: 'p-button-text p-button-text',
            acceptIcon: 'none',
            rejectIcon: 'none',

            accept: () => {
                this.ownerDataService.DeleteOwner(owner.id).subscribe({
                    next: (res) => {
                        if (res) {
                            this.getAllTenantsByAdmin();
                            this.messageService.add({
                                severity: 'info',
                                summary: 'Confirmed',
                                detail: 'Owner deleted',
                            });
                        }
                    },
                });
            },
            reject: () => {},
        });
    }

    getAllTenantsByAdmin() {
        this.userDataService
            .AdminGetAllTenants(this.authService.GetCurrentRole().adminId)
            .subscribe({
                next: (res) => {
                    console.log(res);
                    this.owners = res;
                },
            });
    }

    openCreateOrganizationModal(item: UserDTO) {
        this.ref = this.dialogService.open(
            AdminUserAddOrganizationModalComponent,
            {
                header: 'Add Organization',
                data: {
                    userId: item.id,
                },
            }
        );
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 201) {
                this.getAllTenantsByAdmin();
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
                this.getAllTenantsByAdmin();
            }
        });
    }

    downloadMasterTable() {}

    goToDetailedTenantView(item: UserDTO) {
        this.router.navigate(['/admin/master-users/tenant/' + item.id]);
    }

    requestPasswordReset(item: UserDTO) {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message:
                'Are you sure that you want to Reset Password for ' +
                item.nameEnglish +
                '?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptIcon: 'none',
            rejectIcon: 'none',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.authService
                    .AdminRequestPasswordReset({
                        phoneNumber: item.phoneNumber,
                    })
                    .subscribe({
                        next: (res) => {
                            if (res) {
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Password Reset',
                                    detail:
                                        'Password reset for ' +
                                        item.nameEnglish,
                                });
                                this.getAllTenantsByAdmin();
                            }
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'info',
                                summary: 'Error',
                                detail: err.error.message,
                            });
                        },
                    });
            },
        });
    }
}
