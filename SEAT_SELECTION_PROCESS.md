# 🎫 Seat Selection Component - Complete Documentation

## 📋 Overview

The **Public Seat Selection Component** is a comprehensive Angular component that handles movie theater seat selection with real-time conflict resolution, session management, and optimistic UI updates. This component manages the complete seat selection flow from initial load to payment processing.

## 🏗️ Architecture

### **Component Structure**
```typescript
PublicSelectSeatsComponent
├── Data Loading & Initialization
├── Seat Layout Generation
├── Real-time Seat Selection/Deselection
├── Session Management
├── Conflict Resolution
├── Payment Integration
└── UI State Management
```

## 🔧 Core Interfaces

### **Key Data Interfaces**
```typescript
interface SelectedSeat extends Seat {
  price: number;
  selected: boolean;
  status: 'available' | 'booked' | 'selected';
}

interface SeatSelectionDto {
  seatId: number;
  screeningId: number;
  userMetadata: {
    userAgent: string;
    ipAddress: string;
  };
}

interface SeatSelectionResponse {
  success: boolean;
  message: string;
  occupiedSeats: BookingSeat[];
  sessionSeats?: SessionSeatInfo[];
  timeoutSeconds?: number;
  expiresAt?: string;
}

interface OccupiedSeatResponse {
  occupiedSeats: BookingSeat[];
  sessionSeats: SessionSeatInfo[];
  timeoutSeconds: number;
  expiresAt: string;
}
```

## 🚀 Component Initialization

### **1. ngOnInit Flow**
```typescript
ngOnInit() {
  // 1. Get or create session ID
  this.sessionId = this.sessionService.getSessionId() || this.sessionService.createSession();
  
  // 2. Extract screening ID from route
  this.route.params.subscribe(params => {
    this.screeningId = +params['id'];
    this.loadScreeningData();
  });
}
```

### **2. Data Loading Sequence**
```typescript
private loadScreeningData(): void {
  // Step 1: Load screening details
  this.publicDataService.findScreeningById(this.screeningId)
    .subscribe(screening => {
      this.screening = screening;
      this.hall = screening.hall;
      this.screeningPrices = screening.screeningSeatPrices;
      
      // Step 2: Load movie details (parallel)
      if (screening.movieId) {
        this.loadMovieDetails(screening.movieId);
      }
      
      // Step 3: Load seats and occupancy
      if (screening.hallId) {
        this.loadSeatsForHall(screening.hallId);
      }
    });
}
```

## 🔌 API Integration

### **1. Initial Data Loading APIs**

#### **Load Screening Details**
```typescript
// API: GET /api/public/screenings/{id}
this.publicDataService.findScreeningById(screeningId)
```
**Response:**
```json
{
  "id": 123,
  "movieId": 456,
  "hallId": 789,
  "date": "2024-07-15",
  "startTime": "1930",
  "screeningSeatPrices": [
    {
      "seatCategoryId": 1,
      "price": 150
    }
  ],
  "hall": {
    "id": 789,
    "name": "Hall A",
    "rows": 10,
    "columns": 12,
    "seatCategories": [...]
  }
}
```

#### **Load Movie Details**
```typescript
// API: GET /api/public/movies/{id}
this.publicDataService.findMovieById(movieId)
```

#### **Load Seats & Occupancy (Parallel)**
```typescript
// Combined API calls using forkJoin
forkJoin({
  seats: this.bookingService.findSeatsByHallId(hallId),
  occupiedSeatResponse: this.bookingService.getOccupiedSeatsBySession(screeningId, sessionId)
})
```

**Seats API Response:**
```json
[
  {
    "id": 1001,
    "seatNumber": "A1",
    "rowId": 1,
    "colId": 1,
    "categoryId": 1,
    "category": {
      "name": "Premium",
      "baseColorHexCode": "#FFD700"
    }
  }
]
```

**Occupancy API Response:**
```json
{
  "occupiedSeats": [
    {
      "seatId": 1002,
      "bookingStatus": "CONFIRMED"
    }
  ],
  "sessionSeats": [
    {
      "seatId": 1003,
      "sessionId": "sess_123",
      "expiresAt": "2024-07-15T20:15:00Z"
    }
  ],
  "timeoutSeconds": 900,
  "expiresAt": "2024-07-15T20:15:00Z"
}
```

