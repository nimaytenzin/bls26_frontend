import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EnumeratorDataService } from '../../../core/dataservice/enumerator-service/enumerator.dataservice';
import { EnumeratorMapStateService } from '../../../core/utility/enumerator-map-state.service';
import { Survey } from '../../../core/dataservice/survey/survey.dto';
import { EnumerationArea } from '../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { PrimeNgModules } from '../../../primeng.modules';
import { DzongkhagDataService } from '../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';


@Component({
	selector: 'app-survey-detail',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './survey-detail.component.html',
	styleUrls: ['./survey-detail.component.scss'],
})
export class SurveyDetailComponent implements OnInit {
	survey: Survey | null = null;
	surveyId: number = 0;
	loading = true;
	error: string | null = null;

	// Location selection
	selectedDzongkhag: { id: number; name: string } | null = null;
	selectedAdminZone: { id: number; name: string } | null = null;
	selectedSubAdminZone: { id: number; name: string } | null = null;

	// Available options
	dzongkhags: { id: number; name: string }[] = [];
	adminZones: { id: number; name: string }[] = [];
	subAdminZones: { id: number; name: string }[] = [];

	// Filtered enumeration areas for selected SAZ
	filteredEnumerationAreas: any[] = [];
	searchQuery: string = '';

	// Flag to prevent saving during restore
	private isRestoring: boolean = false;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private enumeratorService: EnumeratorDataService,
		private mapStateService: EnumeratorMapStateService,
		private dzongkhagService: DzongkhagDataService
	) {}

	ngOnInit() {
		this.surveyId = Number(this.route.snapshot.paramMap.get('surveyId'));
		// Clear all map states when entering survey detail page
		this.mapStateService.clearAllMapStates();
		this.loadSurveyDetails();
	}

	/**
	 * Get storage key for this survey's selections
	 */
	private getStorageKey(): string {
		return `survey_${this.surveyId}_location_selection`;
	}

	/**
	 * Save current selection to localStorage
	 */
	private saveSelection() {
		// Don't save during restore process
		if (this.isRestoring) return;

		const selection = {
			dzongkhagId: this.selectedDzongkhag?.id,
			adminZoneId: this.selectedAdminZone?.id,
			subAdminZoneId: this.selectedSubAdminZone?.id,
		};
		localStorage.setItem(this.getStorageKey(), JSON.stringify(selection));
	}

	/**
	 * Load saved selection from localStorage
	 */
	private loadSelection(): {
		dzongkhagId?: number;
		adminZoneId?: number;
		subAdminZoneId?: number;
	} | null {
		try {
			const saved = localStorage.getItem(this.getStorageKey());
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.error('Error loading saved selection:', error);
		}
		return null;
	}

	/**
	 * Restore saved selection after survey data is loaded
	 */
	private restoreSelection() {
		const saved = this.loadSelection();
		if (!saved || !this.survey?.surveyEnumerationAreas || this.dzongkhags.length === 0) return;

		this.isRestoring = true;

		// Restore Dzongkhag
		if (saved.dzongkhagId) {
			const dzongkhag = this.dzongkhags.find((d) => d.id === saved.dzongkhagId);
			if (dzongkhag) {
				this.selectedDzongkhag = dzongkhag;
				// Manually trigger the change to populate admin zones
				this.onDzongkhagChange();

				// Use setTimeout to ensure adminZones are populated before restoring
				setTimeout(() => {
					// Restore Admin Zone
					if (saved.adminZoneId && this.adminZones.length > 0) {
						const adminZone = this.adminZones.find(
							(a) => a.id === saved.adminZoneId
						);
						if (adminZone) {
							this.selectedAdminZone = adminZone;
							this.onAdminZoneChange();

							// Use setTimeout to ensure subAdminZones are populated before restoring
							setTimeout(() => {
								// Restore Sub Admin Zone
								if (saved.subAdminZoneId && this.subAdminZones.length > 0) {
									const subAdminZone = this.subAdminZones.find(
										(s) => s.id === saved.subAdminZoneId
									);
									if (subAdminZone) {
										this.selectedSubAdminZone = subAdminZone;
										this.onSubAdminZoneChange();
									}
								}
								this.isRestoring = false;
							}, 0);
						} else {
							this.isRestoring = false;
						}
					} else {
						this.isRestoring = false;
					}
				}, 0);
			} else {
				this.isRestoring = false;
			}
		} else {
			this.isRestoring = false;
		}
	}

	/**
	 * Process enumeration areas to extract unique locations
	 */
	processEnumerationAreas() {
		if (!this.survey?.surveyEnumerationAreas) return;

		// Extract unique dzongkhag IDs from enumeration areas
		const dzongkhagIdSet = new Set<number>();

		this.survey.surveyEnumerationAreas.forEach((surveyEa) => {
			const ea = surveyEa.enumerationArea;
			// Use first SAZ if multiple exist
			const firstSaz = ea?.subAdministrativeZones && ea.subAdministrativeZones.length > 0
				? ea.subAdministrativeZones[0]
				: null;
			const dzongkhagId = firstSaz?.administrativeZone?.dzongkhagId;
			if (dzongkhagId) {
				dzongkhagIdSet.add(dzongkhagId);
			}
		});

		// Load all dzongkhags and filter to only those that exist in the survey
		this.dzongkhagService.findAllDzongkhags().subscribe({
			next: (allDzongkhags) => {
				this.dzongkhags = allDzongkhags
					.filter((dz) => dzongkhagIdSet.has(dz.id))
					.map((dz) => ({
						id: dz.id,
						name: dz.name,
					}))
					.sort((a, b) => a.name.localeCompare(b.name));
				
				// Restore selection after dzongkhags are loaded
				this.restoreSelection();
			},
			error: (error) => {
				console.error('Error loading dzongkhags:', error);
				// Fallback: create dzongkhags from IDs only (without names)
				this.dzongkhags = Array.from(dzongkhagIdSet)
					.map((id) => ({ id, name: `Dzongkhag ${id}` }))
					.sort((a, b) => a.id - b.id);
				this.restoreSelection();
			},
		});
	}

	/**
	 * Handle Dzongkhag selection
	 */
	onDzongkhagChange() {
		this.selectedAdminZone = null;
		this.selectedSubAdminZone = null;
		this.adminZones = [];
		this.subAdminZones = [];
		this.filteredEnumerationAreas = [];
		this.searchQuery = '';

		if (!this.selectedDzongkhag || !this.survey?.surveyEnumerationAreas) {
			this.saveSelection();
			return;
		}

		const adminZoneMap = new Map<number, { id: number; name: string }>();

		this.survey.surveyEnumerationAreas.forEach((surveyEa) => {
			const ea = surveyEa.enumerationArea;
			// Use first SAZ if multiple exist
			const firstSaz = ea?.subAdministrativeZones && ea.subAdministrativeZones.length > 0
				? ea.subAdministrativeZones[0]
				: null;
			const dzongkhag = firstSaz?.administrativeZone?.dzongkhag;
			const adminZone = firstSaz?.administrativeZone;

			if (dzongkhag?.id === this.selectedDzongkhag?.id && adminZone) {
				if (!adminZoneMap.has(adminZone.id)) {
					adminZoneMap.set(adminZone.id, {
						id: adminZone.id,
						name: adminZone.name,
					});
				}
			}
		});

		this.adminZones = Array.from(adminZoneMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);
		this.saveSelection();
	}

	/**
	 * Handle Administrative Zone selection
	 */
	onAdminZoneChange() {
		this.selectedSubAdminZone = null;
		this.subAdminZones = [];
		this.filteredEnumerationAreas = [];
		this.searchQuery = '';

		if (
			!this.selectedDzongkhag ||
			!this.selectedAdminZone ||
			!this.survey?.surveyEnumerationAreas
		) {
			this.saveSelection();
			return;
		}

		const subAdminZoneMap = new Map<number, { id: number; name: string }>();

		this.survey.surveyEnumerationAreas.forEach((surveyEa) => {
			const ea = surveyEa.enumerationArea;
			// Use first SAZ if multiple exist
			const firstSaz = ea?.subAdministrativeZones && ea.subAdministrativeZones.length > 0
				? ea.subAdministrativeZones[0]
				: null;
			const adminZone = firstSaz?.administrativeZone;
			const subAdminZone = firstSaz;

			if (adminZone?.id === this.selectedAdminZone?.id && subAdminZone) {
				if (!subAdminZoneMap.has(subAdminZone.id)) {
					subAdminZoneMap.set(subAdminZone.id, {
						id: subAdminZone.id,
						name: subAdminZone.name,
					});
				}
			}
		});

		this.subAdminZones = Array.from(subAdminZoneMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);
		this.saveSelection();
	}

	/**
	 * Handle Sub Administrative Zone selection
	 */
	onSubAdminZoneChange() {
		this.filteredEnumerationAreas = [];
		this.searchQuery = '';

		if (
			!this.selectedDzongkhag ||
			!this.selectedAdminZone ||
			!this.selectedSubAdminZone ||
			!this.survey?.surveyEnumerationAreas
		) {
			this.saveSelection();
			return;
		}

		// Filter enumeration areas for selected SAZ
		this.filteredEnumerationAreas = this.survey.surveyEnumerationAreas.filter(
			(surveyEa) => {
				const ea = surveyEa.enumerationArea;
				// Check if EA has the selected SAZ in its array
				return ea?.subAdministrativeZones?.some(saz => saz.id === this.selectedSubAdminZone?.id) || false;
			}
		);
		this.saveSelection();
	}

	/**
	 * Filter enumeration areas based on search query (within selected SAZ)
	 */
	filterEnumerationAreas() {
		if (!this.selectedSubAdminZone || !this.survey?.surveyEnumerationAreas) {
			this.filteredEnumerationAreas = [];
			return;
		}

		// Get all EAs for selected SAZ
		let filtered = this.survey.surveyEnumerationAreas.filter((surveyEa) => {
			const ea = surveyEa.enumerationArea;
			// Check if EA has the selected SAZ in its array
			return ea?.subAdministrativeZones?.some(saz => saz.id === this.selectedSubAdminZone?.id) || false;
		});

		// Apply search filter if query exists
		if (this.searchQuery.trim()) {
			const query = this.searchQuery.toLowerCase().trim();
			filtered = filtered.filter((surveyEa) => {
				const ea = surveyEa.enumerationArea;
				if (!ea) return false;

				// Search in EA name
				if (ea.name?.toLowerCase().includes(query)) return true;

				// Search in area code
				if (ea.areaCode?.toLowerCase().includes(query)) return true;

				return false;
			});
		}

		this.filteredEnumerationAreas = filtered;
	}

	/**
	 * Get location hierarchy string for display
	 */
	getLocationHierarchy(ea: EnumerationArea | undefined): string {
		if (!ea) return '';
		// Use first SAZ if multiple exist
		const firstSaz = ea.subAdministrativeZones && ea.subAdministrativeZones.length > 0
			? ea.subAdministrativeZones[0]
			: null;
		const parts: string[] = [];
		// Get dzongkhag name from loaded dzongkhags array
		const dzongkhagId = firstSaz?.administrativeZone?.dzongkhagId;
		if (dzongkhagId) {
			const dzongkhag = this.dzongkhags.find((d) => d.id === dzongkhagId);
			if (dzongkhag) {
				parts.push(dzongkhag.name);
			}
		}
		if (firstSaz?.administrativeZone?.name) {
			parts.push(firstSaz.administrativeZone.name);
		}
		if (firstSaz?.name) {
			parts.push(firstSaz.name);
		}
		return parts.join(' → ');
	}

	/**
	 * Track by function for ngFor
	 */
	trackBySurveyEaId(index: number, surveyEa: any): number {
		return surveyEa.id || index;
	}

	/**
	 * Get status for enumeration area
	 * Priority: Published > Sampled > Listing Completed > PENDING
	 */
	getEaStatus(surveyEa: any): 'PENDING' | 'Listing Completed' | 'Sampled' | 'Published' {
		if (surveyEa.isPublished) {
			return 'Published';
		}
		if (surveyEa.isSampled) {
			return 'Sampled';
		}
		if (surveyEa.isEnumerated) {
			return 'Listing Completed';
		}
		return 'PENDING';
	}

	/**
	 * Get status badge color class
	 */
	getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'Published':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'Sampled':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'Listing Completed':
				return 'bg-purple-100 text-purple-800 border-purple-200';
			case 'PENDING':
				return 'bg-amber-100 text-amber-800 border-amber-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}

	/**
	 * Get status icon
	 */
	getStatusIcon(status: string): string {
		switch (status) {
			case 'Published':
				return 'pi pi-check-circle';
			case 'Sampled':
				return 'pi pi-filter';
			case 'Listing Completed':
				return 'pi pi-check';
			case 'PENDING':
				return 'pi pi-clock';
			default:
				return 'pi pi-info-circle';
		}
	}

	/**
	 * Load survey details with enumeration areas
	 */
	loadSurveyDetails() {
		this.loading = true;
		this.error = null;

		this.enumeratorService.getSurveyDetails(this.surveyId).subscribe({
			next: (survey) => {
				this.survey = survey;
				this.processEnumerationAreas();
				// restoreSelection() is called in processEnumerationAreas() after dzongkhags are loaded
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading survey details:', error);
				this.error = 'Failed to load survey details. Please try again.';
				this.loading = false;
			},
		});
	}


	/**
	 * Go back to dashboard
	 */
	goBack() {
		this.router.navigate(['/enumerator']);
	}

	/**
	 * Navigate to enumeration area map view
	 */
	navigateToEnumerationArea(surveyEnumerationAreaId: number) {
		if (!surveyEnumerationAreaId) return;
		this.router.navigate([
			'/enumerator/survey-enumeration-area',
			surveyEnumerationAreaId,
			'map',
		]);
	}

	/**
	 * Navigate to sampling results view
	 */
	navigateToSamplingResults(surveyEnumerationAreaId: number) {
		if (!surveyEnumerationAreaId || !this.surveyId) return;
		this.router.navigate([
			'/enumerator/survey',
			this.surveyId,
			'enumeration-area',
			surveyEnumerationAreaId,
			'sampling-results',
		]);
	}


}
