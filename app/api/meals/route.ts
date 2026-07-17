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

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const availableOnly = searchParams.get("available") === "true";

  const p = readPage(req);


  let query = supabase
    .from("meal_menus")
    .select("*, meal_categories(name)", { count: "exact" })
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (availableOnly) {
    query = query.eq("is_available", true);
  }

  const { data: meals, error, count } = await query.range(p.from, p.to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(paged(meals, count, p));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    if (!body.name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data: meal, error } = await supabase
      .from("meal_menus")
      .insert({
        hospital_id: hospitalId,
        name: body.name,
        category_id: body.category_id || null,
        description: body.description || null,
        image_url: body.image_url || null,
        price: body.price ?? 0,
        meal_type_tags: body.meal_type_tags || [],
        is_available: body.is_available ?? true,
        created_by: user?.id || null
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(meal, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
