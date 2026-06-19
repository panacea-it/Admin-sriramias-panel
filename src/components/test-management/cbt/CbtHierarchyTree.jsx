import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Search, GraduationCap, User, Folder, FolderOpen, FileCheck, RefreshCw } from 'lucide-react'
import { cn } from '../../../utils/cn'

function TreeNode({
  node,
  depth,
  expandedIds,
  onToggle,
  selectedId,
  onSelect,
  searchQuery,
}) {
  const hasChildren = node.children?.length || node.faculties?.length
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id
  const q = searchQuery.toLowerCase().trim()

  const label = node.title || ''
  if (q && !label.toLowerCase().includes(q) && node.type !== 'subject') {
    const childMatch = (node.children || node.faculties || []).some((c) =>
      JSON.stringify(c).toLowerCase().includes(q),
    )
    if (!childMatch) return null
  }

  const Icon =
    node.type === 'subject'
      ? GraduationCap
      : node.type === 'faculty'
        ? User
        : node.type === 'folder'
          ? isExpanded
            ? FolderOpen
            : Folder
          : FileCheck

  return (
    <div className="animate-in fade-in duration-200">
      <button
        type="button"
        onClick={() => {
          if (hasChildren) onToggle(node.id)
          onSelect(node)
        }}
        className={cn(
          'group flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm transition',
          isSelected
            ? 'bg-[#1a3a5c] text-white shadow-sm'
            : 'text-slate-700 hover:bg-slate-100',
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {hasChildren ? (
          <span className="shrink-0 text-slate-400 group-hover:text-slate-600">
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            isSelected ? 'text-white' : node.type === 'testSeries' ? 'text-emerald-600' : 'text-[#55ace7]',
          )}
        />
        <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      </button>
      {isExpanded && node.faculties?.map((fac) => (
        <TreeNode
          key={fac.id}
          node={fac}
          depth={depth + 1}
          expandedIds={expandedIds}
          onToggle={onToggle}
          selectedId={selectedId}
          onSelect={onSelect}
          searchQuery={searchQuery}
        />
      ))}
      {isExpanded &&
        node.folders?.map((fld) => (
          <FolderBranch
            key={fld.id}
            node={fld}
            depth={depth + 1}
            expandedIds={expandedIds}
            onToggle={onToggle}
            selectedId={selectedId}
            onSelect={onSelect}
            searchQuery={searchQuery}
          />
        ))}
    </div>
  )
}

function FolderBranch({ node, depth, expandedIds, onToggle, selectedId, onSelect, searchQuery }) {
  const hasChildren = node.children?.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id
  const isFolder = node.type === 'folder'

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (hasChildren) onToggle(node.id)
          onSelect(node)
        }}
        className={cn(
          'group flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm transition',
          isSelected ? 'bg-[#1a3a5c]/90 text-white' : 'text-slate-700 hover:bg-slate-50',
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {hasChildren ? (
          <span className="shrink-0 text-slate-400">
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-[#55ace7]" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-[#55ace7]" />
          )
        ) : (
          <FileCheck className="h-4 w-4 shrink-0 text-emerald-600" />
        )}
        <span className="min-w-0 flex-1 truncate">{node.title}</span>
      </button>
      {isExpanded &&
        node.children?.map((child) => (
          <FolderBranch
            key={child.id}
            node={child}
            depth={depth + 1}
            expandedIds={expandedIds}
            onToggle={onToggle}
            selectedId={selectedId}
            onSelect={onSelect}
            searchQuery={searchQuery}
          />
        ))}
    </div>
  )
}

export default function CbtHierarchyTree({
  hierarchy,
  loading,
  selectedId,
  onSelect,
  onRefresh,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState(() => new Set())

  const defaultExpanded = useMemo(() => {
    const ids = new Set()
    hierarchy.forEach((s) => {
      ids.add(s.id)
      s.faculties?.forEach((f) => ids.add(f.id))
    })
    return ids
  }, [hierarchy])

  const effectiveExpanded = expandedIds.size ? expandedIds : defaultExpanded

  const onToggle = (id) => {
    setExpandedIds((prev) => {
      const base = prev.size ? prev : new Set(defaultExpanded)
      const next = new Set(base)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <aside className="flex h-full min-h-[480px] flex-col rounded-2xl border border-slate-200/80 bg-white shadow-[var(--card-shadow)]">
      <div className="border-b border-slate-100 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#1a3a5c]">Academic Explorer</h2>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#55ace7]"
            title="Sync from Faculty Subjects"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Test Series folders sync from Faculty Subjects → Test Series section only.
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hierarchy…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#55ace7] focus:outline-none focus:ring-2 focus:ring-[#55ace7]/20"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : hierarchy.length === 0 ? (
          <p className="p-4 text-center text-sm text-slate-500">
            No Test Series folders found. Add Test Series content under Faculty Subjects.
          </p>
        ) : (
          hierarchy.map((subject) => (
            <TreeNode
              key={subject.id}
              node={subject}
              depth={0}
              expandedIds={effectiveExpanded}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
              searchQuery={searchQuery}
            />
          ))
        )}
      </div>
    </aside>
  )
}
