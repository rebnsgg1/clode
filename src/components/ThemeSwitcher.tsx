import { Monitor, Moon, Sun } from 'lucide-react'
import { Segmented } from '@/components/ui/segmented'
import { useTheme, type ThemeMode } from '@/hooks/useTheme'

export function ThemeSwitcher({ className, id = 'theme' }: { className?: string; id?: string }) {
  const { mode, setMode } = useTheme()
  return (
    <Segmented<ThemeMode>
      id={id}
      size="sm"
      className={className}
      value={mode}
      onChange={setMode}
      options={[
        { value: 'light', label: <Sun className="size-4" aria-label="Світла" /> },
        { value: 'system', label: <Monitor className="size-4" aria-label="Як у системі" /> },
        { value: 'dark', label: <Moon className="size-4" aria-label="Темна" /> },
      ]}
    />
  )
}
