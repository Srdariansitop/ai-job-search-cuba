import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { runDetail } from "../src/commands/detail"
import { runSearch, type SearchOpts } from "../src/commands/search"

const originalFetch = globalThis.fetch
const originalStdoutWrite = process.stdout.write
const originalStderrWrite = process.stderr.write

function captureStdout(): { get: () => string } {
  let buffer = ""
  process.stdout.write = ((chunk: string | Uint8Array) => {
    buffer += chunk.toString()
    return true
  }) as typeof process.stdout.write
  return { get: () => buffer }
}

function captureStderr(): { get: () => string } {
  let buffer = ""
  process.stderr.write = ((chunk: string | Uint8Array) => {
    buffer += chunk.toString()
    return true
  }) as typeof process.stderr.write
  return { get: () => buffer }
}

function cardHtml(title: string, slug: string, date: string, description: string): string {
  return `
  <div class="inline-grid items-center w-full p-4 pb-1 md:pb-2 text-gray-500 bg-white border rounded-lg">
    <div class="ml-2 inline-grid">
      <a href="/empleos/2026-11-10/${slug}" class="w-full font-semibold line-clamp-2">${title}</a>
      <a href="/empleos/2026-11-10/${slug}" class="w-full my-2 text-sm">${description}</a>
      <div class="flex categories">
        <div><img src="/assets/img/icons/money4.svg"><p>Por convenir</p></div>
        <a href="/empleos/remoto"><spam>Remoto</spam></a>
        <a href="/empleos/software-developer" class="text-gray-500">#Software Developer</a>
        <div><img src="/assets/img/icons/event-date.svg"><p>${date}</p></div>
      </div>
    </div>
  </div>`
}

function listing(...cards: string[]): string {
  return `<main>${cards.join("\n")}</main>`
}

function mockHtmlSequence(pages: Array<{ status: number; body: string }>): { urls: string[] } {
  const urls: string[] = []
  let index = 0
  globalThis.fetch = (async (input: string | URL | Request) => {
    urls.push(typeof input === "string" ? input : input instanceof URL ? input.href : input.url)
    const page = pages[Math.min(index, pages.length - 1)]
    index++
    return new Response(page.body, {
      status: page.status,
      headers: { "content-type": "text/html; charset=utf-8" },
    })
  }) as typeof fetch
  return { urls }
}

const baseOpts: SearchOpts = {
  page: 1,
  pages: 1,
  limit: 25,
  jobage: 0,
  format: "json",
}

beforeEach(() => {
  process.env.CUCODER_REQUEST_DELAY_MS = "0"
})

afterEach(() => {
  globalThis.fetch = originalFetch
  process.stdout.write = originalStdoutWrite
  process.stderr.write = originalStderrWrite
})

