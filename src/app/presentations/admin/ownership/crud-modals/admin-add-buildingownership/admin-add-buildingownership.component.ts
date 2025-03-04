import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import {
    DynamicDialogComponent,
    DynamicDialogRef,
    DialogService,
} from 'primeng/dynamicdialog';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { BUILDINGOWNERSHIPTYPES } from 'src/app/core/constants/enums';
import { BuildingOwnershipDataService } from 'src/app/core/dataservice/ownership/buildingownership.dataservice';
// import { OwnerDataService } from 'src/app/core/dataservice/users-and-auth/owner.dataservice';
import { BuildingOwnershipDto } from 'src/app/core/dto/properties/building-ownership.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { LandLordDTO } from 'src/app/core/dto/users/landlord.dto';

@Component({
    selector: 'app-admin-add-buildingownership',
    standalone: true,
    imports: [
        InputGroupModule,
        InputTextModule,
        InputGroupAddonModule,
        FormsModule,
        CommonModule,
        DialogModule,
        ButtonModule,
        DropdownModule,
        InputNumberModule,
    ],
    templateUrl: './admin-add-buildingownership.component.html',
    styleUrl: './admin-add-buildingownership.component.scss',
})
export class AdminAddBuildingownershipComponent {
    instance: DynamicDialogComponent | undefined;
    building: BuildingDTO;

    searchResult: LandLordDTO;
    searched: boolean = false;
    visible: boolean = false;
    searchName: string;
    searchPhoneNumber: string;
    searchCid: string;
    ownershipTypes = Object.values(BUILDINGOWNERSHIPTYPES);
    selectedOwnershipType: string = BUILDINGOWNERSHIPTYPES.SOLE;
    ownershipPercentage: number = 100;

    constructor(
        public ref: DynamicDialogRef,
        private dialogService: DialogService,
        private messageService: MessageService,
        // private ownerdataService: OwnerDataService,
        private buildingOwnershipDataService: BuildingOwnershipDataService
    ) {
        this.instance = this.dialogService.getInstance(this.ref);

        if (this.instance && this.instance.data) {
            this.building = this.instance.data;
        }

        console.log(this.building);
    }

    searchOwnerByName() {
        if (!this.searchName) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Input',
                detail: 'Please input a name',
            });
        }
    }
    searchOwnerByPhoneNumber() {
        if (!this.searchPhoneNumber) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Input',
                detail: 'Please input a phone number',
            });
        } else {
            this.searched = true;
            // this.ownerdataService
            //     .SearchLandLord({
            //         phoneNumber: Number(this.searchPhoneNumber),
            //     })
            //     .subscribe({
            //         next: (res) => {
            //             console.log(res);

            //             this.searchResult = res;
            //         },
            //         error: (err) => {
            //             this.messageService.add({
            //                 severity: 'error',
            //                 summary: 'Owner not Found',
            //                 detail: 'Owner with that phone number not found',
            //             });
            //         },
            //     });
        }
    }
    searchOwnerByCid() {
        if (!this.searchCid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Input',
                detail: 'Please input a cid',
            });
        }
    }
    mapBuildingOwner() {
        console.log('mapping owner');
        console.log(this.searchResult);
        console.log(this.building);

        this.visible = true;
    }
    confirmMapOwnership() {
        console.log({
            buildingId: this.building.id,
            landlordId: this.searchResult.id,
            ownershipPercentage: this.ownershipPercentage,
            ownershipType: this.selectedOwnershipType,
        });
        this.buildingOwnershipDataService
            .CreateBuildingOwnership({
                buildingId: this.building.id,
                landlordId: this.searchResult.id,
                ownershipPercentage: this.ownershipPercentage,
                ownershipType: this.selectedOwnershipType,
            })
            .subscribe({
                next: (res) => {
                    console.log(res);
                    if (res) {
                        this.visible = false;
                        this.ref.close({
                            status: 201,
                        });
                    }
                },
                error: (err) => {
                    console.log(err);
                },
            });
    }
}
