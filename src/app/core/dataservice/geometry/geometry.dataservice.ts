import { Injectable } from '@angular/core';
import { GEOMETRYSERVERURL } from '../../constants/constants';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class GeometryDataService {
    apiUrl = GEOMETRYSERVERURL;

    constructor(private http: HttpClient) {}

    GetPlotsGeomByPlotIdCsv(plotIds: string) {
        return this.http.get(`${this.apiUrl}/geom/plots/${plotIds}`);
    }
    GetAllPlotsGeom() {
        return this.http.get(`${this.apiUrl}/geom/plots`);
    }

    /**
     * Retrieves geometry data for specific buildings by their IDs.
     * @param buildingIdCsv - A comma-separated string of Zhichar building IDs (zhichar building IDs).
     */
    GetBuildingsGeomByBuildingIdCsv(buildingIdCsv: string) {
        //BuildingID = zhichar building Id
        return this.http.get(`${this.apiUrl}/geom/buildings/${buildingIdCsv}`);
    }

    GetAllBuildingsGeom() {
        return this.http.get(`${this.apiUrl}/geom/buildings`);
    }
}
