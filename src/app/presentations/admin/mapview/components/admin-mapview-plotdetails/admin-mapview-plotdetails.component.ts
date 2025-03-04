import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { PlotDataService } from 'src/app/core/dataservice/land/plot.dataservice';
import { AdminPlotPhotosComponent } from '../../../land/plots/components/admin-plot-photos/admin-plot-photos.component';

@Component({
    selector: 'app-admin-mapview-plotdetails',
    templateUrl: './admin-mapview-plotdetails.component.html',
    styleUrls: ['./admin-mapview-plotdetails.component.css'],
    standalone: true,
    imports: [
        DividerModule,
        CommonModule,
        ButtonModule,
        AdminPlotPhotosComponent,
    ],
})
export class AdminMapviewPlotdetailsComponent {
    plotId: string;
    plot: PlotDTO;
    constructor(
        private config: DynamicDialogConfig,
        private plotDataService: PlotDataService,
        private messageService: MessageService,
        private router: Router
    ) {
        if (!this.config.data.plotId) {
            alert('Supplot PLot ID');
        }
        this.plotId = this.config.data.plotId;
        this.plotDataService.SearchPlotById(this.plotId).subscribe({
            next: (res) => {
                console.log('MAP VIE WPLOT DETAILS', res);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Plot Details Loaded',
                });
                this.plot = res;
            },
        });
    }

    goToPlotDetailedView() {
        this.router.navigate(['admin/master-properties/plot/' + this.plot.id]);
    }
}
