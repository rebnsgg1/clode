import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Search, X } from 'lucide-react'
import { useDishes } from '@/hooks/useDishes'
import { useStoredState } from '@/hooks/useStoredState'
import { DEFAULT_FILTERS, allTags, filterDishes, type DishFilters, type KindFilter } from '@/lib/filters'
import { MEALS, MEAL_LABEL } from '@/lib/constants'
import { plural } from '@/lib/utils'
import { Segmented } from '@/components/ui/segmented'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { FiltersSheet } from '@/components/FiltersSheet'
import { DishCard, DishCardSkeleton } from '@/components/DishCard'
import { EmptyState } from '@/components/EmptyState'

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Доброї ночі'
  if (h < 12) return 'Доброго ранку'
  if (h < 18) return 'Добрий день'
  return 'Добрий вечір'
}

export default function HomePage() {
  const dishes = useDishes()
  const [filters, setFilters] = useStoredState<DishFilters>('home-filters', DEFAULT_FILTERS)
  const set = (patch: Partial<DishFilters>) => setFilters({ ...filters, ...patch })

  const tags = useMemo(() => allTags(dishes ?? []), [dishes])
  const result = useMemo(() => filterDishes(dishes ?? [], filters), [dishes, filters])
  const counts = useMemo(
    () => ({
      all: dishes?.length ?? 0,
      pp: dishes?.filter((d) => d.kind === 'pp').length ?? 0,
      regular: dishes?.filter((d) => d.kind === 'regular').length ?? 0,
    }),
    [dishes],
  )

  const activeChips = [
    ...filters.tags.map((t) => ({ key: `t-${t}`, label: `#${t}`, remove: () => set({ tags: filters.tags.filter((x) => x !== t) }) })),
    ...(filters.maxCalories ? [{ key: 'cal', label: `до ${filters.maxCalories} ккал`, remove: () => set({ maxCalories: null }) }] : []),
    ...(filters.maxTime ? [{ key: 'time', label: `до ${filters.maxTime} хв`, remove: () => set({ maxTime: null }) }] : []),
    ...(filters.favorites ? [{ key: 'fav', label: '❤️ Улюблені', remove: () => set({ favorites: false }) }] : []),
  ]

  const isEmptyDb = dishes && dishes.length === 0

  return (
    <div>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-[15px] font-semibold">{greeting()} 👋</p>
          <h1 className="mt-0.5 text-[30px] leading-tight font-extrabold tracking-tight sm:text-[38px]">Що приготуємо?</h1>
        </div>
      </header>

      {!isEmptyDb && (
        <div className="bg-background/80 sticky top-0 z-20 -mx-4 mb-5 space-y-3 px-4 pt-2 pb-3 backdrop-blur-xl sm:-mx-6 sm:px-6 md:static md:mx-0 md:bg-transparent md:px-0 md:pt-0 md:backdrop-blur-none">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Segmented<KindFilter>
              id="home-kind"
              className="w-full lg:w-auto"
              value={filters.kind}
              onChange={(kind) => set({ kind })}
              options={[
                {
                  value: 'all',
                  label: (
                    <>
                      Усі <Count n={counts.all} />
                    </>
                  ),
                },
                {
                  value: 'pp',
                  label: (
                    <>
                      ПП <Count n={counts.pp} />
                    </>
                  ),
                  activeClass: 'bg-pp',
                },
                {
                  value: 'regular',
                  label: (
                    <>
                      Звичайні <Count n={counts.regular} />
                    </>
                  ),
                  activeClass: 'bg-regular',
                },
              ]}
            />
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2" />
                <Input
                  value={filters.query}
                  onChange={(e) => set({ query: e.target.value })}
                  placeholder="Пошук страв, інгредієнтів, тегів"
                  className="h-11 rounded-2xl pr-10 pl-10"
                  type="search"
                />
                {filters.query && (
                  <button
                    onClick={() => set({ query: '' })}
                    className="bg-secondary text-muted-foreground absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full"
                    aria-label="Очистити пошук"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <FiltersSheet filters={filters} setFilters={setFilters} tags={tags} resultCount={result.length} />
            </div>
          </div>

          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
            {MEALS.map((m) => {
              const active = filters.meals.includes(m.value)
              return (
                <Chip
                  key={m.value}
                  active={active}
                  onClick={() => set({ meals: active ? filters.meals.filter((x) => x !== m.value) : [...filters.meals, m.value] })}
                >
                  <span>{m.emoji}</span>
                  {MEAL_LABEL[m.value]}
                </Chip>
              )
            })}
            <AnimatePresence>
              {activeChips.map((c) => (
                <motion.div
                  key={c.key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Chip active onClick={c.remove} className="bg-primary text-primary-foreground">
                    {c.label} <X className="size-3.5" />
                  </Chip>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {!dishes ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <DishCardSkeleton key={i} />
          ))}
        </div>
      ) : isEmptyDb ? (
        <EmptyState
          emoji="🥗"
          title="Твоя книга рецептів порожня"
          text="Додай улюблені страви — і вони завжди будуть під рукою, навіть без інтернету."
          action={
            <Button asChild size="lg">
              <Link to="/dish/new">
                <Plus /> Додати першу страву
              </Link>
            </Button>
          }
        />
      ) : result.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="Нічого не знайдено"
          text="Спробуй змінити пошук або фільтри."
          action={
            <Button variant="secondary" onClick={() => setFilters({ ...DEFAULT_FILTERS, kind: filters.kind })}>
              Скинути фільтри
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-muted-foreground mb-3 text-sm font-semibold">
            {result.length} {plural(result.length, ['страва', 'страви', 'страв'])}
          </p>
          <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {result.map((d, i) => (
                <DishCard key={d.id} dish={d} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </div>
  )
}

function Count({ n }: { n: number }) {
  return <span className="text-xs font-bold tabular-nums opacity-60">{n}</span>
}
