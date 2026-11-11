export const DEFAULT_BASE_URL = "https://cucoders.dev"
export const REQUEST_TIMEOUT_MS = 15_000
export const MAX_SCAN_PAGES = 31

const USER_AGENT =
  "cubadevjobs-search-skill/1.0 (+https://cucoders.dev/empleos/; Cuban Dev Jobs search)"

export class CliError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = "CliError"
  }
}

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

export function baseUrl(): string {
  return (process.env.CUCODER_JOBS_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "")
}

export function absoluteUrl(path: string): string {
  return `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`
}

export function normalizeFilter(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim().toLowerCase()
  return /^[a-z0-9][a-z0-9-]*$/.test(trimmed) ? trimmed : null
}

export function normalizeJobPath(input: string): string | null {
  let path = input.trim()
  if (!path) return null
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname
    } catch {
      return null
    }
  }
  if (!path.startsWith("/")) path = `/${path}`
  const match = path.match(/^\/empleos\/(\d{4}-\d{2}-\d{2})\/([^/?#]+)\/?$/)
  return match ? `/empleos/${match[1]}/${match[2]}/` : null
}

export function listingPath(filter: string | null, page: number): string {
  const base = filter ? `/empleos/${filter}` : "/empleos"
  return page <= 1 ? `${base}/` : `${base}/${page}`
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  ntilde: "ñ",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  Ntilde: "Ñ",
  laquo: "«",
  raquo: "»",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  iexcl: "¡",
  iquest: "¿",
}

export function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return NAMED_ENTITIES[entity] ?? NAMED_ENTITIES[entity.toLowerCase()] ?? match
  })
}

export function stripHtml(value: string): string {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
}

export function cleanHtml(value: string | null | undefined): string {
  if (!value) return ""
  return stripHtml(decodeEntities(String(value)))
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function parseListingDate(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const short = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/)
  if (!short) return null
  const day = short[1].padStart(2, "0")
  const month = short[2].padStart(2, "0")
  const year = short[3].length === 2 ? `20${short[3]}` : short[3]
  return `${year}-${month}-${day}`
}

export function isWithinDays(date: string | null, days: number): boolean {
  if (!date) return false
  if (!Number.isFinite(days) || days <= 0 || days >= 9999) return true
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return false
  const cutoff = new Date()
  cutoff.setUTCHours(0, 0, 0, 0)
  cutoff.setUTCDate(cutoff.getUTCDate() - days)
  return parsed >= cutoff
}

export interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  description: string
  salary: string | null
  tags: string[]
  category: string | null
  employment_type: string | null
  modality: string | null
}

export interface JobContact {
  label: string
  url: string
}

export interface JobDetailResult extends JobResult {
  valid_through: string | null
  contacts: JobContact[]
}

interface ParsedAnchor {
  href: string
  className: string
  text: string
}

function parseAttributes(raw: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  const regex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(raw))) {
    attributes[match[1].toLowerCase()] = match[2]
  }
  return attributes
}

function parseAnchors(html: string): ParsedAnchor[] {
  const anchors: ParsedAnchor[] = []
  const regex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html))) {
    const attributes = parseAttributes(match[1])
    anchors.push({
      href: decodeEntities(attributes.href ?? "").trim(),
      className: attributes.class ?? "",
      text: cleanHtml(match[2]),
    })
  }
  return anchors
}

function firstMatch(html: string, regex: RegExp): string | null {
  const match = html.match(regex)
  return match?.[1] ? cleanHtml(match[1]) : null
}

