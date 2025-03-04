import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { AdminLayoutService } from '../service/admin-layout.service';
import {
    API_URL,
    COMPANY_NAME,
    ZHIDHAYCONTACTDETAILS,
} from 'src/app/core/constants/constants';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { SidebarModule } from 'primeng/sidebar';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';
import { USERROLESENUM } from 'src/app/core/constants/enums';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { AdminUpdateUserComponent } from 'src/app/presentations/admin/users/admin-update-user/admin-update-user.component';
import {
    AuthenticatedUserDTO,
    CurrentRoleDTO,
} from 'src/app/core/dataservice/users-and-auth/dto/auth.dto';

@Component({
    selector: 'app-admin-topbar',
    templateUrl: './admin-topbar.component.html',
    styleUrls: ['./admin-topbar.component.css'],
    standalone: true,
    imports: [
        OverlayPanelModule,
        CommonModule,
        DividerModule,
        ButtonModule,
        PasswordModule,
        ToastModule,
        ConfirmPopupModule,
        SidebarModule,
        AdminUpdateUserComponent,
        DialogModule,
        FormsModule,
        InputTextModule,
    ],
    providers: [ConfirmationService, MessageService],
})
export class AdminTopbarComponent {
    items!: MenuItem[];
    companyDetails = ZHIDHAYCONTACTDETAILS;
    @ViewChild('menubutton') menuButton!: ElementRef;

    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;

    @ViewChild('topbarmenu') menu!: ElementRef;

    authenticatedUser: AuthenticatedUserDTO;
    currentRole: CurrentRoleDTO;

    profileSideBarVisible: boolean = false;

    admin: UserDTO;
    adminProfileUri: string;

    isNotVerified: boolean = false;

    newPassword: string | null;
    newPasswordReentry: string | null;
    constructor(
        public layoutService: AdminLayoutService,
        private authService: AuthService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private userService: UserDataService
    ) {
        this.authenticatedUser = this.authService.GetAuthenticatedUser();
        this.currentRole = this.authService.GetCurrentRole();
        this.isNotVerified = !Boolean(this.authenticatedUser.isVerified);

        console.log(this.isNotVerified);
        if (this.currentRole.name === USERROLESENUM.ADMIN) {
            this.userService
                .FindOneAuthenticated(this.authenticatedUser.id)
                .subscribe((res) => {
                    this.admin = res;
                    this.adminProfileUri =
                        API_URL + '/' + this.admin.profileUri;
                });
        } else if (
            this.currentRole.name === USERROLESENUM.MANAGER ||
            USERROLESENUM.OWNER
        ) {
            this.userService
                .FindOneAuthenticated(this.currentRole.adminId)
                .subscribe((res) => {
                    this.admin = res;
                    this.adminProfileUri =
                        API_URL + '/' + this.admin.profileUri;
                });
        }
    }

    logout() {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Are you sure you want to Logout?',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Logging out',
                    detail: 'You have been logged out',
                    life: 3000,
                });
                this.authService.LogOut();
            },
        });
    }

    resetPassword() {
        this.authService
            .UpdatePassword({
                userId: this.authenticatedUser.id,
                newPassword: this.newPassword,
                newPasswordRentry: this.newPasswordReentry,
                role: this.currentRole.name,
                adminId: this.currentRole.adminId,
            })
            .subscribe((res) => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Password Updated',
                    detail: 'Please Login again',
                    life: 3000,
                });
                this.authService.LogOut();
            });
    }
}
