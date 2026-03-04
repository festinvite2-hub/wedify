import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Intercepteaza recovery code pe pagina principala (PKCE)
  if (pathname === '/' && searchParams.has('code')) {
    const code = searchParams.get('code')
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    if (code) {
      url.searchParams.set('code', code)
    }
    if (searchParams.has('type')) {
      const type = searchParams.get('type')
      if (type) url.searchParams.set('type', type)
    }
    return NextResponse.redirect(url)
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Only refresh the session - the React SPA handles login/logout UI internally
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
