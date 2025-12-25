import { Component, OnInit } from '@angular/core';
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

@Component({
	selector: 'app-admin-public-page-settings',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
	templateUrl: './admin-public-page-settings.component.html',
	styleUrl: './admin-public-page-settings.component.css',
})
export class AdminPublicPageSettingsComponent implements OnInit {
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

	basemapCategories: Record<
		string,
		{ label: string; basemaps: BasemapConfig[] }
	> = {};

	basemapOptions: { label: string; value: string }[] = [];

	visualizationModeOptions = [
		{ label: 'Households', value: 'households' },
		{ label: 'Enumeration Areas', value: 'enumerationAreas' },
	];

	colorScaleOptions: { label: string; value: ColorScaleType }[] = [];

	loading = false;
	saving = false;
	resetting = false;

	constructor(
		private publicPageSettingsService: PublicPageSettingsService,
		private basemapService: BasemapService,
		private colorScaleService: MapFeatureColorService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		// Initialize basemap categories
		this.basemapCategories = this.basemapService.getBasemapCategories();
		this.buildBasemapOptions();

		// Initialize color scale options
		this.colorScaleOptions = this.colorScaleService.getAvailableColorScales();

		// Load current settings from API
		this.loadSettings();
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
	 * Load settings from API
	 */
	loadSettings(): void {
		this.loading = true;
		this.publicPageSettingsService.getAdminSettings().subscribe({
			next: (settings) => {
				this.settings = settings;
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading settings:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Load Failed',
					detail:
						'Failed to load public page settings. Using default values.',
					life: 5000,
				});
				// Use default settings on error
				this.settings = this.publicPageSettingsService.getDefaultSettings();
				this.loading = false;
			},
		});
	}

	/**
	 * Save settings to API
	 */
	saveSettings(): void {
		this.saving = true;
		this.publicPageSettingsService.updateSettings(this.settings).subscribe({
			next: (settings) => {
				this.settings = settings;
				this.saving = false;
				this.messageService.add({
					severity: 'success',
					summary: 'Settings Saved',
					detail: 'Public page settings have been saved successfully.',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error saving settings:', error);
				this.saving = false;
				const errorMessage =
					error?.error?.message ||
					error?.message ||
					'Failed to save public page settings. Please try again.';
				this.messageService.add({
					severity: 'error',
					summary: 'Save Failed',
					detail: errorMessage,
					life: 5000,
				});
			},
		});
	}

	/**
	 * Reset settings to defaults via API
	 */
	resetSettings(): void {
		this.resetting = true;
		this.publicPageSettingsService.resetSettings().subscribe({
			next: (settings) => {
				this.settings = settings;
				this.resetting = false;
				this.messageService.add({
					severity: 'info',
					summary: 'Settings Reset',
					detail: 'Public page settings have been reset to default values.',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error resetting settings:', error);
				this.resetting = false;
				const errorMessage =
					error?.error?.message ||
					error?.message ||
					'Failed to reset public page settings. Please try again.';
				this.messageService.add({
					severity: 'error',
					summary: 'Reset Failed',
					detail: errorMessage,
					life: 5000,
				});
			},
		});
	}

	/**
	 * Get the CSS gradient for the selected color scale preview
	 */
	getColorScalePreview(): string {
		// Cast to ColorScaleType - API may return values not in ColorScaleType (gray, viridis, plasma)
		// but for preview we'll use a valid type or default to 'blue'
		const colorScale = this.settings.colorScale as ColorScaleType;
		const validColorScale: ColorScaleType = 
			['blue', 'green', 'red', 'yellow', 'purple', 'orange'].includes(colorScale)
				? colorScale
				: 'blue';
		return this.colorScaleService.getLegendGradient(
			0,
			100,
			'horizontal',
			validColorScale
		);
	}
}

