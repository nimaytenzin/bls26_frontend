import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { COMPANY_NAME } from 'src/app/core/constants/constants';
import { TenantLayoutService } from '../service/tenant-layout.service';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { Router } from '@angular/router';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { BadgeModule } from 'primeng/badge';

@Component({
    selector: 'app-tenant-topbar',
    templateUrl: './tenant-topbar.component.html',
    styleUrls: ['./tenant-topbar.component.scss'],
    standalone: true,
    imports: [
        OverlayPanelModule,
        CommonModule,
        ButtonModule,
        ConfirmPopupModule,
        BadgeModule,
    ],
    providers: [ConfirmationService],
})
export class TenantTopbarComponent implements OnInit {
    items!: MenuItem[];
    companyName = COMPANY_NAME;

    @ViewChild('menubutton') menuButton!: ElementRef;
    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;
    @ViewChild('topbarmenu') menu!: ElementRef;

    constructor(
        public layoutService: TenantLayoutService,
        private router: Router,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {}

    logout() {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Are you sure you want to logout?',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.router.navigate(['/']);
            },
            reject: () => {},
        });
    }
    profile() {
        this.router.navigate(['/tenant/profile']);
    }
}
