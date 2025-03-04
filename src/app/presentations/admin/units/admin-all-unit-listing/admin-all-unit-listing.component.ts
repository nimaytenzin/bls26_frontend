import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { QRCodeModule } from 'angularx-qrcode';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { GalleriaModule } from 'primeng/galleria';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { ROWSPERPAGEOPTION, PageEvent } from 'src/app/core/constants/constants';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { AdminBuildingDetailsCardComponent } from '../../buildings/buildings/components/admin-building-details-card/admin-building-details-card.component';
import { UnitDataService } from 'src/app/core/dataservice/units/unit.dataservice';
import { UnitDTO } from 'src/app/core/dto/units/unit.dto';
import { LESSEETYPE } from 'src/app/core/constants/enums';
import { AdminTabPreferenceService } from 'src/app/core/preferences/admin.tab.selection.preferences';
import { ExcelGeneratorDataService } from 'src/app/core/dataservice/excel.generator.dataservice';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { PlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';

@Component({
    selector: 'app-admin-all-unit-listing',
    templateUrl: './admin-all-unit-listing.component.html',
    styleUrls: ['./admin-all-unit-listing.component.css'],
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
        InputTextModule,
    ],
    providers: [DialogService],
})
export class AdminAllUnitListingComponent implements OnInit {
    ref: DynamicDialogRef;

    LESSEETYPES = LESSEETYPE;
    paginatedUnits: PaginatedData<UnitDTO> = {
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
        private unitDataService: UnitDataService,
        private router: Router,
        private authService: AuthService,
        private adminTabSelectionPreferenceService: AdminTabPreferenceService,
        private excelGeneratorService: ExcelGeneratorDataService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.handlePagination();
    }

    getQr(val) {
        return val;
    }

    goToTenantDetailedView(tenantId: number) {
        this.router.navigate([`/admin/master-users/tenant/${tenantId}`]);
    }
    goToPlotDetailedView(plot: PlotDTO) {
        console.log(plot);
        this.router.navigate(['admin/master-properties/plot/' + plot.id]);
    }

    goToBuildingDetailedView(building: BuildingDTO) {
        this.router.navigate([
            `/admin/master-properties/building/${building.id}`,
        ]);
    }

    goToLeaseView(leaseId: number) {
        this.router.navigate([`/admin/master-lease/view/${leaseId}`]);
    }

    openViewUnit(unitId: number, buildingId: number) {
        this.router.navigate([
            '/admin/master-properties/building/' +
                buildingId +
                '/unit/' +
                unitId,
        ]);
        this.adminTabSelectionPreferenceService.updateAdminViewBuildingSelectedTab(
            1
        );
    }

    downloadMasterTable() {
        this.messageService.add({
            severity: 'info',
            summary: 'Downloading',
            detail: 'downloading...',
        });
        this.excelGeneratorService
            .DownloadUnitsByAdmin(this.authService.GetCurrentRole().adminId)
            .subscribe((blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'units.xlsx';
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

        this.unitDataService
            .GetAllUnitsByAdminPaginated(
                this.authService.GetCurrentRole().adminId,
                queryParams
            )
            .subscribe((res) => {
                this.paginatedUnits = res;
            });
    }
}
