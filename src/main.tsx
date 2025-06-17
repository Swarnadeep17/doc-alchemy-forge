import React from 'react'
import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import LoadingScreen from './components/ui/LoadingScreen'
import { registerServiceWorker, listenForWaitingServiceWorker } from './lib/registerSW'
import { toast } from './hooks/use-toast'
import './index.css'

// Register service worker
registerServiceWorker()

// Listen for service worker updates
listenForWaitingServiceWorker(() => {
  toast({
    title: "Update Available",
    description: "A new version is available. Refresh to update.",
    action: <button 
      className="rounded bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
      onClick={() => window.location.reload()}
    >
      Refresh
    </button>
  })
})

const App = lazy(() => import('./App.tsx'))

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

createRoot(rootElement).render(
  <React.StrictMode>
    <Suspense fallback={<LoadingScreen />}>
      <App />
    </Suspense>
  </React.StrictMode>
)
