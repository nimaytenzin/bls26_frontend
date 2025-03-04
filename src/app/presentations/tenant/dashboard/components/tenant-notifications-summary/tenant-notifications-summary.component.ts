import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { ZHIDHAYCONTACTDETAILS } from 'src/app/core/constants/constants';
import { NotificationDTO } from 'src/app/core/dataservice/notification/notification.service';

@Component({
    selector: 'app-tenant-notifications-summary',
    templateUrl: './tenant-notifications-summary.component.html',
    styleUrls: ['./tenant-notifications-summary.component.scss'],
    standalone: true,
    imports: [CommonModule, DividerModule],
})
export class TenantNotificationsSummaryComponent implements OnInit {
    @Input({
        required: true,
    })
    notifications: NotificationDTO[];
    zhidhayContactDetails = ZHIDHAYCONTACTDETAILS;

    unReadCount: number = 0;
    constructor() {}

    ngOnInit() {
        for (const item of this.notifications) {
            if (!item.isRead) {
                this.unReadCount = this.unReadCount + 1;
            }
        }
    }

    getElapsedTime(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const elapsed = now.getTime() - date.getTime();

        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (years > 0) {
            return years + ' year' + (years > 1 ? 's' : '') + ' ago';
        }
        if (months > 0) {
            return months + ' month' + (months > 1 ? 's' : '') + ' ago';
        }
        if (weeks > 0) {
            return weeks + ' week' + (weeks > 1 ? 's' : '') + ' ago';
        }
        if (days > 0) {
            return days + ' day' + (days > 1 ? 's' : '') + ' ago';
        }
        if (hours > 0) {
            return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';
        }
        if (minutes > 0) {
            return minutes + ' minute' + (minutes > 1 ? 's' : '') + ' ago';
        }
        return seconds + ' second' + (seconds > 1 ? 's' : '') + ' ago';
    }
}
