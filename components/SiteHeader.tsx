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
        <Link href="/" className="font-display text-2xl font-bold text-navy" dir="rtl">أمين المرابط</Link>
        <LangToggle />
      </div>
    </header>
  );
}
