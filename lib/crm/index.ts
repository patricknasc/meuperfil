export * from "./types";

/**
 * Placeholder / Service interface for future CRM capabilities.
 * Allows other modules (Bio link clicks, DM automation worker) to hook into lead capture.
 */
export async function captureLeadFromInteraction(
  input: import("./types").CaptureLeadInput
): Promise<{ success: boolean; contactId?: string }> {
  // Stub for v1 - ready to be connected to CRM database model in future release
  return { success: true, contactId: `stub_${Date.now()}` };
}
