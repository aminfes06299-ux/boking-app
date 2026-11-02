import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Page() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // جلب معلومات المستخدم الحالي
  const { data: { user } } = await supabase.auth.getUser()

  // إذا لم يكن المستخدم مسجلاً دخوله، يتم تحويله لصفحة تسجيل الدخول فوراً
  if (!user) {
    redirect('/login')
  }

  // جلب البيانات الشخصية بأمان تام بعد التأكد من وجود المستخدم
  const { data: me } = await supabase
    .from('profiles')
    .select('full_name, email, active, role')
    .eq('id', user.id)
    .single()

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Bienvenue, {me?.full_name || user.email}</h1>
      <p>Vous êtes connecté avec succès à votre espace de réservation.</p>
    </main>
  )
} 
    
