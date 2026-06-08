import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-black text-[var(--color-primary)]">404</p>
      <h1 className="mt-2 text-xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-[var(--color-text-sub)]">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  )
}
