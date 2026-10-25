import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { Toaster } from 'sonner'
import { ThemeProvider, useTheme } from '@/hooks/useTheme'
import { TimersProvider } from '@/hooks/useTimers'
import { AppShell } from '@/components/layout/AppShell'
import HomePage from '@/pages/HomePage'
import DishPage from '@/pages/DishPage'
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const MorePage = lazy(() => import('@/pages/MorePage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const StatsPage = lazy(() => import('@/pages/StatsPage'))
const ShoppingPage = lazy(() => import('@/pages/ShoppingPage'))
const PlannerPage = lazy(() => import('@/pages/PlannerPage'))
const DayMenuPage = lazy(() => import('@/pages/DayMenuPage'))
const RandomPage = lazy(() => import('@/pages/RandomPage'))
const CookModePage = lazy(() => import('@/pages/CookModePage'))
const DishFormPage = lazy(() => import('@/pages/DishFormPage'))

function ThemedToaster() {
  const { resolved } = useTheme()
  return <Toaster theme={resolved} position="top-center" toastOptions={{ className: '!rounded-2xl !font-sans !shadow-lift' }} />
}

function PageFallback() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6 md:pl-72">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <TimersProvider>
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/dish/:id/cook" element={<CookModePage />} />
                <Route element={<AppShell />}>
                  <Route index element={<HomePage />} />
                  <Route path="/dish/new" element={<DishFormPage />} />
                  <Route path="/dish/:id" element={<DishPage />} />
                  <Route path="/dish/:id/edit" element={<DishFormPage />} />
                  <Route path="/random" element={<RandomPage />} />
                  <Route path="/day" element={<DayMenuPage />} />
                  <Route path="/planner" element={<PlannerPage />} />
                  <Route path="/shopping" element={<ShoppingPage />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/more" element={<MorePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
          <ThemedToaster />
        </MotionConfig>
      </TimersProvider>
    </ThemeProvider>
  )
}
