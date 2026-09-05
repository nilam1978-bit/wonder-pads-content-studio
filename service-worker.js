const CACHE_NAME = 'wonder-pads-content-studio-v3';

const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './content-pack.json',
  './editor-ai.jsx',
  './editor-brand.jsx',
  './editor-calendar.jsx',
  './editor-canvas.jsx',
  './editor-carousel.jsx',
  './editor-export.jsx',
  './editor-history.jsx',
  './editor-home.jsx',
  './editor-icons.jsx',
  './editor-launch.jsx',
  './editor-mobile-carousel.jsx',
  './editor-mobile-editor.jsx',
  './editor-mobile.jsx',
  './editor-panels.jsx',
  './editor-repurpose.jsx',
  './editor-utils.jsx',
  './editor.jsx',
  './assets/wpr-logo.png',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

const RUNTIME_FILES = [
  'https://unpkg.com/react@18.3.1/umd/react.development.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => caches.open(CACHE_NAME))
      .then((cache) => Promise.allSettled(
        RUNTIME_FILES.map((url) => cache.add(url))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;

        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
