# Himalayas API Reference

- **Base Endpoint**: `https://himalayas.app/jobs/api`
- **Pagination**: Supports cursor-based pagination (`?cursor=...`) and limit (`?limit=N`).
- **Search Query**: Supports `?q=<keyword>`.
- **Job Object Schema**:
  - `title`: string
  - `companyName`: string
  - `companySlug`: string
  - `employmentType`: string
  - `locationRestrictions`: array of strings (e.g., `["United States"]` or empty for worldwide)
  - `description`: HTML string
  - `pubDate`: timestamp
  - `applicationLink`: URL string
  - `guid`: URL string
