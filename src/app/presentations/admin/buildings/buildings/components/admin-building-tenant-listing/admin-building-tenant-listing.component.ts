import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TenantDataService } from 'src/app/core/dataservice/users-and-auth/tenant.dataservice';
import { TenantDTO } from 'src/app/core/dto/users/tenant.dto';

@Component({
    selector: 'app-admin-building-tenant-listing',
    templateUrl: './admin-building-tenant-listing.component.html',
    styleUrls: ['./admin-building-tenant-listing.component.css'],
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule],
})
export class AdminBuildingTenantListingComponent implements OnInit {
    @Input({
        required: true,
    })
    buildingId: number;

    tenants: TenantDTO[];

    constructor(private tenantDataService: TenantDataService) {}

    ngOnInit() {
        this.tenantDataService
            .GetActiveTenantsByBuilding(this.buildingId)
            .subscribe({
                next: (res) => {
                    this.tenants = res;
                },
            });
    }

    downloadTenantList() {}
}
