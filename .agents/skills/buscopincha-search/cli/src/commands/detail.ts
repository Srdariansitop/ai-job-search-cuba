import {
  apiGet,
  normalizeSlug,
  priceLabel,
  toDetail,
  writeError,
  type JobDetailResult,
  type JobOfferDetail,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

function renderPlain(job: JobDetailResult): string {
  const lines = [job.title, `${job.company ?? "—"} · ${job.location ?? "—"}`]
  const field = (label: string, value: string | null | undefined) => {
    if (value) lines.push(`${label}: ${value}`)
  }

  field("Posted", job.date)
  field("Category", job.category)
  field("Secondary category", job.secondary_category)
  field("Modality", job.modality)
  field("Contract", job.contract_type)
  field("Price", priceLabel(job))
  if (job.price_usd !== null || job.price_eur !== null) {
    const equivalents = [
      job.price_usd !== null ? `${job.price_usd} USD` : null,
      job.price_eur !== null ? `${job.price_eur} EUR` : null,
    ].filter(Boolean)
    field("Approx.", equivalents.join(" / "))
  }
  field("Phones", job.phones.length ? job.phones.join(", ") : null)
  field("Verified freelancer", job.is_verified === null ? null : job.is_verified ? "yes" : "no")
  field("Active", job.is_active === null ? null : job.is_active ? "yes" : "no")

  lines.push("", job.description || "(no description)", "", `URL: ${job.url}`, `slug: ${job.id}`)
  return lines.join("\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const slug = normalizeSlug(opts.id)
  if (!slug) {
    writeError(`could not parse a BuscoPincha job slug from "${opts.id}"`, "BAD_ID")
    return 1
  }

  try {
    const response = await apiGet<JobOfferDetail>(`/api/job-offer/public/${encodeURIComponent(slug)}/`)
    if (!response) {
      writeError("job not found", "NOT_FOUND")
      return 1
    }
    const job = toDetail(response)

    if (opts.format === "plain") {
      process.stdout.write(renderPlain(job) + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error), "DETAIL_FAILED")
    return 1
  }
}
