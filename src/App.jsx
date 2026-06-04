import { BrowserRouter } from 'react-router-dom'
import AppErrorBoundary from './components/feedback/AppErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import AppToaster from './components/ui/AppToaster'
import { AdminRolesProvider } from './contexts/AdminRolesContext'
import { CentersProvider } from './contexts/CentersContext'
import { FinanceCenterFilterProvider } from './contexts/FinanceCenterFilterContext'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
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
      </BrowserRouter>
    </AppErrorBoundary>
  )
}
