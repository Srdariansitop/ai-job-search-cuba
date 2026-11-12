---
name: himalayas-search
version: 1.0.0
description: >
  Search remote tech and engineering job listings from Himalayas (himalayas.app) with a strict
  filter for 100% remote work available in Cuba (Worldwide / Global / No country restrictions,
  excluding jobs that require residency in specific countries like USA, EU, UK, etc.).
  Trigger phrases: himalayas, himalayas remote jobs, remote jobs cuba, trabajo remoto mundial,
  empleo remoto global, international remote jobs cuba.
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/himalayas-search/cli/src/cli.ts *)
---

# Himalayas Search Skill

Search remote job listings from **[Himalayas](https://himalayas.app)** via its public JSON API (`https://himalayas.app/jobs/api`).
This skill enforces a **strict Cuba-compatible remote filter**: only jobs that are 100% remote and either have no location restrictions (Worldwide/Global/Empty) or explicitly allow worldwide/anywhere remote work are returned, strictly filtering out jobs restricted to specific countries (e.g. USA only, EU only) unless Cuba is explicitly permitted or unrestricted.

## When to use this skill

- Find global or worldwide remote software, data, engineering, and tech jobs that can be done from Cuba.
- Query Himalayas API with keywords and ensure strict geographic compliance.
- Fetch full job details by slug or URL.

## Commands

### Search job listings

```bash
bun run .agents/skills/himalayas-search/cli/src/cli.ts search [-q "<keywords>"] [--limit <n>] [--format json|table|plain]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search in title, category, and description.
- `--limit <n>` / `-n <n>` — results per page (API limit). Default 25.
- `--format json|table|plain` — default `json`.
- `--jobage <days>` — posted within N days.

### Fetch full job detail

```bash
bun run .agents/skills/himalayas-search/cli/src/cli.ts detail <slug|url> [--format json|plain]
```

## Cuba & Remote Filtering Rules

1. **100% Remote Only**: Must be remote (checked via employment type / description / tags / work mode).
2. **Cuba / Worldwide Compatibility**: `locationRestrictions` must be empty, `["Worldwide"]`, `["Global"]`, `["Anywhere"]`, or not restricted to a specific foreign country (such as US-only or EU-only), ensuring a candidate in Cuba is eligible to apply.
