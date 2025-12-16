import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
	FormsModule,
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	Validators,
} from '@angular/forms';
import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { AdministrativeZoneDataService } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import {
	EnumerationArea,
	CreateEnumerationAreaDto,
	UpdateEnumerationAreaDto,
	BulkUploadResponse,
} from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import {
	Dzongkhag,
	DzongkhagHierarchicalResponse,
	DzongkhagEnumerationAreasResponse,
} from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { AdministrativeZone } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import {
	SubAdministrativeZone,
	SubAdministrativeZoneType,
} from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';

// Hierarchical interfaces for the component
interface HierarchicalSubAdministrativeZone
	extends Omit<SubAdministrativeZone, 'enumerationAreas'> {
	enumerationAreas?: EnumerationArea[];
}

interface HierarchicalAdministrativeZone
	extends Omit<AdministrativeZone, 'subAdministrativeZones'> {
	subAdministrativeZones?: HierarchicalSubAdministrativeZone[];
}

interface HierarchicalDzongkhagResponse
	extends Omit<Dzongkhag, 'administrativeZones'> {
	administrativeZones: HierarchicalAdministrativeZone[];
}
import { PrimeNgModules } from '../../../../primeng.modules';
import { Table } from 'primeng/table';
import * as L from 'leaflet';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BasemapService } from '../../../../core/utility/basemap.service';
import { LocationSelectionService } from '../../../../core/services/location-selection.service';

