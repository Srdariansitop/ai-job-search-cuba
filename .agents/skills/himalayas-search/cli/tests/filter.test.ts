import { describe, test, expect } from "bun:test"
import { isCubaCompatibleRemote, type HimalayasJob } from "../src/helpers"

function sampleJob(locationRestrictions: string[]): HimalayasJob {
  return {
    title: "Software Engineer",
    companyName: "Acme Corp",
    locationRestrictions,
  }
}

describe("isCubaCompatibleRemote — strict Cuba & remote filtering", () => {
  test("allows jobs with empty location restrictions (worldwide/unrestricted)", () => {
    expect(isCubaCompatibleRemote(sampleJob([]))).toBe(true)
  })

  test("allows jobs with Worldwide or Global restriction", () => {
    expect(isCubaCompatibleRemote(sampleJob(["Worldwide"]))).toBe(true)
    expect(isCubaCompatibleRemote(sampleJob(["Global"]))).toBe(true)
    expect(isCubaCompatibleRemote(sampleJob(["Anywhere"]))).toBe(true)
    expect(isCubaCompatibleRemote(sampleJob(["Latin America"]))).toBe(true)
  })

  test("rejects jobs restricted to specific countries (e.g. United States, Spain, Philippines)", () => {
    expect(isCubaCompatibleRemote(sampleJob(["United States"]))).toBe(false)
    expect(isCubaCompatibleRemote(sampleJob(["Spain"]))).toBe(false)
    expect(isCubaCompatibleRemote(sampleJob(["Philippines"]))).toBe(false)
    expect(isCubaCompatibleRemote(sampleJob(["United States", "Canada"]))).toBe(false)
  })
})
