# Admin Dashboard Routes Documentation

## Overview
This document provides comprehensive documentation for all routes required for the Movie Booking Application Admin Dashboard. The admin panel provides full system access for managing movies, theaters, bookings, users, and system configuration.

## Base Route Structure
All admin routes are prefixed with `/admin` and protected by authentication guards.

## Route Hierarchy

### 1. Dashboard Routes

#### **Main Dashboard**
- **Route:** `/admin`
- **Component:** `AdminDashboardComponent`
- **Description:** Primary dashboard with overview statistics, charts, and recent activity
- **Features:**
  - Revenue statistics and trends
  - Booking metrics and analytics
  - Movie performance overview
  - Theater occupancy status
  - Real-time dashboard widgets
  - Recent bookings table
  - Quick action buttons

### 2. Content Management Routes

#### **Movies Management**
- **Route:** `/admin/master-movies`
- **Component:** `AdminMasterMoviesComponent`
- **Description:** Complete movie catalog management
- **Features:**
  - Movie listing with search and filters
  - Add/Edit/Delete movies
  - Movie status management (Active, Inactive, Coming Soon)
  - Bulk operations
  - Movie poster and media management

#### **Movie Details**
- **Route:** `/admin/master-movies/:id`
- **Component:** `AdminMovieDetailComponent`
- **Description:** Detailed view and editing for individual movies
- **Features:**
  - Complete movie information form
  - Cast and crew management
  - Screening schedule overview
  - Revenue and booking analytics for the movie
  - Movie media gallery

#### **Theaters & Halls Management**
- **Route:** `/admin/master-theatres`
- **Component:** `AdminMasterTheatreComponent`
- **Description:** Theater and hall configuration management
- **Features:**
  - Theater listing and management
  - Hall configuration (seating layout, capacity)
  - Theater status monitoring
  - Equipment and facility management
  - Location and contact information

#### **Screenings Management**
- **Route:** `/admin/master-screenings`
- **Component:** `AdminMasterScreeningComponent`
- **Description:** Movie screening schedule management
- **Features:**
  - Schedule creation and editing
  - Time slot management
  - Theater and hall assignment
  - Pricing configuration
  - Bulk scheduling operations

### 3. Operations Routes

#### **Bookings Management**
- **Route:** `/admin/master-bookings`
- **Component:** `AdminMasterBookingsComponent`
- **Description:** Comprehensive booking management system
- **Features:**
  - Booking search and filtering
  - Booking status updates
  - Refund and cancellation processing
  - Customer communication tools
  - Booking analytics and reports

#### **Create Booking (Counter Sales)**
- **Route:** `/admin/master-bookings/create`
- **Component:** `AdminCreateBookingComponent`
- **Description:** Manual ticket booking interface for counter staff
- **Features:**
  - Movie and screening selection
  - Seat selection interface
  - Customer information entry
  - Payment processing
  - Ticket printing functionality

### 4. User Management Routes

#### **General User Management**
- **Route:** `/admin/user-management`
- **Component:** `AdminUserManagementComponent`
- **Description:** Central user management dashboard
- **Features:**
  - User listing and search
  - Role assignment and permissions
  - User activity monitoring
  - Account status management
  - User analytics

#### **Theater Staff Management**
- **Route:** `/admin/user-management/theatre-staffs`
- **Component:** `AdminUserManagementTheatreStaffsComponent`
- **Description:** Management of theater staff accounts
- **Features:**
  - Staff role assignments
  - Theater-specific permissions
  - Staff scheduling integration
  - Performance tracking

#### **Executive Producers Management**
- **Route:** `/admin/user-management/producers`
- **Component:** `AdminUserManagementExecutiveProducersComponent`
- **Description:** Management of executive producer accounts
- **Features:**
  - Producer permissions and access
  - Content approval workflows
  - Revenue sharing configurations
  - Producer analytics

### 5. System Configuration Routes

#### **Languages Management**
- **Route:** `/admin/master-languages`
- **Component:** `AdminMasterLanguageComponent`
- **Description:** System language configuration
- **Features:**
  - Supported language management
  - Language-specific content settings
  - Localization preferences

#### **Genres Management**
- **Route:** `/admin/master-genres`
- **Component:** `AdminMasterGenreComponent`
- **Description:** Movie genre classification system
- **Features:**
  - Genre creation and editing
  - Genre categorization
  - Genre-based filtering setup

#### **Locations Management**
- **Route:** `/admin/master-locations`
- **Component:** `AdminMasterLocationsComponent`
- **Description:** Geographic location management
- **Features:**
  - City and region management
  - Theater location assignments
  - Service area configuration

#### **Cast Management**
- **Route:** `/admin/master-casts`
- **Component:** `AdminMasterLocationsComponent` *(Note: This appears to be a placeholder)*
- **Description:** Actor and crew database management
- **Features:**
  - Cast member profiles
  - Filmography management
  - Role assignments

## Missing Routes (To Be Implemented)

### 6. Financial Management Routes

#### **Payment Settings**
- **Route:** `/admin/payment-settings`
- **Description:** Payment gateway and pricing configuration
- **Features Required:**
  - Payment method configuration
  - Pricing tiers and discounts
  - Refund policy settings
  - Payment analytics

#### **Reports & Analytics**
- **Route:** `/admin/reports`
- **Description:** Comprehensive reporting system
- **Features Required:**
  - Revenue reports
  - Occupancy analytics
  - Customer behavior analysis
  - Performance metrics

#### **System Settings**
- **Route:** `/admin/system-settings`
- **Description:** Global system configuration
- **Features Required:**
  - Application settings
  - Security configurations
  - Backup and maintenance tools
  - System health monitoring

## Route Protection
All admin routes should be protected with:
- **Authentication Guard:** Ensures user is logged in
- **Authorization Guard:** Validates admin/manager role permissions
- **Role-based Access:** Fine-grained permissions per route

## Navigation Structure
The admin panel uses a hierarchical sidebar navigation that groups related functionality:
1. **Dashboard** - Overview and analytics
2. **Content Management** - Movies, theaters, screenings
3. **Operations** - Bookings and sales
4. **User Management** - Staff and customer accounts
5. **System Configuration** - Master data and settings
6. **Reports & Analytics** - Business intelligence

## Technical Implementation Notes
- All routes use lazy loading for better performance
- Components implement proper error handling and loading states
- Responsive design ensures mobile compatibility
- Real-time updates where applicable
- Comprehensive logging and audit trails
