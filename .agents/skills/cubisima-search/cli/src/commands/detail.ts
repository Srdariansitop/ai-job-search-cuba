import { cleanHtml } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const targetUrl = opts.id.startsWith("http") ? opts.id : `https://www.cubisima.com${opts.id}`

  let res: Response
  try {
    res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AIJobSearchCuba/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    })
  } catch (e) {
    process.stderr.write(
      JSON.stringify({
        error: `Failed to connect to Cubisima detail page: ${e instanceof Error ? e.message : String(e)}`,
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
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? cleanHtml(titleMatch[1]) : "Cubisima Offer"

  const detailObj = {
    title,
    company: null,
    location: "Cuba",
    url: targetUrl,
    description: cleanHtml(html.slice(0, 5000)),
  }

  if (opts.format === "json") {
    process.stdout.write(JSON.stringify(detailObj, null, 2) + "\n")
  } else {
    process.stdout.write(`Title:    ${detailObj.title}\n`)
    process.stdout.write(`URL:      ${detailObj.url}\n\n`)
    process.stdout.write(`Details:\n${detailObj.description ?? "N/A"}\n`)
  }

  return 0
}
