// admin-master-facility.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'app-admin-master-facility',
    templateUrl: './admin-master-facility.component.html',
    styleUrls: ['./admin-master-facility.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        DialogModule,
        FormsModule,
        CardModule,
        AvatarModule,
        ButtonModule,
        TableModule, // Added TableModule for PrimeNG table
    ],
})
export class AdminMasterFacilityComponent implements OnInit {
    facilities: any[] = [];
    isAddFacilityModalOpen: boolean = false;
    newFacility: any = {};

    constructor(private sanitizer: DomSanitizer) {}

    ngOnInit(): void {
        // Initialize facilities or fetch from a service
        this.facilities = [
            { name: 'Facility 1', address: 'Address 1', contact: '1234567890', currentCapacity: 50 },
            { name: 'Facility 2', address: 'Address 2', contact: '0987654321', currentCapacity: 30 },
        ];
    }

    openAddFacilityModal(): void {
        this.isAddFacilityModalOpen = true;
    }

    closeAddFacilityModal(): void {
        this.isAddFacilityModalOpen = false;
    }

    addFacility(): void {
        if (this.newFacility.name && this.newFacility.address && this.newFacility.contact && this.newFacility.currentCapacity) {
            this.facilities.push({ ...this.newFacility });
            this.newFacility = {};
            this.closeAddFacilityModal();
        }
    }

    editField(field: string) {}
}
