import { setDefaultAutoSelectFamilyAttemptTimeout } from "net";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";
import { getActiveAdmissionContext } from "@/src/features/patient/utils/session";

/**
 * Node races IPv6 and IPv4 (Happy Eyeballs) but only allows each family 250ms
 * to connect. Content hosts like Project Gutenberg publish an AAAA record and
 * sit ~300ms away, so on a network without working IPv6 *both* attempts expire
 * and the fetch dies with ETIMEDOUT — while curl, which waits longer, succeeds.
 * Widening the window lets the IPv4 fallback actually land. It costs nothing
 * when IPv6 works, since the first attempt wins immediately.
 */
setDefaultAutoSelectFamilyAttemptTimeout(1500);

/**
 * Streams a piece of published content through our own origin.
 *
 * It exists for exactly one reason: some hosts refuse to be embedded
 * (`X-Frame-Options`) or read (`no CORS`), which would force the tablet to
 * throw the patient out into a browser tab. Video and audio are deliberately
 * NOT routed here — they play cross-origin without CORS and support Range
 * requests directly, so proxying them would only cost us bandwidth and break
 * seeking.
 *
 * SSRF safety rests on one property: the upstream URL is read from the row in
 * our database, never from the request. A caller can only choose *which
 * published row*, not which host.
 */

const TABLES: Record<string, string> = {
  education: "education_contents",
  entertainment: "entertainment_contents",
  spiritual: "spiritual_contents",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> }
) {
  const { kind, id } = await params;
  const table = TABLES[kind];
  if (!table) return new NextResponse("Not found", { status: 404 });

  // The tablet has no login; the active admission is what authorises it.
  const ctx = await getActiveAdmissionContext(req.nextUrl.searchParams.get("admission_id"));
  if (!ctx) return new NextResponse("Admission not found or not active", { status: 404 });

  const { data: row } = await supabaseAdmin
    .from(table)
    .select("media_url, hospital_id, is_published")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  // Global rows (hospital_id null) are shared; hospital rows belong to one.
  const visible =
    row?.is_published && (row.hospital_id === null || row.hospital_id === ctx.hospitalId);
  if (!row || !visible || !row.media_url) {
    return new NextResponse("Not found", { status: 404 });
  }

  let upstream: URL;
  try {
    upstream = new URL(row.media_url);
  } catch {
    return new NextResponse("Bad media URL", { status: 502 });
  }
  if (upstream.protocol !== "https:" && upstream.protocol !== "http:") {
    return new NextResponse("Bad media URL", { status: 502 });
  }

  // Pass Range through so a big PDF still loads progressively.
  const range = req.headers.get("range");
  const res = await fetch(upstream, {
    headers: range ? { Range: range } : {},
    redirect: "follow",
  });

  if (!res.ok && res.status !== 206) {
    return new NextResponse("Upstream error", { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", res.headers.get("content-type") ?? "application/octet-stream");
  for (const h of ["content-length", "content-range", "accept-ranges", "last-modified", "etag"]) {
    const v = res.headers.get(h);
    if (v) headers.set(h, v);
  }
  // Same-origin framing is the whole point — never inherit the upstream's
  // refusal to be embedded.
  headers.set("Content-Security-Policy", "frame-ancestors 'self'");
  headers.set("Cache-Control", "private, max-age=3600");

  return new NextResponse(res.body, { status: res.status, headers });
}
