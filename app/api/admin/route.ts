import { NextRequest, NextResponse } from "next/server"

// Dummy in-memory store for admins
let admins: any[] = []
let idCounter = 1

function getHospitalId(req: NextRequest) {
  return req.headers.get("x-hospital-id") || "1"
}

// GET: List all admins (per hospital)
export async function GET(req: NextRequest) {
  const hospitalId = getHospitalId(req)
  const filtered = admins.filter(
    (a) => a.hospital_id === hospitalId && !a.deleted_at
  )
  return NextResponse.json(filtered)
}

// POST: Create new admin
export async function POST(req: NextRequest) {
  const hospitalId = getHospitalId(req)
  const body = await req.json()
  if (!body.username || !body.password_hash) {
    return NextResponse.json({ error: "Missing username or password_hash" }, { status: 422 })
  }
  // Username must be unique per hospital
  if (admins.some(a => a.hospital_id === hospitalId && a.username === body.username && !a.deleted_at)) {
    return NextResponse.json({ error: "Duplicate username for this hospital" }, { status: 422 })
  }
  const now = new Date().toISOString()
  const admin = {
    id: idCounter++,
    hospital_id: hospitalId,
    username: body.username,
    password_hash: body.password_hash,
    email: body.email || "",
    role: body.role || "admin",
    status: body.status || "active",
    created_at: now,
    updated_at: now,
    created_by: body.created_by || "superadmin",
    deleted_at: null
  }
  admins.push(admin)
  return NextResponse.json(admin)
}

// PATCH: Update admin (by ?id=)
export async function PATCH(req: NextRequest) {
  const hospitalId = getHospitalId(req)
  const { searchParams } = req.nextUrl
  const id = Number(searchParams.get("id"))
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const idx = admins.findIndex(a => a.id === id && a.hospital_id === hospitalId && !a.deleted_at)
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const body = await req.json()
  admins[idx] = { ...admins[idx], ...body, updated_at: new Date().toISOString() }
  return NextResponse.json(admins[idx])
}

// DELETE: Soft delete admin (by ?id=)
export async function DELETE(req: NextRequest) {
  const hospitalId = getHospitalId(req)
  const { searchParams } = req.nextUrl
  const id = Number(searchParams.get("id"))
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const idx = admins.findIndex(a => a.id === id && a.hospital_id === hospitalId && !a.deleted_at)
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

  admins[idx].deleted_at = new Date().toISOString()
  return NextResponse.json({ deleted: true })
}
