import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const publicPaths = new Set(['/login', '/api/auth/logout', '/api/health', '/favicon.ico'])
const authOptionalPaths = new Set(['/api/agent/status'])

async function getSessionResponse(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return { response, user: null }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data } = await supabase.auth.getUser()
  return { response, user: data.user ?? null }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isPublicPath = publicPaths.has(pathname) || pathname.startsWith('/_next/')

  if (isPublicPath) return NextResponse.next()

  // UI_PREVIEW_BYPASS: skip auth in local demo mode
  if (process.env.METEORTEST_LOCAL_DEMO === '1') return NextResponse.next()

  const { response, user } = await getSessionResponse(request)
  if (authOptionalPaths.has(pathname)) return response
  if (user) return response

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.search = ''
  loginUrl.searchParams.set('next', `${pathname}${search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!.*\\..*).*)', '/api/:path*', '/favicon.ico'],
}
