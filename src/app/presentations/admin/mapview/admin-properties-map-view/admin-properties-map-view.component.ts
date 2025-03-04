import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AdminMapviewPlotdetailsComponent } from '../components/admin-mapview-plotdetails/admin-mapview-plotdetails.component';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { GeometryDataService } from 'src/app/core/dataservice/geometry/geometry.dataservice';
import { MessageService } from 'primeng/api';
import { AdminMapviewBuildingdetailsComponent } from '../components/admin-mapview-buildingdetails/admin-mapview-buildingdetails.component';
import { LocationDataService } from 'src/app/core/dataservice/location/location.dataservice';
import { DzongkhagDTO } from 'src/app/core/dto/locations/dzongkhag.dto';
import { AdministrativeZoneDTO } from 'src/app/core/dto/locations/administrative-zone.dto';
import { SubAdministrativeZoneDTO } from 'src/app/core/dto/locations/sub-administrative-zone.dto';
import { ThramDataService } from 'src/app/core/dataservice/land/thram.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { ThramDTO } from 'src/app/core/dataservice/land/dto/thram.dto';

@Component({
    selector: 'app-admin-properties-map-view',
    templateUrl: './admin-properties-map-view.component.html',
    styleUrls: ['./admin-properties-map-view.component.css'],
    standalone: true,
    imports: [
        HttpClientModule,
        ButtonModule,
        InputGroupModule,
        InputTextModule,
        DropdownModule,
        FormsModule,
    ],
    providers: [DialogService],
})
export class AdminPropertiesMapViewComponent implements OnInit {
    cartoLightUrl =
        'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
    googleSatUrl = 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}';
    map!: L.Map;
    plotsGeojsonLayer: L.GeoJSON;
    buildingsGeoJsonLayer: L.GeoJSON;
    mapTitle: string = '';
    ref: DynamicDialogRef;
    thrams: ThramDTO[] = [];
    dzongkhags: DzongkhagDTO[] = [];
    administrativeZones: AdministrativeZoneDTO[] = [];
    subAdministrativeZones: SubAdministrativeZoneDTO[] = [];
    selectedDzongkhag: DzongkhagDTO;
    selectedAdministrativeZone: AdministrativeZoneDTO;
    selectedSubAdministrativeZone: SubAdministrativeZoneDTO;

    constructor(
        private http: HttpClient,
        private dialogService: DialogService,
        private geometryDataService: GeometryDataService,
        private messageService: MessageService,
        private locationDataService: LocationDataService,
        private thramDataService: ThramDataService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.getAllDzongkhags();
        this.initializeMap();
    }

    getAllDzongkhags() {
        this.locationDataService
            .GetAllDzonghags()
            .subscribe((res) => (this.dzongkhags = res));
    }

    getAllAdministrativeZoneByDzongkhag() {
        if (!this.selectedDzongkhag) return;
        this.locationDataService
            .GetAllAdministrativeZones({
                dzongkhagId: this.selectedDzongkhag.id,
            })
            .subscribe((res) => (this.administrativeZones = res));
    }

    getAllSubAdministrativeZonesByAdminZone() {
        if (!this.selectedAdministrativeZone) return;
        this.locationDataService
            .GetAllSubAdministrativeZones({
                administrativeZoneId:
                    this.selectedAdministrativeZone.id.toString(),
            })
            .subscribe((res) => (this.subAdministrativeZones = res));
    }

    initializeMap() {
        this.map = L.map('propertyMap', {
            layers: [
                L.tileLayer(this.googleSatUrl, {
                    maxNativeZoom: 21,
                    maxZoom: 24,
                }),
            ],
            zoomControl: false,
            attributionControl: false,
            maxZoom: 22,
            renderer: L.canvas({ tolerance: 3 }),
        }).setView([27.43503, 89.651983], 15);
    }

    loadProperties(zoneType: string, zoneId: number) {
        this.plotsGeojsonLayer?.remove();
        this.buildingsGeoJsonLayer?.remove();

        const adminId = this.authService.GetCurrentRole().adminId;
        let fetchThrams;
        let areaName;

        switch (zoneType) {
            case 'Dzongkhag':
                fetchThrams =
                    this.thramDataService.GetAlllThramsByDzongkhagAndAdmin(
                        adminId,
                        zoneId
                    );
                areaName = this.selectedDzongkhag.name;
                break;
            case 'AdministrativeZone':
                fetchThrams =
                    this.thramDataService.GetAlllThramsByAdminZoneAndAdmin(
                        adminId,
                        zoneId
                    );
                areaName = this.selectedAdministrativeZone.name;
                break;
            case 'SubAdministrativeZone':
                fetchThrams =
                    this.thramDataService.GetAlllThramsBySubAdminZoneAndAdmin(
                        adminId,
                        zoneId
                    );
                areaName = this.selectedSubAdministrativeZone.name;
                break;
        }

        this.mapTitle = `Showing Properties for ${areaName}`;

        fetchThrams?.subscribe((res) => {
            this.thrams = res;
            const { plotIDCsv, buildingIDCsv } = this.generateCsvIDs(res);
            this.loadPlotGeometryAndBuildingGeometry(
                plotIDCsv,
                buildingIDCsv,
                areaName
            );
        });
    }

    private generateCsvIDs(thrams: ThramDTO[]) {
        let plotIDCsv = '';
        let buildingIDCsv = '';

        thrams.forEach((thram) => {
            thram.plots.forEach((plot) => {
                plotIDCsv += `${plot.plotId},`;
                plot.buildings.forEach((building) => {
                    buildingIDCsv += `${building.zhicharBuildingId},`;
                });
            });
        });

        return { plotIDCsv, buildingIDCsv };
    }

    private loadPlotGeometryAndBuildingGeometry(
        plotIDCsv: string,
        buildingIDCsv: string,
        zoneName: string
    ) {
        this.geometryDataService
            .GetPlotsGeomByPlotIdCsv(plotIDCsv)
            .subscribe((resp: any) => {
                this.plotsGeojsonLayer = L.geoJSON(resp, {
                    onEachFeature: (feature, layer) => {
                        layer.on('click', () => {
                            this.ref = this.dialogService.open(
                                AdminMapviewPlotdetailsComponent,
                                {
                                    header:
                                        'PlotId:' + feature.properties.plotId,

                                    data: {
                                        plotId: feature.properties.plotId,
                                    },
                                }
                            );
                        });
                    },
                    style: {
                        fillColor: 'transparent',
                        weight: 2,
                        opacity: 1,
                        color: 'red',
                    },
                }).addTo(this.map);

                this.map.fitBounds(this.plotsGeojsonLayer.getBounds());
                this.showSuccessMessage(`Plots Loaded for ${zoneName}`);
                this.loadBuildingGeometry(buildingIDCsv, zoneName);
            });
    }

    private loadBuildingGeometry(buildingIDCsv: string, zoneName: string) {
        this.geometryDataService
            .GetBuildingsGeomByBuildingIdCsv(buildingIDCsv)
            .subscribe((res: any) => {
                this.buildingsGeoJsonLayer = L.geoJSON(res, {
                    onEachFeature: (feature, layer) => {
                        layer.on('click', () => {
                            this.ref = this.dialogService.open(
                                AdminMapviewBuildingdetailsComponent,
                                {
                                    header:
                                        'Zhichar ID:' +
                                        feature.properties.zhicharBuildingId,

                                    data: {
                                        zhicharBuildingId:
                                            feature.properties
                                                .zhicharBuildingId,
                                    },
                                }
                            );
                        });
                    },
                    style: {
                        fillColor: 'white',
                        weight: 2,
                        opacity: 1,
                        color: 'yellow',
                    },
                }).addTo(this.map);

                this.showSuccessMessage(`Buildings Loaded for ${zoneName}`);
            });
    }

    private showSuccessMessage(detail: string) {
        this.messageService.add({
            severity: 'success',
            summary: detail,
            detail: 'Added to the map',
        });
    }
}
