# 👨‍💼 Supervisor Survey Managment API Guide

This guide provides all the API routes and workflows specifically for **Supervisors** to manage their assigned survey enumeration areas and household listings.

---

## 🎯 Supervisor Workflow Overview

1. **View Assigned Surveys** - Get all active surveys under supervisor's management
2. **View Enumeration Area Details** - See specific EA details and status
3. **Download CSV Template** - Get pre-populated template for household data entry
4. **Upload Household Listings** - Submit household data for enumeration areas
5. **Submit for Validation** - Mark EA as complete and ready for admin review
6. **Track Progress** - Monitor submission and validation statistics

---

## 📋 1. Get Active Surveys for Supervisor

### **Endpoint**
```
GET /survey/supervisor/:supervisorId/active
```

### **Purpose**
Load all active surveys with enumeration areas falling under the supervisor's management. This determines which surveys and EAs the supervisor is responsible for based on their assigned dzongkhags.

### **Route Parameters**
- `supervisorId` (number) - The user ID of the supervisor

### **Authorization**
- **Roles**: ADMIN, SUPERVISOR
- **JWT Token**: Required

### **Response Structure**
```json
[
  {
    "id": 1,
    "name": "National Population Survey 2025",
    "description": "Comprehensive household survey",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "year": 2025,
    "status": "ACTIVE",
    "dzongkhags": [
      {
        "id": 1,
        "name": "Thimphu",
        "areaCode": "TH",
        "enumerationAreas": [
          {
            "id": 101,
            "name": "Thimphu Core Area 1",
            "areaCode": "TH-001",
            "areaSqKm": 5.2,
            "subAdministrativeZone": {
              "id": 10,
              "name": "Thimphu Thromde",
              "administrativeZone": {
                "id": 5,
                "name": "Thimphu Dzongkhag"
              }
            }
          }
        ]
      }
    ],
    "totalEnumerationAreas": 15
  }
]
```

### **Response Fields**
- `id` - Survey ID
- `name` - Survey name
- `description` - Survey description
- `startDate` - Survey start date
- `endDate` - Survey end date
- `year` - Survey year
- `status` - Survey status (ACTIVE/ENDED)
- `dzongkhags` - Array of dzongkhags under supervisor's management
  - `enumerationAreas` - Array of EAs within each dzongkhag
- `totalEnumerationAreas` - Total count of EAs for this survey

### **Example Request**
```bash
curl -X GET \
  http://localhost:3000/survey/supervisor/101/active \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### **Use Case**
This is the **initial dashboard load** for supervisors. It shows all surveys they need to work on and all the enumeration areas they're responsible for collecting data from.

---

## 📊 2. Get Enumeration Area Details by Survey

### **Endpoint**
```
GET /survey-enumeration-area/by-survey/:surveyId
```

### **Purpose**
View all enumeration areas for a specific survey, including their submission and validation status.

### **Route Parameters**
- `surveyId` (number) - The survey ID

### **Query Parameters (Optional)**
- `isSubmitted` - Filter by submission status (true/false)
- `isValidated` - Filter by validation status (true/false)

### **Authorization**
- **Roles**: ADMIN, SUPERVISOR
- **JWT Token**: Required

### **Response Structure**
```json
[
  {
    "id": 1,
    "surveyId": 1,
    "enumerationAreaId": 101,
    "isSubmitted": true,
    "submittedBy": 101,
    "submissionDate": "2025-11-01T10:30:00.000Z",
    "isValidated": false,
    "validatedBy": null,
    "validationDate": null,
    "comments": "Submitted for review",
    "createdAt": "2025-10-01T08:00:00.000Z",
    "updatedAt": "2025-11-01T10:30:00.000Z",
    "survey": {
      "id": 1,
      "name": "National Population Survey 2025",
      "year": 2025,
      "status": "ACTIVE"
    },
    "enumerationArea": {
      "id": 101,
      "name": "Thimphu Core Area 1",
      "areaCode": "TH-001",
      "areaSqKm": 5.2
    },
    "submitter": {
      "id": 101,
      "name": "Supervisor Tashi",
      "role": "SUPERVISOR"
    },
    "validator": null
  }
]
```

### **Example Requests**

**Get all EAs for a survey:**
```bash
curl -X GET \
  http://localhost:3000/survey-enumeration-area/by-survey/1 \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Get only pending EAs (not submitted):**
```bash
curl -X GET \
  'http://localhost:3000/survey-enumeration-area/by-survey/1?isSubmitted=false' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Get submitted but not validated EAs:**
```bash
curl -X GET \
  'http://localhost:3000/survey-enumeration-area/by-survey/1?isSubmitted=true&isValidated=false' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 📈 3. Get Submission Statistics

