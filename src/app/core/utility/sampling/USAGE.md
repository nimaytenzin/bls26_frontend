# Household Sampling - Quick Start Guide

## Overview

The sampling utilities now accept a list of households directly and return the selected households. No need to pass survey IDs or enumeration area IDs.

## Basic Usage

### 1. Import the Service

```typescript
import { SamplingService, SamplingMethod } from '@core/utility/sampling';
```

### 2. Inject in Constructor

```typescript
constructor(private samplingService: SamplingService) {}
```

### 3. Use with Your Household Data

```typescript
import { SurveyEnumerationAreaHouseholdListing } from '@core/dataservice/...';

// Your household listings from the API
householdListings: SurveyEnumerationAreaHouseholdListing[] = [];

// Perform sampling
performSampling() {
  // CSS Sampling
  const cssResult = this.samplingService.sampleCSS(
    this.householdListings,  // Your household list
    12                        // Sample size (12 for urban, 16 for rural)
  );

  // Access selected households directly
  console.log('Selected households:', cssResult.selectedHouseholds);
  console.log('Selected indices:', cssResult.selectedIndices);
  console.log('Metadata:', cssResult.metadata);

  // OR use SRS Sampling
  const srsResult = this.samplingService.sampleSRS(
    this.householdListings,  // Your household list
    12                        // Sample size
  );

  console.log('Selected households:', srsResult.selectedHouseholds);
}
```

## Complete Example Component

```typescript
import { Component, OnInit } from '@angular/core';
import { SamplingService, SamplingMethod, SamplingResult } from '@core/utility/sampling';
import { SurveyEnumerationAreaHouseholdListingDataService } from '@core/dataservice/...';
import { SurveyEnumerationAreaHouseholdListing } from '@core/dataservice/...';

@Component({
  selector: 'app-survey-sampling',
  templateUrl: './survey-sampling.component.html'
})
export class SurveySamplingComponent implements OnInit {
  
  householdListings: SurveyEnumerationAreaHouseholdListing[] = [];
  selectedHouseholds: SurveyEnumerationAreaHouseholdListing[] = [];
  samplingResult: SamplingResult<SurveyEnumerationAreaHouseholdListing> | null = null;

  constructor(
    private householdService: SurveyEnumerationAreaHouseholdListingDataService,
    private samplingService: SamplingService
  ) {}

  ngOnInit() {
    this.loadHouseholds();
  }

  loadHouseholds() {
    const surveyEAId = 123; // Your survey enumeration area ID
    
    this.householdService.getBySurveyEA(surveyEAId).subscribe({
      next: (listings) => {
        this.householdListings = listings;
        console.log(`Loaded ${listings.length} households`);
      },
      error: (error) => {
        console.error('Error loading households:', error);
      }
    });
  }

  performCSSSampling() {
    if (this.householdListings.length === 0) {
      alert('No households loaded');
      return;
    }

    try {
      // Perform CSS sampling with recommended sample size
      const sampleSize = 12; // Or use: this.samplingService.getRecommendedSampleSize('urban')
      
      this.samplingResult = this.samplingService.sampleCSS(
        this.householdListings,
        sampleSize
      );

      this.selectedHouseholds = this.samplingResult.selectedHouseholds;

      console.log('Sampling completed successfully!');
      console.log(`Selected ${this.selectedHouseholds.length} households from ${this.householdListings.length}`);
      console.log('Sampling interval:', this.samplingResult.metadata.samplingInterval);
      console.log('Random start:', this.samplingResult.metadata.randomStart);
      
    } catch (error) {
      console.error('Sampling failed:', error);
      alert(`Sampling error: ${error.message}`);
    }
  }

  performSRSSampling() {
    if (this.householdListings.length === 0) {
      alert('No households loaded');
      return;
    }

    try {
      const sampleSize = 12;
      
      this.samplingResult = this.samplingService.sampleSRS(
        this.householdListings,
        sampleSize
      );

      this.selectedHouseholds = this.samplingResult.selectedHouseholds;

      console.log('SRS sampling completed successfully!');
      console.log(`Selected ${this.selectedHouseholds.length} households`);
      
    } catch (error) {
      console.error('Sampling failed:', error);
    }
  }

  exportResults() {
    if (!this.samplingResult) {
      alert('No sampling results to export');
      return;
    }

    const csv = this.samplingService.exportToCSV(this.samplingResult);
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sampling-results.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
```

## Method Signatures

### CSS Sampling

```typescript
sampleCSS<T = any>(
  households: T[],           // Array of household objects
  sampleSize: number,        // Required sample size (n)
  randomStart?: number       // Optional: random start position (1 to N)
): SamplingResult<T>
```

