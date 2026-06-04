import { Navigate } from 'react-router-dom'

/** Legacy route — redirects to full Content Library CMS */
export default function ContentLibraryPage() {
  return <Navigate to="/academics/content-library/dashboard" replace />
}
