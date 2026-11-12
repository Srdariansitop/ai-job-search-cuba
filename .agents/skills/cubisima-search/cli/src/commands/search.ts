import { apiBaseUrl, cleanHtml, type CubisimaResult } from "../helpers.js"

export interface SearchOpts {
  query?: string
  limit: number
  format: "json" | "table" | "plain"
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  const baseUrl = apiBaseUrl()
  const searchUrl = `${baseUrl}/empleos/`

  let res: Response
  try {
    res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AIJobSearchCuba/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    })
  } catch (e) {
    process.stderr.write(
      JSON.stringify({
        error: `Failed to connect to cubisima.com: ${e instanceof Error ? e.message : String(e)}`,
        code: "NETWORK_ERROR",
      }) + "\n",
    )
    return 1
  }

  if (!res.ok) {
    process.stderr.write(
      JSON.stringify({
        error: `cubisima.com returned status ${res.status}`,
        code: "HTTP_ERROR",
      }) + "\n",
    )
    return 1
  }

  const html = await res.text()
  const results: CubisimaResult[] = []

  // Extract category links or job links from the employment landing page
  const linkRegex = /<a[^>]+href="([^"]*\/empleos\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null
  const seen = new Set<string>()

  while ((match = linkRegex.exec(html)) !== null) {
    let url = match[1]
    if (url.startsWith("/")) {
      url = `${baseUrl}${url}`
    }
    const title = cleanHtml(match[2]) || "Cubisima Listing"
    if (seen.has(url)) continue
    seen.add(url)

    if (opts.query) {
      const q = opts.query.toLowerCase()
      if (!title.toLowerCase().includes(q)) {
        continue
      }
    }

    results.push({
      id: url,
      title,
      company: null,
      location: "Cuba",
      date: null,
      url,
      description: null,
    })

    if (results.length >= opts.limit) {
      break
    }
  }

  if (opts.format === "json") {
    process.stdout.write(
      JSON.stringify(
        {
          meta: { count: results.length, query: opts.query ?? null },
          results,
        },
        null,
        2,
      ) + "\n",
    )
  } else if (opts.format === "table") {
    process.stdout.write(`Found ${results.length} category/listing(s) from Cubisima Empleos:\n\n`)
    process.stdout.write(`#   | Title                                    | Location      | URL\n`)
    process.stdout.write(`----|------------------------------------------|---------------|-------------------------------------------\n`)
    results.forEach((r, idx) => {
      const num = String(idx + 1).padEnd(3)
      const title = r.title.slice(0, 40).padEnd(40)
      const loc = (r.location ?? "").slice(0, 13).padEnd(13)
      process.stdout.write(`${num} | ${title} | ${loc} | ${r.url}\n`)
    })
  } else {
    results.forEach((r, idx) => {
      process.stdout.write(`[${idx + 1}] ${r.title}\n`)
      process.stdout.write(`    Location: ${r.location}\n`)
      process.stdout.write(`    URL:      ${r.url}\n\n`)
    })
  }

  return 0
}
