import { serverClient } from '@/lib/supabase-server';
import { saveSettings } from '../actions';

export default async function Settings() {
  const { data: s } = await (await serverClient()).from('app_settings').select('*').eq('id', 1).single();
  const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block text-sm">{t}{children}</label>;
  return (
    <>
      <h1 className="text-2xl font-semibold">Paramètres</h1>
      <form action={saveSettings} className="card mt-6 space-y-4">
        <L t="E-mail recevant les notifications"><input name="notify_email" type="email" defaultValue={s?.notify_email ?? ''} className="inp mt-1" /></L>
        <L t="Informations de contact"><input name="contact_info" defaultValue={s?.contact_info ?? ''} className="inp mt-1" /></L>
        <L t="Message de confirmation / instructions"><textarea name="confirmation_message" defaultValue={s?.confirmation_message ?? ''} rows={3} className="inp mt-1" /></L>
        <div className="grid grid-cols-3 gap-3">
          <L t="Délai minimal (h)"><input name="min_notice_hours" type="number" min={0} defaultValue={s?.min_notice_hours} className="inp mt-1" /></L>
          <L t="Horizon (jours)"><input name="horizon_days" type="number" min={1} defaultValue={s?.horizon_days} className="inp mt-1" /></L>
          <L t="Annulation jusqu'à (h avant)"><input name="cancel_hours" type="number" min={0} defaultValue={s?.cancel_hours} className="inp mt-1" /></L>
        </div>
        <button className="btn">Enregistrer</button>
      </form>
    </>
  );
}
