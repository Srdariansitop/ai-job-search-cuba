import { afterEach, describe, expect, test } from "bun:test"
import { runDetail } from "../src/commands/detail"
import { runSearch, type SearchOpts } from "../src/commands/search"
import type { JobOfferCard, JobOfferDetail } from "../src/helpers"

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

function mockFetch(status: number, body: unknown): { urls: string[] } {
  const urls: string[] = []
  globalThis.fetch = (async (input: string | URL | Request) => {
    urls.push(typeof input === "string" ? input : input instanceof URL ? input.href : input.url)
    return new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })
  }) as typeof fetch
  return { urls }
}

function card(overrides: Partial<JobOfferCard> = {}): JobOfferCard {
  return {
    id: "d611aee8",
    slug: "gestor-de-venta-online",
    title: "Gestor de venta online",
    description: "Gestionar publicaciones en Amazon y eBay.",
    freelance_name: "Kike Ruiz",
    location: "La Habana, Cerro",
    main_category: 13,
    secondary_category: 6,
    price: 82000,
    price_type: "fixed",
    modality: "in_person",
    contract_type: "fixed",
    is_filled: false,
    is_premium: true,
    ...overrides,
  }
}

const searchOpts: SearchOpts = {
  query: undefined,
  page: 1,
  limit: 25,
  format: "json",
  includeFilled: false,
}

afterEach(() => {
  globalThis.fetch = originalFetch
  process.stdout.write = originalStdoutWrite
  process.stderr.write = originalStderrWrite
})

describe("BuscoPincha runSearch", () => {
  test("emits the contract envelope and fetches cards", async () => {
    const mock = mockFetch(200, { count: 1, next: null, previous: null, results: [card()] })
    const out = captureStdout()

    const code = await runSearch({ ...searchOpts, query: "amazon" })
    expect(code).toBe(0)

    const parsed = JSON.parse(out.get())
    expect(parsed.meta).toEqual({
      count: 1,
      page: 1,
      total: 1,
      fetched: 1,
      source: "buscopincha",
    })
    expect(parsed.results[0].id).toBe("gestor-de-venta-online")
    expect(new URL(mock.urls[0]).pathname).toBe("/api/job-offer/public/cards/")
    expect(new URL(mock.urls[0]).searchParams.get("page_size")).toBe("100")
  })

  test("filters by query terms across title, description and location", async () => {
    mockFetch(200, {
      count: 2,
      next: null,
      previous: null,
      results: [
        card(),
        card({
          slug: "disenador-grafico",
          title: "Diseñador gráfico",
          description: "Crear banners",
          location: "Matanzas",
        }),
      ],
    })
    const out = captureStdout()

    await runSearch({ ...searchOpts, query: "habana amazon" })
    const parsed = JSON.parse(out.get())
    expect(parsed.results).toHaveLength(1)
    expect(parsed.results[0].id).toBe("gestor-de-venta-online")
  })

  test("applies modality, contract and price filters locally", async () => {
    mockFetch(200, {
      count: 2,
      next: null,
      previous: null,
      results: [
        card(),
        card({ slug: "remoto", modality: "remote", price: 100000, price_type: "fixed" }),
      ],
    })
    const out = captureStdout()

    await runSearch({
      ...searchOpts,
      modality: "remote",
      contractType: "fixed",
      minPrice: 90000,
      maxPrice: 120000,
    })
    const parsed = JSON.parse(out.get())
    expect(parsed.results.map((job: { id: string }) => job.id)).toEqual(["remoto"])
  })

  test("excludes filled offers unless includeFilled is set", async () => {
    mockFetch(200, { count: 2, next: null, previous: null, results: [card({ is_filled: true }), card()] })
    const out = captureStdout()

    await runSearch(searchOpts)
    expect(JSON.parse(out.get()).results).toHaveLength(1)

    process.stdout.write = originalStdoutWrite
    const secondOut = captureStdout()
    await runSearch({ ...searchOpts, includeFilled: true })
    expect(JSON.parse(secondOut.get()).results).toHaveLength(2)
  })

  test("paginates the locally filtered matches", async () => {
    mockFetch(200, {
      count: 3,
      next: null,
      previous: null,
      results: [card({ slug: "uno" }), card({ slug: "dos" }), card({ slug: "tres" })],
    })
    const out = captureStdout()

    await runSearch({ ...searchOpts, page: 2, limit: 1 })
    const parsed = JSON.parse(out.get())
    expect(parsed.meta).toMatchObject({ count: 1, page: 2, total: 3 })
    expect(parsed.results[0].id).toBe("dos")
  })

  test("a 404 from the cards endpoint is an error, not an empty result", async () => {
    mockFetch(404, { error: "not found" })
    const out = captureStdout()
    const err = captureStderr()

    const code = await runSearch(searchOpts)
    expect(code).toBe(1)
    expect(out.get()).toBe("")
    expect(JSON.parse(err.get()).code).toBe("SEARCH_FAILED")
  })

  test("network failure exits 1 with SEARCH_FAILED", async () => {
    globalThis.fetch = (async () => {
      throw new Error("ECONNREFUSED")
    }) as typeof fetch
    captureStdout()
    const err = captureStderr()

    expect(await runSearch(searchOpts)).toBe(1)
    expect(JSON.parse(err.get()).code).toBe("SEARCH_FAILED")
  })
})

describe("BuscoPincha runDetail", () => {
  test("prints the reshaped detail", async () => {
    const detail: JobOfferDetail = {
      ...card(),
      main_category: { id: 13, name: "Gestor" },
      city: { name: "La Habana" },
      municipality: { name: "Cerro" },
      pricing_details: { amount: "82000.00", amount_usd: 100, amount_eur: 89.6 },
      phones: [{ phone_number: "+5359426760" }],
      is_active: true,
    }
    const mock = mockFetch(200, detail)
    const out = captureStdout()

    const code = await runDetail({ id: "https://buscopincha.com/jobs/gestor-de-venta-online/", format: "json" })
    expect(code).toBe(0)

    const parsed = JSON.parse(out.get())
    expect(parsed.id).toBe("gestor-de-venta-online")
    expect(parsed.category).toBe("Gestor")
    expect(parsed.phones).toEqual(["+5359426760"])
    expect(new URL(mock.urls[0]).pathname).toBe("/api/job-offer/public/gestor-de-venta-online/")
  })

  test("404 exits 1 with NOT_FOUND", async () => {
    mockFetch(404, { error: "not found" })
    captureStdout()
    const err = captureStderr()

    const code = await runDetail({ id: "does-not-exist", format: "json" })
    expect(code).toBe(1)
    expect(JSON.parse(err.get()).code).toBe("NOT_FOUND")
  })
})
