# Permissions Matrix & RPC Access

(Extended with pagination note.)

## Pagination Update
The read RPCs `list_recent_messages` and `list_appointments_for_range` now return an object:
```
{
  data: [...],
  total: number,
  limit: number,
  offset: number,
  next_offset: number | null
}
```
`limit` capped at 200. Execution remains authenticated-only and SECURITY DEFINER.

(Existing permission details should be appended or merged here if this file did not previously exist.)
