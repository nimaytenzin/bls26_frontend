# Pagination Utility - Usage Guide

## Overview

The pagination utility provides a standardized way to handle paginated API responses across all modules in the frontend application. It matches the backend pagination structure.

## Location

**File:** `/src/app/core/utility/pagination.interface.ts`

## Available Interfaces

### 1. PaginationQueryDto

Query parameters for paginated requests.

```typescript
interface PaginationQueryDto {
  page?: number;        // Page number (default: 1)
  limit?: number;       // Items per page (default: 10)
  sortBy?: string;      // Field to sort by
  sortOrder?: 'ASC' | 'DESC'; // Sort order (default: DESC)
}
```

### 2. PaginationMeta

Metadata returned with paginated responses.

```typescript
interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

### 3. PaginatedResponse<T>

Generic paginated response structure.

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
```

---

## Utility Functions

### createPaginationQuery()

Create pagination query parameters.

```typescript
createPaginationQuery(
  page?: number,
  limit?: number,
  sortBy?: string,
  sortOrder?: 'ASC' | 'DESC'
): PaginationQueryDto
```

**Example:**
```typescript
import { createPaginationQuery } from '@/core/utility/pagination.interface';

// Simple pagination
const query1 = createPaginationQuery(1, 10);
// { page: 1, limit: 10 }

// With sorting
const query2 = createPaginationQuery(2, 20, 'name', 'ASC');
// { page: 2, limit: 20, sortBy: 'name', sortOrder: 'ASC' }
```

### calculatePaginationOffsetLimit()

Calculate offset and limit from pagination query (for use with ORMs).

```typescript
calculatePaginationOffsetLimit(query: PaginationQueryDto): {
  offset: number;
  limit: number;
}
```

**Example:**
```typescript
const query = { page: 3, limit: 10 };
const { offset, limit } = calculatePaginationOffsetLimit(query);
// offset: 20, limit: 10
```

### createPaginationMeta()

Create pagination metadata.

```typescript
createPaginationMeta(
  totalItems: number,
  currentPage: number,
  itemsPerPage: number
): PaginationMeta
```

### createPaginatedResponseUtil()

Create complete paginated response.

```typescript
createPaginatedResponseUtil<T>(
  data: T[],
  totalItems: number,
  query: PaginationQueryDto
): PaginatedResponse<T>
```

---

## Usage Examples

### 1. Survey Module (Already Implemented)

**DTO File (survey.dto.ts):**
```typescript
// Re-export pagination types
export type {
  PaginationQueryDto,
  PaginationMeta,
  PaginatedResponse,
} from '../../utility/pagination.interface';
```

**Service File (survey.dataservice.ts):**
```typescript
import { PaginationQueryDto, PaginatedResponse } from './survey.dto';

findAllSurveysPaginated(
  query?: PaginationQueryDto
): Observable<PaginatedResponse<Survey>> {
  const params: any = {};
  if (query?.page) params.page = query.page.toString();
  if (query?.limit) params.limit = query.limit.toString();
  if (query?.sortBy) params.sortBy = query.sortBy;
  if (query?.sortOrder) params.sortOrder = query.sortOrder;

  return this.http.get<PaginatedResponse<Survey>>(
    `${this.apiUrl}/paginated`, 
    { params }
  );
}
```

**Component Usage:**
```typescript
export class SurveyListComponent implements OnInit {
  surveys: Survey[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  
  constructor(private surveyService: SurveyDataService) {}
  
  ngOnInit(): void {
    this.loadSurveys();
  }
  
  loadSurveys(page: number = 1): void {
    this.surveyService.findAllSurveysPaginated({
      page: page,
      limit: this.itemsPerPage,
      sortBy: 'startDate',
      sortOrder: 'DESC'
    }).subscribe({
      next: (response) => {
        this.surveys = response.data;
        this.currentPage = response.meta.currentPage;
        this.totalPages = response.meta.totalPages;
      }
    });
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadSurveys(this.currentPage + 1);
    }
  }
  
  previousPage(): void {
    if (this.currentPage > 1) {
      this.loadSurveys(this.currentPage - 1);
    }
  }
}
```

