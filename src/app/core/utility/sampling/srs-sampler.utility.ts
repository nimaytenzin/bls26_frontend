import { SRSParams, SRSSamplingResult, SamplingMethod } from './sampling.types';

/**
 * Simple Random Sampling (SRS) Utility
 *
 * Implements the SRS sampling scheme where households are selected randomly
 * without replacement, ensuring each household has an equal probability of selection.
 *
 * Method:
 * - Generate n unique random integers between 1 and N
 * - Each random number represents a household index/position
 *
 * @example
 * const sampler = new SRSampler();
 * const result = sampler.sample({
 *   households: householdListings, // Array of household objects
 *   sampleSize: 12,
 *   method: SamplingMethod.SRS
 * });
 * console.log(result.selectedHouseholds); // Array of selected household objects
 * console.log(result.selectedIndices); // [3, 12, 7, 28, 15, ...]
 */
export class SRSampler {
	/**
	 * Perform Simple Random Sampling
	 *
	 * @param params - SRS sampling parameters with household list
	 * @returns Sampling result with selected households and metadata
	 */
	sample<T = any>(params: SRSParams<T>): SRSSamplingResult<T> {
		const { households, sampleSize } = params;
		const populationSize = households.length;

		// Step 1: Check if full selection is needed (N ≤ n)
		if (populationSize <= sampleSize) {
			return this.createFullSelectionResult(params);
		}

		// Step 2: Generate unique random indices
		const selectedIndices = this.generateUniqueRandomIndices(
			sampleSize,
			populationSize
		);

		// Step 3: Sort indices for easier processing (optional, but recommended)
		selectedIndices.sort((a, b) => a - b);

		// Step 4: Select actual households based on indices
		const selectedHouseholds = selectedIndices.map(
			(index) => households[index - 1]
		);

		// Step 5: Create and return result
		return {
			selectedHouseholds,
			selectedIndices,
			method: SamplingMethod.SRS,
			metadata: {
				populationSize,
				sampleSize,
				actualSampleSize: selectedIndices.length,
				isFullSelection: false,
				timestamp: new Date(),
			},
		};
	}

	/**
	 * Generate n unique random integers between 1 and N
	 * Uses Fisher-Yates shuffle algorithm for efficient random selection
	 *
	 * @param sampleSize - Number of unique random numbers to generate (n)
	 * @param populationSize - Upper limit for random number generation (N)
	 * @returns Array of unique random indices
	 */
	private generateUniqueRandomIndices(
		sampleSize: number,
		populationSize: number
	): number[] {
		// For small sample sizes relative to population, use rejection method
		if (sampleSize < populationSize / 2) {
			return this.generateUniqueRandomIndicesRejection(
				sampleSize,
				populationSize
			);
		}

		// For larger sample sizes, use Fisher-Yates shuffle
		return this.generateUniqueRandomIndicesShuffle(sampleSize, populationSize);
	}

	/**
	 * Generate unique random indices using rejection method
	 * Efficient when sample size is small relative to population
	 *
	 * @param sampleSize - Number of unique random numbers to generate (n)
	 * @param populationSize - Upper limit for random number generation (N)
	 * @returns Array of unique random indices
	 */
	private generateUniqueRandomIndicesRejection(
		sampleSize: number,
		populationSize: number
	): number[] {
		const selected = new Set<number>();

		while (selected.size < sampleSize) {
			const randomIndex = Math.floor(Math.random() * populationSize) + 1;
			selected.add(randomIndex);
		}

		return Array.from(selected);
	}

	/**
	 * Generate unique random indices using partial Fisher-Yates shuffle
	 * Efficient when sample size is large relative to population
	 *
	 * @param sampleSize - Number of unique random numbers to generate (n)
	 * @param populationSize - Upper limit for random number generation (N)
	 * @returns Array of unique random indices
	 */
	private generateUniqueRandomIndicesShuffle(
		sampleSize: number,
		populationSize: number
	): number[] {
		// Create array of all indices [1, 2, 3, ..., N]
		const allIndices = Array.from({ length: populationSize }, (_, i) => i + 1);

		// Perform partial Fisher-Yates shuffle to select n elements
		for (let i = 0; i < sampleSize; i++) {
			const randomIndex = Math.floor(Math.random() * (populationSize - i)) + i;
			[allIndices[i], allIndices[randomIndex]] = [
				allIndices[randomIndex],
				allIndices[i],
			];
		}

		// Return first n shuffled elements
		return allIndices.slice(0, sampleSize);
	}

	/**
	 * Create result when all households should be selected (N ≤ n)
	 *
	 * @param params - SRS sampling parameters
	 * @returns Full selection result
	 */
	private createFullSelectionResult<T>(
		params: SRSParams<T>
	): SRSSamplingResult<T> {
		const { households, sampleSize } = params;
		const populationSize = households.length;
		const allIndices = Array.from({ length: populationSize }, (_, i) => i + 1);

		return {
			selectedHouseholds: [...households],
			selectedIndices: allIndices,
			method: SamplingMethod.SRS,
			metadata: {
				populationSize,
				sampleSize,
				actualSampleSize: populationSize,
				isFullSelection: true,
				timestamp: new Date(),
			},
		};
	}

	/**
	 * Generate random sample with a specific seed (for reproducibility)
	 * Note: JavaScript's Math.random() doesn't support seeding natively,
	 * so this is a placeholder for potential future implementation
	 * with a seeded random number generator library
	 *
	 * @param params - SRS sampling parameters
	 * @param seed - Random seed for reproducibility
	 * @returns Sampling result
	 */
	sampleWithSeed<T>(params: SRSParams<T>, seed: number): SRSSamplingResult<T> {
		// TODO: Implement seeded random number generation if needed
		// For now, just use regular sampling and record the seed in metadata
		const result = this.sample(params);
		result.metadata.randomSeed = seed;
		return result;
	}

	/**
	 * Validate SRS sampling parameters
	 *
	 * @param params - SRS sampling parameters
	 * @returns True if parameters are valid
	 * @throws Error if parameters are invalid
	 */
	static validate<T>(params: SRSParams<T>): boolean {
		if (!params.households || params.households.length === 0) {
			throw new Error('Households list is required and cannot be empty');
		}

		if (params.sampleSize <= 0) {
			throw new Error('Sample size must be greater than 0');
		}

		return true;
	}

	/**
	 * Get example calculation for demonstration
	 * Example: N=45, n=10
	 *
	 * @returns Example sampling result
	 */
	static getExample(): SRSSamplingResult<any> {
		const sampler = new SRSampler();
		// Create example household data
		const exampleHouseholds = Array.from({ length: 45 }, (_, i) => ({
			id: i + 1,
			name: `Household ${i + 1}`,
		}));

		return sampler.sample({
			households: exampleHouseholds,
			sampleSize: 10,
			method: SamplingMethod.SRS,
		});
	}
}
