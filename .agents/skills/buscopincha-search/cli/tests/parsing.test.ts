import { describe, expect, test } from "bun:test"
import {
  cleanText,
  normalizeSlug,
  toDetail,
  toResult,
  type JobOfferCard,
  type JobOfferDetail,
} from "../src/helpers"

function card(overrides: Partial<JobOfferCard> = {}): JobOfferCard {
  return {
    id: "d611aee8",
    slug: "gestor-de-venta-online",
    title: "Gestor de venta online",
    description: "Gestionar publicaciones &amp; clientes.",
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

describe("BuscoPincha parsing", () => {
  test("normalizes a slug from a URL or bare value", () => {
    expect(normalizeSlug("https://buscopincha.com/jobs/gestor-de-venta-online/")).toBe(
      "gestor-de-venta-online",
    )
    expect(normalizeSlug("gestor-de-venta-online")).toBe("gestor-de-venta-online")
    expect(normalizeSlug("not a slug!")).toBeNull()
  })

  test("decodes entities and strips HTML from descriptions", () => {
    expect(cleanText("<p>Hola &amp; adiós</p>\n\n<br>Más texto")).toBe("Hola & adiós\n\nMás texto")
  })

  test("maps a card to the common result contract", () => {
    expect(toResult(card())).toEqual({
      id: "gestor-de-venta-online",
      title: "Gestor de venta online",
      company: "Kike Ruiz",
      location: "La Habana, Cerro",
      date: null,
      url: "https://buscopincha.com/jobs/gestor-de-venta-online/",
      description: "Gestionar publicaciones & clientes.",
      modality: "in_person",
      contract_type: "fixed",
      price: 82000,
      price_type: "fixed",
      category: null,
      secondary_category: null,
      is_filled: false,
      is_premium: true,
    })
  })

  test("uses null instead of empty strings for missing fields", () => {
    const mapped = toResult(card({ freelance_name: "", location: "", description: "" }))
    expect(mapped.company).toBeNull()
    expect(mapped.location).toBeNull()
    expect(mapped.description).toBe("")
  })

  test("maps detail fields, category names, pricing, and phones", () => {
    const detail: JobOfferDetail = {
      ...card(),
      main_category: { id: 13, name: "Gestor" },
      secondary_category: { id: 6, name: "Marketing" },
      city: { name: "La Habana" },
      municipality: { name: "Cerro" },
      freelancer: { name: "Kike Ruiz", is_verified: true },
      pricing_details: { amount: "82000.00", amount_usd: 100, amount_eur: 89.6 },
      phones: [{ phone_number: "+5359426760" }],
      is_active: true,
    }

    const mapped = toDetail(detail)
    expect(mapped.category).toBe("Gestor")
    expect(mapped.secondary_category).toBe("Marketing")
    expect(mapped.location).toBe("La Habana, Cerro")
    expect(mapped.price).toBe(82000)
    expect(mapped.price_usd).toBe(100)
    expect(mapped.price_eur).toBe(89.6)
    expect(mapped.phones).toEqual(["+5359426760"])
    expect(mapped.is_verified).toBe(true)
  })
})
