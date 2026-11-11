#!/usr/bin/env bun
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { runSearch, type SearchOpts } from "./commands/search.js"
import { baseUrl, writeError } from "./helpers.js"

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
  options: { min: number; optional?: boolean },
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
  return parsed
}

const HELP = `buscopincha-cli — search job offers on BuscoPincha (Cuba)

USAGE
  bun run src/cli.ts search [-q "<keywords>"] [filters] [--format json|table|plain]
  bun run src/cli.ts detail <slug|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>       Filter title, description, company, location and categories.
  --page <n>               1-indexed page of locally filtered matches. Default 1.
  --limit, -n <n>          Results per page. Default 25.
  --modality <value>       remote | hybrid | in_person.
  --contract-type <value>  fixed | punctual.
  --price-type <value>     Value returned by the API, e.g. fixed.
  --min-price <number>     Minimum numeric price.
  --max-price <number>     Maximum numeric price.
  --include-filled         Include offers marked as filled. Default excludes them.
  --format <fmt>           json (default) | table | plain.

DETAIL
  <slug|url>               A BuscoPincha job slug or https://buscopincha.com/jobs/<slug> URL.

EXAMPLES
  bun run src/cli.ts search -q "marketing" --modality remote --limit 10 --format table
  bun run src/cli.ts search --min-price 50000 --format plain
  bun run src/cli.ts detail gestor-de-venta-online --format plain

Source: ${baseUrl()}. Public API, no API key. Override with BUSCOPINCHA_API_URL.
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
    const limit = integerFlag("limit", flags.limit, { min: 1, optional: true })
    const minPrice = integerFlag("min-price", flags["min-price"], { min: 0, optional: true })
    const maxPrice = integerFlag("max-price", flags["max-price"], { min: 0, optional: true })
    if (page === null || limit === null || minPrice === null || maxPrice === null) return 1
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      writeError("--min-price cannot be greater than --max-price", "BAD_ARG")
      return 1
    }

    const modality = stringFlag(flags.modality)
    if (modality && !["remote", "hybrid", "in_person"].includes(modality)) {
      writeError(`--modality must be remote|hybrid|in_person, got "${modality}"`, "BAD_ARG")
      return 1
    }

    const contractType = stringFlag(flags["contract-type"])
    if (contractType && !["fixed", "punctual"].includes(contractType)) {
      writeError(`--contract-type must be fixed|punctual, got "${contractType}"`, "BAD_ARG")
      return 1
    }

    const opts: SearchOpts = {
      query: stringFlag(flags.query),
      page: page ?? 1,
      limit: limit ?? 25,
      format: format as SearchOpts["format"],
      modality,
      contractType,
      priceType: stringFlag(flags["price-type"]),
      minPrice,
      maxPrice,
      includeFilled: flags["include-filled"] === true,
    }
    return runSearch(opts)
  }

  if (command === "detail") {
    const id = flags._[1]
    if (!id) {
      writeError("detail requires a <slug|url>", "NO_ID")
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
