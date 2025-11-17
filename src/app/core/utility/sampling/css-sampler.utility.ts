import { CSSParams, CSSSamplingResult, SamplingMethod } from './sampling.types';

/**
 * Circular Systematic Sampling (CSS) Utility
 *
 * Implements the CSS sampling scheme where households are selected at regular intervals
 * with a random start, using a circular/wrap-around method when indices exceed N.
 *
 * Formula:
 * - Sampling Interval: k = floor(N / n)
 * - Sample Indices: Index_i = r + (i-1) * k for i = 1 to n
 * - Wrap-around: If Index > N, then Index = Index - N
 *
 * @example
 * const sampler = new CSSSampler();
 * const result = sampler.sample({
 *   households: householdListings, // Array of household objects
 *   sampleSize: 12,
 *   method: SamplingMethod.CSS
 * });
 * console.log(result.selectedHouseholds); // Array of selected household objects
 * console.log(result.selectedIndices); // [7, 10, 13, 16, ...]
 */
export class CSSSampler {
	/**
	 * Perform Circular Systematic Sampling
	 *
	 * @param params - CSS sampling parameters with household list
	 * @returns Sampling result with selected households and metadata
	 */
	sample<T = any>(params: CSSParams<T>): CSSSamplingResult<T> {
		const { households, sampleSize } = params;
		const populationSize = households.length;

		// Step 1: Check if full selection is needed (N ≤ n)
		if (populationSize <= sampleSize) {
			return this.createFullSelectionResult(params);
		}

		// Step 2: Calculate sampling interval (k)
		const samplingInterval = this.calculateSamplingInterval(
			populationSize,
			sampleSize
		);

		// Step 3: Generate or use provided random start (r)
		const randomStart =
			params.randomStart ?? this.generateRandomStart(populationSize);

		// Step 4: Calculate sample indices with wrap-around
		const { indices, wrapAroundCount } = this.calculateSampleIndices(
			randomStart,
			samplingInterval,
			sampleSize,
			populationSize
		);

		// Step 5: Select actual households based on indices
		const selectedHouseholds = indices.map((index) => households[index - 1]);

		// Step 6: Create and return result
		return {
			selectedHouseholds,
			selectedIndices: indices,
			method: SamplingMethod.CSS,
			metadata: {
				populationSize,
				sampleSize,
				actualSampleSize: indices.length,
				isFullSelection: false,
				timestamp: new Date(),
				samplingInterval,
				randomStart,
				wrapAroundCount,
			},
		};
	}

	/**
	 * Calculate the sampling interval (k)
	 * Formula: k = floor(N / n)
	 *
	 * @param populationSize - Total population (N)
	 * @param sampleSize - Required sample size (n)
	 * @returns Sampling interval (k)
	 */
	private calculateSamplingInterval(
		populationSize: number,
		sampleSize: number
	): number {
		return Math.floor(populationSize / sampleSize);
	}

	/**
	 * Generate a random start position (r)
	 * Range: 1 ≤ r ≤ N
	 *
	 * @param populationSize - Total population (N)
	 * @returns Random start position (r)
	 */
	private generateRandomStart(populationSize: number): number {
		return Math.floor(Math.random() * populationSize) + 1;
	}

	/**
	 * Calculate sample indices using CSS formula with wrap-around
	 * Formula: Index_i = r + (i-1) * k for i = 1 to n
	 * Wrap-around: If Index > N, then Index = Index - N
	 *
	 * @param randomStart - Random start position (r)
	 * @param samplingInterval - Sampling interval (k)
	 * @param sampleSize - Required sample size (n)
	 * @param populationSize - Total population (N)
	 * @returns Object containing selected indices and wrap-around count
	 */
	private calculateSampleIndices(
		randomStart: number,
		samplingInterval: number,
		sampleSize: number,
		populationSize: number
	): { indices: number[]; wrapAroundCount: number } {
		const indices: number[] = [];
		let wrapAroundCount = 0;

		for (let i = 1; i <= sampleSize; i++) {
			// Calculate index: r + (i-1) * k
			let index = randomStart + (i - 1) * samplingInterval;

			// Apply wrap-around if index exceeds population size
			while (index > populationSize) {
				index = index - populationSize;
				wrapAroundCount++;
			}

			indices.push(index);
		}

		return { indices, wrapAroundCount };
	}

	/**
	 * Create result when all households should be selected (N ≤ n)
	 *
	 * @param params - CSS sampling parameters
	 * @returns Full selection result
	 */
	private createFullSelectionResult<T>(
		params: CSSParams<T>
	): CSSSamplingResult<T> {
		const { households, sampleSize } = params;
		const populationSize = households.length;
		const allIndices = Array.from({ length: populationSize }, (_, i) => i + 1);

		return {
			selectedHouseholds: [...households],
			selectedIndices: allIndices,
			method: SamplingMethod.CSS,
			metadata: {
				populationSize,
				sampleSize,
				actualSampleSize: populationSize,
				isFullSelection: true,
				timestamp: new Date(),
				samplingInterval: 0,
				randomStart: 0,
				wrapAroundCount: 0,
			},
		};
	}

	/**
	 * Validate CSS sampling parameters
	 *
	 * @param params - CSS sampling parameters
	 * @returns True if parameters are valid
	 * @throws Error if parameters are invalid
	 */
	static validate<T>(params: CSSParams<T>): boolean {
		if (!params.households || params.households.length === 0) {
			throw new Error('Households list is required and cannot be empty');
		}

		const populationSize = params.households.length;

		if (params.sampleSize <= 0) {
			throw new Error('Sample size must be greater than 0');
		}

		if (
			params.randomStart !== undefined &&
			(params.randomStart < 1 || params.randomStart > populationSize)
		) {
			throw new Error(`Random start must be between 1 and ${populationSize}`);
		}

		return true;
	}

	/**
	 * Get example calculation for demonstration
	 * Example: N=45, n=10, r=7
	 *
	 * @returns Example sampling result
	 */
	static getExample(): CSSSamplingResult<any> {
		const sampler = new CSSSampler();
		// Create example household data
		const exampleHouseholds = Array.from({ length: 45 }, (_, i) => ({
			id: i + 1,
			name: `Household ${i + 1}`,
		}));

		return sampler.sample({
			households: exampleHouseholds,
			sampleSize: 10,
			randomStart: 7,
			method: SamplingMethod.CSS,
		});
	}
}
