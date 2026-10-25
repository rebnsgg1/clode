import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, Reorder, motion, useDragControls } from 'framer-motion'
import { toast } from 'sonner'
import { Calculator, Camera, GripVertical, ImagePlus, Loader2, Plus, Timer, Trash2, X } from 'lucide-react'
import { db } from '@/lib/db'
import { useDish, useDishes } from '@/hooks/useDishes'
import { compressImage } from '@/lib/image'
import { allTags } from '@/lib/filters'
import { parseMinutes } from '@/lib/time'
import { COVER_EMOJIS, COVER_PRESETS, DIFFICULTIES, MEALS, UNITS } from '@/lib/constants'
import { cn, haptic, uid } from '@/lib/utils'
import type { Cover, Difficulty, Dish, DishKind, MealType } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { DishCover } from '@/components/DishCover'
import { StarRating } from '@/components/StarRating'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Chip } from '@/components/ui/chip'
import { Segmented } from '@/components/ui/segmented'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'

interface IngDraft {
  id: string
  name: string
  amount: string
  unit: string
}
interface StepDraft {
  id: string
  text: string
  timer: string
}
interface Draft {
  name: string
  description: string
  photo?: string
  cover: Cover
  kind: DishKind
  meals: MealType[]
  calories: string
  protein: string
  fat: string
  carbs: string
  servings: string
  timeMin: string
  difficulty: Difficulty
  ingredients: IngDraft[]
  steps: StepDraft[]
  tags: string[]
  favorite: boolean
  rating: number
}

const emptyIng = (): IngDraft => ({ id: uid(), name: '', amount: '', unit: 'г' })
const emptyStep = (): StepDraft => ({ id: uid(), text: '', timer: '' })

function newDraft(): Draft {
  const preset = COVER_PRESETS[Math.floor(Math.random() * COVER_PRESETS.length)]
  return {
    name: '',
    description: '',
    cover: { emoji: '🥗', ...preset },
    kind: 'pp',
    meals: [],
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    servings: '2',
    timeMin: '30',
    difficulty: 'easy',
    ingredients: [emptyIng(), emptyIng()],
    steps: [emptyStep()],
    tags: [],
    favorite: false,
    rating: 0,
  }
}

function dishToDraft(d: Dish): Draft {
  const s = (n: number) => (n ? String(n) : '')
  return {
    name: d.name,
    description: d.description,
    photo: d.photo,
    cover: d.cover,
    kind: d.kind,
    meals: d.meals,
    calories: s(d.calories),
    protein: s(d.protein),
    fat: s(d.fat),
    carbs: s(d.carbs),
    servings: String(d.servings),
    timeMin: String(d.timeMin),
    difficulty: d.difficulty,
    ingredients: d.ingredients.map((i) => ({ id: i.id, name: i.name, amount: s(i.amount), unit: i.unit })),
    steps: d.steps.map((st) => ({ id: st.id, text: st.text, timer: st.timerMin ? String(st.timerMin) : '' })),
    tags: d.tags,
    favorite: d.favorite,
    rating: d.rating,
  }
}

const num = (v: string) => {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : 0
}

export default function DishFormPage() {
  const { id } = useParams()
  const existing = useDish(id)
  if (id && existing === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    )
  }
  return <DishForm key={id ?? 'new'} existing={existing ?? undefined} />
}

