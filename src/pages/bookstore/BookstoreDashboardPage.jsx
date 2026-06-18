import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  IndianRupee,
  ShoppingCart,
  Clock,
  Truck,
  AlertTriangle,
  Users,
  TrendingUp,
  FolderOpen,
  Download,
  Star,
  ArrowUp,
  ArrowDown,
  PackagePlus,
  Medal,
} from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreDashboardSkeleton from '../../components/bookstore/BookstoreDashboardSkeleton'
import BookstoreDashboardKpiCard from '../../components/bookstore/dashboard/BookstoreDashboardKpiCard'
import {
  RevenueAreaChart,
  ProductSalesBarChart,
  OrderTrendsLineChart,
  ComboPerformancePieChart,
} from '../../components/bookstore/dashboard/BookstoreDashboardCharts'
import BookstoreDashboardDataTable from '../../components/bookstore/dashboard/BookstoreDashboardDataTable'
import { useBookstoreDashboard } from '../../hooks/bookstore/useBookstoreDashboard'
import { BOOKSTORE_ROUTES } from '../../constants/bookstoreNav'
import { formatINR } from '../../utils/financeFilters'
import { exportToCsv } from '../../utils/financeExport'
import { cn } from '../../utils/cn'
import { toast } from '../../utils/toast'
import '../../components/bookstore/dashboard/bookstoreDashboard.css'

const STOCK_STATUS_STYLES = {
  Critical: 'bg-red-100 text-red-800 ring-red-200',
  Low: 'bg-orange-100 text-orange-900 ring-orange-200',
  'Reorder Needed': 'bg-amber-100 text-amber-900 ring-amber-200',
  Safe: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
}

function StockStatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
        STOCK_STATUS_STYLES[status] || STOCK_STATUS_STYLES.Safe,
      )}
    >
      {status}
    </span>
  )
}

function RankMedal({ rank }) {
  if (rank === 1) return <Medal className="h-5 w-5 text-amber-500" />
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7c5cbf]/10 text-sm font-bold text-[#7c5cbf]">
      {rank}
    </span>
  )
}