### **2. Seat Selection APIs**

#### **Select Seat**
```typescript
// API: POST /api/bookings/sessions/{sessionId}/seats/select
this.bookingService.selectSeatBySession(sessionId, seatSelectionDto)
```

**Request Body:**
```json
{
  "seatId": 1001,
  "screeningId": 123,
  "userMetadata": {
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.100"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Seat selected successfully",
  "occupiedSeats": [...],
  "timeoutSeconds": 900,
  "expiresAt": "2024-07-15T20:15:00Z"
}
```

**Conflict Response (409):**
```json
{
  "success": false,
  "message": "Seat is already occupied",
  "conflictType": "SEAT_OCCUPIED",
  "occupiedSeats": [...]
}
```

#### **Deselect Seat**
```typescript
// API: POST /api/bookings/sessions/{sessionId}/seats/deselect
this.bookingService.deselectSeatBySession(sessionId, seatSelectionDto)
```

### **3. Payment Processing API**

#### **Proceed to Payment**
```typescript
// API: POST /api/bookings/sessions/{sessionId}/proceed-to-payment
this.bookingService.proceedToPayment(sessionId, screeningId)
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "book_789",
    "totalAmount": 450,
    "seats": [...]
  },
  "timeoutSeconds": 900,
  "expiresAt": "2024-07-15T20:30:00Z"
}
```

## 🎯 Seat Selection Logic

### **1. Optimistic UI Updates**
```typescript
private selectSeat(seat: SelectedSeat): void {
  // 1. Immediate UI update (optimistic)
  seat.status = 'selected';
  seat.selected = true;
  this.selectedSeats.push(seat);
  this.seatAvailability[seat.id.toString()] = 'selected';
  this.updateSeatInHallLayout(seat);

  // 2. Call API to confirm selection
  this.updateSeatSelection(seat);
}
```

### **2. Conflict Resolution**
```typescript
private handleSeatConflict(seat: SelectedSeat, conflictResponse: any): void {
  // 1. Revert optimistic update
  seat.status = 'booked';
  seat.selected = false;
  this.seatAvailability[seat.id.toString()] = 'booked';
  
  // 2. Remove from selected array
  const index = this.selectedSeats.findIndex(s => s.id === seat.id);
  if (index > -1) {
    this.selectedSeats.splice(index, 1);
  }
  
  // 3. Update UI and show message
  this.updateSeatInHallLayout(seat);
  this.messageService.add({
    severity: 'warn',
    summary: 'Seat Conflict',
    detail: 'This seat was just taken by another user'
  });
  
  // 4. Refresh all occupied seats
  this.refreshOccupiedSeats();
}
```

### **3. Real-time Updates**
```typescript
private startPeriodicRefresh(): void {
  // Refresh every 30 seconds
  setInterval(() => {
    if (this.screeningId && !this.loading) {
      this.refreshOccupiedSeats();
      this.validateSeatSelections();
    }
  }, 30000);
}

private refreshOccupiedSeats(): void {
  this.bookingService.getOccupiedSeatsBySession(this.screeningId, this.sessionId)
    .subscribe(response => {
      this.updateSeatAvailabilityFromResponse(response);
    });
}
```

## 🎨 Hall Layout Generation

### **1. 2D Grid Creation**
```typescript
private generateHallLayout(): void {
  // Initialize 2D array
  this.hallLayout = [];
  for (let row = 0; row < this.hall.rows; row++) {
    this.hallLayout[row] = [];
    for (let col = 0; col < this.hall.columns; col++) {
      this.hallLayout[row][col] = null;
    }
  }

  // Map seats to grid positions
  this.seats.forEach(seat => {
    const rowIndex = seat.rowId - 1; // Convert to 0-based
    const colIndex = seat.colId - 1;
    
    if (rowIndex >= 0 && rowIndex < this.hall.rows && 
        colIndex >= 0 && colIndex < this.hall.columns) {
      
      this.hallLayout[rowIndex][colIndex] = {
        ...seat,
        price: this.getSeatPrice(seat),
        selected: false,
        status: this.seatAvailability[seat.id.toString()] || 'available'
      } as SelectedSeat;
    }
  });
}
```

