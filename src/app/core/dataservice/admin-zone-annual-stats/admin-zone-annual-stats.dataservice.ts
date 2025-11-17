import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASEAPI_URL } from '../../constants/constants';
import { AZByDzongkhagGeoJsonResponse } from './admin-zone-annual-stats.dto';

@Injectable({
	providedIn: 'root',
})
export class AdminZoneAnnualStatsDataService {
	private apiUrl = `${BASEAPI_URL}/az-annual-stats`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all Administrative Zones for a specific Dzongkhag with annual statistics as GeoJSON
	 * Combines geographic boundaries with demographic statistics
	 * Perfect for map visualization and choropleth maps
	 *
	 * @param dzongkhagId - ID of the Dzongkhag to filter by
	 * @param year - Statistical year (optional, defaults to current year on backend)
	 * @returns GeoJSON FeatureCollection with statistics embedded in properties
	 *
	 * @example
	 * getAllCurrentAdminZoneStatsGeojsonByDzongkhag(1)
	 * getAllCurrentAdminZoneStatsGeojsonByDzongkhag(1, 2024)
	 */
	getAllCurrentAdminZoneStatsGeojsonByDzongkhag(
		dzongkhagId: number,
		year?: number
	): Observable<AZByDzongkhagGeoJsonResponse> {
		let url = `${this.apiUrl}/all/geojson&stats/current&bydzongkhag/${dzongkhagId}`;
		if (year) {
			url += `?year=${encodeURIComponent(String(year))}`;
		}

		return this.http.get<AZByDzongkhagGeoJsonResponse>(url);
	}
}
