import { describe, expect, it } from "vitest";
import { Job } from "bullmq";
import { commentJobId } from "@/lib/queue/job-ids";

describe("DM job identifiers", () => {
  it("passes the installed BullMQ validator for retries and provider IDs containing separators", () => {
    const jobId = commentJobId("ig:123", "mid:a:b", 1);
    const validate = (Job.prototype as unknown as { validateOptions(data: unknown): void }).validateOptions;
    expect(() => validate.call({ opts: { jobId } }, {})).not.toThrow();
    expect(() => validate.call({ opts: { jobId: "comment:ig:comment:retry:1" } }, {})).toThrow("Custom Id cannot contain");
  });
  it("deduplicates the same tuple but keeps different comments and retries separate", () => {
    expect(commentJobId("a", "b")).toBe(commentJobId("a", "b"));
    expect(commentJobId("a:b", "c")).not.toBe(commentJobId("a", "b:c"));
    expect(commentJobId("a", "b", 1)).not.toBe(commentJobId("a", "b", 2));
  });
});