### **2. Dynamic Seat Styling**
```typescript
getSeatStyles(hexCode: string, seat?: SelectedSeat): any {
  const baseStyle = generateSeatStyle(hexCode || '#000000');

  if (seat?.status === 'selected') {
    return {
      backgroundColor: '#10b981', // green-500
      border: '2px solid #059669',
      color: '#ffffff',
      cursor: 'pointer'
    };
  } else if (seat?.status === 'booked') {
    return {
      backgroundColor: '#f3f4f6', // gray-100
      border: '2px solid #e5e7eb',
      color: '#6b7280',
      cursor: 'not-allowed',
      opacity: '0.6'
    };
  }

  return baseStyle; // Available seat with category color
}
```

## 📱 Session Management

### **1. Session Creation & Validation**
```typescript
// Session Service Integration
this.sessionId = this.sessionService.getSessionId() || this.sessionService.createSession();

// Validate session before operations
if (!this.sessionService.isSessionValid()) {
  this.messageService.add({
    severity: 'error',
    summary: 'Session Invalid',
    detail: 'Your session has expired. Please refresh the page.'
  });
  return;
}
```

### **2. Timeout Management**
```typescript
private startSessionTimeoutTimer(): void {
  if (this.timeoutTimer) {
    clearTimeout(this.timeoutTimer);
  }

  if (this.sessionTimeout > 0) {
    this.timeoutTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.sessionTimeout * 1000);
  }
}

private handleSessionTimeout(): void {
  this.messageService.add({
    severity: 'warn',
    summary: 'Session Expired',
    detail: 'Your session has expired. Please start again.'
  });
  
  this.clearAllSelections();
  this.router.navigate(['/movies']);
}
```

## 🎭 State Management

### **1. Seat Availability States**
```typescript
// Central seat availability mapping
seatAvailability: { [seatId: string]: 'available' | 'booked' | 'selected' } = {};

private updateSeatAvailabilityFromResponse(response: OccupiedSeatResponse): void {
  // Reset all seats to available
  Object.keys(this.seatAvailability).forEach(seatId => {
    this.seatAvailability[seatId] = 'available';
  });

  // Mark occupied seats as booked
  response.occupiedSeats.forEach(occupiedSeat => {
    const isOurSelection = this.selectedSeats.some(seat => seat.id === occupiedSeat.seatId);
    if (!isOurSelection) {
      this.seatAvailability[occupiedSeat.seatId.toString()] = 'booked';
    }
  });

  // Update hall layout
  this.updateHallLayoutFromAvailability();
}
```

### **2. Selected Seats Management**
```typescript
// Maximum seat selection limit
readonly MAX_SEATS = 10;

// Selected seats array with pricing
selectedSeats: SelectedSeat[] = [];

// Calculate total amount
getTotalAmount(): number {
  return this.selectedSeats.reduce((total, seat) => total + seat.price, 0);
}
```

## 🛡️ Error Handling & Edge Cases

### **1. API Error Handling**
```typescript
private updateSeatSelection(seat: SelectedSeat): void {
  this.bookingService.selectSeatBySession(this.sessionId, seatSelectionDto)
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Seat Selected',
            detail: `You have selected seat ${seat.seatNumber}`
          });
        } else {
          this.revertSeatSelection(seat);
        }
      },
      error: (error) => {
        if (error.status === 409) {
          // Handle seat conflict
          this.handleSeatConflict(seat, error.error);
        } else {
          // Revert optimistic update
          this.revertSeatSelection(seat);
          this.messageService.add({
            severity: 'error',
            summary: 'Selection Failed',
            detail: error.error?.message || 'Failed to select seat'
          });
        }
      }
    });
}
```

### **2. Validation & Limits**
```typescript
onSeatClick(seat: SelectedSeat): void {
  // Prevent interactions during loading
  if (this.loading) return;

  // Check if seat is booked
  if (seat.status === 'booked') {
    this.messageService.add({
      severity: 'warn',
      summary: 'Seat Unavailable',
      detail: 'This seat is already booked'
    });
    return;
  }

  // Check seat limit before selecting
  if (!isSelected && this.selectedSeats.length >= this.MAX_SEATS) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Maximum Seats Reached',
      detail: `You can select maximum ${this.MAX_SEATS} seats`
    });
    return;
  }

  // Proceed with selection/deselection
  if (isSelected) {
    this.deselectSeat(seat);
  } else {
    this.selectSeat(seat);
  }
}
```

