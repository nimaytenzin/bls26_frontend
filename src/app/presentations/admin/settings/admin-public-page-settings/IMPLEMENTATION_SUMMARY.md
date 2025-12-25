# Public Page Settings Database Migration - Implementation Summary

## Overview

This document provides a complete guide to converting the public page settings from localStorage to a database-backed solution.

## Files Created

1. **Database Migration Guide**: `DATABASE_MIGRATION_GUIDE.md`
   - Complete database schema
   - Entity definitions (TypeORM example)
   - DTOs (Data Transfer Objects)
   - Backend API implementation examples
   - Migration steps

2. **Component Update Guide**: `COMPONENT_UPDATE_GUIDE.md`
   - Updated component code with async handling
   - Template updates for loading states
   - Migration checklist

3. **Frontend Interface**: `src/app/core/services/public-page-settings.interface.ts`
   - TypeScript interfaces for settings
   - DTO interfaces

4. **Data Service**: `src/app/core/dataservice/public-page-settings/public-page-settings.dataservice.ts`
   - HTTP client service for API calls
   - All CRUD operations

5. **Updated Service**: `src/app/core/services/public-page-settings.service.ts.updated`
   - Reference implementation for updated service
   - Reactive settings with BehaviorSubject
   - Async methods with caching

## Quick Start

### 1. Database Entity (Backend)

**Table Name**: `public_page_settings`

**Key Fields**:
- `id` (Primary Key, always 1 for singleton)
- `map_visualization_mode` (households | enumerationAreas)
- `selected_basemap_id` (string)
- `color_scale` (string)
- `national_data_viewer_title` (string)
- `national_data_viewer_description` (text)
- `national_data_viewer_info_box_content` (text)
- `national_data_viewer_info_box_stats` (string)
- Audit fields: `created_by`, `updated_by`, `created_at`, `updated_at`

### 2. API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/public-page-settings` | Get settings (public) | No |
| GET | `/api/public-page-settings/admin` | Get settings (admin) | Yes |
| PUT | `/api/public-page-settings/admin` | Update settings | Yes (Admin) |
| POST | `/api/public-page-settings/admin/reset` | Reset to defaults | Yes (Admin) |

### 3. Implementation Order

1. **Backend First**:
   - Create database table/entity
   - Implement controller and service
   - Test endpoints

2. **Frontend Next**:
   - Create interface file
   - Create dataservice
   - Update main service (replace localStorage with API calls)
   - Update component to handle async operations

3. **Testing**:
   - Test public endpoint (no auth)
   - Test admin endpoints (with auth)
   - Test component save/load/reset
   - Verify settings persistence

## Key Design Decisions

### Singleton Pattern
The settings table uses a singleton pattern - there's only one settings record with `id = 1`. This ensures:
- Only one configuration exists
- Simple queries (always WHERE id = 1)
- Easy defaults handling

### Caching Strategy
The frontend service caches settings in memory and provides:
- Synchronous getter for backward compatibility
- Observable stream for reactive updates
- Automatic refresh on save/reset

### Public vs Admin Endpoints
- **Public endpoint**: Used by the public data viewer (no auth required)
- **Admin endpoint**: Used by admin panel (requires authentication)
- Both return the same data, but admin allows modifications

## Migration Checklist

### Backend
- [ ] Create database migration/table
- [ ] Create entity class
- [ ] Create DTOs
- [ ] Implement service with singleton logic
- [ ] Implement controller with proper guards
- [ ] Add routes
- [ ] Test endpoints with Postman/curl
- [ ] Seed initial default values

### Frontend
- [ ] Create interface file (copy from `public-page-settings.interface.ts`)
- [ ] Create dataservice (copy from `public-page-settings.dataservice.ts`)
- [ ] Update main service (use `public-page-settings.service.ts.updated` as reference)
- [ ] Update component (use `COMPONENT_UPDATE_GUIDE.md`)
- [ ] Update any consumers of the service (public data viewer pages)
- [ ] Test save/load/reset operations
- [ ] Remove localStorage code after verification

### Testing
- [ ] Test public endpoint returns settings
- [ ] Test admin can update settings
- [ ] Test admin can reset settings
- [ ] Test unauthorized access is blocked
- [ ] Test component loads settings on init
- [ ] Test component saves settings
- [ ] Test component resets settings
- [ ] Test error handling (network errors, etc.)
- [ ] Test settings persist across page refreshes

## Entity Relationship

```
public_page_settings
├── id (PK, always 1)
├── map_visualization_mode
├── selected_basemap_id
├── color_scale
├── national_data_viewer_title
├── national_data_viewer_description
├── national_data_viewer_info_box_content
├── national_data_viewer_info_box_stats
├── created_by (FK → users.id)
├── updated_by (FK → users.id)
├── created_at
└── updated_at
```

## Default Values

All fields have defaults that match the current localStorage implementation:
- `mapVisualizationMode`: 'households'
- `selectedBasemapId`: 'positron'
- `colorScale`: 'blue'
- `nationalDataViewerTitle`: 'National Sampling Frame'
- `nationalDataViewerDescription`: 'Current statistics on households and enumeration areas'
- `nationalDataViewerInfoBoxContent`: 'A sampling frame is a population from which a sample can be drawn...'
- `nationalDataViewerInfoBoxStats`: '3,310 EAs total (1,464 urban, 1,846 rural)'

## Next Steps

1. Review all documentation files
2. Implement backend first (database + API)
3. Test backend endpoints
4. Implement frontend changes
5. Test integration
6. Deploy and verify
7. Remove old localStorage code

