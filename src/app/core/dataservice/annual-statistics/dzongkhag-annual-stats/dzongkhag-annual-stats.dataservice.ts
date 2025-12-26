import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASEAPI_URL } from '../../../constants/constants';
import { DzongkhagStatsGeoJson } from './dzongkhag-annual-stats.dto';

@Injectable({
	providedIn: 'root',
})
export class DzongkhagAnnualStatsDataService {
	private apiUrl = `${BASEAPI_URL}/dzongkhag-annual-stats`;

	constructor(private http: HttpClient) {}

	/**
	 * Get current year Dzongkhag statistics as GeoJSON
	 * Endpoint: GET /dzongkhag-annual-stats/all/geojson&Stats
	 * @param year - Optional year parameter (defaults to current year)
	 */
	getAllDzongkhagsCurrentStatsGeoJson(year?: number): Observable<DzongkhagStatsGeoJson> {
		let url = `${this.apiUrl}/all/geojson&Stats`;
		if (year) {
			url += `?year=${year}`;
		}
		return this.http.get<DzongkhagStatsGeoJson>(url);
	}

	/**
	 * Get Administrative Zone (AZ) statistics as GeoJSON for a given Dzongkhag
	 * Endpoint: /az-annual-stats/geojson/:dzongkhagId
	 * @param dzongkhagId - ID of the Dzongkhag
	 * @param year - optional year query parameter
	 */
	getAllCurrentAdminZoneStatsGeojsonByDzongkhag(
		dzongkhagId: number,
		year?: number
	): Observable<any> {
		let url = `${BASEAPI_URL}/all/geojson&stats/current&bydzongkhag//${dzongkhagId}`;
		if (year) {
			url += `?year=${encodeURIComponent(String(year))}`;
		}

		return this.http.get<any>(url);
	}
}