### **Endpoint**
```
GET /survey-enumeration-area/by-survey/:surveyId/statistics
```

### **Purpose**
Get overall progress statistics for a survey to track completion.

### **Route Parameters**
- `surveyId` (number) - The survey ID

### **Authorization**
- **Roles**: ADMIN, SUPERVISOR
- **JWT Token**: Required

### **Response Structure**
```json
{
  "total": 50,
  "submitted": 35,
  "validated": 20,
  "pending": 15,
  "awaitingValidation": 15,
  "submissionRate": "70.00",
  "validationRate": "40.00"
}
```

### **Response Fields**
- `total` - Total enumeration areas
- `submitted` - Number of submitted EAs
- `validated` - Number of validated EAs
- `pending` - Number of EAs not yet submitted
- `awaitingValidation` - Number of EAs submitted but not validated
- `submissionRate` - Percentage of EAs submitted
- `validationRate` - Percentage of EAs validated

### **Example Request**
```bash
curl -X GET \
  http://localhost:3000/survey-enumeration-area/by-survey/1/statistics \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 📥 4. Download CSV Template

### **Endpoint**
```
GET /survey-enumeration-area-household-listing/template/csv/:surveyEnumerationAreaId
```

### **Purpose**
Download a CSV template pre-populated with survey and enumeration area IDs for household data entry.

### **Route Parameters**
- `surveyEnumerationAreaId` (number) - The survey enumeration area ID

### **Authorization**
- **Roles**: ADMIN, SUPERVISOR, ENUMERATOR
- **JWT Token**: Required

### **Response**
CSV file download with the following structure:
```csv
surveyEnumerationAreaId,surveyId,enumerationAreaId,structureNumber,householdIdentification,householdSerialNumber,nameOfHOH,totalMale,totalFemale,phoneNumber,remarks
123,1,45,,,,,,,
```

### **Example Request**
```bash
curl -X GET \
  http://localhost:3000/survey-enumeration-area-household-listing/template/csv/123 \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -o household_listing_template.csv
```

### **Template Fields**
| Field | Type | Pre-populated | Description |
|-------|------|---------------|-------------|
| surveyEnumerationAreaId | Integer | ✅ Yes | Link to survey EA |
| surveyId | Integer | ✅ Yes | Survey reference |
| enumerationAreaId | Integer | ✅ Yes | EA reference |
| structureNumber | String | ❌ No | Building/structure identifier |
| householdIdentification | String | ❌ No | Unique household ID |
| householdSerialNumber | Integer | ❌ No | Sequential number within EA |
| nameOfHOH | String | ❌ No | Name of Head of Household |
| totalMale | Integer | ❌ No | Number of males |
| totalFemale | Integer | ❌ No | Number of females |
| phoneNumber | String | ❌ No | Contact number |
| remarks | String | ❌ No | Additional notes |

---

## 📤 5. Upload Household Listings (Bulk)

### **Endpoint**
```
POST /survey-enumeration-area-household-listing/bulk
```

### **Purpose**
Submit multiple household listings at once for a specific enumeration area.

### **Authorization**
- **Roles**: ADMIN, SUPERVISOR, ENUMERATOR
- **JWT Token**: Required

### **Request Body (DTO)**
```typescript
// Array of CreateSurveyEnumerationAreaHouseholdListingDto
[
  {
    surveyEnumerationAreaId: number;    // Required
    structureNumber: string;            // Required
    householdIdentification: string;    // Required
    householdSerialNumber: number;      // Required, Min: 1
    nameOfHOH: string;                  // Required
    totalMale: number;                  // Required, Min: 0
    totalFemale: number;                // Required, Min: 0
    phoneNumber?: string;               // Optional
    remarks?: string;                   // Optional
  }
]
```

### **DTO Validation Rules**
```typescript
export class CreateSurveyEnumerationAreaHouseholdListingDto {
  @IsInt()
  @IsNotEmpty()
  surveyEnumerationAreaId: number;

  @IsString()
  @IsNotEmpty()
  structureNumber: string;

  @IsString()
  @IsNotEmpty()
  householdIdentification: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  householdSerialNumber: number;

  @IsString()
  @IsNotEmpty()
  nameOfHOH: string;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  totalMale: number;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  totalFemale: number;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
```

### **Example Request**
```bash
curl -X POST \
  http://localhost:3000/survey-enumeration-area-household-listing/bulk \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '[
    {
      "surveyEnumerationAreaId": 123,
      "structureNumber": "BLD-001",
      "householdIdentification": "HH-2025-001",
      "householdSerialNumber": 1,
      "nameOfHOH": "Tashi Dorji",
      "totalMale": 3,
      "totalFemale": 2,
      "phoneNumber": "17123456",
      "remarks": "Complete household"
    },
    {
      "surveyEnumerationAreaId": 123,
      "structureNumber": "BLD-002",
      "householdIdentification": "HH-2025-002",
      "householdSerialNumber": 2,
      "nameOfHOH": "Pema Wangmo",
      "totalMale": 2,
      "totalFemale": 3,
      "phoneNumber": "17654321",
      "remarks": ""
    }
  ]'
