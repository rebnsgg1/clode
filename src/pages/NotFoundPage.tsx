import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <EmptyState
      emoji="🧭"
      title="Сторінку не знайдено"
      text="Схоже, цей рецепт загубився десь на кухні."
      action={
        <Button asChild>
          <Link to="/">На головну</Link>
        </Button>
      }
    />
  )
}