## 🎫 Payment Integration

### **1. Payment Dialog Launch**
```typescript
processPayment(): void {
  if (this.selectedSeats.length === 0) {
    this.messageService.add({
      severity: 'warn',
      summary: 'No Seats Selected',
      detail: 'Please select at least one seat to proceed.'
    });
    return;
  }

  this.processing = true;
  
  // API call to lock seats for payment
  this.bookingService.proceedToPayment(this.sessionId, this.screeningId)
    .subscribe({
      next: (response) => {
        if (response.success) {
          // Extend session timeout for payment window
          this.sessionTimeout = response.timeoutSeconds;
          this.startSessionTimeoutTimer();

          // Open payment dialog
          const bookingData = {
            movie: this.movie,
            screening: this.screening,
            selectedSeats: this.selectedSeats,
            totalAmount: this.getTotalAmount(),
            sessionId: this.sessionId,
            booking: response.booking
          };

          this.ref = this.dialogService.open(PaymentComponent, {
            modal: true,
            closable: false,
            data: bookingData
          });

          // Handle payment completion
          this.ref.onClose.subscribe(result => {
            if (result?.success) {
              this.clearAllSelections();
              this.router.navigate(['/eticket', this.sessionId, result.booking.id]);
            }
            this.processing = false;
          });
        }
      },
      error: (error) => {
        this.processing = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Payment Error',
          detail: 'Failed to proceed to payment'
        });
      }
    });
}
```

## 🧹 Cleanup & Memory Management

### **1. Component Destruction**
```typescript
ngOnDestroy(): void {
  console.log('Component destroying, performing cleanup');

  // Complete observables
  this.destroy$.next();
  this.destroy$.complete();

  // Clear seat selections
  if (this.selectedSeats.length > 0) {
    this.clearAllSelections();
  }

  // End session
  this.sessionService.endSession();

  // Clear timers
  if (this.timeoutTimer) {
    clearTimeout(this.timeoutTimer);
  }
  if (this.refreshTimer) {
    clearInterval(this.refreshTimer);
  }
}
```

### **2. Selection Cleanup**
```typescript
private clearAllSelections(): void {
  // Update each selected seat
  this.selectedSeats.forEach(seat => {
    seat.status = 'available';
    seat.selected = false;
    this.seatAvailability[seat.id.toString()] = 'available';
    this.updateSeatInHallLayout(seat);
  });

  // Clear the array
  this.selectedSeats = [];
  
  console.log('All selections cleared');
}
```

## 📊 Performance Optimizations

### **1. Efficient Data Loading**
- **Parallel API Calls**: Using `forkJoin` for simultaneous data loading
- **Lazy Loading**: Loading only necessary data for current screening
- **Caching**: Session-based caching of seat selections

### **2. Optimistic UI Updates**
- **Immediate Feedback**: UI updates before API confirmation
- **Rollback Mechanism**: Automatic reversion on API failures
- **Conflict Resolution**: Smart handling of concurrent user actions

### **3. Memory Management**
- **Observable Cleanup**: Using `takeUntil` pattern for subscription management
- **Timer Cleanup**: Proper clearance of timeouts and intervals
- **Session Cleanup**: Automatic session termination on component destruction

## 🎯 Usage Examples

### **1. Basic Implementation**
```typescript
// In your routing module
{
  path: 'seats/:id',
  component: PublicSelectSeatsComponent
}

// Navigation to seat selection
this.router.navigate(['/seats', screeningId]);
```

### **2. Custom Configuration**
```typescript
// Environment-specific settings
export const seatSelectionConfig = {
  maxSeats: 10,
  sessionTimeout: 900, // 15 minutes
  refreshInterval: 30000, // 30 seconds
  paymentTimeout: 900 // 15 minutes
};
```

## 🎉 Summary

The **Public Seat Selection Component** provides a comprehensive, real-time seat selection experience with:

- ✅ **Real-time conflict resolution**
- ✅ **Optimistic UI updates**
- ✅ **Session-based seat locking**
- ✅ **Responsive hall layout**
- ✅ **Comprehensive error handling**
- ✅ **Payment integration**
- ✅ **Memory-efficient cleanup**

