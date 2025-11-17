import { Injectable } from '@angular/core';

/**
 * Service for generating color scales and mapping values to colors
 */
@Injectable({
	providedIn: 'root',
})
export class ColorScaleService {
	/**
	 * Blue gradient color scale from dark to light
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
}
