# CRS & SRS Logical Process

> **CRS** (Circular Systematic Sampling) is the same algorithm exposed in code as `CSS`.  
> **SRS** (Simple Random Sampling) is the equal–probability without‑replacement design.

This document explains the end‑to‑end logic originally implemented inside the legacy samplers
so product + survey teams can reason about what the backend is doing without reading code.

---

## 1. Shared Building Blocks

| Concept | Description |
| --- | --- |
| `N` | Population size = number of households supplied to the sampler |
| `n` | Required sample size requested by the user |
| Full Selection | When `N ≤ n` we must return *all* households. Both samplers short‑circuit to this branch and mark `metadata.isFullSelection = true`. |
| Indices | Internally we always work with **1-based** positions so metadata matches field listings. |
| Result Payload | `selectedHouseholds`, `selectedIndices`, `method`, `metadata` (timestamp, sizes, design diagnostics). |

---

## 2. CRS (Circular Systematic Sampling)

### Intuition

1. Spread the required sample evenly across the ordered list of households.
2. Pick a random start point.
3. Walk forward by a fixed interval, wrapping to the beginning when we exceed `N`.

This guarantees each household sits inside exactly one of the `n` equal intervals,
and therefore has an equal chance of being selected via the random start.

### Step-by-step

| Step | Logic | Implementation Detail |
| --- | --- | --- |
| 1 | Check full selection (`populationSize <= sampleSize`). If `true`, return every household. | `createFullSelectionResult` |
| 2 | Compute sampling interval `k = floor(N / n)`. | `calculateSamplingInterval` |
| 3 | Choose random start `r`. If caller supplied `randomStart`, validate `1 ≤ r ≤ N`; otherwise roll `Math.random()`. | `generateRandomStart` |
| 4 | For each draw `i ∈ {1 … n}` compute raw index `r + (i-1)·k`. When `index > N`, subtract `N` repeatedly (circular wrap). Count wrap events for diagnostics. | `calculateSampleIndices` |
| 5 | Map indices back to household objects and emit metadata (`samplingInterval`, `randomStart`, `wrapAroundCount`). | `sample` |

### Pseudocode

```
if N <= n:
    return all households

k = floor(N / n)
r = providedRandomStart or random(1..N)
indices = []
wraps = 0

for i = 1..n:
    index = r + (i-1)*k
    while index > N:
        index -= N
        wraps += 1
    indices.push(index)

selected = households[indices - 1]
```

### Practical Notes

- **Ordering matters**: list households in the same order used during listing (usually serpentine route order).  
- **Interval rounding**: using `floor(N/n)` means some households might never be hit when `N` is not divisible by `n`. Circular wrap redistributes the overshoot.
- **Custom start**: use when the survey supervisor draws the seed manually.
- **Metadata**: `wrapAroundCount` helps debug suspicious clusters (e.g., when many wraps occur because `N ≫ n` with small `k`).

---

## 3. SRS (Simple Random Sampling)

### Intuition

Select `n` distinct households entirely at random, without replacement, ensuring
each household has equal inclusion probability `n/N`.

### Step-by-step

| Step | Logic | Implementation Detail |
| --- | --- | --- |
| 1 | Full selection short-circuit identical to CRS. | `createFullSelectionResult` |
| 2 | Decide which random-number strategy to use. If `n` is less than half of `N`, use rejection sampling. Otherwise perform a partial Fisher-Yates shuffle. | `generateUniqueRandomIndices` |
| 3 | Sort the selected indices for readability & easier downstream merging. | `selectedIndices.sort` |
| 4 | Map indices to household objects and emit metadata. | `sample` |

### Rejection vs Shuffle

| Scenario | Algorithm | Reason |
| --- | --- | --- |
| `n < N/2` | Rejection sampling (keep drawing random integers until we collect `n` unique values). | Faster because collision probability is low. |
| `n ≥ N/2` | Partial Fisher–Yates shuffle (shuffle only the first `n` slots). | Avoids the cost of repeated collisions. |

### Pseudocode

```
if N <= n:
    return all households

if n < N/2:
    indices = empty set
    while size(indices) < n:
        idx = randomInt(1, N)
        add idx to set
else:
    indices = [1..N]
    for i in 0..n-1:
        j = randomInt(i, N)
        swap(indices[i], indices[j])
    indices = first n items

indices.sort()
selected = households[indices - 1]
```

### Practical Notes

- **Equal probability**: Because we never replace a selected index, each household has identical inclusion probability.
- **Sorting**: Sorting indices is optional mathematically, but helps QA teams reconcile with the ordered listing.
- **Seeded sampling**: Hook for deterministic runs exists (`sampleWithSeed`) but currently logs the seed only; plug in a seeded RNG if reproducibility is required.

---

## 4. Comparing CRS vs SRS

| Aspect | CRS (CSS) | SRS |
| --- | --- | --- |
| Use case | Route-based household lists where spatial spread is desired. | Purely random selection (e.g., when listing order is already random). |
| Inputs required | Households, sample size, optional random start. | Households, sample size. |
| Additional metadata | Sampling interval, random start, wrap count. | None (just sample stats). |
| Inclusion probability | Exactly `n/N` when listing order is uniform; otherwise approximates systematic coverage. | Exactly `n/N` irrespective of order. |
| Failure modes | If listing order is biased, sample inherits the bias. | Can cluster geographically if listing order is sorted, but unbiased overall. |

---

## 5. Implementation Touchpoints

- The backend sampling endpoints exposed via `SamplingDataService` run these algorithms server-side.
- CSV export utilities rely on the metadata described here; ensure any downstream analytics keep the same 1-based indexing assumption.

---

## 6. Worked Example (CRS)

```
N = 45 households, n = 10, random start r = 7
k = floor(45/10) = 4

Indices:
1: 7
2: 11
3: 15
4: 19
5: 23
6: 27
7: 31
8: 35
9: 39
10: 43

No wrap occurred because 43 ≤ 45.
```

## 7. Worked Example (SRS)

```
N = 45, n = 10
Since n < N/2, use rejection sampling.
Draw random ints until we have 10 unique values, e.g.:
{3, 7, 9, 11, 14, 19, 23, 31, 38, 42}
Sort → [3, 7, 9, 11, 14, 19, 23, 31, 38, 42]
Return households at those positions.
```

---

### Need More?

- See `SAMPLING_FRONTEND_GUIDE.md` for UI/API integration patterns.
- Reach out to the survey methods team for guidance on when to choose CRS vs SRS per domain.

