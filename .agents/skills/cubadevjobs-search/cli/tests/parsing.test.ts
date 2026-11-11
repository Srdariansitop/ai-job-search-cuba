import { describe, expect, test } from "bun:test"
import {
  cleanHtml,
  isWithinDays,
  listingPath,
  normalizeJobPath,
  parseJobCards,
  parseJobDetail,
  parseListingDate,
} from "../src/helpers"

const listingHtml = `
<main>
  <div class="inline-grid items-center w-full p-4 pb-1 md:pb-2 text-gray-500 bg-white border rounded-lg">
    <div class="ml-2 inline-grid">
      <a href="/empleos/2026-11-10/Necesitamos-un-matketolace-super-senior-experto-en-marketing-" class="w-full font-semibold line-clamp-2">Necesitamos un matketolace, super senior experto en marketing </a>
      <a href="/empleos/2026-11-10/Necesitamos-un-matketolace-super-senior-experto-en-marketing-" class="w-full my-2 text-sm">Necesitamos un experto en marketing. &amp; m&aacute;s.</a>
      <div class="flex categories">
        <div><img src="/assets/img/icons/money4.svg"><p class="ml-1">Por convenir</p></div>
        <a href="/empleos/tiempo-completo"><spam>Tiempo Completo</spam></a>
        <a href="/empleos/remoto"><spam>Remoto</spam></a>
        <a href="/empleos/system-administrator" class="text-gray-500">#System Administrator</a>
        <a href="/empleos/graphic-designer" class="text-gray-500">#Graphic Designer</a>
        <div><img src="/assets/img/icons/event-date.svg"><p class="ml-1">10/11/26</p></div>
      </div>
    </div>
  </div>
  <div class="inline-grid items-center w-full p-4 pb-1 md:pb-2 text-gray-500 bg-white border rounded-lg">
    <div class="ml-2 inline-grid">
      <a href="/empleos/2026-11-09/Python-Developer" class="w-full font-semibold line-clamp-2">Python Developer</a>
      <a href="/empleos/2026-11-09/Python-Developer" class="w-full my-2 text-sm">FastAPI and PostgreSQL.</a>
      <div class="flex categories">
        <div><img src="/assets/img/icons/money4.svg"><p class="ml-1">800 - 1200 usd</p></div>
        <a href="/empleos/presencial"><spam>Presencial</spam></a>
        <a href="/empleos/software-developer" class="text-gray-500">#Software Developer</a>
        <div><img src="/assets/img/icons/event-date.svg"><p class="ml-1">09/11/26</p></div>
      </div>
    </div>
  </div>
</main>
`

const detailHtml = `
<html>
<head>
  <meta property="og:title" content="Setter Comercial | CuCoders Jobs">
  <script type="application/ld+json">{"@context":"https://schema.org/","@type":"JobPosting","description":"&lt;p&gt;Oferta laboral (Remoto): Setter Comercial&lt;/p&gt;","datePosted":"2026-10-05","validThrough":"2027-01-05","applicantLocationRequirements":{"@type":"Country","name":"CUBA"},"jobLocationType":"TELECOMMUTE","hiringOrganization":"confidential","title":"Oferta laboral (Remoto): Setter Comercial"}</script>
</head>
<body>
  <h1> Oferta laboral (Remoto): Setter Comercial </h1>
  <div class="prose whitespace-pre-wrap">Fallback visible description</div>
  <div class="flex categories">
    <a href="/empleos/tiempo-completo"><spam>Tiempo Completo</spam></a>
    <a href="/empleos/remoto"><spam>Remoto</spam></a>
    <a href="/empleos/marketing" class="text-gray-500">#Marketing</a>
  </div>
  <img src="/assets/img/icons/money4.svg"><p class="ml-1"> 300 - 900 usd </p>
  <div id="applyDropdown">
    <ul>
      <li><a href="https://t.me/rocio_sl ">Contactar en Telegram</a></li>
      <li><a href="tel:55391643">Tel: 55391643</a></li>
    </ul>
  </div>
</body>
</html>
`

