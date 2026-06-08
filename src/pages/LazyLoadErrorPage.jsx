import { Link, useNavigate } from 'react-router-dom'
import ErrorState from '../components/feedback/ErrorState'
import Button from '../components/ui/Button'

export default function LazyLoadErrorPage({
  moduleLabel = 'page',
  isChunkLoadError = false,
  detail,
}) {
  const navigate = useNavigate()

  const message = isChunkLoadError
    ? 'A newer version of this app was deployed. Refresh the page to load the latest files.'
    : detail ||
      'The page module could not be loaded. Refresh the browser or try again later.'

  const handleRetry = () => {
    if (isChunkLoadError) {
      window.location.reload()
      return
    }
    navigate(0)
  }

  return (
    <div className="figma-admin-section flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <ErrorState
          title="Failed to load this page"
          message={message}
          onRetry={handleRetry}
        />
        {import.meta.env.DEV && detail && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-mono text-amber-900">
            {moduleLabel}: {detail}
          </p>
        )}
        <div className="mt-6 flex justify-center">
          <Link to="/dashboard">
            <Button type="button">Back to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