This implementation ensures a smooth, reliable user experience while maintaining data consistency and handling edge cases gracefully.# 🎫 Seat Selection Component - Complete Documentation

## 📋 Overview

The **Public Seat Selection Component** is a comprehensive Angular component that handles movie theater seat selection with real-time conflict resolution, session management, and optimistic UI updates. This component manages the complete seat selection flow from initial load to payment processing.

## 🏗️ Architecture

### **Component Structure**
```typescript
PublicSelectSeatsComponent
├── Data Loading & Initialization
├── Seat Layout Generation
├── Real-time Seat Selection/Deselection
├── Session Management
├── Conflict Resolution
├── Payment Integration
└── UI State Management
```

## 🔧 Core Interfaces

### **Key Data Interfaces**
```typescript
interface SelectedSeat extends Seat {
  price: number;
  selected: boolean;
  status: 'available' | 'booked' | 'selected';
}

interface SeatSelectionDto {
  seatId: number;
  screeningId: number;
  userMetadata: {
    userAgent: string;
    ipAddress: string;
  };
}

interface SeatSelectionResponse {
  success: boolean;
  message: string;
  occupiedSeats: BookingSeat[];
  sessionSeats?: SessionSeatInfo[];
  timeoutSeconds?: number;
  expiresAt?: string;
}

interface OccupiedSeatResponse {
  occupiedSeats: BookingSeat[];
  sessionSeats: SessionSeatInfo[];
  timeoutSeconds: number;
  expiresAt: string;
}
```

## 🚀 Component Initialization

### **1. ngOnInit Flow**
```typescript
ngOnInit() {
  // 1. Get or create session ID
  this.sessionId = this.sessionService.getSessionId() || this.sessionService.createSession();
  
  // 2. Extract screening ID from route
  this.route.params.subscribe(params => {
    this.screeningId = +params['id'];
    this.loadScreeningData();
  });
}
```

### **2. Data Loading Sequence**
```typescript
private loadScreeningData(): void {
  // Step 1: Load screening details
  this.publicDataService.findScreeningById(this.screeningId)
    .subscribe(screening => {
      this.screening = screening;
      this.hall = screening.hall;
      this.screeningPrices = screening.screeningSeatPrices;
      
      // Step 2: Load movie details (parallel)
      if (screening.movieId) {
        this.loadMovieDetails(screening.movieId);
      }
      
      // Step 3: Load seats and occupancy
      if (screening.hallId) {
        this.loadSeatsForHall(screening.hallId);
      }
    });
}
```

## 🔌 API Integration

### **1. Initial Data Loading APIs**

#### **Load Screening Details**
```typescript
// API: GET /api/public/screenings/{id}
this.publicDataService.findScreeningById(screeningId)
```
**Response:**
```json
{
  "id": 123,
  "movieId": 456,
  "hallId": 789,
  "date": "2024-07-15",
  "startTime": "1930",
  "screeningSeatPrices": [
    {
      "seatCategoryId": 1,
      "price": 150
    }
  ],
  "hall": {
    "id": 789,
    "name": "Hall A",
    "rows": 10,
    "columns": 12,
    "seatCategories": [...]
  }
}
```

#### **Load Movie Details**
```typescript
// API: GET /api/public/movies/{id}
this.publicDataService.findMovieById(movieId)
```

#### **Load Seats & Occupancy (Parallel)**
```typescript
// Combined API calls using forkJoin
forkJoin({
  seats: this.bookingService.findSeatsByHallId(hallId),
  occupiedSeatResponse: this.bookingService.getOccupiedSeatsBySession(screeningId, sessionId)
})
```

**Seats API Response:**
```json
[
  {
    "id": 1001,
    "seatNumber": "A1",
    "rowId": 1,
    "colId": 1,
    "categoryId": 1,
    "category": {
      "name": "Premium",
      "baseColorHexCode": "#FFD700"
    }
  }
]
```

**Occupancy API Response:**
```json
{
  "occupiedSeats": [
    {
      "seatId": 1002,
      "bookingStatus": "CONFIRMED"
    }
  ],
  "sessionSeats": [
    {
      "seatId": 1003,
      "sessionId": "sess_123",
      "expiresAt": "2024-07-15T20:15:00Z"
    }
  ],
  "timeoutSeconds": 900,
  "expiresAt": "2024-07-15T20:15:00Z"
}
```

