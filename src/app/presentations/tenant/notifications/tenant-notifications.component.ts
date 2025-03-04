import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { ZHIDHAYCONTACTDETAILS } from 'src/app/core/constants/constants';
import {
    NotificationDTO,
    NotificationService,
} from 'src/app/core/dataservice/notification/notification.service';

import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { AuthenticatedUserDTO } from 'src/app/core/dataservice/users-and-auth/dto/auth.dto';
import { GETELAPSEDTIME } from 'src/app/core/utility/date.helper';

@Component({
    selector: 'app-tenant-notifications',
    templateUrl: './tenant-notifications.component.html',
    styleUrls: ['./tenant-notifications.component.scss'],
    standalone: true,
    imports: [DividerModule, ButtonModule, CommonModule],
})
export class TenantNotificationsComponent implements OnInit {
    authenticatedUser: AuthenticatedUserDTO;
    notifications: NotificationDTO[] = [];
    unReadNotifications: NotificationDTO[] = [];
    zhidhayContactDetails = ZHIDHAYCONTACTDETAILS;
    getElapsedTime = GETELAPSEDTIME;

    constructor(
        private notificationService: NotificationService,
        private authService: AuthService
    ) {
        this.authenticatedUser = this.authService.GetAuthenticatedUser();
    }

    ngOnInit() {
        this.getAndCheckNotifications();
    }

    getAndCheckNotifications() {
        this.notificationService
            .GetNotificationsByTenant(this.authenticatedUser.userAuthId)
            .subscribe({
                next: (res) => {
                    this.notifications = res;
                    for (const item of this.notifications) {
                        console.log('CHECKING', item);
                        if (!item.isRead) {
                            this.unReadNotifications.push(item);
                        }
                    }
                },
            });
    }
}
