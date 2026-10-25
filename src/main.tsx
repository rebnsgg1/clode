import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Як у нативній програмі: без браузерного контекстного меню (крім полів введення)
if (import.meta.env.PROD) {
  document.addEventListener('contextmenu', (e) => {
    const t = e.target as HTMLElement
    if (!t.closest('input, textarea, [contenteditable="true"]')) e.preventDefault()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
