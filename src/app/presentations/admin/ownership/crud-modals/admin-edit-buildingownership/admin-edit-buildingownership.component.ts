import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import {
    DynamicDialogComponent,
    DynamicDialogRef,
    DialogService,
} from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { BUILDINGOWNERSHIPTYPES } from 'src/app/core/constants/enums';
import { BuildingOwnershipDataService } from 'src/app/core/dataservice/ownership/buildingownership.dataservice';
// import { OwnerDataService } from 'src/app/core/dataservice/users-and-auth/owner.dataservice';
import { BuildingOwnershipDto } from 'src/app/core/dto/properties/building-ownership.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { LandLordDTO } from 'src/app/core/dto/users/landlord.dto';

@Component({
    selector: 'app-admin-edit-buildingownership',
    standalone: true,
    imports: [DropdownModule, InputNumberModule, FormsModule, ButtonModule],
    templateUrl: './admin-edit-buildingownership.component.html',
    styleUrl: './admin-edit-buildingownership.component.scss',
})
export class AdminEditBuildingownershipComponent {
    instance: DynamicDialogComponent | undefined;

    ownershipTypes = Object.values(BUILDINGOWNERSHIPTYPES);
    buildingOwnership: BuildingOwnershipDto;
    selectedOwnershipType: string;
    ownershipPercentage: number;

    constructor(
        public ref: DynamicDialogRef,
        private dialogService: DialogService,
        private messageService: MessageService,
        // private ownerdataService: OwnerDataService,
        private buildingOwnershipDataService: BuildingOwnershipDataService
    ) {
        this.instance = this.dialogService.getInstance(this.ref);

        if (this.instance && this.instance.data) {
            this.buildingOwnership = this.instance.data;
            this.selectedOwnershipType = this.buildingOwnership.ownershipType;
            this.ownershipPercentage =
                this.buildingOwnership.ownershipPercentage;
        }
    }

    updateOwnership() {}
    close() {
        this.ref.close();
    }
}
