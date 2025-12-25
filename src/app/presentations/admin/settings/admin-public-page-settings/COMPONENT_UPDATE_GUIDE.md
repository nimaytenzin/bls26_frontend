# Component Update Guide

This guide shows how to update the admin component to work with the new API-based service.

## Changes Required

### 1. Update Component to Handle Async Operations

The component needs to be updated to handle Observable-based methods instead of synchronous localStorage operations.

### Updated Component Code

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import {
	PublicPageSettings,
	PublicPageSettingsService,
} from '../../../../core/services/public-page-settings.service';
import { BasemapService, BasemapConfig } from '../../../../core/utility/basemap.service';
import {
	MapFeatureColorService,
	ColorScaleType,
} from '../../../../core/utility/map-feature-color.service';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-admin-public-page-settings',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
	templateUrl: './admin-public-page-settings.component.html',
	styleUrl: './admin-public-page-settings.component.css',
})
export class AdminPublicPageSettingsComponent implements OnInit, OnDestroy {
	settings: PublicPageSettings = {
		mapVisualizationMode: 'households',
		selectedBasemapId: 'positron',
		colorScale: 'blue',
		nationalDataViewerTitle: 'National Sampling Frame',
		nationalDataViewerDescription: 'Current statistics on households and enumeration areas',
		nationalDataViewerInfoBoxContent:
			'A sampling frame is a population from which a sample can be drawn, ensuring survey samples are representative and reliable.',
		nationalDataViewerInfoBoxStats: '3,310 EAs total (1,464 urban, 1,846 rural)',
	};

	loading = false;
	saving = false;
	private subscriptions = new Subscription();

	basemapCategories: Record<string, { label: string; basemaps: BasemapConfig[] }> = {};
	basemapOptions: { label: string; value: string }[] = [];

	visualizationModeOptions = [
		{ label: 'Households', value: 'households' },
		{ label: 'Enumeration Areas', value: 'enumerationAreas' },
	];

	colorScaleOptions: { label: string; value: ColorScaleType }[] = [];

	constructor(
		private publicPageSettingsService: PublicPageSettingsService,
		private basemapService: BasemapService,
		private colorScaleService: MapFeatureColorService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		// Load settings from API
		this.loadSettings();

		// Initialize basemap categories
		this.basemapCategories = this.basemapService.getBasemapCategories();
		this.buildBasemapOptions();

		// Initialize color scale options
		this.colorScaleOptions = this.colorScaleService.getAvailableColorScales();

		// Subscribe to settings updates
		const settingsSub = this.publicPageSettingsService.settings$.subscribe(
			(settings) => {
				if (settings) {
					this.settings = { ...settings };
				}
			}
		);
		this.subscriptions.add(settingsSub);
	}

	ngOnDestroy() {
		this.subscriptions.unsubscribe();
	}

	/**
	 * Load settings from API
	 */
	private loadSettings(): void {
		this.loading = true;
		const loadSub = this.publicPageSettingsService.loadSettings().subscribe({
			next: (settings) => {
				this.settings = { ...settings };
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading settings:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error Loading Settings',
					detail: 'Failed to load public page settings. Using default values.',
					life: 5000,
				});
				this.loading = false;
				// Use default settings on error
				this.settings = this.publicPageSettingsService.getDefaultSettings();
			},
		});
		this.subscriptions.add(loadSub);
	}

	/**
	 * Build basemap options for dropdown
	 */
	private buildBasemapOptions(): void {
		this.basemapOptions = [];
		Object.keys(this.basemapCategories).forEach((categoryKey) => {
			const category = this.basemapCategories[categoryKey];
			category.basemaps.forEach((basemap) => {
				this.basemapOptions.push({
					label: `${category.label} - ${basemap.name}`,
					value: basemap.id,
				});
			});
		});
	}

	/**
	 * Save settings to API
	 */
	saveSettings(): void {
		this.saving = true;
		const saveSub = this.publicPageSettingsService
			.saveSettings(this.settings)
			.subscribe({
				next: (savedSettings) => {
					this.settings = { ...savedSettings };
					this.messageService.add({
						severity: 'success',
						summary: 'Settings Saved',
						detail: 'Public page settings have been saved successfully.',
						life: 3000,
					});
					this.saving = false;
				},
				error: (error) => {
					console.error('Error saving settings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error Saving Settings',
						detail: 'Failed to save public page settings. Please try again.',
						life: 5000,
					});
					this.saving = false;
				},
			});
		this.subscriptions.add(saveSub);
	}

	/**
	 * Reset settings to defaults
	 */
	resetSettings(): void {
		this.saving = true;
		const resetSub = this.publicPageSettingsService.resetSettings().subscribe({
			next: (resetSettings) => {
				this.settings = { ...resetSettings };
				this.messageService.add({
					severity: 'info',
					summary: 'Settings Reset',
					detail: 'Public page settings have been reset to default values.',
					life: 3000,
				});
				this.saving = false;
			},
			error: (error) => {
				console.error('Error resetting settings:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error Resetting Settings',
					detail: 'Failed to reset public page settings. Please try again.',
					life: 5000,
				});
				this.saving = false;
			},
		});
		this.subscriptions.add(resetSub);
	}

	/**
	 * Get the CSS gradient for the selected color scale preview
	 */
	getColorScalePreview(): string {
		return this.colorScaleService.getLegendGradient(
			0,
			100,
			'horizontal',
			this.settings.colorScale || 'blue'
		);
	}
}
```

### 2. Update Template for Loading States (Optional)

You may want to add loading indicators to the template:

```html
<!-- Add loading overlay -->
<div *ngIf="loading" class="loading-overlay">
  <p-progressSpinner></p-progressSpinner>
</div>

<!-- Disable buttons while saving -->
<p-button
  label="Reset to Defaults"
  icon="pi pi-refresh"
  severity="secondary"
  (click)="resetSettings()"
  [outlined]="true"
  [disabled]="saving || loading"
></p-button>
<p-button
  label="Save Settings"
  icon="pi pi-save"
  (click)="saveSettings()"
  [disabled]="saving || loading"
  [loading]="saving"
></p-button>
```

## Migration Checklist

- [ ] Backend API endpoints are implemented and tested
- [ ] Database table is created and migrated
- [ ] Frontend dataservice is created
- [ ] Frontend service is updated to use API
- [ ] Component is updated to handle async operations
- [ ] Loading states are added
- [ ] Error handling is implemented
- [ ] Component is tested with API
- [ ] Public page (consumer) is updated to use new service
- [ ] Remove old localStorage code after verification

