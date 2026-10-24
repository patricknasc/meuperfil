import { NextRequest, NextResponse } from "next/server";
import { saveBetaWaitlistEntry } from "@/lib/beta/storage";
import { sendBetaWelcomeEmail } from "@/lib/beta/email";
import { betaWaitlistSchema, normalizeBetaWaitlistEntry } from "@/lib/beta/waitlist";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = betaWaitlistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Provide a valid name and work email." },
        { status: 400 }
      );
    }

    const entry = normalizeBetaWaitlistEntry(parsed.data);
    const stored = await saveBetaWaitlistEntry(entry);
    if (stored.isNew) {
      try {
        await sendBetaWelcomeEmail({ name: entry.name, email: entry.email, company: entry.company, goal: entry.goal });
      } catch (error) {
        console.error("Waitlist saved but welcome email failed", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "You are on the beta waitlist.",
      entry,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
    }
    console.error("Waitlist persistence failed", error);
    return NextResponse.json({ success: false, error: "Registration unavailable. Please try again shortly." }, { status: 503 });
  }
}
