import { Injectable } from '@angular/core';

/**
 * Service for managing map feature colors including single features,
 * graduated (continuous) color scales, and categorized (discrete) values
 */
@Injectable({
	providedIn: 'root',
})
export class MapFeatureColorService {
	/**
	 * Blue gradient color scale from dark to light (for graduated/choropleth maps)
	 */
	private readonly blueScale: string[] = [
		'#015a8e',
		'#066298',
		'#0d6ba2',
		'#1474ab',
		'#1a7cb4',
		'#1f84bd',
		'#258dc5',
		'#2a94ce',
		'#309cd5',
		'#35a4dd',
		'#3aace4',
		'#40b3eb',
		'#45bbf3',
		'#58c1f5',
		'#6dc6f5',
		'#7fccf6',
		'#8fd1f6',
		'#9dd6f7',
		'#abdbf8',
		'#b9e1f9',
	];

	/**
	 * Standard single feature colors
	 */
	private readonly singleFeatureColors = {
		primary: '#67A4CA',
		secondary: '#CBE7F8',
		highlight: '#015a8e',
		selected: '#2a94ce',
		default: '#3aace4',
		red: '#E35263',
	};

	/**
	 * Categorical color palette for distinct categories
	 */
	private readonly categoricalColors: string[] = [
		'#67A4CA', // Primary blue
		'#CBE7F8', // Light blue
		'#015a8e', // Dark blue
		'#45bbf3', // Medium blue
		'#7fccf6', // Sky blue
		'#1a7cb4', // Deep blue
		'#9dd6f7', // Pale blue
		'#258dc5', // Ocean blue
		'#abdbf8', // Ice blue
		'#309cd5', // Azure
	];

	/**
	 * Get color for a value based on min and max range
	 * @param value - The value to get color for
	 * @param min - Minimum value in the dataset
	 * @param max - Maximum value in the dataset
	 * @returns Hex color code
	 */
	getColorForValue(value: number, min: number, max: number): string {
		// Handle edge cases
		if (value <= min) return this.blueScale[0];
		if (value >= max) return this.blueScale[this.blueScale.length - 1];
		if (min === max)
			return this.blueScale[Math.floor(this.blueScale.length / 2)];

		// Normalize value to 0-1 range
		const normalizedValue = (value - min) / (max - min);

		// Map to color scale index
		const index = Math.floor(normalizedValue * (this.blueScale.length - 1));

		return this.blueScale[index];
	}

	/**
	 * Get color with interpolation between two colors in the scale
	 * Provides smoother color transitions
	 * @param value - The value to get color for
	 * @param min - Minimum value in the dataset
	 * @param max - Maximum value in the dataset
	 * @returns Hex color code
	 */
	getInterpolatedColor(value: number, min: number, max: number): string {
		// Handle edge cases
		if (value <= min) return this.blueScale[this.blueScale.length - 1];
		if (value >= max) return this.blueScale[0];

		if (min === max)
			return this.blueScale[Math.floor(this.blueScale.length / 2)];

		// Normalize value to 0-1 range
		const normalizedValue = (value - min) / (max - min);

		// Calculate position in color scale (floating point)
		const position = normalizedValue * (this.blueScale.length - 1);
		const lowerIndex = Math.floor(position);
		const upperIndex = Math.ceil(position);

		// If position is exactly on an index, return that color
		if (lowerIndex === upperIndex) {
			return this.blueScale[lowerIndex];
		}

		// Interpolate between two colors
		const fraction = position - lowerIndex;
		return this.interpolateColors(
			this.blueScale[lowerIndex],
			this.blueScale[upperIndex],
			fraction
		);
	}

