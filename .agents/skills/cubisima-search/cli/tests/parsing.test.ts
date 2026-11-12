import { describe, test, expect } from "bun:test"
import { cleanHtml } from "../src/helpers"

describe("cubisima helper — cleanHtml", () => {
  test("strips HTML tags and decodes entities", () => {
    expect(cleanHtml("<div>Empleos &amp; Oportunidades</div>")).toBe("Empleos & Oportunidades")
  })
  test("returns null for empty input", () => {
    expect(cleanHtml(null)).toBeNull()
    expect(cleanHtml("")).toBeNull()
  })
})
