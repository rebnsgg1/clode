import { useLocation, useNavigate } from 'react-router-dom'
import { Segmented } from '@/components/ui/segmented'

/** Перемикач між «Страва дня» та «Меню на день» */
export function RandomTabs() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  return (
    <Segmented
      id="random-tabs"
      className="mb-6 w-full sm:w-auto"
      value={pathname.startsWith('/day') ? '/day' : '/random'}
      onChange={(v) => navigate(v)}
      options={[
        { value: '/random', label: '🎰 Страва дня' },
        { value: '/day', label: '📅 Меню на день' },
      ]}
    />
  )
}