describe("CuCoders runSearch", () => {
  test("emits the contract envelope", async () => {
    mockHtmlSequence([
      {
        status: 200,
        body: listing(cardHtml("Python Developer", "Python-Developer", "09/11/26", "FastAPI")),
      },
    ])
    const out = captureStdout()

    const code = await runSearch({ ...baseOpts, query: "fastapi" })
    expect(code).toBe(0)
    const parsed = JSON.parse(out.get())
    expect(parsed.meta).toEqual({
      count: 1,
      page: 1,
      pages_scanned: 1,
      total: 1,
      fetched: 1,
      source: "cucoders",
    })
    expect(parsed.results[0].title).toBe("Python Developer")
    expect(parsed.results[0].id).toBe("/empleos/2026-11-10/Python-Developer/")
  })

  test("filters by query terms across title, description and tags", async () => {
    mockHtmlSequence([
      {
        status: 200,
        body: listing(
          cardHtml("Python Developer", "Python-Developer", "09/11/26", "FastAPI and PostgreSQL"),
          cardHtml("Diseñador gráfico", "Disenador-Grafico", "08/11/26", "Banners y branding"),
        ),
      },
    ])
    const out = captureStdout()

    await runSearch({ ...baseOpts, query: "postgresql software" })
    const parsed = JSON.parse(out.get())
    expect(parsed.results).toHaveLength(1)
    expect(parsed.results[0].title).toBe("Python Developer")
  })

  test("filters by job age", async () => {
    const today = new Date()
    const recent = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getFullYear()).slice(2)}`
    mockHtmlSequence([
      {
        status: 200,
        body: listing(
          cardHtml("Reciente", "Reciente", recent, "hoy"),
          cardHtml("Vieja", "Vieja", "01/01/20", "vieja"),
        ),
      },
    ])
    const out = captureStdout()

    await runSearch({ ...baseOpts, jobage: 2 })
    const parsed = JSON.parse(out.get())
    expect(parsed.results.map((job: { title: string }) => job.title)).toEqual(["Reciente"])
  })

  test("uses the requested listing filter and page", async () => {
    const mock = mockHtmlSequence([{ status: 200, body: listing() }])
    captureStdout()

    await runSearch({ ...baseOpts, filter: "remoto", page: 2 })
    expect(new URL(mock.urls[0]).pathname).toBe("/empleos/remoto/2")
  })

  test("scans multiple listing pages and deduplicates results", async () => {
    const mock = mockHtmlSequence([
      {
        status: 200,
        body: listing(cardHtml("Uno", "Uno", "09/11/26", "primera")),
      },
      {
        status: 200,
        body: listing(
          cardHtml("Dos", "Dos", "08/11/26", "segunda"),
          cardHtml("Uno", "Uno", "09/11/26", "primera"),
        ),
      },
    ])
    const out = captureStdout()

    await runSearch({ ...baseOpts, pages: 2 })
    const parsed = JSON.parse(out.get())
    expect(parsed.meta).toMatchObject({ pages_scanned: 2, fetched: 2, total: 2 })
    expect(mock.urls).toHaveLength(2)
    expect(new URL(mock.urls[1]).pathname).toBe("/empleos/2")
  })

  test("applies the result limit", async () => {
    mockHtmlSequence([
      {
        status: 200,
        body: listing(
          cardHtml("Uno", "Uno", "09/11/26", "primera"),
          cardHtml("Dos", "Dos", "08/11/26", "segunda"),
        ),
      },
    ])
    const out = captureStdout()

    await runSearch({ ...baseOpts, limit: 1 })
    const parsed = JSON.parse(out.get())
    expect(parsed.meta).toMatchObject({ count: 1, total: 2 })
  })

  test("a 404 listing is not treated as an empty success", async () => {
    mockHtmlSequence([{ status: 404, body: "not found" }])
    const out = captureStdout()
    const err = captureStderr()

    expect(await runSearch(baseOpts)).toBe(1)
    expect(out.get()).toBe("")
    expect(JSON.parse(err.get()).code).toBe("SEARCH_FAILED")
  })

  test("network failure exits 1 with SEARCH_FAILED", async () => {
    globalThis.fetch = (async () => {
      throw new Error("ECONNREFUSED")
    }) as typeof fetch
    captureStdout()
    const err = captureStderr()

    expect(await runSearch(baseOpts)).toBe(1)
    expect(JSON.parse(err.get()).code).toBe("SEARCH_FAILED")
  })
})

describe("CuCoders runDetail", () => {
  const detailHtml = `
    <html><head>
      <script type="application/ld+json">{"@type":"JobPosting","description":"&lt;p&gt;Descripción completa&lt;/p&gt;","datePosted":"2026-10-05","validThrough":"2027-01-05","applicantLocationRequirements":{"name":"CUBA"},"jobLocationType":"TELECOMMUTE","hiringOrganization":"confidential","title":"Setter Comercial"}</script>
    </head><body>
      <h1>Setter Comercial</h1>
      <div class="flex categories">
        <a href="/empleos/remoto"><spam>Remoto</spam></a>
        <a href="/empleos/tiempo-completo"><spam>Tiempo Completo</spam></a>
        <a href="/empleos/marketing">#Marketing</a>
      </div>
      <img src="/assets/img/icons/money4.svg"><p>300 - 900 usd</p>
      <div id="applyDropdown"><ul><li><a href="https://t.me/rocio_sl">Contactar en Telegram</a></li></ul></div>
    </body></html>`

  test("prints the reshaped detail", async () => {
    const mock = mockHtmlSequence([{ status: 200, body: detailHtml }])
    const out = captureStdout()

    const code = await runDetail({
      id: "https://cucoders.dev/empleos/2026-10-05/Oferta-laboral-Remoto-Setter-Comercial-en-La-Subasta-Cubana/",
      format: "json",
    })
    expect(code).toBe(0)
    const parsed = JSON.parse(out.get())
    expect(parsed.title).toBe("Setter Comercial")
    expect(parsed.company).toBe("confidential")
    expect(parsed.location).toBe("CUBA")
    expect(parsed.date).toBe("2026-10-05")
    expect(parsed.tags).toEqual(["Marketing"])
    expect(parsed.contacts).toHaveLength(1)
    expect(new URL(mock.urls[0]).pathname).toBe(
      "/empleos/2026-10-05/Oferta-laboral-Remoto-Setter-Comercial-en-La-Subasta-Cubana/",
    )
  })

  test("404 exits 1 with NOT_FOUND", async () => {
    mockHtmlSequence([{ status: 404, body: "not found" }])
    captureStdout()
    const err = captureStderr()

    const code = await runDetail({
      id: "/empleos/2026-10-05/Does-Not-Exist/",
      format: "json",
    })
    expect(code).toBe(1)
    expect(JSON.parse(err.get()).code).toBe("NOT_FOUND")
  })
})
