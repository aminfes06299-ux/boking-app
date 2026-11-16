'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LangToggle from './LangToggle';

export default function SiteHeader() {
  const p = usePathname();
  if (p.startsWith('/login') || p.startsWith('/admin')) return null;
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/portrait-sm.jpg" width={36} height={36} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-mint" />
          <span dir="rtl" className="font-display text-2xl font-bold text-navy">أمين المرابط</span>
        </Link>
        <LangToggle />
      </div>
    </header>
  );
}
