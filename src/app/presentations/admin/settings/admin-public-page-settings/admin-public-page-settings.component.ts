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

	constructor(
		private publicPageSettingsService: PublicPageSettingsService,
		private basemapService: BasemapService,
		private colorScaleService: MapFeatureColorService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		// Load current settings
		this.settings = this.publicPageSettingsService.getSettings();

		// Initialize basemap categories
		this.basemapCategories = this.basemapService.getBasemapCategories();
		this.buildBasemapOptions();

		// Initialize color scale options
		this.colorScaleOptions = this.colorScaleService.getAvailableColorScales();
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
	 * Save settings to localStorage
	 */
	saveSettings(): void {
		this.publicPageSettingsService.saveSettings(this.settings);
		this.messageService.add({
			severity: 'success',
			summary: 'Settings Saved',
			detail: 'Public page settings have been saved successfully.',
			life: 3000,
		});
	}

	/**
	 * Reset settings to defaults
	 */
	resetSettings(): void {
		const defaultSettings = this.publicPageSettingsService.getDefaultSettings();
		this.settings = { ...defaultSettings };
		this.publicPageSettingsService.resetSettings();
		this.messageService.add({
			severity: 'info',
			summary: 'Settings Reset',
			detail: 'Public page settings have been reset to default values.',
			life: 3000,
		});
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

