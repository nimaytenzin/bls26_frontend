import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { PARSEBUILDINGFLOORS } from 'src/app/core/utility/helper.function';
import { AdminEditBuildingComponent } from '../../crud-modal/admin-edit-building/admin-edit-building.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-admin-building-details-card',
    standalone: true,
    imports: [ButtonModule, CommonModule],
    templateUrl: './admin-building-details-card.component.html',
    styleUrl: './admin-building-details-card.component.scss',
    providers: [DialogService],
})
export class AdminBuildingDetailsCardComponent {
    @Input({
        required: true,
    })
    building: BuildingDTO;

    @Input({
        required: true,
    })
    editMode: boolean;
    @Input() customStyles: Partial<CSSStyleDeclaration>;

    @Output() buildingInfoChanged = new EventEmitter<string>();

    getBuildingFloorConfiguration = PARSEBUILDINGFLOORS;
    ref: DynamicDialogRef | undefined;
    constructor(private dialogService: DialogService) {}

    openEditBuildingModal() {
        console.log('open edit building modal');
        this.ref = this.dialogService.open(AdminEditBuildingComponent, {
            header: 'Edit Building',
            width: '600px',
            data: {
                ...this.building,
            },
        });
        this.ref.onClose.subscribe((res) => {
            this.buildingInfoChanged.emit('changed');
        });
    }
}