export default function BookstoreDashboardPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { data, loading } = useBookstoreDashboard({ dateFrom, dateTo })

  const stats = data?.stats
  const trends = data?.kpiTrends || {}
  const sparks = data?.sparklines || {}

  const lowStockFilterOptions = ['Critical', 'Low', 'Reorder Needed', 'Safe']

  const lowStockColumns = useMemo(
    () => [
      { key: 'sku', label: 'SKU', className: 'min-w-[100px]' },
      {
        key: 'productName',
        label: 'Product Name',
        className: 'min-w-[220px]',
        render: (r) => <span className="font-semibold text-[#111]">{r.productName}</span>,
      },
      { key: 'category', label: 'Category', className: 'min-w-[130px]' },
      {
        key: 'currentStock',
        label: 'Current Stock',
        className: 'min-w-[110px]',
        sortable: true,
        render: (r) => (
          <span
            className={cn(
              'font-bold',
              r.currentStock <= 5 ? 'text-red-600' : r.currentStock <= 15 ? 'text-orange-600' : 'text-[#111]',
            )}
          >
            {r.currentStock}
          </span>
        ),
      },
      {
        key: 'minimumStock',
        label: 'Minimum Stock',
        className: 'min-w-[120px]',
        sortable: true,
      },
      { key: 'supplier', label: 'Supplier', className: 'min-w-[150px]' },
      {
        key: 'lastUpdated',
        label: 'Last Updated',
        className: 'min-w-[120px]',
        render: (r) => new Date(r.lastUpdated).toLocaleDateString('en-IN'),
      },
      {
        key: 'status',
        label: 'Status',
        className: 'min-w-[130px]',
        render: (r) => <StockStatusBadge status={r.status} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        className: 'min-w-[140px]',
        render: (r) => (
          <div className="flex gap-2">
            <Link
              to={BOOKSTORE_ROUTES.inventory}
              className="inline-flex items-center gap-1 rounded-lg bg-[#7c5cbf] px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              <PackagePlus className="h-3.5 w-3.5" />
              Restock
            </Link>
            <button
              type="button"
              onClick={() => toast.info(`Reorder suggested for ${r.productName}`)}
              className="rounded-lg border border-[#e8eaed] px-2.5 py-1.5 text-xs font-semibold text-[#686868] hover:bg-[#f7f7f7]"
            >
              PO
            </button>
          </div>
        ),
      },
    ],
    [],
  )

  const maxUnits = useMemo(
    () => Math.max(...(data?.bestSellers || []).map((b) => b.unitsSold), 1),
    [data?.bestSellers],
  )

  const bestSellerColumns = useMemo(
    () => [
      {
        key: 'rank',
        label: 'Rank',
        className: 'min-w-[72px]',
        sortable: true,
        render: (r) => <RankMedal rank={r.rank} />,
      },
      {
        key: 'thumbnail',
        label: 'Thumbnail',
        className: 'min-w-[90px]',
        render: () => (
          <div className="flex h-12 w-10 items-center justify-center rounded-lg border border-[#e8eaed] bg-gradient-to-br from-[#7c5cbf]/15 to-[#55ace7]/10 text-lg shadow-sm">
            📖
          </div>
        ),
      },
      {
        key: 'name',
        label: 'Product Name',
        className: 'min-w-[240px]',
        render: (r) => (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#111]">{r.name}</span>
            {r.isTopSeller && (
              <span className="shrink-0 rounded-full bg-gradient-to-r from-[#7c5cbf] to-[#4a3d8f] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Bestseller
              </span>
            )}
          </div>
        ),
      },
      { key: 'category', label: 'Category', className: 'min-w-[130px]' },
      {
        key: 'unitsSold',
        label: 'Units Sold',
        className: 'min-w-[160px]',
        sortable: true,
        render: (r) => (
          <div className="min-w-[120px]">
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-bold text-[#111]">{r.unitsSold}</span>
              <span className="text-[#686868]">{Math.round((r.unitsSold / maxUnits) * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#eef0f4]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#55ace7] to-[#7c5cbf]"
                style={{ width: `${(r.unitsSold / maxUnits) * 100}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        key: 'revenue',
        label: 'Revenue',
        className: 'min-w-[120px]',
        sortable: true,
        render: (r) => <span className="font-bold text-[#7c5cbf]">{formatINR(r.revenue)}</span>,
      },
      {
        key: 'rating',
        label: 'Rating',
        className: 'min-w-[100px]',
        sortable: true,
        render: (r) => (
          <span className="inline-flex items-center gap-1 text-amber-600">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-semibold">{r.rating}</span>
          </span>
        ),
      },
      {
        key: 'trend',
        label: 'Trend',
        className: 'min-w-[100px]',
        render: (r) => (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-sm font-semibold',
              r.trend === 'up' ? 'text-emerald-600' : 'text-red-600',
            )}
          >
            {r.trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            {r.trendPercent}%
          </span>
        ),
      },
    ],
    [maxUnits],
  )

  if (loading) {
    return (
      <BookstorePageShell icon={LayoutDashboard} title="Bookstore Dashboard">
        <BookstoreDashboardSkeleton />
      </BookstorePageShell>
    )
  }

  return (
    <BookstorePageShell
      icon={LayoutDashboard}
      title="Bookstore Dashboard"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-white/30 bg-white/10 px-2 py-1 text-xs text-white"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-white/30 bg-white/10 px-2 py-1 text-xs text-white"
          />
        </div>
      }
    >
      <div className="min-w-0 space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <BookstoreDashboardKpiCard
            sparkId="revenue"
            label="Total Revenue"
            value={formatINR(stats?.totalRevenue)}
            icon={IndianRupee}
            trend={trends.totalRevenue}
            sparkData={sparks.totalRevenue}
          />
          <BookstoreDashboardKpiCard
            sparkId="orders"
            label="Total Orders"
            value={stats?.totalOrders}
            icon={ShoppingCart}
            trend={trends.totalOrders}
            sparkData={sparks.totalOrders}
            accent="from-[#55ace7] via-[#4a8fc9] to-[#246392]"
          />
          <BookstoreDashboardKpiCard
            sparkId="pending"
            label="Pending Orders"
            value={stats?.pendingOrders}
            icon={Clock}
            trend={trends.pendingOrders}
            sparkData={sparks.pendingOrders}
            accent="from-[#e67e22] via-[#d35400] to-[#c0392b]"
          />
          <BookstoreDashboardKpiCard
            sparkId="delivered"
            label="Delivered Orders"
            value={stats?.deliveredOrders}
            icon={Truck}
            trend={trends.deliveredOrders}
            sparkData={sparks.deliveredOrders}
            accent="from-[#2d9d78] via-[#27ae60] to-[#1a6b52]"
          />
          <BookstoreDashboardKpiCard
            sparkId="lowstock"
            label="Low Stock Products"
            value={stats?.lowStockProducts}
            icon={AlertTriangle}
            trend={trends.lowStockProducts}
            accent="from-[#e74c3c] via-[#c0392b] to-[#922b21]"
          />
          <BookstoreDashboardKpiCard
            sparkId="customers"
            label="Total Customers"
            value={stats?.totalCustomers?.toLocaleString('en-IN')}
            icon={Users}
            trend={trends.totalCustomers}
            accent="from-[#8b98bb] via-[#7c8aa8] to-[#686868]"
          />
          <BookstoreDashboardKpiCard
            sparkId="growth"
            label="Monthly Growth"
            value={`${stats?.monthlyGrowth}%`}
            icon={TrendingUp}
            trend={trends.monthlyGrowth}
            accent="from-[#9b59b6] via-[#7c5cbf] to-[#4a3d8f]"
          />
          <BookstoreDashboardKpiCard
            sparkId="category"
            label="Best Selling Category"
            value={stats?.bestSellingCategory}
            icon={FolderOpen}
            trend={trends.bestSellingCategory}
            accent="from-[#df8284] via-[#c96b6d] to-[#a85557]"
          />
        </section>

        <section className="grid min-w-0 gap-5 lg:grid-cols-2">
          <RevenueAreaChart data={data?.revenueChart} weekTotal={stats?.weekRevenue} />
          <ProductSalesBarChart data={data?.productSalesChart} />
          <OrderTrendsLineChart data={data?.orderTrends} />
          <ComboPerformancePieChart data={data?.comboPerformance} />
        </section>

        <section className="min-w-0 space-y-5">
          <BookstoreDashboardDataTable
            title="Low Stock Alerts"
            subtitle="Monitor inventory levels and reorder before stockouts"
            columns={lowStockColumns}
            data={data?.lowStockAlerts || []}
            searchKeys={['sku', 'productName', 'category', 'supplier']}
            searchPlaceholder="Search SKU, product, supplier…"
            filterOptions={lowStockFilterOptions}
            filterKey="status"
            minTableWidth={1280}
            maxHeight="max-h-[500px]"
            onExport={() =>
              exportToCsv(data?.lowStockAlerts || [], 'bookstore-low-stock.csv')
            }
          />

          <BookstoreDashboardDataTable
            title="Best Sellers"
            subtitle="Top performing products by units sold and revenue"
            columns={bestSellerColumns}
            data={data?.bestSellers || []}
            searchKeys={['name', 'category', 'sku']}
            searchPlaceholder="Search product, category…"
            minTableWidth={1320}
            maxHeight="max-h-[500px]"
            onExport={() => exportToCsv(data?.bestSellers || [], 'bookstore-best-sellers.csv')}
          />
        </section>
      </div>
    </BookstorePageShell>
  )
}
