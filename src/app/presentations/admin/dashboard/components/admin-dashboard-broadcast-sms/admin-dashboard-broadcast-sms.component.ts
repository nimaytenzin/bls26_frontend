import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { BuildingDataService } from 'src/app/core/dataservice/building/building.dataservice';
import { NotificationService } from 'src/app/core/dataservice/notification/notification.service';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';

@Component({
    selector: 'app-admin-dashboard-broadcast-sms',
    templateUrl: './admin-dashboard-broadcast-sms.component.html',
    styleUrls: ['./admin-dashboard-broadcast-sms.component.css'],
    standalone: true,
    imports: [
        DropdownModule,
        FormsModule,
        CommonModule,
        InputTextareaModule,
        DividerModule,
        ButtonModule,
        InputSwitchModule,
    ],
})
export class AdminDashboardBroadcastSmsComponent implements OnInit {
    buildings: BuildingDTO[];
    message: string;
    broadCastToAll: boolean = true;

    selectedBuilding: BuildingDTO;
    constructor(
        private config: DynamicDialogConfig,
        private buildingDataService: BuildingDataService,
        private authService: AuthService,
        private messageService: MessageService,
        private notificationService: NotificationService
    ) {}

    ngOnInit() {
        this.buildingDataService
            .GetAllBuildingsByAdmin(this.authService.GetAuthenticatedUser().id)
            .subscribe({
                next: (res) => {
                    this.buildings = res;
                },
            });
    }

    broadCastSms() {
        if (!this.message) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Input',
                detail: 'Message to be sent is missing',
            });
        }

        if (this.broadCastToAll) {
            this.notificationService
                .BroadCastNotificationToAllunderAdmin({
                    adminId: this.authService.GetCurrentRole().adminId,
                    message: this.message,
                })
                .subscribe((res) => {
                    console.log(res);
                });
        } else {
            if (!this.selectedBuilding) {
                alert('Please select a building to broadcast the message.');
                return;
            }
            console.log(
                'Broadcasting to tenants in building:',
                this.selectedBuilding.name,
                this.message
            );
        }
    }
}
