const cacheName = 'wwwall-pwa';
const staticAssets = [
  './favicon.ico',
  'https://polyfill.io/v3/polyfill.min.js?features=default',
  './manifest.json',
  './img/icon.png',
  './',
  './index.html',
  './index.css',
  './dist/index.js',
  './img/logo.png'
];

self.addEventListener('install', async event => {
  self.skipWaiting();
  const cache = await caches.open(cacheName);
  await cache.addAll(staticAssets);
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

self.addEventListener('fetch', async event => {
  const req = event.request;

  if (/.*(json)$/.test(req.url)) {
    let networkResPromise = networkFirst(req);
    let networkResPromise2 = networkFirst(req);
    event.respondWith(networkResPromise);

    let networkRes = await networkResPromise2;
    networkRes = await networkRes.clone().json();

    const cache = await caches.open(cacheName);
    let cachedResponse = await cache.match(req);
    if (cachedResponse) { cachedResponse = await cachedResponse.clone().json(); }
    cache.put(req, (await networkResPromise2).clone());

    if (cachedResponse && cachedResponse.version !== networkRes.version) {
      caches.delete(cacheName);
      self.registration.unregister()
        .then(function () {
          return self.clients.matchAll();
        })
        .then(function (clients) {
          clients.forEach(client => client.navigate(client.url))
        });
    }
  } else if (req.url.endsWith('UTC')) {
    event.respondWith(networkFirst(req));
  } else {
    event.respondWith(cacheFirst(req));
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(req);
  return cachedResponse || networkFirst(req, true);
}

async function networkFirst(req, isUpdate=false) {
  const cache = await caches.open(cacheName);
  try { 
    const fresh = await fetch(req);
    if (isUpdate) { cache.put(req, fresh.clone()); }
    
    return fresh;
  } catch (e) { 
    const cachedResponse = await cache.match(req);
    return cachedResponse;
  }
}