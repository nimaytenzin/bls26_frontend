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
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { PrimeNgModules } from '../../../primeng.modules';
import { MessageService, ConfirmationService } from 'primeng/api';
import * as L from 'leaflet';
import { EnumerationAreaService } from '../../../core/dataservice/enumeration-area/enumeration-area.service';
import { StructureService } from '../../../core/dataservice/structure/structure.service';
import { AuthService } from '../../../core/dataservice/auth/auth.service';
import type { EnumerationArea, EaGeom } from '../../../core/dataservice/enumeration-area/enumeration-area.service';
import type { Structure } from '../../../core/dataservice/structure/structure.service';

@Component({
	selector: 'app-enumerator-ea-map-view',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
	templateUrl: './enumerator-ea-map-view.component.html',
	styleUrls: ['./enumerator-ea-map-view.component.scss'],
})
export class EnumeratorEaMapViewComponent implements OnInit, OnDestroy, AfterViewInit {
	private destroy$ = new Subject<void>();
	@ViewChild('mapContainer', { static: false }) mapContainerRef!: ElementRef<HTMLDivElement>;

	eaId!: number;
	ea: EnumerationArea | null = null;
	structures: Structure[] = [];
	loading = true;
	error: string | null = null;

	private map?: L.Map;
	private structureMarkers = new Map<number, L.Marker>();
	private geomLayer?: L.GeoJSON;
	selectedStructure: Structure | null = null;

