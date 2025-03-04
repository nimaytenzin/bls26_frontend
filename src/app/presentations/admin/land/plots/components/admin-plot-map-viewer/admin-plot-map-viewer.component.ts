import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BuildingDataService } from 'src/app/core/dataservice/building/building.dataservice';
import { GeometryDataService } from 'src/app/core/dataservice/geometry/geometry.dataservice';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { AdminMapviewPlotdetailsComponent } from 'src/app/presentations/admin/mapview/components/admin-mapview-plotdetails/admin-mapview-plotdetails.component';

@Component({
    selector: 'app-admin-plot-map-viewer',
    templateUrl: './admin-plot-map-viewer.component.html',
    styleUrls: ['./admin-plot-map-viewer.component.css'],
    standalone: true,
    providers: [DialogService],
    imports: [CommonModule],
})
export class AdminPlotMapViewerComponent implements OnInit {
    @Input({
        required: true,
    })
    plotId: string;

    @Input({
        required: true,
    })
    buildings: BuildingDTO[];

    ref: DynamicDialogRef;
    errorMessage: string[] = [];

    googleSatUrl = 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}';
    map!: L.Map;

    plotsGeojsonLayer: L.GeoJSON;
    buildingGeojsonLayer: L.GeoJSON;

    constructor(
        private buildingDataService: BuildingDataService,
        private http: HttpClient,
        private dialogService: DialogService,
        private geometryDataService: GeometryDataService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.renderMap();
    }

    ngAfterViewInit() {}

    renderMap() {
        this.errorMessage = [];
        var satelliteMap = L.tileLayer(this.googleSatUrl, {
            maxNativeZoom: 21,
            maxZoom: 24,
        });
        this.map = L.map('map', {
            layers: [satelliteMap],
            zoomControl: false,
            attributionControl: false,
            maxZoom: 30,
            renderer: L.canvas({ tolerance: 3 }),
        }).setView([27.43503, 89.651983], 17);
        this.loadPlotGeometry();
    }

    loadPlotGeometry() {
        this.geometryDataService
            .GetPlotsGeomByPlotIdCsv(this.plotId)
            .subscribe({
                next: (res: any) => {
                    this.plotsGeojsonLayer = L.geoJSON(res, {
                        style: (feature) => {
                            return {
                                fillColor: 'transparent',
                                weight: 2,
                                opacity: 1,
                                color: 'red',
                            };
                        },
                    }).addTo(this.map);
                    this.map.fitBounds(this.plotsGeojsonLayer.getBounds());
                    this.loadBuildingGeometry();
                },
                error: (err) => {
                    this.errorMessage.push('Missing Plot Geometry');
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Missing Geometry',
                        detail: err.error.message,
                    });
                },
            });
    }

    loadBuildingGeometry() {
        const buildingIdCsvs = this.buildings
            .map((item) => item.zhicharBuildingId)
            .join(',');
        console.log('BUILDING GEOMETRY', buildingIdCsvs);
        this.geometryDataService
            .GetBuildingsGeomByBuildingIdCsv(buildingIdCsvs)
            .subscribe({
                next: (res: any) => {
                    this.plotsGeojsonLayer = L.geoJSON(res, {
                        style: (feature) => {
                            return {
                                fillColor: 'transparent',
                                weight: 2,
                                opacity: 1,
                                color: 'white',
                            };
                        },
                    }).addTo(this.map);
                },
                error: (err) => {
                    this.errorMessage.push('Missing Building Geometry');
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Missing Geometry',
                        detail: err.error.message,
                    });
                },
            });
    }
}
