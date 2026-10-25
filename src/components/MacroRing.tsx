import { motion } from 'framer-motion'
import { macroShares } from '@/lib/nutrition'
import { formatNumber } from '@/lib/utils'

const R = 52
const C = 2 * Math.PI * R

/** Кільцева діаграма БЖВ (частки за калоріями) */
export function MacroRing({
  calories,
  protein,
  fat,
  carbs,
  caption = 'ккал',
}: {
  calories: number
  protein: number
  fat: number
  carbs: number
  caption?: string
}) {
  const shares = macroShares({ protein, fat, carbs })
  const gap = 0.012
  const segments = [
    { key: 'protein', share: shares.protein, color: 'var(--protein)' },
    { key: 'fat', share: shares.fat, color: 'var(--fat)' },
    { key: 'carbs', share: shares.carbs, color: 'var(--carbs)' },
  ]
  let offset = 0
  return (
    <div className="flex items-center gap-6">
      <div className="relative size-36 shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--muted)" strokeWidth="12" />
          {segments.map((s, i) => {
            const len = Math.max(0, s.share - gap) * C
            const el = (
              <motion.circle
                key={s.key}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDashoffset={-offset * C}
                initial={{ strokeDasharray: `0 ${C}` }}
                animate={{ strokeDasharray: `${len} ${C}` }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              />
            )
            offset += s.share
            return el
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-[28px] leading-none font-extrabold tracking-tight">{Math.round(calories)}</div>
            <div className="text-muted-foreground mt-1 text-xs font-semibold">{caption}</div>
          </div>
        </div>
      </div>
      <div className="grid flex-1 gap-3">
        <MacroRow label="Білки" grams={protein} share={shares.protein} color="var(--protein)" />
        <MacroRow label="Жири" grams={fat} share={shares.fat} color="var(--fat)" />
        <MacroRow label="Вуглеводи" grams={carbs} share={shares.carbs} color="var(--carbs)" />
      </div>
    </div>
  )
}

function MacroRow({ label, grams, share, color }: { label: string; grams: number; share: number; color: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="inline-flex items-center gap-2 font-semibold">
          <span className="size-2.5 rounded-full" style={{ background: color }} />
          {label}
        </span>
        <span className="font-bold tabular-nums">
          {formatNumber(grams)} г <span className="text-muted-foreground font-medium">· {Math.round(share * 100)}%</span>
        </span>
      </div>
    </div>
  )
}

/** Компактні показники КБЖВ рядком */
export function MacroPills({ calories, protein, fat, carbs }: { calories: number; protein: number; fat: number; carbs: number }) {
  const items = [
    { label: 'ккал', value: Math.round(calories), color: 'var(--foreground)' },
    { label: 'Б', value: formatNumber(protein), color: 'var(--protein)' },
    { label: 'Ж', value: formatNumber(fat), color: 'var(--fat)' },
    { label: 'В', value: formatNumber(carbs), color: 'var(--carbs)' },
  ]
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((i) => (
        <div key={i.label} className="bg-secondary/70 rounded-2xl px-2 py-2.5 text-center">
          <div className="text-lg leading-none font-extrabold tabular-nums">{i.value}</div>
          <div className="mt-1 text-[11px] font-bold tracking-wide uppercase" style={{ color: i.color }}>
            {i.label}
          </div>
        </div>
      ))}
    </div>
  )
}
