const TZ = 'Africa/Casablanca';
export type FmtLang = 'fr' | 'ar';
const LOC = (l: FmtLang) => (l === 'ar' ? 'ar-MA-u-nu-latn' : 'fr-FR');
export const fmtDate = (d: string, lang: FmtLang = 'fr') => new Intl.DateTimeFormat(LOC(lang), { timeZone: TZ, dateStyle: 'full' }).format(new Date(d));
export const fmtTime = (d: string, lang: FmtLang = 'fr') => new Intl.DateTimeFormat(LOC(lang), { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(d));
export const localDay = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d); // AAAA-MM-JJ
export const dayParts = (iso: string, lang: FmtLang = 'fr') => {
  const d = new Date(iso + 'T12:00:00Z');
  return { wd: new Intl.DateTimeFormat(LOC(lang), { timeZone: 'UTC', weekday: 'short' }).format(d), n: d.getUTCDate() };
};
