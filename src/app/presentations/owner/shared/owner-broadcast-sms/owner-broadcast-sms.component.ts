import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';

@Component({
    selector: 'app-owner-broadcast-sms',
    templateUrl: './owner-broadcast-sms.component.html',
    styleUrls: ['./owner-broadcast-sms.component.css'],
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
export class OwnerBroadcastSmsComponent implements OnInit {
    buildings: BuildingDTO[];
    message: string;
    broadCastToAll: false;

    selectedBuilding: BuildingDTO;
    constructor(private config: DynamicDialogConfig) {
        this.buildings = this.config.data.buildings;
    }

    ngOnInit() {}

    broadCastSms() {
        if (!this.message) {
            alert('Please enter a message to broadcast.');
        }

        if (this.broadCastToAll) {
            // Logic to broadcast SMS to all tenants
            console.log('Broadcasting to all tenants:', this.message);
            // Add your SMS service API call here
        } else {
            if (!this.selectedBuilding) {
                alert('Please select a building to broadcast the message.');
                return;
            }

            // Logic to broadcast SMS to tenants in the selected building
            console.log(
                'Broadcasting to tenants in building:',
                this.selectedBuilding.name,
                this.message
            );
            // Add your SMS service API call here
        }

        // Reset the form after sending the message
        this.message = '';
        this.broadCastToAll = false;
        this.selectedBuilding = null;
    }
}
