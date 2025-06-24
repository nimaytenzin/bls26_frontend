# Seat Selection API Implementation

## Overview

This document describes the implementation of the new seat selection API endpoints in the Angular frontend. The implementation follows the user flow requirements and provides real-time seat management with session-based conflict resolution.

## Backend API Endpoints Implemented

### 1. Get Occupied Seats
- **Endpoint**: `GET /booking/screening/{screeningId}/occupied-seats`
- **Purpose**: Fetch all occupied seats (CONFIRMED + active PENDING) when user enters screening page
- **Response**: Array of `OccupiedSeatResponse` objects

### 2. Select Seats
- **Endpoint**: `POST /booking/select-seats`
- **Purpose**: Handle seat selection/deselection with session management
- **Request Body**: `SeatSelectionDto`
- **Response**: `SeatSelectionResponse` with booking info and timeout

## Frontend Implementation

### Data Services Updated

#### 1. BookingDataService
- Added `getOccupiedSeats(screeningId: number)` method
- Added `selectSeats(seatSelectionDto: SeatSelectionDto)` method

#### 2. PublicDataService
- Added `getOccupiedSeats(screeningId: number)` method
- Added `selectSeats(seatSelectionDto: SeatSelectionDto)` method

### Interface Definitions

Added new interfaces in `booking.interface.ts`:
- `OccupiedSeatResponse`
- `SeatSelectionDto`
- `SeatSelectionResponse`
- `BookingInfo`
- `SeatConflictResponse`
- `CleanupResponse`
- `UserMetadataDto`

### Component Changes

#### PublicSelectSeatsComponent

**New Features:**
1. **Session Management**: Generates unique session IDs for each user
2. **Real-time Seat Updates**: Uses new occupied seats API instead of legacy booking queries
3. **Conflict Handling**: Proper 409 conflict response handling with seat map refresh
4. **Timeout Management**: Automatic seat release after timeout period
5. **Periodic Refresh**: Updates seat availability every 30 seconds for multi-user scenarios

**Key Methods Added:**
- `generateSessionId()`: Creates unique session identifier
- `initializeSeatAvailabilityFromOccupied()`: Uses new API for seat availability
- `updateSeatSelection()`: Handles seat selection with session management
- `handleSeatConflict()`: Manages 409 conflict responses
- `startPeriodicRefresh()`: Implements real-time updates

#### AdminSeatSelectionComponent

**New Features:**
1. **Session Management**: Admin-specific session IDs (`admin_session_*`)
2. **Real-time Seat Updates**: Same API integration as public component
3. **Conflict Handling**: Proper 409 conflict response handling
4. **Timeout Management**: Automatic seat release after timeout period
5. **Periodic Refresh**: Updates seat availability every 30 seconds
6. **Enhanced UX**: Immediate UI updates with API confirmation

**Key Methods Added:**
- `generateSessionId()`: Creates unique admin session identifier
- `initializeSeatAvailabilityFromOccupied()`: Uses new API for seat availability
- `selectSeat()` / `deselectSeat()`: Individual seat management with API calls
- `updateSeatSelection()`: Handles seat selection with session management
- `handleSeatConflict()`: Manages 409 conflict responses
- `startPeriodicRefresh()`: Implements real-time updates
- `revertSeatSelection()`: Error recovery mechanism
5. **Periodic Refresh**: Updates seat availability every 30 seconds

**Key Methods Added:**
- `generateSessionId()`: Creates unique session identifier
- `updateSeatSelection()`: Calls seat selection API with session management
- `updateSeatAvailabilityFromResponse()`: Updates UI based on API response
- `handleSeatConflict()`: Handles 409 conflict responses
- `revertSeatSelection()`: Reverts UI changes on error
- `startSeatSelectionTimer()`: Manages selection timeout
- `startPeriodicRefresh()`: Periodic seat availability updates
- `refreshOccupiedSeats()`: Silent background refresh

## User Flow Implementation

