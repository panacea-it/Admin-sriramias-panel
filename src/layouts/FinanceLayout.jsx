import { Navigate, Route, Routes } from 'react-router-dom'
import { FinanceOperationsProvider } from '../contexts/FinanceOperationsContext'
import { PaymentAttemptLogsProvider } from '../contexts/PaymentAttemptLogsContext'
import FinanceErrorBoundary from '../components/finance/FinanceErrorBoundary'
import PaymentDashboardPage from '../pages/finance/PaymentDashboardPage'
import StudentPaymentReportsPage from '../pages/finance/StudentPaymentReportsPage'
import PaymentVerificationCenterPage from '../pages/finance/PaymentVerificationCenterPage'
import EmiManagementPage from '../pages/finance/EmiManagementPage'
import ReceiptManagementPage from '../pages/finance/ReceiptManagementPage'
import StudentFinanceProfilesPage from '../pages/finance/StudentFinanceProfilesPage'
import PaymentAttemptLogsPage from '../pages/finance/PaymentAttemptLogsPage'
import AssignedCounselorPage from '../pages/finance/AssignedCounselorPage'
import OfflinePaymentApprovalPage from '../pages/finance/OfflinePaymentApprovalPage'
import GstInvoiceSettingsPage from '../pages/finance/GstInvoiceSettingsPage'
import NestedRouteRedirect from '../components/feedback/NestedRouteRedirect'

export default function FinanceLayout() {
  return (
    <FinanceOperationsProvider>
      <PaymentAttemptLogsProvider>
        <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
          <section className="mx-auto max-w-screen-2xl">
            <FinanceErrorBoundary>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<PaymentDashboardPage />} />
                <Route path="reports" element={<StudentPaymentReportsPage />} />
                <Route path="verification" element={<PaymentVerificationCenterPage />} />
                <Route path="emi" element={<EmiManagementPage />} />
                <Route path="receipts" element={<ReceiptManagementPage />} />
                <Route path="profiles" element={<StudentFinanceProfilesPage />} />
                <Route path="attempts" element={<PaymentAttemptLogsPage />} />
                <Route path="attempts/assigned" element={<AssignedCounselorPage />} />
                <Route path="offline-approval" element={<OfflinePaymentApprovalPage />} />
                <Route path="communication/*" element={<Navigate to="../attempts" replace />} />
                <Route path="gst-settings" element={<GstInvoiceSettingsPage />} />
                <Route path="*" element={<NestedRouteRedirect defaultSegment="dashboard" />} />
              </Routes>
            </FinanceErrorBoundary>
          </section>
        </div>
      </PaymentAttemptLogsProvider>
    </FinanceOperationsProvider>
  )
}
