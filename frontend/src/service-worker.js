import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

// Clean up outdated caches
cleanupOutdatedCaches()

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST)

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
)

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
)

// Cache CSS and JS files
registerRoute(
  ({ request }) => 
    request.destination === 'style' || 
    request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
)

// Cache fonts
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
)

// Handle offline fallback for navigation requests
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          return request.url
        },
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null
        }
      }
    ]
  })
)

// iOS Safari specific handling
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Handle fetch events for better offline support
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }
  
  // Handle navigation requests with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open('pages-cache').then(cache => {
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Offline fallback - try to serve from cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse
              }
              // If no cached version, serve offline.html
              return caches.match('/offline.html')
            })
        })
    )
  }
  
  // Handle API requests with offline support
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open('api-cache').then(cache => {
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Offline fallback for API requests
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse
              }
              // Return offline message for API requests
              return new Response(
                JSON.stringify({ 
                  error: 'Offline', 
                  message: 'No internet connection' 
                }),
                { 
                  status: 503, 
                  headers: { 'Content-Type': 'application/json' } 
                }
              )
            })
        })
    )
  }
})

// iOS PWA bildirim desteği
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  // Uygulamayı odakla
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === self.location.origin && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(self.location.origin)
      }
    })
  )
})

// iOS PWA bildirim aksiyonları
self.addEventListener('notificationclose', (event) => {
  console.log('Bildirim kapatıldı:', event.notification.tag)
})
