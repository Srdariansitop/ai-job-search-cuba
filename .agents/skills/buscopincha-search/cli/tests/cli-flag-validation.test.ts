import { describe, expect, test } from "bun:test"
import { runCLI } from "./helpers"

function parsedStderr(stderr: string): { error?: string; code?: string } {
  try {
    return JSON.parse(stderr)
  } catch {
    return {}
  }
}

describe("BuscoPincha CLI flag validation", () => {
  describe("numeric flags", () => {
    for (const name of ["page", "limit", "min-price", "max-price"]) {
      test(`--${name} non-numeric exits 1 with BAD_ARG`, async () => {
        const result = await runCLI(["search", `--${name}`, "foo"])
        expect(result.exitCode).toBe(1)
        const err = parsedStderr(result.stderr)
        expect(err.code).toBe("BAD_ARG")
        expect(err.error).toMatch(new RegExp(name))
      })
    }

    test("--page below 1 exits 1 with BAD_ARG", async () => {
      const result = await runCLI(["search", "--page", "0"])
      expect(result.exitCode).toBe(1)
      expect(parsedStderr(result.stderr).code).toBe("BAD_ARG")
    })

    test("--min-price greater than --max-price exits 1 with BAD_ARG", async () => {
      const result = await runCLI(["search", "--min-price", "10", "--max-price", "5"])
      expect(result.exitCode).toBe(1)
      expect(parsedStderr(result.stderr).code).toBe("BAD_ARG")
    })
  })

  describe("enum flags", () => {
    test("unsupported --format exits 1 with BAD_ARG", async () => {
      const result = await runCLI(["search", "--format", "xml"])
      expect(result.exitCode).toBe(1)
      expect(parsedStderr(result.stderr).code).toBe("BAD_ARG")
    })

    test("unsupported --modality exits 1 with BAD_ARG", async () => {
      const result = await runCLI(["search", "--modality", "teleport"])
      expect(result.exitCode).toBe(1)
      expect(parsedStderr(result.stderr).error).toMatch(/modality/)
    })

    test("unsupported --contract-type exits 1 with BAD_ARG", async () => {
      const result = await runCLI(["search", "--contract-type", "forever"])
      expect(result.exitCode).toBe(1)
      expect(parsedStderr(result.stderr).error).toMatch(/contract-type/)
    })
  })

  describe("detail arguments", () => {
    test("missing id exits 1 with NO_ID", async () => {
      const result = await runCLI(["detail"])
      expect(result.exitCode).toBe(1)
      expect(parsedStderr(result.stderr).code).toBe("NO_ID")
    })

    test("unparseable id exits 1 with BAD_ID before any network call", async () => {
      const result = await runCLI(["detail", "not a slug!"])
      expect(result.exitCode).toBe(1)
      expect(parsedStderr(result.stderr).code).toBe("BAD_ID")
    })

    test("unsupported detail format exits 1 with BAD_ARG", async () => {
      const result = await runCLI(["detail", "gestor-de-venta-online", "--format", "table"])
      expect(result.exitCode).toBe(1)
      expect(parsedStderr(result.stderr).code).toBe("BAD_ARG")
    })
  })

  describe("command dispatch", () => {
    test("unknown command exits 1 with BAD_CMD", async () => {
      const result = await runCLI(["frobnicate"])
      expect(result.exitCode).toBe(1)
      expect(parsedStderr(result.stderr).code).toBe("BAD_CMD")
    })

    test("no command prints help and exits 1", async () => {
      const result = await runCLI([])
      expect(result.exitCode).toBe(1)
      expect(result.stdout).toMatch(/USAGE/)
    })
  })
})
