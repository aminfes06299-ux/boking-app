const TZ = 'Africa/Casablanca';
export const fmtDate = (d: string) => new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, dateStyle: 'full' }).format(new Date(d));
export const fmtTime = (d: string) => new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, timeStyle: 'short' }).format(new Date(d));
export const localDay = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d); // AAAA-MM-JJ
export const dayParts = (iso: string) => {
  const d = new Date(iso + 'T12:00:00Z');
  return { wd: new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'short' }).format(d), n: d.getUTCDate() };
};
