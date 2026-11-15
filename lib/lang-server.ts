import { cookies } from 'next/headers';
import { norm, type Lang } from '@/lib/i18n';
export async function getLang(): Promise<Lang> { return norm((await cookies()).get('lang')?.value); }
