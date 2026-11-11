# CuCoders Empleos reference

HTML and JSON-LD structures used by this skill. Update this file if CuCoders
changes its listing or detail markup. Base URL defaults to `https://cucoders.dev`
and is overridable with `CUCODER_JOBS_BASE_URL`.

## Authentication

None. The listing and detail pages are public HTML and require no key or cookie.

Verified while building this skill:

| Page | Status | Notes |
|------|--------|-------|
| `GET /empleos/` | 200 | Listing, about 20 cards per page |
| `GET /empleos/2` | 200 | Pagination |
| `GET /empleos/remoto/` | 200 | Work-mode filter |
| `GET /empleos/YYYY-MM-DD/<slug>/` | 200 | Detail page |
| Detail URL without the trailing slash | 404 | Always include the trailing slash |

The skill is a parser, not an API client. Every request is a normal HTML page
fetch with a descriptive User-Agent and `Accept-Language: es-CU,es;q=0.9,en;q=0.8`.

## Listing pages

Paths:

| Path | Meaning |
|------|---------|
| `/empleos/` | Page 1, all offers |
| `/empleos/{n}` | Page `n` (for example `/empleos/2`) |
| `/empleos/{filter}/` | Filtered page 1 |
| `/empleos/{filter}/{n}` | Filtered page `n` |

Known filters include:

- Work mode: `remoto`, `presencial`
- Employment type: `tiempo-completo`, `tiempo-parcial`
- Role/category: `software-developer`, `full-stack-developer`,
  `project-manager`, `system-administrator`, `graphic-designer`, and others.

The filter slug is interpolated into the path, so the CLI validates it with
`^[a-z0-9][a-z0-9-]*$` before building a URL.

### Card markup

Each listing card starts with:

```html
<div class="inline-grid items-center w-full p-4 pb-1 md:pb-2 ...">
  <div class="ml-2 inline-grid">
    <a href="/empleos/2026-11-10/<slug>" class="w-full ... font-semibold ...">Title</a>
    <a href="/empleos/2026-11-10/<slug>" class="w-full my-2 ...">Description</a>
    <div class="flex categories ...">
      <div><img src="/assets/img/icons/money4.svg"><p>Por convenir</p></div>
      <a href="/empleos/tiempo-completo"><spam>Tiempo Completo</spam></a>
      <a href="/empleos/remoto"><spam>Remoto</spam></a>
      <a href="/empleos/software-developer" class="text-gray-500">#Software Developer</a>
      <div><img src="/assets/img/icons/event-date.svg"><p>10/11/26</p></div>
    </div>
  </div>
</div>
```

The parser splits on the card-root class (`inline-grid items-center w-full p-4`),
then reads anchors:

| Selector / marker | Meaning |
|-------------------|---------|
| First anchor with `font-semibold` | Title |
| Next anchor with `my-2` | Full listing description |
| `money4.svg` followed by `<p>` | Salary text |
| `event-date.svg` followed by `<p>` | Listing date (`DD/MM/YY`) |
| Filter anchors with text not starting `#` | Modality / employment labels |
| Filter anchors with text starting `#` | Category tags |

Card mapping:

| Parsed value | Result field | Notes |
|--------------|--------------|-------|
| Detail path | `id` | Normalized to `/empleos/YYYY-MM-DD/<slug>/` |
| Title text | `title` | HTML stripped |
| Description text | `description` | HTML stripped, line breaks preserved |
| Salary `<p>` | `salary` | Free text, e.g. `800 - 1200 usd`, `Por convenir` |
| Date `<p>` | `date` | `DD/MM/YY` or `DD/MM/YYYY` → `YYYY-MM-DD` |
| `#tag` anchors | `tags`, `category` | First tag also fills `category` |
| Labels such as `Remoto` | `modality` | `remote`, `hybrid`, or `onsite` |
| Labels such as `Tiempo Completo` | `employment_type` | Joined if several |
| — | `company`, `location` | Usually `null` on listing cards |
| Path | `url` | `https://cucoders.dev` + path |

