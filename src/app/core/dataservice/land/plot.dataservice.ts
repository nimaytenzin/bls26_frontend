import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../constants/constants';
import { Observable } from 'rxjs';
import { CreateThramDTO, SearchThramDTO, ThramDTO } from './dto/thram.dto';
import { CreatePlotDTO, PlotDTO, UpdatePlotDTO } from './dto/plot.dto';
import {
    PaginatedParamsOptions,
    PaginatedData,
} from '../../dto/paginated-data.dto';
import { BuildingDTO } from '../../dto/properties/building.dto';

@Injectable({
    providedIn: 'root',
})
export class PlotDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreatePlot(data: CreatePlotDTO): Observable<PlotDTO> {
        return this.http.post<PlotDTO>(`${this.apiUrl}/plot`, data);
    }
    UpdatePlot(data: UpdatePlotDTO, plotId: number): Observable<PlotDTO> {
        return this.http.patch<PlotDTO>(`${this.apiUrl}/plot/${plotId}`, data);
    }

    GetAllPlotsByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<PlotDTO>> {
        let httpParams = new HttpParams();

        console.log(params);
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        console.log(httpParams);
        // Return the HTTP GET request with the params
        return this.http.get<PaginatedData<PlotDTO>>(
            `${this.apiUrl}/plot/admin/p/${adminId}`,
            { params: httpParams }
        );
    }

    GetAllPlots(): Observable<PlotDTO[]> {
        return this.http.get<PlotDTO[]>(`${this.apiUrl}/plot`);
    }

    SearchPlotById(plotId: string): Observable<PlotDTO> {
        return this.http.get<PlotDTO>(`${this.apiUrl}/plot/search/${plotId}`);
    }

    GetPlotByPlotDatabaseId(plotDatabaseId: number): Observable<PlotDTO> {
        return this.http.get<PlotDTO>(`${this.apiUrl}/plot/${plotDatabaseId}`);
    }
}
