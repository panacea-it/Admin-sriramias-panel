import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  Layers,
  Plus,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react'
import { cn } from '../../utils/cn'

function InlineInput({ value, onChange, onConfirm, onCancel, placeholder }) {
  return (
    <div className="flex items-center gap-1 py-0.5">
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onConfirm()
          if (e.key === 'Escape') onCancel()
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-xs focus:border-[#55ace7] focus:outline-none"
      />
      <button type="button" onClick={onConfirm} className="rounded p-1 text-emerald-600 hover:bg-emerald-50">
        <Check className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onCancel} className="rounded p-1 text-slate-400 hover:bg-slate-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function FolderNode({
  folder,
  depth,
  expandedIds,
  onToggleExpand,
  selectedFolderId,
  selectedItemId,
  onSelectFolder,
  onSelectItem,
  onRenameFolder,
  onDeleteFolder,
  editingFolderId,
  setEditingFolderId,
  editValue,
  setEditValue,
  searchQuery,
}) {
  const isExpanded = expandedIds.has(folder.id)
  const isFolderSelected = selectedFolderId === folder.id && !selectedItemId
  const q = searchQuery.toLowerCase().trim()

  const visibleItems = (folder.items || []).filter(
    (item) => !q || item.title.toLowerCase().includes(q),
  )

  if (q && !visibleItems.length && !folder.folderName.toLowerCase().includes(q)) {
    return null
  }

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md px-1 py-1 text-sm transition',
          isFolderSelected ? 'bg-[#1a3a5c]/10 text-[#1a3a5c]' : 'text-slate-700 hover:bg-slate-50',
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          onClick={() => onToggleExpand(folder.id)}
          className="shrink-0 rounded p-0.5 text-slate-400"
        >
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-[#55ace7]" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-[#55ace7]" />
        )}
        {editingFolderId === folder.id ? (
          <div className="min-w-0 flex-1">
            <InlineInput
              value={editValue}
              onChange={setEditValue}
              onConfirm={() => onRenameFolder(folder.id, editValue)}
              onCancel={() => setEditingFolderId(null)}
              placeholder="Folder name"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onSelectFolder(folder.id)}
            className="min-w-0 flex-1 truncate text-left font-medium"
          >
            {folder.folderName}
          </button>
        )}
        <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            title="Rename"
            onClick={() => {
              setEditingFolderId(folder.id)
              setEditValue(folder.folderName)
            }}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            title="Delete"
            onClick={() => onDeleteFolder(folder.id)}
            className="rounded p-1 text-[#c96565] hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div>
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                'group flex items-center gap-1.5 rounded-md py-1 text-sm',
                selectedItemId === item.id
                  ? 'bg-[#1a3a5c] text-white'
                  : 'text-slate-600 hover:bg-slate-50',
              )}
              style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
            >
              <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <button
                type="button"
                onClick={() => onSelectItem(folder.id, item.id)}
                className="min-w-0 flex-1 truncate text-left"
              >
                {item.title}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HierarchyExplorer({
  subjectName,
  facultyLabel,
  categoryChips = [],
  categories = [],
  selectedCategoryId,
  selectedFolderId,
  selectedItemId,
  onSelectCategory,
  onSelectFolder,
  onSelectItem,
  onRenameFolder,
  onDeleteFolder,
  addingFolder,
  setAddingFolder,
  newFolderName,
  setNewFolderName,
  newFolderDescription,
  setNewFolderDescription,
  onConfirmAddFolder,
  mobileOpen,
  onCloseMobile,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [editingFolderId, setEditingFolderId] = useState(null)
  const [editValue, setEditValue] = useState('')

  const activeCategory = categories.find((c) => c.id === selectedCategoryId)

  const folders = useMemo(() => {
    const list = activeCategory?.folders || []
    return [...list].sort((a, b) => a.orderIndex - b.orderIndex)
  }, [activeCategory])

  const onToggleExpand = (id, forceOpen) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (forceOpen) next.add(id)
      else if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const displayTitle = facultyLabel
    ? `${subjectName} – ${facultyLabel.split(' ')[0]}`
    : subjectName

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-slate-200 bg-white',
        'lg:relative lg:translate-x-0',
        mobileOpen
          ? 'fixed inset-y-0 left-0 z-40 w-[min(100%,320px)] shadow-xl'
          : 'hidden lg:flex lg:w-[300px] xl:w-[320px]',
      )}
    >
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-[#1a3a5c]">{displayTitle}</h2>
            {categoryChips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {categoryChips.map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full bg-[#55ace7]/15 px-2 py-0.5 text-[10px] font-semibold text-[#246392]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
          {mobileOpen && (
            <button type="button" onClick={onCloseMobile} className="rounded-lg p-1 lg:hidden">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {categories.length > 0 && (
          <div className="mt-3 space-y-1" role="tree">
            {categories.map((cat) => {
              const isCatSelected = selectedCategoryId === cat.id
              const isExpanded = expandedIds.has(cat.id) || isCatSelected
              return (
                <div key={cat.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.id)
                      onToggleExpand(cat.id, true)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold transition',
                      isCatSelected
                        ? 'bg-[#eef2fc] text-[#1a3a5c]'
                        : 'text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    <Layers className="h-4 w-4 shrink-0 text-[#55ace7]" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                  {isExpanded && isCatSelected && (
                    <div className="ml-2 border-l border-slate-100 pl-1">
                      {selectedCategoryId === cat.id && (
                        <button
                          type="button"
                          onClick={() => setAddingFolder(true)}
                          className="mb-2 mt-1 flex w-full items-center justify-center gap-1 rounded-lg bg-[#1a3a5c] px-2 py-2 text-xs font-semibold text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Folder
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#55ace7]/70" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics..."
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50/80 py-2.5 pl-9 pr-4 text-sm text-[#1a3a5c] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#55ace7] focus:bg-white focus:ring-2 focus:ring-[#55ace7]/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {addingFolder && selectedCategoryId && (
          <div className="mb-2 rounded-lg border border-dashed border-[#55ace7]/40 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold text-[#246392]">New folder in {activeCategory?.label}</p>
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name *"
              className="mb-2 w-full rounded border px-2 py-1.5 text-xs"
            />
            <input
              type="text"
              value={newFolderDescription}
              onChange={(e) => setNewFolderDescription(e.target.value)}
              placeholder="Description (optional)"
              className="mb-2 w-full rounded border px-2 py-1.5 text-xs"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onConfirmAddFolder}
                className="flex-1 rounded bg-[#1a3a5c] py-1.5 text-xs font-semibold text-white"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setAddingFolder(false)}
                className="flex-1 rounded border py-1.5 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!selectedCategoryId ? (
          <p className="px-2 py-6 text-center text-xs text-slate-500">
            Expand Live Class, Recording, or Test Series above.
          </p>
        ) : folders.length === 0 && !addingFolder ? (
          <div className="px-3 py-8 text-center text-sm text-slate-500">
            <Folder className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p>No folders in {activeCategory?.label}.</p>
            <p className="mt-1 text-xs">Click Add Folder to create one.</p>
          </div>
        ) : (
          folders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              depth={0}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              selectedFolderId={selectedFolderId}
              selectedItemId={selectedItemId}
              onSelectFolder={onSelectFolder}
              onSelectItem={onSelectItem}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              editingFolderId={editingFolderId}
              setEditingFolderId={setEditingFolderId}
              editValue={editValue}
              setEditValue={setEditValue}
              searchQuery={searchQuery}
            />
          ))
        )}
      </div>
    </aside>
  )
}
