import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { TimerDock } from '@/components/StepTimer'

export function AppShell() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <main className="pl-64">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-6xl px-10 pt-10 pb-16"
          >
            <FrozenOutlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <TimerDock />
    </div>
  )
}

/** Зберігає вміст сторінки під час анімації виходу */
function FrozenOutlet() {
  const outlet = useOutlet()
  const [frozen] = useState(outlet)
  return frozen
}
