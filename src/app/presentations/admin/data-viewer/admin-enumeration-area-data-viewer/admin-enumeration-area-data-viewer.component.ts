import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PrimeNgModules } from '../../../../primeng.modules';
import * as L from 'leaflet';
import { forkJoin } from 'rxjs';

import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { BuildingDataService } from '../../../../core/dataservice/buildings/buildings.dataservice';
import { EnumerationArea } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { SubAdministrativeZone } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { AdministrativeZone } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import {
	Building,
	BuildingGeoJsonFeatureCollection,
	BuildingStatistics,
} from '../../../../core/dataservice/buildings/buildings.dto';

// Import child components
import { CurrentHouseholdListingComponent } from './current-household-listing/current-household-listing.component';
import { HistoryComponent } from './history/history.component';

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
		HistoryComponent,
	],
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
	buildings: Building[] = [];
	buildingStatistics: BuildingStatistics | null = null;

	// GeoJSON Data
	eaGeoJsonData: any = null;
	subAdminGeoJsonData: any = null;
	buildingsGeoJsonData: BuildingGeoJsonFeatureCollection | null = null;

	// Maps
	enumerationAreaMap: L.Map | null = null;
	satelliteLayer: L.TileLayer | null = null;
	openStreetMapLayer: L.TileLayer | null = null;
	buildingsLayer: L.GeoJSON | null = null;

	// State
	loading = true;
	mapInitialized = false;
	showSatelliteLayer = false;
	showBuildingsLayer = true;
	eaId: number = 0;

	// Tile layers
	private readonly tileLayer =
		'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	private readonly satelliteTileLayer =
		'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private enumerationAreaService: EnumerationAreaDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private dzongkhagService: DzongkhagDataService,
		private buildingService: BuildingDataService,
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
					// Load GeoJSON data for map initialization
					this.loadGeoJsonData();
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

	loadGeoJsonData() {
		if (!this.enumerationArea || !this.subAdministrativeZone) return;

		// Load EA, sub-admin zone, and buildings GeoJSON data
		const eaGeoJson$ = this.enumerationAreaService.findOneAsGeoJson(this.eaId);
		const subAdminGeoJson$ = this.subAdministrativeZoneService.findOneAsGeoJson(
			this.subAdministrativeZone.id
		);
		const buildingsGeoJson$ =
			this.buildingService.findAsGeoJsonByEnumerationArea(this.eaId);
		const buildingsData$ = this.buildingService.findByEnumerationArea(
			this.eaId
		);

		// Load all data in parallel
		forkJoin({
			eaGeoJson: eaGeoJson$,
			subAdminGeoJson: subAdminGeoJson$,
			buildingsGeoJson: buildingsGeoJson$,
			buildingsData: buildingsData$,
		}).subscribe({
			next: ({
				eaGeoJson,
				subAdminGeoJson,
				buildingsGeoJson,
				buildingsData,
			}) => {
				// Store GeoJSON data
				this.eaGeoJsonData = eaGeoJson;
				this.subAdminGeoJsonData = subAdminGeoJson;
				this.buildingsGeoJsonData = buildingsGeoJson;
				this.buildings = buildingsData;

				// Calculate building statistics
				this.buildingStatistics =
					this.buildingService.calculateStatistics(buildingsData);

				// Initialize map with GeoJSON data
				setTimeout(() => this.initializeMaps(), 100);
			},
			error: (error) => {
				console.error('Error loading GeoJSON data:', error);
				// Fallback to original geometry if GeoJSON fails
				setTimeout(() => this.initializeMaps(), 100);
			},
		});
	}

	initializeMaps() {
		// Initialize map - will handle geometry checking internally
		this.initializeEnumerationAreaMap();
	}

	initializeEnumerationAreaMap() {
		if (!this.enumerationArea) return;

		try {
			this.enumerationAreaMap = L.map('enumerationAreaMap', {
				zoomControl: true,
				scrollWheelZoom: true,
			});

			// Initialize both tile layers
			this.openStreetMapLayer = L.tileLayer(this.tileLayer, {
				maxZoom: 19,
				attribution: '© OpenStreetMap contributors',
			});

			this.satelliteLayer = L.tileLayer(this.satelliteTileLayer, {
				maxZoom: 19,
				attribution: '© Google',
			});

			// Add default layer (OpenStreetMap)
			this.openStreetMapLayer.addTo(this.enumerationAreaMap);

			let hasValidGeometry = false;

			// Add sub-administrative zone boundary (if available)
			if (this.subAdminGeoJsonData && this.subAdminGeoJsonData.geometry) {
				const subAdminZoneLayer = L.geoJSON(this.subAdminGeoJsonData, {
					style: {
						color: '#dc2626',
						weight: 2,
						fillColor: 'transparent',
						fillOpacity: 0,
					},
				});
				subAdminZoneLayer.addTo(this.enumerationAreaMap);

				subAdminZoneLayer.bindPopup(
					`<strong>Sub-Administrative Zone</strong><br/>${
						this.subAdministrativeZone?.name || 'N/A'
					}`
				);
				hasValidGeometry = true;
			} else if (this.subAdministrativeZone?.geom) {
				// Fallback to embedded geometry
				const subAdminZoneLayer = L.geoJSON(this.subAdministrativeZone.geom, {
					style: {
						color: '#dc2626',
						weight: 2,
						fillColor: 'transparent',
						fillOpacity: 0,
					},
				});
				subAdminZoneLayer.addTo(this.enumerationAreaMap);

				subAdminZoneLayer.bindPopup(
					`<strong>Sub-Administrative Zone</strong><br/>${this.subAdministrativeZone.name}`
				);
				hasValidGeometry = true;
			}

			// Add enumeration area boundary (primary layer)
			let eaLayer: L.GeoJSON | null = null;
			if (this.eaGeoJsonData && this.eaGeoJsonData.geometry) {
				eaLayer = L.geoJSON(this.eaGeoJsonData, {
					style: {
						color: '#1d4ed8',
						weight: 2,
						fillColor: '#1d4ed8',
						fillOpacity: 0.3,
					},
				});
				hasValidGeometry = true;
			} else if (this.enumerationArea.geom) {
				// Fallback to embedded geometry
				eaLayer = L.geoJSON(this.enumerationArea.geom, {
					style: {
						color: '#1d4ed8',
						weight: 2,
						fillColor: '#1d4ed8',
						fillOpacity: 0.3,
					},
				});
				hasValidGeometry = true;
			}

			if (eaLayer) {
				eaLayer.addTo(this.enumerationAreaMap);
				this.enumerationAreaMap.fitBounds(eaLayer.getBounds(), {
					padding: [20, 20],
				});

				// Add popup for enumeration area
				eaLayer.bindPopup(
					`<strong>${this.enumerationArea.name}</strong><br/>
					Code: ${this.enumerationArea.areaCode || 'N/A'}<br/>
					Area: ${
						this.enumerationArea.areaSqKm
							? Number(this.enumerationArea.areaSqKm).toFixed(2)
							: 'N/A'
					} km²`
				);
			}

			// Add buildings layer
			this.addBuildingsLayer();

			// If no valid geometry found, show default view
			if (!hasValidGeometry) {
				console.warn('No valid geometry found for map display');
				this.enumerationAreaMap.setView([27.5142, 90.4336], 8); // Default to Bhutan center
			}

			this.mapInitialized = true;
		} catch (error) {
			console.error('Error initializing enumeration area map:', error);
			this.messageService.add({
				severity: 'error',
				summary: 'Map Error',
				detail: 'Failed to initialize map',
				life: 3000,
			});
		}
	}

	addBuildingsLayer() {
		if (!this.enumerationAreaMap || !this.buildingsGeoJsonData) return;

		try {
			this.buildingsLayer = L.geoJSON(this.buildingsGeoJsonData, {
				style: {
					color: '#f59e0b',
					weight: 2,
					fillColor: '#f59e0b',
					fillOpacity: 0.7,
				},
				onEachFeature: (feature, layer) => {
					if (feature.properties) {
						const props = feature.properties;
						layer.bindPopup(
							`<strong>Building ${props.id || 'N/A'}</strong><br/>
							EA ID: ${props.enumerationAreaId || 'N/A'}<br/>
							Type: ${props.buildingType || 'N/A'}<br/>
							Status: ${props.status || 'N/A'}`
						);
					}
				},
			});

			if (this.showBuildingsLayer) {
				this.buildingsLayer.addTo(this.enumerationAreaMap);
			}
		} catch (error) {
			console.error('Error adding buildings layer:', error);
		}
	}

	toggleBuildingsLayer() {
		if (!this.enumerationAreaMap || !this.buildingsLayer) return;

		if (this.showBuildingsLayer) {
			this.buildingsLayer.addTo(this.enumerationAreaMap);
		} else {
			this.enumerationAreaMap.removeLayer(this.buildingsLayer);
		}
	}

	toggleSatelliteLayer() {
		if (
			!this.enumerationAreaMap ||
			!this.openStreetMapLayer ||
			!this.satelliteLayer
		) {
			return;
		}

		if (this.showSatelliteLayer) {
			// Switch to satellite layer
			this.enumerationAreaMap.removeLayer(this.openStreetMapLayer);
			this.enumerationAreaMap.addLayer(this.satelliteLayer);
		} else {
			// Switch to OpenStreetMap layer
			this.enumerationAreaMap.removeLayer(this.satelliteLayer);
			this.enumerationAreaMap.addLayer(this.openStreetMapLayer);
		}
	}

	destroyMaps() {
		if (this.enumerationAreaMap) {
			this.enumerationAreaMap.remove();
			this.enumerationAreaMap = null;
		}
		if (this.openStreetMapLayer) {
			this.openStreetMapLayer = null;
		}
		if (this.satelliteLayer) {
			this.satelliteLayer = null;
		}
		if (this.buildingsLayer) {
			this.buildingsLayer = null;
		}
		this.mapInitialized = false;
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