```

### **Response Structure**
```json
{
  "success": 2,
  "failed": 0,
  "created": [
    {
      "id": 1,
      "surveyEnumerationAreaId": 123,
      "structureNumber": "BLD-001",
      "householdIdentification": "HH-2025-001",
      "householdSerialNumber": 1,
      "nameOfHOH": "Tashi Dorji",
      "totalMale": 3,
      "totalFemale": 2,
      "phoneNumber": "17123456",
      "remarks": "Complete household",
      "createdAt": "2025-11-07T10:00:00.000Z",
      "updatedAt": "2025-11-07T10:00:00.000Z"
    }
  ],
  "errors": []
}
```

### **Error Response Example**
```json
{
  "success": 1,
  "failed": 1,
  "created": [...],
  "errors": [
    {
      "listing": {
        "surveyEnumerationAreaId": 123,
        "householdSerialNumber": 3,
        ...
      },
      "error": "Household with serial number 3 already exists for this survey enumeration area"
    }
  ]
}
```

---

## 📋 6. View Household Listings by Enumeration Area

### **Endpoint**
```
GET /survey-enumeration-area-household-listing/by-survey-ea/:surveyEnumerationAreaId
```

### **Purpose**
View all household listings submitted for a specific enumeration area.

### **Route Parameters**
- `surveyEnumerationAreaId` (number) - The survey enumeration area ID

### **Authorization**
- **Roles**: ADMIN, SUPERVISOR, ENUMERATOR
- **JWT Token**: Required

### **Response Structure**
```json
[
  {
    "id": 1,
    "surveyEnumerationAreaId": 123,
    "structureNumber": "BLD-001",
    "householdIdentification": "HH-2025-001",
    "householdSerialNumber": 1,
    "nameOfHOH": "Tashi Dorji",
    "totalMale": 3,
    "totalFemale": 2,
    "phoneNumber": "17123456",
    "remarks": "Complete household",
    "createdAt": "2025-11-07T10:00:00.000Z",
    "updatedAt": "2025-11-07T10:00:00.000Z",
    "surveyEnumerationArea": {
      "id": 123,
      "surveyId": 1,
      "enumerationAreaId": 45
    }
  }
]
```

### **Example Request**
```bash
curl -X GET \
  http://localhost:3000/survey-enumeration-area-household-listing/by-survey-ea/123 \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 📊 7. Get Household Statistics by Enumeration Area

### **Endpoint**
```
GET /survey-enumeration-area-household-listing/by-survey-ea/:surveyEnumerationAreaId/statistics
```

### **Purpose**
Get statistics for household listings in a specific enumeration area.

### **Route Parameters**
- `surveyEnumerationAreaId` (number) - The survey enumeration area ID

### **Authorization**
- **Roles**: ADMIN, SUPERVISOR, ENUMERATOR
- **JWT Token**: Required

### **Response Structure**
```json
{
  "totalHouseholds": 45,
  "totalMale": 135,
  "totalFemale": 128,
  "totalPopulation": 263,
  "householdsWithPhone": 42,
  "averageHouseholdSize": "5.84"
}
```

### **Response Fields**
- `totalHouseholds` - Total number of households
- `totalMale` - Total male population
- `totalFemale` - Total female population
- `totalPopulation` - Total population (male + female)
- `householdsWithPhone` - Number of households with phone numbers
- `averageHouseholdSize` - Average household size (decimal string)

### **Example Request**
```bash
curl -X GET \
  http://localhost:3000/survey-enumeration-area-household-listing/by-survey-ea/123/statistics \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## ✅ 8. Submit Enumeration Area for Validation

### **Endpoint**
```
POST /survey-enumeration-area/:id/submit
```

### **Purpose**
Mark an enumeration area as complete and submit it for admin validation.

### **Route Parameters**
- `id` (number) - The survey enumeration area ID

### **Authorization**
- **Roles**: SUPERVISOR only
- **JWT Token**: Required

### **Request Body (DTO)**
```typescript
export class SubmitSurveyEnumerationAreaDto {
  @IsInt()
  @IsNotEmpty()
  submittedBy: number;      // User ID of supervisor

  @IsString()
  @IsOptional()
  comments?: string;        // Optional submission comments
}
```

### **Example Request**
```bash
curl -X POST \
  http://localhost:3000/survey-enumeration-area/123/submit \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "submittedBy": 101,
    "comments": "All households surveyed and data verified"
  }'
