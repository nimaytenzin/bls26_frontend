# NSFD System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [User Roles and Permissions](#user-roles-and-permissions)
3. [Core Modules and Features](#core-modules-and-features)
4. [User Capabilities by Role](#user-capabilities-by-role)
5. [Data Service Layer](#data-service-layer)
6. [Technical Architecture](#technical-architecture)

---

## System Overview

The **National Statistical Frame Database (NSFD) Frontend** is an Angular-based web application designed to manage Bhutan's statistical sampling frame infrastructure. The system facilitates survey management, household enumeration, geographic data management, and statistical sampling operations.

### Key Purpose
- Manage Bhutan's national sampling frame (enumeration areas, households, administrative boundaries)
- Support survey creation, management, and execution
- Enable field data collection by enumerators
- Provide public access to statistical data
- Generate statistical samples for surveys

### System Components
- **Frontend**: Angular 17+ application with PrimeNG UI components
- **Authentication**: JWT-based authentication with role-based access control
- **Mapping**: Leaflet-based interactive maps for geographic visualization
- **Data Management**: Comprehensive CRUD operations for all entities

---

## User Roles and Permissions

### 1. **ADMIN** (Administrator)
**Highest level of access** - Full system control

**Capabilities:**
- Complete system administration
- User management (create, update, delete all user types)
- Master data management (all geographic entities)
- Survey creation and management
- Data uploads and bulk operations
- System settings configuration
- Reports generation and data exports

**Access:**
- All admin routes (`/admin/*`)
- Protected by `AdminGuard` and `AuthGuard`
- Role check: `UserRole.ADMIN`

---

### 2. **SUPERVISOR**
**Field operations management** - Oversees surveys and enumerators

**Capabilities:**
- View assigned surveys (based on dzongkhag assignments)
- Monitor survey progress and statistics
- View active surveys in their assigned dzongkhags
- Access national data viewer (read-only)
- Review survey details and enumeration area status

**Access:**
- Supervisor routes (`/supervisor/*`)
- Protected by `AuthGuard` with `UserRole.SUPERVISOR`
- Limited to assigned dzongkhags

**Special Features:**
- Assigned to specific dzongkhags by admin
- Can view survey statistics for assigned areas
- Dashboard shows overview of active surveys

---

### 3. **ENUMERATOR**
**Field data collection** - Primary data entry role

**Capabilities:**
- View assigned surveys and enumeration areas
- Create and manage household listings
- View enumeration area maps
- Submit household data
- View sampling results for assigned areas
- Access personal profile and past surveys

**Access:**
- Enumerator routes (`/enumerator/*`)
- Protected by `AuthGuard` with `UserRole.ENUMERATOR`
- Limited to assigned surveys and enumeration areas

**Special Features:**
- Assigned to specific surveys and enumeration areas
- Can create/edit household listings
- Can view maps of assigned areas
- Can see sampling results after submission

---

### 4. **PUBLIC** (Unauthenticated)
**Read-only public access** - No authentication required

**Capabilities:**
- View national statistics and data
- Browse dzongkhag-level data
- View administrative zone information
- Download geographic boundaries (GeoJSON/KML)
- Access geographic statistical codes

**Access:**
- Public routes (root `/`)
- No authentication required
- Read-only access to published data

---

## Core Modules and Features

### 1. **Authentication & User Management Module**

#### Features:
- **Login/Logout**: JWT-based authentication
- **User Registration**: Role-based user creation
- **Password Management**: Change password, admin reset password
- **User CRUD**: Create, read, update, delete users
- **Role Management**: Assign roles (ADMIN, SUPERVISOR, ENUMERATOR)
- **Supervisor-Dzongkhag Assignment**: Link supervisors to specific dzongkhags
- **User Search**: Search by name, CID, email, phone
- **Profile Management**: View and update user profiles

#### Data Services:
- `auth.service.ts` - Authentication service
- `auth.api.ts` - API communication layer
- `auth.interface.ts` - Type definitions

---

### 2. **Master Data Management Module**

#### Geographic Hierarchy:
1. **Dzongkhags** (Districts)
   - Highest administrative level
   - Area codes, area in sq km
   - Contains administrative zones

2. **Administrative Zones** (Gewogs/Thromdes)
   - Rural: Gewogs
   - Urban: Thromdes
   - Contains sub-administrative zones

3. **Sub-Administrative Zones** (Chiwogs/LAPs)
   - Rural: Chiwogs
   - Urban: LAPs (Local Area Plans)
   - Contains enumeration areas

4. **Enumeration Areas (EAs)**
   - Smallest geographic unit
   - Contains households
   - Has geographic boundaries (GeoJSON/KML)
   - Area codes and names

#### Features:
- **CRUD Operations**: Create, read, update, delete all geographic entities
- **Bulk Upload**: Upload multiple entities via CSV/KML
- **Geographic Boundaries**: Upload and manage GeoJSON/KML files
- **EA Operations**: Split and merge enumeration areas
- **History Tracking**: View EA lineage and change history
- **Data Validation**: Ensure data integrity across hierarchy

#### Data Services:
- `dzongkhag/` - District management
- `administrative-zone/` - Gewog/Thromde management
- `sub-administrative-zone/` - Chiwog/LAP management
- `enumeration-area/` - EA management

---

### 3. **Survey Management Module**

#### Survey Lifecycle:
1. **Creation**: Admin creates survey with name, description, dates, year
2. **Enumeration Area Assignment**: Assign EAs to survey
3. **Enumerator Assignment**: Assign enumerators to survey-EA combinations
4. **Active Status**: Survey becomes active for data collection
5. **Submission**: Enumerators submit household listings
6. **Validation**: Supervisors/Admins validate submissions
7. **Sampling**: Generate statistical samples from household listings
8. **Completion**: Survey ends and data is finalized

#### Survey Features:
- **Survey CRUD**: Create, read, update, delete surveys
- **Status Management**: ACTIVE, ENDED status tracking
- **Statistics Dashboard**: 
  - Total households, population
  - Submission/validation percentages
  - Enumerator assignments
  - EA coverage statistics
- **Survey Viewer**: Detailed survey information and progress
- **EA Management**: Add/remove enumeration areas from surveys
- **Enumerator Management**: Assign enumerators to survey-EA combinations

#### Survey Statistics Include:
- Total dzongkhags, enumeration areas
- Submitted/validated/enumerated/sampled/published counts
- Total enumerators, households
- Population breakdown (male/female)
- Average household size
- Progress percentages

#### Data Services:
- `survey/` - Survey management
- `survey-enumeration-area/` - Survey-EA associations
- `survey-enumerator/` - Enumerator assignments

---

### 4. **Household Listing Module**

#### Household Data Structure:
- Structure number
- Household identification
- Household serial number
- Name of Head of Household (HOH)
- Total male/female counts
- Phone number (optional)
- Remarks (optional)

#### Features:
- **Create Household Listings**: Enumerators create household records
- **Edit/Update**: Modify existing household listings
- **Delete**: Remove household listings (with permissions)
- **Bulk Upload**: Upload household data via CSV
- **View by Structure**: Organize households by building/structure
- **Search and Filter**: Find specific households
- **Submission Status**: Track submission and validation status

#### Data Services:
- `household-listing/` - Household CRUD operations
- `household-listings/` - Bulk operations and queries
- `household-upload/` - CSV upload functionality

---

### 5. **Sampling Module**

#### Sampling Methods:
1. **CSS (Circular Systematic Sampling)**
   - Systematic selection with circular wrap-around
   - Suitable for ordered populations

2. **SRS (Simple Random Sampling)**
   - Random selection without replacement
   - Suitable for unordered populations

#### Sampling Features:
- **Survey-Level Configuration**: Set default sampling method and sample sizes
- **EA-Level Sampling**: Run sampling for individual enumeration areas
- **Bulk Sampling**: Run sampling for multiple EAs simultaneously
- **Sampling Jobs**: Track async sampling operations
- **Sampling Results**: View selected households with selection order
- **Full Selection**: Automatically select all households if population ≤ sample size
- **Replacement Tracking**: Track replacement households
- **Sampling History**: View past sampling runs

#### Sampling Configuration:
- Default method (CSS/SRS)
- Default sample size
- Urban-specific sample size
- Rural-specific sample size

#### Sampling Status:
- `not_run` - No sampling executed
- `pending` - Queued for execution
- `running` - Currently executing
- `completed` - Successfully completed
- `full_selection` - All households selected
- `failed` - Execution failed

#### Data Services:
- `sampling/` - Sampling operations and configuration

---

### 6. **Data Viewer Module**

#### Public Data Viewers:
1. **National Data Viewer**
   - Country-wide statistics
   - Total households, EAs, dzongkhags
   - Interactive map with color-coded visualization
   - List view with sorting
   - Download national boundaries

2. **Dzongkhag Data Viewer**
   - District-level statistics
   - Administrative zone breakdown
   - Gewog/Thromde lists
   - Map visualization
   - Download dzongkhag boundaries

3. **Administrative Zone Viewer**
   - Gewog/Thromde level statistics
   - Sub-administrative zone breakdown
   - EA lists and counts

4. **Sub-Administrative Zone Viewer**
   - Chiwog/LAP level statistics
   - EA details

5. **Enumeration Area Viewer** (Admin only)
   - Detailed EA information
   - Household listings
   - Map view with boundaries
   - Trends and statistics

#### Admin Data Viewers:
- Enhanced versions with edit capabilities
- Detailed statistics and analytics
- EA history and lineage tracking
- Current household listing views
- Enumeration area trends

#### Features:
- **Interactive Maps**: Leaflet-based maps with multiple basemaps
- **Color-Coded Visualization**: Gradient colors based on metrics
- **Download Options**: GeoJSON and KML format exports
- **Statistics Cards**: Key metrics displayed prominently
- **List Views**: Tabular data with sorting and filtering
- **Drill-Down Navigation**: Navigate from national to EA level

#### Data Services:
- `statistics/` - Statistical data aggregation
- `annual-statistics/` - Annual statistics by geographic level
- `downloads/` - Data export functionality

---

### 7. **EA Operations Module**

#### Features:
1. **EA Split Operation**
   - Split one EA into multiple EAs
   - Maintain household data integrity
   - Track split history

2. **EA Merge Operation**
   - Merge multiple EAs into one
   - Consolidate household data
   - Track merge history

3. **History Tracking**
   - View EA lineage (parent/child relationships)
   - Track all changes over time
   - View operation history

#### Data Services:
- Uses enumeration-area service with special operations

---

### 8. **Data Upload Module**

#### Upload Types:
1. **Auto KML Upload**
   - Upload KML files for geographic boundaries
   - Automatic parsing and processing
   - Batch upload support

2. **Auto Household Data Upload by Dzongkhag**
   - Upload household counts by dzongkhag
   - CSV format with EA and household counts
   - Automatic household listing creation

3. **Single SAZ + EA Upload**
   - Upload sub-administrative zone with enumeration areas
   - Combined data upload

4. **Multi SAZ - Single EA Upload**
   - Upload multiple SAZs with single EA
   - Complex relationship handling

#### Features:
- **CSV Parsing**: Automatic CSV file parsing
- **Error Handling**: Detailed error reports
- **Validation**: Data validation before import
- **Bulk Processing**: Process multiple records
- **Progress Tracking**: Upload progress indicators

#### Data Services:
- `auto-kml-upload/` - KML upload processing
- `household-upload/` - Household data upload
- `kml-parser/` - KML file parsing

---

### 9. **Reports Module**

#### Available Reports:
1. **Geographic Statistical Code Report**
   - Complete geographic codes for all levels
   - Exportable format
   - Hierarchical structure

2. **Dzongkhag EA Summary** (Commented out, available for future)
   - Summary statistics by dzongkhag
   - EA counts and distributions

#### Features:
- **Report Generation**: Generate reports on demand
- **Export Options**: Download reports in various formats
- **Filtering**: Filter reports by geographic level
- **Statistics Aggregation**: Aggregate data across levels

#### Data Services:
- `reports/` - Report generation services

---

### 10. **Settings Module**

#### Features:
1. **Public Page Settings**
   - Configure public dashboard content
   - Set information boxes
   - Manage displayed statistics
   - Customize public-facing information

#### Data Services:
- `public-page-settings/` - Settings management

---

## User Capabilities by Role

### ADMIN Capabilities

#### Dashboard & Overview
- ✅ View national data viewer dashboard
- ✅ Access comprehensive system statistics
- ✅ Monitor all surveys and their status

#### Survey Management
- ✅ Create new surveys
- ✅ View all surveys (active and ended)
- ✅ Edit survey details
- ✅ Assign enumeration areas to surveys
- ✅ Assign enumerators to survey-EA combinations
- ✅ View detailed survey statistics
- ✅ Manage survey status (ACTIVE/ENDED)
- ✅ View survey progress and completion rates

#### Master Data Management
- ✅ Manage Dzongkhags (CRUD)
- ✅ Manage Administrative Zones - Gewogs/Thromdes (CRUD)
- ✅ Manage Sub-Administrative Zones - Chiwogs/LAPs (CRUD)
- ✅ Manage Enumeration Areas (CRUD)
- ✅ Upload geographic boundaries (KML/GeoJSON)
- ✅ Bulk upload geographic data
- ✅ View and edit EA boundaries on maps

#### EA Operations
- ✅ Split enumeration areas
- ✅ Merge enumeration areas
- ✅ View EA split/merge history
- ✅ View EA lineage (parent/child relationships)
- ✅ Track EA changes over time

#### Data Management
- ✅ Auto KML upload
- ✅ Auto household data upload by dzongkhag
- ✅ Single SAZ + EA upload
- ✅ Multi SAZ - Single EA upload
- ✅ Bulk household data operations

#### User Management
- ✅ Create users (Admin, Supervisor, Enumerator)
- ✅ Update user information
- ✅ Delete users
- ✅ Search users by various criteria
- ✅ Assign supervisors to dzongkhags
- ✅ Remove supervisor-dzongkhag assignments
- ✅ Reset user passwords
- ✅ Manage user roles and permissions
- ✅ View all users with filtering

#### Data Viewing
- ✅ National data viewer (with edit capabilities)
- ✅ Dzongkhag data viewer
- ✅ Administrative zone data viewer
- ✅ Sub-administrative zone data viewer
- ✅ Enumeration area data viewer (detailed)
- ✅ View EA trends and statistics
- ✅ View current household listings
- ✅ View EA maps with boundaries

#### Reports & Downloads
- ✅ Generate geographic statistical code reports
- ✅ Download data in various formats
- ✅ Export statistics
- ✅ Generate dzongkhag EA summaries

#### Settings
- ✅ Configure public page settings
- ✅ Manage system-wide configurations

---

### SUPERVISOR Capabilities

#### Dashboard & Overview
- ✅ View national data viewer dashboard (read-only)
- ✅ Access overview of assigned surveys
- ✅ View statistics for assigned dzongkhags

#### Survey Management
- ✅ View active surveys in assigned dzongkhags
- ✅ View detailed survey information
- ✅ Monitor survey progress
- ✅ View survey statistics
- ✅ View enumeration area status
- ❌ Cannot create or edit surveys
- ❌ Cannot assign enumeration areas
- ❌ Cannot assign enumerators

#### Data Viewing
- ✅ View national statistics (read-only)
- ✅ View dzongkhag data (read-only, for assigned dzongkhags)
- ❌ Cannot edit any data
- ❌ Limited to assigned dzongkhags only

#### Limitations
- ❌ No master data management access
- ❌ No user management access
- ❌ No EA operations access
- ❌ No data upload capabilities
- ❌ No settings access
- ❌ No reports generation

---

### ENUMERATOR Capabilities

#### Dashboard
- ✅ View personal dashboard
- ✅ See assigned surveys
- ✅ View assigned enumeration areas
- ✅ Track personal progress

#### Survey Access
- ✅ View assigned surveys
- ✅ View survey details
- ✅ View past surveys
- ✅ Access survey-specific enumeration areas
- ❌ Cannot create or edit surveys
- ❌ Cannot view other enumerators' assignments

#### Household Listing
- ✅ Create household listings
- ✅ Edit household listings (own submissions)
- ✅ View household listings for assigned EAs
- ✅ View household listings by structure
- ✅ Submit household data
- ❌ Cannot delete household listings (typically)
- ❌ Limited to assigned enumeration areas only

#### Enumeration Area Access
- ✅ View assigned enumeration area maps
- ✅ View enumeration area boundaries
- ✅ Access household listings for assigned EAs
- ✅ View sampling results for assigned EAs
- ❌ Cannot view other enumerators' EAs

#### Sampling Results
- ✅ View sampling results for assigned enumeration areas
- ✅ See selected households
- ✅ View selection order and method
- ✅ Access sampling metadata

#### Profile
- ✅ View personal profile
- ✅ Update profile information (if allowed)
- ✅ View assignment history

#### Limitations
- ❌ No survey management access
- ❌ No master data management access
- ❌ No user management access
- ❌ No data viewing beyond assigned areas
- ❌ No reports or downloads
- ❌ No settings access
- ❌ Limited to assigned surveys and enumeration areas only

---

### PUBLIC (Unauthenticated) Capabilities

#### Data Viewing
- ✅ View national data viewer
- ✅ View dzongkhag data
- ✅ View administrative zone data
- ✅ View sub-administrative zone data
- ✅ Browse geographic statistical codes
- ✅ View interactive maps
- ✅ Access statistics and summaries

#### Data Downloads
- ✅ Download dzongkhag boundaries (GeoJSON/KML)
- ✅ Download administrative zone boundaries
- ✅ Export geographic data

#### Limitations
- ❌ No authentication required (read-only)
- ❌ No edit capabilities
- ❌ No survey access
- ❌ No household data access
- ❌ No user management
- ❌ No reports generation
- ❌ Limited to published/public data only

---

## Data Service Layer

### Service Architecture

The system uses a layered service architecture:

1. **Data Services** (`*.dataservice.ts`)
   - Business logic layer
   - Observable-based reactive programming
   - Error handling
   - Data transformation

2. **API Services** (`*.api.ts`)
   - HTTP communication
   - Request/response handling
   - Authentication headers
   - Error interception

3. **Interfaces/DTOs** (`*.interface.ts`, `*.dto.ts`)
   - Type definitions
   - Data transfer objects
   - Type safety

### Key Data Services

#### Authentication Services
- `auth.service.ts` - Authentication and user management
- `auth.api.ts` - Auth API communication
- `session.service.ts` - Session management

#### Location Services
- `dzongkhag/` - District management
- `administrative-zone/` - Gewog/Thromde management
- `sub-administrative-zone/` - Chiwog/LAP management
- `enumeration-area/` - EA management

#### Survey Services
- `survey/` - Survey CRUD and management
- `survey-enumeration-area/` - Survey-EA associations
- `survey-enumerator/` - Enumerator assignments
- `survey-enumeration-area-structure/` - Structure management

#### Household Services
- `household-listing/` - Household CRUD
- `household-listings/` - Bulk operations
- `household-upload/` - Upload functionality

#### Sampling Services
- `sampling/` - Sampling operations and configuration

#### Statistics Services
- `statistics/` - Statistical aggregation
- `annual-statistics/` - Annual statistics by level

#### Other Services
- `buildings/` - Building/structure management
- `reports/` - Report generation
- `downloads/` - Data export
- `kml-parser/` - KML file parsing
- `public-page-settings/` - Settings management
- `enumerator-service/` - Enumerator-specific operations

---

## Technical Architecture

### Frontend Stack
- **Framework**: Angular 17+ (Standalone components)
- **UI Library**: PrimeNG
- **Styling**: SCSS, Tailwind CSS
- **Maps**: Leaflet
- **State Management**: RxJS Observables
- **Routing**: Angular Router with guards

### Authentication & Authorization
- **Method**: JWT (JSON Web Tokens)
- **Storage**: LocalStorage
- **Guards**: 
  - `AuthGuard` - General authentication
  - `AdminGuard` - Admin-specific access
- **Role-Based Access**: Route-level and component-level

### Routing Structure
```
/                           → Public routes
/auth/*                    → Authentication routes
/admin/*                   → Admin routes (protected)
/supervisor/*              → Supervisor routes (protected)
/enumerator/*              → Enumerator routes (protected)
```

### Key Features
- **Responsive Design**: Mobile and desktop support
- **Interactive Maps**: Leaflet-based geographic visualization
- **Data Export**: GeoJSON and KML format support
- **Bulk Operations**: CSV uploads and batch processing
- **Real-time Updates**: Observable-based reactive updates
- **Error Handling**: Comprehensive error management
- **Loading States**: User feedback during operations

### Environment Configuration
- `environment.ts` - Development configuration
- `environment.production.ts` - Production configuration
- Configurable API URLs and endpoints

---

## Summary

The NSFD Frontend system provides a comprehensive platform for managing Bhutan's national statistical sampling frame. It supports multiple user roles with appropriate permissions, enabling:

- **Administrators** to manage the entire system
- **Supervisors** to oversee field operations
- **Enumerators** to collect household data
- **Public users** to access published statistics

The system handles the complete survey lifecycle from creation to data collection, validation, sampling, and reporting, with robust geographic data management and interactive visualization capabilities.

