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
import { CreateUserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { UserDataService } from 'src/app/core/dataservice/users-and-auth/user.dataservice';

@Component({
    selector: 'app-admin-users-create-modal',
    templateUrl: './admin-users-create-modal.component.html',
    styleUrls: ['./admin-users-create-modal.component.css'],
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
export class AdminUsersCreateModalComponent implements OnInit {
    createUserForm: FormGroup;
    role: USERROLESENUM;
    adminId: number;
    hasLoginAccess: boolean = false;
    isSubmitting: boolean = false;

    constructor(
        private fb: FormBuilder,
        private ref: DynamicDialogRef,
        private userDataService: UserDataService,
        private config: DynamicDialogConfig,
        private messageService: MessageService
    ) {
        this.role = this.config.data.role;
        this.adminId = this.config.data.adminId;
        // this.hasLoginAccess = this.config.data.allowLoginAccess
        //     ? this.config.data.allowLoginAccess
        //     : false;
    }

    ngOnInit() {
        this.createUserForm = this.fb.group({
            nameEnglish: ['', [Validators.required]],
            nameDzongkha: [null],
            phoneNumber: [null],
            cid: [null],

            email: [null],
            permanentAddress: [null],
            hasLoginAccess: [this.hasLoginAccess, [Validators.required]],
        });
    }

    createUser() {
        if (this.isSubmitting) return;

        let data: CreateUserDTO;
        // this.isSubmitting = true;

        data = {
            hasLoginAccess:
                this.createUserForm.controls['hasLoginAccess'].value,
            role: this.role,
            adminId: this.adminId,
            nameEnglish: this.createUserForm.controls['nameEnglish'].value,
            nameDzongkha: this.createUserForm.controls['nameDzongkha'].value,
            cid: this.createUserForm.controls['cid'].value,
            email: this.createUserForm.controls['email'].value,
            phoneNumber: this.createUserForm.controls['phoneNumber'].value,
            permanentAddress:
                this.createUserForm.controls['permanentAddress'].value,
        };

        console.log(data);

        this.messageService.add({
            severity: 'info',
            summary: 'Creating',
            detail: 'Creating user...',
            life: 3000,
        });
        this.userDataService.AdminCreateUser(data).subscribe({
            next: (res) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'User created',
                    life: 3000,
                });
                this.isSubmitting = false;
                this.ref.close({
                    status: 201,
                    newUser: res,
                    phoneNumber:
                        this.createUserForm.controls['phoneNumber'].value,
                });
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error Creating User',
                    detail: err.error.message,
                });
                this.isSubmitting = false;
            },
        });
    }

    close() {
        this.ref.close();
    }
}
