import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Force clear ALL cookies from browser
  const response = NextResponse.redirect(new URL("/login", req.url));

  // Delete every single cookie on the domain
  req.cookies.getAll().forEach((cookie) => {
    response.cookies.delete(cookie.name);
  });

  return response;
}
