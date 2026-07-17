import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// Admin client to bypass RLS when reading profiles in middleware
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Routes that bypass ALL session checks — always accessible
  const isPublicRoute =
    pathname === '/login' ||
    pathname === '/unauthorized' ||
    pathname === '/forbidden' ||
    pathname.startsWith('/api/auth/') ||
    // Patient bedside screen (/patient/[admissionId]) has no personal login — the
    // tablet is bound to a bed, not a user. Its API namespace stays open here and
    // does its own admission_id validation server-side (see src/features/patient).
    pathname.startsWith('/api/patient/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')

  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') && !pathname.startsWith('/api/patient/'))

  // ── No session ──────────────────────────────────────────────
  if (!user) {
    if (isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // ── Has session — resolve role ──────────────────────────────
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Fallback: JWT user_metadata (set during register/createStaff)
  const rawRole = profile?.role ?? user.user_metadata?.role
  const role = rawRole?.toLowerCase()

  // ── Stale session: valid JWT but NO role found anywhere ─────
  // Force sign-out and clear all cookies so user can log in fresh
  if (!role) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const response = NextResponse.redirect(url)
    request.cookies.getAll().forEach((cookie) => {
      response.cookies.delete(cookie.name)
    })
    return response
  }

  // ── Logged-in user on a login page → redirect to dashboard
  if (pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = `/dashboard/${role}`
    return NextResponse.redirect(url)
  }

  // ── Dashboard RBAC ──────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (pathname === '/dashboard') {
      const url = request.nextUrl.clone()
      url.pathname = `/dashboard/${role}`
      return NextResponse.redirect(url)
    }

    const allowedPath = `/dashboard/${role}`
    if (!pathname.startsWith(allowedPath)) {
      const url = request.nextUrl.clone()
      url.pathname = '/forbidden'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
