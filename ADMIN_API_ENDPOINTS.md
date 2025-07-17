# API Endpoints for Admin Dashboard Routes

## Overview
This document outlines all the API endpoints required to support the admin dashboard functionality. Each route corresponds to specific backend services and data models.

## Authentication & Authorization APIs

### Base URL: `/api/auth`

#### User Authentication
- **POST** `/api/auth/login` - Admin login
- **POST** `/api/auth/logout` - Admin logout
- **GET** `/api/auth/profile` - Get current admin profile
- **PUT** `/api/auth/profile` - Update admin profile
- **POST** `/api/auth/refresh-token` - Refresh JWT token

#### Role & Permission Management
- **GET** `/api/auth/permissions` - Get user permissions
- **GET** `/api/auth/roles` - Get available roles
- **POST** `/api/auth/validate-access` - Validate route access

## Dashboard Analytics APIs

### Base URL: `/api/admin/dashboard`

#### Main Dashboard Statistics
- **GET** `/api/admin/dashboard/stats` - Overall dashboard statistics
  ```json
  {
    "totalRevenue": 125000,
    "totalBookings": 2456,
    "totalMovies": 15,
    "totalTheaters": 8,
    "todayBookings": 87,
    "occupancyRate": 76
  }
  ```

#### Revenue Analytics
- **GET** `/api/admin/dashboard/revenue` - Revenue trends and analytics
- **GET** `/api/admin/dashboard/revenue/monthly` - Monthly revenue data
- **GET** `/api/admin/dashboard/revenue/daily` - Daily revenue breakdown

#### Booking Analytics
- **GET** `/api/admin/dashboard/bookings/recent` - Recent bookings list
- **GET** `/api/admin/dashboard/bookings/stats` - Booking statistics
- **GET** `/api/admin/dashboard/bookings/trends` - Booking trend analysis

## Movie Management APIs

### Base URL: `/api/admin/movies`

#### Movie CRUD Operations
- **GET** `/api/admin/movies` - Get all movies with pagination
- **GET** `/api/admin/movies/:id` - Get specific movie details
- **POST** `/api/admin/movies` - Create new movie
- **PUT** `/api/admin/movies/:id` - Update movie
- **DELETE** `/api/admin/movies/:id` - Delete movie
- **PATCH** `/api/admin/movies/:id/status` - Update movie status

#### Movie Analytics
- **GET** `/api/admin/movies/:id/analytics` - Movie performance analytics
- **GET** `/api/admin/movies/:id/bookings` - Movie booking history
- **GET** `/api/admin/movies/popular` - Most popular movies

#### Movie Media Management
- **POST** `/api/admin/movies/:id/poster` - Upload movie poster
- **POST** `/api/admin/movies/:id/gallery` - Upload gallery images
- **DELETE** `/api/admin/movies/:id/media/:mediaId` - Delete media file

## Theater Management APIs

### Base URL: `/api/admin/theaters`

#### Theater CRUD Operations
- **GET** `/api/admin/theaters` - Get all theaters
- **GET** `/api/admin/theaters/:id` - Get specific theater
- **POST** `/api/admin/theaters` - Create new theater
- **PUT** `/api/admin/theaters/:id` - Update theater
- **DELETE** `/api/admin/theaters/:id` - Delete theater

#### Hall Management
- **GET** `/api/admin/theaters/:id/halls` - Get theater halls
- **POST** `/api/admin/theaters/:id/halls` - Create new hall
- **PUT** `/api/admin/halls/:id` - Update hall configuration
- **DELETE** `/api/admin/halls/:id` - Delete hall

#### Theater Analytics
- **GET** `/api/admin/theaters/:id/occupancy` - Theater occupancy rates
- **GET** `/api/admin/theaters/:id/revenue` - Theater revenue analytics

## Screening Management APIs

### Base URL: `/api/admin/screenings`

#### Screening CRUD Operations
- **GET** `/api/admin/screenings` - Get all screenings
- **GET** `/api/admin/screenings/:id` - Get specific screening
- **POST** `/api/admin/screenings` - Create new screening
- **PUT** `/api/admin/screenings/:id` - Update screening
- **DELETE** `/api/admin/screenings/:id` - Delete screening

#### Bulk Operations
- **POST** `/api/admin/screenings/bulk` - Create multiple screenings
- **PUT** `/api/admin/screenings/bulk` - Update multiple screenings
- **DELETE** `/api/admin/screenings/bulk` - Delete multiple screenings

#### Schedule Management
- **GET** `/api/admin/screenings/schedule` - Get screening schedule
- **POST** `/api/admin/screenings/schedule/validate` - Validate schedule conflicts

## Booking Management APIs

### Base URL: `/api/admin/bookings`

#### Booking CRUD Operations
- **GET** `/api/admin/bookings` - Get all bookings with filters
- **GET** `/api/admin/bookings/:id` - Get specific booking
- **POST** `/api/admin/bookings` - Create new booking (counter sales)
- **PUT** `/api/admin/bookings/:id` - Update booking
- **DELETE** `/api/admin/bookings/:id` - Cancel booking

#### Booking Operations
- **POST** `/api/admin/bookings/:id/refund` - Process refund
- **POST** `/api/admin/bookings/:id/modify` - Modify booking
- **GET** `/api/admin/bookings/:id/tickets` - Generate tickets
- **POST** `/api/admin/bookings/:id/resend` - Resend confirmation

