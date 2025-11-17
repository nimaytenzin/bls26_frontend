import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PrimeNgModules } from '../../../../primeng.modules';
import { Table } from 'primeng/table';
import * as L from 'leaflet';

import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { BasemapService } from '../../../../core/utility/basemap.service';
import { MapFeatureColorService } from '../../../../core/utility/map-feature-color.service';

import {
	SubAdministrativeZone,
	SubAdministrativeZoneGeoJSON,
} from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import {
	EnumerationArea,
	EnumerationAreaGeoJSON,
	BulkUploadResponse,
} from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { AdministrativeZone } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';

// Import the new components
import { AddEnumerationAreaComponent } from '../../master-data/admin-master-enumeration-areas/add-enumeration-area/add-enumeration-area.component';
import { BulkUploadEaComponent } from '../../master-data/admin-master-enumeration-areas/bulk-upload-ea/bulk-upload-ea.component';
import { EditEnumerationAreaComponent } from '../../master-data/admin-master-enumeration-areas/edit-enumeration-area/edit-enumeration-area.component';
import { UploadGeojsonEaComponent } from '../../master-data/admin-master-enumeration-areas/upload-geojson-ea/upload-geojson-ea.component';
import { GenerateFullEACode } from '../../../../core/utility/utility.service';

/**
 * Sub Administrative Zone Data Viewer Component
 *
 * This component provides a comprehensive view of a sub-administrative zone with:
 * - Left panel: Sub-administrative zone details and statistics
 * - Below left panel: Table of enumeration areas within the sub-administrative zone
 * - Right panel: Interactive map showing the sub-administrative zone boundary and enumeration areas
 *
 * Features:
 * - Hierarchical breadcrumb navigation (Dzongkhag > Administrative Zone > Sub Administrative Zone)
 * - Interactive map with sub-administrative zone boundary and enumeration areas
 * - Searchable and sortable table of enumeration areas
 * - Click-to-select enumeration areas with map highlighting
 * - Navigation to parent zones and child enumeration area details
 * - Responsive design with proper mobile support
 * - Statistics display (total areas, total area coverage)
 *
 * Route: /admin/data-view/sub-admzone/:id
 */
