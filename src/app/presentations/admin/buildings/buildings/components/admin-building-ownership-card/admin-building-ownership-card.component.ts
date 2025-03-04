import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BuildingOwnershipDto } from 'src/app/core/dto/properties/building-ownership.dto';
import { LandLordDTO } from 'src/app/core/dto/users/landlord.dto';
import { AdminAddBuildingownershipComponent } from 'src/app/presentations/admin/ownership/crud-modals/admin-add-buildingownership/admin-add-buildingownership.component';
import { AdminEditBuildingownershipComponent } from 'src/app/presentations/admin/ownership/crud-modals/admin-edit-buildingownership/admin-edit-buildingownership.component';

@Component({
    selector: 'app-admin-building-ownership-card',
    templateUrl: './admin-building-ownership-card.component.html',
    styleUrls: ['./admin-building-ownership-card.component.scss'],
    standalone: true,
    imports: [ButtonModule, CommonModule, DialogModule],
    providers: [DialogService],
})
export class AdminBuildingOwnershipCardComponent implements OnInit {
    @Input({
        required: true,
    })
    owners: LandLordDTO[];
    @Input({
        required: true,
    })
    editMode: boolean;

    @Input() customStyles: Partial<CSSStyleDeclaration>;

    ref: DynamicDialogRef | undefined;
    showConfirmDeleteBuildingOwnershipDialog: boolean = false;
    showOwnerDetailCard: boolean = false;
    selectedOwner: any;

    constructor(private dialogService: DialogService) {}

    ngOnInit() {}

    openEditOwnershipModal(ownership: BuildingOwnershipDto) {
        this.ref = this.dialogService.open(
            AdminEditBuildingownershipComponent,
            {
                header: 'Edit Ownership',
                data: ownership,
            }
        );
    }

    openAddBuildingOwnershipModal() {
        this.ref = this.dialogService.open(AdminAddBuildingownershipComponent, {
            header: 'Add Building Owner',
            width: '600px',
        });
        this.ref.onClose.subscribe((res) => {
            // if (res && res.status === 201) {
            //     this.getPaginatedBuildings();
            // }
        });
    }

    deleteBuildingOwnership() {}
    openConfirmDeleteBuildingOwnershipDialog() {
        this.showConfirmDeleteBuildingOwnershipDialog = true;
    }

    viewOwnerDetailCard(owner) {
        this.selectedOwner = owner;
        this.showOwnerDetailCard = true;
    }
}