### **2. Seat Selection APIs**

#### **Select Seat**
```typescript
// API: POST /api/bookings/sessions/{sessionId}/seats/select
this.bookingService.selectSeatBySession(sessionId, seatSelectionDto)
```

**Request Body:**
```json
{
  "seatId": 1001,
  "screeningId": 123,
  "userMetadata": {
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.100"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Seat selected successfully",
  "occupiedSeats": [...],
  "timeoutSeconds": 900,
  "expiresAt": "2024-07-15T20:15:00Z"
}
```

**Conflict Response (409):**
```json
{
  "success": false,
  "message": "Seat is already occupied",
  "conflictType": "SEAT_OCCUPIED",
  "occupiedSeats": [...]
}
```

#### **Deselect Seat**
```typescript
// API: POST /api/bookings/sessions/{sessionId}/seats/deselect
this.bookingService.deselectSeatBySession(sessionId, seatSelectionDto)
```

### **3. Payment Processing API**

#### **Proceed to Payment**
```typescript
// API: POST /api/bookings/sessions/{sessionId}/proceed-to-payment
this.bookingService.proceedToPayment(sessionId, screeningId)
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "book_789",
    "totalAmount": 450,
    "seats": [...]
  },
  "timeoutSeconds": 900,
  "expiresAt": "2024-07-15T20:30:00Z"
}
```

## 🎯 Seat Selection Logic

### **1. Optimistic UI Updates**
```typescript
private selectSeat(seat: SelectedSeat): void {
  // 1. Immediate UI update (optimistic)
  seat.status = 'selected';
  seat.selected = true;
  this.selectedSeats.push(seat);
  this.seatAvailability[seat.id.toString()] = 'selected';
  this.updateSeatInHallLayout(seat);

  // 2. Call API to confirm selection
  this.updateSeatSelection(seat);
}
```

### **2. Conflict Resolution**
```typescript
private handleSeatConflict(seat: SelectedSeat, conflictResponse: any): void {
  // 1. Revert optimistic update
  seat.status = 'booked';
  seat.selected = false;
  this.seatAvailability[seat.id.toString()] = 'booked';
  
  // 2. Remove from selected array
  const index = this.selectedSeats.findIndex(s => s.id === seat.id);
  if (index > -1) {
    this.selectedSeats.splice(index, 1);
  }
  
  // 3. Update UI and show message
  this.updateSeatInHallLayout(seat);
  this.messageService.add({
    severity: 'warn',
    summary: 'Seat Conflict',
    detail: 'This seat was just taken by another user'
  });
  
  // 4. Refresh all occupied seats
  this.refreshOccupiedSeats();
}
```

### **3. Real-time Updates**
```typescript
private startPeriodicRefresh(): void {
  // Refresh every 30 seconds
  setInterval(() => {
    if (this.screeningId && !this.loading) {
      this.refreshOccupiedSeats();
      this.validateSeatSelections();
    }
  }, 30000);
}

private refreshOccupiedSeats(): void {
  this.bookingService.getOccupiedSeatsBySession(this.screeningId, this.sessionId)
    .subscribe(response => {
      this.updateSeatAvailabilityFromResponse(response);
    });
}
```

## 🎨 Hall Layout Generation

### **1. 2D Grid Creation**
```typescript
private generateHallLayout(): void {
  // Initialize 2D array
  this.hallLayout = [];
  for (let row = 0; row < this.hall.rows; row++) {
    this.hallLayout[row] = [];
    for (let col = 0; col < this.hall.columns; col++) {
      this.hallLayout[row][col] = null;
    }
  }

  // Map seats to grid positions
  this.seats.forEach(seat => {
    const rowIndex = seat.rowId - 1; // Convert to 0-based
    const colIndex = seat.colId - 1;
    
    if (rowIndex >= 0 && rowIndex < this.hall.rows && 
        colIndex >= 0 && colIndex < this.hall.columns) {
      
      this.hallLayout[rowIndex][colIndex] = {
        ...seat,
        price: this.getSeatPrice(seat),
        selected: false,
        status: this.seatAvailability[seat.id.toString()] || 'available'
      } as SelectedSeat;
    }
  });
}
```

