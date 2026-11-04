import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let res = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return res

  const p = request.nextUrl.pathname
  const open =
    p.startsWith('/login') || p.startsWith('/auth') || p.startsWith('/api/cron')

  let user = null
  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          res = NextResponse.next({ request })
          list.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    })
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    console.error('Middleware Supabase error:', e)
  }

  if (!user && !open) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return res
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}
