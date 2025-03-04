import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { AdminPlotCreateComponent } from '../components/admin-plot-create/admin-plot-create.component';
import { PlotDataService } from 'src/app/core/dataservice/land/plot.dataservice';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { DividerModule } from 'primeng/divider';
import { Router } from '@angular/router';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { PageEvent, ROWSPERPAGEOPTION } from 'src/app/core/constants/constants';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { PaginatorModule } from 'primeng/paginator';
import { AdminPlotUpdateComponent } from '../components/admin-plot-update/admin-plot-update.component';
import { AdminAddBuildingComponent } from '../../../buildings/buildings/crud-modal/admin-add-building/admin-add-building.component';
import { MessageService } from 'primeng/api';
import { ExcelGeneratorDataService } from 'src/app/core/dataservice/excel.generator.dataservice';
import { AdminMapviewPlotdetailsComponent } from '../../../mapview/components/admin-mapview-plotdetails/admin-mapview-plotdetails.component';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-admin-plots-listing',
    templateUrl: './admin-plots-listing.component.html',
    styleUrls: ['./admin-plots-listing.component.css'],
    standalone: true,

    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        DividerModule,
        PaginatorModule,
        InputTextModule,
        TooltipModule,
    ],
    providers: [DialogService],
})
export class AdminPlotsListingComponent implements OnInit {
    ref: DynamicDialogRef;

    plots: PlotDTO[];
    paginatedPlotData: PaginatedData<PlotDTO> = {
        firstPage: 0,
        currentPage: 0,
        previousPage: 0,
        nextPage: 0,
        lastPage: 0,
        limit: 0,
        count: 0,
        data: [],
    };
    rowsPerPageOptions = ROWSPERPAGEOPTION;
    firstPageNumber = 0;
    rows = ROWSPERPAGEOPTION[0];
    currentPage = 0;

    constructor(
        private dialogService: DialogService,
        private plotDataService: PlotDataService,
        private router: Router,
        private authService: AuthService,
        private messageService: MessageService,
        private excelGeneratorService: ExcelGeneratorDataService
    ) {}

    ngOnInit() {
        this.handlePagination();
    }

    goToPlotDetailedView(plot: PlotDTO) {
        this.router.navigate(['admin/master-properties/plot/' + plot.id]);
    }

    onPageChange(event: PageEvent): void {
        this.firstPageNumber = event.first;
        this.currentPage = event.page;
        this.rows = event.rows;
        this.handlePagination();
    }

    private handlePagination(): void {
        const queryParams: any = {
            pageNo: this.currentPage,
            pageSize: this.rows,
        };

        this.plotDataService
            .GetAllPlotsByAdminPaginated(
                this.authService.GetCurrentRole().adminId,
                queryParams
            )
            .subscribe({
                next: (res) => {
                    this.paginatedPlotData = res;
                },
            });
    }

    openCreatePlotModal() {
        this.ref = this.dialogService.open(AdminPlotCreateComponent, {
            header: 'Create Plot',
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 201) {
                this.handlePagination();
            }
        });
    }
    openUpdatePlotModal(item: PlotDTO) {
        this.ref = this.dialogService.open(AdminPlotUpdateComponent, {
            header: 'Update Plot',
            data: { ...item },
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 200) {
                this.handlePagination();
            }
        });
    }

    openAddBuildingInPlotModal(item: PlotDTO) {
        this.ref = this.dialogService.open(AdminAddBuildingComponent, {
            header: 'Add Building',
            data: { ...item },
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 201) {
                this.handlePagination();
            }
        });
    }

    navigateToBuilding(buildingId: string) {
        this.router.navigate([
            `admin/master-properties/building/${buildingId}`,
        ]);
    }

    viewPlotsSpatially(plot: PlotDTO) {
        this.ref = this.dialogService.open(AdminMapviewPlotdetailsComponent, {
            header: plot.plotId,

            data: {
                plotId: plot.plotId,
            },
        });
    }
    downloadMasterTable() {
        this.messageService.add({
            severity: 'info',
            summary: 'Downloading',
            detail: 'downloading...',
        });
        this.excelGeneratorService
            .DownloadPlotsByAdminId(this.authService.GetCurrentRole().adminId)
            .subscribe((blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'plots.xlsx';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Downloaded',
                    detail: 'Download Completed.',
                    life: 3000,
                });
            });
    }
}