### **2. Dynamic Seat Styling**
```typescript
getSeatStyles(hexCode: string, seat?: SelectedSeat): any {
  const baseStyle = generateSeatStyle(hexCode || '#000000');

  if (seat?.status === 'selected') {
    return {
      backgroundColor: '#10b981', // green-500
      border: '2px solid #059669',
      color: '#ffffff',
      cursor: 'pointer'
    };
  } else if (seat?.status === 'booked') {
    return {
      backgroundColor: '#f3f4f6', // gray-100
      border: '2px solid #e5e7eb',
      color: '#6b7280',
      cursor: 'not-allowed',
      opacity: '0.6'
    };
  }

  return baseStyle; // Available seat with category color
}
```

## 📱 Session Management

### **1. Session Creation & Validation**
```typescript
// Session Service Integration
this.sessionId = this.sessionService.getSessionId() || this.sessionService.createSession();

// Validate session before operations
if (!this.sessionService.isSessionValid()) {
  this.messageService.add({
    severity: 'error',
    summary: 'Session Invalid',
    detail: 'Your session has expired. Please refresh the page.'
  });
  return;
}
```

### **2. Timeout Management**
```typescript
private startSessionTimeoutTimer(): void {
  if (this.timeoutTimer) {
    clearTimeout(this.timeoutTimer);
  }

  if (this.sessionTimeout > 0) {
    this.timeoutTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.sessionTimeout * 1000);
  }
}

private handleSessionTimeout(): void {
  this.messageService.add({
    severity: 'warn',
    summary: 'Session Expired',
    detail: 'Your session has expired. Please start again.'
  });
  
  this.clearAllSelections();
  this.router.navigate(['/movies']);
}
```

## 🎭 State Management

### **1. Seat Availability States**
```typescript
// Central seat availability mapping
seatAvailability: { [seatId: string]: 'available' | 'booked' | 'selected' } = {};

private updateSeatAvailabilityFromResponse(response: OccupiedSeatResponse): void {
  // Reset all seats to available
  Object.keys(this.seatAvailability).forEach(seatId => {
    this.seatAvailability[seatId] = 'available';
  });

  // Mark occupied seats as booked
  response.occupiedSeats.forEach(occupiedSeat => {
    const isOurSelection = this.selectedSeats.some(seat => seat.id === occupiedSeat.seatId);
    if (!isOurSelection) {
      this.seatAvailability[occupiedSeat.seatId.toString()] = 'booked';
    }
  });

  // Update hall layout
  this.updateHallLayoutFromAvailability();
}
```

### **2. Selected Seats Management**
```typescript
// Maximum seat selection limit
readonly MAX_SEATS = 10;

// Selected seats array with pricing
selectedSeats: SelectedSeat[] = [];

// Calculate total amount
getTotalAmount(): number {
  return this.selectedSeats.reduce((total, seat) => total + seat.price, 0);
}
```

## 🛡️ Error Handling & Edge Cases

### **1. API Error Handling**
```typescript
private updateSeatSelection(seat: SelectedSeat): void {
  this.bookingService.selectSeatBySession(this.sessionId, seatSelectionDto)
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Seat Selected',
            detail: `You have selected seat ${seat.seatNumber}`
          });
        } else {
          this.revertSeatSelection(seat);
        }
      },
      error: (error) => {
        if (error.status === 409) {
          // Handle seat conflict
          this.handleSeatConflict(seat, error.error);
        } else {
          // Revert optimistic update
          this.revertSeatSelection(seat);
          this.messageService.add({
            severity: 'error',
            summary: 'Selection Failed',
            detail: error.error?.message || 'Failed to select seat'
          });
        }
      }
    });
}
```

### **2. Validation & Limits**
```typescript
onSeatClick(seat: SelectedSeat): void {
  // Prevent interactions during loading
  if (this.loading) return;

  // Check if seat is booked
  if (seat.status === 'booked') {
    this.messageService.add({
      severity: 'warn',
      summary: 'Seat Unavailable',
      detail: 'This seat is already booked'
    });
    return;
  }

  // Check seat limit before selecting
  if (!isSelected && this.selectedSeats.length >= this.MAX_SEATS) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Maximum Seats Reached',
      detail: `You can select maximum ${this.MAX_SEATS} seats`
    });
    return;
  }

  // Proceed with selection/deselection
  if (isSelected) {
    this.deselectSeat(seat);
  } else {
    this.selectSeat(seat);
  }
}
```

