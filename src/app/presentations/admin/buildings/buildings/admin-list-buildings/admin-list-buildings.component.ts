import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BuildingDataService } from 'src/app/core/dataservice/building/building.dataservice';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { PARSEBUILDINGFLOORS } from 'src/app/core/utility/helper.function';
import { AdminAddBuildingComponent } from '../crud-modal/admin-add-building/admin-add-building.component';
import { AdminEditBuildingComponent } from '../crud-modal/admin-edit-building/admin-edit-building.component';
import { CommonModule } from '@angular/common';
import { QRCodeModule } from 'angularx-qrcode';
import { ButtonModule } from 'primeng/button';
import { GalleriaModule } from 'primeng/galleria';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { AdminBuildingDetailsCardComponent } from '../components/admin-building-details-card/admin-building-details-card.component';
import { BuildingPlotDataService } from 'src/app/core/dataservice/ownership/buildingplot.dataservice';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { PaginatorModule } from 'primeng/paginator';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { PageEvent, ROWSPERPAGEOPTION } from 'src/app/core/constants/constants';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { MessageService } from 'primeng/api';
import { ExcelGeneratorDataService } from 'src/app/core/dataservice/excel.generator.dataservice';
import { AdminMapviewPlotdetailsComponent } from '../../../mapview/components/admin-mapview-plotdetails/admin-mapview-plotdetails.component';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-admin-list-buildings',
    standalone: true,
    imports: [
        ButtonModule,
        CommonModule,
        GalleriaModule,
        TableModule,
        QRCodeModule,
        RouterModule,
        DialogModule,
        AdminBuildingDetailsCardComponent,
        PaginatorModule,
        TooltipModule,
    ],
    providers: [DialogService],
    templateUrl: './admin-list-buildings.component.html',
    styleUrl: './admin-list-buildings.component.scss',
})
export class AdminListBuildingsComponent {
    getBuildingFloorConfiguration = PARSEBUILDINGFLOORS;
    showOwnerDetailCard: boolean = false;

    showConfirmDeleteBuildingPlotDialog: boolean = false;
    selectedBuildingPlot: any;

    ref: DynamicDialogRef;

    paginatedBuildings: PaginatedData<BuildingDTO> = {
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
        public dialogService: DialogService,
        private buildingDataService: BuildingDataService,
        private router: Router,
        private buildingPlotDataService: BuildingPlotDataService,
        private authService: AuthService,
        private messageService: MessageService,
        private excelGeneratorService: ExcelGeneratorDataService
    ) {}

    ngOnInit(): void {
        this.handlePagination();
    }

    getQr(val) {
        return val;
    }

    openViewBuildingDetails(building: BuildingDTO) {
        this.router.navigate([
            '/admin/master-properties/building/',
            building.id,
        ]);
    }
    openAddBuildingModal() {
        this.ref = this.dialogService.open(AdminAddBuildingComponent, {
            header: 'Add Building',
            width: '600px',
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 201) {
                this.handlePagination();
            }
        });
    }

    openEditBuildingModal(data: BuildingDTO) {
        this.ref = this.dialogService.open(AdminEditBuildingComponent, {
            header: 'Edit Building',
            width: '600px',
            data: {
                ...data,
            },
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.updated) {
                this.handlePagination();
            }
        });
    }

    downloadMasterTable() {
        this.messageService.add({
            severity: 'info',
            summary: 'Downloading',
            detail: 'downloading...',
        });
        this.excelGeneratorService
            .DownloadBuildingsByAdminId(
                this.authService.GetCurrentRole().adminId
            )
            .subscribe((blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'buildings.xlsx';
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

        this.buildingDataService
            .GetAllBuildingsByAdminPaginated(
                this.authService.GetCurrentRole().adminId,
                queryParams
            )
            .subscribe((res) => {
                this.paginatedBuildings = res;
            });
    }
}
