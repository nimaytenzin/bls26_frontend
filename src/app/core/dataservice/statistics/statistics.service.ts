import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StatisticsService {
	private readonly baseUrl = `${environment.BASEAPI_URL}/statistics`;

	constructor(private http: HttpClient) {}

	downloadEaSummaryCsv(dzongkhagId?: number | null): void {
		const params = new URLSearchParams();
		params.set('format', 'csv');
		if (dzongkhagId != null) {
			params.set('dzongkhagId', String(dzongkhagId));
		}
		const url = `${this.baseUrl}/download/ea-summary?${params.toString()}`;
		window.open(url, '_blank');
	}

	downloadHouseholdsCsv(options: { dzongkhagId?: number | null; eaId?: number | null }): void {
		const params = new URLSearchParams();
		params.set('format', 'csv');
		if (options.dzongkhagId != null) {
			params.set('dzongkhagId', String(options.dzongkhagId));
		}
		if (options.eaId != null) {
			params.set('eaId', String(options.eaId));
		}
		const url = `${this.baseUrl}/download/households?${params.toString()}`;
		window.open(url, '_blank');
	}
}

