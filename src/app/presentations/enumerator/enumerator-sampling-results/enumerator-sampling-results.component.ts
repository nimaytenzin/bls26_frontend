import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EnumeratorDataService } from '../../../core/dataservice/enumerator-service/enumerator.dataservice';
import { SamplingDataService } from '../../../core/dataservice/sampling/sampling.dataservice';
import { PrimeNgModules } from '../../../primeng.modules';
import { MessageService } from 'primeng/api';
import {
	SamplingResultsResponseDto,
	SamplingResultHouseholdDto,
} from '../../../core/dataservice/sampling/sampling.dto';
import { SurveyEnumerationArea } from '../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';
import { EnumeratorMapStateService } from '../../../core/utility/enumerator-map-state.service';

@Component({
	selector: 'app-enumerator-sampling-results',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
	templateUrl: './enumerator-sampling-results.component.html',
	styleUrls: ['./enumerator-sampling-results.component.scss'],
})
export class EnumeratorSamplingResultsComponent implements OnInit {
	surveyId!: number;
	surveyEnumerationAreaId!: number;
	surveyEnumerationArea: SurveyEnumerationArea | null = null;
	
	loading = true;
	resultLoading = false;
	currentResult: SamplingResultsResponseDto['data'] | null = null;
	selectedHouseholds: SamplingResultHouseholdDto[] = [];
	filteredHouseholds: SamplingResultHouseholdDto[] = [];
	searchQuery = '';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private enumeratorService: EnumeratorDataService,
		private samplingService: SamplingDataService,
		private messageService: MessageService,
		private mapStateService: EnumeratorMapStateService
	) {}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			this.surveyId = +params['surveyId'];
			this.surveyEnumerationAreaId = +params['surveyEnumerationAreaId'];
			this.loadSurveyEnumerationAreaDetails();
			this.loadSamplingResults();
		});
	}

	/**
	 * Load survey enumeration area details
	 */
	loadSurveyEnumerationAreaDetails(): void {
		this.enumeratorService
			.getSurveyEnumerationAreaDetails(this.surveyEnumerationAreaId)
			.subscribe({
				next: (data: any) => {
					this.surveyEnumerationArea = data;
				},
				error: (error: any) => {
					console.error('Error loading survey enumeration area details:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumeration area details',
					});
				},
			});
	}

	/**
	 * Load sampling results
	 */
	loadSamplingResults(): void {
		this.resultLoading = true;
		this.currentResult = null;
		this.selectedHouseholds = [];

		this.samplingService
			.getSamplingResults(this.surveyId, this.surveyEnumerationAreaId)
			.subscribe({
				next: (response: SamplingResultsResponseDto) => {
					if (response.success && response.data) {
						this.currentResult = response.data;
						// Sort by selection order
						this.selectedHouseholds = response.data.selectedHouseholds.sort(
							(a, b) => a.selectionOrder - b.selectionOrder
						);
						this.filteredHouseholds = [...this.selectedHouseholds];
					}
					this.resultLoading = false;
					this.loading = false;
				},
				error: (error: any) => {
					console.error('Error loading sampling results:', error);
					this.resultLoading = false;
					this.loading = false;
					
					if (error?.status === 404) {
						this.messageService.add({
							severity: 'warn',
							summary: 'No Sampling Results',
							detail: 'Sampling has not been performed for this enumeration area yet',
							life: 5000,
						});
					} else {
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: error?.error?.message || 'Failed to load sampling results',
							life: 5000,
						});
					}
				},
			});
	}

	/**
	 * Filter households based on search query
	 */
	filterHouseholds(): void {
		if (!this.searchQuery.trim()) {
			this.filteredHouseholds = [...this.selectedHouseholds];
			return;
		}

		const query = this.searchQuery.toLowerCase();
		this.filteredHouseholds = this.selectedHouseholds.filter((item) => {
			const household = item.household;
			return (
				household.householdIdentification?.toLowerCase().includes(query) ||
				household.nameOfHOH?.toLowerCase().includes(query) ||
				household.phoneNumber?.toLowerCase().includes(query) ||
				household.householdSerialNumber?.toString().includes(query) ||
				household.structure?.structureNumber?.toLowerCase().includes(query) ||
				item.selectionOrder?.toString().includes(query)
			);
		});
		// Maintain sort order after filtering
		this.filteredHouseholds.sort((a, b) => a.selectionOrder - b.selectionOrder);
	}

	/**
	 * Navigate back to survey detail
	 */
	goBack(): void {
		this.router.navigate(['/enumerator/survey', this.surveyId]);
	}

	/**
	 * Get enumeration area name
	 */
	getEnumerationAreaName(): string {
		return (
			this.currentResult?.enumerationArea?.name ||
			this.surveyEnumerationArea?.enumerationArea?.name ||
			this.surveyEnumerationArea?.enumerationArea?.areaCode ||
			'N/A'
		);
	}

	/**
	 * Get location hierarchy string
	 */
	getLocationHierarchy(): string {
		if (this.currentResult?.enumerationArea) {
			const ea = this.currentResult.enumerationArea;
			const parts = [];
			if (ea.subAdminZone?.name) {
				parts.push(ea.subAdminZone.name);
			}
			if (ea.adminZone?.name) {
				parts.push(ea.adminZone.name);
			}
			return parts.length > 0 ? parts.join(' → ') : '';
		}

		const ea = this.surveyEnumerationArea?.enumerationArea;
		if (!ea) return '';

		// Use first SAZ if multiple exist
		const firstSaz = ea.subAdministrativeZones && ea.subAdministrativeZones.length > 0
			? ea.subAdministrativeZones[0]
			: null;

		const parts = [];
		if (firstSaz?.administrativeZone?.dzongkhag?.name) {
			parts.push(firstSaz.administrativeZone.dzongkhag.name);
		}
		if (firstSaz?.administrativeZone?.name) {
			parts.push(firstSaz.administrativeZone.name);
		}
		if (firstSaz?.name) {
			parts.push(firstSaz.name);
		}
		if (ea.name) {
			parts.push(ea.name);
		}

		return parts.join(' → ');
	}

	/**
	 * Get total population for a household
	 */
	getTotalPopulation(item: SamplingResultHouseholdDto): number {
		return (item.household.totalMale || 0) + (item.household.totalFemale || 0);
	}

	/**
	 * Navigate to map view and zoom to structure
	 */
	zoomToStructure(structureId: number, latitude?: number, longitude?: number): void {
		if (latitude && longitude) {
			this.mapStateService.saveMapPosition(
				this.surveyEnumerationAreaId,
				{ lat: latitude, lng: longitude },
				19
			);
			this.mapStateService.saveSelectedStructure(this.surveyEnumerationAreaId, structureId);
		} else {
			this.mapStateService.saveSelectedStructure(this.surveyEnumerationAreaId, structureId);
		}

		this.router.navigate([
			'/enumerator/survey-enumeration-area',
			this.surveyEnumerationAreaId,
			'map',
		]);
	}

	/**
	 * Open Google Maps with coordinates
	 */
	openGoogleMaps(latitude: number, longitude: number): void {
		const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
		window.open(url, '_blank');
	}

	/**
	 * Initiate phone call
	 */
	callPhone(phoneNumber: string): void {
		if (phoneNumber) {
			window.location.href = `tel:${phoneNumber}`;
		}
	}

	/**
	 * Get total number of households
	 */
	getTotalHouseholds(): number {
		return this.filteredHouseholds.length;
	}

	/**
	 * Get total population sum
	 */
	getTotalPopulationSum(): number {
		return this.filteredHouseholds.reduce(
			(sum, item) => sum + this.getTotalPopulation(item),
			0
		);
	}

	/**
	 * Track by function for household rows
	 */
	trackByHouseholdId(index: number, item: SamplingResultHouseholdDto): number {
		return item.household.id;
	}
}

