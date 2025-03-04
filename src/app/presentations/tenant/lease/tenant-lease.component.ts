import { Component, OnInit } from '@angular/core';
import { TenantActiveLeasecomponent } from '../dashboard/components/tenant-active-lease/tenant-active-lease.component';
import { TenantLeaseActiveLeaseListComponent } from './components/tenant-lease-active-lease-list/tenant-lease-active-lease-list.component';
import { TenantLeaseLeaseHistoryComponent } from './components/tenant-lease-lease-history/tenant-lease-lease-history.component';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { AuthenticatedUserDTO } from 'src/app/core/dataservice/users-and-auth/dto/auth.dto';

@Component({
    selector: 'app-tenant-lease',
    templateUrl: './tenant-lease.component.html',
    styleUrls: ['./tenant-lease.component.scss'],
    standalone: true,
    imports: [
        TenantLeaseActiveLeaseListComponent,
        TenantLeaseLeaseHistoryComponent,
    ],
})
export class TenantLeaseComponent implements OnInit {
    currentUser: AuthenticatedUserDTO;
    constructor(private authService: AuthService) {
        this.currentUser = this.authService.GetAuthenticatedUser();
    }

    ngOnInit() {}
}
