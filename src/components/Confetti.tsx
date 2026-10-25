import { motion } from 'framer-motion'
import { useMemo } from 'react'

const ITEMS = ['✨', '🎉', '⭐', '💚', '🧡', '🍀', '🌟']

/** Вибух емодзі-конфеті з центру */
export function Confetti({ burstKey }: { burstKey: number }) {
  const parts = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.4
        const dist = 120 + Math.random() * 110
        return {
          id: `${burstKey}-${i}`,
          emoji: ITEMS[i % ITEMS.length],
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 40,
          rotate: Math.random() * 360 - 180,
          delay: Math.random() * 0.08,
        }
      }),
    [burstKey],
  )
  if (!burstKey) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center overflow-visible">
      {parts.map((p) => (
        <motion.span
          key={p.id}
          className="absolute text-2xl"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: [0, 1.3, 1], opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: 1.1, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  )
}
