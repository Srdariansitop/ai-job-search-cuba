---
name: cubisima-search
version: 1.0.0
description: >
  Search employment listings in Cuba published on Cubisima Empleos (cubisima.com/empleos/).
  Use it for Cuban job openings across state, mixed enterprise, and private sectors (MIPYMES/cuentapropistas)
  in La Habana and all provinces.
  Trigger phrases: cubisima, cubisima empleos, bolsa de empleo cubisima, trabajo cuba,
  empleo estatal cuba, mipymes cuba empleos.
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/cubisima-search/cli/src/cli.ts *)
---

# Cubisima Empleos Search Skill

Search job offers from **[Cubisima Empleos](https://www.cubisima.com/empleos/)**, the leading classifieds job board in Cuba covering state, mixed, and private sector roles (MIPYMES).

Reads use public HTML: no authentication, no API key, and **zero runtime dependencies** beyond `bun`.

## When to use this skill

- Find jobs across all Cuban provinces and categories (economy, tech, professional services, hospitality, trade, etc.).
- Scan listings by keywords or category.
- Fetch detail on a specific Cubisima job offer.

## Commands

### Search job listings

```bash
bun run .agents/skills/cubisima-search/cli/src/cli.ts search [-q "<keywords>"] [--limit <n>] [--format json|table|plain]
```

### Fetch job detail

```bash
bun run .agents/skills/cubisima-search/cli/src/cli.ts detail <url> [--format json|plain]
```
