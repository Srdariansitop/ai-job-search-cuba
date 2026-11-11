import { afterEach, describe, expect, test } from "bun:test"
import { CliError, htmlFetch } from "../src/helpers"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("CuCoders request timeout", () => {
  test("passes an abort signal to fetch", async () => {
    let sawSignal = false
    globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
      sawSignal = init?.signal instanceof AbortSignal
      return new Response("<html>ok</html>", { status: 200 })
    }) as typeof fetch

    await htmlFetch("/empleos/")
    expect(sawSignal).toBe(true)
  })

  test("maps an aborted request to REQUEST_TIMEOUT without retrying", async () => {
    let calls = 0
    globalThis.fetch = (async () => {
      calls++
      throw new DOMException("The operation timed out.", "TimeoutError")
    }) as typeof fetch

    try {
      await htmlFetch("/empleos/")
      throw new Error("expected htmlFetch to fail")
    } catch (error) {
      expect(error).toBeInstanceOf(CliError)
      expect((error as CliError).code).toBe("REQUEST_TIMEOUT")
      expect((error as CliError).message).toMatch(/timed out/)
    }
    expect(calls).toBe(1)
  })
})
