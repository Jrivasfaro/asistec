// ═══════════════════════════════════════════════
//  ASISTEC — Service Worker v2
//  Maneja modo offline y sincronización pendiente
// ═══════════════════════════════════════════════

const CACHE_NAME = 'asistec-v2';
const OFFLINE_KEY = 'asistec_pendientes';

// Archivos a cachear para funcionar offline
const ASSETS = [
  './index.html',
  './manifest.json'
];

// Instalar y cachear
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activar y limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Interceptar requests — servir desde cache si no hay red
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request)
    )
  );
});

// Escuchar mensaje de sincronización desde la app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SYNC_NOW') {
    event.waitUntil(sincronizarPendientes());
  }
});

// Background sync cuando vuelve la conexión
self.addEventListener('sync', event => {
  if (event.tag === 'sync-asistencia') {
    event.waitUntil(sincronizarPendientes());
  }
});

async function sincronizarPendientes() {
  // Notificar a los clientes que inició la sincronización
  const clients = await self.clients.matchAll();
  clients.forEach(c => c.postMessage({ type: 'SYNC_START' }));
}
