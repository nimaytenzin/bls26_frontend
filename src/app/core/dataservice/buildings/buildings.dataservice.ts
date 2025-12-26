import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
	Building,
	UpdateBuildingDto,
	BuildingGeoJsonFeatureCollection,
	BuildingStatistics,
} from './buildings.dto';

@Injectable({
	providedIn: 'root',
})
export class BuildingDataService {
	private readonly apiUrl = `${environment.BASEAPI_URL}/buildings`;

	constructor(private http: HttpClient) {}

	/**
	 * Get buildings by enumeration area ID
	 */
	findByEnumerationArea(enumerationAreaId: number): Observable<Building[]> {
		return this.http.get<Building[]>(
			`${this.apiUrl}/by-enumeration-area/${enumerationAreaId}`
		);
	}

	/**
	 * Get buildings as GeoJSON by enumeration area ID
	 */
	findAsGeoJsonByEnumerationArea(
		enumerationAreaId: number
	): Observable<BuildingGeoJsonFeatureCollection> {
		return this.http.get<BuildingGeoJsonFeatureCollection>(
			`${this.apiUrl}/geojson/by-enumeration-area/${enumerationAreaId}`
		);
	}

	/**
	 * Get buildings as GeoJSON by one or more enumeration area IDs
	 * @param enumerationAreaIds - Single ID or comma-separated list of IDs (e.g., "1,2,983")
	 * @returns Observable<BuildingGeoJsonFeatureCollection>
	 */
	findAsGeoJsonByEnumerationAreas(
		enumerationAreaIds: string | number[]
	): Observable<BuildingGeoJsonFeatureCollection> {
		// Convert array to comma-separated string if needed
		const idsString = Array.isArray(enumerationAreaIds)
			? enumerationAreaIds.join(',')
			: enumerationAreaIds.toString();

		return this.http.get<BuildingGeoJsonFeatureCollection>(
			`${this.apiUrl}/by-enumeration-area/${idsString}`
		);
	}

	/**
	 * Get all buildings as GeoJSON
	 */
	findAllAsGeoJson(): Observable<BuildingGeoJsonFeatureCollection> {
		return this.http.get<BuildingGeoJsonFeatureCollection>(
			`${this.apiUrl}/geojson/all`
		);
	}

	/**
	 * Get single building by ID
	 */
	findOne(id: number): Observable<Building> {
		return this.http.get<Building>(`${this.apiUrl}/${id}`);
	}

	/**
	 * Update building
	 */
	update(
		id: number,
		updateBuildingDto: UpdateBuildingDto
	): Observable<Building> {
		return this.http.patch<Building>(`${this.apiUrl}/${id}`, updateBuildingDto);
	}

	/**
	 * Calculate building statistics for enumeration area
	 */
	calculateStatistics(buildings: Building[]): BuildingStatistics {
		const totalBuildings = buildings.length;

		return {
			totalBuildings,
			enumerationAreaId: buildings[0]?.enumerationAreaId || 0,
			// Add more statistics as needed
		};
	}

	/**
	 * Get building count for enumeration area (convenience method)
	 */
	getBuildingCount(enumerationAreaId: number): Observable<number> {
		return new Observable((observer) => {
			this.findByEnumerationArea(enumerationAreaId).subscribe({
				next: (buildings) => {
					observer.next(buildings.length);
					observer.complete();
				},
				error: (error) => {
					observer.error(error);
				},
			});
		});
	}
}
