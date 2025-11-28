# Sampling Frontend Guide (Angular + PrimeNG/Tailwind)

This guide explains how to expose the new sampling workflow (survey-level defaults + EA-level runs) in the Angular app.

---

## 1. API Reference

| Purpose | Method & Path | Notes |
| --- | --- | --- |
| Fetch survey defaults | `GET /sampling/surveys/:surveyId/config` | Admin/Supervisor |
| Save/Update defaults | `POST /sampling/surveys/:surveyId/config` | Admin only |
| Run sampling for EA | `POST /sampling/surveys/:surveyId/enumeration-areas/:seaId/run` | Admin/Supervisor |
| View EA sampling result | `GET /sampling/surveys/:surveyId/enumeration-areas/:seaId` | Admin/Supervisor |

All endpoints require JWT auth (same as existing secured APIs).

---

## 2. DTO Reference

### SurveySamplingConfig (API response)
```ts
export interface SurveySamplingConfigDto {
  id: number;
  surveyId: number;
  defaultMethod: 'CSS' | 'SRS';
  defaultSampleSize?: number;
  urbanSampleSize?: number;
  ruralSampleSize?: number;
  createdBy?: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
}
```

### SurveyEnumerationAreaSampling (API response)
```ts
export interface SurveyEnumerationAreaSamplingDto {
  id: number;
  surveyId: number;
  surveyEnumerationAreaId: number;
  method: 'CSS' | 'SRS';
  sampleSize: number;
  populationSize: number;
  samplingInterval?: number;
  randomStart?: number;
  wrapAroundCount: number;
  isFullSelection: boolean;
  selectedIndices: number[];
  metadata: Record<string, any>;
  executedBy?: number;
  executedAt: string;
  createdAt: string;
  updatedAt: string;
  samples?: SurveyEnumerationAreaHouseholdSampleDto[];
}

export interface SurveyEnumerationAreaHouseholdSampleDto {
  id: number;
  surveyEnumerationAreaSamplingId: number;
  householdListingId: number;
  selectionOrder: number;
  isReplacement: boolean;
  createdAt: string;
  updatedAt: string;
  householdListing?:SurveyEnumerationAreaHouseholdListing;

}


```

### Request DTOs
```ts
export interface UpdateSurveySamplingConfigDto {
  defaultMethod: 'CSS' | 'SRS';
  defaultSampleSize?: number;
  urbanSampleSize?: number;
  ruralSampleSize?: number;
}

export interface RunEnumerationAreaSamplingDto {
  method?: 'CSS' | 'SRS';
  sampleSize?: number;
  randomStart?: number;
  overwriteExisting?: boolean;
}
```

---

## 3. Angular Service (sampling.service.ts)

```ts
@Injectable({ providedIn: 'root' })
export class SamplingService {
  private baseUrl = environment.apiUrl + '/sampling';

  constructor(private http: HttpClient) {}

  getSurveyConfig(surveyId: number) {
    return this.http.get(`${this.baseUrl}/surveys/${surveyId}/config`);
  }

  saveSurveyConfig(surveyId: number, payload: UpdateSurveySamplingConfig) {
    return this.http.post(
      `${this.baseUrl}/surveys/${surveyId}/config`,
      payload,
    );
  }

  runSampling(surveyId: number, seaId: number, payload: RunSamplingDto) {
    return this.http.post(
      `${this.baseUrl}/surveys/${surveyId}/enumeration-areas/${seaId}/run`,
      payload,
    );
  }

  getSamplingResult(surveyId: number, seaId: number) {
    return this.http.get(
      `${this.baseUrl}/surveys/${surveyId}/enumeration-areas/${seaId}`,
    );
  }
}
```

Use the DTOs defined above to type responses:
```ts
getSurveyConfig(surveyId: number) {
  return this.http.get<SurveySamplingConfigDto>(
    `${this.baseUrl}/surveys/${surveyId}/config`,
  );
}

runSampling(surveyId: number, seaId: number, payload: RunEnumerationAreaSamplingDto) {
  return this.http.post<SurveyEnumerationAreaSamplingDto>(
    `${this.baseUrl}/surveys/${surveyId}/enumeration-areas/${seaId}/run`,
    payload,
  );
}

getSamplingResult(surveyId: number, seaId: number) {
  return this.http.get<SurveyEnumerationAreaSamplingDto>(
    `${this.baseUrl}/surveys/${surveyId}/enumeration-areas/${seaId}`,
  );
}
```

---

## 3. Survey-Level UI (Global Defaults)

### Component Layout
1. Dropdown for default method (CSS/SRS).
2. Numeric inputs for:
   - Default sample size `n`
   - Urban sample size (THROMDE)
   - Rural sample size (Gewog/others)
3. Save button (Admin only).

### Flow
1. On survey settings page:
   - `samplingService.getSurveyConfig(surveyId)` to populate form (if empty, set defaults).
2. Admin edits defaults and clicks save → call `saveSurveyConfig`.
3. Show toast/snackbar on success.

### Validation Tips
- Ensure sample sizes are > 0; show inline errors.
- Disable save button when form invalid or unchanged.

---

## 4. EA-Level UI (Per Enumeration Area)

### Table/List View
For each `SurveyEnumerationArea` show:
- EA name + location hierarchy
- Household count `N`
- Current sampling status (Not run / Completed / Full selection)
- Action button: “Generate Sample” (if not yet sampled) or “Re-run” (with confirmation)
- Separate button or link: “View Sampled Households”
- Badge styling (`p-tag`) for status + table filters so supervisors can zero-in on Pending rows quickly.

