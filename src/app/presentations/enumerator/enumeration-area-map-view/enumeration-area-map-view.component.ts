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
import { ActivatedRoute, Router } from '@angular/router';
import { EnumerationAreaDataService } from '../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { EnumeratorDataService } from '../../../core/dataservice/enumerator-service/enumerator.dataservice';
import { SurveyEnumerationAreaStructureDataService } from '../../../core/dataservice/survey-enumeration-area-structure/survey-enumeration-area-structure.dataservice';
import { SurveyEnumerationAreaDataService } from '../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dataservice';
import { AuthService } from '../../../core/dataservice/auth/auth.service';
import { PrimeNgModules } from '../../../primeng.modules';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CompleteEnumerationDto } from '../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';
import { EnumeratorMapStateService } from '../../../core/utility/enumerator-map-state.service';
import * as L from 'leaflet';
import {
	SurveyEnumerationAreaStructure,
	CreateSurveyEnumerationAreaStructureDto,
	UpdateSurveyEnumerationAreaStructureDto,
} from '../../../core/dataservice/survey-enumeration-area-structure/survey-enumeration-area-structure.dto';
import { HouseholdByStructureComponent } from '../household-by-structure/household-by-structure.component';

@Component({
	selector: 'app-enumeration-area-map-view',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		PrimeNgModules,
	],
	templateUrl: './enumeration-area-map-view.component.html',
	styleUrls: ['./enumeration-area-map-view.component.scss'],
	providers: [ConfirmationService, DialogService],
})
export class EnumerationAreaMapViewComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	@ViewChild('mapContainer', { static: false })
	mapContainerRef!: ElementRef<HTMLDivElement>;

	surveyEnumerationAreaId!: number;
	enumerationAreaId!: number;
	surveyEnumerationArea: any = null;
	loading = true;
	error: string | null = null;

	// Map properties
	private map?: L.Map;
	private osmLayer?: L.TileLayer;
	private satelliteLayer?: L.TileLayer;
	private currentBaseLayer?: L.TileLayer;
	private enumerationAreaLayer?: L.GeoJSON;
	private userLocationMarker?: L.Marker;
	private userLocationCircle?: L.Circle;
	private watchId?: number;
	private blinkInterval?: any;
	isSatelliteView = true; // Default to satellite

	// Structure properties
	structures: SurveyEnumerationAreaStructure[] = [];
	private structureMarkers: Map<number, L.Marker> = new Map();
	selectedStructure: SurveyEnumerationAreaStructure | null = null;
	showAddStructureDialog = false;
	showEditStructureDialog = false;
	showStructureActionsDialog = false;
	isAddingStructure = false;
	isEditingStructure = false;
	isDeletingStructure = false;
	newStructureNumber = '';
	editStructureNumber = '';
	clickedLatLng: { lat: number; lng: number } | null = null;
	isEnumerated = false;
	editMode = false; // Edit mode for adding structures

	/**
	 * Check if structures exist
	 */
	get hasStructures(): boolean {
		return this.structures.length > 0;
	}
	private mapStateDebounceTimeout?: any;

	// Geolocation properties
	userLocation: { lat: number; lng: number } | null = null;
	locationError: string | null = null;
	isTrackingLocation = false;

	// Toast notification
	toastMessage: string | null = null;
	toastSeverity: 'error' | 'success' | 'info' = 'info';
	private toastTimeout?: any;

	// Complete enumeration
	showCompleteEnumerationDialog = false;
	isCompletingEnumeration = false;
	enumerationComments = '';

	// Dialog references
	householdDialogRef: DynamicDialogRef | undefined;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private enumerationAreaService: EnumerationAreaDataService,
		private enumeratorService: EnumeratorDataService,
		private structureService: SurveyEnumerationAreaStructureDataService,
		private surveyEAService: SurveyEnumerationAreaDataService,
		private authService: AuthService,
		private confirmationService: ConfirmationService,
		private mapStateService: EnumeratorMapStateService,
		private dialogService: DialogService
	) {}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			this.surveyEnumerationAreaId = +params['surveyEnumerationAreaId'];
			this.loadSurveyEnumerationAreaDetails();
		});
	}

	ngAfterViewInit(): void {
		// Map will be initialized after data is loaded
	}

	ngOnDestroy(): void {
		this.stopLocationTracking();
		if (this.map) {
			this.map.remove();
		}
		if (this.blinkInterval) {
			clearInterval(this.blinkInterval);
		}
		if (this.toastTimeout) {
			clearTimeout(this.toastTimeout);
		}
	}

	/**
	 * Load survey enumeration area details
	 */
	loadSurveyEnumerationAreaDetails(): void {
		this.loading = true;
		this.error = null;

		this.enumeratorService
			.getSurveyEnumerationAreaDetails(this.surveyEnumerationAreaId)
			.subscribe({
				next: (data: any) => {
					this.surveyEnumerationArea = data;
					this.enumerationAreaId =
						data?.enumerationArea?.id || data?.enumerationAreaId;
					this.isEnumerated = data?.isEnumerated || false;
					if (this.enumerationAreaId) {
						this.loadEnumerationAreaGeoJSON();
						this.loadStructures();
					} else {
						this.error = 'Enumeration area ID not found';
						this.loading = false;
					}
				},
				error: (error: any) => {
					console.error(
						'Error loading survey enumeration area details:',
						error
					);
					this.error = 'Failed to load enumeration area details';
					this.loading = false;
				},
			});
	}

	/**
	 * Load enumeration area GeoJSON
	 */
	loadEnumerationAreaGeoJSON(): void {
		if (!this.enumerationAreaId) {
			this.loading = false;
			return;
		}

		this.enumerationAreaService
			.findOneAsGeoJson(this.enumerationAreaId)
			.subscribe({
				next: (geoJson: any) => {
					this.loading = false;
					// Initialize map after a short delay to ensure DOM is ready
					setTimeout(() => {
						this.initializeMap(geoJson);
						this.startLocationTracking();
					}, 100);
				},
				error: (error: any) => {
					console.error('Error loading enumeration area GeoJSON:', error);
					this.error = 'Failed to load map data';
					this.loading = false;
					this.showToast('Failed to load enumeration area map', 'error');
				},
			});
	}

	/**
	 * Initialize Leaflet map
	 */
	private initializeMap(geoJson: any): void {
		if (!this.mapContainerRef?.nativeElement) {
			console.warn('Map container not available, will retry...');
			setTimeout(() => this.initializeMap(geoJson), 200);
			return;
		}

		if (this.map) {
			this.map.remove();
		}

		// Restore map state from service if available, otherwise use defaults
		const savedMapState = this.mapStateService.getMapState(this.surveyEnumerationAreaId);
		const initialCenter = savedMapState?.center || [27.5142, 90.4336]; // Default center (Bhutan)
		const initialZoom = savedMapState?.zoom || 13;

		// Create map with restored or default state
		this.map = L.map(this.mapContainerRef.nativeElement, {
			center: initialCenter as [number, number],
			zoom: initialZoom,
			zoomControl: false, // Remove zoom controls
			attributionControl: false,
		});

		// Create OSM layer
		this.osmLayer = L.tileLayer(
			'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
			{
				maxZoom: 19,
				attribution: '© OpenStreetMap contributors',
			}
		);

		// Create Google Satellite layer
		this.satelliteLayer = L.tileLayer(
			'https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
			{
				maxZoom: 20,
				minZoom: 1,
				attribution: '© Google',
			}
		);

		// Add default layer (satellite)
		this.currentBaseLayer = this.satelliteLayer;
		this.currentBaseLayer.addTo(this.map);

		// Render enumeration area
		if (geoJson) {
			this.renderEnumerationArea(geoJson);
		}

		// Add click handler for map to add structures
		if (this.map && !this.isEnumerated) {
			this.map.on('click', (e: L.LeafletMouseEvent) => {
				// Allow clicks when in edit mode
				if (this.editMode) {
					this.onMapClick(e);
				}
			});
		}

		// Setup map state saving on move/zoom (debounced)
		this.setupMapStateSaving();

		// Render structures if they were already loaded before map initialization
		// Use a small delay to ensure map is fully ready
		setTimeout(() => {
			if (this.structures.length > 0) {
				this.renderStructures();
			}
		}, 100);
	}

	/**
	 * Render enumeration area on map
	 */
	private renderEnumerationArea(geoJson: any): void {
		if (!this.map) return;

		// Remove existing layer if any
		if (this.enumerationAreaLayer) {
			this.map.removeLayer(this.enumerationAreaLayer);
		}

		// Handle both Feature and FeatureCollection
		let features: any[] = [];
		if (geoJson.type === 'FeatureCollection') {
			features = geoJson.features || [];
		} else if (geoJson.type === 'Feature') {
			features = [geoJson];
		}

		if (features.length === 0) {
			console.warn('No features found in GeoJSON');
			return;
		}

		// Create GeoJSON layer
		this.enumerationAreaLayer = L.geoJSON(geoJson, {
			style: {
				fillColor: '#1A58AF',
				fillOpacity: 0,
				color: '#1A58AF',
				weight: 3,
				opacity: 1,
			},
			interactive: false, // Make EA layer non-interactive so clicks pass through
			onEachFeature: (feature, layer) => {
				const props = feature.properties || {};
				const name = props.name || props.areaCode || 'Enumeration Area';

				// Make each feature layer non-interactive so clicks pass through
				(layer as any).options.interactive = false;
				
				// Remove any existing event handlers
				layer.off('click');
				layer.off('mouseover');
				layer.off('mouseout');

				// Bind tooltip (non-interactive, just for display)
				layer.bindTooltip(name, {
					permanent: false,
					direction: 'top',
				});
			},
		});

		this.enumerationAreaLayer.addTo(this.map);

		// Fit map to bounds only if we don't have saved map state to restore
		const savedMapState = this.mapStateService.getMapState(this.surveyEnumerationAreaId);
		if (!savedMapState) {
			const bounds = this.enumerationAreaLayer.getBounds();
			this.map.fitBounds(bounds, { padding: [50, 50] });
		}
	}

	/**
	 * Start tracking user location
	 * @param shouldZoom - Whether to zoom to user location when first position is received
	 */
	startLocationTracking(shouldZoom: boolean = false): void {
		if (!navigator.geolocation) {
			this.locationError = 'Geolocation is not supported by your browser';
			return;
		}

		this.isTrackingLocation = true;
		this.locationError = null;

		// Watch position with high accuracy
		// Only zoom if explicitly requested (when user clicks track button)
		let firstPositionReceived = false;
		this.watchId = navigator.geolocation.watchPosition(
			(position) => {
				const lat = position.coords.latitude;
				const lng = position.coords.longitude;
				this.userLocation = { lat, lng };
				this.updateUserLocationMarker(lat, lng, position.coords.accuracy);
				
				// Zoom to location only if explicitly requested (user clicked track button)
				if (shouldZoom && !firstPositionReceived) {
					firstPositionReceived = true;
					this.zoomToUserLocation();
				}
			},
			(error) => {
				console.error('Geolocation error:', error);
				this.locationError = this.getGeolocationErrorMessage(error);
				this.isTrackingLocation = false;
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 0,
			}
		);
	}

	/**
	 * Stop tracking user location
	 */
	stopLocationTracking(): void {
		if (this.watchId !== undefined) {
			navigator.geolocation.clearWatch(this.watchId);
			this.watchId = undefined;
		}
		this.isTrackingLocation = false;
		if (this.blinkInterval) {
			clearInterval(this.blinkInterval);
			this.blinkInterval = undefined;
		}
	}

	/**
	 * Update user location marker on map
	 */
	private updateUserLocationMarker(
		lat: number,
		lng: number,
		accuracy: number
	): void {
		if (!this.map) return;

		// Create custom blinking icon with pulsing animation
		const blinkingIcon = L.divIcon({
			className: 'user-location-marker',
			html: `
				<div class="pulsing-marker" style="
					width: 20px;
					height: 20px;
					background-color: #1A58AF;
					border: 3px solid white;
					border-radius: 50%;
					box-shadow: 0 0 10px rgba(26, 88, 175, 0.5);
				"></div>
			`,
			iconSize: [20, 20],
			iconAnchor: [10, 10],
		});

		// Update or create marker
		if (this.userLocationMarker) {
			this.userLocationMarker.setLatLng([lat, lng]);
		} else {
			this.userLocationMarker = L.marker([lat, lng], {
				icon: blinkingIcon,
			}).addTo(this.map);
		}

		// Update accuracy circle
		if (this.userLocationCircle) {
			this.userLocationCircle.setLatLng([lat, lng]);
			this.userLocationCircle.setRadius(accuracy);
		} else {
			this.userLocationCircle = L.circle([lat, lng], {
				radius: accuracy,
				fillColor: '#1A58AF',
				fillOpacity: 0.2,
				color: '#1A58AF',
				weight: 2,
				opacity: 0.5,
			}).addTo(this.map);
		}

		// Center map on user location (optional - can be removed if too distracting)
		// this.map.setView([lat, lng], this.map.getZoom());
	}

	/**
	 * Get geolocation error message
	 */
	private getGeolocationErrorMessage(error: GeolocationPositionError): string {
		switch (error.code) {
			case error.PERMISSION_DENIED:
				return 'Location access denied. Please enable location permissions.';
			case error.POSITION_UNAVAILABLE:
				return 'Location information unavailable.';
			case error.TIMEOUT:
				return 'Location request timed out.';
			default:
				return 'An unknown error occurred while getting location.';
		}
	}

	/**
	 * Navigate back
	 */
	goBack(): void {
		if (this.surveyEnumerationArea?.surveyId) {
			this.router.navigate([
				'/enumerator/survey',
				this.surveyEnumerationArea.surveyId,
			]);
		} else {
			this.router.navigate(['/enumerator']);
		}
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

		const parts = [];
		if (ea.subAdministrativeZone?.administrativeZone?.dzongkhag?.name) {
			parts.push(ea.subAdministrativeZone.administrativeZone.dzongkhag.name);
		}
		if (ea.subAdministrativeZone?.administrativeZone?.name) {
			parts.push(ea.subAdministrativeZone.administrativeZone.name);
		}
		if (ea.subAdministrativeZone?.name) {
			parts.push(ea.subAdministrativeZone.name);
		}
		if (ea.name) {
			parts.push(ea.name);
		}

		return parts.join(' → ');
	}

	/**
	 * Toggle location tracking and zoom to location
	 */
	toggleLocationTracking(): void {
		if (this.isTrackingLocation) {
			this.stopLocationTracking();
		} else {
			// Start tracking with zoom enabled (user explicitly clicked track button)
			this.startLocationTracking(true);
			// If we already have a location, zoom to it immediately
			if (this.userLocation) {
				this.zoomToUserLocation();
			}
		}
	}

	/**
	 * Zoom to user location (called once when tracking starts)
	 */
	private zoomToUserLocation(): void {
		if (this.map && this.userLocation) {
			this.map.setView(
				[this.userLocation.lat, this.userLocation.lng],
				17 // Zoom level for user location
			);
		}
	}

	/**
	 * Zoom to enumeration area
	 */
	zoomToEnumerationArea(): void {
		if (this.map && this.enumerationAreaLayer) {
			const bounds = this.enumerationAreaLayer.getBounds();
			this.map.fitBounds(bounds, { padding: [50, 50] });
		}
	}

	/**
	 * Setup automatic map state saving on move/zoom events
	 */
	private setupMapStateSaving(): void {
		if (!this.map) return;

		// Save map state when user pans or zooms (debounced)
		this.map.on('moveend', () => {
			if (this.mapStateDebounceTimeout) {
				clearTimeout(this.mapStateDebounceTimeout);
			}
			this.mapStateDebounceTimeout = setTimeout(() => {
				if (this.map) {
					const center = this.map.getCenter();
					const zoom = this.map.getZoom();
					this.mapStateService.saveMapPosition(
						this.surveyEnumerationAreaId,
						{ lat: center.lat, lng: center.lng },
						zoom
					);
				}
			}, 500);
		});
	}

	/**
	 * Toggle between satellite and OSM layers
	 */
	toggleMapLayer(): void {
		if (!this.map) return;

		// Remove current layer
		if (this.currentBaseLayer) {
			this.map.removeLayer(this.currentBaseLayer);
		}

		// Switch to the other layer
		this.isSatelliteView = !this.isSatelliteView;
		this.currentBaseLayer = this.isSatelliteView
			? this.satelliteLayer
			: this.osmLayer;

		// Add new layer
		if (this.currentBaseLayer) {
			this.currentBaseLayer.addTo(this.map);
		}
	}

	/**
	 * Show toast notification
	 */
	private showToast(message: string, severity: 'error' | 'success' | 'info' = 'info'): void {
		this.toastMessage = message;
		this.toastSeverity = severity;

		if (this.toastTimeout) {
			clearTimeout(this.toastTimeout);
		}

		this.toastTimeout = setTimeout(() => {
			this.toastMessage = null;
		}, 3000);
	}

	/**
	 * Load structures for the enumeration area
	 */
	loadStructures(): void {
		if (!this.surveyEnumerationAreaId) return;

		this.structureService.getBySurveyEA(this.surveyEnumerationAreaId).subscribe({
			next: (structures) => {
				console.log('Loaded structures:', structures.length);
				this.structures = structures;
				this.renderStructures();
				console.log('Rendered markers:', this.structureMarkers.size);
				
				// After structures are rendered, restore selected structure highlight
				setTimeout(() => {
					const savedStructureId = this.mapStateService.getSelectedStructure(this.surveyEnumerationAreaId);
					const savedMapState = this.mapStateService.getMapState(this.surveyEnumerationAreaId);
					
					if (savedStructureId && this.map) {
						const structure = this.structures.find(s => s.id === savedStructureId);
						if (structure) {
							this.selectedStructure = structure;
							// Only highlight if marker exists (structure has coordinates)
							if (this.structureMarkers.has(savedStructureId)) {
								console.log('Restoring highlight for structure:', savedStructureId);
								this.updateStructureMarkerHighlight(savedStructureId);
								
								// If map state was saved with structure coordinates (from "Locate on Map"), zoom to it
								if (savedMapState && 
									savedMapState.center.lat === structure.latitude && 
									savedMapState.center.lng === structure.longitude &&
									savedMapState.zoom === 19) {
									// This indicates navigation from "Locate on Map" button - zoom to structure
									const marker = this.structureMarkers.get(savedStructureId);
									if (marker) {
										const latlng = marker.getLatLng();
										this.map.setView(latlng, 19);
										console.log('Zoomed to structure from household listings');
									}
								}
								// Do NOT open dialog
							} else {
								console.warn(`Structure ${savedStructureId} selected but has no marker (no coordinates). Selection saved for when coordinates are added.`);
							}
						}
					}
				}, 200);
			},
			error: (error) => {
				console.error('Error loading structures:', error);
				this.showToast('Failed to load structures', 'error');
			},
		});
	}

	/**
	 * Render structures on map
	 */
	private renderStructures(): void {
		if (!this.map) return;

		// Clear existing markers
		this.structureMarkers.forEach((marker) => {
			this.map?.removeLayer(marker);
		});
		this.structureMarkers.clear();

		// Add markers for each structure
		this.structures.forEach((structure) => {
			if (structure.latitude && structure.longitude) {
				this.addStructureMarker(structure);
			} else {
				console.warn(`Structure ${structure.id} (${structure.structureNumber}) has no coordinates - cannot render marker`);
			}
		});


	}

	/**
	 * Add a structure marker to the map
	 */
	private addStructureMarker(structure: SurveyEnumerationAreaStructure): void {
		if (!this.map || !structure.latitude || !structure.longitude) return;

		const isSelected = this.selectedStructure?.id === structure.id;
		const structureIcon = this.createStructureIcon(isSelected);

		const marker = L.marker([structure.latitude, structure.longitude], {
			icon: structureIcon,
		}).addTo(this.map);

		// Add click handler
		marker.on('click', () => {
			this.onStructureClick(structure);
		});

		// Add permanent label with structure number
		marker.bindTooltip(structure.structureNumber, {
			permanent: true,
			direction: 'bottom',
			offset: [0, 5],
			className: isSelected ? 'structure-label structure-label-selected' : 'structure-label',
		});

		this.structureMarkers.set(structure.id, marker);
	}

	/**
	 * Create structure icon based on selected state
	 */
	private createStructureIcon(isSelected: boolean): L.DivIcon {
		const size = isSelected ? 32 : 24;
		const backgroundColor = isSelected ? '#1A58AF' : '#10b981';
		const borderWidth = isSelected ? 4 : 3;
		
		return L.divIcon({
			className: 'structure-marker',
			html: `
				<div style="
					background-color: ${backgroundColor};
					border: ${borderWidth}px solid white;
					border-radius: 50%;
					width: ${size}px;
					height: ${size}px;
					box-shadow: 0 2px 12px rgba(0, 0, 0, ${isSelected ? 0.5 : 0.3});
					transition: all 0.3s ease;
				">
				</div>
			`,
			iconSize: [size, size],
			iconAnchor: [size / 2, size / 2],
		});
	}

	/**
	 * Update marker appearance based on selected state
	 */
	private updateStructureMarkerHighlight(structureId: number | null): void {
		if (!this.map) {
			console.warn('Cannot update highlight: map not initialized');
			return;
		}

		// Save to service
		this.mapStateService.saveSelectedStructure(this.surveyEnumerationAreaId, structureId);

		console.log('Updating structure marker highlight, selected ID:', structureId, 'Total markers:', this.structureMarkers.size);

		if (this.structureMarkers.size === 0) {
			console.warn('No markers available to highlight. Structures may not have coordinates.');
			return;
		}

		this.structureMarkers.forEach((marker, id) => {
			const isSelected = id === structureId;
			const structure = this.structures.find(s => s.id === id);
			if (!structure) return;

			console.log(`Updating marker ${id}, isSelected: ${isSelected}, color: ${isSelected ? 'BLUE (#1A58AF)' : 'GREEN (#10b981)'}, size: ${isSelected ? 32 : 24}px`);

			// Update icon with new styling
			const newIcon = this.createStructureIcon(isSelected);
			marker.setIcon(newIcon);

			// Update tooltip class - need to unbind and rebind to update class
			marker.unbindTooltip();
			marker.bindTooltip(structure.structureNumber, {
				permanent: true,
				direction: 'bottom',
				offset: [0, 5],
				className: isSelected ? 'structure-label structure-label-selected' : 'structure-label',
			});
		});

		console.log('Highlight update complete');
	}

	/**
	 * Handle map click to add structure
	 */
	private onMapClick(e: L.LeafletMouseEvent): void {
		// Handle add structure mode
		if (this.isEnumerated || !this.editMode) return;

		this.clickedLatLng = { lat: e.latlng.lat, lng: e.latlng.lng };
		this.newStructureNumber = '';
		this.showAddStructureDialog = true;
	}

	/**
	 * Toggle edit mode
	 */
	toggleEditMode(): void {
		if (this.isEnumerated) {
			this.showToast('Cannot edit. Enumeration area is already completed.', 'error');
			return;
		}
		this.editMode = !this.editMode;
		if (this.editMode) {
			this.showToast('Edit mode enabled. Click on map to add structures.', 'info');
		} else {
			this.showToast('Edit mode disabled.', 'info');
		}
	}

	/**
	 * Handle structure marker click
	 */
	private onStructureClick(structure: SurveyEnumerationAreaStructure): void {
		this.selectedStructure = structure;
		this.mapStateService.saveSelectedStructure(this.surveyEnumerationAreaId, structure.id);
		this.updateStructureMarkerHighlight(structure.id);
		this.showStructureActionsDialog = true;
	}

	/**
	 * Create a new structure
	 */
	createStructure(): void {
		if (!this.newStructureNumber.trim() || !this.clickedLatLng) {
			this.showToast('Please enter a structure number', 'error');
			return;
		}

		const currentUser = this.authService.getCurrentUser();
		if (!currentUser || !currentUser.id) {
			this.showToast('Unable to get user information', 'error');
			return;
		}

		this.isAddingStructure = true;

		const createDto: CreateSurveyEnumerationAreaStructureDto = {
			surveyEnumerationAreaId: this.surveyEnumerationAreaId,
			structureNumber: this.newStructureNumber.trim(),
			latitude: this.clickedLatLng.lat,
			longitude: this.clickedLatLng.lng,
			submittedBy: currentUser.id,
		};

		this.structureService.create(createDto).subscribe({
			next: (structure) => {
				this.isAddingStructure = false;
				this.showAddStructureDialog = false;
				this.newStructureNumber = '';
				this.clickedLatLng = null;
				// Disable edit mode after structure is added
				this.editMode = false;
				this.showToast('Structure added successfully', 'success');
				this.loadStructures();
			},
			error: (error) => {
				this.isAddingStructure = false;
				console.error('Error creating structure:', error);
				this.showToast(
					error.error?.message || 'Failed to create structure',
					'error'
				);
			},
		});
	}

	/**
	 * Open edit structure dialog
	 */
	openEditStructureDialog(): void {
		if (!this.selectedStructure) return;
		// Ensure we have a valid structure number and set it before opening dialog
		this.editStructureNumber = this.selectedStructure.structureNumber || '';
		this.showStructureActionsDialog = false;
		this.showEditStructureDialog = true;
	}

	/**
	 * Update structure
	 */
	updateStructure(): void {
		if (!this.selectedStructure) {
			this.showToast('No structure selected', 'error');
			return;
		}

		const trimmedNumber = this.editStructureNumber?.trim();
		if (!trimmedNumber) {
			this.showToast('Please enter a structure number', 'error');
			return;
		}

		// Check if the value actually changed
		if (trimmedNumber === this.selectedStructure.structureNumber) {
			this.showToast('No changes to save', 'info');
			return;
		}

		this.isEditingStructure = true;

		const updateDto: UpdateSurveyEnumerationAreaStructureDto = {
			structureNumber: trimmedNumber,
		};

		this.structureService.update(this.selectedStructure.id, updateDto).subscribe({
			next: () => {
				this.isEditingStructure = false;
				this.showEditStructureDialog = false;
				const selectedStructureId = this.selectedStructure?.id;
				const selectedStructureData = this.selectedStructure;
				this.editStructureNumber = '';
				this.showToast('Structure updated successfully', 'success');
				this.loadStructures();
				// Restore selection after reload
				if (selectedStructureId) {
					setTimeout(() => {
						const updatedStructure = this.structures.find(s => s.id === selectedStructureId);
						if (updatedStructure) {
							this.selectedStructure = updatedStructure;
							this.updateStructureMarkerHighlight(selectedStructureId);
						}
					}, 100);
				}
			},
			error: (error) => {
				this.isEditingStructure = false;
				console.error('Error updating structure:', error);
				this.showToast(
					error.error?.message || 'Failed to update structure',
					'error'
				);
			},
		});
	}

	/**
	 * Delete structure with confirmation
	 */
	deleteStructure(): void {
		if (!this.selectedStructure) return;

		this.confirmationService.confirm({
			message: `Are you sure you want to delete structure "${this.selectedStructure.structureNumber}"? This action cannot be undone.`,
			header: 'Confirm Delete',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				if (!this.selectedStructure) return;

				this.isDeletingStructure = true;

				this.structureService.delete(this.selectedStructure.id).subscribe({
					next: () => {
						this.isDeletingStructure = false;
						this.showStructureActionsDialog = false;
						const deletedStructure = this.selectedStructure;
						this.selectedStructure = null;
						this.mapStateService.saveSelectedStructure(this.surveyEnumerationAreaId, null);
						this.updateStructureMarkerHighlight(null);
						this.showToast('Structure deleted successfully', 'success');
						this.loadStructures();
					},
					error: (error) => {
						this.isDeletingStructure = false;
						console.error('Error deleting structure:', error);
						this.showToast(
							error.error?.message || 'Failed to delete structure',
							'error'
						);
					},
				});
			},
			reject: () => {
				// User cancelled, do nothing
			},
		});
	}


	/**
	 * Navigate to add household for structure
	 */
	addHousehold(): void {
		if (!this.selectedStructure || !this.map) return;
		this.showStructureActionsDialog = false;
		
		// Save current map state (center and zoom) to service
		const currentCenter = this.map.getCenter();
		const currentZoom = this.map.getZoom();
		this.mapStateService.saveMapPosition(
			this.surveyEnumerationAreaId,
			{ lat: currentCenter.lat, lng: currentCenter.lng },
			currentZoom
		);
		
		// Navigate to household listing page (structure ID already saved in service)
		this.router.navigate(
			['/enumerator/household-listing-form', this.surveyEnumerationAreaId]
		);
	}

	/**
	 * Close add structure dialog
	 */
	closeAddStructureDialog(): void {
		this.showAddStructureDialog = false;
		this.newStructureNumber = '';
		this.clickedLatLng = null;
	}

	/**
	 * Close edit structure dialog
	 */
	closeEditStructureDialog(): void {
		this.showEditStructureDialog = false;
		this.editStructureNumber = '';
		// Keep selection and highlight when closing edit dialog
	}

	/**
	 * Close structure actions dialog
	 */
	closeStructureActionsDialog(): void {
		this.showStructureActionsDialog = false;
		// Keep selection and highlight when closing dialog
	}

	/**
	 * Open complete enumeration dialog
	 */
	openCompleteEnumerationDialog(): void {
		if (this.isEnumerated) {
			this.showToast('Enumeration area is already completed', 'info');
			return;
		}
		this.enumerationComments = '';
		this.showCompleteEnumerationDialog = true;
	}

	/**
	 * Close complete enumeration dialog
	 */
	closeCompleteEnumerationDialog(): void {
		this.showCompleteEnumerationDialog = false;
		this.enumerationComments = '';
	}

	/**
	 * Complete enumeration for this survey enumeration area
	 */
	completeEnumeration(): void {
		if (this.isEnumerated) {
			this.showToast('Enumeration area is already completed', 'info');
			return;
		}

		const currentUser = this.authService.getCurrentUser();
		if (!currentUser || !currentUser.id) {
			this.showToast('Unable to get user information', 'error');
			return;
		}

		this.isCompletingEnumeration = true;

		const completeDto: CompleteEnumerationDto = {
			enumeratedBy: currentUser.id,
			comments: this.enumerationComments?.trim() || undefined,
		};

		this.surveyEAService.completeEnumeration(this.surveyEnumerationAreaId, completeDto).subscribe({
			next: (updated) => {
				this.isCompletingEnumeration = false;
				this.showCompleteEnumerationDialog = false;
				this.enumerationComments = '';
				this.isEnumerated = true;
				this.surveyEnumerationArea = { ...this.surveyEnumerationArea, ...updated };
				this.showToast('Enumeration completed successfully', 'success');
				// Disable edit mode if active
				if (this.editMode) {
					this.editMode = false;
				}
			},
			error: (error) => {
				this.isCompletingEnumeration = false;
				console.error('Error completing enumeration:', error);
				this.showToast(
					error.error?.message || 'Failed to complete enumeration',
					'error'
				);
			},
		});
	}

	/**
	 * Navigate to household listings table view
	 */
	viewHouseholdListings(): void {
		this.router.navigate([
			'/enumerator/survey-enumeration-area',
			this.surveyEnumerationAreaId,
			'household-listings',
		]);
	}

	/**
	 * Open dialog to view households by structure
	 */
	viewHouseholdsByStructure(): void {
		if (!this.selectedStructure) return;
		this.showStructureActionsDialog = false;

		this.householdDialogRef = this.dialogService.open(
			HouseholdByStructureComponent,
			{
				header: `Households - Structure: ${this.selectedStructure.structureNumber}`,
				width: '90vw',
				style: { 'max-width': '1200px' },
				modal: true,
				closable: true,
				data: {
					structureId: this.selectedStructure.id,
				},
			}
		);

		// Handle dialog close
		this.householdDialogRef.onClose.subscribe(() => {
			this.householdDialogRef = undefined;
		});
	}

	/**
	 * Open Google Maps with coordinates
	 */
	openGoogleMaps(latitude: number, longitude: number): void {
		const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
		window.open(url, '_blank');
	}
}

