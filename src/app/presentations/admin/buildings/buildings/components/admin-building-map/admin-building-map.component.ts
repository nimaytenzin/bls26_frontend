import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BuildingDataService } from 'src/app/core/dataservice/building/building.dataservice';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { GeometryDataService } from 'src/app/core/dataservice/geometry/geometry.dataservice';
import { CommonModule } from '@angular/common';
import { AdminMapviewPlotdetailsComponent } from 'src/app/presentations/admin/mapview/components/admin-mapview-plotdetails/admin-mapview-plotdetails.component';
import { MessageService } from 'primeng/api';
@Component({
    selector: 'app-admin-building-map',
    templateUrl: './admin-building-map.component.html',
    styleUrls: ['./admin-building-map.component.scss'],
    standalone: true,
    providers: [DialogService],
    imports: [CommonModule],
})
export class AdminBuildingMapComponent implements OnInit, AfterViewInit {
    @Input({
        required: true,
    })
    buildingId: number;

    ref: DynamicDialogRef;
    errorMessage: string[] = [];
    building: BuildingDTO;
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
        this.buildingDataService
            .GetOneById(this.buildingId)
            .subscribe((res) => {
                console.log(res, 'BUILDING MAP COMPONENT');
                this.building = res;
                this.renderMap();
            });
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
        const plotIdCsv = this.building.plots
            .map((plot) => plot.plotId)
            .join(',');
        this.geometryDataService.GetPlotsGeomByPlotIdCsv(plotIdCsv).subscribe({
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
                    onEachFeature: (feature, layer) => {
                        layer.on('click', () => {
                            this.ref = this.dialogService.open(
                                AdminMapviewPlotdetailsComponent,
                                {
                                    header: this.building.plots[0].plotId,
                                    data: {
                                        plotId: this.building.plots[0].plotId,
                                    },
                                }
                            );
                        });
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
        this.geometryDataService
            .GetBuildingsGeomByBuildingIdCsv(
                this.building.zhicharBuildingId.toString()
            )
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
