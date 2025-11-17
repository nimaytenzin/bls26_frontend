import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASEAPI_URL } from '../../constants/constants';
import {
	SAZByAdministrativeZoneGeoJsonResponse,
	SAZByDzongkhagGeoJsonResponse,
} from './sub-admin-zone-annual-stats.dto';

@Injectable({
	providedIn: 'root',
})
export class SubAdminZoneAnnualStatsDataService {
	private apiUrl = `${BASEAPI_URL}/saz-annual-stats`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all Sub-Administrative Zones for a specific Administrative Zone with annual statistics as GeoJSON
	 * Returns all Chiwogs (if Gewog) or Laps (if Thromde) within the specified AZ
	 * Combines geographic boundaries with demographic statistics
	 * Perfect for detailed map visualization of a single AZ
	 *
	 * @param administrativeZoneId - ID of the Administrative Zone to filter by
	 * @param year - Statistical year (optional, defaults to current year on backend)
	 * @returns GeoJSON FeatureCollection with statistics embedded in properties
	 *
	 * @example
	 * // Get all Laps in Thimphu Thromde (AZ ID 1)
	 * getAllCurrentSAZStatsGeojsonByAdministrativeZone(1)
	 *
	 * // Get all Chiwogs in a Gewog for specific year
	 * getAllCurrentSAZStatsGeojsonByAdministrativeZone(5, 2024)
	 */
	getAllCurrentSAZStatsGeojsonByAdministrativeZone(
		administrativeZoneId: number,
		year?: number
	): Observable<SAZByAdministrativeZoneGeoJsonResponse> {
		let url = `${this.apiUrl}/all/geojson&stats/current&byadministrativezone/${administrativeZoneId}`;
		if (year) {
			url += `?year=${encodeURIComponent(String(year))}`;
		}

		return this.http.get<SAZByAdministrativeZoneGeoJsonResponse>(url);
	}

	/**
	 * Get all Sub-Administrative Zones for a specific Dzongkhag with annual statistics as GeoJSON
	 * Returns all SAZs (Chiwogs and Laps) across all Administrative Zones within the Dzongkhag
	 * Combines geographic boundaries with demographic statistics
	 * Perfect for comprehensive Dzongkhag-level map visualization with urban/rural breakdown
	 *
	 * @param dzongkhagId - ID of the Dzongkhag to filter by
	 * @param year - Statistical year (optional, defaults to current year on backend)
	 * @returns GeoJSON FeatureCollection with statistics embedded in properties
	 *
	 * @example
	 * // Get all SAZs in Thimphu Dzongkhag (includes all Laps and Chiwogs)
	 * getAllCurrentSAZStatsGeojsonByDzongkhag(1)
	 *
	 * // Get SAZs for specific year
	 * getAllCurrentSAZStatsGeojsonByDzongkhag(1, 2024)
	 */
	getAllCurrentSAZStatsGeojsonByDzongkhag(
		dzongkhagId: number,
		year?: number
	): Observable<SAZByDzongkhagGeoJsonResponse> {
		let url = `${this.apiUrl}/all/geojson&stats/current&bydzongkhag/${dzongkhagId}`;
		if (year) {
			url += `?year=${encodeURIComponent(String(year))}`;
		}

		return this.http.get<SAZByDzongkhagGeoJsonResponse>(url);
	}
}
