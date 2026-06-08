import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { buildFolderTree } from '../../utils/facultySubjectContentStorage'

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
      <button
        type="button"
        onClick={onConfirm}
        className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
        aria-label="Confirm"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded p-1 text-slate-400 hover:bg-slate-100"
        aria-label="Cancel"
      >
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
  selectedTopicId,
  onSelectFolder,
  onSelectTopic,
  onRenameFolder,
  onDeleteFolder,
  onAddTopic,
  onRenameTopic,
  onDeleteTopic,
  editingFolderId,
  setEditingFolderId,
  editingTopicId,
  setEditingTopicId,
  editValue,
  setEditValue,
  addingTopicFolderId,
  setAddingTopicFolderId,
  newTopicName,
  setNewTopicName,
  onConfirmAddTopic,
  searchQuery,
}) {
  const isExpanded = expandedIds.has(folder.id)
  const isSelected = selectedFolderId === folder.id && !selectedTopicId
  const q = searchQuery.toLowerCase().trim()

  const visibleTopics = (folder.topics || []).filter(
    (t) => !q || t.topicName.toLowerCase().includes(q),
  )

  const childFolders = folder.childFolders || []
  const hasVisibleChildren =
    childFolders.length > 0 ||
    visibleTopics.length > 0 ||
    (q && folder.folderName.toLowerCase().includes(q))

  if (q && !hasVisibleChildren && !folder.folderName.toLowerCase().includes(q)) {
    return null
  }

  return (
    <div className="select-none">
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md px-1 py-1 text-sm transition',
          isSelected && !selectedTopicId
            ? 'bg-[#1a3a5c]/10 text-[#1a3a5c]'
            : 'text-slate-700 hover:bg-slate-50',
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          onClick={() => onToggleExpand(folder.id)}
          className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
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
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            title="Add topic"
            onClick={() => {
              onToggleExpand(folder.id, true)
              setAddingTopicFolderId(folder.id)
              setNewTopicName('')
            }}
            className="rounded p-1 text-[#246392] hover:bg-slate-100"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            type="button"
            title="Rename folder"
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
            title="Delete folder"
            onClick={() => onDeleteFolder(folder.id)}
            className="rounded p-1 text-[#c96565] hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div>
          {addingTopicFolderId === folder.id && (
            <div style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }} className="py-1 pr-2">
              <InlineInput
                value={newTopicName}
                onChange={setNewTopicName}
                onConfirm={() => onConfirmAddTopic(folder.id)}
                onCancel={() => setAddingTopicFolderId(null)}
                placeholder="Topic name"
              />
            </div>
          )}
          {visibleTopics.map((topic) => (
            <div
              key={topic.id}
              className={cn(
                'group flex items-center gap-1.5 rounded-md py-1 text-sm transition',
                selectedTopicId === topic.id
                  ? 'bg-[#1a3a5c] text-white'
                  : 'text-slate-600 hover:bg-slate-50',
              )}
              style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
            >
              <FileText
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  selectedTopicId === topic.id ? 'text-white/90' : 'text-slate-400',
                )}
              />
              {editingTopicId === topic.id ? (
                <div className="min-w-0 flex-1">
                  <InlineInput
                    value={editValue}
                    onChange={setEditValue}
                    onConfirm={() => onRenameTopic(folder.id, topic.id, editValue)}
                    onCancel={() => setEditingTopicId(null)}
                    placeholder="Topic name"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectTopic(folder.id, topic.id)}
                  className="min-w-0 flex-1 truncate text-left"
                >
                  {topic.topicName}
                </button>
              )}
              <div
                className={cn(
                  'flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100',
                  selectedTopicId === topic.id && 'opacity-100',
                )}
              >
                <button
                  type="button"
                  title="Rename topic"
                  onClick={() => {
                    setEditingTopicId(topic.id)
                    setEditValue(topic.topicName)
                  }}
                  className={cn(
                    'rounded p-1 hover:bg-white/10',
                    selectedTopicId === topic.id ? 'text-white' : 'text-slate-500',
                  )}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  title="Delete topic"
                  onClick={() => onDeleteTopic(folder.id, topic.id)}
                  className={cn(
                    'rounded p-1 hover:bg-white/10',
                    selectedTopicId === topic.id ? 'text-white' : 'text-[#c96565]',
                  )}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          {childFolders.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              selectedFolderId={selectedFolderId}
              selectedTopicId={selectedTopicId}
              onSelectFolder={onSelectFolder}
              onSelectTopic={onSelectTopic}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onAddTopic={onAddTopic}
              onRenameTopic={onRenameTopic}
              onDeleteTopic={onDeleteTopic}
              editingFolderId={editingFolderId}
              setEditingFolderId={setEditingFolderId}
              editingTopicId={editingTopicId}
              setEditingTopicId={setEditingTopicId}
              editValue={editValue}
              setEditValue={setEditValue}
              addingTopicFolderId={addingTopicFolderId}
              setAddingTopicFolderId={setAddingTopicFolderId}
              newTopicName={newTopicName}
              setNewTopicName={setNewTopicName}
              onConfirmAddTopic={onConfirmAddTopic}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FolderExplorer({
  subjectName,
  categories = [],
  folders,
  selectedFolderId,
  selectedTopicId,
  onSelectFolder,
  onSelectTopic,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onAddTopic,
  onRenameTopic,
  onDeleteTopic,
  addingFolder,
  setAddingFolder,
  newFolderName,
  setNewFolderName,
  newFolderDescription,
  setNewFolderDescription,
  onConfirmAddFolder,
  parentFolderIdForNew,
  setParentFolderIdForNew,
  mobileOpen,
  onCloseMobile,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [editingFolderId, setEditingFolderId] = useState(null)
  const [editingTopicId, setEditingTopicId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [addingTopicFolderId, setAddingTopicFolderId] = useState(null)
  const [newTopicName, setNewTopicName] = useState('')

  const tree = useMemo(() => buildFolderTree(folders), [folders])

  const onToggleExpand = (folderId, forceOpen) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (forceOpen) {
        next.add(folderId)
        return next
      }
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  const handleConfirmAddTopic = (folderId) => {
    if (!newTopicName.trim()) return
    onAddTopic(folderId, newTopicName.trim())
    setAddingTopicFolderId(null)
    setNewTopicName('')
    onToggleExpand(folderId, true)
  }

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
            <h2 className="truncate text-base font-bold text-[#1a3a5c]">{subjectName}</h2>
            {categories.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {categories.map((cat) => (
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
            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setParentFolderIdForNew(null)
              setAddingFolder(true)
              setNewFolderName('')
              setNewFolderDescription('')
            }}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#1a3a5c] px-2 py-2 text-xs font-semibold text-white hover:bg-[#152f4a]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Folder
          </button>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-xs focus:border-[#55ace7] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {addingFolder && (
          <div className="mb-2 rounded-lg border border-dashed border-[#55ace7]/40 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold text-[#246392]">
              {parentFolderIdForNew ? 'New subfolder' : 'New folder'}
            </p>
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name *"
              className="mb-2 w-full rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-[#55ace7] focus:outline-none"
            />
            <input
              type="text"
              value={newFolderDescription}
              onChange={(e) => setNewFolderDescription(e.target.value)}
              placeholder="Description (optional)"
              className="mb-2 w-full rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-[#55ace7] focus:outline-none"
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
                className="flex-1 rounded border border-slate-200 py-1.5 text-xs font-medium text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {tree.length === 0 && !addingFolder ? (
          <div className="px-3 py-8 text-center text-sm text-slate-500">
            <Folder className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p>No folders yet.</p>
            <p className="mt-1 text-xs">Click Add Folder to start building your syllabus.</p>
          </div>
        ) : (
          tree.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              depth={0}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              selectedFolderId={selectedFolderId}
              selectedTopicId={selectedTopicId}
              onSelectFolder={onSelectFolder}
              onSelectTopic={onSelectTopic}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onAddTopic={onAddTopic}
              onRenameTopic={onRenameTopic}
              onDeleteTopic={onDeleteTopic}
              editingFolderId={editingFolderId}
              setEditingFolderId={setEditingFolderId}
              editingTopicId={editingTopicId}
              setEditingTopicId={setEditingTopicId}
              editValue={editValue}
              setEditValue={setEditValue}
              addingTopicFolderId={addingTopicFolderId}
              setAddingTopicFolderId={setAddingTopicFolderId}
              newTopicName={newTopicName}
              setNewTopicName={setNewTopicName}
              onConfirmAddTopic={handleConfirmAddTopic}
              searchQuery={searchQuery}
            />
          ))
        )}
      </div>
    </aside>
  )
}
