import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	ViewChild,
	ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import * as L from 'leaflet';
import { BasemapService } from '../../../../core/utility/basemap.service';
import { KmlParserDataService } from '../../../../core/dataservice/kml-parser/kml-parser.dataservice';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { AdministrativeZone, AdministrativeZoneType } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import {
	AutoKmlUploadRequest,
	AutoKmlUploadResponse,
} from '../../../../core/dataservice/kml-parser/kml-parser.dto';
import { AuthService } from '../../../../core/dataservice/auth/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
	selector: 'app-admin-auto-kml-upload',
	templateUrl: './admin-auto-kml-upload.component.html',
	styleUrls: ['./admin-auto-kml-upload.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminAutoKmlUploadComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	@ViewChild('previewMapContainer', { static: false })
	previewMapContainerRef!: ElementRef;
	
	// Hierarchical selection for auto-upload
	dzongkhags: Dzongkhag[] = [];
	selectedDzongkhag: Dzongkhag | null = null;
	administrativeZones: AdministrativeZone[] = [];
	loadingDzongkhags: boolean = false;
	loadingAdministrativeZones: boolean = false;

	// Preview modal
	previewDialogVisible: boolean = false;
	previewGeojson: any = null;
	previewTitle: string = '';

	// Auto Upload KML
	autoUploadKmlFile: File | null = null;
	autoUploadAdministrativeZoneId: number | null = null;
	autoUploadSazName: string = '';
	autoUploadSazAreaCode: string = '';
	autoUploadSazType: 'chiwog' | 'lap' = 'lap';
	autoUploadLoading: boolean = false;
	autoUploadResult: AutoKmlUploadResponse | null = null;
	autoUploadApiBaseUrl: string = 'http://localhost:3000';
	kmlFields: string[] = [];
	loadingKmlFields: boolean = false;
	
	// LocalStorage key for API URL
	private readonly API_URL_STORAGE_KEY = 'auto_kml_upload_api_base_url';

	// Map properties
	private previewMap?: L.Map;
	private previewGeoJsonLayer?: L.GeoJSON;
	private previewBaseLayer?: L.TileLayer;

	constructor(
		private kmlParserService: KmlParserDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private dzongkhagService: DzongkhagDataService,
		private messageService: MessageService,
		private basemapService: BasemapService,
		private authService: AuthService
	) {}

	ngOnInit(): void {
		// Load API URL from localStorage or use default
		this.loadApiBaseUrlFromStorage();
		this.loadDzongkhags();
	}
	
	/**
	 * Load API Base URL from localStorage
	 */
	private loadApiBaseUrlFromStorage(): void {
		const savedUrl = localStorage.getItem(this.API_URL_STORAGE_KEY);
		if (savedUrl && savedUrl.trim()) {
			this.autoUploadApiBaseUrl = savedUrl.trim();
		} else {
			// No saved URL, use default
			this.autoUploadApiBaseUrl = 'http://localhost:3000';
			this.saveApiBaseUrlToStorage();
		}
	}
	
	/**
	 * Save API Base URL to localStorage
	 */
	private saveApiBaseUrlToStorage(): void {
		localStorage.setItem(this.API_URL_STORAGE_KEY, this.autoUploadApiBaseUrl);
	}
	
	/**
	 * Handle API Base URL change
	 */
	onApiBaseUrlChange(): void {
		this.autoUploadApiBaseUrl = this.autoUploadApiBaseUrl;
		this.saveApiBaseUrlToStorage();
	}

	ngAfterViewInit(): void {
		// Map will be initialized when preview dialog opens
	}

	ngOnDestroy(): void {
		this.destroyPreviewMap();
	}

	loadDzongkhags() {
		this.loadingDzongkhags = true;
		this.dzongkhagService.findAllDzongkhags().subscribe({
			next: (dzongkhags) => {
				this.dzongkhags = dzongkhags;
				this.loadingDzongkhags = false;
			},
			error: (error) => {
				console.error('Error loading dzongkhags:', error);
				this.loadingDzongkhags = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load dzongkhags',
					life: 3000,
				});
			},
		});
	}

	onDzongkhagChange() {
		// Reset administrative zone selection when dzongkhag changes
		this.autoUploadAdministrativeZoneId = null;
		this.administrativeZones = [];
		this.autoUploadSazType = 'lap'; // Reset to default

		if (this.selectedDzongkhag) {
			this.loadAdministrativeZones();
		}
	}

	/**
	 * Handle administrative zone selection change
	 * Automatically sets SAZ type based on administrative zone type:
	 * - Thromde -> lap
	 * - Gewog -> chiwog
	 */
	onAdministrativeZoneChange() {
		if (!this.autoUploadAdministrativeZoneId) {
			this.autoUploadSazType = 'lap'; // Reset to default
			return;
		}

		const selectedZone = this.administrativeZones.find(
			(zone) => zone.id === this.autoUploadAdministrativeZoneId
		);

		if (selectedZone) {
			// Set SAZ type based on administrative zone type
			if (selectedZone.type === AdministrativeZoneType.Thromde) {
				this.autoUploadSazType = 'lap';
			} else if (selectedZone.type === AdministrativeZoneType.Gewog) {
				this.autoUploadSazType = 'chiwog';
			}
		}
	}

	loadAdministrativeZones() {
		if (!this.selectedDzongkhag) {
			this.administrativeZones = [];
			return;
		}

		this.loadingAdministrativeZones = true;
		this.administrativeZoneService
			.findAdministrativeZonesByDzongkhag(this.selectedDzongkhag.id)
			.subscribe({
				next: (zones) => {
					this.administrativeZones = zones;
					this.loadingAdministrativeZones = false;
				},
				error: (error) => {
					console.error('Error loading administrative zones:', error);
					this.loadingAdministrativeZones = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load administrative zones',
						life: 3000,
					});
				},
			});
	}


	closePreviewDialog() {
		this.previewDialogVisible = false;
		this.destroyPreviewMap();
		this.previewGeojson = null;
		this.previewTitle = '';
	}

	// Map methods
	private initializePreviewMap() {
		if (!this.previewMapContainerRef?.nativeElement) {
			console.warn('Preview map container not available, retrying...');
			setTimeout(() => this.initializePreviewMap(), 200);
			return;
		}

		// Destroy existing map if any
		this.destroyPreviewMap();

		const container = this.previewMapContainerRef.nativeElement;

		// Initialize map
		this.previewMap = L.map(container, {
			center: [27.5142, 90.4336], // Center of Bhutan
			zoom: 7,
			zoomControl: true,
			attributionControl: true,
		});

		// Add satellite basemap (using basemap service or default satellite)
		this.previewBaseLayer =
			this.basemapService.createTileLayer('satellite') ||
			L.tileLayer(
				'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
				{
					maxZoom: 19,
					attribution:
						'&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
				}
			);

		if (this.previewBaseLayer) {
			this.previewBaseLayer.addTo(this.previewMap);
		}

		// Invalidate map size to ensure proper rendering in dialog
		setTimeout(() => {
			if (this.previewMap) {
				this.previewMap.invalidateSize();
			}
		}, 100);

		// Render GeoJSON if available
		if (this.previewGeojson) {
			setTimeout(() => {
				this.renderPreviewGeoJSON();
			}, 200);
		}
	}

	private renderPreviewGeoJSON() {
		if (!this.previewMap || !this.previewGeojson) {
			return;
		}

		// Remove existing layer
		if (this.previewGeoJsonLayer) {
			this.previewMap.removeLayer(this.previewGeoJsonLayer);
		}

		try {
			// Create GeoJSON layer
			this.previewGeoJsonLayer = L.geoJSON(this.previewGeojson as any, {
				style: (feature) => {
					return {
						color: '#3b82f6',
						weight: 3,
						opacity: 0.9,
						fillColor: '#3b82f6',
						fillOpacity: 0.4,
					};
				},
				onEachFeature: (feature, layer) => {
					// Add click event to show properties
					layer.on('click', (e) => {
						this.showFeatureProperties(feature, e.latlng);
					});

					// Add hover effects
					layer.on('mouseover', () => {
						(layer as any).setStyle({
							weight: 5,
							fillOpacity: 0.6,
						});
					});

					layer.on('mouseout', () => {
						if (this.previewGeoJsonLayer) {
							this.previewGeoJsonLayer.resetStyle(layer as any);
						}
					});
				},
			});

			// Add to map
			this.previewGeoJsonLayer.addTo(this.previewMap);

			// Fit bounds to GeoJSON
			if (this.previewGeoJsonLayer.getBounds().isValid()) {
				this.previewMap.fitBounds(this.previewGeoJsonLayer.getBounds(), {
					padding: [20, 20],
				});
			}
		} catch (error) {
			console.error('Error rendering GeoJSON:', error);
			this.messageService.add({
				severity: 'error',
				summary: 'Map Error',
				detail: 'Failed to render GeoJSON on map',
				life: 3000,
			});
		}
	}

	private showFeatureProperties(feature: any, latlng: L.LatLng) {
		if (!this.previewMap || !feature.properties) return;

		const props = feature.properties;
		const propertiesHtml = `
			<div class="text-sm space-y-1">
				${props.name ? `<div><strong>Name:</strong> ${props.name}</div>` : ''}
				${props.areaCode ? `<div><strong>Area Code:</strong> ${props.areaCode}</div>` : ''}
				${props.type ? `<div><strong>Type:</strong> ${props.type}</div>` : ''}
				${props.areaSqKm ? `<div><strong>Area:</strong> ${props.areaSqKm} km²</div>` : ''}
				${props.administrativeZoneId ? `<div><strong>Admin Zone ID:</strong> ${props.administrativeZoneId}</div>` : ''}
				${props.description ? `<div><strong>Description:</strong> ${props.description}</div>` : ''}
			</div>
		`;

		L.popup()
			.setLatLng(latlng)
			.setContent(propertiesHtml)
			.openOn(this.previewMap);
	}

	private destroyPreviewMap() {
		if (this.previewMap) {
			this.previewMap.remove();
			this.previewMap = undefined;
		}
		if (this.previewGeoJsonLayer) {
			this.previewGeoJsonLayer = undefined;
		}
		if (this.previewBaseLayer) {
			this.previewBaseLayer = undefined;
		}
	}

	// Auto Upload KML Methods
	onAutoUploadKmlFileSelect(event: any) {
		const files = event.files;
		if (files && files.length > 0) {
			this.autoUploadKmlFile = files[0];
			this.kmlFields = [];
			this.extractKmlFields(files[0]);
		}
	}

	onAutoUploadKmlFileRemove() {
		this.autoUploadKmlFile = null;
		this.autoUploadResult = null;
		this.kmlFields = [];
	}

	/**
	 * Extract field names from KML file
	 * Parses the KML XML and extracts field names from ExtendedData/Data elements
	 */
	private extractKmlFields(file: File): void {
		this.loadingKmlFields = true;
		this.kmlFields = [];

		const reader = new FileReader();
		reader.onload = (e: any) => {
			try {
				const kmlContent = e.target.result;
				const parser = new DOMParser();
				
				// Handle KMZ files (ZIP archives)
				if (file.name.toLowerCase().endsWith('.kmz')) {
					this.messageService.add({
						severity: 'warn',
						summary: 'KMZ File',
						detail: 'KMZ file parsing for fields is not yet supported. Please use a .kml file to view fields.',
						life: 5000,
					});
					this.loadingKmlFields = false;
					return;
				}

				const xmlDoc = parser.parseFromString(kmlContent, 'text/xml');
				
				// Check for parsing errors
				const parserError = xmlDoc.querySelector('parsererror');
				if (parserError) {
					throw new Error('Failed to parse KML file as XML');
				}

				// Extract field names from ExtendedData/Data elements
				const dataElements = xmlDoc.querySelectorAll('ExtendedData Data, ExtendedData SimpleData');
				const fieldSet = new Set<string>();

				dataElements.forEach((dataElement) => {
					const name = dataElement.getAttribute('name');
					if (name && name.trim()) {
						fieldSet.add(name.trim());
					}
				});

				// Also check for SchemaData/SimpleData elements
				const simpleDataElements = xmlDoc.querySelectorAll('SchemaData SimpleData');
				simpleDataElements.forEach((simpleData) => {
					const name = simpleData.getAttribute('name');
					if (name && name.trim()) {
						fieldSet.add(name.trim());
					}
				});

				this.kmlFields = Array.from(fieldSet).sort();
				this.loadingKmlFields = false;

				if (this.kmlFields.length === 0) {
					this.messageService.add({
						severity: 'info',
						summary: 'No Fields Found',
						detail: 'No ExtendedData fields found in the KML file. The file may only contain geometry data.',
						life: 3000,
					});
				}
			} catch (error) {
				console.error('Error extracting KML fields:', error);
				this.loadingKmlFields = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Parse Error',
					detail: 'Failed to parse KML file. Please ensure it is a valid KML file.',
					life: 3000,
				});
			}
		};

		reader.onerror = () => {
			this.loadingKmlFields = false;
			this.messageService.add({
				severity: 'error',
				summary: 'File Read Error',
				detail: 'Failed to read the selected file.',
				life: 3000,
			});
		};

		reader.readAsText(file);
	}

	

	autoUploadKml() {
		if (!this.autoUploadKmlFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No File Selected',
				detail: 'Please select a KML file to upload',
				life: 3000,
			});
			return;
		}

		if (!this.autoUploadAdministrativeZoneId) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Administrative Zone Required',
				detail: 'Please select an administrative zone',
				life: 3000,
			});
			return;
		}

		if (!this.autoUploadSazName.trim()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'SAZ Name Required',
				detail: 'Please enter a name for the Sub-Administrative Zone',
				life: 3000,
			});
			return;
		}

		if (!this.autoUploadSazAreaCode.trim()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'SAZ Area Code Required',
				detail: 'Please enter an area code for the Sub-Administrative Zone',
				life: 3000,
			});
			return;
		}

		const token = this.authService.getToken();
		if (!token) {
			this.messageService.add({
				severity: 'error',
				summary: 'Authentication Error',
				detail: 'Please log in to continue',
				life: 3000,
			});
			return;
		}

		this.autoUploadLoading = true;
		this.autoUploadResult = null;

		const request: AutoKmlUploadRequest = {
			kmlFile: this.autoUploadKmlFile,
			administrativeZoneId: this.autoUploadAdministrativeZoneId,
			sazName: this.autoUploadSazName.trim(),
			sazAreaCode: this.autoUploadSazAreaCode.trim(),
			sazType: this.autoUploadSazType,
			apiBaseUrl: this.autoUploadApiBaseUrl.trim(),
			token: token,
		};

		console.log("Auto Upload Request:", request);
		this.kmlParserService.autoUploadKml(request).subscribe({
			next: (response) => {
				this.autoUploadLoading = false;
				this.autoUploadResult = response;
				this.messageService.add({
					severity: 'success',
					summary: 'Auto Upload Successful',
					detail: response.message,
					life: 5000,
				});
			},
			error: (error) => {
				this.autoUploadLoading = false;
				console.error('Error auto uploading KML:', error);
				
				// Check for URL validation errors from backend
				const errorMessage = error.error?.detail || error.error?.message || 'Failed to process KML file';
				const isUrlValidationError = 
					errorMessage.toLowerCase().includes('apiBaseUrl'.toLowerCase()) ||
					errorMessage.toLowerCase().includes('url') ||
					errorMessage.toLowerCase().includes('invalid');
				
				this.messageService.add({
					severity: 'error',
					summary: 'Auto Upload Failed',
					detail: isUrlValidationError 
						? `API URL validation error: ${errorMessage}. Please check your API base URL configuration.`
						: errorMessage,
					life: 5000,
				});
			},
		});
	}

	resetAutoUpload() {
		this.autoUploadKmlFile = null;
		this.autoUploadAdministrativeZoneId = null;
		this.autoUploadSazName = '';
		this.autoUploadSazAreaCode = '';
		this.autoUploadSazType = 'chiwog';
		this.autoUploadResult = null;
		this.kmlFields = [];
	}

	/**
	 * Get display name for Administrative Zone (name with type)
	 * @param zone - Administrative Zone object
	 * @returns Formatted name with type (e.g., "Bumthang Thromde" or "Bumthang Gewog")
	 */
	getAdministrativeZoneDisplayName(zone: AdministrativeZone | null | undefined): string {
		if (!zone || !zone.name) {
			return '';
		}

		const name = zone.name.trim();
		const type = zone.type || AdministrativeZoneType.Gewog;

		// Check if name already includes the type
		const nameLower = name.toLowerCase();
		const typeLower = type.toLowerCase();

		if (nameLower.endsWith(' ' + typeLower) || nameLower.endsWith(typeLower)) {
			// Name already includes type, return as is
			return name;
		}

		// Append type to name
		return `${name} ${type}`;
	}

	/**
	 * Get display name for the selected Administrative Zone
	 * @returns Formatted name with type for the selected zone
	 */
	getSelectedAdministrativeZoneDisplayName(): string {
		if (!this.autoUploadAdministrativeZoneId) {
			return '';
		}
		const selectedZone = this.administrativeZones.find(
			(zone) => zone.id === this.autoUploadAdministrativeZoneId
		);
		return this.getAdministrativeZoneDisplayName(selectedZone);
	}

	/**
	 * Check if SAZ type dropdown should be disabled
	 * It should be disabled when an administrative zone is selected
	 * @returns true if SAZ type should be disabled
	 */
	isSazTypeDisabled(): boolean {
		return !!this.autoUploadAdministrativeZoneId;
	}

	// Utility Methods
	formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	// Expose environment for template
	get environment() {
		return environment;
	}
}

