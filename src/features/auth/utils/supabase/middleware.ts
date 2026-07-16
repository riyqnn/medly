import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// Admin client to bypass RLS when reading profiles in the proxy
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname === '/login' || pathname === '/register'
  const isProtectedRoute = pathname.startsWith('/dashboard')

  // Unauthenticated user trying to access protected route
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Fetch role using admin client to bypass RLS
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role?.toLowerCase()

    // Already logged in, redirect away from auth pages
    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = role ? `/dashboard/${role}` : '/unauthorized'
      return NextResponse.redirect(url)
    }

    // On /dashboard root — redirect to role-specific dashboard
    if (pathname === '/dashboard') {
      const url = request.nextUrl.clone()
      url.pathname = role ? `/dashboard/${role}` : '/unauthorized'
      return NextResponse.redirect(url)
    }

    // On a specific dashboard page — enforce RBAC
    if (isProtectedRoute) {
      if (!role) {
        const url = request.nextUrl.clone()
        url.pathname = '/unauthorized'
        return NextResponse.redirect(url)
      }

      const allowedPath = `/dashboard/${role}`
      if (!pathname.startsWith(allowedPath)) {
        const url = request.nextUrl.clone()
        url.pathname = '/forbidden'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

