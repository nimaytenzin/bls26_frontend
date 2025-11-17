import { Injectable } from '@angular/core';
import {
	SamplingParams,
	SamplingResult,
	SamplingMethod,
	CSSParams,
	SRSParams,
	SamplingValidation,
} from './sampling.types';
import { CSSSampler } from './css-sampler.utility';
import { SRSampler } from './srs-sampler.utility';

/**
 * Household Sampling Service
 *
 * Main service for performing household sampling using either
 * Circular Systematic Sampling (CSS) or Simple Random Sampling (SRS).
 *
 * This service acts as a facade for the sampling utilities and provides
 * a unified interface for the Angular application to perform sampling operations.
 *
 * @example
 * constructor(private samplingService: SamplingService) {}
 *
 * performSampling() {
 *   const result = this.samplingService.sample({
 *     households: householdListings,
 *     sampleSize: 12,
 *     method: SamplingMethod.CSS
 *   });
 *   console.log(result.selectedHouseholds);
 * }
 */
@Injectable({
	providedIn: 'root',
})
export class SamplingService {
	private cssSampler: CSSSampler;
	private srsSampler: SRSampler;

	constructor() {
		this.cssSampler = new CSSSampler();
		this.srsSampler = new SRSampler();
	}

	/**
	 * Perform household sampling using the specified method
	 *
	 * @param params - Sampling parameters (CSS or SRS) with household list
	 * @returns Sampling result with selected households and metadata
	 * @throws Error if parameters are invalid
	 */
	sample<T = any>(params: SamplingParams<T>): SamplingResult<T> {
		// Validate parameters
		this.validateParams(params);

		// Perform sampling based on method
		switch (params.method) {
			case SamplingMethod.CSS:
				return this.cssSampler.sample(params as CSSParams<T>);

			case SamplingMethod.SRS:
				return this.srsSampler.sample(params as SRSParams<T>);

			default:
				throw new Error(`Unsupported sampling method: ${params.method}`);
		}
	}

	/**
	 * Perform Circular Systematic Sampling
	 *
	 * @param households - List of households to sample from
	 * @param sampleSize - Required sample size
	 * @param randomStart - Optional random start position
	 * @returns CSS sampling result
	 */
	sampleCSS<T = any>(
		households: T[],
		sampleSize: number,
		randomStart?: number
	): SamplingResult<T> {
		const params: CSSParams<T> = {
			households,
			sampleSize,
			method: SamplingMethod.CSS,
		};

		if (randomStart !== undefined) {
			params.randomStart = randomStart;
		}

		return this.sample(params);
	}

	/**
	 * Perform Simple Random Sampling
	 *
	 * @param households - List of households to sample from
	 * @param sampleSize - Required sample size
	 * @returns SRS sampling result
	 */
	sampleSRS<T = any>(households: T[], sampleSize: number): SamplingResult<T> {
		return this.sample({
			households,
			sampleSize,
			method: SamplingMethod.SRS,
		});
	}

	/**
	 * Validate sampling parameters
	 *
	 * @param params - Sampling parameters
	 * @returns Validation result
	 */
	validateParams<T>(params: SamplingParams<T>): SamplingValidation {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Basic validation
		if (!params.households || params.households.length === 0) {
			errors.push('Households list is required and cannot be empty');
		}

		if (!params.sampleSize || params.sampleSize <= 0) {
			errors.push('Sample size is required and must be greater than 0');
		}

		const populationSize = params.households?.length || 0;

		// Warning if sample size exceeds population
		if (
			params.sampleSize &&
			populationSize &&
			params.sampleSize > populationSize
		) {
			warnings.push(
				`Sample size (${params.sampleSize}) exceeds population size (${populationSize}). All households will be selected.`
			);
		}

		// Method-specific validation
		if (params.method === SamplingMethod.CSS) {
			const cssParams = params as CSSParams<T>;
			if (
				cssParams.randomStart !== undefined &&
				(cssParams.randomStart < 1 || cssParams.randomStart > populationSize)
			) {
				errors.push(`Random start must be between 1 and ${populationSize}`);
			}
		}

		// Throw error if validation fails
		if (errors.length > 0) {
			throw new Error(`Validation failed: ${errors.join(', ')}`);
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Check if full selection is needed (N ≤ n)
	 *
	 * @param populationSize - Total population (N)
	 * @param sampleSize - Required sample size (n)
	 * @returns True if all households should be selected
	 */
	isFullSelectionNeeded(populationSize: number, sampleSize: number): boolean {
		return populationSize <= sampleSize;
	}

	/**
	 * Calculate recommended sample size based on EA type
	 * This is based on common survey design rules
	 *
	 * @param eaType - Type of enumeration area ('urban' or 'rural')
	 * @returns Recommended sample size
	 */
	getRecommendedSampleSize(eaType: 'urban' | 'rural'): number {
		return eaType === 'urban' ? 12 : 16;
	}

	/**
	 * Get sampling interval for CSS method (without performing sampling)
	 *
	 * @param populationSize - Total population (N)
	 * @param sampleSize - Required sample size (n)
	 * @returns Sampling interval (k)
	 */
	calculateSamplingInterval(
		populationSize: number,
		sampleSize: number
	): number {
		if (populationSize <= sampleSize) {
			return 0;
		}
		return Math.floor(populationSize / sampleSize);
	}

	/**
	 * Export sampling result to CSV format
	 *
	 * @param result - Sampling result
	 * @returns CSV string
	 */
	exportToCSV<T = any>(result: SamplingResult<T>): string {
		const headers = [
			'Selection Order',
			'Household Position',
			'Method',
			'Timestamp',
		];

		const rows = result.selectedIndices.map((index, order) => {
			const row = [
				order + 1,
				index,
				result.method,
				result.metadata.timestamp.toISOString(),
			];

			return row.join(',');
		});

		return [headers.join(','), ...rows].join('\n');
	}

	/**
	 * Get example CSS calculation
	 * Example: N=45, n=10, r=7
	 *
	 * @returns Example CSS result
	 */
	getCSSExample(): SamplingResult<any> {
		return CSSSampler.getExample();
	}

	/**
	 * Get example SRS calculation
	 * Example: N=45, n=10
	 *
	 * @returns Example SRS result
	 */
	getSRSExample(): SamplingResult<any> {
		return SRSampler.getExample();
	}
}
