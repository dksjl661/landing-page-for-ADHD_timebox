import { NextResponse } from "next/server";

const DEFAULT_PUBLIC_DOWNLOAD_URL =
  "https://github.com/dksjl661/landing-page-for-ADHD_timebox/releases/download/v0.3.0/ADHD-Timebox-v.3.0-arm64.dmg";

export const dynamic = "force-dynamic";

export async function GET() {
  const location =
    process.env.ADHD_TIMEBOX_PUBLIC_DOWNLOAD_URL || DEFAULT_PUBLIC_DOWNLOAD_URL;

  return NextResponse.redirect(location, 302);
}
