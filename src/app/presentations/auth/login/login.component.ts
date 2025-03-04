import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { ZHIDHAYCONTACTDETAILS } from 'src/app/core/constants/constants';
import { USERROLESENUM } from 'src/app/core/constants/enums';
import * as CryptoJS from 'crypto-js';
import { AuthenticatedUserDTO } from 'src/app/core/dataservice/users-and-auth/dto/auth.dto';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styles: [
        `
            :host ::ng-deep .pi-eye,
            :host ::ng-deep .pi-eye-slash {
                transform: scale(1.6);
                margin-right: 1rem;
                color: var(--primary-color) !important;
            }
        `,
    ],
})
export class LoginComponent {
    loginForm: FormGroup;
    showRoleSelection = false;
    showLoading = false;
    companyDetails = ZHIDHAYCONTACTDETAILS;
    authenticatedUser: AuthenticatedUserDTO;
    pin: string[] = [];
    pinPlaceholder = ['_', '_', '_', '_'];
    keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', 'del'];

    constructor(
        private authService: AuthService,
        private router: Router,
        private fb: FormBuilder,
        private messageService: MessageService
    ) {
        this.initializeLoginForm();
        this.loadRememberedCredentials();
    }

    private initializeLoginForm(): void {
        this.loginForm = this.fb.group({
            cid: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
            password: ['', [Validators.required]],
            rememberMe: [false],
        });
    }

    private loadRememberedCredentials(): void {
        if (localStorage.getItem('rememberMe')) {
            const savedLogin = localStorage.getItem('appState22132');
            if (savedLogin) {
                const decryptedData = CryptoJS.AES.decrypt(
                    savedLogin,
                    '12213123$#$#'
                ).toString(CryptoJS.enc.Utf8);
                const parsedCredentials = JSON.parse(decryptedData);
                this.loginForm.patchValue({
                    ...parsedCredentials,
                    rememberMe: true,
                });
            }
        }
    }

    appendToPin(key: string): void {
        if (key === 'del') {
            if (this.pin.length > 0) {
                this.pinPlaceholder.push('_');
                this.pin.pop();
            }
        } else if (this.pin.length < 4) {
            this.pinPlaceholder.pop();
            this.pin.push(key);
        }
    }

    login(): void {
        if (this.isFormInvalid()) return;

        const loginData = {
            cid: this.loginForm.value.cid,
            password: this.loginForm.value.password,
        };

        this.showLoading = true;
        this.authService.Login(loginData).subscribe({
            next: (res: any) => this.handleLoginSuccess(res, loginData),
            error: (err) => this.handleLoginError(err),
        });
    }

    private isFormInvalid(): boolean {
        if (!this.loginForm.value.cid) {
            this.showMessage('Missing Field', 'Please enter your CID la.');
            return true;
        }
        if (!this.loginForm.value.password) {
            this.showMessage('Missing Field', 'Please enter your password la.');
            return true;
        }
        return false;
    }

    private handleLoginSuccess(res: any, loginData: any): void {
        this.authService.SetAuthToken(res.token);
        this.saveCredentialsIfRememberMe(loginData);

        setTimeout(() => {
            this.showLoading = false;
            this.determineNextRoute();
        }, 2000);
    }

    private saveCredentialsIfRememberMe(loginData: any): void {
        if (this.loginForm.controls['rememberMe'].value) {
            localStorage.setItem('rememberMe', '1');
            const encryptedData = CryptoJS.AES.encrypt(
                JSON.stringify(loginData),
                '12213123$#$#'
            ).toString();
            localStorage.setItem('appState22132', encryptedData);
        } else {
            localStorage.removeItem('appState22132');
            localStorage.removeItem('rememberMe');
        }
    }

    private handleLoginError(err: any): void {
        this.showLoading = false;
        const message =
            err.error.statusCode >= 500
                ? 'Our backend services are currently down. Please try again later.'
                : err.error.message;
        this.showMessage('Error', message);
    }

    private showMessage(summary: string, detail: string): void {
        this.messageService.add({
            severity: 'error',
            summary,
            detail,
        });
    }

    backToHome(): void {
        this.router.navigate(['/']);
    }

    determineNextRoute(): void {
        const authenticatedUser = this.authService.GetAuthenticatedUser();
        if (authenticatedUser.roles.length > 1) {
            this.showRoleSelection = true;
        } else {
            console.log(authenticatedUser.roles);
            this.navigateToRole(authenticatedUser.roles[0]);
        }
    }

    navigateToRole(role: any): void {
        const authenticatedUser = this.authService.GetAuthenticatedUser();
        console.log('AUTH USE', authenticatedUser);
        this.authService.SetCurrentRole(
            role.name === USERROLESENUM.ADMIN
                ? { role: role.name, adminId: authenticatedUser.id }
                : role
        );

        const route =
            role.name === USERROLESENUM.ADMIN ||
            role.name === USERROLESENUM.MANAGER
                ? '/admin'
                : '/owner';

        if (route) {
            this.router.navigate([route]);
        } else {
            this.showMessage('Error', 'Forbidden');
        }
    }
}