const DETAIL_PATH = /^\/empleos\/\d{4}-\d{2}-\d{2}\/[^/?#]+/

function detailAnchor(anchor: ParsedAnchor): boolean {
  return DETAIL_PATH.test(anchor.href)
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function classifyLabels(labels: string[]): {
  modality: string | null
  employmentType: string | null
} {
  let modality: string | null = null
  const employment: string[] = []
  for (const label of unique(labels)) {
    const normalized = label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
    if (/remoto|remote|teletrabajo/.test(normalized)) {
      modality ??= "remote"
    } else if (/presencial|onsite/.test(normalized)) {
      modality ??= "onsite"
    } else if (/hibrido|hybrid/.test(normalized)) {
      modality ??= "hybrid"
    } else {
      employment.push(label)
    }
  }
  return { modality, employmentType: employment.length ? employment.join(", ") : null }
}

export function parseJobCards(html: string): JobResult[] {
  const chunks = html.split(/(?=<div class="inline-grid items-center w-full p-4\b)/i).slice(1)
  const jobs: JobResult[] = []

  for (const chunk of chunks) {
    const anchors = parseAnchors(chunk)
    const jobAnchors = anchors.filter(detailAnchor)
    const titleAnchor =
      jobAnchors.find((anchor) => /font-semibold/.test(anchor.className)) ?? jobAnchors[0]
    if (!titleAnchor) continue

    const path = normalizeJobPath(titleAnchor.href)
    if (!path) continue
    const title = titleAnchor.text
    if (!title) continue

    const descriptionAnchor = jobAnchors.find((anchor) => /my-2/.test(anchor.className))
    const labels = anchors
      .filter((anchor) => !detailAnchor(anchor) && anchor.href.startsWith("/empleos/") && !anchor.text.startsWith("#"))
      .map((anchor) => anchor.text)
    const tags = unique(
      anchors
        .filter((anchor) => !detailAnchor(anchor) && anchor.text.startsWith("#"))
        .map((anchor) => anchor.text.replace(/^#+/, "")),
    )
    const classified = classifyLabels(labels)

    jobs.push({
      id: path,
      title,
      company: null,
      location: null,
      date: parseListingDate(
        firstMatch(chunk, /event-date\.svg[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i),
      ),
      url: absoluteUrl(path),
      description: descriptionAnchor?.text ?? "",
      salary: firstMatch(chunk, /money4\.svg[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i),
      tags,
      category: tags[0] ?? null,
      employment_type: classified.employmentType,
      modality: classified.modality,
    })
  }

  return jobs
}

interface JobPostingLd {
  "@type"?: string | string[]
  title?: string
  description?: string
  datePosted?: string
  validThrough?: string
  employmentType?: string | string[]
  jobLocationType?: string
  hiringOrganization?: string | { name?: string }
  applicantLocationRequirements?: { name?: string } | Array<{ name?: string }>
  jobLocation?: {
    address?: {
      addressLocality?: string
      addressRegion?: string
      addressCountry?: string | { name?: string }
    }
  }
  baseSalary?: {
    value?:
      | number
      | string
      | { minValue?: number; maxValue?: number; value?: number; unitText?: string }
    currency?: string
  }
}

function isJobPosting(value: unknown): value is JobPostingLd {
  if (!value || typeof value !== "object") return false
  const type = (value as JobPostingLd)["@type"]
  return type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))
}

function extractJobPosting(html: string): JobPostingLd | null {
  const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html))) {
    try {
      const parsed = JSON.parse(match[1].trim()) as unknown
      if (isJobPosting(parsed)) return parsed
      if (parsed && typeof parsed === "object" && "@graph" in parsed) {
        const graph = (parsed as { "@graph"?: unknown[] })["@graph"]
        const found = graph?.find(isJobPosting)
        if (found) return found
      }
    } catch {
      // Ignore malformed JSON-LD blocks; the visible HTML is the fallback.
    }
  }
  return null
}

function stripSiteSuffix(title: string): string {
  return title.replace(/\s*\|\s*CuCoders Jobs\s*$/i, "").trim()
}

function locationFromJsonLd(job: JobPostingLd): string | null {
  const requirements = job.applicantLocationRequirements
  const required = Array.isArray(requirements) ? requirements[0]?.name : requirements?.name
  if (required) return cleanHtml(required) || null
  const address = job.jobLocation?.address
  if (!address) return null
  const country =
    typeof address.addressCountry === "string" ? address.addressCountry : address.addressCountry?.name
  const parts = [address.addressLocality, address.addressRegion, country].filter(
    (part): part is string => Boolean(part?.trim()),
  )
  return parts.length ? cleanHtml(parts.join(", ")) : null
}

function salaryFromJsonLd(job: JobPostingLd): string | null {
  const salary = job.baseSalary
  if (!salary) return null
  const currency = salary.currency ? ` ${salary.currency}` : ""
  const value = salary.value
  if (typeof value === "number" || typeof value === "string") return `${value}${currency}`.trim()
  if (!value || typeof value !== "object") return null
  if (value.minValue != null && value.maxValue != null) {
    return `${value.minValue} - ${value.maxValue}${currency}`.trim()
  }
  if (value.value != null) return `${value.value}${currency}`.trim()
  return null
}

function visibleSalary(html: string): string | null {
  return firstMatch(html, /money4\.svg[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i)
}

function parseContacts(html: string): JobContact[] {
  const block = html.match(/<div\s+id="applyDropdown"[\s\S]*?<\/div>/i)?.[0]
  if (!block) return []
  return parseAnchors(block)
    .filter((anchor) => anchor.href && anchor.text)
    .map((anchor) => ({ label: anchor.text, url: anchor.href }))
}

function visibleTitle(html: string): string | null {
  return firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)
}

function ogTitle(html: string): string | null {
  const match =
    html.match(/<meta[^>]+(?:property|name)="og:title"[^>]+content="([^"]*)"/i) ??
    html.match(/<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="og:title"/i)
  return match?.[1] ? stripSiteSuffix(cleanHtml(match[1])) : null
}

function visibleDescription(html: string): string | null {
  return firstMatch(
    html,
    /<div[^>]+class="[^"]*prose[^"]*whitespace-pre-wrap[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  )
}

export function parseJobDetail(html: string, inputPath: string): JobDetailResult {
  const path = normalizeJobPath(inputPath)
  if (!path) throw new CliError(`could not parse a CuCoders job path from "${inputPath}"`, "BAD_ID")

  const jsonLd = extractJobPosting(html)
  const title = visibleTitle(html) ?? ogTitle(html) ?? cleanHtml(jsonLd?.title) ?? ""
  if (!title) {
    throw new CliError("could not find the job title in the CuCoders page", "PARSE_ERROR")
  }

  const description =
    cleanHtml(jsonLd?.description) ||
    visibleDescription(html) ||
    firstMatch(html, /<meta[^>]+(?:property|name)="og:description"[^>]+content="([^"]*)"/i) ||
    ""

  const labels = unique(
    parseAnchors(html)
      .filter(
        (anchor) =>
          anchor.href.startsWith("/empleos/") &&
          !detailAnchor(anchor) &&
          !anchor.text.startsWith("#"),
      )
      .map((anchor) => anchor.text),
  )
  const classified = classifyLabels(labels)
  const tags = unique(
    parseAnchors(html)
      .filter((anchor) => anchor.text.startsWith("#"))
      .map((anchor) => anchor.text.replace(/^#+/, "")),
  )
  const organization = jsonLd?.hiringOrganization
  const company =
    typeof organization === "string" ? cleanHtml(organization) || null : cleanHtml(organization?.name) || null
  const employmentType = Array.isArray(jsonLd?.employmentType)
    ? jsonLd.employmentType.join(", ")
    : jsonLd?.employmentType
  const modality =
    jsonLd?.jobLocationType?.toUpperCase() === "TELECOMMUTE" ? "remote" : classified.modality

  return {
    id: path,
    title,
    company,
    location: jsonLd ? locationFromJsonLd(jsonLd) : null,
    date: parseListingDate(jsonLd?.datePosted),
    url: absoluteUrl(path),
    description,
    salary: visibleSalary(html) ?? (jsonLd ? salaryFromJsonLd(jsonLd) : null),
    tags,
    category: tags[0] ?? null,
    employment_type: cleanHtml(employmentType) || classified.employmentType,
    modality,
    valid_through: parseListingDate(jsonLd?.validThrough),
    contacts: parseContacts(html),
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError" || /timed out|timeout/i.test(error.message))
  )
}

export function politeDelayMs(): number {
  const raw = process.env.CUCODER_REQUEST_DELAY_MS
  if (raw === undefined) return 350
  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) && value >= 0 ? value : 350
}

export async function politePause(): Promise<void> {
  const delay = politeDelayMs()
  if (delay > 0) await sleep(delay)
}

export async function htmlFetch(path: string): Promise<string | null> {
  const url = new URL(path, `${baseUrl()}/`).toString()
  let lastFailure = ""

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "es-CU,es;q=0.9,en;q=0.8",
          "User-Agent": USER_AGENT,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })

      if (response.status === 404) return null
      if (response.status === 429 || response.status >= 500) {
        lastFailure = `HTTP ${response.status}`
        if (attempt < 2) {
          await sleep(250 * 2 ** attempt)
          continue
        }
        break
      }
      if (!response.ok) {
        throw new CliError(`CuCoders returned HTTP ${response.status} for ${path}`, "HTTP_ERROR")
      }
      return await response.text()
    } catch (error) {
      if (error instanceof CliError) throw error
      if (isTimeout(error)) {
        throw new CliError(`Request to CuCoders timed out after ${REQUEST_TIMEOUT_MS / 1000}s`, "REQUEST_TIMEOUT")
      }
      throw new CliError(
        `Could not reach CuCoders at ${baseUrl()}: ${error instanceof Error ? error.message : String(error)}`,
        "NETWORK_ERROR",
      )
    }
  }

  throw new CliError(`CuCoders failed after retries (${lastFailure})`, "HTTP_ERROR")
}
