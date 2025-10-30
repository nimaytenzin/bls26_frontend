import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PrimeNgModules } from '../../../../primeng.modules';
import * as L from 'leaflet';
import { forkJoin } from 'rxjs';

import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { EnumerationArea } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { SubAdministrativeZone } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { AdministrativeZone } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';

@Component({
	selector: 'app-admin-enumeration-area-data-viewer',
	templateUrl: './admin-enumeration-area-data-viewer.component.html',
	styleUrls: ['./admin-enumeration-area-data-viewer.component.css'],
	standalone: true,
	imports: [CommonModule, RouterModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminEnumerationAreaDataViewerComponent
	implements OnInit, OnDestroy
{
	// Data
	enumerationArea: EnumerationArea | null = null;
	subAdministrativeZone: SubAdministrativeZone | null = null;
	administrativeZone: AdministrativeZone | null = null;
	dzongkhag: Dzongkhag | null = null;

	// Maps
	eaMap: L.Map | null = null;
	dzongkhagMap: L.Map | null = null;
	adminZoneMap: L.Map | null = null;
	subAdminZoneMap: L.Map | null = null;

	// State
	loading = true;
	eaId: number = 0;

	// Tile layer
	private readonly tileLayer =
		'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private enumerationAreaService: EnumerationAreaDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private dzongkhagService: DzongkhagDataService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		this.route.params.subscribe((params) => {
			this.eaId = +params['id'];
			if (this.eaId) {
				this.loadData();
			}
		});
	}

	ngOnDestroy() {
		this.destroyMaps();
	}

	loadData() {
		this.loading = true;

		this.enumerationAreaService.findEnumerationAreaById(this.eaId).subscribe({
			next: (ea) => {
				this.enumerationArea = ea;
				// Load parent hierarchy
				this.loadHierarchy();
			},
			error: (error) => {
				console.error('Error loading enumeration area:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load enumeration area details',
					life: 3000,
				});
				this.loading = false;
			},
		});
	}

	loadHierarchy() {
		if (!this.enumerationArea) return;

		this.subAdministrativeZoneService
			.findSubAdministrativeZoneById(
				this.enumerationArea.subAdministrativeZoneId
			)
			.subscribe({
				next: (subAdminZone) => {
					this.subAdministrativeZone = subAdminZone;

					if (subAdminZone.administrativeZone) {
						this.administrativeZone = subAdminZone.administrativeZone;

						if (subAdminZone.administrativeZone.dzongkhag) {
							this.dzongkhag = subAdminZone.administrativeZone.dzongkhag;
						}
					}

					this.loading = false;
					setTimeout(() => this.initializeMaps(), 100);
				},
				error: (error) => {
					console.error('Error loading hierarchy:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load location hierarchy',
						life: 3000,
					});
					this.loading = false;
				},
			});
	}

	initializeMaps() {
		// Initialize EA Map
		if (this.enumerationArea?.geom) {
			this.initializeEAMap();
		}

		// Initialize Dzongkhag Map
		if (this.dzongkhag?.geom) {
			this.initializeDzongkhagMap();
		}

		// Initialize Admin Zone Map
		if (this.administrativeZone?.geom) {
			this.initializeAdminZoneMap();
		}

		// Initialize Sub Admin Zone Map
		if (this.subAdministrativeZone?.geom) {
			this.initializeSubAdminZoneMap();
		}
	}

	initializeEAMap() {
		if (!this.enumerationArea?.geom) return;

		try {
			this.eaMap = L.map('eaMap', {
				zoomControl: true,
				scrollWheelZoom: true,
			});

			L.tileLayer(this.tileLayer, {
				maxZoom: 19,
				attribution: '© OpenStreetMap contributors',
			}).addTo(this.eaMap);

			const geoJsonLayer = L.geoJSON(this.enumerationArea.geom, {
				style: {
					color: '#3b82f6',
					weight: 3,
					fillColor: '#3b82f6',
					fillOpacity: 0.3,
				},
			});

			geoJsonLayer.addTo(this.eaMap);
			this.eaMap.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20] });

			// Add popup
			geoJsonLayer.bindPopup(
				`<strong>${this.enumerationArea.name}</strong><br/>
				Code: ${this.enumerationArea.areaCode}<br/>
				Area: ${this.enumerationArea.areaSqKm?.toFixed(2) || 'N/A'} km²`
			);
		} catch (error) {
			console.error('Error initializing EA map:', error);
		}
	}

	initializeDzongkhagMap() {
		if (!this.dzongkhag?.geom || !this.enumerationArea?.geom) return;

		try {
			this.dzongkhagMap = L.map('dzongkhagMap', {
				zoomControl: true,
				scrollWheelZoom: true,
			});

			L.tileLayer(this.tileLayer, {
				maxZoom: 19,
				attribution: '© OpenStreetMap contributors',
			}).addTo(this.dzongkhagMap);

			// Add dzongkhag boundary
			const dzongkhagLayer = L.geoJSON(this.dzongkhag.geom, {
				style: {
					color: '#6b7280',
					weight: 2,
					fillColor: '#e5e7eb',
					fillOpacity: 0.2,
				},
			});
			dzongkhagLayer.addTo(this.dzongkhagMap);

			// Add highlighted EA
			const eaLayer = L.geoJSON(this.enumerationArea.geom, {
				style: {
					color: '#ef4444',
					weight: 3,
					fillColor: '#ef4444',
					fillOpacity: 0.5,
				},
			});
			eaLayer.addTo(this.dzongkhagMap);

			this.dzongkhagMap.fitBounds(dzongkhagLayer.getBounds(), {
				padding: [20, 20],
			});

			// Add popups
			dzongkhagLayer.bindPopup(`<strong>${this.dzongkhag.name}</strong>`);
			eaLayer.bindPopup(
				`<strong>${this.enumerationArea.name}</strong> (This EA)`
			);
		} catch (error) {
			console.error('Error initializing dzongkhag map:', error);
		}
	}

	initializeAdminZoneMap() {
		if (!this.administrativeZone?.geom || !this.enumerationArea?.geom) return;

		try {
			this.adminZoneMap = L.map('adminZoneMap', {
				zoomControl: true,
				scrollWheelZoom: true,
			});

			L.tileLayer(this.tileLayer, {
				maxZoom: 19,
				attribution: '© OpenStreetMap contributors',
			}).addTo(this.adminZoneMap);

			// Add admin zone boundary
			const adminZoneLayer = L.geoJSON(this.administrativeZone.geom, {
				style: {
					color: '#6b7280',
					weight: 2,
					fillColor: '#d1d5db',
					fillOpacity: 0.2,
				},
			});
			adminZoneLayer.addTo(this.adminZoneMap);

			// Add highlighted EA
			const eaLayer = L.geoJSON(this.enumerationArea.geom, {
				style: {
					color: '#f59e0b',
					weight: 3,
					fillColor: '#f59e0b',
					fillOpacity: 0.5,
				},
			});
			eaLayer.addTo(this.adminZoneMap);

			this.adminZoneMap.fitBounds(adminZoneLayer.getBounds(), {
				padding: [20, 20],
			});

			// Add popups
			adminZoneLayer.bindPopup(
				`<strong>${this.administrativeZone.name}</strong>`
			);
			eaLayer.bindPopup(
				`<strong>${this.enumerationArea.name}</strong> (This EA)`
			);
		} catch (error) {
			console.error('Error initializing admin zone map:', error);
		}
	}

	initializeSubAdminZoneMap() {
		if (!this.subAdministrativeZone?.geom || !this.enumerationArea?.geom)
			return;

		try {
			this.subAdminZoneMap = L.map('subAdminZoneMap', {
				zoomControl: true,
				scrollWheelZoom: true,
			});

			L.tileLayer(this.tileLayer, {
				maxZoom: 19,
				attribution: '© OpenStreetMap contributors',
			}).addTo(this.subAdminZoneMap);

			// Add sub-admin zone boundary
			const subAdminZoneLayer = L.geoJSON(this.subAdministrativeZone.geom, {
				style: {
					color: '#6b7280',
					weight: 2,
					fillColor: '#d1d5db',
					fillOpacity: 0.2,
				},
			});
			subAdminZoneLayer.addTo(this.subAdminZoneMap);

			// Add highlighted EA
			const eaLayer = L.geoJSON(this.enumerationArea.geom, {
				style: {
					color: '#10b981',
					weight: 3,
					fillColor: '#10b981',
					fillOpacity: 0.5,
				},
			});
			eaLayer.addTo(this.subAdminZoneMap);

			this.subAdminZoneMap.fitBounds(subAdminZoneLayer.getBounds(), {
				padding: [20, 20],
			});

			// Add popups
			subAdminZoneLayer.bindPopup(
				`<strong>${this.subAdministrativeZone.name}</strong>`
			);
			eaLayer.bindPopup(
				`<strong>${this.enumerationArea.name}</strong> (This EA)`
			);
		} catch (error) {
			console.error('Error initializing sub-admin zone map:', error);
		}
	}

	destroyMaps() {
		if (this.eaMap) {
			this.eaMap.remove();
			this.eaMap = null;
		}
		if (this.dzongkhagMap) {
			this.dzongkhagMap.remove();
			this.dzongkhagMap = null;
		}
		if (this.adminZoneMap) {
			this.adminZoneMap.remove();
			this.adminZoneMap = null;
		}
		if (this.subAdminZoneMap) {
			this.subAdminZoneMap.remove();
			this.subAdminZoneMap = null;
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
}
