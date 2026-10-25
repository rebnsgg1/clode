import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { Download, Upload, RotateCcw, Monitor, Moon, Sun, Check, Loader2, HardDrive } from 'lucide-react'
import { db, restoreSeed } from '@/lib/db'
import { exportBackup, importBackup, pickBackup, type BackupData } from '@/lib/backup'
import { useTheme, type ThemeMode } from '@/hooks/useTheme'
import { cn, plural } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export default function SettingsPage() {
  const { mode, setMode } = useTheme()
  const [pending, setPending] = useState<BackupData | null>(null)
  const [busy, setBusy] = useState(false)
  const counts = useLiveQuery(async () => ({
    dishes: await db.dishes.count(),
    plan: await db.plan.count(),
    history: await db.history.count(),
  }))

  const themes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Світла', icon: <Sun /> },
    { value: 'dark', label: 'Темна', icon: <Moon /> },
    { value: 'system', label: 'Як у системі', icon: <Monitor /> },
  ]

  const doImport = async (m: 'merge' | 'replace') => {
    if (!pending) return
    setBusy(true)
    try {
      const n = await importBackup(pending, m)
      toast.success(`Імпортовано ${n} ${plural(n, ['страву', 'страви', 'страв'])}`)
      setPending(null)
    } catch (e) {
      toast.error('Помилка імпорту', { description: String(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Налаштування" />

      <div className="space-y-5">
        <Section title="Тема оформлення">
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setMode(t.value)}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-sm font-bold transition active:scale-95 [&_svg]:size-6',
                  mode === t.value
                    ? 'border-primary bg-primary/8 text-primary'
                    : 'bg-secondary/70 text-muted-foreground hover:text-foreground border-transparent',
                )}
              >
                {mode === t.value && <Check className="absolute top-2 right-2 !size-4" />}
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </Section>

        <Section
          title="Резервна копія"
          subtitle="Збережи всі рецепти, план та історію в JSON-файл — щоб не втратити дані або перенести їх на інший комп'ютер."
        >
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={async () => {
                try {
                  const res = await exportBackup()
                  if (res)
                    toast.success(`Збережено ${res.count} ${plural(res.count, ['страву', 'страви', 'страв'])}`, { description: res.path })
                } catch (e) {
                  toast.error('Не вдалося зберегти', { description: String(e) })
                }
              }}
            >
              <Download /> Зберегти копію…
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={async () => {
                try {
                  const data = await pickBackup()
                  if (data) setPending(data)
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : String(e))
                }
              }}
            >
              <Upload /> Відновити з копії…
            </Button>
          </div>
          {counts && (
            <p className="text-muted-foreground mt-3 text-[13px]">
              У базі: {counts.dishes} {plural(counts.dishes, ['страва', 'страви', 'страв'])}, {counts.plan} у плані, {counts.history} в
              історії
            </p>
          )}
        </Section>

        <Section title="Де зберігаються дані">
          <p className="text-muted-foreground flex gap-3 text-sm">
            <HardDrive className="text-foreground mt-0.5 size-5 shrink-0" />
            <span>
              Усе зберігається лише на цьому комп'ютері, у папці профілю Windows (
              <code className="text-foreground">%LOCALAPPDATA%\ua.moiemenu.desktop</code>). Програма працює повністю без інтернету. Під час
              видалення програми дані лишаються, якщо не поставити галочку «Видалити дані програми».
            </span>
          </p>
        </Section>

        <Section title="Стартові страви" subtitle="Повернути видалені страви з початкового набору.">
          <Button
            variant="secondary"
            onClick={async () => {
              const n = await restoreSeed()
              toast(n ? `Повернуто ${n} ${plural(n, ['страву', 'страви', 'страв'])}` : 'Усі стартові страви вже на місці')
            }}
          >
            <RotateCcw /> Відновити стартові
          </Button>
        </Section>

        <p className="text-muted-foreground pt-2 pb-4 text-center text-xs">Моє меню · версія {__APP_VERSION__}</p>
      </div>

      <Sheet open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <SheetContent
          title="Імпорт бази"
          description={
            pending
              ? `У файлі ${pending.dishes.length} ${plural(pending.dishes.length, ['страва', 'страви', 'страв'])}. Як імпортувати?`
              : ''
          }
        >
          <div className="grid gap-3">
            <button
              disabled={busy}
              onClick={() => doImport('merge')}
              className="border-primary/40 bg-primary/5 hover:border-primary rounded-2xl border-2 p-4 text-left transition active:scale-[0.99]"
            >
              <div className="font-bold">Об'єднати {busy && <Loader2 className="inline size-4 animate-spin" />}</div>
              <div className="text-muted-foreground text-sm">Додати нові й оновити наявні страви. Нічого не видаляється.</div>
            </button>
            <button
              disabled={busy}
              onClick={() => doImport('replace')}
              className="border-destructive/30 hover:border-destructive rounded-2xl border-2 p-4 text-left transition active:scale-[0.99]"
            >
              <div className="text-destructive font-bold">Замінити все</div>
              <div className="text-muted-foreground text-sm">Поточна база буде повністю замінена даними з файлу.</div>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="bg-card shadow-soft ring-border/60 rounded-3xl p-5 ring-1">
      <h2 className="text-lg font-bold">{title}</h2>
      {subtitle && <p className="text-muted-foreground mt-1 text-[13px]">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
