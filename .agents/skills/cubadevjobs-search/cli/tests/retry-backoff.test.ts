import { afterEach, describe, expect, test } from "bun:test"
import { CliError, htmlFetch } from "../src/helpers"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("CuCoders htmlFetch retries", () => {
  test("retries a 429 and succeeds", async () => {
    let calls = 0
    globalThis.fetch = (async () => {
      calls++
      if (calls === 1) return new Response("rate limited", { status: 429 })
      return new Response("<html>ok</html>", { status: 200 })
    }) as typeof fetch

    await expect(htmlFetch("/empleos/")).resolves.toBe("<html>ok</html>")
    expect(calls).toBe(2)
  })

  test("retries a 5xx and succeeds", async () => {
    let calls = 0
    globalThis.fetch = (async () => {
      calls++
      if (calls < 3) return new Response("boom", { status: 503 })
      return new Response("<html>ok</html>", { status: 200 })
    }) as typeof fetch

    await expect(htmlFetch("/empleos/")).resolves.toBe("<html>ok</html>")
    expect(calls).toBe(3)
  })

  test("gives up after three failed attempts", async () => {
    let calls = 0
    globalThis.fetch = (async () => {
      calls++
      return new Response("boom", { status: 500 })
    }) as typeof fetch

    try {
      await htmlFetch("/empleos/")
      throw new Error("expected htmlFetch to fail")
    } catch (error) {
      expect(error).toBeInstanceOf(CliError)
      expect((error as CliError).code).toBe("HTTP_ERROR")
    }
    expect(calls).toBe(3)
  })

  test("maps 404 to null", async () => {
    globalThis.fetch = (async () => new Response("missing", { status: 404 })) as typeof fetch
    await expect(htmlFetch("/empleos/missing/")).resolves.toBeNull()
  })

  test("fails fast on a connection error", async () => {
    let calls = 0
    globalThis.fetch = (async () => {
      calls++
      throw new Error("ECONNREFUSED")
    }) as typeof fetch

    try {
      await htmlFetch("/empleos/")
      throw new Error("expected htmlFetch to fail")
    } catch (error) {
      expect((error as CliError).code).toBe("NETWORK_ERROR")
    }
    expect(calls).toBe(1)
  })
})
