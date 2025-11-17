import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EnumeratorDataService } from '../../../core/dataservice/enumerator-service/enumerator.dataservice';
import { Survey } from '../../../core/dataservice/survey/survey.dto';
import { EnumerationArea } from '../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { PrimeNgModules } from '../../../primeng.modules';

interface LocationHierarchy {
	dzongkhagId: number;
	dzongkhagName: string;
	adminZoneId?: number;
	adminZoneName?: string;
	subAdminZoneId?: number;
	subAdminZoneName?: string;
}

@Component({
	selector: 'app-survey-detail',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './survey-detail.component.html',
	styleUrls: ['./survey-detail.component.css'],
})
export class SurveyDetailComponent implements OnInit {
	survey: Survey | null = null;
	surveyId: number = 0;
	loading = true;
	error: string | null = null;

	// Tab control
	activeTab: 'location' | 'status' = 'location';

	// Survey status data
	surveyStatus: any = null;
	loadingStatus = false;

	// Location selection
	selectedDzongkhag: LocationHierarchy | null = null;
	selectedAdminZone: { id: number; name: string } | null = null;
	selectedSubAdminZone: { id: number; name: string } | null = null;
	selectedEnumerationArea: {
		id: number;
		name: string;
		areaCode: string;
		surveyEnumerationAreaId?: number;
	} | null = null;

	// Available options
	dzongkhags: LocationHierarchy[] = [];
	adminZones: { id: number; name: string }[] = [];
	subAdminZones: { id: number; name: string }[] = [];
	enumerationAreas: {
		id: number;
		name: string;
		areaCode: string;
		surveyEnumerationAreaId: number;
	}[] = [];

