import {
  apiGet,
  CliError,
  MAX_LIST_PAGES,
  PAGE_SIZE,
  priceLabel,
  toResult,
  writeError,
  type JobOfferPage,
  type JobResult,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  page: number
  limit: number
  format: "json" | "table" | "plain"
  modality?: string
  contractType?: string
  priceType?: string
  minPrice?: number
  maxPrice?: number
  includeFilled: boolean
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function matchesQuery(job: JobResult, query: string | undefined): boolean {
  const terms = normalizeText(query ?? "")
    .split(/\s+/)
    .filter(Boolean)
  if (terms.length === 0) return true
  const haystack = normalizeText(
    [
      job.title,
      job.company,
      job.location,
      job.description,
      job.category,
      job.secondary_category,
      job.modality,
      job.contract_type,
    ]
      .filter(Boolean)
      .join(" "),
  )
  return terms.every((term) => haystack.includes(term))
}

function matchesFilters(job: JobResult, opts: SearchOpts): boolean {
  if (!opts.includeFilled && job.is_filled) return false
  if (opts.modality && job.modality?.toLowerCase() !== opts.modality.toLowerCase()) return false
  if (opts.contractType && job.contract_type?.toLowerCase() !== opts.contractType.toLowerCase()) {
    return false
  }
  if (opts.priceType && job.price_type?.toLowerCase() !== opts.priceType.toLowerCase()) return false
  if (opts.minPrice !== undefined && (job.price === null || job.price < opts.minPrice)) return false
  if (opts.maxPrice !== undefined && (job.price === null || job.price > opts.maxPrice)) return false
  return true
}

async function fetchAllCards(): Promise<{ jobs: JobResult[]; fetched: number }> {
  const jobs: JobResult[] = []
  for (let page = 1; page <= MAX_LIST_PAGES; page++) {
    const response = await apiGet<JobOfferPage>(
      `/api/job-offer/public/cards/?page=${page}&page_size=${PAGE_SIZE}`,
    )
    if (!response) {
      throw new CliError("job-offer cards endpoint returned 404", "SEARCH_FAILED")
    }
    const batch = response.results ?? []
    jobs.push(...batch.map(toResult))
    if (!response.next || batch.length === 0) break
  }
  return { jobs, fetched: jobs.length }
}

function renderTable(rows: JobResult[]): string {
  if (rows.length === 0) return "No results."
  const columns = [
    { header: "SLUG", width: Math.max(4, ...rows.map((row) => row.id.length)), cell: (row: JobResult) => row.id },
    { header: "TITLE", width: 36, cell: (row: JobResult) => row.title },
    { header: "COMPANY", width: 20, cell: (row: JobResult) => row.company ?? "—" },
    { header: "LOCATION", width: 22, cell: (row: JobResult) => row.location ?? "—" },
    { header: "MODALITY", width: 12, cell: (row: JobResult) => row.modality ?? "—" },
    { header: "PRICE", width: 16, cell: (row: JobResult) => priceLabel(row) },
  ]
  const row = (cells: string[]) =>
    cells.map((cell, index) => cell.slice(0, columns[index].width).padEnd(columns[index].width)).join("  ")
  const header = row(columns.map((column) => column.header))
  const body = rows.map((job) => row(columns.map((column) => column.cell(job))))
  return [header, "-".repeat(header.length), ...body].join("\n")
}

function renderPlain(rows: JobResult[]): string {
  if (rows.length === 0) return "No results."
  return rows
    .map((job) =>
      [
        job.title,
        `  ${job.company ?? "—"} · ${job.location ?? "—"} · ${job.modality ?? "—"}`,
        `  price: ${priceLabel(job)}`,
        `  slug: ${job.id}`,
        `  ${job.url}`,
      ].join("\n"),
    )
    .join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const { jobs, fetched } = await fetchAllCards()
    const filtered = jobs.filter((job) => matchesQuery(job, opts.query) && matchesFilters(job, opts))
    const start = (opts.page - 1) * opts.limit
    const rows = filtered.slice(start, start + opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(rows) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(renderPlain(rows) + "\n")
    } else {
      process.stdout.write(
        JSON.stringify(
          {
            meta: {
              count: rows.length,
              page: opts.page,
              total: filtered.length,
              fetched,
              source: "buscopincha",
            },
            results: rows,
          },
          null,
          2,
        ) + "\n",
      )
    }
    return 0
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error), "SEARCH_FAILED")
    return 1
  }
}