function DishForm({ existing }: { existing?: Dish }) {
  const navigate = useNavigate()
  const dishes = useDishes()
  const [draft, setDraft] = useState<Draft>(() => (existing ? dishToDraft(existing) : newDraft()))
  const [saving, setSaving] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [nameError, setNameError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))
  const knownTags = useMemo(() => allTags(dishes ?? []).filter((t) => !draft.tags.includes(t)), [dishes, draft.tags])

  useEffect(() => {
    if (!existing) nameRef.current?.focus({ preventScroll: true })
  }, [existing])

  const onPhoto = async (file?: File) => {
    if (!file) return
    setPhotoLoading(true)
    try {
      const photo = await compressImage(file)
      set({ photo })
    } catch {
      toast.error('Не вдалося обробити фото')
    } finally {
      setPhotoLoading(false)
    }
  }

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, '').toLowerCase()
    if (tag && !draft.tags.includes(tag)) set({ tags: [...draft.tags, tag] })
    setTagInput('')
  }

  const calcCalories = () => {
    const kcal = Math.round(num(draft.protein) * 4 + num(draft.fat) * 9 + num(draft.carbs) * 4)
    if (kcal) set({ calories: String(kcal) })
    else toast('Спершу вкажи білки, жири та вуглеводи')
  }

  const save = async () => {
    if (!draft.name.trim()) {
      setNameError(true)
      nameRef.current?.focus()
      toast.error('Вкажи назву страви')
      return
    }
    setSaving(true)
    const now = Date.now()
    const dish: Dish = {
      id: existing?.id ?? uid(),
      seedId: existing?.seedId,
      name: draft.name.trim(),
      description: draft.description.trim(),
      photo: draft.photo,
      cover: draft.cover,
      kind: draft.kind,
      meals: draft.meals.length ? draft.meals : ['lunch'],
      calories: Math.round(num(draft.calories)),
      protein: num(draft.protein),
      fat: num(draft.fat),
      carbs: num(draft.carbs),
      servings: Math.max(1, Math.round(num(draft.servings)) || 1),
      timeMin: Math.round(num(draft.timeMin)) || 0,
      difficulty: draft.difficulty,
      ingredients: draft.ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({ id: i.id, name: i.name.trim(), amount: num(i.amount), unit: i.unit })),
      steps: draft.steps.filter((s) => s.text.trim()).map((s) => ({ id: s.id, text: s.text.trim(), timerMin: num(s.timer) || undefined })),
      tags: draft.tags,
      favorite: draft.favorite,
      rating: draft.rating,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await db.dishes.put(dish)
    haptic(20)
    toast.success(existing ? 'Зміни збережено' : 'Страву додано 🎉')
    navigate(`/dish/${dish.id}`, { replace: true })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back
        title={existing ? 'Редагувати страву' : 'Нова страва'}
        subtitle={existing ? existing.name : 'Заповни те, що знаєш — решту можна додати потім'}
      />

      <div className="space-y-5">
        {/* Фото */}
        <Card>
          <div className="bg-muted relative aspect-[16/9] overflow-hidden rounded-2xl">
            <DishCover dish={{ photo: draft.photo, cover: draft.cover, name: draft.name || 'Страва' }} emojiClass="text-8xl" />
            {photoLoading && (
              <div className="absolute inset-0 grid place-items-center bg-black/30 backdrop-blur-sm">
                <Loader2 className="size-8 animate-spin text-white" />
              </div>
            )}
            <div className="absolute right-3 bottom-3 flex gap-2">
              {draft.photo && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-black/40 text-white backdrop-blur-md hover:bg-black/50"
                  onClick={() => set({ photo: undefined })}
                >
                  <X /> Прибрати
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 text-black backdrop-blur-md hover:bg-white"
                onClick={() => fileRef.current?.click()}
              >
                {draft.photo ? <Camera /> : <ImagePlus />}
                {draft.photo ? 'Змінити' : 'Додати фото'}
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                onPhoto(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
          {!draft.photo && (
            <div className="mt-4 space-y-3">
              <Label>Обкладинка без фото</Label>
              <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
                {COVER_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => set({ cover: { ...draft.cover, emoji: e } })}
                    className={cn(
                      'grid size-11 shrink-0 place-items-center rounded-xl text-2xl transition active:scale-90',
                      draft.cover.emoji === e ? 'bg-primary/15 ring-primary ring-2' : 'bg-secondary',
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {COVER_PRESETS.map((p) => (
                  <button
                    key={p.from + p.to}
                    type="button"
                    aria-label="Колір обкладинки"
                    onClick={() => set({ cover: { ...draft.cover, ...p } })}
                    className={cn(
                      'size-9 rounded-full transition active:scale-90',
                      draft.cover.from === p.from && 'ring-foreground ring-offset-card ring-2 ring-offset-2',
                    )}
                    style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Основне */}
        <Card title="Основне">
          <div className="space-y-4">
            <Field label="Назва *">
              <Input
                ref={nameRef}
                value={draft.name}
                onChange={(e) => {
                  setNameError(false)
                  set({ name: e.target.value })
                }}
                placeholder="Наприклад, Гречка з грибами"
                className={cn('text-base font-semibold', nameError && 'border-destructive ring-destructive/15 ring-4')}
              />
            </Field>
            <Field label="Короткий опис">
              <Textarea
                value={draft.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Чим смачна ця страва?"
                rows={2}
              />
            </Field>
            <Field label="Тип">
              <Segmented<DishKind>
                id="form-kind"
                className="w-full"
                value={draft.kind}
                onChange={(kind) => set({ kind })}
                options={[
                  { value: 'pp', label: '🥗 ПП', activeClass: 'bg-pp' },
                  { value: 'regular', label: '🍝 Звичайна', activeClass: 'bg-regular' },
                ]}
              />
            </Field>
            <Field label="Прийом їжі">
              <div className="flex flex-wrap gap-2">
                {MEALS.map((m) => {
                  const active = draft.meals.includes(m.value)
                  return (
                    <Chip
                      key={m.value}
                      active={active}
                      onClick={() => set({ meals: active ? draft.meals.filter((x) => x !== m.value) : [...draft.meals, m.value] })}
                    >
                      {m.emoji} {m.label}
                    </Chip>
                  )
                })}
              </div>
            </Field>
          </div>
        </Card>

        {/* КБЖВ */}
        <Card
          title="КБЖВ на порцію"
          action={
            <Button size="sm" variant="ghost" onClick={calcCalories}>
              <Calculator /> Порахувати ккал
            </Button>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NumField label="Калорії" suffix="ккал" value={draft.calories} onChange={(calories) => set({ calories })} />
            <NumField label="Білки" suffix="г" value={draft.protein} onChange={(protein) => set({ protein })} dot="var(--protein)" />
            <NumField label="Жири" suffix="г" value={draft.fat} onChange={(fat) => set({ fat })} dot="var(--fat)" />
            <NumField label="Вуглеводи" suffix="г" value={draft.carbs} onChange={(carbs) => set({ carbs })} dot="var(--carbs)" />
          </div>
        </Card>

        {/* Деталі */}
        <Card title="Деталі">
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Порцій" value={draft.servings} onChange={(servings) => set({ servings })} />
            <NumField label="Час" suffix="хв" value={draft.timeMin} onChange={(timeMin) => set({ timeMin })} />
          </div>
          <div className="mt-4">
            <Field label="Складність">
              <Segmented<Difficulty>
                id="form-diff"
                className="w-full"
                value={draft.difficulty}
                onChange={(difficulty) => set({ difficulty })}
                options={DIFFICULTIES.map((d) => ({ value: d.value, label: d.label }))}
              />
            </Field>
          </div>
        </Card>

        {/* Інгредієнти */}
        <Card title="Інгредієнти" subtitle="Кількість — на всі порції. Перетягуй ⋮⋮, щоб змінити порядок">
          <Reorder.Group axis="y" values={draft.ingredients} onReorder={(ingredients) => set({ ingredients })} className="space-y-2">
            <AnimatePresence initial={false}>
              {draft.ingredients.map((ing, i) => (
                <IngredientRow
                  key={ing.id}
                  ing={ing}
                  autoFocus={i === draft.ingredients.length - 1 && i > 1 && !ing.name}
                  onChange={(patch) => set({ ingredients: draft.ingredients.map((x) => (x.id === ing.id ? { ...x, ...patch } : x)) })}
                  onRemove={() => set({ ingredients: draft.ingredients.filter((x) => x.id !== ing.id) })}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
          <Button variant="secondary" className="mt-3 w-full" onClick={() => set({ ingredients: [...draft.ingredients, emptyIng()] })}>
            <Plus /> Додати інгредієнт
          </Button>
        </Card>

        {/* Кроки */}
        <Card title="Рецепт" subtitle="Якщо в тексті є час («варити 10 хв»), таймер з'явиться автоматично">
          <Reorder.Group axis="y" values={draft.steps} onReorder={(steps) => set({ steps })} className="space-y-3">
            <AnimatePresence initial={false}>
              {draft.steps.map((step, i) => (
                <StepRow
                  key={step.id}
                  step={step}
                  index={i}
                  autoFocus={i === draft.steps.length - 1 && i > 0 && !step.text}
                  onChange={(patch) => set({ steps: draft.steps.map((x) => (x.id === step.id ? { ...x, ...patch } : x)) })}
                  onRemove={() => set({ steps: draft.steps.filter((x) => x.id !== step.id) })}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
          <Button variant="secondary" className="mt-3 w-full" onClick={() => set({ steps: [...draft.steps, emptyStep()] })}>
            <Plus /> Додати крок
          </Button>
        </Card>

        {/* Теги і оцінка */}
        <Card title="Теги та оцінка">
          <div className="space-y-4">
            <div className="border-input bg-card focus-within:border-ring focus-within:ring-ring/15 flex flex-wrap items-center gap-2 rounded-xl border p-2 focus-within:ring-4">
              {draft.tags.map((t) => (
                <span
                  key={t}
                  className="bg-primary/12 text-primary inline-flex h-8 items-center gap-1 rounded-full pr-1.5 pl-3 text-[13px] font-semibold"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => set({ tags: draft.tags.filter((x) => x !== t) })}
                    className="hover:bg-primary/15 grid size-5 place-items-center rounded-full"
                    aria-label={`Прибрати тег ${t}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => {
                  const v = e.target.value
                  if (v.endsWith(',')) addTag(v.slice(0, -1))
                  else setTagInput(v)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(tagInput)
                  } else if (e.key === 'Backspace' && !tagInput && draft.tags.length) {
                    set({ tags: draft.tags.slice(0, -1) })
                  }
                }}
                onBlur={() => tagInput && addTag(tagInput)}
                placeholder={draft.tags.length ? 'ще тег…' : 'швидко, без глютену…'}
                className="placeholder:text-muted-foreground/70 h-8 min-w-32 flex-1 bg-transparent px-1.5 text-[15px] outline-none"
              />
            </div>
            {knownTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {knownTags.slice(0, 12).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addTag(t)}
                    className="bg-secondary text-muted-foreground hover:text-foreground rounded-full px-3 py-1 text-[13px] font-semibold transition active:scale-95"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            )}
            <div className="bg-secondary/60 flex items-center justify-between rounded-2xl p-3 pl-4">
              <span className="text-sm font-bold">Оцінка</span>
              <StarRating value={draft.rating} onChange={(rating) => set({ rating })} />
            </div>
            <div className="bg-secondary/60 flex items-center justify-between rounded-2xl p-4">
              <label htmlFor="fav" className="text-sm font-bold">
                ❤️ В улюблені
              </label>
              <Switch id="fav" checked={draft.favorite} onCheckedChange={(favorite) => set({ favorite })} />
            </div>
          </div>
        </Card>
      </div>

      <div className="sticky bottom-[calc(max(env(safe-area-inset-bottom),12px)+80px)] z-20 mt-6 md:bottom-6">
        <div className="glass shadow-lift ring-border/70 flex gap-3 rounded-3xl p-2 ring-1">
          <Button variant="ghost" className="flex-1" onClick={() => navigate(-1)}>
            Скасувати
          </Button>
          <Button className="flex-[2]" variant={draft.kind} onClick={save} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {existing ? 'Зберегти' : 'Додати страву'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="bg-card shadow-soft ring-border/60 rounded-3xl p-4 ring-1 sm:p-5">
      {title && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {subtitle && <p className="text-muted-foreground mt-0.5 text-[13px]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function NumField({
  label,
  value,
  onChange,
  suffix,
  dot,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  suffix?: string
  dot?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="inline-flex items-center gap-1.5">
        {dot && <span className="size-2 rounded-full" style={{ background: dot }} />}
        {label}
      </Label>
      <div className="relative">
        <Input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
          placeholder="0"
          className="pr-12 text-base font-bold tabular-nums"
        />
        {suffix && (
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function DragHandle({ controls }: { controls: ReturnType<typeof useDragControls> }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => controls.start(e)}
      className="text-muted-foreground/60 grid w-6 shrink-0 cursor-grab touch-none place-items-center active:cursor-grabbing"
      aria-label="Перетягнути"
    >
      <GripVertical className="size-4" />
    </button>
  )
}

const rowMotion = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.2 },
}

function IngredientRow({
  ing,
  onChange,
  onRemove,
  autoFocus,
}: {
  ing: IngDraft
  onChange: (p: Partial<IngDraft>) => void
  onRemove: () => void
  autoFocus?: boolean
}) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={ing} dragListener={false} dragControls={controls} {...rowMotion} className="relative">
      <div className="bg-card flex items-start gap-1.5 rounded-2xl pb-1">
        <div className="flex h-11 items-center">
          <DragHandle controls={controls} />
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5 sm:flex-nowrap">
          <Input
            autoFocus={autoFocus}
            value={ing.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Інгредієнт"
            className="w-full min-w-0 sm:flex-1"
          />
          <Input
            inputMode="decimal"
            value={ing.amount}
            onChange={(e) => onChange({ amount: e.target.value.replace(/[^\d.,]/g, '') })}
            placeholder="Кількість"
            className="min-w-0 flex-1 px-2.5 tabular-nums sm:w-24 sm:flex-none sm:text-center"
          />
          <select
            value={ing.unit}
            onChange={(e) => onChange({ unit: e.target.value })}
            className="border-input bg-card focus-visible:border-ring focus-visible:ring-ring/15 h-11 w-28 flex-none rounded-xl border px-2 text-sm font-medium outline-none focus-visible:ring-4"
          >
            {(UNITS.includes(ing.unit) ? UNITS : [ing.unit, ...UNITS]).map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive mt-1 grid size-9 shrink-0 place-items-center rounded-xl transition"
          aria-label="Видалити інгредієнт"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </Reorder.Item>
  )
}

function StepRow({
  step,
  index,
  onChange,
  onRemove,
  autoFocus,
}: {
  step: StepDraft
  index: number
  onChange: (p: Partial<StepDraft>) => void
  onRemove: () => void
  autoFocus?: boolean
}) {
  const controls = useDragControls()
  const detected = parseMinutes(step.text)
  return (
    <Reorder.Item value={step} dragListener={false} dragControls={controls} {...rowMotion}>
      <div className="bg-card flex gap-1.5 rounded-2xl">
        <div className="flex flex-col items-center gap-1 pt-2.5">
          <span className="bg-secondary grid size-6 place-items-center rounded-full text-xs font-extrabold">{index + 1}</span>
          <DragHandle controls={controls} />
        </div>
        <div className="flex-1 space-y-2">
          <Textarea
            autoFocus={autoFocus}
            value={step.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder={`Крок ${index + 1}: що робимо?`}
            rows={2}
          />
          <div className="flex items-center gap-2">
            <div className="relative">
              <Timer className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                inputMode="numeric"
                value={step.timer}
                onChange={(e) => onChange({ timer: e.target.value.replace(/\D/g, '') })}
                placeholder={detected ? String(detected) : 'Таймер'}
                className="h-9 w-32 pr-9 pl-9 text-sm"
              />
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">хв</span>
            </div>
            {!step.timer && detected && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-primary text-xs font-semibold">
                ⏱ знайдено {detected} хв
              </motion.span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive grid size-9 shrink-0 place-items-center rounded-xl transition"
          aria-label="Видалити крок"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </Reorder.Item>
  )
}