	// Grouped enumeration areas
	groupedEnumerationAreas: Map<string, EnumerationArea[]> = new Map();

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private enumeratorService: EnumeratorDataService
	) {}

	ngOnInit() {
		this.surveyId = Number(this.route.snapshot.paramMap.get('surveyId'));
		this.loadSurveyDetails();
	}

	/**
	 * Switch between tabs
	 */
	switchTab(tab: 'location' | 'status') {
		this.activeTab = tab;
		if (tab === 'status' && !this.surveyStatus) {
			this.loadSurveyStatus();
		}
	}

	/**
	 * Load survey submission status
	 */
	loadSurveyStatus() {
		this.loadingStatus = true;
		this.enumeratorService.getSurveySubmissionStatus(this.surveyId).subscribe({
			next: (status) => {
				this.surveyStatus = status;
				this.loadingStatus = false;
			},
			error: (error) => {
				console.error('Error loading survey status:', error);
				this.loadingStatus = false;
			},
		});
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
	 * Process enumeration areas to extract unique locations
	 */
	processEnumerationAreas() {
		if (!this.survey?.surveyEnumerationAreas) return;

		const dzongkhagMap = new Map<number, LocationHierarchy>();

		this.survey.surveyEnumerationAreas.forEach((surveyEa) => {
			const ea = surveyEa.enumerationArea;
			const dzongkhag =
				ea?.subAdministrativeZone?.administrativeZone?.dzongkhag;
			if (dzongkhag) {
				if (!dzongkhagMap.has(dzongkhag.id)) {
					dzongkhagMap.set(dzongkhag.id, {
						dzongkhagId: dzongkhag.id,
						dzongkhagName: dzongkhag.name,
					});
				}
			}
		});

		this.dzongkhags = Array.from(dzongkhagMap.values()).sort((a, b) =>
			a.dzongkhagName.localeCompare(b.dzongkhagName)
		);
	}

	/**
	 * Handle Dzongkhag selection
	 */
	onDzongkhagChange() {
		this.selectedAdminZone = null;
		this.selectedSubAdminZone = null;
		this.selectedEnumerationArea = null;
		this.adminZones = [];
		this.subAdminZones = [];
		this.enumerationAreas = [];

		if (!this.selectedDzongkhag || !this.survey?.surveyEnumerationAreas) return;

		const adminZoneMap = new Map<number, { id: number; name: string }>();

		this.survey.surveyEnumerationAreas.forEach((surveyEa) => {
			const ea = surveyEa.enumerationArea;
			const dzongkhag =
				ea?.subAdministrativeZone?.administrativeZone?.dzongkhag;
			const adminZone = ea?.subAdministrativeZone?.administrativeZone;

			if (dzongkhag?.id === this.selectedDzongkhag?.dzongkhagId && adminZone) {
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
	}

	/**
	 * Handle Administrative Zone selection
	 */
	onAdminZoneChange() {
		this.selectedSubAdminZone = null;
		this.selectedEnumerationArea = null;
		this.subAdminZones = [];
		this.enumerationAreas = [];

		if (
			!this.selectedDzongkhag ||
			!this.selectedAdminZone ||
			!this.survey?.surveyEnumerationAreas
		)
			return;

		const subAdminZoneMap = new Map<number, { id: number; name: string }>();

		this.survey.surveyEnumerationAreas.forEach((surveyEa) => {
			const ea = surveyEa.enumerationArea;
			const adminZone = ea?.subAdministrativeZone?.administrativeZone;
			const subAdminZone = ea?.subAdministrativeZone;

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
	}

	/**
	 * Handle Sub Administrative Zone selection
	 */
	onSubAdminZoneChange() {
		this.selectedEnumerationArea = null;
		this.enumerationAreas = [];

		if (
			!this.selectedDzongkhag ||
			!this.selectedAdminZone ||
			!this.selectedSubAdminZone ||
			!this.survey?.surveyEnumerationAreas
		)
			return;

		const eaMap = new Map<
			number,
			{
				id: number;
				name: string;
				areaCode: string;
				surveyEnumerationAreaId: number;
			}
		>();

		this.survey.surveyEnumerationAreas.forEach((surveyEa) => {
			const ea = surveyEa.enumerationArea;
			const subAdminZone = ea?.subAdministrativeZone;

			if (
				subAdminZone?.id === this.selectedSubAdminZone?.id &&
				ea &&
				surveyEa.id
			) {
				if (!eaMap.has(ea.id)) {
					eaMap.set(ea.id, {
						id: ea.id,
						name: ea.name,
						areaCode: ea.areaCode || '',
						surveyEnumerationAreaId: surveyEa.id,
					});
				}
			}
		});

		const eaArray: Array<{
			id: number;
			name: string;
			areaCode: string;
			surveyEnumerationAreaId: number;
		}> = Array.from(eaMap.values());

		this.enumerationAreas = eaArray.sort((a, b) =>
			a.name.localeCompare(b.name)
		);
	}

	/**
	 * Check if Continue button should be enabled
	 */
	canContinue(): boolean {
		return !!(
			this.selectedDzongkhag &&
			this.selectedAdminZone &&
			this.selectedSubAdminZone &&
			this.selectedEnumerationArea
		);
	}

	/**
	 * Navigate to survey enumeration area detail
	 */
	continue() {
		if (
			!this.canContinue() ||
			!this.selectedEnumerationArea?.surveyEnumerationAreaId
		)
			return;

		this.router.navigate([
			'/enumerator/survey-enumeration-area',
			this.selectedEnumerationArea.surveyEnumerationAreaId,
		]);
	}

	/**
	 * Go back to dashboard
	 */
	goBack() {
		this.router.navigate(['/enumerator']);
	}

	/**
	 * Navigate to enumeration area detail from status view
	 */
	navigateToEnumerationArea(surveyEnumerationAreaId: number) {
		if (!surveyEnumerationAreaId) return;
		this.router.navigate([
			'/enumerator/survey-enumeration-area',
			surveyEnumerationAreaId,
		]);
	}

	/**
	 * Navigate to dzongkhag data viewer
	 */
	navigateToDzongkhag(dzongkhagId: number) {
		if (!dzongkhagId) return;
		this.router.navigate(['/admin/data-view/dzongkhag', dzongkhagId]);
	}

	/**
	 * Format date for display
	 */
	formatDate(date: string | Date): string {
		if (!date) return 'N/A';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}
}