### Generate Sample Modal
Fields:
1. Method dropdown (default pre-filled from survey config; user can override)
2. Sample size input (pre-filled from survey config / urban vs rural logic)
3. Random start (CSS only, optional)
4. “Overwrite existing sample” checkbox shown when a sample already exists

Actions:
1. Validate inputs (sample size ≤ N)
2. Call `samplingService.runSampling`
3. Refresh EA list and show success toast

### View Results
When clicking “View Sampled Households”:
1. Call `samplingService.getSamplingResult`
2. Display metadata: method, `N`, `n`, sampling interval + random start (CSS), strategy (SRS), full-selection flag
3. Show table of sampled households (serial number, HOH name, contact, remarks, replacement flag)
4. Provide copy/download functionality (CSV export)

---

## 5. Hierarchical EA Filtering

For surveys with hundreds/thousands of EAs, implement cascading filters to limit API payloads:

| Route | Purpose |
| --- | --- |
| `GET /survey/:surveyId/enumeration-areas/hierarchy` | Returns Dzongkhag → Gewog (AdministrativeZone) → Chiwog (SubAdminZone) tree with EA counts. |
| `GET /survey/:surveyId/enumeration-areas?dzongkhagId=&administrativeZoneId=&subAdministrativeZoneId=&status=` | Paged list filtered by hierarchy + sampling status. |

Frontend flow:
1. Populate first dropdown with dzongkhags from the hierarchy route.
2. When a dzongkhag is selected, load its gewogs, then chiwogs.
3. Query the paginated EA list with selected IDs + status filter (Pending/Sampled/Full selection).
4. Use PrimeNG lazy loading (`onLazyLoad`) to keep network payloads small.

---

## 6. Suggested UX Flow

1. **Survey Settings**: Admin configures defaults (method + sample sizes).
2. **EA List**: Supervisors/Admin see all enumeration areas assigned to the survey.
3. **Generate Sample**: For each EA, user opens modal to confirm/override parameters and runs sampling (single) OR multi-selects rows for a bulk run.
4. **Result Storage**: Backend persists indices + households; UI indicates “Sampled on <date> by <user>”.
5. **Re-run**: If needed, user checks “overwrite existing sample” to regenerate.
6. **Queue View**: Display a “Sampling Queue” panel showing in-progress/bulk jobs with status and errors per EA.

---

## 7. Bulk Sampling & Async Jobs

### Backend routes to add
| Method & Path | Description |
| --- | --- |
| `POST /sampling/surveys/:surveyId/enumeration-areas/bulk-run` | Accepts `{ seaIds: number[], method?, sampleSize?, overwriteExisting? }`, enqueues jobs, returns queue IDs. |
| `GET /sampling/surveys/:surveyId/jobs` | Lists recent sampling jobs with status / progress. |
| `GET /sampling/jobs/:jobId` | Polling endpoint for a specific job. |

### Frontend flow
1. Users select multiple EAs (checkbox column) and click “Run sampling”.
2. Show confirmation modal summarizing count + parameters (use survey defaults).
3. Call bulk-run endpoint → returns job ID(s).
4. Display progress in a “Sampling queue” drawer/table. Poll job status until completion.
5. Provide toast messages on completion + highlight EAs with errors (show error text from job payload).

---

## 8. CSV Export

Add routes for offline coordination:
| Method & Path | Description |
| --- | --- |
| `GET /sampling/surveys/:surveyId/enumeration-areas/export?status=pending|sampled` | Returns CSV with EA identifiers, location hierarchy, `N`, status, last sampled date. |
| `GET /sampling/surveys/:surveyId/enumeration-areas/:seaId/export` | CSV of sampled households for one EA. |

Frontend:
- Provide buttons “Export pending” / “Export sampled” above the table.
- For single EA, reuse “View results” modal but add “Download CSV”.

---

## 9. Error Handling

| Scenario | UI Feedback |
| --- | --- |
| No household listings (`N=0`) | Disable sampling action and show tooltip “No households uploaded”. |
| Sample already exists | Modal shows metadata + requires “overwrite” confirmation. |
| Backend validation errors | Display toast/snackbar with message (e.g., “Random start must be between 1 and N”). |
| Bulk job failures | Queue table shows per-EA error; allow “retry failed” button. |

---

## 10. Styling Tips (PrimeNG + Tailwind)

- Use PrimeNG `p-dropdown`, `p-inputNumber`, `p-dialog`, `p-table`.
- Tailwind classes for layout: `grid grid-cols-1 md:grid-cols-2 gap-4`, `bg-white rounded shadow p-4`.
- For status badges (sampled vs pending) use `p-tag` or Tailwind `inline-flex items-center px-2 py-1 rounded-full`.

---

## 11. Asynchronous Job UX

- PrimeNG `p-progressBar` or `p-progressSpinner` inside queue panel to show percentage.
- Allow users to close the modal; queue component persists in the page header/sidebar.
- Provide filters (All / Running / Completed / Failed) for queue entries.

---

## 12. Future Enhancements
- Allow users to download a PDF/CSV summary per EA.
- Display charts summarizing how many EAs have been sampled vs pending.
- Provide optional seed input for reproducible sampling runs.

This setup gives a straightforward workflow: configure defaults once per survey, then run sampling EA-by-EA with minimal inputs while keeping overrides available. Copy this guide into your Angular documentation or onboarding wiki as needed.

