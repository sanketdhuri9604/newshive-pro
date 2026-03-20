import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
  get(name: string) {
    return request.cookies.get(name)?.value
  },
  set(name: string, value: string, options: Record<string, unknown>) {
    request.cookies.set({ name, value, ...options } as never)
    response = NextResponse.next({ 
      request: { headers: request.headers } 
    })
    response.cookies.set({ name, value, ...options } as never)
  },
  remove(name: string, options: Record<string, unknown>) {
    request.cookies.set({ name, value: '', ...options } as never)
    response = NextResponse.next({ 
      request: { headers: request.headers } 
    })
    response.cookies.set({ name, value: '', ...options } as never)
  },
},
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedPaths = ['/profile', '/saved', '/history']
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  )

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  const authPaths = ['/login', '/register']
  const isAuthPage = authPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  )

 if (isAuthPage && user) {
  return response  // redirect mat karo, bas jaane do
}

  return response
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/saved/:path*',
    '/history/:path*',
    '/login',
    '/register',
  ],
}