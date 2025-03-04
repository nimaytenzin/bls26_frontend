import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import {
    RoleDTO,
    RolesDataService,
} from 'src/app/core/dataservice/role-use-roles/roles.dataservice';

@Component({
    selector: 'app-admin-role-listing',
    templateUrl: './admin-role-listing.component.html',
    styleUrls: ['./admin-role-listing.component.css'],
    standalone: true,
    imports: [TableModule, CommonModule],
})
export class AdminRoleListingComponent implements OnInit {
    roles: RoleDTO[] = [];
    constructor(private roleDataService: RolesDataService) {}

    ngOnInit() {
        this.roleDataService.GetAllRoles().subscribe({
            next: (res) => {
                this.roles = res;
            },
        });
    }
}
