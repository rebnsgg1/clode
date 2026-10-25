import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { Flame, Trash2, Trophy, Utensils, CalendarCheck } from 'lucide-react'
import { db } from '@/lib/db'
import { useDishes } from '@/hooks/useDishes'
import { addDays, plural, toDateKey } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { DishCover } from '@/components/DishCover'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function StatsPage() {
  const history = useLiveQuery(() => db.history.orderBy('cookedAt').reverse().toArray(), [])
  const dishes = useDishes()
  const byId = useMemo(() => new Map((dishes ?? []).map((d) => [d.id, d])), [dishes])

  const stats = useMemo(() => {
    if (!history) return null
    const counts = new Map<string, { name: string; dishId: string; count: number }>()
    history.forEach((h) => {
      const c = counts.get(h.dishId) ?? { name: h.dishName, dishId: h.dishId, count: 0 }
      c.count++
      counts.set(h.dishId, c)
    })
    const top = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5)
    const avg = history.length ? history.reduce((s, h) => s + h.calories, 0) / history.length : 0
    const weekAgo = Date.now() - 7 * 864e5
    const thisWeek = history.filter((h) => h.cookedAt >= weekAgo).length
    const today = new Date()
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, i - 13)
      const key = toDateKey(d)
      return { key, date: d, count: history.filter((h) => toDateKey(new Date(h.cookedAt)) === key).length }
    })
    let pp = 0
    let regular = 0
    history.forEach((h) => {
      const kind = byId.get(h.dishId)?.kind
      if (kind === 'pp') pp++
      else if (kind === 'regular') regular++
    })
    return { top, avg, thisWeek, days, unique: counts.size, pp, regular }
  }, [history, byId])

  if (!history || !stats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    )
  }

  const maxDay = Math.max(1, ...stats.days.map((d) => d.count))
  const maxTop = Math.max(1, ...stats.top.map((t) => t.count))
  const kindTotal = stats.pp + stats.regular || 1

  const groups = new Map<string, typeof history>()
  history.forEach((h) => {
    const key = new Date(h.cookedAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
    groups.set(key, [...(groups.get(key) ?? []), h])
  })

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Статистика" subtitle="Що і як часто ти готуєш" />

      {history.length === 0 ? (
        <EmptyState
          emoji="📊"
          title="Історія поки порожня"
          text="Натисни «Приготовано» на сторінці страви або заверши режим готування — і тут з'явиться статистика."
          action={
            <Button asChild>
              <Link to="/random">Обрати страву дня</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile
              icon={<Utensils />}
              label="Усього приготовано"
              value={history.length}
              tint="bg-sky-500/12 text-sky-600 dark:text-sky-400"
            />
            <Tile
              icon={<CalendarCheck />}
              label="За 7 днів"
              value={stats.thisWeek}
              tint="bg-violet-500/12 text-violet-600 dark:text-violet-400"
            />
            <Tile
              icon={<Flame />}
              label="Середні ккал"
              value={Math.round(stats.avg)}
              tint="bg-orange-500/12 text-orange-600 dark:text-orange-400"
            />
            <Tile
              icon={<Trophy />}
              label="Різних страв"
              value={stats.unique}
              tint="bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <section className="bg-card shadow-soft ring-border/60 rounded-3xl p-5 ring-1">
              <h2 className="mb-4 text-lg font-bold">Найчастіші страви</h2>
              <div className="space-y-3">
                {stats.top.map((t, i) => {
                  const dish = byId.get(t.dishId)
                  return (
                    <Link key={t.dishId} to={dish ? `/dish/${dish.id}` : '#'} className="flex items-center gap-3">
                      <div className="bg-secondary size-10 shrink-0 overflow-hidden rounded-xl">
                        {dish ? (
                          <DishCover dish={dish} emojiClass="text-xl" />
                        ) : (
                          <div className="grid size-full place-items-center">🍽️</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2 text-sm">
                          <span className="truncate font-bold">{t.name}</span>
                          <span className="shrink-0 font-extrabold tabular-nums">{t.count}×</span>
                        </div>
                        <div className="bg-secondary mt-1.5 h-2 overflow-hidden rounded-full">
                          <motion.div
                            className={dish?.kind === 'regular' ? 'bg-regular h-full rounded-full' : 'bg-pp h-full rounded-full'}
                            initial={{ width: 0 }}
                            animate={{ width: `${(t.count / maxTop) * 100}%` }}
                            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>

            <section className="bg-card shadow-soft ring-border/60 rounded-3xl p-5 ring-1">
              <h2 className="mb-4 text-lg font-bold">Останні 14 днів</h2>
              <div className="flex h-36 items-end gap-1.5">
                {stats.days.map((d, i) => (
                  <div
                    key={d.key}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                    title={`${d.date.toLocaleDateString('uk-UA')}: ${d.count}`}
                  >
                    {d.count > 0 && <span className="text-muted-foreground text-[10px] font-bold tabular-nums">{d.count}</span>}
                    <motion.div
                      className="bg-primary w-full rounded-md"
                      style={{ opacity: d.count ? 1 : 0.15 }}
                      initial={{ height: 0 }}
                      animate={{ height: `${d.count ? Math.max(8, (d.count / maxDay) * 100) : 4}%` }}
                      transition={{ duration: 0.6, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <span className="text-muted-foreground text-[10px] font-semibold">{d.date.getDate()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-[13px] font-bold">
                  <span className="text-pp-foreground">ПП · {Math.round((stats.pp / kindTotal) * 100)}%</span>
                  <span className="text-regular-foreground">Звичайні · {Math.round((stats.regular / kindTotal) * 100)}%</span>
                </div>
                <div className="flex h-2.5 gap-1 overflow-hidden rounded-full">
                  {stats.pp > 0 && (
                    <motion.div
                      className="bg-pp rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.pp / kindTotal) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  )}
                  {stats.regular > 0 && (
                    <motion.div
                      className="bg-regular rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.regular / kindTotal) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  )}
                </div>
              </div>
            </section>
          </div>

          <section className="bg-card shadow-soft ring-border/60 rounded-3xl p-5 ring-1">
            <h2 className="mb-1 text-lg font-bold">Що я готував(-ла)</h2>
            <p className="text-muted-foreground mb-4 text-[13px]">
              {history.length} {plural(history.length, ['запис', 'записи', 'записів'])}
            </p>
            <div className="space-y-5">
              {[...groups.entries()].slice(0, 30).map(([date, list]) => (
                <div key={date}>
                  <div className="text-muted-foreground mb-2 text-xs font-bold tracking-wide uppercase">{date}</div>
                  <ul className="space-y-1">
                    {list.map((h) => {
                      const dish = byId.get(h.dishId)
                      return (
                        <li key={h.id} className="group hover:bg-accent flex items-center gap-3 rounded-2xl p-1.5 transition">
                          <div className="bg-secondary size-10 shrink-0 overflow-hidden rounded-xl">
                            {dish ? (
                              <DishCover dish={dish} emojiClass="text-xl" />
                            ) : (
                              <div className="grid size-full place-items-center">🍽️</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            {dish ? (
                              <Link to={`/dish/${dish.id}`} className="block truncate text-sm font-bold hover:underline">
                                {h.dishName}
                              </Link>
                            ) : (
                              <span className="block truncate text-sm font-bold">{h.dishName}</span>
                            )}
                            <span className="text-muted-foreground text-xs">
                              {new Date(h.cookedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })} · {h.calories}{' '}
                              ккал/порція
                            </span>
                          </div>
                          <button
                            onClick={() => db.history.delete(h.id)}
                            className="text-muted-foreground hover:text-destructive grid size-8 place-items-center rounded-lg opacity-60 transition group-hover:opacity-100"
                            aria-label="Видалити запис"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function Tile({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: number; tint: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card shadow-soft ring-border/60 rounded-3xl p-4 ring-1"
    >
      <div className={`mb-3 grid size-10 place-items-center rounded-xl [&_svg]:size-5 ${tint}`}>{icon}</div>
      <div className="text-[28px] leading-none font-extrabold tracking-tight tabular-nums">{value}</div>
      <div className="text-muted-foreground mt-1.5 text-[13px] font-semibold">{label}</div>
    </motion.div>
  )
}
