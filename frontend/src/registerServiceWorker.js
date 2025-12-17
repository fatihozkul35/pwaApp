/* eslint-disable no-console */

import { register } from 'register-service-worker'

// iOS PWA Install Prompt
function showIOSInstallPrompt() {
  // Check if it's iOS Safari
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone)
  
  if (isIOS && !isInStandaloneMode) {
    // Show iOS install instructions
    const installPrompt = document.createElement('div')
    installPrompt.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; background: #4DBA87; color: white; padding: 10px; text-align: center; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <p style="margin: 0; font-size: 14px;">
          Bu uygulamayı ana ekranınıza eklemek için: 
          <span style="font-weight: bold;">Paylaş</span> → 
          <span style="font-weight: bold;">Ana Ekrana Ekle</span>
        </p>
        <button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; margin-left: 10px; border-radius: 3px; cursor: pointer;">✕</button>
      </div>
    `
    document.body.appendChild(installPrompt)
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (installPrompt.parentElement) {
        installPrompt.remove()
      }
    }, 10000)
  }
}

// Service Worker registration with better offline support
if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready () {
      console.log(
        'App is being served from cache by a service worker.\n' +
        'For more details, visit https://goo.gl/AFskqB'
      )
      // Check if we're offline
      if (!navigator.onLine) {
        console.log('App is running in offline mode.')
      }
    },
    registered (registration) {
      console.log('Service worker has been registered.')
      console.log('Registration:', registration)
      
      // Show iOS install prompt after service worker is registered
      setTimeout(showIOSInstallPrompt, 2000)
      
      // Check for updates
      if (registration.waiting) {
        console.log('New service worker is waiting to activate.')
      }
    },
    cached () {
      console.log('Content has been cached for offline use.')
    },
    updateavailable () {
      console.log('New content is available; please refresh.')
      // Auto-reload if update is available
      if (confirm('Yeni sürüm mevcut. Sayfayı yenilemek ister misiniz?')) {
        window.location.reload()
      }
    },
    updated () {
      console.log('New content is available; please refresh.')
      // Auto-reload after update
      window.location.reload()
    },
    offline () {
      console.log('No internet connection found. App is running in offline mode.')
      // Show offline indicator
      showOfflineIndicator()
    },
    error (error) {
      console.error('Error during service worker registration:', error)
    }
  })
} else {
  // Development mode - register service worker with hot reload support
  if ('serviceWorker' in navigator) {
    let refreshing = false
    
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered in development mode:', registration)
        
        // Handle service worker updates in development
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('New service worker available in development mode')
              
              // Skip waiting and activate immediately in development
              if (newWorker.waiting) {
                newWorker.postMessage({ type: 'SKIP_WAITING' })
              }
            }
          })
        })
        
        // Listen for controller change (service worker updated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true
            console.log('Service worker updated, reloading page...')
            // Reload after a short delay to allow service worker to activate
            setTimeout(() => {
              window.location.reload()
            }, 100)
          }
        })
        
        // Check for updates periodically in development
        setInterval(() => {
          registration.update()
        }, 60000) // Check every minute in development
        
        // Check if we're offline
        if (!navigator.onLine) {
          console.log('App is running in offline mode (development).')
        }
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error)
        // In development, don't fail silently - log the error
        if (process.env.NODE_ENV === 'development') {
          console.warn('Service Worker registration failed. Offline features may not work.')
        }
      })
    
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        window.location.reload()
      }
    })
  }
}

// Offline indicator function
function showOfflineIndicator() {
  const indicator = document.createElement('div')
  indicator.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; right: 0; background: #ff6b6b; color: white; padding: 10px; text-align: center; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <p style="margin: 0; font-size: 14px;">
        📱 Offline Mod - İnternet bağlantısı yok
      </p>
    </div>
  `
  document.body.appendChild(indicator)
  
  // Remove when online
  window.addEventListener('online', () => {
    if (indicator.parentElement) {
      indicator.remove()
    }
  })
}
