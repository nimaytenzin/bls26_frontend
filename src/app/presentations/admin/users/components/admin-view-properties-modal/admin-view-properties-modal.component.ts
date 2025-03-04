import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DividerModule } from 'primeng/divider';
import {
    DialogService,
    DynamicDialogConfig,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ThramDTO } from 'src/app/core/dataservice/land/dto/thram.dto';
import { ThramDataService } from 'src/app/core/dataservice/land/thram.dataservice';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { AdminMapviewPlotdetailsComponent } from '../../../mapview/components/admin-mapview-plotdetails/admin-mapview-plotdetails.component';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';

@Component({
    selector: 'app-admin-view-properties-modal',
    templateUrl: './admin-view-properties-modal.component.html',
    styleUrls: ['./admin-view-properties-modal.component.css'],
    standalone: true,
    imports: [CommonModule, DividerModule, TableModule],
    providers: [DialogService],
})
export class AdminViewPropertiesModalComponent implements OnInit {
    ref: DynamicDialogRef;

    owner: UserDTO;
    thrams: ThramDTO[] = [];
    constructor(
        private config: DynamicDialogConfig,
        private thramDataService: ThramDataService,
        private router: Router,
        private dialogService: DialogService
    ) {
        this.owner = this.config.data;
    }

    ngOnInit() {
        this.getThramsByOwner();
    }

    getThramsByOwner() {
        this.thramDataService
            .GetAllThramsByOwner(this.owner.id)
            .subscribe((res) => {
                this.thrams = res;
            });
    }

    viewPlotsSpatially(plot: PlotDTO) {
        this.ref = this.dialogService.open(AdminMapviewPlotdetailsComponent, {
            header: plot.plotId,

            data: {
                plotId: plot.plotId,
            },
        });
    }
}
