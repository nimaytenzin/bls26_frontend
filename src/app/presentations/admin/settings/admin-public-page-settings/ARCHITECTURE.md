# Architecture Overview

## Current Architecture (localStorage)

```
┌─────────────────────────────────────┐
│  Admin Component                    │
│  (admin-public-page-settings)       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PublicPageSettingsService          │
│  - getSettings()                    │
│  - saveSettings()                   │
│  - resetSettings()                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  localStorage                       │
│  Key: nsfd_public_page_settings    │
└─────────────────────────────────────┘
```

## New Architecture (Database-Backed)

```
┌─────────────────────────────────────┐
│  Admin Component                    │
│  (admin-public-page-settings)       │
│  - loading state                    │
│  - async operations                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PublicPageSettingsService          │
│  - getSettings() [sync, cached]     │
│  - loadSettings() [async]           │
│  - saveSettings() [async]           │
│  - resetSettings() [async]          │
│  - settings$ [Observable]           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PublicPageSettingsDataService      │
│  - getSettings()                    │
│  - getSettingsAdmin()               │
│  - updateSettings()                 │
│  - resetSettings()                  │
└──────────────┬──────────────────────┘
               │ HTTP (REST API)
               ▼
┌─────────────────────────────────────┐
│  Backend API                        │
│  GET    /public-page-settings       │
│  GET    /public-page-settings/admin │
│  PUT    /public-page-settings/admin │
│  POST   /public-page-settings/admin/reset │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PublicPageSettingsController       │
│  (NestJS)                           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PublicPageSettingsService          │
│  (Backend Service)                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Database (PostgreSQL)              │
│  Table: public_page_settings        │
│  - Singleton pattern (id = 1)       │
└─────────────────────────────────────┘
```

## Data Flow

### Reading Settings (Public Data Viewer)

```
Public Component
    │
    ├─► PublicPageSettingsService.getSettings()
    │   │
    │   ├─► Returns cached settings (synchronous)
    │   │
    │   └─► If not cached, returns defaults
    │
    └─► OR subscribe to settings$ Observable
        │
        └─► Auto-updates when settings change
```

### Loading Settings (Admin Component Init)

```
Admin Component.ngOnInit()
    │
    ├─► PublicPageSettingsService.loadSettings()
    │   │
    │   ├─► HTTP GET /api/public-page-settings
    │   │
    │   ├─► Update cache
    │   │
    │   └─► Emit to settings$ Observable
    │
    └─► Component receives settings via subscription
```

### Saving Settings (Admin)

```
Admin Component.saveSettings()
    │
    ├─► PublicPageSettingsService.saveSettings(settings)
    │   │
    │   ├─► HTTP PUT /api/public-page-settings/admin
    │   │   │
    │   │   ├─► Backend validates & saves
    │   │   │
    │   │   └─► Returns updated DTO
    │   │
    │   ├─► Update cache with response
    │   │
    │   └─► Emit to settings$ Observable
    │
    └─► All subscribers (including admin component) update
```

## Component States

### Admin Component State Machine

```
[Initial]
    │
    ├─► [Loading] ──► loadSettings()
    │                    │
    │                    ├─► Success ──► [Loaded] ──► Display form
    │                    │
    │                    └─► Error ──► [Error] ──► Show error, use defaults
    │
[Loaded]
    │
    ├─► User edits form ──► [Dirty]
    │
    ├─► saveSettings() ──► [Saving] ──► Success ──► [Saved] ──► [Loaded]
    │                              │
    │                              └─► Error ──► [Error] ──► [Loaded]
    │
    └─► resetSettings() ──► [Saving] ──► Success ──► [Loaded]
                                    │
                                    └─► Error ──► [Error] ──► [Loaded]
```

## Service Layer Responsibilities

### PublicPageSettingsService (Frontend)
- **Caching**: Maintains in-memory cache of settings
- **Synchronous Access**: Provides `getSettings()` for backward compatibility
- **Reactive Updates**: Provides `settings$` Observable for reactive components
- **API Abstraction**: Hides HTTP details from components
- **Error Handling**: Provides fallback to defaults on errors
- **Default Values**: Maintains default settings

### PublicPageSettingsDataService (Frontend)
- **HTTP Communication**: Handles all HTTP requests
- **URL Management**: Constructs API endpoints
- **Error Propagation**: Passes errors to service layer
- **Type Safety**: Uses TypeScript interfaces for request/response

### PublicPageSettingsService (Backend)
- **Singleton Logic**: Ensures only one settings record exists
- **Default Creation**: Creates default record if none exists
- **Data Validation**: Validates input data
- **Audit Trail**: Tracks who created/updated settings
- **Business Logic**: Handles reset, update operations

## Database Schema Details

### Singleton Pattern Implementation

The table always has exactly one record with `id = 1`:

```sql
-- First access: create default record
INSERT INTO public_page_settings (id, ...) VALUES (1, ...);

-- Subsequent accesses: always query id = 1
SELECT * FROM public_page_settings WHERE id = 1;

-- Update: always update id = 1
UPDATE public_page_settings SET ... WHERE id = 1;
```

### Constraints

- `id` is always 1 (primary key)
- `map_visualization_mode` is enum: 'households' | 'enumerationAreas'
- `color_scale` has CHECK constraint for valid values
- All fields have NOT NULL with defaults (except nullable text fields)

## Security Considerations

### Public Endpoint
- No authentication required
- Read-only access
- Used by public data viewer pages
- Should be cached by CDN/proxy if possible

### Admin Endpoints
- Require JWT authentication
- Require Admin role
- Allow create/update/delete operations
- Should log all changes for audit

## Performance Considerations

### Caching Strategy
1. **Frontend Cache**: Service maintains in-memory cache
2. **HTTP Cache**: Public endpoint can use Cache-Control headers
3. **Database**: Singleton query is very fast (indexed primary key)

### Optimization Opportunities
- Use HTTP caching headers for public endpoint
- Implement service-side caching (Redis) if needed
- Consider WebSocket updates if real-time sync needed

