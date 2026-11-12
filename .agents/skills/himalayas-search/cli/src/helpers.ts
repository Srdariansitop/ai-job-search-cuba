export interface HimalayasJob {
  title: string
  excerpt?: string
  companyName: string
  companySlug?: string
  companyLogo?: string
  employmentType?: string
  minSalary?: number | null
  maxSalary?: number | null
  salaryPeriod?: string
  seniority?: string[]
  currency?: string | null
  locationRestrictions?: string[]
  timezoneRestrictions?: number[]
  categories?: string[]
  parentCategories?: string[]
  description?: string
  pubDate?: number
  expiryDate?: number
  applicationLink?: string
  guid?: string
}

export function apiBaseUrl(): string {
  return process.env.HIMALAYAS_API_URL || "https://himalayas.app/jobs/api"
}

/**
 * Checks if a Himalayas job posting is 100% remote and compatible with Cuba
 * (i.e., does not require physical presence or residency in a specific restricted country/region
 * outside Cuba, permitting worldwide/global/unrestricted remote work).
 */
export function isCubaCompatibleRemote(job: HimalayasJob): boolean {
  const restrictions = job.locationRestrictions ?? []

  // If no location restrictions are specified, it's worldwide/global remote.
  if (restrictions.length === 0) {
    return true
  }

  // Check if any restriction explicitly indicates worldwide or global remote.
  const isWorldwide = restrictions.some((r) =>
    /worldwide|global|anywhere|remote|latin america|latam|anywhere in the world/i.test(r)
  )

  if (isWorldwide) {
    return true
  }

  // If restrictions list specific countries (e.g. United States, Spain, Philippines, Germany),
  // it excludes Cuba unless worldwide is allowed.
  return false
}
