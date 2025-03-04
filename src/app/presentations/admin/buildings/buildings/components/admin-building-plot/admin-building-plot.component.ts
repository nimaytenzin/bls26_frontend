import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { BuildingPlotDTO } from 'src/app/core/dto/ownership/buildingplot.dto';
import { AdminBuildingPlotCreateComponent } from '../../crud-modal/admin-building-plot-create/admin-building-plot-create.component';
import { BuildingPlotDataService } from 'src/app/core/dataservice/ownership/buildingplot.dataservice';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-building-plot',
    templateUrl: './admin-building-plot.component.html',
    styleUrls: ['./admin-building-plot.component.css'],
    standalone: true,
    imports: [CommonModule, ButtonModule, ConfirmDialogModule],
    providers: [DialogService, ConfirmationService],
})
export class AdminBuildingPlotComponent implements OnInit {
    @Input({
        required: true,
    })
    plots: PlotDTO[];

    @Input({
        required: true,
    })
    buildingId: number;
    @Output() buildingInfoChanged = new EventEmitter<string>();

    ref: DynamicDialogRef;

    constructor(
        private dialogService: DialogService,
        private buildingPlotDataService: BuildingPlotDataService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit() {}

    getPlotsByBuilding() {}

    openMapPlotBuilding() {
        this.ref = this.dialogService.open(AdminBuildingPlotCreateComponent, {
            header: 'Assign Plot',
            data: {
                buildingId: this.buildingId,
            },
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 201) {
                this.buildingInfoChanged.emit('changed');
            }
        });
    }
    openConfirmDeleteBuildingPlotDialog(plot: PlotDTO) {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Do you want to Unmap ' + plot.plotId + '?',
            header: 'Delete Confirmation',
            icon: 'pi pi-info-circle',
            acceptButtonStyleClass: 'p-button-danger p-button-text',
            rejectButtonStyleClass: 'p-button-text p-button-text',
            acceptIcon: 'none',
            rejectIcon: 'none',
            accept: () => {
                this.buildingPlotDataService
                    .DeleteBuildingPlot(plot.id, this.buildingId)
                    .subscribe({
                        next: (res) => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Unmapped',
                                detail: plot.plotId + ' Un Mapped',
                            });
                            this.buildingInfoChanged.emit('changed');
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: err.error.message,
                            });
                        },
                    });
            },
        });
    }

    goToDetailedPlotView(item: PlotDTO) {
        console.log(item);
        this.router.navigate(['/admin/master-properties/plot/' + item.id]);
    }
}
