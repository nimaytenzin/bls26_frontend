import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	ViewChild,
	ElementRef,
	ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import * as L from 'leaflet';
import { DzongkhagService } from '../../../core/dataservice/dzongkhag/dzongkhag.service';
import { EnumerationArea, EaProgress, EnumerationAreaService, EaGeom } from '../../../core/dataservice/enumeration-area/enumeration-area.service';
import { HouseholdListing, HouseholdListingService } from '../../../core/dataservice/household-listing/household-listing.service';
import { Structure, StructureService } from '../../../core/dataservice/structure/structure.service';
import { LapService } from '../../../core/dataservice/lap/lap.service';
import { TownService } from '../../../core/dataservice/town/town.service';
import { PrimeNgModules } from '../../../primeng.modules';

export interface StructureWithHouseholds extends Structure {
	householdListings: HouseholdListing[];
}

@Component({
	selector: 'app-admin-enumeration-area-data-viewer',
	templateUrl: './admin-enumeration-area-data-viewer.component.html',
	styleUrls: ['./admin-enumeration-area-data-viewer.component.css'],
	standalone: true,
	imports: [CommonModule, RouterModule, PrimeNgModules],
})
export class AdminEnumerationAreaDataViewerComponent implements OnInit, OnDestroy, AfterViewInit {
	@ViewChild('mapContainer', { static: false }) mapContainerRef!: ElementRef<HTMLDivElement>;

	private destroy$ = new Subject<void>();
	private map?: L.Map;
	private structureMarkers = new Map<number, L.Marker>();
	private geomLayer?: L.GeoJSON;

	eaId!: number;
	ea: EnumerationArea | null = null;
	progress: EaProgress | null = null;
	dzongkhagName = '';
	townName = '';
	lapName = '';
	structures: StructureWithHouseholds[] = [];
	loading = true;
	error: string | null = null;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private eaService: EnumerationAreaService,
		private structureService: StructureService,
		private householdService: HouseholdListingService,
		private dzongkhagService: DzongkhagService,
		private lapService: LapService,
		private townService: TownService,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit(): void {
		this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
			this.eaId = +params['id'];
			if (this.eaId) this.load();
		});
	}

	ngAfterViewInit(): void {}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
		if (this.geomLayer && this.map) this.map.removeLayer(this.geomLayer);
		if (this.map) this.map.remove();
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
					if (ea.dzongkhagId != null) {
						this.dzongkhagService
							.getById(ea.dzongkhagId)
							.pipe(takeUntil(this.destroy$))
							.subscribe({ next: (d) => (this.dzongkhagName = d.name) });
					}
					if (ea.lapId != null) {
						this.lapService
							.getById(ea.lapId)
							.pipe(takeUntil(this.destroy$))
							.subscribe({
								next: (lap) => {
									this.lapName = lap.name;
									if (lap.townId != null) {
										this.townService
											.getById(lap.townId)
											.pipe(takeUntil(this.destroy$))
											.subscribe({ next: (t) => (this.townName = t.name) });
									}
								},
							});
					}
					this.eaService
						.getProgress(this.eaId)
						.pipe(takeUntil(this.destroy$))
						.subscribe({ next: (p) => (this.progress = p) });
					this.loadStructures();
				},
				error: (err) => {
					this.error = err.error?.message || 'Failed to load EA';
					this.loading = false;
					this.cdr.markForCheck();
				},
			});
	}

	loadStructures(): void {
		this.structureService
			.getAll(this.eaId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (structs) => {
					const withHouseholds: StructureWithHouseholds[] = structs.map((s) => ({
						...s,
						householdListings: [],
					}));
					if (withHouseholds.length === 0) {
						this.structures = [];
						this.loading = false;
						this.cdr.markForCheck();
						setTimeout(() => this.initMap(), 100);
						return;
					}
					this.householdService
						.getAll({ eaId: this.eaId })
						.pipe(takeUntil(this.destroy$))
						.subscribe({
							next: (listings) => {
								withHouseholds.forEach((s) => {
									s.householdListings = listings.filter((h) => h.structureId === s.id);
								});
								this.structures = withHouseholds;
								this.loading = false;
								this.cdr.markForCheck();
								setTimeout(() => this.initMap(), 100);
							},
							error: () => {
								this.structures = withHouseholds;
								this.loading = false;
								this.cdr.markForCheck();
								setTimeout(() => this.initMap(), 100);
							},
						});
				},
				error: () => {
					this.structures = [];
					this.loading = false;
					this.cdr.markForCheck();
					setTimeout(() => this.initMap(), 100);
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
		L.control.zoom({ position: 'bottomright' }).addTo(this.map);
		L.tileLayer('https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
			subdomains: '0123',
			maxZoom: 21,
			attribution: '© Google',
		}).addTo(this.map);

		// Render EA boundary (geom) if present
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
			if (bounds.isValid()) this.map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
		}

		this.structureMarkers.forEach((m) => this.map!.removeLayer(m));
		this.structureMarkers.clear();
		this.structures.forEach((s) => {
			if (s.latitude != null && s.longitude != null) {
				const icon = L.divIcon({
					className: 'structure-marker',
					html: `<div style="width:24px;height:24px;border-radius:50%;background:#10b981;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
					iconSize: [24, 24],
					iconAnchor: [12, 12],
				});
				const marker = L.marker([s.latitude, s.longitude], { icon }).addTo(this.map!);
				marker.bindTooltip(s.structureNumber, { permanent: false, direction: 'top' });
				this.structureMarkers.set(s.id, marker);
			}
		});
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

	goBack(): void {
		this.router.navigate(['/admin']);
	}

	totalHouseholds(): number {
		return this.structures.reduce((sum, s) => sum + s.householdListings.length, 0);
	}

	totalPopulation(): number {
		return this.structures.reduce(
			(sum, s) =>
				sum + s.householdListings.reduce((s2, h) => s2 + (h.totalMale || 0) + (h.totalFemale || 0), 0),
			0
		);
	}
}