@Component({
	selector: 'app-admin-master-enumeration-areas',
	templateUrl: './admin-master-enumeration-areas.component.html',
	styleUrls: ['./admin-master-enumeration-areas.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [ConfirmationService, MessageService],
})
export class AdminMasterEnumerationAreasComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	// Table references
	@ViewChild('dtSplit') dtSplit!: Table;

	// Data properties
	dzongkhags: Dzongkhag[] = [];
	selectedDzongkhag: Dzongkhag | null = null;
	administrativeZones: AdministrativeZone[] = [];
	selectedAdministrativeZone: AdministrativeZone | null = null;
	selectedSubAdministrativeZone: SubAdministrativeZone | null = null;
	hierarchicalData: HierarchicalDzongkhagResponse | null = null;
	enumerationAreas: EnumerationArea[] = [];
	hierarchicalTableData: any[] = []; // For hierarchical table display
	selectedEnumerationArea: EnumerationArea | null = null;
	subAdministrativeZones: SubAdministrativeZone[] = [];
	loading = false;
	loadingEAs = false;


	// Map properties
	private map?: L.Map;
	enumerationAreaGeoJSON: any;
	private allEnumerationAreasLayer?: L.GeoJSON;
	private baseLayer?: L.TileLayer;

	// Basemap properties
	selectedBasemapId = 'positron'; // Default basemap
	basemapCategories: Record<
		string,
		{ label: string; basemaps: Array<{ id: string; name: string }> }
	> = {};

	// Dialog states
	enumerationAreaDialog = false;
	deleteDialog = false;
	uploadGeojsonDialog = false;
	bulkUploadDialog = false;

	// Form
	enumerationAreaForm: FormGroup;
	isEditMode = false;

	// Upload properties
	selectedFile: File | null = null;
	uploadLoading = false;

	// Bulk upload properties
	bulkUploadFile: File | null = null;
	bulkUploadLoading = false;
	bulkUploadResults: BulkUploadResponse | null = null;

	// Table properties
	globalFilterValue = '';

	constructor(
		private enumerationAreaService: EnumerationAreaDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private administrativeZoneService: AdministrativeZoneDataService,
		private dzongkhagService: DzongkhagDataService,
		private fb: FormBuilder,
		private messageService: MessageService,
		private router: Router,
		private basemapService: BasemapService,
		private locationSelectionService: LocationSelectionService
	) {
		this.enumerationAreaForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			description: ['', [Validators.required]],
			areaCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],
			subAdministrativeZoneIds: [[], [Validators.required, this.arrayMinLengthValidator(1)]],
		});
		
		// Initialize basemap categories
		this.basemapCategories = this.basemapService.getBasemapCategories();
	}

	// Custom validator for array minimum length
	private arrayMinLengthValidator(minLength: number) {
		return (control: any) => {
			if (!control.value || !Array.isArray(control.value) || control.value.length < minLength) {
				return { arrayMinLength: { requiredLength: minLength, actualLength: control.value?.length || 0 } };
			}
			return null;
		};
	}

	ngOnInit() {
		this.loadDzongkhags();

		// Create global function for map popup navigation
		(window as any).navigateToEADetails = (id: number) => {
			this.viewEnumerationAreaDetails({ id } as EnumerationArea);
		};
	}
	ngAfterViewInit() {
		// Initialize map for split view
		setTimeout(() => this.initializeMap(), 100);
	}

	ngOnDestroy() {
		if (this.map) {
			this.map.remove();
		}

		// Clean up global function
		delete (window as any).navigateToEADetails;
	}

	loadDzongkhags() {
		this.loading = true;
		
		// Restore selections from service
		const savedDzongkhag = this.locationSelectionService.getSelectedDzongkhag();
		const savedAdministrativeZone = this.locationSelectionService.getSelectedAdministrativeZone();
		const savedSubAdministrativeZone = this.locationSelectionService.getSelectedSubAdministrativeZone();
		
		if (savedDzongkhag) {
			this.selectedDzongkhag = savedDzongkhag;
		}
		if (savedAdministrativeZone) {
			this.selectedAdministrativeZone = savedAdministrativeZone;
		}
		if (savedSubAdministrativeZone) {
			this.selectedSubAdministrativeZone = savedSubAdministrativeZone;
		}
		
		this.dzongkhagService.findAllDzongkhags().subscribe({
			next: (data) => {
				this.dzongkhags = data;
				this.loading = false;

				// Restore saved dzongkhag if available, otherwise default to Thimphu
				if (this.selectedDzongkhag) {
					// Find the saved dzongkhag in the list
					const foundDzongkhag = data.find(d => d.id === this.selectedDzongkhag!.id);
					if (foundDzongkhag) {
						this.selectedDzongkhag = foundDzongkhag;
						this.locationSelectionService.setSelectedDzongkhag(foundDzongkhag);
					} else {
						// Saved dzongkhag not found, try Thimphu
						const thimphu = data.find(
							(d) =>
								d.name.toLowerCase().includes('thimphu') ||
								d.name.toLowerCase().includes('thimpu')
						);
						if (thimphu) {
							this.selectedDzongkhag = thimphu;
							this.locationSelectionService.setSelectedDzongkhag(thimphu);
						} else if (data.length > 0) {
							this.selectedDzongkhag = data[0];
							this.locationSelectionService.setSelectedDzongkhag(data[0]);
						}
					}
				} else {
					// No saved selection, default to Thimphu
					const thimphu = data.find(
						(d) =>
							d.name.toLowerCase().includes('thimphu') ||
							d.name.toLowerCase().includes('thimpu')
					);

					if (thimphu) {
						this.selectedDzongkhag = thimphu;
						this.locationSelectionService.setSelectedDzongkhag(thimphu);
					} else if (data.length > 0) {
						// Fallback to first dzongkhag if Thimphu not found
						this.selectedDzongkhag = data[0];
						this.locationSelectionService.setSelectedDzongkhag(data[0]);
					}
				}
				
				// Load administrative zones for dropdown
				this.loadAdministrativeZones();
				// Load enumeration areas (which also loads hierarchical data)
				this.loadEnumerationAreasByDzongkhag();
				
				// Subscribe to selection changes
				this.locationSelectionService.selectedDzongkhag$.subscribe((dzongkhag) => {
					if (dzongkhag && dzongkhag.id !== this.selectedDzongkhag?.id) {
						this.selectedDzongkhag = dzongkhag;
						this.loadAdministrativeZones();
						this.loadEnumerationAreasByDzongkhag();
					}
				});
				
				this.locationSelectionService.selectedAdministrativeZone$.subscribe((adminZone) => {
					if (adminZone && adminZone.id !== this.selectedAdministrativeZone?.id) {
						this.selectedAdministrativeZone = adminZone;
						this.loadSubAdministrativeZonesByAdministrativeZone();
						this.loadEnumerationAreas();
					}
				});
				
				this.locationSelectionService.selectedSubAdministrativeZone$.subscribe((subAdminZone) => {
					if (subAdminZone && subAdminZone.id !== this.selectedSubAdministrativeZone?.id) {
						this.selectedSubAdministrativeZone = subAdminZone;
						this.loadEnumerationAreas();
					}
				});
			},
			error: (error) => {
				this.loading = false;
				console.error('Error loading dzongkhags:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load dzongkhags',
					life: 3000,
				});
			},
		});
	}

	loadEnumerationAreasByDzongkhag() {
		if (!this.selectedDzongkhag) return;

		this.loadingEAs = true;
		const withGeom = true; // Always load with geometry
		const includeHierarchy = true; // Always include hierarchy

		this.dzongkhagService
			.getEnumerationAreasByDzongkhag(
				this.selectedDzongkhag.id,
				withGeom,
				includeHierarchy
			)
			.subscribe({
				next: (data) => {
					this.hierarchicalData = data;
					this.enumerationAreas = this.flattenEnumerationAreas(data);
					this.buildHierarchicalTableData(); // Build hierarchical table structure
					this.loadingEAs = false;

					// Load sub-administrative zones for form dropdown
					this.loadSubAdministrativeZonesForDzongkhag();
					// Load GeoJSON for map
					this.loadEnumerationAreaGeoJSON();
				},
				error: (error) => {
					this.loadingEAs = false;
					console.error('Error loading enumeration areas by dzongkhag:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumeration areas',
						life: 3000,
					});
				},
			});
	}

	loadSubAdministrativeZonesForDzongkhag() {
		if (!this.selectedDzongkhag) return;

		// Extract sub-administrative zones from hierarchical data
		if (this.hierarchicalData?.administrativeZones) {
			this.subAdministrativeZones = [];
			this.hierarchicalData.administrativeZones.forEach(
				(adminZone: HierarchicalAdministrativeZone) => {
					if (adminZone.subAdministrativeZones) {
						this.subAdministrativeZones.push(
							...adminZone.subAdministrativeZones.map(
								(subZone: HierarchicalSubAdministrativeZone) => {
									const mappedType =
										subZone.type === 'chiwog'
											? SubAdministrativeZoneType.CHIWOG
											: SubAdministrativeZoneType.LAP;
									return {
										id: subZone.id,
										name: subZone.name,
										areaCode: subZone.areaCode,
										type: mappedType,
										administrativeZoneId: subZone.administrativeZoneId,
										geom: subZone.geom,
									} as SubAdministrativeZone;
								}
							)
						);
					}
				}
			);
		}
	}

	flattenEnumerationAreas(
		hierarchicalData: HierarchicalDzongkhagResponse
	): EnumerationArea[] {
		const flatAreas: EnumerationArea[] = [];

		hierarchicalData.administrativeZones?.forEach(
			(adminZone: HierarchicalAdministrativeZone) => {
				adminZone.subAdministrativeZones?.forEach(
					(subAdminZone: HierarchicalSubAdministrativeZone) => {
						if (subAdminZone.enumerationAreas) {
							flatAreas.push(...subAdminZone.enumerationAreas);
						}
					}
				);
			}
		);

		// Sort by area code in ascending order
		return flatAreas.sort((a, b) => {
			const codeA = (a.areaCode || '').toUpperCase();
			const codeB = (b.areaCode || '').toUpperCase();
			return codeA.localeCompare(codeB);
		});
	}

	buildHierarchicalTableData() {
		this.hierarchicalTableData = [];

		if (!this.hierarchicalData?.administrativeZones) return;

		// Sort Administrative Zones by area code
		const sortedAdminZones = [...this.hierarchicalData.administrativeZones].sort((a, b) => {
			const codeA = (a.areaCode || '').toUpperCase();
			const codeB = (b.areaCode || '').toUpperCase();
			return codeA.localeCompare(codeB);
		});

		sortedAdminZones.forEach(
			(adminZone: HierarchicalAdministrativeZone) => {
				// Add Administrative Zone header row
				this.hierarchicalTableData.push({
					type: 'admin-zone',
					id: `admin-${adminZone.id}`,
					name: adminZone.name,
					areaCode: adminZone.areaCode,
					level: 0,
					isHeader: true,
					totalEAs: this.getAdminZoneEACount(adminZone),
					data: adminZone,
				});

				// Sort Sub-Administrative Zones by area code within each Administrative Zone
				const sortedSubAdminZones = [...(adminZone.subAdministrativeZones || [])].sort((a, b) => {
					const codeA = (a.areaCode || '').toUpperCase();
					const codeB = (b.areaCode || '').toUpperCase();
					return codeA.localeCompare(codeB);
				});

				// Add Sub-Administrative Zones
				sortedSubAdminZones.forEach(
					(subAdminZone: HierarchicalSubAdministrativeZone) => {
						// Add Sub-Administrative Zone header row
						this.hierarchicalTableData.push({
							type: 'sub-admin-zone',
							id: `sub-admin-${subAdminZone.id}`,
							name: subAdminZone.name,
							areaCode: subAdminZone.areaCode,
							level: 1,
							isHeader: true,
							zoneType: subAdminZone.type,
							totalEAs: subAdminZone.enumerationAreas?.length || 0,
							data: subAdminZone,
						});

						// Add Enumeration Areas under this Sub-Administrative Zone
						// Sort enumeration areas by area code before adding to table
						const sortedEAs = [...(subAdminZone.enumerationAreas || [])].sort((a, b) => {
							const codeA = (a.areaCode || '').toUpperCase();
							const codeB = (b.areaCode || '').toUpperCase();
							return codeA.localeCompare(codeB);
						});
						
						sortedEAs.forEach((ea: EnumerationArea) => {
							this.hierarchicalTableData.push({
								type: 'enumeration-area',
								id: `ea-${ea.id}`,
								eaId: ea.id,
								name: ea.name,
								areaCode: ea.areaCode,
								fullEACode: this.getFullEACode(ea, subAdminZone, adminZone),
								description: ea.description,
								level: 2,
								isHeader: false,
								hasGeom: !!ea.geom,
								data: ea,
								parentSubAdminZone: subAdminZone,
								parentAdminZone: adminZone,
							});
						});
					}
				);
			}
		);
	}

	private getAdminZoneEACount(
		adminZone: HierarchicalAdministrativeZone
	): number {
		return (
			adminZone.subAdministrativeZones?.reduce(
				(total: number, subZone: HierarchicalSubAdministrativeZone) =>
					total + (subZone.enumerationAreas?.length || 0),
				0
			) || 0
		);
	}

	onDzongkhagChange() {
		// Save selection to service
		if (this.selectedDzongkhag) {
			this.locationSelectionService.setSelectedDzongkhag(this.selectedDzongkhag);
		}
		
		// Reset selections when dzongkhag changes
		this.selectedAdministrativeZone = null;
		this.locationSelectionService.setSelectedAdministrativeZone(null);
		this.selectedSubAdministrativeZone = null;
		this.locationSelectionService.setSelectedSubAdministrativeZone(null);
		this.administrativeZones = [];
		this.subAdministrativeZones = [];

		if (this.selectedDzongkhag) {
			// Load administrative zones for dropdown
			this.loadAdministrativeZones();
			// Load enumeration areas (which also loads hierarchical data)
			this.loadEnumerationAreas();
		} else {
			this.enumerationAreas = [];
			this.subAdministrativeZones = [];
			this.administrativeZones = [];
			this.hierarchicalData = null;
			this.hierarchicalTableData = [];
			this.enumerationAreaGeoJSON = null;
		}
	}

	loadAdministrativeZones() {
		if (!this.selectedDzongkhag) {
			this.administrativeZones = [];
			return;
		}

		this.administrativeZoneService
			.findAdministrativeZonesByDzongkhag(this.selectedDzongkhag.id)
			.subscribe({
				next: (data) => {
					this.administrativeZones = data || [];
					
					// Restore saved administrative zone if available
					const savedAdminZone = this.locationSelectionService.getSelectedAdministrativeZone();
					if (savedAdminZone && data && data.find(az => az.id === savedAdminZone.id)) {
						this.selectedAdministrativeZone = savedAdminZone;
					}
				},
				error: (error) => {
					console.error('Error loading administrative zones:', error);
					this.administrativeZones = [];
				},
			});
	}

	onAdministrativeZoneChange() {
		// Save selection to service
		if (this.selectedAdministrativeZone) {
			this.locationSelectionService.setSelectedAdministrativeZone(this.selectedAdministrativeZone);
		}
		
		// Reset sub-administrative zone selection when administrative zone changes
		this.selectedSubAdministrativeZone = null;
		this.locationSelectionService.setSelectedSubAdministrativeZone(null);
		this.subAdministrativeZones = [];

		if (this.selectedAdministrativeZone) {
			// Load sub-administrative zones for the selected administrative zone
			this.loadSubAdministrativeZonesByAdministrativeZone();
		}

		// Load enumeration areas based on current selection
		this.loadEnumerationAreas();
	}

	loadSubAdministrativeZonesByAdministrativeZone() {
		if (!this.selectedAdministrativeZone) {
			this.subAdministrativeZones = [];
			return;
		}

		// Try to extract from hierarchical data first
		if (this.hierarchicalData?.administrativeZones) {
			const adminZone = this.hierarchicalData.administrativeZones.find(
				(az) => az.id === this.selectedAdministrativeZone!.id
			);
			if (adminZone?.subAdministrativeZones && adminZone.subAdministrativeZones.length > 0) {
				this.subAdministrativeZones = adminZone.subAdministrativeZones.map(
					(subZone: HierarchicalSubAdministrativeZone) => {
						const mappedType =
							subZone.type === 'chiwog'
								? SubAdministrativeZoneType.CHIWOG
								: SubAdministrativeZoneType.LAP;
						return {
							id: subZone.id,
							name: subZone.name,
							areaCode: subZone.areaCode,
							type: mappedType,
							administrativeZoneId: subZone.administrativeZoneId,
							geom: subZone.geom,
						} as SubAdministrativeZone;
					}
				);
				
				// Restore saved sub-administrative zone if available
				const savedSubAdminZone = this.locationSelectionService.getSelectedSubAdministrativeZone();
				if (savedSubAdminZone && this.subAdministrativeZones.find(saz => saz.id === savedSubAdminZone.id)) {
					this.selectedSubAdministrativeZone = savedSubAdminZone;
				}
				
				return; // Successfully loaded from hierarchical data
			}
		}
		
		// Fallback: always load from service to ensure dropdown is populated
		this.subAdministrativeZoneService
			.findSubAdministrativeZonesByAdministrativeZone(
				this.selectedAdministrativeZone.id
			)
			.subscribe({
				next: (data) => {
					this.subAdministrativeZones = data || [];
					
					// Restore saved sub-administrative zone if available
					const savedSubAdminZone = this.locationSelectionService.getSelectedSubAdministrativeZone();
					if (savedSubAdminZone && data && data.find(saz => saz.id === savedSubAdminZone.id)) {
						this.selectedSubAdministrativeZone = savedSubAdminZone;
					}
				},
				error: (error) => {
					console.error('Error loading sub-administrative zones:', error);
					this.subAdministrativeZones = [];
				},
			});
	}

	onSubAdministrativeZoneChange() {
		// Save selection to service
		if (this.selectedSubAdministrativeZone) {
			this.locationSelectionService.setSelectedSubAdministrativeZone(this.selectedSubAdministrativeZone);
		}
		
		// Load enumeration areas based on current selection
		this.loadEnumerationAreas();
	}

	loadSubAdministrativeZones() {
		// This method is kept for backward compatibility but now uses dzongkhag-based loading
		if (this.selectedDzongkhag) {
			this.loadSubAdministrativeZonesForDzongkhag();
		}
	}

	loadEnumerationAreas() {
		// Priority: Sub-Administrative Zone > Administrative Zone > Dzongkhag
		if (this.selectedSubAdministrativeZone) {
			this.loadEnumerationAreasBySubAdministrativeZone();
		} else if (this.selectedAdministrativeZone) {
			this.loadEnumerationAreasByAdministrativeZone();
		} else if (this.selectedDzongkhag) {
			this.loadEnumerationAreasByDzongkhag();
		} else {
			this.enumerationAreas = [];
			this.hierarchicalTableData = [];
		}
	}

	loadEnumerationAreasBySubAdministrativeZone() {
		if (!this.selectedSubAdministrativeZone) return;

		this.loadingEAs = true;
		this.enumerationAreaService
			.findEnumerationAreasBySubAdministrativeZone(
				this.selectedSubAdministrativeZone.id,
				true, // withGeom
				true // includeSubAdminZone
			)
			.subscribe({
				next: (data) => {
					// Sort by area code in ascending order
					this.enumerationAreas = data.sort((a, b) => {
						const codeA = (a.areaCode || '').toUpperCase();
						const codeB = (b.areaCode || '').toUpperCase();
						return codeA.localeCompare(codeB);
					});
					// Build flat table data for SAZ view (use sorted enumerationAreas)
					this.hierarchicalTableData = this.enumerationAreas.map((ea) => ({
						type: 'enumeration-area',
						id: `ea-${ea.id}`,
						eaId: ea.id,
						name: ea.name,
						areaCode: ea.areaCode,
						fullEACode: this.getFullEACode(ea),
						description: ea.description,
						level: 2,
						data: ea,
						hasGeom: !!ea.geom,
					}));
					this.loadingEAs = false;
					// Load GeoJSON for map
					this.loadEnumerationAreaGeoJSON();
				},
				error: (error) => {
					this.loadingEAs = false;
					console.error(
						'Error loading enumeration areas by sub-administrative zone:',
						error
					);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumeration areas',
						life: 3000,
					});
				},
			});
	}

	loadEnumerationAreasByAdministrativeZone() {
		if (!this.selectedAdministrativeZone) return;

		this.loadingEAs = true;
		this.enumerationAreaService
			.findByAdministrativeZone(
				this.selectedAdministrativeZone.id,
				true, // withGeom
				true // includeSubAdminZone
			)
			.subscribe({
				next: (data) => {
					// Sort by area code in ascending order
					this.enumerationAreas = data.sort((a, b) => {
						const codeA = (a.areaCode || '').toUpperCase();
						const codeB = (b.areaCode || '').toUpperCase();
						return codeA.localeCompare(codeB);
					});
					// Build hierarchical table data for AZ view
					this.buildHierarchicalTableDataForAdministrativeZone(this.enumerationAreas);
					this.loadingEAs = false;
					// Load GeoJSON for map
					this.loadEnumerationAreaGeoJSON();
				},
				error: (error) => {
					this.loadingEAs = false;
					console.error(
						'Error loading enumeration areas by administrative zone:',
						error
					);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumeration areas',
						life: 3000,
					});
				},
			});
	}

	buildHierarchicalTableDataForAdministrativeZone(enumerationAreas: EnumerationArea[]) {
		this.hierarchicalTableData = [];

		if (!this.selectedAdministrativeZone) return;

		// Group enumeration areas by sub-administrative zone
		// Since EAs can have multiple SAZs, we need to handle this differently
		const groupedBySAZ = new Map<number, EnumerationArea[]>();
		enumerationAreas.forEach((ea) => {
			// If EA has subAdministrativeZones array, add it to each SAZ group
			if (ea.subAdministrativeZones && ea.subAdministrativeZones.length > 0) {
				ea.subAdministrativeZones.forEach((saz) => {
					if (!groupedBySAZ.has(saz.id)) {
						groupedBySAZ.set(saz.id, []);
					}
					// Only add if not already in the group (avoid duplicates)
					if (!groupedBySAZ.get(saz.id)!.find(e => e.id === ea.id)) {
						groupedBySAZ.get(saz.id)!.push(ea);
					}
				});
			}
		});

		// Sort enumeration areas within each group by area code
		groupedBySAZ.forEach((eas, sazId) => {
			eas.sort((a, b) => {
				const codeA = (a.areaCode || '').toUpperCase();
				const codeB = (b.areaCode || '').toUpperCase();
				return codeA.localeCompare(codeB);
			});
		});

		// Add Administrative Zone header
		this.hierarchicalTableData.push({
			type: 'admin-zone',
			id: `admin-${this.selectedAdministrativeZone.id}`,
			name: this.selectedAdministrativeZone.name,
			areaCode: this.selectedAdministrativeZone.areaCode,
			level: 0,
			totalEAs: enumerationAreas.length,
		});

		// Sort Sub-Administrative Zones by area code before adding to table
		const sortedSAZEntries = Array.from(groupedBySAZ.entries()).sort(([sazIdA], [sazIdB]) => {
			const sazA = this.subAdministrativeZones.find((s) => s.id === sazIdA);
			const sazB = this.subAdministrativeZones.find((s) => s.id === sazIdB);
			const codeA = (sazA?.areaCode || '').toUpperCase();
			const codeB = (sazB?.areaCode || '').toUpperCase();
			return codeA.localeCompare(codeB);
		});

		// Add Sub-Administrative Zones and their Enumeration Areas
		sortedSAZEntries.forEach(([sazId, eas]) => {
			const saz = this.subAdministrativeZones.find((s) => s.id === sazId);
			if (saz) {
				// Add Sub-Administrative Zone row
				this.hierarchicalTableData.push({
					type: 'sub-admin-zone',
					id: `saz-${saz.id}`,
					name: saz.name,
					areaCode: saz.areaCode,
					level: 1,
					totalEAs: eas.length,
					data: saz,
				});

				// Add Enumeration Area rows (already sorted by area code)
				eas.forEach((ea) => {
					this.hierarchicalTableData.push({
						type: 'enumeration-area',
						id: `ea-${ea.id}`,
						eaId: ea.id,
						name: ea.name,
						areaCode: ea.areaCode,
						fullEACode: this.getFullEACode(ea, saz),
						description: ea.description,
						level: 2,
						data: ea,
						hasGeom: !!ea.geom,
					});
				});
			}
		});
	}

	loadEnumerationAreaGeoJSON() {
		// Priority: Sub-Administrative Zone > Administrative Zone > Dzongkhag
		if (this.selectedSubAdministrativeZone) {
			this.enumerationAreaService
				.getEnumerationAreaGeojsonBySubAdministrativeZone(
					this.selectedSubAdministrativeZone.id
				)
				.subscribe({
					next: (data) => {
						this.enumerationAreaGeoJSON = data;
						if (this.map) {
							this.renderAllEnumerationAreas();
						}
					},
					error: (error) => {
						console.error('Error loading enumeration area GeoJSON:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to load map data',
							life: 3000,
						});
					},
				});
		} else if (this.selectedAdministrativeZone) {
			this.enumerationAreaService
				.findAllAsGeoJsonByAdministrativeZone(
					this.selectedAdministrativeZone.id
				)
				.subscribe({
					next: (data) => {
						this.enumerationAreaGeoJSON = data;
						if (this.map) {
							this.renderAllEnumerationAreas();
						}
					},
					error: (error) => {
						console.error('Error loading enumeration area GeoJSON:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to load map data',
							life: 3000,
						});
					},
				});
		} else if (this.selectedDzongkhag) {
			this.dzongkhagService
				.getEnumerationAreasGeojsonByDzongkhag(this.selectedDzongkhag.id)
				.subscribe({
					next: (data) => {
						this.enumerationAreaGeoJSON = data;
						if (this.map) {
							this.renderAllEnumerationAreas();
						}
					},
					error: (error) => {
						console.error('Error loading enumeration area GeoJSON:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to load map data',
							life: 3000,
						});
					},
				});
		} else {
			this.enumerationAreaGeoJSON = null;
		}
	}

	reloadMap() {
		this.enumerationAreaGeoJSON = undefined;

		if (this.map) {
			this.map.remove();
			this.map = undefined;
		}

		const containerId = 'enumeration-area-map';
		const el = document.getElementById(containerId);
		if (el) {
			setTimeout(() => this.initializeMap(containerId), 100);
		} else {
			this.loadEnumerationAreaGeoJSON();
		}
	}

	// Map Functions
	private initializeMap(containerId: string = 'enumeration-area-map') {
		const container = document.getElementById(containerId);
		if (!container) {
			console.warn(
				`Map container '${containerId}' not found. Skipping map initialization.`
			);
			return;
		}

		if (this.map) {
			this.map.remove();
		}

		this.map = L.map(containerId, {
			center: [27.5142, 90.4336],
			zoom: 10,
			zoomControl: true,
			attributionControl: false,
		});

		// Use basemap service for base layer
		this.baseLayer =
			this.basemapService.createTileLayer(this.selectedBasemapId) ||
			L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '© OpenStreetMap contributors',
			});
		this.baseLayer.addTo(this.map);

		if (!this.enumerationAreaGeoJSON) {
			this.loadEnumerationAreaGeoJSON();
		} else {
			this.renderAllEnumerationAreas();
		}
	}

	private renderAllEnumerationAreas() {
		if (!this.map || !this.enumerationAreaGeoJSON) return;

		if (this.allEnumerationAreasLayer) {
			this.map.removeLayer(this.allEnumerationAreasLayer);
		}

		this.allEnumerationAreasLayer = L.geoJSON(this.enumerationAreaGeoJSON, {
			style: () => ({
				fillColor: '#EC4899',
				fillOpacity: 0.3,
				color: '#DB2777',
				weight: 2,
				opacity: 1,
			}),
			onEachFeature: (feature, layer) => {
				const props = feature.properties;

				// Look up SAZ and AZ names from hierarchical data
				let sazName = 'N/A';
				let azName = 'N/A';

				if (this.hierarchicalData?.administrativeZones) {
					for (const adminZone of this.hierarchicalData.administrativeZones) {
						if (adminZone.subAdministrativeZones) {
							for (const subAdminZone of adminZone.subAdministrativeZones) {
								if (subAdminZone.enumerationAreas) {
									const foundEA = subAdminZone.enumerationAreas.find(
										(ea) => ea.id === props.id
									);
									if (foundEA) {
										sazName = subAdminZone.name || 'N/A';
										azName = adminZone.name || 'N/A';
										break;
									}
								}
							}
						}
					}
				}

				// Fallback to enumerationAreas array if hierarchical lookup fails
				if (sazName === 'N/A' || azName === 'N/A') {
					const ea = this.enumerationAreas.find((area) => area.id === props.id);
					if (ea?.subAdministrativeZones && ea.subAdministrativeZones.length > 0) {
						// Use first SAZ for display, or show multiple
						const sazNames = ea.subAdministrativeZones.map(saz => saz.name).join(', ');
						sazName = sazNames;
						
						// Get AZ from first SAZ
						if (ea.subAdministrativeZones[0]?.administrativeZone?.name) {
							azName = ea.subAdministrativeZones[0].administrativeZone.name;
						}
					}
				}

				// Final fallback to GeoJSON properties
				if (sazName === 'N/A') {
					sazName = props.subAdministrativeZoneName || props.sazName || 'N/A';
				}
				if (azName === 'N/A') {
					azName = props.administrativeZoneName || props.azName || 'N/A';
				}

				const popupContent = `
<div style="padding: 4px; ">
  <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px; color: #111827;">${
		props.name
	}</div>
  <div style="display: grid; gap: 4px; font-size: 13px; margin-bottom: 12px;">
    <div><span style="font-weight: 600; color: #6b7280;">Code:</span> <span style="color: #374151;">${
			props.areaCode || 'N/A'
		}</span></div>
    <div><span style="font-weight: 600; color: #6b7280;">Administrative Zone:</span> <span style="color: #374151;">${
			azName
		}</span></div>
    <div><span style="font-weight: 600; color: #6b7280;">Sub-Administrative Zone(s):</span> <span style="color: #374151;">${
			sazName
		}</span></div>
    <div><span style="font-weight: 600; color: #6b7280;">Description:</span> <span style="color: #374151;">${
			props.description || 'N/A'
		}</span></div>
  </div>
  <button 
    onclick="window.navigateToEADetails(${props.id})"
    style="
      width: 100%;
      padding: 4px 12px;
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

				layer.bindTooltip(props.name, {
					permanent: false,
					direction: 'top',
				});

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
					if (this.allEnumerationAreasLayer) {
						this.allEnumerationAreasLayer.resetStyle(layer as any);
					}
				});
			},
		});

		this.allEnumerationAreasLayer.addTo(this.map);
		this.map.fitBounds(this.allEnumerationAreasLayer.getBounds());
	}

	selectEnumerationAreaFromMap(properties: any) {
		const area = this.enumerationAreas.find(
			(a) => a.id === properties.id || a.areaCode === properties.areaCode
		);
		if (area) {
			this.selectedEnumerationArea = {
				...area,
				description: area.description || '',
			} as EnumerationArea;
		}
	}

	// Table Functions
	selectEnumerationArea(area: EnumerationArea) {
		this.selectedEnumerationArea = area;
	}

	// CRUD Operations
	openNew() {
		this.enumerationAreaForm.reset();
		this.isEditMode = false;
		this.enumerationAreaDialog = true;
	}

	editEnumerationArea(area: EnumerationArea) {
		// Load full EA data with SAZs if not already loaded
		if (!area.subAdministrativeZones || area.subAdministrativeZones.length === 0) {
			this.enumerationAreaService
				.findEnumerationAreaById(area.id, false, true)
				.subscribe({
					next: (fullArea) => {
						this.populateEditForm(fullArea);
					},
					error: (error) => {
						console.error('Error loading enumeration area details:', error);
						// Fallback to basic data
						this.populateEditForm(area);
					},
				});
		} else {
			this.populateEditForm(area);
		}
	}

	private populateEditForm(area: EnumerationArea) {
		const sazIds = area.subAdministrativeZones
			? area.subAdministrativeZones.map((saz) => saz.id)
			: [];
		this.enumerationAreaForm.patchValue({
			name: area.name,
			description: area.description,
			areaCode: area.areaCode,
			subAdministrativeZoneIds: sazIds,
		});
		this.selectedEnumerationArea = area;
		this.isEditMode = true;
		this.enumerationAreaDialog = true;
	}

	saveEnumerationArea() {
		if (this.enumerationAreaForm.invalid) return;

		const formData = this.enumerationAreaForm.value;
		
		// Ensure subAdministrativeZoneIds is an array
		if (!Array.isArray(formData.subAdministrativeZoneIds)) {
			formData.subAdministrativeZoneIds = formData.subAdministrativeZoneIds 
				? [formData.subAdministrativeZoneIds] 
				: [];
		}

		if (this.isEditMode && this.selectedEnumerationArea) {
			const updateData: UpdateEnumerationAreaDto = {
				name: formData.name,
				description: formData.description,
				areaCode: formData.areaCode,
				subAdministrativeZoneIds: formData.subAdministrativeZoneIds,
			};
			this.enumerationAreaService
				.updateEnumerationArea(this.selectedEnumerationArea.id, updateData)
				.subscribe({
					next: () => {
						this.loadEnumerationAreas();
						this.enumerationAreaDialog = false;
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Enumeration area updated successfully',
							life: 3000,
						});
					},
					error: (error) => {
						console.error('Error updating enumeration area:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to update enumeration area',
							life: 3000,
						});
					},
				});
		} else {
			const createData: CreateEnumerationAreaDto = {
				name: formData.name,
				description: formData.description,
				areaCode: formData.areaCode,
				subAdministrativeZoneIds: formData.subAdministrativeZoneIds,
			};
			this.enumerationAreaService.createEnumerationArea(createData).subscribe({
				next: () => {
					this.loadEnumerationAreas();
					this.enumerationAreaDialog = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Enumeration area created successfully',
						life: 3000,
					});
				},
				error: (error) => {
					console.error('Error creating enumeration area:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to create enumeration area',
						life: 3000,
					});
				},
			});
		}
	}

	confirmDelete(area: EnumerationArea) {
		this.selectedEnumerationArea = area;
		this.deleteDialog = true;
	}

	deleteEnumerationArea() {
		if (this.selectedEnumerationArea) {
			this.enumerationAreaService
				.deleteEnumerationArea(this.selectedEnumerationArea.id)
				.subscribe({
					next: () => {
						this.loadEnumerationAreas();
						this.deleteDialog = false;
						this.selectedEnumerationArea = null;
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Enumeration area deleted successfully',
							life: 3000,
						});
					},
					error: (error) => {
						console.error('Error deleting enumeration area:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to delete enumeration area',
							life: 3000,
						});
					},
				});
		}
	}

	// Utility functions
	clear(table: any) {
		table.clear();
		this.globalFilterValue = '';
	}

	onRowSelectHierarchical(item: any) {
		if (item.type === 'enumeration-area') {
			this.selectedEnumerationArea = {
				...item.data,
				description: item.data.description || '',
			} as EnumerationArea;
		}
	}

	onGlobalFilterSplit(event: Event) {
		const target = event.target as HTMLInputElement;
		this.globalFilterValue = target.value;
		if (this.dtSplit) {
			this.dtSplit.filterGlobal(target.value, 'contains');
		}
	}

	clearSearch(): void {
		this.globalFilterValue = '';
		if (this.dtSplit) {
			this.dtSplit.filterGlobal('', 'contains');
		}
	}

	getSubAdministrativeZoneName(subAdministrativeZoneId: number): string {
		const zone = this.subAdministrativeZones.find(
			(z) => z.id === subAdministrativeZoneId
		);
		return zone?.name || 'N/A';
	}

	getSubAdministrativeZoneNames(subAdministrativeZoneIds: number[]): string {
		if (!subAdministrativeZoneIds || subAdministrativeZoneIds.length === 0) {
			return 'N/A';
		}
		const names = subAdministrativeZoneIds
			.map((id) => {
				const zone = this.subAdministrativeZones.find((z) => z.id === id);
				return zone?.name || `ID: ${id}`;
			})
			.filter((name) => name !== 'N/A');
		return names.length > 0 ? names.join(', ') : 'N/A';
	}

	hasFormError(field: string): boolean {
		const control = this.enumerationAreaForm.get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	getFormError(field: string): string {
		const control = this.enumerationAreaForm.get(field);
		if (control?.errors) {
			if (control.errors['required']) return `${field} is required`;
			if (control.errors['minlength']) return `${field} is too short`;
			if (control.errors['pattern']) return `${field} format is invalid`;
			if (control.errors['min']) return `${field} must be positive`;
			if (control.errors['arrayMinLength']) {
				return `At least one Sub-Administrative Zone is required`;
			}
		}
		return '';
	}

	// Upload GeoJSON functionality
	openUploadGeojson(area: EnumerationArea) {
		this.selectedEnumerationArea = area;
		this.selectedFile = null;
		this.uploadGeojsonDialog = true;
	}

	onFileSelect(event: any) {
		const files = event.files;
		if (files && files.length > 0) {
			this.selectedFile = files[0];
		}
	}

	uploadGeojson() {
		if (!this.selectedEnumerationArea || !this.selectedFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select a file to upload',
				life: 3000,
			});
			return;
		}

		this.uploadLoading = true;
		this.enumerationAreaService
			.uploadGeojsonByEnumerationArea(
				this.selectedEnumerationArea.id,
				this.selectedFile
			)
			.subscribe({
				next: (response) => {
					this.uploadLoading = false;
					this.uploadGeojsonDialog = false;
					this.selectedFile = null;
					this.loadEnumerationAreas();
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'GeoJSON uploaded successfully',
						life: 3000,
					});
				},
				error: (error) => {
					this.uploadLoading = false;
					console.error('Error uploading GeoJSON:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to upload GeoJSON',
						life: 5000,
					});
				},
			});
	}

	// Bulk Upload functionality
	openBulkUpload() {
		this.bulkUploadFile = null;
		this.bulkUploadResults = null;
		this.bulkUploadDialog = true;
	}

	onBulkFileSelect(event: any) {
		const files = event.files;
		if (files && files.length > 0) {
			this.bulkUploadFile = files[0];
			this.bulkUploadResults = null; // Reset results when new file is selected
		}
	}

	executeBulkUpload() {
		if (!this.bulkUploadFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select a file to upload',
				life: 3000,
			});
			return;
		}

		this.bulkUploadLoading = true;
		this.enumerationAreaService
			.bulkUploadGeojson(this.bulkUploadFile)
			.subscribe({
				next: (response) => {
					this.bulkUploadLoading = false;
					this.bulkUploadResults = response;

					// Show summary message
					const successCount = response.success;
					const skippedCount = response.skipped;
					const errorCount = response.errors.length;

					if (successCount > 0) {
						this.messageService.add({
							severity: 'success',
							summary: 'Bulk Upload Complete',
							detail: `Successfully created ${successCount} enumeration area(s)`,
							life: 5000,
						});
					}

					if (skippedCount > 0) {
						this.messageService.add({
							severity: 'info',
							summary: 'Skipped Items',
							detail: `${skippedCount} area(s) already exist`,
							life: 5000,
						});
					}

					if (errorCount > 0) {
						this.messageService.add({
							severity: 'warn',
							summary: 'Errors Encountered',
							detail: `${errorCount} feature(s) failed to process`,
							life: 5000,
						});
					}

					// Reload the enumeration areas list
					this.loadEnumerationAreas();

					// Reload map if needed
					if (this.map && successCount > 0) {
						this.reloadMap();
					}
				},
				error: (error) => {
					this.bulkUploadLoading = false;
					console.error('Error bulk uploading GeoJSON:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to bulk upload GeoJSON',
						life: 5000,
					});
				},
			});
	}

	closeBulkUpload() {
		this.bulkUploadDialog = false;
		this.bulkUploadFile = null;
		this.bulkUploadResults = null;
	}

	// Navigate to detail viewer
	viewEnumerationAreaDetails(area: EnumerationArea) {
		this.router.navigate(['/admin/data-view/eazone', area.id]);
	}

	// Navigate to sub-administrative zone detail viewer
	viewSubAdministrativeZoneDetails(subAdminZone: any) {
		this.router.navigate(['/admin/data-view/sub-admzone', subAdminZone.id]);
	}

	// Additional computed properties for statistics
	get administrativeZoneCount(): number {
		return this.hierarchicalData?.administrativeZones?.length || 0;
	}

	get subAdministrativeZoneCount(): number {
		return this.subAdministrativeZones.length;
	}

	/**
	 * Generate full EA code from hierarchy: DZ-AZ-SAZ-EA
	 */
	getFullEACode(
		ea: EnumerationArea,
		subAdminZone?: HierarchicalSubAdministrativeZone | SubAdministrativeZone,
		adminZone?: HierarchicalAdministrativeZone | AdministrativeZone
	): string {
		const parts: string[] = [];
		
		// Try to get from EA's relationship data first
		if (ea.subAdministrativeZones && ea.subAdministrativeZones.length > 0) {
			const firstSaz = ea.subAdministrativeZones[0];
			if (firstSaz.administrativeZone?.dzongkhag?.areaCode) {
				parts.push(firstSaz.administrativeZone.dzongkhag.areaCode);
			} else if (this.selectedDzongkhag?.areaCode) {
				parts.push(this.selectedDzongkhag.areaCode);
			}
			
			// Get administrative zone code
			if (firstSaz.administrativeZone?.areaCode) {
				parts.push(firstSaz.administrativeZone.areaCode);
			} else if (adminZone?.areaCode) {
				parts.push(adminZone.areaCode);
			} else if (this.selectedAdministrativeZone?.areaCode) {
				parts.push(this.selectedAdministrativeZone.areaCode);
			}
			
			// Get sub-administrative zone code (use first SAZ if multiple)
			parts.push(firstSaz.areaCode || '');
		} else if (subAdminZone?.areaCode) {
			parts.push(subAdminZone.areaCode);
		} else if (this.selectedSubAdministrativeZone?.areaCode) {
			parts.push(this.selectedSubAdministrativeZone.areaCode);
		} else if (this.selectedDzongkhag?.areaCode) {
			parts.push(this.selectedDzongkhag.areaCode);
		}
		
		// Get EA code
		if (ea.areaCode) {
			parts.push(ea.areaCode);
		}
		
		return parts.length > 0 ? parts.join('') : ea.areaCode || 'N/A';
	}

	switchBasemap(): void {
		if (!this.map || !this.basemapService.hasBasemap(this.selectedBasemapId)) {
			console.error(`Basemap ${this.selectedBasemapId} not found`);
			return;
		}

		// Remove existing basemap layer
		if (this.baseLayer) {
			this.map.removeLayer(this.baseLayer);
			this.baseLayer = undefined;
		}

		// Add new basemap layer
		this.baseLayer =
			this.basemapService.createTileLayer(this.selectedBasemapId) || undefined;

		if (this.baseLayer) {
			this.baseLayer.addTo(this.map);
			this.baseLayer.bringToBack();
		}
	}
}
