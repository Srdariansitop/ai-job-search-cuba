# BuscoPincha public API reference

Endpoints and response shapes used by this skill. Update this file if BuscoPincha
changes its public API. Base URL defaults to `https://buscopincha.com` and is
overridable with `BUSCOPINCHA_API_URL`.

## Authentication

None for reads. The endpoints below are public and require no API key or cookie.

Verified against the live site while building this skill:

| Endpoint | Status | Purpose |
|----------|--------|---------|
| `GET /api/job-offer/public/cards/?page=1&page_size=100` | 200 | Paginated job-offer cards |
| `GET /api/job-offer/public/{slug}/` | 200 | One job-offer detail |
| `GET /api/job-offer/public/{missing}/` | 404 | Missing offer |

The cards response also advertises a `next` URL on a Railway host. The CLI ignores
that absolute URL and increments the page path against the configured base URL, so
`BUSCOPINCHA_API_URL` and tests stay deterministic.

## `GET /api/job-offer/public/cards/`

Paginated list used by `search`.

Query parameters:

| Param | Value used by the CLI | Notes |
|-------|------------------------|-------|
| `page` | `1…10` | 1-indexed. The CLI stops when `next` is `null` or the batch is empty. |
| `page_size` | `100` | Smaller sizes are accepted by the API. |

The endpoint does **not** document or reliably honor full-text search. The CLI
therefore fetches cards and filters locally.

Response envelope:

```json
{
  "count": 13,
  "next": "http://busco-pincha-production.up.railway.app/api/job-offer/public/cards/?page=2&page_size=1",
  "previous": null,
  "results": []
}
```

Card object:

```json
{
  "id": "d611aee8-7285-4b35-995d-562afce6dff4",
  "slug": "gestor-de-venta-online",
  "title": "Gestor de venta online",
  "description": "Gestionar y publicar en las distintas plataformas digitales…",
  "freelance_name": "Kike Ruiz",
  "location": "La Habana, Cerro",
  "main_category": 13,
  "secondary_category": 6,
  "likes": 0,
  "price": 82000.0,
  "price_type": "fixed",
  "modality": "in_person",
  "contract_type": "fixed",
  "is_filled": false,
  "is_saved": false,
  "is_liked": false,
  "is_premium": true
}
```

Mapping to the CLI result contract:

| API field | Result field | Notes |
|-----------|--------------|-------|
| `slug` | `id` | Stable public identifier, also used by `detail`. |
| `title` | `title` | Cleaned of HTML/entities. |
| `freelance_name` | `company` | The poster's display name. |
| `location` | `location` | Already composed as city/municipality on cards. |
| `description` | `description` | Cleaned text. |
| `modality` | `modality` | `in_person`, `remote`, or `hybrid` as returned. |
| `contract_type` | `contract_type` | `fixed` or `punctual`. |
| `price` | `price` | Numeric. May be `null`. |
| `price_type` | `price_type` | E.g. `fixed`. |
| `main_category` | `category` | Cards expose a numeric id, not a name; mapped to `null`. |
| `secondary_category` | `secondary_category` | Same limitation on cards. |
| `is_filled` | `is_filled` | Filled offers are excluded by default. |
| `is_premium` | `is_premium` | Premium flag. |
| — | `date` | The payload has no posting date, so this is `null`. |
| `slug` | `url` | `https://buscopincha.com/jobs/<slug>/`. |

## `GET /api/job-offer/public/{slug}/`

Detail used by `detail`. No query parameters.

Example response:

```json
{
  "id": "d611aee8-7285-4b35-995d-562afce6dff4",
  "slug": "gestor-de-venta-online",
  "freelancer": {
    "id": "f31d5454-fc06-47f0-8004-eb51614f961c",
    "name": "Kike Ruiz",
    "is_verified": true
  },
  "title": "Gestor de venta online",
  "description": "Gestionar y publicar…",
  "main_category": { "id": 13, "name": "Gestor", "is_archived": false },
  "secondary_category": { "id": 6, "name": "Marketing", "is_archived": false },
  "city": { "id": 1, "name": "La Habana", "code": "HAB" },
  "municipality": { "id": 37, "name": "Cerro", "code": "LH-10", "province": 1 },
  "price_type": "fixed",
  "pricing_details": {
    "amount": "82000.00",
    "amount_usd": 100.0,
    "amount_eur": 89.61748633879782
  },
  "modality": "in_person",
  "contract_type": "fixed",
  "is_filled": false,
  "social_links": [],
  "phones": [{ "id": 755, "phone_number": "+5359426760" }],
  "likes_count": 0,
  "is_premium": true,
  "is_active": true,
  "is_approved": true,
  "is_paid": true,
  "paid_until": "2026-12-09T15:26:20.991270Z",
  "is_saved": false,
  "is_liked": false
}
```

Detail mapping additions:

| API field | Result field | Notes |
|-----------|--------------|-------|
| `freelancer.name` | `company` | Falls back to card-style `freelance_name`. |
| `main_category.name` | `category` | Unlike cards, detail exposes the name. |
| `secondary_category.name` | `secondary_category` | Category name. |
| `city.name` + `municipality.name` | `location` | Joined as `"City, Municipality"` when card `location` is absent. |
| `pricing_details.amount` | `price` | Replaces the card price when present. |
| `pricing_details.amount_usd` | `price_usd` | Converted numeric value. |
| `pricing_details.amount_eur` | `price_eur` | Converted numeric value. |
| `phones[].phone_number` | `phones` | Public contact numbers from the listing. |
| `freelancer.is_verified` | `is_verified` | Boolean or `null`. |
| `is_active` | `is_active` | Boolean or `null`. |
| `paid_until` | `paid_until` | Date-only when parseable. |

## Parsing notes

- Responses are JSON, so there is no HTML card parser. Descriptions may contain
  HTML entities and simple tags; the CLI decodes and strips them.
- `main_category` and `secondary_category` are **numbers on cards** and **objects
  on detail**. The CLI handles both shapes and emits category names only when the
  API sends them.
- `date` cannot be derived reliably from the payload. `paid_until` is a billing
  date, not a publication date, so it is exposed separately and never used as
  `date`.
- Fetch sends `Accept: application/json` and a descriptive User-Agent. Requests
  time out after 15 seconds; 429/5xx are retried three times with backoff; 404 is
  mapped to `null`; connection failures fail fast.
- Search fetches at most 10 pages of 100 cards. All text and attribute filters run
  client-side, so `meta.total` is the number of local matches, not the server
  `count`.
