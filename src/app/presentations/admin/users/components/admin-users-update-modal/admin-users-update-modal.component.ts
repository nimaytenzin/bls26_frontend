import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
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
import { USERROLESENUM } from 'src/app/core/constants/enums';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import {
    CreateUserDTO,
    UpdateUserDetailsDTO,
    UserDTO,
} from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';

@Component({
    selector: 'app-admin-users-update-modal',
    templateUrl: './admin-users-update-modal.component.html',
    styleUrls: ['./admin-users-update-modal.component.css'],

    standalone: true,
    imports: [
        InputGroupModule,
        InputGroupAddonModule,
        InputTextModule,
        InputNumberModule,
        ButtonModule,
        DropdownModule,
        ReactiveFormsModule,
        CheckboxModule,
        CommonModule,
    ],
    providers: [DialogService],
})
export class AdminUsersUpdateModalComponent implements OnInit {
    updateUserForm: FormGroup;

    isSubmitting: boolean = false; // Add this flag
    passedUser: UserDTO;

    constructor(
        private fb: FormBuilder,
        private ref: DynamicDialogRef,
        private userDataService: UserDataService,
        private authService: AuthService,
        private config: DynamicDialogConfig,
        private messageService: MessageService
    ) {
        this.passedUser = this.config.data;
    }

    ngOnInit() {
        this.updateUserForm = this.fb.group({
            nameEnglish: ['', [Validators.required]],
            nameDzongkha: [''],

            cid: [''],

            permanentAddress: [''],
            email: [''],
            hasLoginAccess: ['', [Validators.required]],
        });
        this.updateUserForm.patchValue({
            ...this.passedUser,
        });
    }

    updateUser() {
        if (this.isSubmitting) return; // Prevent multiple submissions

        const data: UpdateUserDetailsDTO = {
            nameEnglish: this.updateUserForm.controls['nameEnglish'].value,
            email: this.updateUserForm.controls['email'].value || null,
            cid: this.updateUserForm.controls['cid'].value || null,
            permanentAddress:
                this.updateUserForm.controls['permanentAddress'].value,
            nameDzongkha:
                this.updateUserForm.controls['nameDzongkha'].value || null,
        };

        // Disable the form and button while submitting
        this.isSubmitting = true;

        this.messageService.add({
            severity: 'info',
            summary: 'Updating User',
            detail: 'Updating user information...',
            life: 3000,
        });

        // Call the update API
        this.userDataService
            .AdminUpdateUserDetails(this.passedUser.id, data)
            .subscribe({
                next: (res) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'User updated successfully',
                        life: 3000,
                    });
                    this.isSubmitting = false; // Re-enable the form
                    this.ref.close({ status: 200, updatedUser: res });
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error Updating User',
                        detail: err.error.message,
                    });
                    this.isSubmitting = false; // Re-enable the form in case of error
                },
            });
    }

    close() {
        this.ref.close();
    }
}
