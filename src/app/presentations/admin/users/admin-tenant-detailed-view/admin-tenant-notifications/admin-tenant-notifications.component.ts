import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { ROWSPERPAGEOPTION, PageEvent } from 'src/app/core/constants/constants';
import { NOTIFICATIONTYPES } from 'src/app/core/constants/enums';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';
import {
    NotificationChannelStatusEnum,
    NotificationResponseDTO,
} from 'src/app/core/dataservice/notification/notification.dto';
import {
    NotificationDTO,
    NotificationService,
} from 'src/app/core/dataservice/notification/notification.service';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';

@Component({
    selector: 'app-admin-tenant-notifications',
    templateUrl: './admin-tenant-notifications.component.html',
    styleUrls: ['./admin-tenant-notifications.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        PaginatorModule,
        TableModule,
        DividerModule,
        ConfirmDialogModule,
        ButtonModule,
    ],
    providers: [ConfirmationService],
})
export class AdminTenantNotificationsComponent implements OnInit {
    @Input({ required: true }) tenantId: number;

    paginatedNotifications: PaginatedData<NotificationDTO> = {
        firstPage: 0,
        currentPage: 0,
        previousPage: 0,
        nextPage: 0,
        lastPage: 0,
        limit: 0,
        count: 0,
        data: [],
    };
    rowsPerPageOptions = ROWSPERPAGEOPTION;
    firstPageNumber = 0;
    rows = ROWSPERPAGEOPTION[0];
    currentPage = 0;

    NOTIFICATIONCHANNELSTATUS = NotificationChannelStatusEnum;

    constructor(
        private notificationService: NotificationService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.handlePagination();
    }

    getStatusObject(statusString: string): NotificationResponseDTO {
        return JSON.parse(statusString);
    }

    onPageChange(event: PageEvent): void {
        this.firstPageNumber = event.first;
        this.currentPage = event.page;
        this.rows = event.rows;
        this.handlePagination();
    }

    private handlePagination(): void {
        const queryParams: any = {
            pageNo: this.currentPage,
            pageSize: this.rows,
        };

        this.notificationService
            .GetAllNotificationsByTenantPaginated(this.tenantId, queryParams)
            .subscribe((res) => {
                this.paginatedNotifications = res;
            });
    }
}
