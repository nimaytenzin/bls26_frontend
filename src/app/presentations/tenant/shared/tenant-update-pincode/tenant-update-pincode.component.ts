import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';

@Component({
    selector: 'app-tenant-update-pincode',
    templateUrl: './tenant-update-pincode.component.html',
    styleUrls: ['./tenant-update-pincode.component.scss'],
    standalone: true,
    imports: [CommonModule, ButtonModule],
})
export class TenantUpdatePincodeComponent implements OnInit {
    pin: string[] = [];
    pinPlaceholder: string[] = ['_', '_', '_', '_'];
    keys: string[] = [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '*',
        '0',
        'del',
    ];

    appendToPin(key: string) {
        if (key === 'del') {
            if (this.pin.length > 0) {
                this.pinPlaceholder.push('_');
            }
            this.pin.pop();
        } else {
            if (this.pin.length < 4) {
                this.pinPlaceholder.pop();

                this.pin.push(key);
            }
        }
    }
    constructor(
        private authService: AuthService,
        public ref: DynamicDialogRef,
        private dialogService: DialogService,
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit() {}

    updatePin() {
        // this.authService
        //     .UpdatePINCode({
        //         userAuthId: this.authService.GetAuthenticatedUser().userAuthId,
        //         pin: this.pin.join(''),
        //     })
        //     .subscribe({
        //         next: (res) => {
        //             if (res) {
        //                 this.ref.close({
        //                     status: 200,
        //                 });
        //                 this.messageService.add({
        //                     severity: 'success',
        //                     summary: 'Pin Changed',
        //                     life: 20000,
        //                     detail: 'Please login with your new pin codes',
        //                 });
        //                 this.router.navigate(['/']);
        //             }
        //         },
        //         error: (err) => {
        //             console.log(err);
        //         },
        //     });
    }
}
