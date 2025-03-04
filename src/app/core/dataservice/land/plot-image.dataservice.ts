import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../constants/constants';

import { Observable } from 'rxjs';
import { BuildingImageDTO } from '../../dto/properties/building-image.dto';
import { PlotImageDTO } from './dto/plot.dto';
@Injectable({
    providedIn: 'root',
})
export class PlotImageDataservice {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreatePlotImage(data: FormData): Observable<PlotImageDTO> {
        return this.http.post<PlotImageDTO>(`${this.apiUrl}/plot-image`, data);
    }

    GetPlotImageByplot(plotDatabaseId: number): Observable<PlotImageDTO[]> {
        return this.http.get<PlotImageDTO[]>(
            `${this.apiUrl}/plot-image/plot/${plotDatabaseId}`
        );
    }

    DeletePlotImage(id: number) {
        return this.http.delete(`${this.apiUrl}/plot-image/${id}`);
    }
}