#### Seat Management
- **GET** `/api/admin/screenings/:id/seats` - Get seat availability
- **POST** `/api/admin/screenings/:id/seats/hold` - Hold seats temporarily
- **POST** `/api/admin/screenings/:id/seats/release` - Release held seats

## User Management APIs

### Base URL: `/api/admin/users`

#### User CRUD Operations
- **GET** `/api/admin/users` - Get all users with filters
- **GET** `/api/admin/users/:id` - Get specific user
- **POST** `/api/admin/users` - Create new user
- **PUT** `/api/admin/users/:id` - Update user
- **DELETE** `/api/admin/users/:id` - Delete/Deactivate user

#### Role Management
- **GET** `/api/admin/users/roles` - Get available roles
- **PUT** `/api/admin/users/:id/role` - Update user role
- **GET** `/api/admin/users/staff` - Get staff members
- **GET** `/api/admin/users/producers` - Get executive producers

#### User Analytics
- **GET** `/api/admin/users/:id/activity` - User activity logs
- **GET** `/api/admin/users/analytics` - User analytics and insights

## Master Data APIs

### Base URL: `/api/admin/master`

#### Languages
- **GET** `/api/admin/master/languages` - Get all languages
- **POST** `/api/admin/master/languages` - Create new language
- **PUT** `/api/admin/master/languages/:id` - Update language
- **DELETE** `/api/admin/master/languages/:id` - Delete language

#### Genres
- **GET** `/api/admin/master/genres` - Get all genres
- **POST** `/api/admin/master/genres` - Create new genre
- **PUT** `/api/admin/master/genres/:id` - Update genre
- **DELETE** `/api/admin/master/genres/:id` - Delete genre

#### Locations
- **GET** `/api/admin/master/locations` - Get all locations
- **POST** `/api/admin/master/locations` - Create new location
- **PUT** `/api/admin/master/locations/:id` - Update location
- **DELETE** `/api/admin/master/locations/:id` - Delete location

#### Cast & Crew
- **GET** `/api/admin/master/cast` - Get all cast members
- **POST** `/api/admin/master/cast` - Add new cast member
- **PUT** `/api/admin/master/cast/:id` - Update cast member
- **DELETE** `/api/admin/master/cast/:id` - Delete cast member

## Financial Management APIs

### Base URL: `/api/admin/finance`

#### Payment Configuration
- **GET** `/api/admin/finance/payment-methods` - Get payment methods
- **POST** `/api/admin/finance/payment-methods` - Add payment method
- **PUT** `/api/admin/finance/payment-methods/:id` - Update payment method

#### Pricing Management
- **GET** `/api/admin/finance/pricing` - Get pricing configurations
- **POST** `/api/admin/finance/pricing` - Create pricing rule
- **PUT** `/api/admin/finance/pricing/:id` - Update pricing

#### Financial Reports
- **GET** `/api/admin/finance/reports/revenue` - Revenue reports
- **GET** `/api/admin/finance/reports/transactions` - Transaction reports
- **GET** `/api/admin/finance/reports/refunds` - Refund reports

## System Configuration APIs

### Base URL: `/api/admin/system`

#### System Settings
- **GET** `/api/admin/system/settings` - Get system settings
- **PUT** `/api/admin/system/settings` - Update system settings
- **POST** `/api/admin/system/backup` - Create system backup
- **GET** `/api/admin/system/health` - System health check

#### Audit & Logs
- **GET** `/api/admin/system/audit-logs` - Get audit logs
- **GET** `/api/admin/system/error-logs` - Get error logs
- **POST** `/api/admin/system/logs/export` - Export logs

## File Upload APIs

### Base URL: `/api/admin/upload`

#### Media Upload
- **POST** `/api/admin/upload/image` - Upload image files
- **POST** `/api/admin/upload/video` - Upload video files
- **DELETE** `/api/admin/upload/:fileId` - Delete uploaded file
- **GET** `/api/admin/upload/:fileId` - Get file information

## Notification APIs

### Base URL: `/api/admin/notifications`

#### System Notifications
- **GET** `/api/admin/notifications` - Get admin notifications
- **POST** `/api/admin/notifications` - Send notification
- **PUT** `/api/admin/notifications/:id/read` - Mark as read
- **DELETE** `/api/admin/notifications/:id` - Delete notification

## Export & Import APIs

### Base URL: `/api/admin/export`

#### Data Export
- **POST** `/api/admin/export/movies` - Export movies data
- **POST** `/api/admin/export/bookings` - Export bookings data
- **POST** `/api/admin/export/users` - Export users data
- **POST** `/api/admin/export/reports` - Export custom reports

#### Data Import
- **POST** `/api/admin/import/movies` - Import movies data
- **POST** `/api/admin/import/theaters` - Import theaters data
- **GET** `/api/admin/import/status/:jobId` - Check import status

## Error Handling
All APIs should implement consistent error handling:
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **422** - Validation Error
- **500** - Internal Server Error

## Rate Limiting
- Standard rate limits apply to all endpoints
- Admin operations may have higher limits
- Bulk operations have separate rate limiting

## Response Format
All API responses follow a consistent format:
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```
