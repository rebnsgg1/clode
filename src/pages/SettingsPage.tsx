import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { Download, Upload, RotateCcw, Smartphone, Monitor, Moon, Sun, Check, Share, Loader2 } from 'lucide-react'
import { db, restoreSeed } from '@/lib/db'
import { exportBackup, importBackup, readBackup } from '@/lib/backup'
import { useTheme, type ThemeMode } from '@/hooks/useTheme'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { cn, plural } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

type BackupData = Awaited<ReturnType<typeof readBackup>>

export default function SettingsPage() {
  const { mode, setMode } = useTheme()
  const install = useInstallPrompt()
  const fileRef = useRef<HTMLInputElement>(null)
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

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

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

        <Section title="Резервна копія" subtitle="Збережи всю базу в JSON-файл, щоб перенести на інший пристрій або не втратити рецепти.">
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              size="lg"
              onClick={async () => {
                const n = await exportBackup()
                toast.success(`Експортовано ${n} ${plural(n, ['страву', 'страви', 'страв'])}`)
              }}
            >
              <Download /> Експорт у JSON
            </Button>
            <Button variant="outline" size="lg" onClick={() => fileRef.current?.click()}>
              <Upload /> Імпорт з JSON
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try {
                setPending(await readBackup(f))
              } catch (err) {
                toast.error((err as Error).message)
              }
            }}
          />
          {counts && (
            <p className="text-muted-foreground mt-3 text-[13px]">
              У базі: {counts.dishes} {plural(counts.dishes, ['страва', 'страви', 'страв'])}, {counts.plan} у плані, {counts.history} в
              історії
            </p>
          )}
        </Section>

        <Section title="Встановити на телефон" subtitle="«Моє меню» працює як застосунок: з іконкою на екрані й без інтернету.">
          {install.installed ? (
            <p className="text-primary inline-flex items-center gap-2 text-sm font-bold">
              <Check className="size-4" /> Застосунок уже встановлено
            </p>
          ) : install.canInstall ? (
            <Button
              size="lg"
              onClick={async () => {
                if (await install.install()) toast.success('Встановлено! 🎉')
              }}
            >
              <Smartphone /> Встановити застосунок
            </Button>
          ) : (
            <ol className="text-muted-foreground space-y-2 text-sm">
              {isIOS ? (
                <>
                  <li>
                    1. Відкрий сайт у <b className="text-foreground">Safari</b>
                  </li>
                  <li className="flex items-center gap-1">
                    2. Натисни <Share className="text-foreground inline size-4" /> <b className="text-foreground">Поділитися</b>
                  </li>
                  <li>
                    3. Обери <b className="text-foreground">«На початковий екран»</b>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    1. Відкрий сайт у <b className="text-foreground">Chrome</b>
                  </li>
                  <li>
                    2. Меню <b className="text-foreground">⋮</b> → <b className="text-foreground">«Встановити застосунок»</b> або «Додати на
                    головний екран»
                  </li>
                </>
              )}
            </ol>
          )}
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

        <p className="text-muted-foreground pt-2 pb-4 text-center text-xs">Моє меню · дані зберігаються лише на цьому пристрої</p>
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
