import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { AdminLayoutService } from '../service/admin-layout.service';
import { ADMINSIDEBARITEMS } from 'src/app/core/constants/sidebarmenu';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { USERROLESENUM } from 'src/app/core/constants/enums';

@Component({
    selector: 'app-admin-menu',
    templateUrl: './admin-menu.component.html',
})
export class AdminMenuComponent implements OnInit {
    model: any[] = [];

    constructor(
        public layoutService: AdminLayoutService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        // const userRole = this.authService.GetCurrentRole().name;
        this.model = ADMINSIDEBARITEMS;
        //  this.filterMenuItemsByRole(
        //     ADMINSIDEBARITEMS,
        //     USERROLESENUM.ADMIN
        // );
    }

    private filterMenuItemsByRole(items: any[], role: string): any[] {
        return items
            .map((item) => {
                if (item.items) {
                    return {
                        ...item,
                        items: item.items.filter((subItem) =>
                            subItem.roles?.includes(role)
                        ),
                    };
                }
                return item;
            })
            .filter((item) => item.items?.length);
    }
}
