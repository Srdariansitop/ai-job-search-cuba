import { describe, test, expect } from "bun:test"
import { cleanHtml } from "../src/helpers"

describe("cubajobs-net helper — cleanHtml", () => {
  test("strips HTML tags and decodes entities", () => {
    expect(cleanHtml("<p>Desarrollador Python &amp; Go</p>")).toBe("Desarrollador Python & Go")
  })
  test("returns null for empty input", () => {
    expect(cleanHtml(null)).toBeNull()
    expect(cleanHtml("")).toBeNull()
  })
})