### 1. User Enters Screening Page
```typescript
// Load seats and occupied seats in parallel
forkJoin({
  seats: this.publicDataService.findSeatsByHallId(hallId),
  occupiedSeats: this.publicDataService.getOccupiedSeats(this.screeningId),
})
```

### 2. User Selects Seats
```typescript
private selectSeat(seat: SelectedSeat): void {
  // Update UI immediately for better UX
  seat.status = 'selected';
  // Call the seat selection API
  this.updateSeatSelection();
}
```

### 3. API Call with Session Management
```typescript
const seatSelectionDto: SeatSelectionDto = {
  seatIds: seatIds,
  screeningId: this.screeningId,
  sessionId: this.sessionId,
  userMetadata: {
    userAgent: navigator.userAgent,
    ipAddress: '', // Populated by backend
  }
};
```

### 4. Conflict Handling
```typescript
error: (error) => {
  if (error.status === 409) {
    this.handleSeatConflict(error.error);
  } else {
    this.revertSeatSelection();
  }
}
```

## Benefits

1. **Real-time Updates**: Immediate reflection of seat availability changes
2. **Conflict Prevention**: Session-based seat locking prevents double bookings
3. **User Experience**: Optimistic UI updates with error rollback
4. **Scalability**: Periodic refresh ensures multi-user synchronization
5. **Timeout Management**: Automatic seat release prevents indefinite holds

## Session Management

- Each user gets a unique session ID: `session_{timestamp}_{random}`
- Session ID is sent with every seat selection request
- Backend uses session ID to manage temporary seat holds
- Frontend automatically clears selections on timeout

## Error Handling

- **409 Conflict**: Seats already taken by another user
- **Network Errors**: Graceful UI rollback with user notification
- **Timeout**: Automatic selection clearing with warning message

## Performance Optimizations

1. **Parallel Loading**: Seats and occupied seats loaded simultaneously
2. **Optimistic UI**: Immediate visual feedback before API confirmation
3. **Debounced Updates**: Periodic refresh without overwhelming the server
4. **Efficient Layout Updates**: Only affected seats are re-rendered

## Future Enhancements

1. **WebSocket Integration**: Real-time seat updates without polling
2. **Progressive Loading**: Load seat map in chunks for large venues
3. **Offline Support**: Cache seat selections for poor network conditions
4. **Analytics**: Track user selection patterns and conflicts

## Testing Checklist

### ✅ Implementation Complete - Both Components Updated

**PublicSelectSeatsComponent:**
- [ ] Seat selection updates immediately in UI
- [ ] Multiple users cannot select the same seat
- [ ] Seat selection expires after timeout
- [ ] Conflict messages display correctly
- [ ] Periodic refresh updates seat availability
- [ ] Session management works across component lifecycle
- [ ] Error handling gracefully reverts UI state

**AdminSeatSelectionComponent:**
- [ ] Admin seat selection works with admin session prefix
- [ ] Conflict handling between admin and public users
- [ ] Individual seat select/deselect with API confirmation
- [ ] Timeout management for admin selections
- [ ] Periodic refresh for real-time updates
- [ ] Error recovery and UI reversion
- [ ] Enhanced UX with immediate feedback

### 🎯 Implementation Status: COMPLETE ✅

Both the `PublicSelectSeatsComponent` and `AdminSeatSelectionComponent` have been successfully updated to use the new seat selection API with the following key features:

1. **Unified API Integration**: Both components use the same occupied seats and seat selection APIs
2. **Session Management**: Public (`session_*`) and Admin (`admin_session_*`) session prefixes
3. **Real-time Updates**: 30-second periodic refresh for multi-user synchronization
4. **Conflict Resolution**: Proper 409 error handling with automatic seat map refresh
5. **Timeout Management**: Automatic seat release after backend-specified timeout
6. **Enhanced UX**: Immediate UI updates with server-side confirmation and error rollback

The implementation ensures consistent behavior across both public and admin interfaces while maintaining real-time synchronization and conflict prevention.
