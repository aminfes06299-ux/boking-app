import Link from 'next/link';
import { publicSettings } from '@/lib/settings-public';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Conditions – Espace de réservation' };

export default async function Conditions() {
  const { cancelHours, contact } = await publicSettings();
  const h2 = 'mt-6 text-base font-semibold';
  return (
    <>
      <Link href="/login" className="text-sm text-stone-500 underline">← Retour</Link>

      <article className="mt-4 text-sm leading-relaxed text-stone-700">
        <h1 className="text-2xl font-semibold text-stone-900">Conditions de réservation et d’annulation</h1>

        <h2 className={h2}>Séances</h2>
        <p>Chaque séance dure 60 minutes. La réservation se fait en ligne et vous est confirmée par e-mail.</p>

        <h2 className={h2}>Annulation</h2>
        <p>Vous pouvez annuler depuis votre espace jusqu’à {cancelHours} h avant la séance. Passé ce délai, l’annulation n’est plus possible en ligne : merci de me contacter directement{contact && <> au {contact}</>}.</p>

        <h2 className={h2}>Retard ou empêchement</h2>
        <p>Merci de me prévenir dès que possible en cas de retard ou d’empêchement.</p>

        <h2 className={h2}>Important</h2>
        <p>Ce service sert uniquement à réserver des séances ; il ne permet pas de traiter une urgence. Si vous êtes en danger ou en grande détresse, contactez les services d’urgence de votre pays ou rendez-vous aux urgences les plus proches.</p>
      </article>

      <article dir="rtl" lang="ar" className="mt-12 border-t border-stone-200 pt-8 text-sm leading-loose text-stone-700">
        <h1 className="text-2xl font-semibold text-stone-900">شروط الحجز والإلغاء</h1>

        <h2 className={h2}>الجلسات</h2>
        <p>مدة كل جلسة 60 دقيقة. يتم الحجز عبر الموقع ويصلك تأكيده برسالة بريد إلكتروني.</p>

        <h2 className={h2}>الإلغاء</h2>
        <p>يمكنك الإلغاء من فضائك الخاص حتى {cancelHours} ساعة قبل الجلسة. بعد هذا الأجل لا يمكن الإلغاء عبر الموقع، فيُرجى التواصل معي مباشرة{contact && <> على <span dir="ltr">{contact}</span></>}.</p>

        <h2 className={h2}>التأخر أو تعذّر الحضور</h2>
        <p>يُرجى إخباري في أقرب وقت ممكن عند التأخر أو تعذّر الحضور.</p>

        <h2 className={h2}>تنبيه مهم</h2>
        <p>هذه الخدمة مخصصة لحجز الجلسات فقط، ولا تصلح للحالات الطارئة. إذا كنت في خطر أو ضيق شديد، فاتصل بخدمات الطوارئ في بلدك أو توجّه إلى أقرب مستعجلات.</p>
      </article>
    </>
  );
}
