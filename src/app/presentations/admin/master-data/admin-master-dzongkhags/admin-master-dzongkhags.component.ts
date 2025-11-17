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
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import {
	Dzongkhag,
	CreateDzongkhagDto,
	UpdateDzongkhagDto,
} from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { PrimeNgModules } from '../../../../primeng.modules';
import { Table } from 'primeng/table';
import * as L from 'leaflet';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
	selector: 'app-admin-master-dzongkhags',
	templateUrl: './admin-master-dzongkhags.component.html',
	styleUrls: ['./admin-master-dzongkhags.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],

	providers: [ConfirmationService, MessageService],
})
export class AdminMasterDzongkhagsComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	// Table references
	@ViewChild('dt') dt!: Table;
	@ViewChild('dtSplit') dtSplit!: Table;

	// Data properties
	dzongkhags: Dzongkhag[] = [];
	selectedDzongkhag: Dzongkhag | null = null;
	loading = false;

	// Map properties
	private map?: L.Map;
	dzongkhagGeoJSON: any; // Make public for template access
	private allDzongkhagsLayer?: L.GeoJSON;
	private baseLayer?: L.TileLayer;

	// View control
	currentView: 'table' | 'split' = 'table';

	// Dialog states
	dzongkhagDialog = false;
	deleteDialog = false;
	uploadGeojsonDialog = false;

	// Form
	dzongkhagForm: FormGroup;
	isEditMode = false;

	// Upload properties
	selectedFile: File | null = null;
	uploadLoading = false;

	// Table properties
	globalFilterValue = '';

	constructor(
		private dzongkhagService: DzongkhagDataService,
		private fb: FormBuilder,
		private messageService: MessageService,
		private router: Router
	) {
		this.dzongkhagForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			areaCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],
			areaSqKm: ['', [Validators.required, Validators.min(0)]],
		});
	}

	ngOnInit() {
		this.loadDzongkhags();
	}

	ngAfterViewInit() {
		// Map initialization will happen when views are switched or tabs are changed
	}

	// View Management
	switchView(view: 'table' | 'split') {
		this.currentView = view;
		if (view === 'split') {
			// Initialize map for split view after DOM is ready
			setTimeout(() => this.initializeMap(), 100);
		}
	}

	// Handle tab change for map initialization
	onTabChange(event: any) {
		// Initialize map when Geographic View tab is selected (index 1)
		if (event.index === 1) {
			setTimeout(() => this.initializeMap('dzongkhag-map-tab'), 100);
		}
	}

	ngOnDestroy() {
		if (this.map) {
			this.map.remove();
		}
	}

	loadDzongkhags() {
		this.loading = true;
		this.dzongkhagService.findAllDzongkhags().subscribe({
			next: (data) => {
				this.dzongkhags = data;
				this.loading = false;
			},
			error: (error) => {
				this.loading = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load dzongkhags',
					life: 3000,
				});
			},
		});
	}

	loadDzongkhagGeoJSON() {
		this.dzongkhagService.getAllDzongkhagGeojson().subscribe({
			next: (data) => {
				this.dzongkhagGeoJSON = data;
				if (this.map) {
					this.renderAllDzongkhags();
				}
			},
			error: (error) => {
				console.error('Error loading dzongkhag GeoJSON:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load map data',
					life: 3000,
				});
			},
		});
	}

	reloadMap() {
		this.dzongkhagGeoJSON = undefined;

		if (this.map) {
			this.map.remove();
			this.map = undefined;
		}

		// Decide which container exists in DOM
		let containerId = 'dzongkhag-map';
		// Prefer tab container when table view is active and the tab exists
		if (this.currentView === 'table') {
			if (document.getElementById('dzongkhag-map-tab')) {
				containerId = 'dzongkhag-map-tab';
			} else if (document.getElementById('dzongkhag-map')) {
				containerId = 'dzongkhag-map';
			}
		} else {
			// split view
			containerId = 'dzongkhag-map';
		}

		const el = document.getElementById(containerId);
		// If the container exists, initialize the map immediately, otherwise just reload data
		if (el) {
			setTimeout(() => this.initializeMap(containerId), 100);
		} else {
			this.loadDzongkhagGeoJSON();
		}
	}

	// Map Functions
	private initializeMap(containerId: string = 'dzongkhag-map') {
		// Check if container exists before initializing
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
			center: [27.5142, 90.4336], // Center of Bhutan
			zoom: 7,
			zoomControl: true,
			attributionControl: false,
		});

		// Add base layer
		this.baseLayer = L.tileLayer(
			'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
			{
				maxZoom: 19,
				attribution: '© OpenStreetMap contributors',
			}
		);
		this.baseLayer.addTo(this.map);

		// Load GeoJSON if not already loaded
		if (!this.dzongkhagGeoJSON) {
			this.loadDzongkhagGeoJSON();
		} else {
			this.renderAllDzongkhags();
		}
	}

	private renderAllDzongkhags() {
		if (!this.map || !this.dzongkhagGeoJSON) return;

		// Remove existing layer
		if (this.allDzongkhagsLayer) {
			this.map.removeLayer(this.allDzongkhagsLayer);
		}

		this.allDzongkhagsLayer = L.geoJSON(this.dzongkhagGeoJSON, {
			style: (feature) => ({
				fillColor: '#3B82F6',
				fillOpacity: 0.3,
				color: '#1D4ED8',
				weight: 2,
				opacity: 1,
			}),
			onEachFeature: (feature, layer) => {
				const props = feature.properties;

				// Bind popup
				layer.bindPopup(`
          <div class="p-3">
            <p class="font-bold text-lg p-0 m-0">${props.name}</p>
            <p class="p-0 m-0"><strong>Dzongkhag Code:</strong> ${props.areaCode}</p>
            <p><strong>Area:</strong> ${props.areaSqKm} km²</p>
          </div>
        `);

				// Bind tooltip
				layer.bindTooltip(props.name, {
					permanent: false,
					direction: 'top',
				});

				// Click event
				layer.on('click', () => {
					this.selectDzongkhagFromMap(props);
				});

				// Hover effects
				layer.on('mouseover', () => {
					(layer as any).setStyle({
						fillOpacity: 0.7,
						weight: 3,
					});
				});

				layer.on('mouseout', () => {
					if (this.allDzongkhagsLayer) {
						this.allDzongkhagsLayer.resetStyle(layer as any);
					}
				});
			},
		});

		this.allDzongkhagsLayer.addTo(this.map);
		this.map.fitBounds(this.allDzongkhagsLayer.getBounds());
	}

	selectDzongkhagFromMap(properties: any) {
		// Find the dzongkhag in our data by matching properties
		const dzongkhag = this.dzongkhags.find(
			(d) => d.id === properties.id || d.areaCode === properties.areaCode
		);
		if (dzongkhag) {
			this.selectedDzongkhag = dzongkhag;
		}
	}

	// Table Functions
	selectDzongkhag(dzongkhag: Dzongkhag) {
		this.selectedDzongkhag = dzongkhag;
	}

	// CRUD Operations
	openNew() {
		this.dzongkhagForm.reset();
		this.isEditMode = false;
		this.dzongkhagDialog = true;
	}

	/**
	 * Navigate to dzongkhag data viewer
	 */
	viewDzongkhagData(dzongkhag: Dzongkhag) {
		this.router.navigate(['/admin/data-view/dzongkhag', dzongkhag.id]);
	}

	editDzongkhag(dzongkhag: Dzongkhag) {
		this.dzongkhagForm.patchValue({
			name: dzongkhag.name,
			areaCode: dzongkhag.areaCode,
			areaSqKm: dzongkhag.areaSqKm,
		});
		this.selectedDzongkhag = dzongkhag;
		this.isEditMode = true;
		this.dzongkhagDialog = true;
	}

	saveDzongkhag() {
		if (this.dzongkhagForm.invalid) return;

		const formData = this.dzongkhagForm.value;

		if (this.isEditMode && this.selectedDzongkhag) {
			const updateData: UpdateDzongkhagDto = formData;
			this.dzongkhagService
				.updateDzongkhag(this.selectedDzongkhag.id, updateData)
				.subscribe({
					next: () => {
						this.loadDzongkhags();
						this.dzongkhagDialog = false;
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Dzongkhag updated successfully',
							life: 3000,
						});
					},
					error: (error) => {
						console.error('Error updating dzongkhag:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to update dzongkhag',
							life: 3000,
						});
					},
				});
		} else {
			const createData: CreateDzongkhagDto = formData;
			this.dzongkhagService.createDzongkhag(createData).subscribe({
				next: () => {
					this.loadDzongkhags();
					this.dzongkhagDialog = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Dzongkhag created successfully',
						life: 3000,
					});
				},
				error: (error) => {
					console.error('Error creating dzongkhag:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to create dzongkhag',
						life: 3000,
					});
				},
			});
		}
	}

	confirmDelete(dzongkhag: Dzongkhag) {
		this.selectedDzongkhag = dzongkhag;
		this.deleteDialog = true;
	}

	deleteDzongkhag() {
		if (this.selectedDzongkhag) {
			this.dzongkhagService
				.deleteDzongkhag(this.selectedDzongkhag.id)
				.subscribe({
					next: () => {
						this.loadDzongkhags();
						this.deleteDialog = false;
						this.selectedDzongkhag = null;
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Dzongkhag deleted successfully',
							life: 3000,
						});
					},
					error: (error) => {
						console.error('Error deleting dzongkhag:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to delete dzongkhag',
							life: 3000,
						});
					},
				});
		}
	}

	// Upload GeoJSON Operations
	openUploadGeojson(dzongkhag: Dzongkhag) {
		this.selectedDzongkhag = dzongkhag;
		this.selectedFile = null;
		this.uploadGeojsonDialog = true;
	}

	onFileSelect(event: any) {
		const file = event.files?.[0];
		if (file) {
			// Validate file type
			if (!file.name.endsWith('.json') && !file.name.endsWith('.geojson')) {
				this.messageService.add({
					severity: 'warn',
					summary: 'Invalid File',
					detail: 'Please select a valid GeoJSON file (.json or .geojson)',
					life: 3000,
				});
				return;
			}
			this.selectedFile = file;
		}
	}

	uploadGeojson() {
		if (!this.selectedDzongkhag || !this.selectedFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Missing Information',
				detail: 'Please select a dzongkhag and a file',
				life: 3000,
			});
			return;
		}

		this.uploadLoading = true;
		this.dzongkhagService
			.uploadGeojsonByDzongkhag(this.selectedDzongkhag.id, this.selectedFile)
			.subscribe({
				next: (response) => {
					console.log('GeoJSON uploaded successfully:', response);
					this.uploadLoading = false;
					this.uploadGeojsonDialog = false;
					this.selectedFile = null;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'GeoJSON uploaded successfully',
						life: 3000,
					});
					// Reload data and map
					this.loadDzongkhags();
					this.reloadMap();
				},
				error: (error) => {
					console.error('Error uploading GeoJSON:', error);
					console.log(this.selectedFile);
					this.uploadLoading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Upload Failed',
						detail: error?.error?.message || 'Failed to upload GeoJSON',
						life: 5000,
					});
				},
			});
	}

	cancelUpload() {
		this.uploadGeojsonDialog = false;
		this.selectedFile = null;
		this.selectedDzongkhag = null;
	}

	// Utility functions
	clear(table: any) {
		table.clear();
		this.globalFilterValue = '';
	}

	// Calculate total area
	get totalArea(): number {
		return this.dzongkhags.reduce((sum, d) => {
			const area =
				typeof d.areaSqKm === 'string' ? parseFloat(d.areaSqKm) : d.areaSqKm;
			return sum + (isNaN(area) ? 0 : area);
		}, 0);
	}

	// Calculate average area
	get averageArea(): number {
		return this.dzongkhags.length ? this.totalArea / this.dzongkhags.length : 0;
	}

	// Handle row selection properly
	onRowSelect(event: any) {
		if (event.data) {
			this.selectDzongkhag(event.data);
		}
	}

	// Global filter methods
	onGlobalFilter(event: Event) {
		const target = event.target as HTMLInputElement;
		this.globalFilterValue = target.value;
		if (this.dt) {
			this.dt.filterGlobal(target.value, 'contains');
		}
		if (this.dtSplit) {
			this.dtSplit.filterGlobal(target.value, 'contains');
		}
	}

	onGlobalFilterSplit(event: Event) {
		const target = event.target as HTMLInputElement;
		this.globalFilterValue = target.value;
		if (this.dtSplit) {
			this.dtSplit.filterGlobal(target.value, 'contains');
		}
	}

	// Safe number conversion for display
	getSafeAreaValue(area: any): number {
		const value = typeof area === 'string' ? parseFloat(area) : area;
		return isNaN(value) ? 0 : value;
	}

	hasFormError(field: string): boolean {
		const control = this.dzongkhagForm.get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	getFormError(field: string): string {
		const control = this.dzongkhagForm.get(field);
		if (control?.errors) {
			if (control.errors['required']) return `${field} is required`;
			if (control.errors['minlength']) return `${field} is too short`;
			if (control.errors['pattern']) return `${field} format is invalid`;
			if (control.errors['min']) return `${field} must be positive`;
		}
		return '';
	}
}
