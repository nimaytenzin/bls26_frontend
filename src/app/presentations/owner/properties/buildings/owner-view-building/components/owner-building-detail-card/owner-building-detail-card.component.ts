import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { PARSEBUILDINGFLOORS } from 'src/app/core/utility/helper.function';
import { AdminEditBuildingComponent } from 'src/app/presentations/admin/buildings/buildings/crud-modal/admin-edit-building/admin-edit-building.component';

@Component({
    selector: 'app-owner-building-detail-card',
    templateUrl: './owner-building-detail-card.component.html',
    styleUrls: ['./owner-building-detail-card.component.scss'],
    standalone: true,
    providers: [DialogService],
    imports: [CommonModule, ButtonModule],
})
export class OwnerBuildingDetailCardComponent {
    @Input({
        required: true,
    })
    building: BuildingDTO;

    @Input({
        required: true,
    })
    editMode: boolean;

    getBuildingFloorConfiguration = PARSEBUILDINGFLOORS;
    ref: DynamicDialogRef | undefined;
    constructor(private dialogService: DialogService) {}

    openEditBuildingModal() {
        this.ref = this.dialogService.open(AdminEditBuildingComponent, {
            header: 'Edit Building',
            width: '600px',
            data: {
                ...this.building,
            },
        });
        this.ref.onClose.subscribe((res) => {});
    }
}
