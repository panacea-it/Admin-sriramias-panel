import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import AppErrorBoundary from './components/feedback/AppErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import AppToaster from './components/ui/AppToaster'
import { AdminRolesProvider } from './contexts/AdminRolesContext'
import { CentersProvider } from './contexts/CentersContext'
import { FinanceCenterFilterProvider } from './contexts/FinanceCenterFilterContext'
import AppRoutes from './routes/AppRoutes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppErrorBoundary>
          <AuthProvider>
            <AdminRolesProvider>
              <CentersProvider>
                <FinanceCenterFilterProvider>
                  <AppRoutes />
                  <AppToaster />
                </FinanceCenterFilterProvider>
              </CentersProvider>
            </AdminRolesProvider>
          </AuthProvider>
        </AppErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