	/**
	 * Interpolate between two hex colors
	 * @param color1 - First hex color (e.g., '#015a8e')
	 * @param color2 - Second hex color (e.g., '#066298')
	 * @param fraction - Value between 0 and 1 (0 = color1, 1 = color2)
	 * @returns Interpolated hex color
	 */
	private interpolateColors(
		color1: string,
		color2: string,
		fraction: number
	): string {
		// Parse hex colors to RGB
		const rgb1 = this.hexToRgb(color1);
		const rgb2 = this.hexToRgb(color2);

		// Interpolate each channel
		const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * fraction);
		const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * fraction);
		const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * fraction);

		// Convert back to hex
		return this.rgbToHex(r, g, b);
	}

	/**
	 * Convert hex color to RGB
	 */
	private hexToRgb(hex: string): { r: number; g: number; b: number } {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16),
			  }
			: { r: 0, g: 0, b: 0 };
	}

	/**
	 * Convert RGB to hex color
	 */
	private rgbToHex(r: number, g: number, b: number): string {
		return (
			'#' +
			[r, g, b]
				.map((x) => {
					const hex = x.toString(16);
					return hex.length === 1 ? '0' + hex : hex;
				})
				.join('')
		);
	}

	/**
	 * Get color scale legend items
	 * @param min - Minimum value
	 * @param max - Maximum value
	 * @param steps - Number of legend steps (default 5)
	 * @returns Array of legend items with color and label
	 */
	getLegendItems(
		min: number,
		max: number,
		steps: number = 5
	): { color: string; label: string; value: number }[] {
		const items: { color: string; label: string; value: number }[] = [];
		const range = max - min;
		const stepSize = range / (steps - 1);

		for (let i = 0; i < steps; i++) {
			const value = min + stepSize * i;
			const color = this.getInterpolatedColor(value, min, max);
			const label = value.toLocaleString(undefined, {
				maximumFractionDigits: 0,
			});
			items.push({ color, label, value });
		}

		return items;
	}

	/**
	 * Get CSS linear gradient string for continuous color scale legend
	 * @param min - Minimum value
	 * @param max - Maximum value
	 * @param direction - Gradient direction: 'vertical' (default) or 'horizontal'
	 * @returns CSS linear-gradient string
	 */
	getLegendGradient(
		min: number,
		max: number,
		direction: 'vertical' | 'horizontal' = 'vertical'
	): string {
		// Generate gradient stops using the full color scale
		const stops: string[] = [];
		const numStops = this.blueScale.length;

		for (let i = 0; i < numStops; i++) {
			const percentage = (i / (numStops - 1)) * 100;
			stops.push(`${this.blueScale[i]} ${percentage}%`);
		}

		const gradientDirection =
			direction === 'vertical' ? 'to bottom' : 'to right';
		return `linear-gradient(${gradientDirection}, ${stops.join(', ')})`;
	}

	/**
	 * Get legend break values using equal interval classification
	 * Best for continuous gradient legends as it provides evenly spaced labels
	 * @param min - Minimum value
	 * @param max - Maximum value
	 * @param numBreaks - Number of break points (default 5, including min and max)
	 * @returns Array of break values with formatted labels
	 */
	getLegendBreaks(
		min: number,
		max: number,
		numBreaks: number = 5
	): { value: number; label: string; position: number }[] {
		const breaks: { value: number; label: string; position: number }[] = [];
		const range = max - min;
		const stepSize = range / (numBreaks - 1);

		for (let i = 0; i < numBreaks; i++) {
			const value = min + stepSize * i;
			const position = (i / (numBreaks - 1)) * 100; // Position percentage for gradient
			const label = this.formatLegendLabel(value, min, max);
			breaks.push({ value, label, position });
		}

		return breaks;
	}

	/**
	 * Format label for legend based on value magnitude
	 * @param value - Value to format
	 * @param min - Minimum value (for context)
	 * @param max - Maximum value (for context)
	 * @returns Formatted label string
	 */
	private formatLegendLabel(value: number, min: number, max: number): string {
		const range = max - min;
		const magnitude = Math.max(Math.abs(min), Math.abs(max));

		// Determine appropriate decimal places based on value magnitude
		let maxFractionDigits = 0;
		if (magnitude < 1) {
			maxFractionDigits = 2;
		} else if (magnitude < 10) {
			maxFractionDigits = 1;
		} else if (magnitude < 1000) {
			maxFractionDigits = 0;
		} else {
			maxFractionDigits = 0;
		}

		return value.toLocaleString(undefined, {
			maximumFractionDigits: maxFractionDigits,
			minimumFractionDigits: maxFractionDigits,
		});
	}

	/**
	 * Get quantile breaks for a dataset
	 * Useful for creating equal-count classifications
	 * @param values - Array of values
	 * @param quantiles - Number of quantiles (default 5)
	 * @returns Array of break values
	 */
	getQuantileBreaks(values: number[], quantiles: number = 5): number[] {
		const sorted = [...values].sort((a, b) => a - b);
		const breaks: number[] = [];

		for (let i = 1; i < quantiles; i++) {
			const index = Math.floor((i / quantiles) * sorted.length);
			breaks.push(sorted[index]);
		}

		return breaks;
	}

	/**
	 * Get natural breaks (Jenks) - simplified version
	 * Groups values to minimize within-class variance
	 * @param values - Array of values
	 * @param classes - Number of classes (default 5)
	 * @returns Array of break values
	 */
	getNaturalBreaks(values: number[], classes: number = 5): number[] {
		if (values.length <= classes) {
			return values.sort((a, b) => a - b);
		}

		const sorted = [...values].sort((a, b) => a - b);
		const min = sorted[0];
		const max = sorted[sorted.length - 1];
		const range = max - min;

		// Simplified equal interval as approximation
		const breaks: number[] = [];
		for (let i = 1; i < classes; i++) {
			breaks.push(min + (range * i) / classes);
		}

		return breaks;
	}

	/**
	 * Get the full color scale array
	 */
	getColorScale(): string[] {
		return [...this.blueScale];
	}

	/**
	 * Get color by quantile classification
	 * @param value - The value to classify
	 * @param breaks - Array of break values
	 * @returns Hex color code
	 */
	getColorByQuantile(value: number, breaks: number[]): string {
		let classIndex = 0;
		for (let i = 0; i < breaks.length; i++) {
			if (value <= breaks[i]) {
				classIndex = i;
				break;
			} else {
				classIndex = breaks.length;
			}
		}

		// Map class to color scale
		const colorIndex = Math.floor(
			(classIndex / (breaks.length + 1)) * (this.blueScale.length - 1)
		);
		return this.blueScale[colorIndex];
	}

	// ==================== SINGLE FEATURE COLORS ====================

	/**
	 * Get standard color for a single feature
	 * @param type - Type of feature color needed
	 * @returns Hex color code
	 */
	getSingleFeatureColor(
		type:
			| 'primary'
			| 'secondary'
			| 'highlight'
			| 'selected'
			| 'red'
			| 'default' = 'default'
	): string {
		return this.singleFeatureColors[type];
	}

	/**
	 * Get all single feature color options
	 */
	getSingleFeatureColors(): Record<string, string> {
		return { ...this.singleFeatureColors };
	}

	// ==================== CATEGORIZED COLORS ====================

	/**
	 * Get color for a categorical value by index
	 * @param index - Category index
	 * @returns Hex color code
	 */
	getCategoricalColor(index: number): string {
		return this.categoricalColors[index % this.categoricalColors.length];
	}

	/**
	 * Get color mapping for categorical values
	 * @param categories - Array of category names/values
	 * @returns Map of category to color
	 */
	getCategoricalColorMap(categories: string[]): Map<string, string> {
		const colorMap = new Map<string, string>();
		categories.forEach((category, index) => {
			colorMap.set(category, this.getCategoricalColor(index));
		});
		return colorMap;
	}

	/**
	 * Get color for a specific category from a predefined map
	 * @param category - Category value
	 * @param colorMap - Predefined color map
	 * @param defaultColor - Fallback color if category not found
	 * @returns Hex color code
	 */
	getColorForCategory(
		category: string,
		colorMap: Map<string, string>,
		defaultColor: string = '#cccccc'
	): string {
		return colorMap.get(category) || defaultColor;
	}

	/**
	 * Get all categorical colors
	 */
	getCategoricalColors(): string[] {
		return [...this.categoricalColors];
	}

	// ==================== GRADUATED COLORS (EXISTING METHODS) ====================
	// The existing getColorForValue, getInterpolatedColor, getLegendItems, etc.
	// are already implemented above and handle graduated color scales

	/**
	 * Get color for graduated/choropleth visualization
	 * Alias for getInterpolatedColor for clarity
	 * @param value - The value to get color for
	 * @param min - Minimum value in the dataset
	 * @param max - Maximum value in the dataset
	 * @returns Hex color code
	 */
	getGraduatedColor(value: number, min: number, max: number): string {
		return this.getInterpolatedColor(value, min, max);
	}

	/**
	 * Create a graduated color scheme with custom breaks
	 * @param breaks - Array of break values
	 * @returns Array of colors corresponding to each break range
	 */
	getGraduatedColorScheme(breaks: number[]): string[] {
		const colors: string[] = [];
		const min = breaks[0];
		const max = breaks[breaks.length - 1];

		for (let i = 0; i < breaks.length; i++) {
			const value = breaks[i];
			colors.push(this.getInterpolatedColor(value, min, max));
		}

		return colors;
	}
}
