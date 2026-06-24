// Service worker AUTO-DESTRUTIVO.
//
// Existia um service worker antigo registrado em localhost (de uma versão
// anterior do app) que interceptava e cacheava requisições — servindo o bundle
// velho e quebrando o carregamento de modelos 3D/Mapbox.
//
// O navegador re-busca /sw.js na rede a cada navegação (a atualização do script
// do SW ignora o cache). Ao instalar este, ele limpa todos os caches, se
// desregistra e recarrega as abas controladas — matando o SW fantasma.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        /* ignore */
      }
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});

// Não intercepta nada: deixa todo fetch ir direto para a rede.
