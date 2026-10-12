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
    await saveBetaWaitlistEntry(entry);
    await sendBetaWelcomeEmail({
      name: entry.name,
      email: entry.email,
      company: entry.company,
      goal: entry.goal,
    });

    return NextResponse.json({
      success: true,
      message: "You are on the beta waitlist.",
      entry,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }
}
