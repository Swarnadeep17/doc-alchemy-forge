export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful:', registration.scope);
        })
        .catch(error => {
          console.error('ServiceWorker registration failed:', error);
        });
    });
  }
}

// Check if service worker needs update
export function checkForSWUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.update();
    });
  }
}

// Optional: Function to notify users of new content
export function listenForWaitingServiceWorker(callback: () => void) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.addEventListener('waiting', event => {
        if (callback) callback();
      });
    });
  }
}
