import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Coach El Morabit – Espace de réservation',
    short_name: 'Coach El Morabit',
    description: 'Réservez vos séances et retrouvez vos ressources.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F3FAF8',
    theme_color: '#12355B',
    lang: 'fr',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
