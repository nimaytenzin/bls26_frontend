# Survey Overview Routes Comparison

## 1. ADMIN Routes (`admin-survey-overview` component)

### Initial Load (from `admin-survey-viewer.component.ts`):
1. **GET** `/survey/{id}`
   - Service: `SurveyDataService.findSurveyById()`
   - Purpose: Load survey details with enumeration areas
   - Auth: Public (no auth headers)

2. **GET** `/enumeration-area` (optional)
   - Service: `EnumerationAreaDataService.findAllEnumerationAreas()`
   - Purpose: Load detailed EA information
   - Auth: Public

### Survey Overview Component (`admin-survey-overview.component.ts`):
3. **GET** `/survey/{surveyId}/statistics`
   - Service: `SurveyDataService.getSurveyStatistics()`
   - Purpose: Get comprehensive survey statistics (EA counts, published, sampled, enumerated, pending)
   - Auth: Required (ADMIN or SUPERVISOR role)
   - Called: On component init and when surveyId changes

### Survey Actions (Admin Only):
4. **PATCH** `/survey/{id}`
   - Service: `SurveyDataService.updateSurvey()`
   - Purpose: Update survey details
   - Auth: Required (ADMIN role)
   - Called: When user edits survey via dialog

5. **DELETE** `/survey/{id}`
   - Service: `SurveyDataService.deleteSurvey()`
   - Purpose: Delete survey
   - Auth: Required (ADMIN role)
   - Called: When user confirms deletion

### Sampling Global Parameters Component (used in admin-overview):
6. **GET** `/sampling/surveys/{surveyId}/config`
   - Service: `SamplingDataService.getSurveyConfig()`
   - Purpose: Load sampling configuration (method, sample sizes)
   - Auth: Public
   - Called: On component init

7. **POST** `/sampling/surveys/{surveyId}/config`
   - Service: `SamplingDataService.saveSurveyConfig()`
   - Purpose: Save/update sampling configuration
   - Auth: Public
   - Called: When user saves config in dialog

---

## 2. SUPERVISOR Routes (`supervisor-survey-detailed-view` component)

### Initial Load (from `supervisor-survey-detailed-view.component.ts`):
1. **GET** `/supervisor/survey/{surveyId}`
   - Service: `SupervisorSurveyDataService.getSurveyById()`
   - Purpose: Load survey details (scoped to supervisor's dzongkhags)
   - Auth: Required (Bearer token)
   - Note: Only returns surveys with EAs in supervisor's assigned dzongkhags

2. **GET** `/supervisor/survey/{surveyId}/enumeration-hierarchy`
   - Service: `SupervisorSurveyDataService.getSurveyEnumerationHierarchy()`
   - Purpose: Load hierarchy for export dropdown (Dzongkhag → Admin Zone → Sub-Admin Zone → EAs)
   - Auth: Required (Bearer token)
   - Called: After survey loads successfully
   - Returns: `SupervisorSurveyResponse` with survey, summary, and hierarchy

### Export Functionality:
3. **GET** `/supervisor/survey-enumeration-area-household-listing/by-dzongkhag/{dzongkhagId}/export/count`
   - Service: `SupervisorSurveyEnumerationAreaHouseholdListingDataService.exportHouseholdCountByDzongkhag()`
   - Purpose: Download household count CSV for selected dzongkhag
   - Auth: Required (Bearer token)
   - Response: Blob (CSV file)
   - Called: When user clicks "Download CSV" button

### Sampling Global Parameters Component (used in supervisor view):
4. **GET** `/sampling/surveys/{surveyId}/config`
   - Service: `SamplingDataService.getSurveyConfig()`
   - Purpose: Load sampling configuration (method, sample sizes)
   - Auth: Public
   - Called: On component init

5. **POST** `/sampling/survey/{surveyId}/config`
   - Service: `SamplingDataService.saveSurveyConfig()`
   - Purpose: Save/update sampling configuration
   - Auth: Public
   - Called: When user saves config in dialog

---

## Key Differences:

### Admin:
- ✅ Can view **all surveys** (no filtering)
- ✅ Can **edit** and **delete** surveys
- ✅ Gets **full survey statistics** via `/survey/{id}/statistics`
- ✅ Uses standard `/survey` routes (not scoped)
- ✅ Can load all enumeration areas

### Supervisor:
- ✅ Can only view surveys with **EAs in their assigned dzongkhags**
- ❌ **Cannot edit or delete** surveys (no edit/delete buttons)
- ✅ Uses **scoped routes** prefixed with `/supervisor/`
- ✅ Has **export functionality** for household counts by dzongkhag
- ✅ Gets **enumeration hierarchy** for export dropdown
- ✅ Routes are **scoped to supervisor's dzongkhags** automatically

### Common:
- Both use the same **sampling global parameters** component
- Both display survey name, description, dates, and status
- Both show sampling configuration

---

## Summary Table:

| Feature | Admin | Supervisor |
|---------|-------|------------|
| Load Survey | `GET /survey/{id}` | `GET /supervisor/survey/{surveyId}` |
| Survey Statistics | `GET /survey/{id}/statistics` | ❌ Not used |
| Edit Survey | `PATCH /survey/{id}` | ❌ Not available |
| Delete Survey | `DELETE /survey/{id}` | ❌ Not available |
| Enumeration Hierarchy | ❌ Not used | `GET /supervisor/survey/{surveyId}/enumeration-hierarchy` |
| Export Household Count | ❌ Not available | `GET /supervisor/.../by-dzongkhag/{id}/export/count` |
| Sampling Config | `GET /sampling/surveys/{id}/config` | `GET /sampling/surveys/{id}/config` |
| Save Sampling Config | `POST /sampling/surveys/{id}/config` | `POST /sampling/surveys/{id}/config` |

