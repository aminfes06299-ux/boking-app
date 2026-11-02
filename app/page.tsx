import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Page() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // تجاهل التغييرات إن كانت من Server Component
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // إذا لم يكن هناك مستخدم مسجل، التوجيه لصفحة اللوجين فوراً
  if (!user) {
    redirect('/login')
  }

  // إذا كان مسجلاً، اطلب البيانات من قاعدة البيانات
  const { data: me } = await supabase
    .from('profiles')
    .select('full_name, email, active, role')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <main className="p-8 dir-rtl">
      <h1 className="text-2xl font-bold mb-4">Bienvenue, {me?.full_name || user.email}</h1>
      <p>Vous êtes connecté avec succès à votre espace de réservation.</p>
    </main>
  )
}
