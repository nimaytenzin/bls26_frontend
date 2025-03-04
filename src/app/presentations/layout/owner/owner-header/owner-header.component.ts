import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { API_URL } from 'src/app/core/constants/constants';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { TenantDataService } from 'src/app/core/dataservice/users-and-auth/tenant.dataservice';
import { TenantDTO } from 'src/app/core/dto/users/tenant.dto';

@Component({
    selector: 'app-owner-header',
    templateUrl: './owner-header.component.html',
    styleUrls: ['./owner-header.component.scss'],
    standalone: true,
    imports: [DividerModule, CommonModule],
})
export class OwnerHeaderComponent implements OnInit {
    tenantDetails: TenantDTO;
    profileUri: string;
    apiUrl = API_URL;

    constructor(
        private tenantDataService: TenantDataService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        // this.tenantDataService
        //     .SearchTenant({
        //         id: this.authService.GetAuthenticatedUser().id,
        //     })
        //     .subscribe((res) => {
        //         this.tenantDetails = res;
        //         if (this.tenantDetails.profileUri) {
        //             this.profileUri =
        //                 this.apiUrl + '/' + this.tenantDetails.profileUri;
        //         }
        //     });
    }
}