```

### **Response Structure**
```json
{
  "id": 123,
  "surveyId": 1,
  "enumerationAreaId": 45,
  "isSubmitted": true,
  "submittedBy": 101,
  "submissionDate": "2025-11-07T10:30:00.000Z",
  "isValidated": false,
  "validatedBy": null,
  "validationDate": null,
  "comments": "All households surveyed and data verified",
  "createdAt": "2025-10-01T08:00:00.000Z",
  "updatedAt": "2025-11-07T10:30:00.000Z",
  "survey": {...},
  "enumerationArea": {...},
  "submitter": {...}
}
```

### **Business Rules**
- ✅ Can only submit if `isSubmitted = false`
- ✅ Cannot submit if already validated
- ✅ Sets `isSubmitted = true`, `submissionDate = NOW()`, `submittedBy = supervisorId`
- ✅ After submission, only admin can validate or reject

---

## 🔄 Complete Workflow Example

### **Step 1: Load Dashboard**
```bash
GET /survey/supervisor/101/active
```
**Result**: Get all active surveys and their enumeration areas

### **Step 2: View EA Details**
```bash
GET /survey-enumeration-area/by-survey/1
```
**Result**: See all EAs for survey #1, check which ones need data

### **Step 3: Download Template**
```bash
GET /survey-enumeration-area-household-listing/template/csv/123
```
**Result**: Get CSV template for EA #123

### **Step 4: Fill CSV Offline**
Supervisor collects household data and fills the CSV template

### **Step 5: Upload Household Data**
```bash
POST /survey-enumeration-area-household-listing/bulk
```
**Body**: Array of household listings from CSV

### **Step 6: Verify Upload**
```bash
GET /survey-enumeration-area-household-listing/by-survey-ea/123/statistics
```
**Result**: Check total households and population counts

### **Step 7: Submit for Validation**
```bash
POST /survey-enumeration-area/123/submit
```
**Result**: EA marked as submitted, awaiting admin validation

### **Step 8: Track Progress**
```bash
GET /survey-enumeration-area/by-survey/1/statistics
```
**Result**: View overall progress across all EAs

---

## 🎯 Quick Reference: Essential Routes for Supervisors

| Action | Method | Endpoint | Key Parameters |
|--------|--------|----------|----------------|
| Dashboard Load | GET | `/survey/supervisor/:supervisorId/active` | supervisorId |
| View EAs | GET | `/survey-enumeration-area/by-survey/:surveyId` | surveyId, filters |
| Progress Stats | GET | `/survey-enumeration-area/by-survey/:surveyId/statistics` | surveyId |
| Download Template | GET | `/survey-enumeration-area-household-listing/template/csv/:surveyEnumerationAreaId` | surveyEnumerationAreaId |
| Upload Households | POST | `/survey-enumeration-area-household-listing/bulk` | Array of listings |
| View Households | GET | `/survey-enumeration-area-household-listing/by-survey-ea/:surveyEnumerationAreaId` | surveyEnumerationAreaId |
| EA Statistics | GET | `/survey-enumeration-area-household-listing/by-survey-ea/:surveyEnumerationAreaId/statistics` | surveyEnumerationAreaId |
| Submit EA | POST | `/survey-enumeration-area/:id/submit` | id, submittedBy |

---

## 🔐 Authorization Notes

All routes require:
- ✅ Valid JWT token in `Authorization: Bearer {token}` header
- ✅ User must have SUPERVISOR role (or ADMIN)
- ✅ Routes are protected by `@UseGuards(JwtAuthGuard, RolesGuard)`

---

## 📝 Common Validation Errors

### **Household Upload Errors**
```json
{
  "statusCode": 400,
  "message": [
    "totalMale must not be less than 0",
    "householdSerialNumber must be a positive number",
    "nameOfHOH should not be empty"
  ],
  "error": "Bad Request"
}
```

### **Duplicate Household Serial Number**
```json
{
  "errors": [
    {
      "listing": {...},
      "error": "Household with serial number 5 already exists for this survey enumeration area"
    }
  ]
}
```

### **Submit Already Submitted EA**
```json
{
  "statusCode": 400,
  "message": "Data has already been submitted",
  "error": "Bad Request"
}
```

---

## 💡 Best Practices

1. **Always check statistics before submission** - Verify household counts are correct
2. **Download fresh templates** - Don't reuse old CSV files to avoid ID mismatches
3. **Validate CSV data locally** - Check for missing required fields before upload
4. **Submit in batches** - Break large EAs into multiple uploads if needed
5. **Track progress regularly** - Use statistics endpoint to monitor completion
6. **Add meaningful comments** - Include notes when submitting for validation

---

This documentation provides all the necessary routes and DTOs for supervisors to manage their enumeration areas and household listings efficiently! 🚀
