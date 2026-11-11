import {
  htmlFetch,
  normalizeJobPath,
  parseJobDetail,
  writeError,
  type JobDetailResult,
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
  field("Valid through", job.valid_through)
  field("Category", job.category)
  field("Employment", job.employment_type)
  field("Modality", job.modality)
  field("Salary", job.salary)
  field("Tags", job.tags.length ? job.tags.join(", ") : null)
  if (job.contacts.length) {
    lines.push("Contacts:")
    for (const contact of job.contacts) lines.push(`  - ${contact.label}: ${contact.url}`)
  }

  lines.push("", job.description || "(no description)", "", `URL: ${job.url}`, `id: ${job.id}`)
  return lines.join("\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const path = normalizeJobPath(opts.id)
  if (!path) {
    writeError(`could not parse a CuCoders job path from "${opts.id}"`, "BAD_ID")
    return 1
  }

  try {
    const html = await htmlFetch(path)
    if (html === null) {
      writeError("job not found", "NOT_FOUND")
      return 1
    }
    const job = parseJobDetail(html, path)

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
