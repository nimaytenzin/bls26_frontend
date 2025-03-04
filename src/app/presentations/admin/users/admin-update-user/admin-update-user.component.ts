import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { ImageModule } from 'primeng/image';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { API_URL } from 'src/app/core/constants/constants';
import { USERROLESENUM } from 'src/app/core/constants/enums';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import {
    AuthenticatedUserDTO,
    CurrentRoleDTO,
} from 'src/app/core/dataservice/users-and-auth/dto/auth.dto';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';

@Component({
    selector: 'app-admin-update-user',
    templateUrl: './admin-update-user.component.html',
    styleUrls: ['./admin-update-user.component.css'],
    standalone: true,
    imports: [
        ButtonModule,
        DividerModule,
        InputTextModule,
        InputNumberModule,
        ReactiveFormsModule,
        CommonModule,
        InputGroupModule,
        InputGroupAddonModule,
        ImageModule,
        DialogModule,
        PasswordModule,
        FormsModule,
    ],
})
export class AdminUpdateUserComponent implements OnInit {
    updateUserForm: FormGroup;
    isSubmitting: boolean = false;

    showPasswordChangeModal: boolean = false;
    newPassword: string;
    newPasswordReentry: string;

    userDetails: UserDTO;
    admin: UserDTO;

    authenticatedUser: AuthenticatedUserDTO;
    currentRole: CurrentRoleDTO;
    adminProfileUri: string;
    userRoleEnum = USERROLESENUM;

    constructor(
        private fb: FormBuilder,
        private userDataService: UserDataService,
        private authService: AuthService,
        private messageService: MessageService,
        private userService: UserDataService
    ) {
        this.updateUserForm = this.fb.group({
            nameEnglish: ['', Validators.required],
            nameDzongkha: [''],
            cid: [''],
            email: [''],
            phoneNumber: ['', Validators.required],
            permanentAddress: [''],
        });

        this.authenticatedUser = this.authService.GetAuthenticatedUser();
        this.currentRole = this.authService.GetCurrentRole();
        if (this.currentRole.name === USERROLESENUM.ADMIN) {
            this.userService
                .FindOneAuthenticated(this.authenticatedUser.id)
                .subscribe((res) => {
                    this.admin = res;
                    console.log(res, 'ADMIN');
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
                    console.log(res, 'ADMIN');
                    this.adminProfileUri =
                        API_URL + '/' + this.admin.profileUri;
                });
        }
    }

    ngOnInit() {
        this.getUserDetails();
    }

    updatePassword() {
        if (!this.newPassword || !this.newPasswordReentry) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Fields',
                detail: 'Please enter the new password and reenter the new password',
                life: 3000,
            });
            return;
        }
        if (this.newPassword !== this.newPasswordReentry) {
            this.messageService.add({
                severity: 'error',
                summary: 'Mismatch',
                detail: 'Password mismatch.',
                life: 3000,
            });
            return;
        }

        this.authService
            .UpdatePassword({
                userId: this.authService.GetAuthenticatedUser().id,
                newPassword: this.newPassword,
                newPasswordRentry: this.newPasswordReentry,
                role: this.authService.GetCurrentRole().name,
                adminId: this.authService.GetCurrentRole().adminId,
            })
            .subscribe({
                next: (res) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Password reset successfully.',
                        life: 3000,
                    });
                    this.showPasswordChangeModal = false;
                    setTimeout(() => {
                        this.authService.LogOut();
                    }, 1000);
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error.message,
                        life: 3000,
                    });
                    this.showPasswordChangeModal = false;
                    this.newPassword = null;
                    this.newPasswordReentry = null;
                },
            });
    }

    getUserDetails() {
        this.userDataService
            .FindOneAuthenticated(this.authService.GetAuthenticatedUser().id)
            .subscribe({
                next: (res) => {
                    this.userDetails = res;
                    console.log('DATA', this.userDetails);
                    this.updateUserForm.patchValue({
                        ...this.userDetails,
                    });
                },
            });
    }
    updateUserDetails() {
        this.isSubmitting = true;
        this.authService
            .UpdateUserDetails(this.authService.GetAuthenticatedUser().id, {
                nameEnglish: this.updateUserForm.controls['nameEnglish'].value,
                nameDzongkha:
                    this.updateUserForm.controls['nameDzongkha'].value,
                cid: this.updateUserForm.controls['cid'].value,
                phoneNumber: this.updateUserForm.controls['phoneNumber'].value,
                permanentAddress:
                    this.updateUserForm.controls['permanentAddress'].value,
                email: this.updateUserForm.controls['email'].value,
            })
            .subscribe((res) => {
                this.isSubmitting = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'User updated successfully',
                    life: 3000,
                });

                this.getUserDetails();
            });
    }
}
