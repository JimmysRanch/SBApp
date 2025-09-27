# Pagination & Analytics Enhancement

This document describes the pagination improvements and enhanced analytics features implemented for multi-tenancy support.

## New Paginated APIs

### 1. Calendar API (`/api/calendar`)

**Enhanced with pagination and business scoping:**

```typescript
GET /api/calendar?page=1&size=50&from=2025-01-01&to=2025-01-31&staffId=123&type=appointment

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "size": 50,
    "total": 150,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Parameters:**
- `page`: Page number (default: 1)
- `size`: Items per page (max: 100, default: 50)
- `from`: Start date filter
- `to`: End date filter
- `staffId`: Filter by staff member
- `type`: Filter by event type

### 2. Employee List API (`/api/employees`) - NEW

**Paginated employee listing with search and filtering:**

```typescript
GET /api/employees?page=1&size=20&search=john&status=active&orderBy=name&order=asc

Response:
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "Active",
      "active": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Parameters:**
- `page`: Page number (default: 1)
- `size`: Items per page (max: 100, default: 20)
- `search`: Search by name or email
- `status`: Filter by status (`all`, `active`, `inactive`)
- `orderBy`: Sort field (`name`, `created_at`, `email`)
- `order`: Sort direction (`asc`, `desc`)

### 3. Staff History API (Enhanced)

**Existing API enhanced with better pagination metadata:**

```typescript
GET /api/staff/[id]/history?page=1&size=50&status=completed&from=2025-01-01

Response:
{
  "rows": [...],
  "totals": {...},
  "pagination": {
    "page": 1,
    "size": 50,
    "total": 200,
    "totalPages": 4,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Enhanced Analytics API

### Reports Analytics API (`/api/reports/analytics`) - NEW

**Multiple report types with business scoping:**

#### Appointment Metrics
```typescript
GET /api/reports/analytics?type=appointments&start_date=2025-01-01&end_date=2025-01-31&status=completed

Response:
{
  "data": {
    "total_appointments": 150,
    "completed": 120,
    "canceled": 20,
    "no_show": 10,
    "pending": 0,
    "revenue": 15000.00,
    "expected_revenue": 18000.00,
    "avg_appointment_value": 125.00
  }
}
```

#### Staff Performance (Paginated)
```typescript
GET /api/reports/analytics?type=staff&page=1&size=10&start_date=2025-01-01

Response:
{
  "data": [
    {
      "staff_id": "uuid",
      "staff_name": "Jane Smith",
      "total_appointments": 50,
      "completed_appointments": 45,
      "completion_rate": 90.00,
      "total_revenue": 5625.00,
      "avg_revenue_per_appointment": 125.00
    }
  ],
  "pagination": {...}
}
```

#### Business Summary
```typescript
GET /api/reports/analytics?type=summary&start_date=2025-01-01&end_date=2025-01-31

Response:
{
  "data": {
    "total_staff": 8,
    "active_staff": 6,
    "total_appointments": 150,
    "completed_appointments": 120,
    "total_revenue": 15000.00,
    "avg_appointment_value": 125.00,
    "completion_rate": 80.00
  }
}
```

## Business_id Multi-Tenancy

All new APIs implement proper business_id scoping:

1. **Authentication**: User must be authenticated
2. **Business Resolution**: User's business_id is resolved from profiles table  
3. **Data Scoping**: All queries are scoped to the user's business
4. **Permission Checking**: Appropriate permissions verified via RLS

### Database Changes

#### Calendar Events Business Scoping
```sql
-- Migration: 20250201_calendar_business_scoping.sql
ALTER TABLE public.calendar_events 
  ADD COLUMN IF NOT EXISTS business_id uuid;

-- Foreign key constraint
ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_business_fk
  FOREIGN KEY (business_id) REFERENCES public.businesses(id);
```

#### Enhanced Analytics Functions
```sql
-- Migration: 20250201_enhanced_analytics.sql
-- New RPC functions with business_id scoping:
-- - reports_appointment_metrics_enhanced()
-- - reports_staff_performance()
-- - reports_business_summary()
```

## Frontend Integration

### Employee Page with Pagination

The employee listing page has been updated to demonstrate pagination usage:

```typescript
// Search and filter form
<form onSubmit={handleSearch}>
  <input 
    type="text" 
    placeholder="Search by name or email..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
  <select value={status} onChange={(e) => setStatus(e.target.value)}>
    <option value="all">All Status</option>
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </select>
</form>

// Pagination controls
{totalPages > 1 && (
  <div className="pagination">
    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
      Previous
    </button>
    <span>Page {currentPage} of {totalPages}</span>
    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
      Next
    </button>
  </div>
)}
```

## Pagination Response Format

All paginated APIs return data in this consistent format:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;        // Current page number
    size: number;        // Items per page
    total: number;       // Total number of items
    totalPages: number;  // Total number of pages
    hasNext: boolean;    // Whether there is a next page
    hasPrev: boolean;    // Whether there is a previous page
  };
}
```

## Testing

Basic pagination utility tests are included in `tests/pagination.test.ts` covering:
- Pagination metadata calculation
- Edge cases (first page, last page, single page)
- Size limit enforcement

## Security Considerations

1. **Business Isolation**: All APIs enforce business_id scoping
2. **Size Limits**: Maximum page size enforced (100 items)
3. **Permission Checks**: RLS policies and permission functions used
4. **Input Validation**: Query parameters validated and sanitized

## Performance Optimizations

1. **Database Indexes**: Added indexes on business_id columns
2. **Count Queries**: Use Supabase's `count: 'exact'` for accurate totals
3. **Efficient Pagination**: Use `range()` for offset-limit queries
4. **Selective Fields**: Only fetch required fields to reduce payload

## Migration Path

Existing endpoints maintain backward compatibility:
- Old calendar API still works without pagination
- Employee page falls back to old method if new API fails
- Staff history API enhanced but maintains existing response structure