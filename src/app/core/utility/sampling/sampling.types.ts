/**
 * Sampling Types and Interfaces
 * Used for household sampling in surveys
 */

/**
 * Sampling method types
 */
export enum SamplingMethod {
	CSS = 'CIRCULAR_SYSTEMATIC',
	SRS = 'SIMPLE_RANDOM',
}

/**
 * Common parameters for sampling
 */
export interface SamplingParams<T = any> {
	/** List of households to sample from */
	households: T[];
	/** Required sample size (n) */
	sampleSize: number;
	/** Sampling method to use */
	method: SamplingMethod;
}

/**
 * CSS-specific parameters
 */
export interface CSSParams<T = any> extends SamplingParams<T> {
	method: SamplingMethod.CSS;
	/** Random start position (r) - optional, will be generated if not provided */
	randomStart?: number;
}

/**
 * SRS-specific parameters
 */
export interface SRSParams<T = any> extends SamplingParams<T> {
	method: SamplingMethod.SRS;
}

/**
 * Sampling result
 */
export interface SamplingResult<T = any> {
	/** Selected households */
	selectedHouseholds: T[];
	/** Selected household indices (1-based positions in original list) */
	selectedIndices: number[];
	/** Sampling method used */
	method: SamplingMethod;
	/** Metadata about the sampling process */
	metadata: SamplingMetadata;
}

/**
 * CSS sampling result with additional CSS-specific metadata
 */
export interface CSSSamplingResult<T = any> extends SamplingResult<T> {
	method: SamplingMethod.CSS;
	metadata: CSSMetadata;
}

/**
 * SRS sampling result with additional SRS-specific metadata
 */
export interface SRSSamplingResult<T = any> extends SamplingResult<T> {
	method: SamplingMethod.SRS;
	metadata: SRSMetadata;
}

/**
 * Base metadata for sampling
 */
export interface SamplingMetadata {
	/** Total population size (N) */
	populationSize: number;
	/** Required sample size (n) */
	sampleSize: number;
	/** Actual number of samples selected */
	actualSampleSize: number;
	/** Whether all households were selected (N ≤ n) */
	isFullSelection: boolean;
	/** Timestamp of sampling */
	timestamp: Date;
}

/**
 * CSS-specific metadata
 */
export interface CSSMetadata extends SamplingMetadata {
	/** Sampling interval (k) */
	samplingInterval: number;
	/** Random start position (r) */
	randomStart: number;
	/** Number of wrap-arounds that occurred */
	wrapAroundCount: number;
}

/**
 * SRS-specific metadata
 */
export interface SRSMetadata extends SamplingMetadata {
	/** Random seed used (if applicable) */
	randomSeed?: number;
}

/**
 * Validation result for sampling parameters
 */
export interface SamplingValidation {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}
