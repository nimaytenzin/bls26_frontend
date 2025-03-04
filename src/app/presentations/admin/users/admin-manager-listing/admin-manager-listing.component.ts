import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { OrganiztionDTO } from 'src/app/core/dataservice/organization/organization.dto';
import { OwnerDTO } from 'src/app/core/dataservice/owners/dto/owner.dto';
import { OwnerDataService } from 'src/app/core/dataservice/owners/owner.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';
import { AdminEditOrganizationModalComponent } from '../components/admin-edit-organization-modal/admin-edit-organization-modal.component';
import { AdminUserAddOrganizationModalComponent } from '../components/admin-user-add-organization-modal/admin-user-add-organization-modal.component';
import { AdminUsersCreateModalComponent } from '../components/admin-users-create-modal/admin-users-create-modal.component';
import { USERROLESENUM } from 'src/app/core/constants/enums';
import { AdminUsersUpdateModalComponent } from '../components/admin-users-update-modal/admin-users-update-modal.component';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-admin-manager-listing',
    templateUrl: './admin-manager-listing.component.html',
    styleUrls: ['./admin-manager-listing.component.css'],
    standalone: true,
    imports: [
        TableModule,
        ButtonModule,
        CommonModule,
        ConfirmDialogModule,
        ChipModule,
        DividerModule,
        InputTextModule,
    ],
    providers: [DialogService, ConfirmationService],
})
export class AdminManagerListingComponent implements OnInit {
    ref: DynamicDialogRef;

    managers: UserDTO[];

    constructor(
        private dialogService: DialogService,
        private ownerDataService: OwnerDataService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private userDataService: UserDataService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.getAllManagersByAdmin();
    }

    openCreateUserModal() {
        this.ref = this.dialogService.open(AdminUsersCreateModalComponent, {
            header: 'Create User',
            data: {
                role: USERROLESENUM.MANAGER,
                allowLoginAccess: true,
                adminId: this.authService.GetAuthenticatedUser().id,
            },
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 201) {
                this.getAllManagersByAdmin();
            }
        });
    }

    openUpdateOwnerModal(user: UserDTO) {
        this.ref = this.dialogService.open(AdminUsersUpdateModalComponent, {
            header: 'Update',
            data: {
                ...user,
            },
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 200) {
                this.getAllManagersByAdmin();
            }
        });
    }

    getAllManagersByAdmin() {
        this.userDataService
            .AdminGetAllManagersByAdmin(
                this.authService.GetCurrentRole().adminId
            )
            .subscribe({
                next: (res) => {
                    this.managers = res;
                },
            });
    }

    downloadMasterTable() {}

    disableLoginAccess(item: UserDTO) {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message:
                'Are you sure that you want to Disable Login for ' +
                item.nameEnglish +
                '?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptIcon: 'none',
            rejectIcon: 'none',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.authService
                    .AdminDisableUserLogin({
                        userId: item.id,
                    })
                    .subscribe((res) => {
                        if (res) {
                            this.messageService.add({
                                severity: 'info',
                                summary: 'Login Disabled',
                                detail:
                                    'Login disabled for ' + item.nameEnglish,
                            });
                            this.getAllManagersByAdmin();
                        }
                    });
            },
        });
    }

    enableLoginAccess(item: UserDTO) {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message:
                'Are you sure that you want to Enable Login for ' +
                item.nameEnglish +
                '?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptIcon: 'none',
            rejectIcon: 'none',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.authService
                    .AdminEnableUserLogin({
                        userId: item.id,
                    })
                    .subscribe({
                        next: (res) => {
                            if (res) {
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Login Disabled',
                                    detail:
                                        'Login enabled for ' + item.nameEnglish,
                                });
                                this.getAllManagersByAdmin();
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
                                this.getAllManagersByAdmin();
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
