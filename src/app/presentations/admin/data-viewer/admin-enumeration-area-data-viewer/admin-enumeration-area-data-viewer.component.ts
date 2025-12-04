import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PrimeNgModules } from '../../../../primeng.modules';

import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { EnumerationArea } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { AdministrativeZone } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
// Import child components
import { CurrentHouseholdListingComponent } from './current-household-listing/current-household-listing.component';
import { AdminEnumerationAreaTrendsComponent } from './admin-enumeration-area-trends/admin-enumeration-area-trends.component';
import { EnumerationAreaMapComponent } from './enumeration-area-map/enumeration-area-map.component';
import { GenerateFullEACode } from '../../../../core/utility/utility.service';
import { LocationDownloadService } from '../../../../core/dataservice/downloads/location.download.service';

@Component({
	selector: 'app-admin-enumeration-area-data-viewer',
	templateUrl: './admin-enumeration-area-data-viewer.component.html',
	styleUrls: ['./admin-enumeration-area-data-viewer.component.css'],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		RouterModule,
		PrimeNgModules,
		CurrentHouseholdListingComponent,
		AdminEnumerationAreaTrendsComponent,
		EnumerationAreaMapComponent,
	],
	providers: [MessageService],
})
export class AdminEnumerationAreaDataViewerComponent
	implements OnInit, OnDestroy
{
	// Data
	enumerationArea: EnumerationArea | null = null;
	eaId: number = 0;
	subAdministrativeZone: any = null;
	administrativeZone: any = null;
	dzongkhag: any = null;
	activeMainTab: 'insights' | 'households' | 'historical-trends' = 'insights';
	activeHouseholdTab: 'current' | 'Trends' = 'current';

	// Filter/Navigation properties
	dzongkhagOptions: any[] = [];
	adminZoneOptions: any[] = [];
	subAdminZoneOptions: any[] = [];
	eaOptions: any[] = [];
	selectedDzongkhag: number | null = null;
	selectedAdminZone: number | null = null;
	selectedSubAdminZone: number | null = null;
	selectedEAFilter: number | null = null;

	getFullEACode = GenerateFullEACode;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private enumerationAreaService: EnumerationAreaDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private dzongkhagService: DzongkhagDataService,
		private messageService: MessageService,
		private locationDownloadService: LocationDownloadService
	) {}

	ngOnInit() {
		// Load all dzongkhags for filter dropdown
		this.loadDzongkhags();

		this.route.params.subscribe((params) => {
			this.eaId = +params['id'];
			if (this.eaId) {
				this.loadData();
			}
		});
	}

	ngOnDestroy() {
		// Map cleanup is handled by the child component
	}

	loadData() {
		// Only load the enumeration area - map component will handle the rest
		this.enumerationAreaService.findEnumerationAreaById(this.eaId).subscribe({
			next: (ea) => {
				this.enumerationArea = ea;
			},
			error: (error) => {
				console.error('Error loading enumeration area:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load enumeration area details',
					life: 3000,
				});
			},
		});
	}

	// Event handlers for map component
	handleMapNavigation(event: {
		type: 'dzongkhag' | 'adminzone' | 'subadminzone' | 'ea';
		id: number;
	}) {
		switch (event.type) {
			case 'dzongkhag':
				this.router.navigate(['/admin/data-view/dzongkhag', event.id]);
				break;
			case 'adminzone':
				this.router.navigate(['/admin/data-view/admzone', event.id]);
				break;
			case 'subadminzone':
				this.router.navigate(['/admin/data-view/sub-admzone', event.id]);
				break;
			case 'ea':
				this.router.navigate(['/admin/data-view/eazone', event.id]);
				break;
		}
	}

	onDownloadKML() {
		// Delegate to map component - this is handled by the map component
	}

	onDownloadGeoJSON() {
		// Delegate to map component - this is handled by the map component
	}

	onDownloadHouseholdData() {
			this.messageService.add({
			severity: 'info',
			summary: 'Not Available',
			detail: 'Household CSV export is available in the Households tab',
				life: 3000,
			});
		}

	onNavigateToLocation(event: {
		type: 'dzongkhag' | 'adminzone' | 'subadminzone' | 'ea';
		id: number;
	}) {
		this.handleMapNavigation(event);
	}

	onDzongkhagChangeForMap(dzongkhagId: number | null) {
		this.selectedDzongkhag = dzongkhagId;
		this.onDzongkhagChange();
	}

	onAdminZoneChangeForMap(adminZoneId: number | null) {
		this.selectedAdminZone = adminZoneId;
		this.onAdminZoneChange();
	}

	onSubAdminZoneChangeForMap(subAdminZoneId: number | null) {
		this.selectedSubAdminZone = subAdminZoneId;
		this.onSubAdminZoneChange();
	}

	onHierarchyLoaded(event: {
		subAdministrativeZone: any;
		administrativeZone: any;
		dzongkhag: any;
	}) {
		this.subAdministrativeZone = event.subAdministrativeZone;
		this.administrativeZone = event.administrativeZone;
		this.dzongkhag = event.dzongkhag;
	}

	// Filter/Navigation methods
	loadDzongkhags() {
		this.dzongkhagService.findAllDzongkhags().subscribe({
			next: (dzongkhags) => {
				this.dzongkhagOptions = dzongkhags.map((d) => ({
					label: d.name,
					value: d.id,
				}));
			},
			error: (error) => {
				console.error('Error loading dzongkhags:', error);
			},
		});
	}

	onDzongkhagChange() {
		// Reset dependent selections
		this.selectedAdminZone = null;
		this.selectedSubAdminZone = null;
		this.selectedEAFilter = null;
		this.adminZoneOptions = [];
		this.subAdminZoneOptions = [];
		this.eaOptions = [];

		if (this.selectedDzongkhag) {
			this.administrativeZoneService
				.findAdministrativeZonesByDzongkhag(this.selectedDzongkhag)
				.subscribe({
					next: (zones: AdministrativeZone[]) => {
						this.adminZoneOptions = zones.map((z: AdministrativeZone) => ({
							label: z.name,
							value: z.id,
						}));
					},
					error: (error: any) => {
						console.error('Error loading administrative zones:', error);
					},
				});
		}
	}

	onAdminZoneChange() {
		// Reset dependent selections
		this.selectedSubAdminZone = null;
		this.selectedEAFilter = null;
		this.subAdminZoneOptions = [];
		this.eaOptions = [];

		if (this.selectedAdminZone) {
			this.subAdministrativeZoneService
				.findSubAdministrativeZonesByAdministrativeZone(this.selectedAdminZone)
				.subscribe({
					next: (subZones: any[]) => {
						this.subAdminZoneOptions = subZones.map((sz: any) => ({
							label: sz.name,
							value: sz.id,
						}));
					},
					error: (error: any) => {
						console.error('Error loading sub administrative zones:', error);
					},
				});
		}
	}

	onSubAdminZoneChange() {
		// Reset dependent selections
		this.selectedEAFilter = null;
		this.eaOptions = [];

		if (this.selectedSubAdminZone) {
			this.enumerationAreaService
				.findEnumerationAreasBySubAdministrativeZone(this.selectedSubAdminZone)
				.subscribe({
					next: (eas: EnumerationArea[]) => {
						this.eaOptions = eas.map((ea: EnumerationArea) => ({
							label: `${ea.name} (${ea.areaCode})`,
							value: ea.id,
						}));
					},
					error: (error: any) => {
						console.error('Error loading enumeration areas:', error);
					},
				});
		}
	}

	submitNavigation() {
		if (this.selectedEAFilter) {
			this.router.navigate([
				'/admin/data-view/enumeration-area',
				this.selectedEAFilter,
			]);
		} else if (this.selectedSubAdminZone) {
			this.router.navigate([
				'/admin/data-view/sub-admzone',
				this.selectedSubAdminZone,
			]);
		} else if (this.selectedAdminZone) {
			this.router.navigate([
				'/admin/data-view/admzone',
				this.selectedAdminZone,
			]);
		} else if (this.selectedDzongkhag) {
			this.router.navigate([
				'/admin/data-view/dzongkhag',
				this.selectedDzongkhag,
			]);
		}
	}


	navigateTo(type: 'dzongkhag' | 'adminzone' | 'subadminzone', id: number) {
		switch (type) {
			case 'dzongkhag':
				this.router.navigate(['/admin/data-view/dzongkhag', id]);
				break;
			case 'adminzone':
				this.router.navigate(['/admin/data-view/admzone', id]);
				break;
			case 'subadminzone':
				this.router.navigate(['/admin/data-view/sub-admzone', id]);
				break;
		}
	}

	goBack() {
		this.router.navigate(['/admin/master/enumeration-areas']);
	}

	onHouseholdListingUploadComplete() {
		// Refresh the current household listing data
		this.messageService.add({
			severity: 'success',
			summary: 'Upload Complete',
			detail: 'Household listing has been uploaded successfully',
			life: 5000,
		});

		// You can add logic here to refresh the current household listing component
		// or emit an event to refresh data
	}

}