### SRS Sampling

```typescript
sampleSRS<T = any>(
  households: T[],           // Array of household objects
  sampleSize: number         // Required sample size (n)
): SamplingResult<T>
```

### Generic Sampling

```typescript
sample<T = any>(
  params: SamplingParams<T>  // Full parameters object
): SamplingResult<T>
```

## Result Structure

```typescript
interface SamplingResult<T> {
  selectedHouseholds: T[];      // Array of selected household objects
  selectedIndices: number[];     // 1-based indices in original list
  method: SamplingMethod;        // CSS or SRS
  metadata: {
    populationSize: number;      // Total households (N)
    sampleSize: number;          // Required sample (n)
    actualSampleSize: number;    // Actual selected (usually equals n)
    isFullSelection: boolean;    // true if N <= n
    timestamp: Date;             // When sampling was performed
    // CSS-specific fields (if method is CSS):
    samplingInterval?: number;   // k = floor(N/n)
    randomStart?: number;        // r (1 to N)
    wrapAroundCount?: number;    // Number of wrap-arounds
  }
}
```

## Special Cases

### When N ≤ n (All Households Selected)

```typescript
// If you have 10 households but request 12 samples
const result = this.samplingService.sampleCSS(
  this.householdListings,  // 10 households
  12                        // Sample size
);

console.log(result.selectedHouseholds.length);  // 10 (all households)
console.log(result.metadata.isFullSelection);   // true
```

### Custom Random Start (CSS Only)

```typescript
// Specify a custom random start position
const result = this.samplingService.sampleCSS(
  this.householdListings,
  12,
  7  // Start at position 7
);

console.log(result.metadata.randomStart);  // 7
```

## Helper Methods

### Check if Full Selection is Needed

```typescript
const needsFullSelection = this.samplingService.isFullSelectionNeeded(
  this.householdListings.length,
  12
);
```

### Get Recommended Sample Size

```typescript
const urbanSize = this.samplingService.getRecommendedSampleSize('urban');   // 12
const ruralSize = this.samplingService.getRecommendedSampleSize('rural');   // 16
```

### Calculate Sampling Interval (CSS)

```typescript
const interval = this.samplingService.calculateSamplingInterval(
  this.householdListings.length,
  12
);
```

## Key Changes from Previous Version

### Before (Old API):
```typescript
const result = this.samplingService.sample({
  surveyId: 1,
  enumerationAreaId: 100,
  sampleSize: 12,
  populationSize: 45,
  method: SamplingMethod.CSS
});

// Result only had indices
console.log(result.selectedIndices);

// You had to manually select households
const selected = result.selectedIndices.map(i => households[i - 1]);
```

### After (New API):
```typescript
const result = this.samplingService.sampleCSS(
  households,  // Just pass the household list
  12
);

// Result has both indices AND selected households
console.log(result.selectedHouseholds);  // Actual household objects
console.log(result.selectedIndices);     // Indices (if needed)
```

## Benefits

1. **Simpler**: No need to pass survey IDs or calculate population size
2. **Type-safe**: Generic types ensure type safety for your household objects
3. **Direct results**: Get selected household objects directly
4. **Flexible**: Works with any array of objects, not just household listings
5. **Cleaner code**: Less boilerplate, more focused on actual sampling logic

## Error Handling

```typescript
try {
  const result = this.samplingService.sampleCSS(households, sampleSize);
  // Success
} catch (error) {
  if (error.message.includes('Households list is required')) {
    // Handle empty list
  } else if (error.message.includes('Sample size must be greater than 0')) {
    // Handle invalid sample size
  } else {
    // Other errors
  }
}
```

## Common Patterns

### Pattern 1: Load and Sample

```typescript
loadAndSample(surveyEAId: number) {
  this.householdService.getBySurveyEA(surveyEAId).subscribe({
    next: (households) => {
      const result = this.samplingService.sampleCSS(households, 12);
      this.processSelectedHouseholds(result.selectedHouseholds);
    }
  });
}
```

### Pattern 2: Conditional Sampling Method

```typescript
performSampling(method: 'css' | 'srs') {
  const result = method === 'css'
    ? this.samplingService.sampleCSS(this.households, 12)
    : this.samplingService.sampleSRS(this.households, 12);
    
  this.selectedHouseholds = result.selectedHouseholds;
}
```

### Pattern 3: Dynamic Sample Size

```typescript
sampleByEAType(eaType: 'urban' | 'rural') {
  const sampleSize = this.samplingService.getRecommendedSampleSize(eaType);
  const result = this.samplingService.sampleCSS(this.households, sampleSize);
  return result.selectedHouseholds;
}
```
