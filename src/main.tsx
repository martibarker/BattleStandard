import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

Sentry.init({
  dsn: 'https://b5eda4b522fb6cb06b65d1ee9fc16965@o4511181236338688.ingest.de.sentry.io/4511181264584784',
  environment: import.meta.env.MODE,
  // Only send errors in production — avoids noise during development
  enabled: import.meta.env.PROD,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Mask text/inputs in session replay by default for privacy
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Capture 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,
  // Capture 10% of sessions for replay, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
