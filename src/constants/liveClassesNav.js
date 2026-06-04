import { Calendar, CalendarDays, Radio, Video } from 'lucide-react'

export const LIVE_CLASSES_BASE = '/academics/live-classes'

export const LIVE_CLASSES_ROUTE_TABS = [
  { label: 'Schedule Class', path: `${LIVE_CLASSES_BASE}/schedule`, icon: Calendar },
  { label: 'Recorded Classes', path: `${LIVE_CLASSES_BASE}/recordings`, icon: Video },
  { label: 'Live Sessions', path: `${LIVE_CLASSES_BASE}/live-sessions`, icon: Radio },
  { label: 'Calendar View', path: `${LIVE_CLASSES_BASE}/calendar`, icon: CalendarDays },
]

export const ACADEMICS_LIVE_CLASSES_SUBMENU = {
  id: 'academics-live-classes',
  label: 'Live Classes',
  children: LIVE_CLASSES_ROUTE_TABS.map((tab) => ({
    label: tab.label,
    path: tab.path,
    icon: tab.icon,
  })),
}