---

### 2. Dzongkhag Module (Example Implementation)

**DTO File (dzongkhag.dto.ts):**
```typescript
// Import and re-export pagination types
export type {
  PaginationQueryDto,
  PaginationMeta,
  PaginatedResponse,
} from '../../utility/pagination.interface';

export interface Dzongkhag {
  id: number;
  name: string;
  areaCode: string;
  // ... other fields
}
```

**Service File (dzongkhag.dataservice.ts):**
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Dzongkhag, 
  PaginationQueryDto, 
  PaginatedResponse 
} from './dzongkhag.dto';
import { BASEAPI_URL } from '../../constants/constants';

@Injectable({
  providedIn: 'root',
})
export class DzongkhagDataService {
  private apiUrl = `${BASEAPI_URL}/dzongkhag`;

  constructor(private http: HttpClient) {}

  findAllPaginated(
    query?: PaginationQueryDto
  ): Observable<PaginatedResponse<Dzongkhag>> {
    const params: any = {};
    if (query?.page) params.page = query.page.toString();
    if (query?.limit) params.limit = query.limit.toString();
    if (query?.sortBy) params.sortBy = query.sortBy;
    if (query?.sortOrder) params.sortOrder = query.sortOrder;

    return this.http.get<PaginatedResponse<Dzongkhag>>(
      `${this.apiUrl}/paginated`,
      { params }
    );
  }
}
```

---

### 3. Component Template with Pagination Controls

**HTML Template:**
```html
<div class="container">
  <!-- Data Table -->
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Code</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let item of items">
        <td>{{ item.name }}</td>
        <td>{{ item.code }}</td>
        <td>
          <button (click)="viewDetails(item)">View</button>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Pagination Controls -->
  <div class="pagination-controls">
    <button 
      (click)="previousPage()" 
      [disabled]="currentPage === 1"
    >
      Previous
    </button>
    
    <span>Page {{ currentPage }} of {{ totalPages }}</span>
    <span>({{ totalItems }} total items)</span>
    
    <button 
      (click)="nextPage()" 
      [disabled]="currentPage === totalPages"
    >
      Next
    </button>
  </div>

  <!-- Items per page selector -->
  <div class="items-per-page">
    <label>Items per page:</label>
    <select [(ngModel)]="itemsPerPage" (change)="changeItemsPerPage()">
      <option [value]="10">10</option>
      <option [value]="20">20</option>
      <option [value]="50">50</option>
      <option [value]="100">100</option>
    </select>
  </div>
</div>
```

**Component TypeScript:**
```typescript
export class ItemListComponent implements OnInit {
  items: any[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  totalItems = 0;
  hasNextPage = false;
  hasPreviousPage = false;

  constructor(private itemService: ItemDataService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(page: number = this.currentPage): void {
    this.itemService.findAllPaginated({
      page: page,
      limit: this.itemsPerPage,
      sortBy: 'name',
      sortOrder: 'ASC'
    }).subscribe({
      next: (response) => {
        this.items = response.data;
        this.currentPage = response.meta.currentPage;
        this.totalPages = response.meta.totalPages;
        this.totalItems = response.meta.totalItems;
        this.hasNextPage = response.meta.hasNextPage;
        this.hasPreviousPage = response.meta.hasPreviousPage;
      },
      error: (error) => console.error('Error loading items:', error)
    });
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.loadItems(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage) {
      this.loadItems(this.currentPage - 1);
    }
  }

  changeItemsPerPage(): void {
    this.currentPage = 1; // Reset to first page
    this.loadItems();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadItems(page);
    }
  }
}
```

---

## Advanced Usage

### With PrimeNG Paginator

```html
<p-paginator
  [rows]="itemsPerPage"
  [totalRecords]="totalItems"
  [rowsPerPageOptions]="[10, 20, 50, 100]"
  (onPageChange)="onPageChange($event)"
></p-paginator>
```

```typescript
onPageChange(event: any): void {
  const page = event.page + 1; // PrimeNG uses 0-based index
  this.itemsPerPage = event.rows;
  this.loadItems(page);
}
```

### With Search and Filters

```typescript
export class FilterableListComponent {
  searchTerm = '';
  filterStatus = '';
  
