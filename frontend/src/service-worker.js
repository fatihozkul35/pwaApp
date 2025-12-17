import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import { BackgroundSyncPlugin } from 'workbox-background-sync'

// Clean up outdated caches
cleanupOutdatedCaches()

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST)

// Cache API responses with improved strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
        purgeOnQuotaError: true,
      }),
      new BackgroundSyncPlugin('api-queue', {
        maxRetentionTime: 24 * 60, // 24 hours in minutes
      }),
    ],
  })
)

// Cache images with expiration
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
)

// Cache CSS and JS files with expiration
registerRoute(
  ({ request }) => 
    request.destination === 'style' || 
    request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true,
      }),
    ],
  })
)

// Cache fonts with expiration
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        purgeOnQuotaError: true,
      }),
    ],
  })
)

// Handle offline fallback for navigation requests with improved fallback
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
      },
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true,
      }),
    ]
  })
)

// Install event - skip waiting for immediate activation
self.addEventListener('install', (event) => {
  self.skipWaiting()
  
  // Force immediate activation
  event.waitUntil(
    self.skipWaiting().then(() => {
      console.log('Service Worker: Skipped waiting, activating immediately')
    })
  )
})

// Listen for skip waiting message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Keep current caches, remove old ones
              return !cacheName.includes('workbox-precache') &&
                     !cacheName.includes('api-cache') &&
                     !cacheName.includes('pages-cache') &&
                     !cacheName.includes('images-cache') &&
                     !cacheName.includes('fonts-cache') &&
                     !cacheName.includes('static-resources')
            })
            .map(cacheName => caches.delete(cacheName))
        )
      })
    ])
  )
})

// Enhanced fetch handler with better offline support and fallback strategies
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }
  
  // Handle navigation requests with improved offline fallback
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
        .catch(async () => {
          // Offline fallback - try multiple strategies
          // First, try exact match
          let cachedResponse = await caches.match(event.request)
          if (cachedResponse) {
            return cachedResponse
          }
          
          // Try to match index.html for root paths
          if (event.request.url.endsWith('/')) {
            cachedResponse = await caches.match('/index.html')
            if (cachedResponse) {
              return cachedResponse
            }
          }
          
          // Final fallback - serve offline.html
          cachedResponse = await caches.match('/offline.html')
          if (cachedResponse) {
            return cachedResponse
          }
          
          // Last resort - return a basic offline response
          return new Response(
            '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
            {
              headers: { 'Content-Type': 'text/html' }
            }
          )
        })
    )
    return
  }
  
  // Handle API requests with improved offline support
  if (event.request.url.includes('/api/')) {
    // Only handle GET requests with cache, POST/PUT/DELETE will use background sync
    if (event.request.method === 'GET') {
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
          .catch(async () => {
            // Offline fallback for GET API requests
            const cachedResponse = await caches.match(event.request)
            if (cachedResponse) {
              return cachedResponse
            }
            
            // Return offline message for API requests
            return new Response(
              JSON.stringify({ 
                error: 'Offline', 
                message: 'No internet connection',
                cached: false
              }),
              { 
                status: 503, 
                headers: { 'Content-Type': 'application/json' } 
              }
            )
          })
      )
    }
    // POST/PUT/DELETE requests will be handled by background sync plugin
  }
})

// Bildirim tıklama olayı
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const action = event.action
  const notificationData = event.notification.data || {}
  
  // Eğer action varsa (tamamla, ertele vb.) işle
  if (action) {
    console.log('Bildirim aksiyonu:', action, notificationData)
    
    // Client'a mesaj gönder
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
          // Action bilgisini client'a gönder
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action: action,
            data: notificationData
          })
          
          if ('focus' in client) {
            return client.focus()
          }
        }
        
        // Eğer açık pencere yoksa yeni pencere aç
        if (self.clients.openWindow) {
          return self.clients.openWindow(self.location.origin)
        }
      })
    )
  } else {
    // Normal tıklama - uygulamayı odakla
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
  }
})

// Bildirim kapatma olayı
self.addEventListener('notificationclose', (event) => {
  console.log('Bildirim kapatıldı:', event.notification.tag)
})