@Component({
	selector: 'app-admin-sub-adminstrative-zone-data-viewer',
	templateUrl: './admin-sub-adminstrative-zone-data-viewer.component.html',
	styleUrls: ['./admin-sub-adminstrative-zone-data-viewer.component.css'],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		RouterModule,
		PrimeNgModules,
		AddEnumerationAreaComponent,
		BulkUploadEaComponent,
		EditEnumerationAreaComponent,
		UploadGeojsonEaComponent,
	],
	providers: [MessageService],
})
export class AdminSubAdminstrativeZoneDataViewerComponent
	implements OnInit, OnDestroy
{
	@ViewChild('dt') dt!: Table;

	// Route parameter
	subAdminZoneId: number = 0;

	// Data
	subAdministrativeZone: SubAdministrativeZone | null = null;
	administrativeZone: AdministrativeZone | null = null;
	dzongkhag: Dzongkhag | null = null;
	enumerationAreas: EnumerationArea[] = [];
	selectedEnumerationArea: EnumerationArea | null = null;

	// Map
	private map: L.Map | null = null;
	private subAdminZoneLayer: L.GeoJSON | null = null;
	private enumerationAreasLayer: L.GeoJSON | null = null;
	private currentBasemapLayer: L.TileLayer | null = null;

	// Basemap
	basemapCategories: Record<string, { label: string; basemaps: any[] }>;
	selectedBasemapId: string = 'positron'; // Default basemap (Positron - No Labels)

	// State
	loading = true;
	loadingEAs = false;
	globalFilterValue = '';
	activeMainTab: 'details' | 'eas' | 'actions' = 'details';

	// Dialog states for new components
	addEADialogVisible = false;
	bulkUploadDialogVisible = false;
	editEADialogVisible = false;
	uploadGeojsonDialogVisible = false;
	selectedEAForEdit: EnumerationArea | null = null;
	selectedEAForUpload: EnumerationArea | null = null;

	// Filter/Navigation properties
	dzongkhagOptions: any[] = [];
	adminZoneOptions: any[] = [];
	subAdminZoneOptions: any[] = [];
	eaOptions: any[] = [];
	selectedDzongkhag: number | null = null;
	selectedAdminZone: number | null = null;
	selectedSubAdminZone: number | null = null;
	selectedEAFilter: number | null = null;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private enumerationAreaService: EnumerationAreaDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private dzongkhagService: DzongkhagDataService,
		private messageService: MessageService,
		private basemapService: BasemapService,
		private mapFeatureColorService: MapFeatureColorService
	) {
		this.basemapCategories = this.basemapService.getBasemapCategories();
	}

	ngOnInit() {
		// Load all dzongkhags for filter dropdown
		this.loadDzongkhags();

		this.route.params.subscribe((params) => {
			this.subAdminZoneId = +params['id'];
			if (this.subAdminZoneId) {
				this.loadData();
			}
		});

		// Create global function for map popup navigation
		(window as any).navigateToEADetails = (id: number) => {
			this.viewEnumerationAreaDetails({ id } as EnumerationArea);
		};

		// Add window resize listener for map
		window.addEventListener('resize', this.onWindowResize.bind(this));
	}

	switchBasemap() {
		if (!this.map) return;

		// Remove current basemap layer
		if (this.currentBasemapLayer) {
			this.map.removeLayer(this.currentBasemapLayer);
		}

		// Add new basemap layer
		this.currentBasemapLayer = this.basemapService.createTileLayer(
			this.selectedBasemapId
		);
		if (this.currentBasemapLayer) {
			this.currentBasemapLayer.addTo(this.map);
		}
	}

	ngOnDestroy() {
		this.destroyMap();
		// Clean up global function
		delete (window as any).navigateToEADetails;
		// Remove resize listener if added
		window.removeEventListener('resize', this.onWindowResize.bind(this));
	}

	onWindowResize() {
		if (this.map) {
			setTimeout(() => {
				this.map?.invalidateSize();
			}, 100);
		}
	}

	loadData() {
		this.loading = true;

		this.subAdministrativeZoneService
			.findSubAdministrativeZoneById(this.subAdminZoneId)
			.subscribe({
				next: (subAdminZone) => {
					this.subAdministrativeZone = subAdminZone;
					this.loadHierarchy();
					this.loadEnumerationAreas();
				},
				error: (error) => {
					console.error('Error loading sub-administrative zone:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load sub-administrative zone details',
						life: 3000,
					});
					this.loading = false;
				},
			});
	}

	loadHierarchy() {
		if (!this.subAdministrativeZone) return;

		if (this.subAdministrativeZone.administrativeZone) {
			this.administrativeZone = this.subAdministrativeZone.administrativeZone;

			if (this.subAdministrativeZone.administrativeZone.dzongkhag) {
				this.dzongkhag =
					this.subAdministrativeZone.administrativeZone.dzongkhag;
			}
		}

		this.loading = false;
	}

	loadEnumerationAreas() {
		this.loadingEAs = true;

		this.enumerationAreaService
			.findEnumerationAreasBySubAdministrativeZone(this.subAdminZoneId)
			.subscribe({
				next: (areas) => {
					this.enumerationAreas = areas;
					this.loadingEAs = false;
					// Initialize map after data is loaded with longer timeout for layout
					setTimeout(() => this.initializeMap(), 300);
				},
				error: (error) => {
					console.error('Error loading enumeration areas:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumeration areas',
						life: 3000,
					});
					this.loadingEAs = false;
				},
			});
	}

	initializeMap() {
		const container = document.getElementById('subAdminZoneMap');
		if (!container) {
			console.warn('Map container not found. Skipping map initialization.');
			return;
		}

		if (this.map) {
			this.map.remove();
		}

		this.map = L.map('subAdminZoneMap', {
			center: [27.5142, 90.4336],
			zoom: 10,
			zoomControl: false,
			attributionControl: false,
		});

		// Initialize basemap layer
		this.currentBasemapLayer = this.basemapService.createTileLayer(
			this.selectedBasemapId
		);
		if (this.currentBasemapLayer && this.map) {
			this.currentBasemapLayer.addTo(this.map);
		}

		// Load and render sub-administrative zone boundary
		if (this.subAdministrativeZone?.geom) {
			this.renderSubAdminZone();
		}

		// Load and render enumeration areas
		this.loadAndRenderEnumerationAreas();
	}

	renderSubAdminZone() {
		if (!this.map || !this.subAdministrativeZone?.geom) return;

		if (this.subAdminZoneLayer) {
			this.map.removeLayer(this.subAdminZoneLayer);
		}

		const subAdminColor =
			this.mapFeatureColorService.getSingleFeatureColor('highlight');

		this.subAdminZoneLayer = L.geoJSON(this.subAdministrativeZone.geom, {
			style: {
				color: subAdminColor,
				weight: 4,
				fillColor: subAdminColor,
				fillOpacity: 0.1,
			},
		});

		this.subAdminZoneLayer.addTo(this.map);

		// Add permanent label for Sub-Admin Zone
		const bounds = this.subAdminZoneLayer.getBounds();
		const center = bounds.getCenter();

		const labelContent = `
			<div style="
				color: ${subAdminColor};
				font-weight: 600;
				font-size: 9px;
				text-shadow: 
					-1.5px -1.5px 0 #fff,
					1.5px -1.5px 0 #fff,
					-1.5px 1.5px 0 #fff,
					1.5px 1.5px 0 #fff;
				text-align: center;
				white-space: nowrap;
			">
				${this.subAdministrativeZone.name}
			</div>
		`;

		const label = L.tooltip({
			permanent: true,
			direction: 'center',
			className: 'saz-label',
			opacity: 1,
		})
			.setLatLng(center)
			.setContent(labelContent);

		this.subAdminZoneLayer.bindTooltip(label);

		// Bind popup
		this.subAdminZoneLayer.bindPopup(
			`<div style="font-weight: 600; font-size: 14px;">${this.subAdministrativeZone.name}</div>
			<div style="font-size: 12px; color: #666;">Sub-Administrative Zone</div>`
		);

		// Fit map to sub-admin zone bounds
		this.map.fitBounds(this.subAdminZoneLayer.getBounds(), {
			padding: [20, 20],
		});
	}

	loadAndRenderEnumerationAreas() {
		this.enumerationAreaService
			.getEnumerationAreaGeojsonBySubAdministrativeZone(this.subAdminZoneId)
			.subscribe({
				next: (geoJson) => {
					this.renderEnumerationAreas(geoJson);
				},
				error: (error) => {
					console.error('Error loading enumeration areas GeoJSON:', error);
				},
			});
	}

	renderEnumerationAreas(geoJson: EnumerationAreaGeoJSON) {
		if (!this.map) return;

		if (this.enumerationAreasLayer) {
			this.map.removeLayer(this.enumerationAreasLayer);
		}

		this.enumerationAreasLayer = L.geoJSON(geoJson, {
			style: (feature) => ({
				fillColor: this.mapFeatureColorService.getSingleFeatureColor('primary'),
				fillOpacity: 0,
				color: this.mapFeatureColorService.getSingleFeatureColor('primary'),
				weight: 1,
				opacity: 1,
			}),
			onEachFeature: (feature, layer) => {
				const props = feature.properties;

				const popupContent = `
				<div style="padding: 4px;">
					<div style="font-weight: 700; font-size: 16px; margin-bottom: 8px; color: #111827;">${
						props.name
					}</div>
					<div style="display: grid; gap: 4px; font-size: 13px; margin-bottom: 12px;">
						<div><span style="font-weight: 600; color: #6b7280;">Code:</span> <span style="color: #374151;">${
							props.areaCode || 'N/A'
						}</span></div>
						<div><span style="font-weight: 600; color: #6b7280;">Description:</span> <span style="color: #374151;">${
							props.description || 'N/A'
						}</span></div>
						
					</div>
					<button 
						onclick="window.navigateToEADetails(${props.id})"
						style="
							width: 100%;
							padding: 6px 12px;
							background-color: #3b82f6;
							color: white;
							border: none;
							border-radius: 6px;
							font-size: 13px;
							font-weight: 600;
							cursor: pointer;
							display: flex;
							align-items: center;
							justify-content: center;
							gap: 6px;
							transition: background-color 0.2s;
						"
						onmouseover="this.style.backgroundColor='#2563eb'"
						onmouseout="this.style.backgroundColor='#3b82f6'"
					>
						<i class="pi pi-eye" style="font-size: 12px;"></i>
						View Details
					</button>
				</div>
				`;

				layer.bindPopup(popupContent);

				// Add permanent label with full EA code
				const bounds = (layer as any).getBounds();
				const center = bounds.getCenter();

				// Find the matching EA to get full code
				const matchingEA = this.enumerationAreas.find(
					(ea) => ea.id === props.id
				);
				const fullEACode = matchingEA
					? GenerateFullEACode(matchingEA)
					: props.areaCode;

				const labelContent = `
					<div style="
						color: black;
						font-weight: 700;
						font-size: 10px;
						text-shadow: 
							-2px -2px 0 #fff,
							2px -2px 0 #fff,
							-2px 2px 0 #fff,
							2px 2px 0 #fff;
						text-align: center;
						white-space: nowrap;
					">
						${props.name} 
					</div>
				`;

				const label = L.tooltip({
					permanent: true,
					direction: 'center',
					className: 'ea-label',
					opacity: 1,
				})
					.setLatLng(center)
					.setContent(labelContent);

				layer.bindTooltip(label);

				layer.on('click', () => {
					this.selectEnumerationAreaFromMap(props);
				});

				layer.on('mouseover', () => {
					(layer as any).setStyle({
						fillOpacity: 0.7,
						weight: 3,
					});
				});

				layer.on('mouseout', () => {
					if (this.enumerationAreasLayer) {
						this.enumerationAreasLayer.resetStyle(layer as any);
					}
				});
			},
		});

		this.enumerationAreasLayer.addTo(this.map);
	}

	selectEnumerationAreaFromMap(properties: any) {
		const area = this.enumerationAreas.find(
			(a) => a.id === properties.id || a.areaCode === properties.areaCode
		);
		if (area) {
			this.selectedEnumerationArea = area;
		}
	}

	onRowSelect(event: any) {
		if (event.data) {
			this.selectEnumerationArea(event.data as EnumerationArea);
		}
	}

	selectEnumerationArea(area: EnumerationArea) {
		this.selectedEnumerationArea = area;

		// Highlight the area on the map
		if (this.map && this.enumerationAreasLayer) {
			this.enumerationAreasLayer.eachLayer((layer: any) => {
				if (layer.feature?.properties?.id === area.id) {
					layer.setStyle({
						fillColor: '#ef4444',
						fillOpacity: 0.6,
						color: '#dc2626',
						weight: 3,
					});
				} else {
					// Reset other layers
					this.enumerationAreasLayer?.resetStyle(layer);
				}
			});
		}
	}

	onGlobalFilter(event: Event) {
		const target = event.target as HTMLInputElement;
		this.globalFilterValue = target.value;
		if (this.dt) {
			this.dt.filterGlobal(target.value, 'contains');
		}
	}

	clear(table: any) {
		table.clear();
		this.globalFilterValue = '';
	}

	destroyMap() {
		if (this.map) {
			this.map.remove();
			this.map = null;
		}
		if (this.currentBasemapLayer) {
			this.currentBasemapLayer = null;
		}
	}

	navigateTo(type: 'dzongkhag' | 'adminzone', id: number) {
		switch (type) {
			case 'dzongkhag':
				this.router.navigate(['/admin/data-view/dzongkhag', id]);
				break;
			case 'adminzone':
				this.router.navigate(['/admin/data-view/admzone', id]);
				break;
		}
	}

	viewEnumerationAreaDetails(area: EnumerationArea) {
		this.router.navigate(['/admin/data-view/eazone', area.id]);
	}

	goBack() {
		this.router.navigate(['/admin/master/sub-administrative-zones']);
	}

	navigateToSubAdminZoneManagement() {
		this.router.navigate(['/admin/master/sub-administrative-zones']);
	}

	navigateToEnumerationAreaManagement() {
		this.router.navigate(['/admin/master/enumeration-areas']);
	}

	// Computed properties
	get subAdminZoneTypeBadgeClass(): string {
		if (!this.subAdministrativeZone) return '';
		return this.subAdministrativeZone.type === 'chiwog' ? 'success' : 'info';
	}

	get subAdminZoneTypeLabel(): string {
		if (!this.subAdministrativeZone) return '';
		return this.subAdministrativeZone.type === 'chiwog' ? 'Chiwog' : 'Lap';
	}

	get totalEnumerationAreas(): number {
		return this.enumerationAreas.length;
	}

	get totalArea(): number {
		return this.enumerationAreas.reduce(
			(sum, ea) => sum + (ea.areaSqKm || 0),
			0
		);
	}

	// Dialog management methods for new components
	openAddEADialog() {
		this.addEADialogVisible = true;
	}

	closeAddEADialog() {
		this.addEADialogVisible = false;
	}

	onAddEASuccess(result: any) {
		this.messageService.add({
			severity: 'success',
			summary: 'Success',
			detail: 'Enumeration area added successfully',
			life: 3000,
		});

		// Reload enumeration areas to show the new one
		this.loadEnumerationAreas();
		this.closeAddEADialog();
	}

	openBulkUploadDialog() {
		this.bulkUploadDialogVisible = true;
	}

	closeBulkUploadDialog() {
		this.bulkUploadDialogVisible = false;
	}

	onBulkUploadSuccess(result: BulkUploadResponse) {
		const successCount = result.success;
		if (successCount > 0) {
			this.messageService.add({
				severity: 'success',
				summary: 'Bulk Upload Complete',
				detail: `Successfully created ${successCount} enumeration area(s)`,
				life: 5000,
			});
		}

		// Reload enumeration areas to show the new ones
		this.loadEnumerationAreas();

		// Reload map data if successful uploads
		if (successCount > 0) {
			setTimeout(() => this.loadAndRenderEnumerationAreas(), 500);
		}

		this.closeBulkUploadDialog();
	}

	// Edit EA Dialog Methods
	openEditEADialog(area: EnumerationArea) {
		this.selectedEAForEdit = area;
		this.editEADialogVisible = true;
	}

	closeEditEADialog() {
		this.editEADialogVisible = false;
		this.selectedEAForEdit = null;
	}

	onEditEASuccess(result: any) {
		this.messageService.add({
			severity: 'success',
			summary: 'Success',
			detail: 'Enumeration area updated successfully',
			life: 3000,
		});

		// Reload enumeration areas to show the updated data
		this.loadEnumerationAreas();
		this.closeEditEADialog();
	}

	// Upload GeoJSON Dialog Methods
	openUploadGeojsonDialog(area: EnumerationArea) {
		this.selectedEAForUpload = area;
		this.uploadGeojsonDialogVisible = true;
	}

	closeUploadGeojsonDialog() {
		this.uploadGeojsonDialogVisible = false;
		this.selectedEAForUpload = null;
	}

	onUploadGeojsonSuccess(result: any) {
		this.messageService.add({
			severity: 'success',
			summary: 'Success',
			detail: 'GeoJSON uploaded successfully',
			life: 3000,
		});

		// Reload enumeration areas to show updated geometry status
		this.loadEnumerationAreas();

		// Reload map data to show new geometry
		setTimeout(() => this.loadAndRenderEnumerationAreas(), 500);

		this.closeUploadGeojsonDialog();
	}

	// Download Methods
	downloadGeoJSON() {
		if (!this.subAdministrativeZone) return;

		this.enumerationAreaService
			.getEnumerationAreaGeojsonBySubAdministrativeZone(this.subAdminZoneId)
			.subscribe({
				next: (geoJson) => {
					const dataStr = JSON.stringify(geoJson, null, 2);
					const dataBlob = new Blob([dataStr], { type: 'application/json' });
					const url = window.URL.createObjectURL(dataBlob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `${
						this.subAdministrativeZone!.name
					}_enumeration_areas.geojson`;
					link.click();
					window.URL.revokeObjectURL(url);

					this.messageService.add({
						severity: 'success',
						summary: 'Download Complete',
						detail: 'GeoJSON file downloaded successfully',
						life: 3000,
					});
				},
				error: (error) => {
					console.error('Error downloading GeoJSON:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Download Failed',
						detail: 'Failed to download GeoJSON file',
						life: 3000,
					});
				},
			});
	}

	downloadKML() {
		this.messageService.add({
			severity: 'info',
			summary: 'Coming Soon',
			detail: 'KML download functionality will be available soon',
			life: 3000,
		});
	}

	downloadCSV() {
		if (!this.enumerationAreas || this.enumerationAreas.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Data',
				detail: 'No enumeration areas to export',
				life: 3000,
			});
			return;
		}

		// Create CSV header
		const headers = ['Name', 'Area Code', 'Description', 'Area (sq km)'];
		const csvRows = [headers.join(',')];

		// Add data rows
		this.enumerationAreas.forEach((ea) => {
			const row = [
				`"${ea.name || ''}"`,
				`"${ea.areaCode || ''}"`,
				`"${ea.description || ''}"`,
				ea.areaSqKm || '',
			];
			csvRows.push(row.join(','));
		});

		// Create and download file
		const csvContent = csvRows.join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${this.subAdministrativeZone!.name}_enumeration_areas.csv`;
		link.click();
		window.URL.revokeObjectURL(url);

		this.messageService.add({
			severity: 'success',
			summary: 'Download Complete',
			detail: 'CSV file downloaded successfully',
			life: 3000,
		});
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
					next: (subZones: SubAdministrativeZone[]) => {
						this.subAdminZoneOptions = subZones.map(
							(sz: SubAdministrativeZone) => ({
								label: sz.name,
								value: sz.id,
							})
						);
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
			this.router.navigate(['/admin/data-view/eazone', this.selectedEAFilter]);
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
}
