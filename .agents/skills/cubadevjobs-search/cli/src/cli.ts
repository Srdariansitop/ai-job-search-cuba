#!/usr/bin/env bun
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { runSearch, type SearchOpts } from "./commands/search.js"
import { baseUrl, MAX_SCAN_PAGES, normalizeFilter, writeError } from "./helpers.js"

interface Flags {
  _: string[]
  [key: string]: string | boolean | string[]
}

const ALIASES: Record<string, string> = { q: "query", n: "limit" }

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const argument = argv[i]
    if (!argument.startsWith("-")) {
      flags._.push(argument)
      continue
    }
    const key = ALIASES[argument.replace(/^-+/, "")] ?? argument.replace(/^-+/, "")
    const next = argv[i + 1]
    if (next !== undefined && !next.startsWith("-")) {
      flags[key] = next
      i++
    } else {
      flags[key] = true
    }
  }
  return flags
}

function stringFlag(value: string | boolean | string[] | undefined, whenBare?: string): string | undefined {
  if (typeof value === "string") return value
  if (value === true) return whenBare
  return undefined
}

function integerFlag(
  name: string,
  value: string | boolean | string[] | undefined,
  options: { min: number; max?: number; optional?: boolean },
): number | null | undefined {
  if (value === undefined) return options.optional ? undefined : null
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    writeError(`--${name} must be an integer, got "${String(value)}"`, "BAD_ARG")
    return null
  }
  const parsed = Number.parseInt(value, 10)
  if (parsed < options.min) {
    writeError(`--${name} must be at least ${options.min}, got "${value}"`, "BAD_ARG")
    return null
  }
  if (options.max !== undefined && parsed > options.max) {
    writeError(`--${name} must be at most ${options.max}, got "${value}"`, "BAD_ARG")
    return null
  }
  return parsed
}

const HELP = `cubadevjobs-cli — search CuCoders / Cuban Dev Jobs listings (Cuba)

USAGE
  bun run src/cli.ts search [-q "<keywords>"] [filters] [--format json|table|plain]
  bun run src/cli.ts detail <url|path> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>       Filter title, description, tags and labels locally.
  --filter <slug>          CuCoders listing filter, e.g. remoto, presencial,
                           tiempo-completo, software-developer.
  --page <n>               First listing page to scan. Default 1.
  --pages <n>              Number of listing pages to scan (1-${MAX_SCAN_PAGES}). Default 3.
  --limit, -n <n>          Maximum results after filtering. Default 25.
  --jobage <days>          Only offers dated within the last N days.
  --format <fmt>           json (default) | table | plain.

DETAIL
  <url|path>               Full CuCoders job URL or /empleos/YYYY-MM-DD/<slug>/ path.

EXAMPLES
  bun run src/cli.ts search -q "python" --filter remoto --pages 5 --format table
  bun run src/cli.ts search -q "full stack" --jobage 14 --limit 10 --format plain
  bun run src/cli.ts detail https://cucoders.dev/empleos/2026-10-05/Oferta-laboral-Remoto-Setter-Comercial-en-La-Subasta-Cubana/ --format plain

Source: ${baseUrl()}. Public HTML, no API key. Override with CUCODER_JOBS_BASE_URL.
`

async function main(): Promise<number> {
  const flags = parseFlags(process.argv.slice(2))
  const command = flags._[0]

  if (!command || flags.help || flags.h) {
    process.stdout.write(HELP)
    return command ? 0 : 1
  }

  if (command === "search") {
    const format = stringFlag(flags.format) ?? "json"
    if (!["json", "table", "plain"].includes(format)) {
      writeError(`--format must be one of json|table|plain, got "${format}"`, "BAD_ARG")
      return 1
    }

    const page = integerFlag("page", flags.page, { min: 1, optional: true })
    const pages = integerFlag("pages", flags.pages, { min: 1, max: MAX_SCAN_PAGES, optional: true })
    const limit = integerFlag("limit", flags.limit, { min: 1, optional: true })
    const jobage = integerFlag("jobage", flags.jobage, { min: 0, optional: true })
    if (page === null || pages === null || limit === null || jobage === null) return 1

    const rawFilter = stringFlag(flags.filter)
    const filter = rawFilter ? normalizeFilter(rawFilter) : null
    if (rawFilter && !filter) {
      writeError(`--filter must be a lowercase CuCoders filter slug, got "${rawFilter}"`, "BAD_ARG")
      return 1
    }

    const opts: SearchOpts = {
      query: stringFlag(flags.query),
      filter: filter ?? undefined,
      page: page ?? 1,
      pages: pages ?? 3,
      limit: limit ?? 25,
      jobage: jobage ?? 0,
      format: format as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (command === "detail") {
    const id = flags._[1]
    if (!id) {
      writeError("detail requires a <url|path>", "NO_ID")
      return 1
    }
    const format = stringFlag(flags.format) ?? "json"
    if (!["json", "plain"].includes(format)) {
      writeError(`--format must be one of json|plain, got "${format}"`, "BAD_ARG")
      return 1
    }
    const opts: DetailOpts = { id, format: format as DetailOpts["format"] }
    return runDetail(opts)
  }

  writeError(`Unknown command "${command}"`, "BAD_CMD")
  return 1
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    writeError(error instanceof Error ? error.message : String(error), "INTERNAL_ERROR")
    process.exit(1)
  })
