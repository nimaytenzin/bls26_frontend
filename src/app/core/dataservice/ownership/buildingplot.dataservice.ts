import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../constants/constants';
import {
    BuildingDTO,
    CreateBuildingDTO,
    UpdateBuildingDto,
} from '../../dto/properties/building.dto';
import { Observable } from 'rxjs';
import {
    CreateUnitSurchargeDTO,
    UnitSurchargeDTO,
} from '../../dto/units/unit-surcharge.dto';
import {
    BuildingPlotDTO,
    CreateBuildingPlotDTO,
} from '../../dto/ownership/buildingplot.dto';
import { PlotDTO } from '../land/dto/plot.dto';

@Injectable({
    providedIn: 'root',
})
export class BuildingPlotDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateBuildingPlot(
        data: CreateBuildingPlotDTO
    ): Observable<BuildingPlotDTO> {
        return this.http.post<BuildingPlotDTO>(
            `${this.apiUrl}/building-plot`,
            data
        );
    }

    UpdateBuildingPlot(
        data: CreateBuildingPlotDTO,
        id: number
    ): Observable<BuildingPlotDTO> {
        return this.http.patch<BuildingPlotDTO>(
            `${this.apiUrl}/building-plot/${id}`,
            data
        );
    }

    DeleteBuildingPlot(plotId: number, buildingId: number) {
        console.log('DELTING BUILDING POT');
        return this.http.delete(
            `${this.apiUrl}/building-plot/b/${buildingId}/p/${plotId}`
        );
    }
}
