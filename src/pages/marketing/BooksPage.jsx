import { useMemo, useState } from 'react'
import { BookMarked } from 'lucide-react'
import EditButton from '../../components/common/EditButton'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import AddBookModal from '../../components/books/AddBookModal'
import AddMainBookModal from '../../components/books/AddMainBookModal'
import { BannerButton, ResourceNameCell, StatusBadge } from '../../components/academics/AcademicsUi'
import { INITIAL_BOOKS } from '../../data/booksData'
import { useEditModal } from '../../hooks/useEditModal'
import { bookFormToRow } from '../../utils/academicsFormMappers'
import { upsertListItem } from '../../utils/academicsCrud'

export default function BooksPage() {
  const [books, setBooks] = useState(INITIAL_BOOKS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const modal = useEditModal()
  const [mainBookOpen, setMainBookOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return books.filter((row) => {
      const matchSearch = !q || row.name.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [books, search, statusFilter])

  const handleSaveBook = (form, { isEdit, id }) => {
    const existing = isEdit ? books.find((b) => b.id === id) : null
    const row = bookFormToRow(form, existing)
    setBooks((prev) => upsertListItem(prev, row, { isEdit, id }))
  }

  const handleDelete = (id) => {
    setBooks((prev) => prev.filter((b) => b.id !== id))
    toast.success('Book deleted')
  }

  const columns = [
    {
      key: 'name',
      label: 'Book Name',
      headerClassName: 'pl-6 sm:pl-10',
      cellClassName: 'pl-6 sm:pl-10',
      render: (row) => <ResourceNameCell name={row.name} />,
    },
    {
      key: 'price',
      label: 'Price',
      render: (row) => <span className="whitespace-nowrap">{row.price}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <EditButton onClick={() => modal.openEdit(row)} />
          </div>
      ),
    },
  ]

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={BookMarked}
          iconClassName="text-[#dc2626]"
          title="Book Manager"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        >
          <BannerButton onClick={modal.openCreate}>Add New Book</BannerButton>
          <BannerButton onClick={() => setMainBookOpen(true)}>Add Main Book</BannerButton>
        </PageBanner>

        <CourseFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search Books"
          category=""
          onCategoryChange={() => {}}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
        />

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage="No books match your filters."
          itemLabel="books"
          resetDeps={[search, statusFilter]}
          rowClassName="hover:bg-slate-50/90"
        />
      </section>

      <AddBookModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        onSubmit={handleSaveBook}
      />

      <AddMainBookModal
        open={mainBookOpen}
        onClose={() => setMainBookOpen(false)}
        onSubmit={() => toast.success('Main book promotion saved')}
      />
    </div>
  )
}
