import type { Step } from '@/types'

/** Визначає таймер кроку: явне поле або час у тексті («10 хв», «1 год», «1,5 години»). */
export function stepTimerMinutes(step: Step): number | undefined {
  if (step.timerMin && step.timerMin > 0) return step.timerMin
  return parseMinutes(step.text)
}

export function parseMinutes(text: string): number | undefined {
  const hours = text.match(/(\d+(?:[.,]\d+)?)\s*(?:год|годин)/i)
  const mins = text.match(/(\d+)\s*(?:хв|хвилин)/i)
  let total = 0
  if (hours) total += parseFloat(hours[1].replace(',', '.')) * 60
  if (mins) total += parseInt(mins[1], 10)
  return total > 0 ? Math.round(total) : undefined
}

export function formatClock(totalSec: number) {
  const s = Math.max(0, Math.ceil(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  const ss = String(sec).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
