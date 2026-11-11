import {
  CliError,
  htmlFetch,
  isWithinDays,
  listingPath,
  parseJobCards,
  politePause,
  writeError,
  type JobResult,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  filter?: string
  page: number
  pages: number
  limit: number
  jobage: number
  format: "json" | "table" | "plain"
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
      job.salary,
      job.category,
      job.employment_type,
      job.modality,
      ...job.tags,
    ]
      .filter(Boolean)
      .join(" "),
  )
  return terms.every((term) => haystack.includes(term))
}

async function scanListings(opts: SearchOpts): Promise<{ jobs: JobResult[]; pagesScanned: number }> {
  const jobs = new Map<string, JobResult>()
  let pagesScanned = 0

  for (let offset = 0; offset < opts.pages; offset++) {
    const path = listingPath(opts.filter ?? null, opts.page + offset)
    const html = await htmlFetch(path)
    if (html === null) {
      if (offset === 0) {
        throw new CliError(`listing page ${path} returned 404`, "SEARCH_FAILED")
      }
      break
    }
    pagesScanned++
    const batch = parseJobCards(html)
    for (const job of batch) jobs.set(job.id, job)
    if (batch.length === 0) break
    if (offset < opts.pages - 1) await politePause()
  }

  return { jobs: [...jobs.values()], pagesScanned }
}

function renderTable(rows: JobResult[]): string {
  if (rows.length === 0) return "No results."
  const columns = [
    { header: "TITLE", width: 42, cell: (row: JobResult) => row.title },
    { header: "DATE", width: 10, cell: (row: JobResult) => row.date ?? "—" },
    { header: "MODALITY", width: 10, cell: (row: JobResult) => row.modality ?? "—" },
    { header: "TYPE", width: 20, cell: (row: JobResult) => row.employment_type ?? "—" },
    { header: "SALARY", width: 18, cell: (row: JobResult) => row.salary ?? "—" },
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
        `  ${job.date ?? "—"} · ${job.modality ?? "—"} · ${job.employment_type ?? "—"}`,
        `  salary: ${job.salary ?? "—"} · tags: ${job.tags.length ? job.tags.join(", ") : "—"}`,
        `  id: ${job.id}`,
        `  ${job.url}`,
      ].join("\n"),
    )
    .join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const { jobs, pagesScanned } = await scanListings(opts)
    const filtered = jobs.filter(
      (job) =>
        matchesQuery(job, opts.query) &&
        (opts.jobage <= 0 || opts.jobage >= 9999 || isWithinDays(job.date, opts.jobage)),
    )
    const rows = filtered.slice(0, opts.limit)

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
              pages_scanned: pagesScanned,
              total: filtered.length,
              fetched: jobs.length,
              source: "cucoders",
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
