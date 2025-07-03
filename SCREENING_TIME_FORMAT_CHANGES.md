# Screening Time Format Changes

## Overview
Updated the frontend to handle the new TIME data type (HH:MM:SS format) instead of the previous DOUBLE format for `startTime` and `endTime` fields in the Screening entity.

## Changes Made

### 1. Admin Master Screening Component (`admin-master-screening.component.ts`)

#### Updated Functions:
- **`formatTimeToMySQLTime`** (formerly `formatTimeTo24Hour`):
  - Now converts Date objects and time strings to MySQL TIME format (HH:MM:SS)
  - Handles both new TIME format and legacy 4-digit format for backward compatibility
  - Returns format: `"19:00:00"` instead of `"1900"`

- **`formatTime`**:
  - Updated to handle TIME format (HH:MM:SS) and display as HH:MM
  - Maintains support for legacy 4-digit format (HHMM)
  - Returns user-friendly format: `"19:00"`

- **`convertTimeToDate`**:
  - Enhanced to parse TIME format (HH:MM:SS) into Date objects for form controls
  - Supports seconds component in time parsing
  - Maintains legacy 4-digit format support

- **`parseTimeToDate`**:
  - Updated for calendar event creation
  - Handles TIME format with seconds component
  - Backward compatible with legacy format

- **`getScreeningSeverity`**:
  - Updated time parsing logic to handle TIME format
  - Properly calculates screening status based on new time format

#### Template Updates:
- Updated time display to use `formatTime()` method for consistent formatting
- Now displays: `"19:00 - 21:30"` instead of raw database values

### 2. Admin Screening Create Component (`admin-screening-create.component.ts`)

#### Updated Functions:
- **`formatTimeToMySQLTime`**:
  - Converts form time inputs to MySQL TIME format (HH:MM:SS)
  - Handles Date objects from PrimeNG calendar components
  - Ensures proper seconds component (`00` if not provided)

## Data Format Changes

### Previous Format (DOUBLE):
```typescript
{
  startTime: 1900,  // Number representing 19:00
  endTime: 2130     // Number representing 21:30
}
```

### New Format (TIME):
```typescript
{
  startTime: "19:00:00",  // String in HH:MM:SS format
  endTime: "21:30:00"     // String in HH:MM:SS format
}
```

## Benefits

1. **Semantic Clarity**: Database clearly understands these are time values
2. **Better Validation**: MySQL validates proper time format
3. **Time Operations**: MySQL can perform time arithmetic and comparisons
4. **Standardization**: Uses universally understood time format
5. **Query Efficiency**: Better indexing and optimization for time-based operations

## Backward Compatibility

All functions maintain support for the legacy 4-digit format (HHMM) to ensure smooth transition and compatibility with existing data.

## Usage Examples

### Creating Screenings:
```typescript
const screeningData = {
  hallId: 1,
  movieId: 1,
  date: '2025-07-01',
  startTime: '19:00:00',  // 7:00 PM
  endTime: '21:30:00',    // 9:30 PM
  // ... other fields
};
```

### Display Format:
- Database stores: `"19:00:00"`
- User sees: `"19:00"`
- Form inputs work with PrimeNG calendar time pickers

## Testing Considerations

- Test with both new TIME format data and legacy numeric format
- Verify calendar events display correctly
- Ensure form submissions create proper TIME format
- Check screening status calculations work correctly
- Validate time filtering and sorting functionality
