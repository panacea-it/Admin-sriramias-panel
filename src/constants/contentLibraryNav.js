import {
  Archive,
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Recycle,
  Send,
  Shield,
  Tags,
  Upload,
  UploadCloud,
  FileStack,
  FileText,
  Layers,
} from 'lucide-react'

export const CONTENT_LIBRARY_BASE = '/academics/content-library'

export const CONTENT_LIBRARY_ROUTE_TABS = [
  { id: 'dashboard', label: 'Dashboard', path: `${CONTENT_LIBRARY_BASE}/dashboard`, icon: LayoutDashboard },
  { id: 'upload', label: 'Upload', path: `${CONTENT_LIBRARY_BASE}/upload`, icon: Upload },
  { id: 'all', label: 'All Content', path: `${CONTENT_LIBRARY_BASE}/all`, icon: FileStack },
  { id: 'subjects', label: 'Subjects', path: `${CONTENT_LIBRARY_BASE}/subjects`, icon: BookOpen },
  { id: 'topics', label: 'Topics', path: `${CONTENT_LIBRARY_BASE}/topics`, icon: Layers },
  { id: 'categories', label: 'Categories', path: `${CONTENT_LIBRARY_BASE}/categories`, icon: Tags },
  { id: 'access', label: 'Access Control', path: `${CONTENT_LIBRARY_BASE}/access-control`, icon: Shield },
  { id: 'published', label: 'Published', path: `${CONTENT_LIBRARY_BASE}/published`, icon: Send },
  { id: 'drafts', label: 'Drafts', path: `${CONTENT_LIBRARY_BASE}/drafts`, icon: FileText },
  { id: 'archive', label: 'Archive', path: `${CONTENT_LIBRARY_BASE}/archive`, icon: Archive },
  { id: 'analytics', label: 'Analytics', path: `${CONTENT_LIBRARY_BASE}/analytics`, icon: BarChart3 },
  { id: 'bulk', label: 'Bulk Upload', path: `${CONTENT_LIBRARY_BASE}/bulk-upload`, icon: UploadCloud },
  { id: 'recycle', label: 'Recycle Bin', path: `${CONTENT_LIBRARY_BASE}/recycle-bin`, icon: Recycle },
]

export const ACADEMICS_CONTENT_LIBRARY_SUBMENU = {
  id: 'academics-content-library',
  label: 'Content Library',
  children: CONTENT_LIBRARY_ROUTE_TABS.slice(0, 6).map((tab) => ({
    label: tab.label,
    path: tab.path,
    icon: tab.icon,
  })),
}
