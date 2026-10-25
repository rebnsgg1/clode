import { SlidersHorizontal, Heart } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { MEALS } from '@/lib/constants'
import { DEFAULT_FILTERS, SORT_LABEL, activeFilterCount, type DishFilters, type SortKey } from '@/lib/filters'
import { cn } from '@/lib/utils'

const CAL_MAX = 1000
const TIME_MAX = 180

export function FiltersSheet({
  filters,
  setFilters,
  tags,
  resultCount,
}: {
  filters: DishFilters
  setFilters: (f: DishFilters) => void
  tags: string[]
  resultCount: number
}) {
  const count = activeFilterCount(filters)
  const set = (patch: Partial<DishFilters>) => setFilters({ ...filters, ...patch })
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className={cn('relative', count && 'border-foreground/30')} aria-label="Фільтри">
          <SlidersHorizontal />
          {count > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full text-[11px] font-bold">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent title="Фільтри" description="Знайди страву під настрій">
        <div className="space-y-7">
          <section>
            <h4 className="mb-3 text-sm font-bold">Прийом їжі</h4>
            <div className="flex flex-wrap gap-2">
              {MEALS.map((m) => (
                <Chip key={m.value} active={filters.meals.includes(m.value)} onClick={() => set({ meals: toggle(filters.meals, m.value) })}>
                  <span>{m.emoji}</span> {m.label}
                </Chip>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h4 className="text-sm font-bold">Калорії на порцію</h4>
              <span className="text-muted-foreground text-sm font-semibold">
                {filters.maxCalories ? `до ${filters.maxCalories} ккал` : 'будь-які'}
              </span>
            </div>
            <Slider
              min={100}
              max={CAL_MAX}
              step={50}
              value={[filters.maxCalories ?? CAL_MAX]}
              onValueChange={([v]) => set({ maxCalories: v >= CAL_MAX ? null : v })}
            />
          </section>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h4 className="text-sm font-bold">Час приготування</h4>
              <span className="text-muted-foreground text-sm font-semibold">
                {filters.maxTime ? `до ${filters.maxTime} хв` : 'будь-який'}
              </span>
            </div>
            <Slider
              min={10}
              max={TIME_MAX}
              step={5}
              value={[filters.maxTime ?? TIME_MAX]}
              onValueChange={([v]) => set({ maxTime: v >= TIME_MAX ? null : v })}
            />
          </section>

          {tags.length > 0 && (
            <section>
              <h4 className="mb-3 text-sm font-bold">Теги</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Chip key={t} active={filters.tags.includes(t)} onClick={() => set({ tags: toggle(filters.tags, t) })}>
                    #{t}
                  </Chip>
                ))}
              </div>
            </section>
          )}

          <section className="bg-secondary/60 flex items-center justify-between rounded-2xl p-4">
            <label htmlFor="fav-only" className="inline-flex items-center gap-2 text-sm font-bold">
              <Heart className="size-4 fill-rose-500 text-rose-500" /> Лише улюблені
            </label>
            <Switch id="fav-only" checked={filters.favorites} onCheckedChange={(v) => set({ favorites: v })} />
          </section>

          <section>
            <h4 className="mb-3 text-sm font-bold">Сортування</h4>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <Chip key={k} active={filters.sort === k} onClick={() => set({ sort: k })}>
                  {SORT_LABEL[k]}
                </Chip>
              ))}
            </div>
          </section>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setFilters({ ...DEFAULT_FILTERS, kind: filters.kind, query: filters.query })}
            >
              Скинути
            </Button>
            <SheetClose asChild>
              <Button className="flex-[2]">Показати {resultCount}</Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
