import { Navigate } from 'react-router-dom'
import { LIVE_CLASSES_BASE } from '../../constants/liveClassesNav'

/** Legacy route — redirect to schedule hub */
export default function LiveClassesPage() {
  return <Navigate to={`${LIVE_CLASSES_BASE}/schedule`} replace />
}
