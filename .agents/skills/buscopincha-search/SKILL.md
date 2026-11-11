---
name: buscopincha-search
version: 1.0.0
description: >
  Search job offers published in the /jobs section of BuscoPincha, a Cuban
  services and freelance directory. Use it for Cuban employment searches, remote
  or in-person offers, and detail lookups by slug or URL. Trigger phrases:
  buscopincha, busco pincha, empleo cuba, trabajo cuba, bolsa de empleo cuba,
  ofertas de trabajo en cuba, buscar trabajo en cuba.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/buscopincha-search/cli/src/cli.ts *)
---

# BuscoPincha Search Skill

Search job offers from the `/jobs` section of **[BuscoPincha](https://buscopincha.com)**,
a Cuban services and freelance directory. Reads use BuscoPincha's public JSON API:
no authentication, no API key, and **zero runtime dependencies** beyond `bun`.

> BuscoPincha is not a dedicated job board. It is primarily a directory of local
> services and freelancers, with a small `/jobs` section. Treat it as one Cuban
> source among several, not as a complete employment market.

## When to use this skill

- Find job offers in Cuba, including remote, hybrid, and in-person roles.
- Filter by keyword, modality, contract type, or price range.
- Look up one offer by its slug or its `https://buscopincha.com/jobs/<slug>/` URL.
- Export structured results for ranking, tracking, or application workflows.

## Commands

### Search job offers

```bash
bun run .agents/skills/buscopincha-search/cli/src/cli.ts search [-q "<keywords>"] [filters]
```

Key flags:
- `--query <text>` / `-q <text>` — filters title, description, company, location,
  and categories. Case- and accent-insensitive; all terms must match.
- `--page <n>` — page of locally filtered matches. Default `1`.
- `--limit <n>` / `-n <n>` — results per page. Default `25`.
- `--modality remote|hybrid|in_person`
- `--contract-type fixed|punctual`
- `--price-type <value>` — the API's price type, for example `fixed`.
- `--min-price <number>` / `--max-price <number>` — numeric price bounds.
- `--include-filled` — include offers marked as filled. They are excluded by default.
- `--format json|table|plain` — default `json`.

Search fetches the public card list (`/api/job-offer/public/cards/`) and applies
text and attribute filters locally. The API does not support full-text search on
this endpoint, so `--query` is not sent to the server.

### Fetch one job offer

```bash
bun run .agents/skills/buscopincha-search/cli/src/cli.ts detail <slug|url> [--format json|plain]
```

`slug` is the `id` from a search result, for example `gestor-de-venta-online`.
A full `https://buscopincha.com/jobs/<slug>/` URL also works. Detail adds prices in
USD/EUR, phone contacts, social links, verification state, and the full description.

## Usage examples

```bash
# Remote marketing offers
bun run .agents/skills/buscopincha-search/cli/src/cli.ts search -q "marketing" --modality remote --limit 10 --format table

# Offers above a price threshold
bun run .agents/skills/buscopincha-search/cli/src/cli.ts search --min-price 50000 --format plain

# Detail by slug
bun run .agents/skills/buscopincha-search/cli/src/cli.ts detail gestor-de-venta-online --format plain

# Detail by portal URL
bun run .agents/skills/buscopincha-search/cli/src/cli.ts detail https://buscopincha.com/jobs/gestor-de-venta-online/
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default; programmatic use, includes full descriptions |
| `table` | Quick scanning of title, company, location, modality, and price |
| `plain` | Reading one offer's detail |

Search JSON is `{ "meta": { "count", "page", "total", "fetched", "source" }, "results": [...] }`.
Every result carries `id`, `title`, `company`, `location`, `date`, `url`,
`description`, `modality`, `contract_type`, `price`, `price_type`, `category`,
`secondary_category`, `is_filled`, and `is_premium`. Missing values are `null`.
Errors go to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Important limitations

- **No publication dates.** The public card and detail payloads do not expose a
  posting date, so `date` is normally `null` and this CLI does not implement
  `--jobage`.
- **Small corpus.** The `/jobs` section had about 13 offers when this skill was
  built. Do not present BuscoPincha as comprehensive Cuban job coverage.
- **Local filtering.** Text, modality, contract, and price filters run after
  fetching cards, capped at 10 pages of 100 cards.
- **Stale/closed offers.** `--include-filled` is opt-in because filled offers are
  usually noise; `is_filled` remains visible in JSON so callers can decide.
- **Public contact data.** Detail results may include phone numbers published in
  the listing. Treat them as public listing data; do not use them for unrelated
  contact.
- **API drift.** If BuscoPincha changes its public API, the CLI exits non-zero
  with a clear error instead of silently returning an empty result set.

## Environment

The base URL defaults to `https://buscopincha.com` and can be overridden:

```bash
BUSCOPINCHA_API_URL=http://localhost:8000 bun run .agents/skills/buscopincha-search/cli/src/cli.ts search -q "python"
```

See `url-reference.md` for the endpoint and field reference.
