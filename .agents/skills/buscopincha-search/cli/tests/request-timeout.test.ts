import { afterEach, describe, expect, test } from "bun:test"
import { apiGet, CliError } from "../src/helpers"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("BuscoPincha request timeout", () => {
  test("passes an abort signal to fetch", async () => {
    let sawSignal = false
    globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
      sawSignal = init?.signal instanceof AbortSignal
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }) as typeof fetch

    await apiGet("/test")
    expect(sawSignal).toBe(true)
  })

  test("maps an aborted request to REQUEST_TIMEOUT without retrying", async () => {
    let calls = 0
    globalThis.fetch = (async () => {
      calls++
      throw new DOMException("The operation timed out.", "TimeoutError")
    }) as typeof fetch

    try {
      await apiGet("/test")
      throw new Error("expected apiGet to fail")
    } catch (error) {
      expect(error).toBeInstanceOf(CliError)
      expect((error as CliError).code).toBe("REQUEST_TIMEOUT")
      expect((error as CliError).message).toMatch(/timed out/)
    }
    expect(calls).toBe(1)
  })
})
