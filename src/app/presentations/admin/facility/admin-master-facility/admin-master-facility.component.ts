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
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AdminCreateFacilityComponent } from './admin-create-facility/admin-create-facility.component';
import { FacilityDTO } from 'src/app/core/dto/properties/building.dto';
import { FacilityDataService } from 'src/app/services/facility-data.service';

@Component({
    selector: 'app-admin-master-facility',
    templateUrl: './admin-master-facility.component.html',
    styleUrls: ['./admin-master-facility.component.css'],
    standalone: true,
    providers: [DialogService],
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
    facilities: FacilityDTO[] = [
        {
            name: 'Little Steps',
            address: '124 Babesa Lam',
            ownerId: 1,
            capacity: 20,
            contact: '17263764',
        },
    ];
    isAddFacilityModalOpen: boolean = false;
    newFacility: any = {};
    ref: DynamicDialogRef;

    constructor(
        private sanitizer: DomSanitizer,
        private dialogService: DialogService,
        private facilityService: FacilityDataService
    ) {}

    ngOnInit(): void {
        // Initialize facilities or fetch from a service
        this.getFacilities();
    }

    async getFacilities() {
        const userId = localStorage.getItem('userId');

        if (userId) {
            // Fetch facilities by owner ID
            this.facilityService
                .getFacilityByOwnerId(+userId)
                .subscribe((res) => {
                    this.facilities = res;
                });
        }
    }

    openAddFacilityModal(): void {
        this.ref = this.dialogService.open(AdminCreateFacilityComponent, {
            header: 'Create Facility',
        });
        this.ref.onClose.subscribe((res) => {
            this.getFacilities();
        });
    }

    closeAddFacilityModal(): void {
        this.isAddFacilityModalOpen = false;
    }

    addFacility(): void {}

    editField(field: string) {}
}
