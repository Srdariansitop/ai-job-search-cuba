export const DEFAULT_API_URL = "https://buscopincha.com"
export const REQUEST_TIMEOUT_MS = 15_000
export const MAX_LIST_PAGES = 10
export const PAGE_SIZE = 100

const USER_AGENT = "buscopincha-search-skill/1.0 (+https://buscopincha.com)"

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
  return (process.env.BUSCOPINCHA_API_URL || DEFAULT_API_URL).replace(/\/+$/, "")
}

export function normalizeSlug(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const fromUrl = trimmed.match(/\/jobs\/([a-z0-9][a-z0-9_-]*)\/?$/i)
  if (fromUrl?.[1]) return fromUrl[1].toLowerCase()
  const bare = trimmed.match(/^[a-z0-9][a-z0-9_-]*$/i)
  return bare ? trimmed.toLowerCase() : null
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
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
}

export function cleanText(value: string | null | undefined): string {
  if (!value) return ""
  return stripHtml(decodeEntities(String(value)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10)
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

export interface Category {
  id: number
  name: string
  is_archived?: boolean
}

export interface JobOfferCard {
  id?: string
  slug: string
  title: string
  description?: string | null
  freelance_name?: string | null
  location?: string | null
  main_category?: number | Category | null
  secondary_category?: number | Category | null
  price?: number | string | null
  price_type?: string | null
  modality?: string | null
  contract_type?: string | null
  is_filled?: boolean
  is_premium?: boolean
  created_at?: string | null
  published_at?: string | null
  date?: string | null
}

export interface PricingDetails {
  amount?: string | number | null
  amount_usd?: number | null
  amount_eur?: number | null
}

export interface JobOfferDetail extends JobOfferCard {
  freelancer?: { id?: string; name?: string | null; is_verified?: boolean } | null
  city?: { id?: number; name?: string; code?: string } | null
  municipality?: { id?: number; name?: string; code?: string } | null
  pricing_details?: PricingDetails | null
  phones?: Array<{ id?: number; phone_number?: string }> | null
  social_links?: Array<Record<string, unknown>> | null
  likes_count?: number | null
  is_active?: boolean
  is_approved?: boolean
  is_paid?: boolean
  paid_until?: string | null
}

export interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  description: string
  modality: string | null
  contract_type: string | null
  price: number | null
  price_type: string | null
  category: string | null
  secondary_category: string | null
  is_filled: boolean
  is_premium: boolean
}

export interface JobDetailResult extends JobResult {
  price_usd: number | null
  price_eur: number | null
  phones: string[]
  social_links: Array<Record<string, unknown>>
  is_active: boolean | null
  is_verified: boolean | null
  paid_until: string | null
}

export interface JobOfferPage {
  count: number
  next: string | null
  previous: string | null
  results: JobOfferCard[]
}

function categoryName(value: number | Category | null | undefined): string | null {
  return typeof value === "object" && value ? value.name : null
}

function priceNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export function locationLabel(job: JobOfferCard | JobOfferDetail): string | null {
  if (job.location) return cleanText(job.location) || null
  const detail = job as JobOfferDetail
  const parts = [detail.city?.name, detail.municipality?.name].filter(
    (part): part is string => Boolean(part?.trim()),
  )
  return parts.length ? parts.join(", ") : null
}

export function toResult(job: JobOfferCard): JobResult {
  const detail = job as JobOfferDetail
  return {
    id: job.slug,
    title: cleanText(job.title),
    company: cleanText(job.freelance_name || detail.freelancer?.name) || null,
    location: locationLabel(job),
    date: normalizeDate(job.created_at ?? job.published_at ?? job.date),
    url: `${baseUrl()}/jobs/${encodeURIComponent(job.slug)}/`,
    description: cleanText(job.description),
    modality: job.modality ?? null,
    contract_type: job.contract_type ?? null,
    price: priceNumber(job.price),
    price_type: job.price_type ?? null,
    category: categoryName(job.main_category),
    secondary_category: categoryName(job.secondary_category),
    is_filled: Boolean(job.is_filled),
    is_premium: Boolean(job.is_premium),
  }
}

export function toDetail(job: JobOfferDetail): JobDetailResult {
  const base = toResult(job)
  const pricing = job.pricing_details
  return {
    ...base,
    price: priceNumber(pricing?.amount) ?? base.price,
    price_usd: priceNumber(pricing?.amount_usd),
    price_eur: priceNumber(pricing?.amount_eur),
    phones: (job.phones ?? []).map((phone) => cleanText(phone.phone_number)).filter(Boolean),
    social_links: job.social_links ?? [],
    is_active: typeof job.is_active === "boolean" ? job.is_active : null,
    is_verified:
      typeof job.freelancer?.is_verified === "boolean" ? job.freelancer.is_verified : null,
    paid_until: normalizeDate(job.paid_until),
  }
}

export function priceLabel(job: Pick<JobResult, "price" | "price_type">): string {
  if (job.price === null) return "—"
  return `${job.price}${job.price_type ? ` (${job.price_type})` : ""}`
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

export async function apiGet<T>(path: string): Promise<T | null> {
  const url = new URL(path, `${baseUrl()}/`).toString()
  let lastFailure = ""

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": USER_AGENT },
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
        throw new CliError(`BuscoPincha API returned HTTP ${response.status}`, "HTTP_ERROR")
      }

      try {
        return (await response.json()) as T
      } catch {
        throw new CliError("BuscoPincha API returned invalid JSON", "INVALID_RESPONSE")
      }
    } catch (error) {
      if (error instanceof CliError) throw error
      if (isTimeout(error)) {
        throw new CliError(`Request to BuscoPincha timed out after ${REQUEST_TIMEOUT_MS / 1000}s`, "REQUEST_TIMEOUT")
      }
      throw new CliError(
        `Could not reach BuscoPincha at ${baseUrl()}: ${error instanceof Error ? error.message : String(error)}`,
        "NETWORK_ERROR",
      )
    }
  }

  throw new CliError(`BuscoPincha API failed after retries (${lastFailure})`, "HTTP_ERROR")
}