describe("CuCoders parsing", () => {
  test("normalizes job paths and rejects listing filters", () => {
    expect(
      normalizeJobPath(
        "https://cucoders.dev/empleos/2026-10-05/Oferta-laboral-Remoto-Setter-Comercial-en-La-Subasta-Cubana/",
      ),
    ).toBe(
      "/empleos/2026-10-05/Oferta-laboral-Remoto-Setter-Comercial-en-La-Subasta-Cubana/",
    )
    expect(normalizeJobPath("/empleos/2026-11-09/Python-Developer")).toBe(
      "/empleos/2026-11-09/Python-Developer/",
    )
    expect(normalizeJobPath("/empleos/remoto/")).toBeNull()
    expect(normalizeJobPath("not a job")).toBeNull()
  })

  test("builds listing paths for filters and pages", () => {
    expect(listingPath(null, 1)).toBe("/empleos/")
    expect(listingPath(null, 2)).toBe("/empleos/2")
    expect(listingPath("remoto", 1)).toBe("/empleos/remoto/")
    expect(listingPath("remoto", 3)).toBe("/empleos/remoto/3")
  })

  test("parses listing dates from DD/MM/YY and ISO", () => {
    expect(parseListingDate("05/10/26")).toBe("2026-10-05")
    expect(parseListingDate("5/1/2025")).toBe("2025-01-05")
    expect(parseListingDate("2026-11-10")).toBe("2026-11-10")
    expect(parseListingDate("nope")).toBeNull()
  })

  test("filters jobs by age, excluding undated offers", () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(isWithinDays(today, 1)).toBe(true)
    expect(isWithinDays("2000-01-01", 14)).toBe(false)
    expect(isWithinDays(null, 14)).toBe(false)
  })

  test("cleans HTML while preserving readable line breaks", () => {
    expect(cleanHtml("<p>Hola &amp; adi&oacute;s</p><br><p>M&aacute;s</p>")).toBe(
      "Hola & adiós\n\nMás",
    )
  })

  test("parses listing cards into the result contract", () => {
    const jobs = parseJobCards(listingHtml)
    expect(jobs).toHaveLength(2)

    expect(jobs[0]).toMatchObject({
      id: "/empleos/2026-11-10/Necesitamos-un-matketolace-super-senior-experto-en-marketing-/",
      title: "Necesitamos un matketolace, super senior experto en marketing",
      date: "2026-11-10",
      salary: "Por convenir",
      category: "System Administrator",
      employment_type: "Tiempo Completo",
      modality: "remote",
      company: null,
      location: null,
    })
    expect(jobs[0].tags).toEqual(["System Administrator", "Graphic Designer"])
    expect(jobs[0].url).toBe(
      "https://cucoders.dev/empleos/2026-11-10/Necesitamos-un-matketolace-super-senior-experto-en-marketing-/",
    )

    expect(jobs[1]).toMatchObject({
      title: "Python Developer",
      date: "2026-11-09",
      salary: "800 - 1200 usd",
      modality: "onsite",
      employment_type: null,
    })
  })

  test("parses detail metadata from JSON-LD, visible labels and contacts", () => {
    const job = parseJobDetail(
      detailHtml,
      "/empleos/2026-10-05/Oferta-laboral-Remoto-Setter-Comercial-en-La-Subasta-Cubana/",
    )

    expect(job.title).toBe("Oferta laboral (Remoto): Setter Comercial")
    expect(job.company).toBe("confidential")
    expect(job.location).toBe("CUBA")
    expect(job.date).toBe("2026-10-05")
    expect(job.valid_through).toBe("2027-01-05")
    expect(job.modality).toBe("remote")
    expect(job.employment_type).toBe("Tiempo Completo")
    expect(job.salary).toBe("300 - 900 usd")
    expect(job.tags).toEqual(["Marketing"])
    expect(job.description).toBe("Oferta laboral (Remoto): Setter Comercial")
    expect(job.contacts).toEqual([
      { label: "Contactar en Telegram", url: "https://t.me/rocio_sl" },
      { label: "Tel: 55391643", url: "tel:55391643" },
    ])
  })
})
