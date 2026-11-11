---
name: cubadevjobs-search
version: 1.0.0
description: >
  Search job offers from CuCoders Empleos, the website behind the Cuban Dev Jobs
  Telegram channel (@CuCodersJobs). Use it for Cuban software, data, design,
  marketing, and other roles published on CuCoders. Trigger phrases:
  cuba dev jobs, cuban developer jobs, cucoders, cucoders empleos, empleo
  software cuba, programador cuba, python cuba, csharp cuba, trabajo remoto cuba.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/cubadevjobs-search/cli/src/cli.ts *)
---

# Cuba Dev Jobs / CuCoders Search Skill

Search offers from **[CuCoders Empleos](https://cucoders.dev/empleos/)**, the
public job board behind the **Cuban Dev Jobs** Telegram channel (`@CuCodersJobs`).
There is no standalone “Cuba Dev Jobs” website; CuCoders is the canonical web
source for that brand.

Reads use public HTML: no authentication, no API key, and **zero runtime
dependencies** beyond `bun`. CuCoders does not expose a jobs API or a server-side
search parameter, so the CLI parses listing cards and filters locally.

## When to use this skill

- Find Cuban tech and non-tech job offers, especially software, data, design,
  marketing, sales, and remote roles.
- Scan a specific CuCoders category or work-mode filter.
- Filter by recency (`--jobage`) when listing dates are present.
- Look up one offer by URL or path to read the full description and contacts.

## Commands

### Search job listings

```bash
bun run .agents/skills/cubadevjobs-search/cli/src/cli.ts search [-q "<keywords>"] [filters]
```

Key flags:
- `--query <text>` / `-q <text>` — filters title, description, tags, employment
  type, modality, and salary locally. Case- and accent-insensitive; all terms must
  match.
- `--filter <slug>` — CuCoders listing filter, e.g. `remoto`, `presencial`,
  `tiempo-completo`, `tiempo-parcial`, `software-developer`, `full-stack-developer`.
- `--page <n>` — first listing page to scan. Default `1`.
- `--pages <n>` — number of listing pages to scan, from `1` to `31`. Default `3`.
- `--limit <n>` / `-n <n>` — maximum results after filtering. Default `25`.
- `--jobage <days>` — only offers dated within the last N days.
- `--format json|table|plain` — default `json`.

`--page` and `--pages` control the **listing window**, not result pagination.
There is no server-side search: to search deeper, scan more pages or use a
CuCoders filter to narrow the listing first.

### Fetch one job offer

```bash
bun run .agents/skills/cubadevjobs-search/cli/src/cli.ts detail <url|path> [--format json|plain]
```

Pass a full CuCoders URL or a path shaped like
`/empleos/YYYY-MM-DD/<slug>/`. The CLI reads the visible `<h1>`, the JSON-LD
`JobPosting`, listing labels, salary, tags, and apply/contact links.

## Usage examples

```bash
# Python roles in the remote filter, scanning five pages
bun run .agents/skills/cubadevjobs-search/cli/src/cli.ts search -q "python" --filter remoto --pages 5 --format table

# Full-stack offers from the last 14 days
bun run .agents/skills/cubadevjobs-search/cli/src/cli.ts search -q "full stack" --jobage 14 --limit 10 --format plain

# Detail by full URL
bun run .agents/skills/cubadevjobs-search/cli/src/cli.ts detail https://cucoders.dev/empleos/2026-10-05/Oferta-laboral-Remoto-Setter-Comercial-en-La-Subasta-Cubana/ --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default; programmatic use, includes full descriptions |
| `table` | Quick scanning of title, date, modality, type, and salary |
| `plain` | Reading one result or one offer's detail |

Search JSON is `{ "meta": { "count", "page", "pages_scanned", "total", "fetched", "source" }, "results": [...] }`.
Every result carries `id` (the job path), `title`, `company`, `location`, `date`,
`url`, `description`, `salary`, `tags`, `category`, `employment_type`, and
`modality`. Missing values are `null`; `tags` is always an array. Detail adds
`valid_through` and `contacts` (`label`, `url`). Errors go to **stderr** as
`{ "error": "...", "code": "..." }` with exit code `1`.

## Important limitations

- **No API.** CuCoders is an Astro site; the CLI depends on HTML classes and
  JSON-LD. Markup changes can break the parser.
- **Listing cards are sparse.** Company and location usually appear only in the
  detail page; search results often carry `company: null` and `location: null`.
- **JSON-LD title is not authoritative.** It can contain category text; the CLI
  prefers the visible `<h1>` and falls back to Open Graph.
- **Scanning is expensive.** Each listing page has about 20 cards and the site had
  roughly 31 pages. Use `--filter` and a small `--pages` value.
- **Be polite.** The CLI waits 350 ms between listing requests by default. Set
  `CUCODER_REQUEST_DELAY_MS=0` only for tests or when you control the instance.
- **Dates are listing dates.** They are normalized from `DD/MM/YY`; an offer with
  no date is excluded when `--jobage` is active.
- **Contacts are public listing data.** Detail may include Telegram links or phone
  numbers published for applications; do not use them for unrelated contact.

## Environment

The base URL defaults to `https://cucoders.dev` and can be overridden:

```bash
CUCODER_JOBS_BASE_URL=http://localhost:4321 bun run .agents/skills/cubadevjobs-search/cli/src/cli.ts search -q "python"
```

See `url-reference.md` for the HTML and JSON-LD reference.
