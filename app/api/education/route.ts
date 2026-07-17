import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";
import { readPage, paged } from "@/src/features/shell/pagination";

async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.user_metadata?.hospital_id) {
    return user.user_metadata.hospital_id;
  }
  return req.headers.get("x-hospital-id");
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  // Education content supports GLOBAL content where hospital_id is null
  const p = readPage(req);

  let query = supabase
    .from("education_contents")
    .select("*, education_categories(name)", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (hospitalId) {
    query = query.or(`hospital_id.eq.${hospitalId},hospital_id.is.null`);
  } else {
    // If somehow unauthorized (e.g. public access), only return global
    query = query.is("hospital_id", null);
  }

  const { data: contents, error, count } = await query.range(p.from, p.to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(paged(contents, count, p));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    if (!body.title || !body.content_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data: content, error } = await supabase
      .from("education_contents")
      .insert({
        hospital_id: hospitalId, // By default bound to the hospital
        category_id: body.category_id || null,
        title: body.title,
        content_type: body.content_type,
        media_url: body.media_url || null,
        body_text: body.body_text || null,
        is_published: body.is_published ?? true,
        created_by: user?.id || null
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(content, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
