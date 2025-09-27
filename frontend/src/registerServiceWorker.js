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

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready () {
      console.log(
        'App is being served from cache by a service worker.\n' +
        'For more details, visit https://goo.gl/AFskqB'
      )
    },
    registered () {
      console.log('Service worker has been registered.')
      // Show iOS install prompt after service worker is registered
      setTimeout(showIOSInstallPrompt, 2000)
    },
    cached () {
      console.log('Content has been cached for offline use.')
    },
    updateavailable () {
      console.log('New content is available; please refresh.')
    },
    updated () {
      console.log('New content is available; please refresh.')
    },
    offline () {
      console.log('No internet connection found. App is running in offline mode.')
    },
    error (error) {
      console.error('Error during service worker registration:', error)
    }
  })
}
