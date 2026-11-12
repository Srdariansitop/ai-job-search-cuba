import { apiBaseUrl, isCubaCompatibleRemote, type HimalayasJob } from "../helpers.js"

export interface SearchOpts {
  query?: string
  jobage: number
  limit: number
  format: "json" | "table" | "plain"
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  const url = new URL(apiBaseUrl())
  if (opts.query) {
    url.searchParams.set("q", opts.query)
  }
  // Fetch a larger batch to ensure we find enough Cuba-compatible remote jobs after filtering
  const fetchLimit = Math.max(100, opts.limit * 5)
  url.searchParams.set("limit", String(fetchLimit))

  let res: Response
  try {
    res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AIJobSearchCuba/1.0)",
        Accept: "application/json",
      },
    })
  } catch (e) {
    process.stderr.write(
      JSON.stringify({
        error: `Failed to connect to Himalayas API: ${e instanceof Error ? e.message : String(e)}`,
        code: "NETWORK_ERROR",
      }) + "\n",
    )
    return 1
  }

  if (!res.ok) {
    process.stderr.write(
      JSON.stringify({
        error: `Himalayas API returned status ${res.status} ${res.statusText}`,
        code: "HTTP_ERROR",
      }) + "\n",
    )
    return 1
  }

  let data: { jobs?: HimalayasJob[]; totalCount?: number }
  try {
    data = await res.json()
  } catch (e) {
    process.stderr.write(
      JSON.stringify({
        error: `Failed to parse Himalayas API JSON response: ${e instanceof Error ? e.message : String(e)}`,
        code: "PARSE_ERROR",
      }) + "\n",
    )
    return 1
  }

  const rawJobs = data.jobs ?? []
  const now = Date.now()
  const maxAgeMs = opts.jobage * 24 * 60 * 60 * 1000

  const filtered: HimalayasJob[] = []
  for (const job of rawJobs) {
    // 1. Must be Cuba compatible & remote
    if (!isCubaCompatibleRemote(job)) {
      continue
    }

    // 2. Job age check if pubDate exists
    if (job.pubDate && now - job.pubDate * 1000 > maxAgeMs) {
      continue
    }

    // 3. Optional local query match if API didn't filter strictly enough
    if (opts.query) {
      const q = opts.query.toLowerCase()
      const titleMatch = job.title?.toLowerCase().includes(q) ?? false
      const descMatch = job.description?.toLowerCase().includes(q) ?? false
      const compMatch = job.companyName?.toLowerCase().includes(q) ?? false
      const catMatch = job.categories?.some((c) => c.toLowerCase().includes(q)) ?? false
      if (!titleMatch && !descMatch && !compMatch && !catMatch) {
        continue
      }
    }

    filtered.push(job)
    if (filtered.length >= opts.limit) {
      break
    }
  }

  const results = filtered.map((j) => {
    // Use guid or applicationLink or construct a slug/id
    const id = j.guid ?? j.applicationLink ?? j.title
    return {
      id,
      title: j.title,
      company: j.companyName,
      location: j.locationRestrictions?.length ? j.locationRestrictions.join(", ") : "Worldwide",
      date: j.pubDate ? new Date(j.pubDate * 1000).toISOString().split("T")[0] : null,
      url: j.applicationLink ?? j.guid,
      employment_type: j.employmentType ?? null,
      salary: j.minSalary ? `${j.minSalary} - ${j.maxSalary ?? "?"} ${j.currency ?? "USD"}` : null,
      description: j.description ?? null,
    }
  })

  if (opts.format === "json") {
    process.stdout.write(
      JSON.stringify(
        {
          meta: {
            count: results.length,
            total_fetched_raw: rawJobs.length,
            query: opts.query ?? null,
            filter: "Cuba-compatible 100% remote (worldwide/unrestricted)",
          },
          results,
        },
        null,
        2,
      ) + "\n",
    )
  } else if (opts.format === "table") {
    process.stdout.write(`Found ${results.length} Cuba-compatible remote job(s) on Himalayas:\n\n`)
    process.stdout.write(
      `#   | Title                                    | Company            | Location      | Date       | URL\n`,
    )
    process.stdout.write(
      `----|------------------------------------------|--------------------|---------------|------------|-------------------------------------------\n`,
    )
    results.forEach((r, idx) => {
      const num = String(idx + 1).padEnd(3)
      const title = (r.title ?? "").slice(0, 40).padEnd(40)
      const company = (r.company ?? "").slice(0, 18).padEnd(18)
      const loc = (r.location ?? "").slice(0, 13).padEnd(13)
      const date = (r.date ?? "").padEnd(10)
      const url = r.url ?? ""
      process.stdout.write(`${num} | ${title} | ${company} | ${loc} | ${date} | ${url}\n`)
    })
  } else {
    // plain
    results.forEach((r, idx) => {
      process.stdout.write(`[${idx + 1}] ${r.title}\n`)
      process.stdout.write(`    Company:  ${r.company}\n`)
      process.stdout.write(`    Location: ${r.location}\n`)
      process.stdout.write(`    Date:     ${r.date ?? "N/A"}\n`)
      process.stdout.write(`    URL:      ${r.url}\n`)
      process.stdout.write(`    Salary:   ${r.salary ?? "Not specified"}\n\n`)
    })
  }

  return 0
}