  loadItemsWithFilters(): void {
    this.itemService.findAllPaginated({
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    }).pipe(
      // Apply client-side filtering if needed
      map(response => ({
        ...response,
        data: response.data.filter(item => 
          item.name.includes(this.searchTerm) &&
          (!this.filterStatus || item.status === this.filterStatus)
        )
      }))
    ).subscribe({
      next: (response) => {
        this.items = response.data;
        // ... update pagination state
      }
    });
  }
}
```

---

## Best Practices

1. **Always use the centralized pagination interfaces** from `pagination.interface.ts`
2. **Re-export types** in your module's DTO file for easier imports
3. **Set reasonable defaults** (page: 1, limit: 10)
4. **Handle loading states** to improve UX
5. **Show total items** to give users context
6. **Provide items-per-page options** (10, 20, 50, 100)
7. **Disable pagination buttons** when at boundaries
8. **Reset to page 1** when changing filters or items per page
9. **Use consistent sorting** across requests
10. **Cache results** when appropriate to reduce API calls

---

## Migration from Legacy Pagination

If you have existing code using the old `PaginatedData` interface:

**Old:**
```typescript
interface PaginatedData<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    // ...
  };
}
```

**New:**
```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    // ...
  };
}
```

**Migration Steps:**
1. Update interface references from `PaginatedData` to `PaginatedResponse`
2. Change `pagination` to `meta`
3. Update property names:
   - `pageSize` → `itemsPerPage`
   - `totalCount` → `totalItems`
4. Remove unused properties (`firstPage`, `lastPage`, `nextPage`, `previousPage`)
5. Use `hasNextPage` and `hasPreviousPage` instead

---

## Testing

```typescript
import { createPaginationQuery, createPaginationMeta } from '@/core/utility/pagination.interface';

describe('Pagination Utility', () => {
  it('should create pagination query', () => {
    const query = createPaginationQuery(1, 10, 'name', 'ASC');
    expect(query.page).toBe(1);
    expect(query.limit).toBe(10);
    expect(query.sortBy).toBe('name');
    expect(query.sortOrder).toBe('ASC');
  });

  it('should create pagination metadata', () => {
    const meta = createPaginationMeta(100, 3, 10);
    expect(meta.currentPage).toBe(3);
    expect(meta.totalPages).toBe(10);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPreviousPage).toBe(true);
  });
});
```

---

## API Endpoints Reference

Ensure your backend implements these endpoints:

- `GET /api/{resource}` - Get all (no pagination)
- `GET /api/{resource}/active` - Get active items only
- `GET /api/{resource}/paginated` - Get paginated results

**Query Parameters:**
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 10, max: 100)
- `sortBy` (string, optional)
- `sortOrder` (string, optional, 'ASC' | 'DESC')

---

## Troubleshooting

### Issue: TypeScript errors with PaginatedResponse

**Solution:** Make sure you're importing from the correct location:
```typescript
import { PaginatedResponse } from '../../utility/pagination.interface';
```

### Issue: Pagination not updating

**Solution:** Ensure you're calling `loadItems()` after changing page/limit:
```typescript
changeItemsPerPage(): void {
  this.currentPage = 1;
  this.loadItems(); // Don't forget this!
}
```

### Issue: Wrong page numbers

**Solution:** Backend uses 1-based indexing, but some UI libraries use 0-based. Always convert:
```typescript
// PrimeNG uses 0-based
const page = event.page + 1;
```

---

## Summary

The pagination utility provides:
✅ Standardized interfaces matching backend structure
✅ Reusable utility functions
✅ Type-safe TypeScript support
✅ Easy integration across all modules
✅ Backward compatibility with legacy code
✅ Comprehensive documentation and examples

Use this utility for all new pagination implementations to ensure consistency across the application!