## Detail pages

Canonical shape:

```text
https://cucoders.dev/empleos/YYYY-MM-DD/<slug>/
```

### Visible title

The page has an `<h1>` with the human-readable title:

```html
<h1 class="..."> Oferta laboral (Remoto): Setter Comercial en La Subasta Cubana </h1>
```

The CLI prefers this over the JSON-LD title, because the JSON-LD title can contain
category lists rather than the actual role. Open Graph title is the fallback, with
the `" | CuCoders Jobs"` suffix removed.

### JSON-LD JobPosting

Detail pages embed a schema.org object:

```json
{
  "@context": "https://schema.org/",
  "@type": "JobPosting",
  "description": "<p>…full description…</p>",
  "datePosted": "2026-10-05",
  "validThrough": "2027-01-05",
  "applicantLocationRequirements": { "@type": "Country", "name": "CUBA" },
  "jobLocationType": "TELECOMMUTE",
  "hiringOrganization": "confidential",
  "title": "Oferta laboral (Remoto): Setter Comercial en La Subasta Cubana"
}
```

| JSON-LD field | Result field | Notes |
|---------------|--------------|-------|
| `description` | `description` | HTML-encoded; decoded and stripped |
| `datePosted` | `date` | Date-only |
| `validThrough` | `valid_through` | Date-only |
| `applicantLocationRequirements.name` | `location` | Country/region |
| `jobLocation` address | `location` | Fallback when requirements are absent |
| `jobLocationType: TELECOMMUTE` | `modality` | Maps to `remote` |
| `hiringOrganization` | `company` | String or `.name`; may be `confidential` |
| `employmentType` | `employment_type` | String or array |
| `baseSalary` | `salary` | Only used when visible salary is absent |

### Visible fields

- Salary: `money4.svg` followed by a `<p>`; this is preferred over JSON-LD salary
  because it preserves free text such as `300 - 900 usd`.
- Work mode and employment labels: anchors under `/empleos/remoto`,
  `/empleos/presencial`, `/empleos/tiempo-completo`, etc.
- Tags: anchors whose text starts with `#`.
- Description fallback: a `div` with both `prose` and `whitespace-pre-wrap` in its
  class list, used only if JSON-LD description is absent.
- Apply/contact links: anchors inside `<div id="applyDropdown">`, for example:

```html
<div id="applyDropdown">
  <ul>
    <li><a href="https://t.me/rocio_sl">Contactar en Telegram</a></li>
    <li><a href="tel:55391643">Tel: 55391643</a></li>
  </ul>
</div>
```

The CLI emits these as `contacts: [{ label, url }]`; it does not normalize or
validate phone numbers.

## Fetch behaviour

- `Accept: text/html,application/xhtml+xml` and a descriptive User-Agent.
- Timeout: 15 seconds via `AbortSignal.timeout`.
- 429 and 5xx: three attempts with 250 ms / 500 ms backoff.
- 404: `null`; for `detail` this becomes `NOT_FOUND`; for the first listing page
  it becomes `SEARCH_FAILED` rather than a misleading empty result.
- Connection failure or timeout: fail fast with `NETWORK_ERROR` /
  `REQUEST_TIMEOUT`.
- Listing scans deduplicate by normalized job path and pause 350 ms between pages
  by default (`CUCODER_REQUEST_DELAY_MS`).

## Parsing notes

- The HTML is UTF-8; fetch decodes it as text, so accented Spanish characters are
  preserved.
- Anchor attribute order is not assumed; the parser reads `href` and `class` from
  the attribute string.
- `DD/MM/YY` dates use the `20YY` century. `DD/MM/YYYY` is also accepted.
- `Por convenir` is kept as salary text; it is not converted to a number.
- The parser caps scans at 31 listing pages to avoid unbounded crawling.
