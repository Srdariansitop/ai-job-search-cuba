---
name: cubajobs-net-search
version: 1.0.0
description: >
  Search job offers in Cuba and remote opportunities for Cuban professionals published on
  CubaJobs (cubajobs.net). Use it for Cuban employment searches, remote work from Cuba,
  in-person roles in La Habana and other provinces, and detail lookups.
  Trigger phrases: cubajobs, cubajobs.net, empleo cuba, bolsa de empleo cubajobs,
  trabajo remoto cuba, ofertas de trabajo cuba.
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/cubajobs-net-search/cli/src/cli.ts *)
---

# CubaJobs.net Search Skill

Search job offers from **[CubaJobs](https://cubajobs.net)**, a dedicated job platform connecting professionals in Cuba and remote opportunities.

Reads use public HTML and search pages: no authentication, no API key, and **zero runtime dependencies** beyond `bun`.

## When to use this skill

- Find jobs in Cuba (La Habana, Santiago de Cuba, Santa Clara, etc.) and remote opportunities for Cuban professionals.
- Scan listings by keywords or location.
- Fetch detail on a specific job offer from `cubajobs.net`.

## Commands

### Search job listings

```bash
bun run .agents/skills/cubajobs-net-search/cli/src/cli.ts search [-q "<keywords>"] [--limit <n>] [--format json|table|plain]
```

### Fetch job detail

```bash
bun run .agents/skills/cubajobs-net-search/cli/src/cli.ts detail <url> [--format json|plain]
```
