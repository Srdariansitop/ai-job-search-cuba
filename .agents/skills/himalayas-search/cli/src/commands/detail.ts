import { apiBaseUrl, type HimalayasJob } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const url = apiBaseUrl()
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AIJobSearchCuba/1.0)",
        Accept: "application/json",
      },
    })
  } catch (e) {
    process.stderr.write(
      JSON.stringify({
        error: `Failed to connect to Himalayas API: ${e instanceof Error ? e.message : String(e)}`,
        code: "NETWORK_ERROR",
      }) + "\n",
    )
    return 1
  }

  if (!res.ok) {
    process.stderr.write(
      JSON.stringify({
        error: `Himalayas API returned status ${res.status}`,
        code: "HTTP_ERROR",
      }) + "\n",
    )
    return 1
  }

  let data: { jobs?: HimalayasJob[] }
  try {
    data = await res.json()
  } catch (e) {
    process.stderr.write(
      JSON.stringify({
        error: `Failed to parse Himalayas API response`,
        code: "PARSE_ERROR",
      }) + "\n",
    )
    return 1
  }

  const jobs = data.jobs ?? []
  const targetId = opts.id.toLowerCase()

  const match = jobs.find((j) => {
    const guid = (j.guid ?? "").toLowerCase()
    const appLink = (j.applicationLink ?? "").toLowerCase()
    const slug = (j.companySlug ?? "").toLowerCase()
    return guid.includes(targetId) || appLink.includes(targetId) || slug.includes(targetId) || targetId.includes(slug)
  })

  if (!match) {
    process.stderr.write(
      JSON.stringify({
        error: `Job not found matching ID/slug/URL "${opts.id}"`,
        code: "NOT_FOUND",
      }) + "\n",
    )
    return 1
  }

  const detailObj = {
    title: match.title,
    company: match.companyName,
    location_restrictions: match.locationRestrictions ?? [],
    employment_type: match.employmentType ?? null,
    salary: match.minSalary ? `${match.minSalary} - ${match.maxSalary ?? "?"} ${match.currency ?? "USD"}` : null,
    seniority: match.seniority ?? [],
    categories: match.categories ?? [],
    pub_date: match.pubDate ? new Date(match.pubDate * 1000).toISOString() : null,
    expiry_date: match.expiryDate ? new Date(match.expiryDate * 1000).toISOString() : null,
    application_link: match.applicationLink ?? match.guid,
    description: match.description ?? null,
  }

  if (opts.format === "json") {
    process.stdout.write(JSON.stringify(detailObj, null, 2) + "\n")
  } else {
    process.stdout.write(`Title:    ${detailObj.title}\n`)
    process.stdout.write(`Company:  ${detailObj.company}\n`)
    process.stdout.write(`Location: ${detailObj.location_restrictions.length ? detailObj.location_restrictions.join(", ") : "Worldwide"}\n`)
    process.stdout.write(`Type:     ${detailObj.employment_type ?? "N/A"}\n`)
    process.stdout.write(`Salary:   ${detailObj.salary ?? "N/A"}\n`)
    process.stdout.write(`URL:      ${detailObj.application_link}\n\n`)
    process.stdout.write(`Description:\n${detailObj.description ?? "N/A"}\n`)
  }

  return 0
}
