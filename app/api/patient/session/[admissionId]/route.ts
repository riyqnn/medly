import { NextRequest, NextResponse } from "next/server";
import { getBedsideSession } from "@/src/features/patient/utils/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ admissionId: string }> }
) {
  const { admissionId } = await params;
  const session = await getBedsideSession(admissionId);
  if (!session) {
    return NextResponse.json({ error: "Admission not found or not active" }, { status: 404 });
  }
  return NextResponse.json(session);
}
