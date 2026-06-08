import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Type,
  Underline,
  Undo2,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { validateUploadFile } from '../../utils/uploadValidation'

const BLOCK_OPTIONS = [
  { value: 'p', label: 'Paragraph', icon: Type },
  { value: 'h1', label: 'H1', icon: Heading1 },
  { value: 'h2', label: 'H2', icon: Heading2 },
  { value: 'h3', label: 'H3', icon: Heading3 },
  { value: 'h4', label: 'H4', icon: Heading4 },
]

function stripInlineStyles(html) {
  if (!html) return ''
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    doc.body.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('style')
      el.removeAttribute('class')
      el.removeAttribute('id')
    })
    return doc.body.innerHTML
  } catch {
    return html
  }
}

function ToolbarButton({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition',
        active ? 'bg-[#246392] text-white' : 'hover:bg-[#e8f4fc] hover:text-[#246392]',
      )}
    >
      {children}
    </button>
  )
}

export default function BlogRichEditor({ value = '', onChange, placeholder, minHeight = 200 }) {
  const editorRef = useRef(null)
  const fileRef = useRef(null)
  const [blockType, setBlockType] = useState('p')
  const [uploadError, setUploadError] = useState(null)
  const lastEmitted = useRef(value)

  const emitChange = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    const html = stripInlineStyles(el.innerHTML)
    lastEmitted.current = html
    onChange?.(html)
  }, [onChange])

  useEffect(() => {
    const el = editorRef.current
    if (!el || value === lastEmitted.current) return
    if (el.innerHTML !== value) {
      el.innerHTML = value || ''
      lastEmitted.current = value
    }
  }, [value])

  const exec = (command, arg = null) => {
    editorRef.current?.focus()
    document.execCommand(command, false, arg)
    emitChange()
  }

  const setBlock = (tag) => {
    setBlockType(tag)
    exec('formatBlock', tag === 'p' ? 'p' : tag)
  }

  const insertLink = () => {
    const url = window.prompt('Enter URL')
    if (url) exec('createLink', url)
  }

  const insertImage = () => fileRef.current?.click()

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await validateUploadFile(file, 'IMAGE_STANDARD')
    if (!result.valid) {
      setUploadError(result.message)
      e.target.value = ''
      return
    }
    setUploadError(null)
    const reader = new FileReader()
    reader.onload = () => {
      exec('insertImage', reader.result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-[#f8fafc] px-2 py-2">
        <select
          value={blockType}
          onChange={(e) => setBlock(e.target.value)}
          className="mr-1 h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#55ace7]"
          aria-label="Block type"
        >
          {BLOCK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <ToolbarButton title="Bold" onClick={() => exec('bold')}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => exec('italic')}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Underline" onClick={() => exec('underline')}>
          <Underline className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        <ToolbarButton title="Bullet list" onClick={() => exec('insertUnorderedList')}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" onClick={() => exec('insertOrderedList')}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Quote" onClick={() => exec('formatBlock', 'blockquote')}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Code block"
          onClick={() => {
            exec('formatBlock', 'pre')
          }}
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        <ToolbarButton title="Link" onClick={insertLink}>
          <Link className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Image" onClick={insertImage}>
          <Image className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        <ToolbarButton title="Undo" onClick={() => exec('undo')}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => exec('redo')}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        className={cn(
          'blog-rich-editor prose prose-sm max-w-none px-4 py-4 text-sm text-gray-800 outline-none',
          'empty:before:pointer-events-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)]',
          '[&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold',
          '[&_blockquote]:border-l-4 [&_blockquote]:border-[#93c5fd] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600',
          '[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs',
          '[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6',
          '[&_img]:max-h-64 [&_img]:rounded-lg',
        )}
        style={{ minHeight }}
        onInput={emitChange}
        onBlur={emitChange}
        suppressContentEditableWarning
      />

      <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleImageFile} />
      <UploadFieldHint profile="IMAGE_STANDARD" className="border-t border-gray-100 bg-[#fafcff] px-3 py-1.5" />
      <UploadValidationMessage message={uploadError} className="px-3 pb-2" />
    </div>
  )
}
