import Link from 'next/link';
import { publicSettings } from '@/lib/settings-public';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Confidentialité – Espace de réservation' };

export default async function Confidentialite() {
  const { contact } = await publicSettings();
  const h2 = 'mt-6 text-base font-semibold';
  return (
    <>
      <Link href="/login" className="text-sm text-stone-500 underline">← Retour</Link>

      <article className="mt-4 text-sm leading-relaxed text-stone-700">
        <h1 className="text-2xl font-semibold text-stone-900">Politique de confidentialité</h1>

        <h2 className={h2}>Responsable du traitement</h2>
        <p>Coach El Morabit, accompagnement psychologique et comportemental.{contact && <> Contact : {contact}.</>}</p>

        <h2 className={h2}>Données collectées</h2>
        <p>Votre adresse e-mail, votre nom complet et l’historique de vos réservations (date, heure, statut). Ce site ne demande aucune information de santé, aucun motif de consultation et n’enregistre rien du contenu des séances.</p>

        <h2 className={h2}>Pourquoi ces données ?</h2>
        <p>Uniquement pour gérer vos réservations : vous envoyer votre code de connexion, ainsi que les confirmations, rappels et annulations. Aucune publicité, aucune revente de vos données.</p>

        <h2 className={h2}>Prestataires techniques</h2>
        <p>Supabase (base de données, serveurs en Irlande, Union européenne), Vercel (hébergement du site) et Google (envoi des e-mails).</p>

        <h2 className={h2}>Durée de conservation</h2>
        <p>Vos données sont conservées tant que votre compte est actif, puis supprimées à votre demande.</p>

        <h2 className={h2}>Vos droits</h2>
        <p>Conformément à la loi marocaine n° 09-08, vous pouvez demander l’accès, la rectification, la suppression de vos données ou vous opposer à leur traitement{contact ? <> en me contactant au {contact}</> : <> en me contactant directement</>}.</p>

        <h2 className={h2}>Cookies</h2>
        <p>Seuls des cookies techniques, nécessaires à la connexion, sont utilisés. Aucun traceur publicitaire.</p>
      </article>

      <article dir="rtl" lang="ar" className="mt-12 border-t border-stone-200 pt-8 text-sm leading-loose text-stone-700">
        <h1 className="text-2xl font-semibold text-stone-900">سياسة الخصوصية</h1>

        <h2 className={h2}>المسؤول عن معالجة المعطيات</h2>
        <p>أمين المرابط، استشاري المرافقة النفسية والدعم السلوكي ومستشار العلاقات الزوجية والأسرية.{contact && <> للتواصل: <span dir="ltr">{contact}</span>.</>}</p>

        <h2 className={h2}>المعطيات التي نجمعها</h2>
        <p>بريدك الإلكتروني واسمك الكامل وسجل حجوزاتك (التاريخ والساعة والحالة). لا يطلب هذا الموقع أي معلومات صحية ولا سبب الاستشارة، ولا يسجّل شيئاً من محتوى الجلسات.</p>

        <h2 className={h2}>الغرض من جمعها</h2>
        <p>إدارة حجوزاتك فقط: إرسال رمز الدخول ورسائل التأكيد والتذكير والإلغاء. لا إعلانات ولا بيع لمعطياتك.</p>

        <h2 className={h2}>المزوّدون التقنيون</h2>
        <p>Supabase (قاعدة البيانات، خوادم في أيرلندا ضمن الاتحاد الأوروبي)، وVercel (استضافة الموقع)، وGoogle (إرسال البريد الإلكتروني).</p>

        <h2 className={h2}>مدة الاحتفاظ</h2>
        <p>تُحفظ معطياتك ما دام حسابك نشطاً، وتُحذف بناءً على طلبك.</p>

        <h2 className={h2}>حقوقك</h2>
        <p>وفق القانون المغربي رقم 09-08، يحق لك طلب الاطلاع على معطياتك أو تصحيحها أو حذفها، أو الاعتراض على معالجتها، بالتواصل معي مباشرة.</p>

        <h2 className={h2}>ملفات تعريف الارتباط</h2>
        <p>نستعمل ملفات تقنية فقط لازمة لتسجيل الدخول، دون أي تتبع إعلاني.</p>
      </article>
    </>
  );
}