## 🎫 Payment Integration

### **1. Payment Dialog Launch**
```typescript
processPayment(): void {
  if (this.selectedSeats.length === 0) {
    this.messageService.add({
      severity: 'warn',
      summary: 'No Seats Selected',
      detail: 'Please select at least one seat to proceed.'
    });
    return;
  }

  this.processing = true;
  
  // API call to lock seats for payment
  this.bookingService.proceedToPayment(this.sessionId, this.screeningId)
    .subscribe({
      next: (response) => {
        if (response.success) {
          // Extend session timeout for payment window
          this.sessionTimeout = response.timeoutSeconds;
          this.startSessionTimeoutTimer();

          // Open payment dialog
          const bookingData = {
            movie: this.movie,
            screening: this.screening,
            selectedSeats: this.selectedSeats,
            totalAmount: this.getTotalAmount(),
            sessionId: this.sessionId,
            booking: response.booking
          };

          this.ref = this.dialogService.open(PaymentComponent, {
            modal: true,
            closable: false,
            data: bookingData
          });

          // Handle payment completion
          this.ref.onClose.subscribe(result => {
            if (result?.success) {
              this.clearAllSelections();
              this.router.navigate(['/eticket', this.sessionId, result.booking.id]);
            }
            this.processing = false;
          });
        }
      },
      error: (error) => {
        this.processing = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Payment Error',
          detail: 'Failed to proceed to payment'
        });
      }
    });
}
```

## 🧹 Cleanup & Memory Management

### **1. Component Destruction**
```typescript
ngOnDestroy(): void {
  console.log('Component destroying, performing cleanup');

  // Complete observables
  this.destroy$.next();
  this.destroy$.complete();

  // Clear seat selections
  if (this.selectedSeats.length > 0) {
    this.clearAllSelections();
  }

  // End session
  this.sessionService.endSession();

  // Clear timers
  if (this.timeoutTimer) {
    clearTimeout(this.timeoutTimer);
  }
  if (this.refreshTimer) {
    clearInterval(this.refreshTimer);
  }
}
```

### **2. Selection Cleanup**
```typescript
private clearAllSelections(): void {
  // Update each selected seat
  this.selectedSeats.forEach(seat => {
    seat.status = 'available';
    seat.selected = false;
    this.seatAvailability[seat.id.toString()] = 'available';
    this.updateSeatInHallLayout(seat);
  });

  // Clear the array
  this.selectedSeats = [];
  
  console.log('All selections cleared');
}
```

## 📊 Performance Optimizations

### **1. Efficient Data Loading**
- **Parallel API Calls**: Using `forkJoin` for simultaneous data loading
- **Lazy Loading**: Loading only necessary data for current screening
- **Caching**: Session-based caching of seat selections

### **2. Optimistic UI Updates**
- **Immediate Feedback**: UI updates before API confirmation
- **Rollback Mechanism**: Automatic reversion on API failures
- **Conflict Resolution**: Smart handling of concurrent user actions

### **3. Memory Management**
- **Observable Cleanup**: Using `takeUntil` pattern for subscription management
- **Timer Cleanup**: Proper clearance of timeouts and intervals
- **Session Cleanup**: Automatic session termination on component destruction

## 🎯 Usage Examples

### **1. Basic Implementation**
```typescript
// In your routing module
{
  path: 'seats/:id',
  component: PublicSelectSeatsComponent
}

// Navigation to seat selection
this.router.navigate(['/seats', screeningId]);
```

### **2. Custom Configuration**
```typescript
// Environment-specific settings
export const seatSelectionConfig = {
  maxSeats: 10,
  sessionTimeout: 900, // 15 minutes
  refreshInterval: 30000, // 30 seconds
  paymentTimeout: 900 // 15 minutes
};
```

## 🎉 Summary

The **Public Seat Selection Component** provides a comprehensive, real-time seat selection experience with:

- ✅ **Real-time conflict resolution**
- ✅ **Optimistic UI updates**
- ✅ **Session-based seat locking**
- ✅ **Responsive hall layout**
- ✅ **Comprehensive error handling**
- ✅ **Payment integration**
- ✅ **Memory-efficient cleanup**

This implementation ensures a smooth, reliable user experience while maintaining data consistency and handling edge cases gracefully.