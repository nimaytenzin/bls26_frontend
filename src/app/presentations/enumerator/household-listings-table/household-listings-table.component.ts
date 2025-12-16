import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EnumeratorDataService } from '../../../core/dataservice/enumerator-service/enumerator.dataservice';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import { SurveyEnumerationAreaStructureDataService } from '../../../core/dataservice/survey-enumeration-area-structure/survey-enumeration-area-structure.dataservice';
import { EnumeratorMapStateService } from '../../../core/utility/enumerator-map-state.service';
import { PrimeNgModules } from '../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { SurveyEnumerationAreaHouseholdListing } from '../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import { SurveyEnumerationAreaStructure } from '../../../core/dataservice/survey-enumeration-area-structure/survey-enumeration-area-structure.dto';
import { SurveyEnumerationArea } from '../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';

@Component({
	selector: 'app-household-listings-table',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
	templateUrl: './household-listings-table.component.html',
	styleUrls: ['./household-listings-table.component.scss'],
})
export class HouseholdListingsTableComponent implements OnInit {
	surveyEnumerationAreaId!: number;
	surveyEnumerationArea: SurveyEnumerationArea | null = null;
	structures: SurveyEnumerationAreaStructure[] = [];
	filteredStructures: SurveyEnumerationAreaStructure[] = [];
	loading = true;
	searchQuery = '';
	
	// Table properties
	selectedHousehold: SurveyEnumerationAreaHouseholdListing | null = null;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private enumeratorService: EnumeratorDataService,
		private householdService: SurveyEnumerationAreaHouseholdListingDataService,
		private structureService: SurveyEnumerationAreaStructureDataService,
		private messageService: MessageService,
		private mapStateService: EnumeratorMapStateService
	) {}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			this.surveyEnumerationAreaId = +params['surveyEnumerationAreaId'];
			this.loadSurveyEnumerationAreaDetails();
			this.loadStructuresWithHouseholdListings();
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
	 * Load structures with household listings
	 */
	loadStructuresWithHouseholdListings(): void {
		this.loading = true;
		this.structureService
			.getStructuresWithHouseholdListings(this.surveyEnumerationAreaId)
			.subscribe({
				next: (data: SurveyEnumerationAreaStructure[]) => {
					// Structures are already sorted by structureNumber (ASC) from API
					// Household listings are already sorted by householdSerialNumber (ASC) from API
					this.structures = data;
					this.filteredStructures = [...this.structures];
					this.loading = false;
				},
				error: (error: any) => {
					console.error('Error loading structures with household listings:', error);
					this.loading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load structures and household listings',
					});
				},
			});
	}

	/**
	 * Filter structures and households based on search query
	 */
	filterHouseholds(): void {
		if (!this.searchQuery.trim()) {
			this.filteredStructures = [...this.structures];
		} else {
			const query = this.searchQuery.toLowerCase();
			this.filteredStructures = this.structures
				.map(structure => {
					// Filter households within this structure
					const filteredHouseholds = structure.householdListings.filter(
						(h) =>
							h.householdIdentification?.toLowerCase().includes(query) ||
							h.nameOfHOH?.toLowerCase().includes(query) ||
							h.phoneNumber?.toLowerCase().includes(query) ||
							h.householdSerialNumber?.toString().includes(query)
					);
					
					// Include structure if it matches search OR has matching households
					const structureMatches = structure.structureNumber?.toLowerCase().includes(query);
					
					if (structureMatches || filteredHouseholds.length > 0) {
						return {
							...structure,
							householdListings: filteredHouseholds
						};
					}
					return null;
				})
				.filter(structure => structure !== null) as SurveyEnumerationAreaStructure[];
		}
	}

	/**
	 * Navigate back to map view
	 */
	goBack(): void {
		this.router.navigate([
			'/enumerator/survey-enumeration-area',
			this.surveyEnumerationAreaId,
			'map',
		]);
	}

	/**
	 * Navigate to edit household form
	 */
	viewHouseholdDetails(household: SurveyEnumerationAreaHouseholdListing): void {
		console.log('Edit household clicked:', household);
		this.router.navigate([
			'/enumerator/household-listing-form',
			this.surveyEnumerationAreaId,
			household.id,
		]);
	}

	/**
	 * Navigate to map view and zoom to structure
	 */
	zoomToStructure(structureId: number): void {
		console.log('Locate structure clicked:', structureId);
		
		// Find the structure in our loaded structures to get its coordinates
		const structure = this.structures.find(s => s.id === structureId);
		
		if (structure && structure.latitude && structure.longitude) {
			// Save map state with structure's coordinates and zoom level
			this.mapStateService.saveMapPosition(
				this.surveyEnumerationAreaId,
				{ lat: structure.latitude, lng: structure.longitude },
				19 // Zoom level for structure view (more zoomed in)
			);
			// Save selected structure
			this.mapStateService.saveSelectedStructure(this.surveyEnumerationAreaId, structureId);
		} else {
			// If structure not found or has no coordinates, just save the selection
			this.mapStateService.saveSelectedStructure(this.surveyEnumerationAreaId, structureId);
		}
		
		// Navigate to map (state will be restored from service)
		this.router.navigate(
			[
				'/enumerator/survey-enumeration-area',
				this.surveyEnumerationAreaId,
				'map',
			]
		);
	}

	/**
	 * Navigate to add household for structure
	 */
	addHouseholdToStructure(structureId: number): void {
		console.log('Add household to structure clicked:', structureId);
		// Save selected structure to service before navigation
		this.mapStateService.saveSelectedStructure(this.surveyEnumerationAreaId, structureId);
		// Navigate to household form (structure ID is saved in service)
		this.router.navigate(
			['/enumerator/household-listing-form', this.surveyEnumerationAreaId]
		);
	}

	/**
	 * Get enumeration area name
	 */
	getEnumerationAreaName(): string {
		return (
			this.surveyEnumerationArea?.enumerationArea?.name ||
			this.surveyEnumerationArea?.enumerationArea?.areaCode ||
			'N/A'
		);
	}

	/**
	 * Get location hierarchy string
	 */
	getLocationHierarchy(): string {
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
	getTotalPopulation(household: SurveyEnumerationAreaHouseholdListing): number {
		return (household.totalMale || 0) + (household.totalFemale || 0);
	}

	/**
	 * Get total population for a structure
	 */
	getStructureTotalPopulation(structure: SurveyEnumerationAreaStructure): number {
		return structure.householdListings.reduce(
			(sum, h) => sum + this.getTotalPopulation(h), 
			0
		);
	}

	/**
	 * Get total population sum for all filtered households
	 */
	getTotalPopulationSum(): number {
		return this.filteredStructures.reduce(
			(sum, structure) => sum + this.getStructureTotalPopulation(structure), 
			0
		);
	}

	/**
	 * Get total number of households
	 */
	getTotalHouseholds(): number {
		return this.filteredStructures.reduce(
			(sum, structure) => sum + structure.householdListings.length, 
			0
		);
	}

	/**
	 * Get total number of structures
	 */
	getTotalStructures(): number {
		return this.filteredStructures.length;
	}


	/**
	 * Track by function for structure rows
	 */
	trackByStructureId(index: number, structure: SurveyEnumerationAreaStructure): number {
		return structure.id;
	}

	/**
	 * Track by function for household rows
	 */
	trackByHouseholdId(index: number, household: SurveyEnumerationAreaHouseholdListing): number {
		return household.id;
	}
}