	editMode = false;
	showAddStructureDialog = false;
	showStructureActionsDialog = false;
	showCompleteDialog = false;
	clickedLatLng: { lat: number; lng: number } | null = null;
	newStructureNumber = '';
	isAddingStructure = false;
	isCompleting = false;
	eaCompleted = false;
	locating = false;
	toastMessage: string | null = null;
	toastSeverity: 'success' | 'error' | 'info' = 'info';
	private toastTimeout: ReturnType<typeof setTimeout> | null = null;
	private userLocationMarker?: L.Marker;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private eaService: EnumerationAreaService,
		private structureService: StructureService,
		private authService: AuthService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService
	) {}

	ngOnInit(): void {
		this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
			this.eaId = +params['eaId'];
			if (this.eaId) {
				this.load();
			}
		});
	}

	ngAfterViewInit(): void {}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
		if (this.geomLayer && this.map) this.map.removeLayer(this.geomLayer);
		if (this.userLocationMarker && this.map) this.map.removeLayer(this.userLocationMarker);
		if (this.map) this.map.remove();
		if (this.toastTimeout) clearTimeout(this.toastTimeout);
	}

	load(): void {
		this.loading = true;
		this.error = null;
		this.eaService
			.getById(this.eaId, true)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (ea) => {
					this.ea = ea;
					this.eaCompleted = ea.status === 'completed';
					this.loadStructures();
				},
				error: (err) => {
					this.error = err.error?.message || 'Failed to load EA';
					this.loading = false;
				},
			});
	}

	loadStructures(): void {
		this.structureService
			.getAll(this.eaId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (list) => {
					this.structures = list;
					this.loading = false;
					if (this.map) {
						// Map already exists (e.g. after adding a structure): just refresh markers
						const geomObj = this.normalizeGeom(this.ea?.geom);
						this.renderStructures(!!geomObj);
					} else {
						setTimeout(() => this.initMap(), 50);
					}
				},
				error: (err) => {
					this.structures = [];
					this.loading = false;
					if (this.map) {
						const geomObj = this.normalizeGeom(this.ea?.geom);
						this.renderStructures(!!geomObj);
					} else {
						setTimeout(() => this.initMap(), 50);
					}
				},
			});
	}

	private initMap(): void {
		if (!this.mapContainerRef?.nativeElement || this.map) return;
		this.map = L.map(this.mapContainerRef.nativeElement, {
			center: [27.5142, 90.4336],
			zoom: 13,
			zoomControl: false,
		});
		L.tileLayer('https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
			subdomains: '0123',
			maxZoom: 21,
			attribution: '© Google',
		}).addTo(this.map);

		// Render EA boundary (geom) if present and zoom to it
		const geom = this.ea?.geom;
		const geomObj = this.normalizeGeom(geom);
		if (geomObj) {
			const geoJsonFeature = {
				type: 'Feature',
				geometry: geomObj,
				properties: {},
			};
			this.geomLayer = L.geoJSON(geoJsonFeature as any, {
				style: {
					color: '#1d4ed8',
					weight: 2,
					fillColor: '#3b82f6',
					fillOpacity: 0.15,
				},
			}).addTo(this.map);
			const bounds = this.geomLayer.getBounds();
			if (bounds.isValid()) {
				this.map.fitBounds(bounds, { padding: [32, 32], maxZoom: 18 });
			}
		}

		this.map.on('click', (e: L.LeafletMouseEvent) => {
			if (this.editMode && !this.eaCompleted) {
				this.clickedLatLng = { lat: e.latlng.lat, lng: e.latlng.lng };
				this.newStructureNumber = this.getNextStructureNumber();
				this.showAddStructureDialog = true;
			}
		});

		this.renderStructures(!!geomObj);

		// Recalc size after layout so map is visible (fixes flex/safe-area timing)
		setTimeout(() => this.map?.invalidateSize(), 150);
	}

	private renderStructures(hasGeom: boolean): void {
		if (!this.map) return;
		this.structureMarkers.forEach((m) => this.map!.removeLayer(m));
		this.structureMarkers.clear();
		const markerBounds = !hasGeom ? L.latLngBounds([0, 0], [0, 0]) : null;
		this.structures.forEach((s) => {
			if (s.latitude != null && s.longitude != null) {
				const isSelected = this.selectedStructure?.id === s.id;
				const icon = L.divIcon({
					className: 'structure-marker',
					html: `<div style="width:24px;height:24px;border-radius:50%;background:${isSelected ? '#1A58AF' : '#10b981'};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
					iconSize: [24, 24],
					iconAnchor: [12, 12],
				});
				const marker = L.marker([s.latitude, s.longitude], { icon }).addTo(this.map!);
				marker.on('click', (e: L.LeafletMouseEvent) => {
					L.DomEvent.stopPropagation(e);
					this.selectedStructure = s;
					this.renderStructures(hasGeom);
					this.showStructureActionsDialog = true;
				});
				marker.bindTooltip(s.structureNumber, { permanent: false, direction: 'top' });
				this.structureMarkers.set(s.id, marker);
				if (markerBounds) {
					markerBounds.extend(marker.getLatLng());
				}
			}
		});
		// If no geom, zoom to structures
		if (!hasGeom && markerBounds && markerBounds.isValid()) {
			this.map!.fitBounds(markerBounds, { padding: [32, 32], maxZoom: 18 });
		}
	}

	private getNextStructureNumber(): string {
		if (this.structures.length === 0) return '1';
		const nums = this.structures
			.map((s) => parseInt(s.structureNumber.replace(/\D/g, '') || '0', 10))
			.filter((n) => !isNaN(n));
		return String((nums.length ? Math.max(...nums) : 0) + 1);
	}

	toggleEditMode(): void {
		this.editMode = !this.editMode;
		this.showToast(this.editMode ? 'Click map to add structure' : 'Edit mode off', 'info');
	}

	createStructure(): void {
		if (!this.clickedLatLng || !this.newStructureNumber?.trim()) {
			this.showToast('Enter structure number', 'error');
			return;
		}
		this.isAddingStructure = true;
		this.structureService
			.create({
				enumerationAreaId: this.eaId,
				structureNumber: this.newStructureNumber.trim(),
				latitude: this.clickedLatLng.lat,
				longitude: this.clickedLatLng.lng,
			})
			.pipe(takeUntil(this.destroy$), finalize(() => (this.isAddingStructure = false)))
			.subscribe({
				next: () => {
					this.showAddStructureDialog = false;
					this.newStructureNumber = '';
					this.clickedLatLng = null;
					this.showToast('Structure added', 'success');
					this.loadStructures();
				},
				error: (err) => this.showToast(err.error?.message || 'Failed to add structure', 'error'),
			});
	}

	closeAddStructureDialog(): void {
		this.showAddStructureDialog = false;
		this.clickedLatLng = null;
		this.newStructureNumber = '';
	}

	addHousehold(): void {
		if (!this.selectedStructure) return;
		this.showStructureActionsDialog = false;
		this.router.navigate(['/enumerator/ea', this.eaId, 'household', 'new', this.selectedStructure.id]);
	}

	viewHouseholdsForStructure(): void {
		if (!this.selectedStructure) return;
		this.showStructureActionsDialog = false;
		this.router.navigate(['/enumerator/ea', this.eaId, 'households'], {
			queryParams: { structureId: this.selectedStructure.id },
		});
	}

	viewHouseholdList(): void {
		this.router.navigate(['/enumerator/ea', this.eaId, 'households']);
	}

	openCompleteDialog(): void {
		if (this.eaCompleted) return;
		this.showCompleteDialog = true;
	}

	markComplete(): void {
		this.isCompleting = true;
		this.eaService
			.complete(this.eaId)
			.pipe(takeUntil(this.destroy$), finalize(() => (this.isCompleting = false)))
			.subscribe({
				next: () => {
					this.eaCompleted = true;
					this.ea = this.ea ? { ...this.ea, status: 'completed' } : null;
					this.showCompleteDialog = false;
					this.showToast('EA marked complete', 'success');
				},
				error: (err) => this.showToast(err.error?.message || 'Failed to complete', 'error'),
			});
	}

	deleteStructure(): void {
		if (!this.selectedStructure) return;
		this.confirmationService.confirm({
			message: `Delete structure "${this.selectedStructure.structureNumber}"?`,
			header: 'Confirm',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				this.structureService.delete(this.selectedStructure!.id).pipe(takeUntil(this.destroy$)).subscribe({
					next: () => {
						this.selectedStructure = null;
						this.showStructureActionsDialog = false;
						this.showToast('Structure deleted', 'success');
						this.loadStructures();
					},
					error: (err) => this.showToast(err.error?.message || 'Delete failed', 'error'),
				});
			},
		});
	}

	zoomToExtent(): void {
		if (!this.map) return;
		if (this.geomLayer) {
			const bounds = this.geomLayer.getBounds();
			if (bounds.isValid()) {
				this.map.fitBounds(bounds, { padding: [32, 32], maxZoom: 18 });
				return;
			}
		}
		if (this.structureMarkers.size > 0) {
			const bounds = L.latLngBounds([]);
			this.structureMarkers.forEach((m) => bounds.extend(m.getLatLng()));
			if (bounds.isValid()) {
				this.map.fitBounds(bounds, { padding: [32, 32], maxZoom: 18 });
			}
		}
	}

	zoomToLocation(): void {
		if (!this.map || this.locating) return;
		if (!navigator.geolocation) {
			this.showToast('Geolocation is not supported on this device', 'error');
			return;
		}
		this.locating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				this.locating = false;
				const latlng: L.LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
				if (this.userLocationMarker) {
					this.userLocationMarker.setLatLng(latlng);
				} else {
					const icon = L.divIcon({
						className: 'user-location-marker',
						html: '<div class="user-location-dot"></div>',
						iconSize: [20, 20],
						iconAnchor: [10, 10],
					});
					this.userLocationMarker = L.marker(latlng, { icon })
						.bindTooltip('Your location', { permanent: false, direction: 'top' })
						.addTo(this.map!);
				}
				this.map!.flyTo(latlng, 17, { duration: 1.2 });
			},
			() => {
				this.locating = false;
				this.showToast('Could not get your location', 'error');
			},
			{ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
		);
	}

	goBack(): void {
		this.router.navigate(['/enumerator']);
	}

	private showToast(message: string, severity: 'success' | 'error' | 'info'): void {
		this.toastMessage = message;
		this.toastSeverity = severity;
		if (this.toastTimeout) clearTimeout(this.toastTimeout);
		this.toastTimeout = setTimeout(() => {
			this.toastMessage = null;
			this.toastTimeout = null;
		}, 3000);
	}

	/** Normalize geom from API (object or JSON string) to GeoJSON geometry. */
	private normalizeGeom(geom: EnumerationArea['geom']): EaGeom | null {
		if (geom == null) return null;
		if (typeof geom === 'string') {
			try {
				const parsed = JSON.parse(geom) as EaGeom;
				return parsed?.type && parsed?.coordinates ? parsed : null;
			} catch {
				return null;
			}
		}
		return geom?.type && geom?.coordinates ? geom : null;
	}
}
