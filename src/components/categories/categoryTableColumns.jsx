import { CATEGORY_COL } from '../../utils/categoryUiStandards'

export function categoryIdColumn({ key = 'id', label = 'ID', getValue }) {
  return {
    key,
    label,
    headerClassName: CATEGORY_COL.idHeader,
    cellClassName: CATEGORY_COL.idCell,
    render: (row) => (
      <span className="font-mono text-sm font-semibold text-[#111]">
        {getValue ? getValue(row) : row[key]}
      </span>
    ),
  }
}

export function categoryNameColumn({ key = 'name', label, getValue }) {
  return {
    key,
    label,
    headerClassName: CATEGORY_COL.nameHeader,
    cellClassName: CATEGORY_COL.nameCell,
    render: (row) => (
      <span className="font-semibold text-[#111]">
        {getValue ? getValue(row) : row[key]}
      </span>
    ),
  }
}

export function categoryTruncatedTextColumn({
  key,
  label,
  getValue,
  textClassName = 'text-sm font-medium text-[#444]',
  accent = false,
}) {
  return {
    key,
    label,
    headerClassName: CATEGORY_COL.textHeader,
    cellClassName: CATEGORY_COL.textCell,
    render: (row) => {
      const value = getValue ? getValue(row) : row[key]
      const text = value || '—'
      return (
        <span
          className={`block truncate ${accent ? 'text-sm font-medium text-[#1a3a5c]' : textClassName}`}
          title={text !== '—' ? text : undefined}
        >
          {text}
        </span>
      )
    },
  }
}

export function categoryDateColumn({ key, label, formatFn }) {
  return {
    key,
    label,
    headerClassName: CATEGORY_COL.dateHeader,
    cellClassName: CATEGORY_COL.dateCell,
    render: (row) => (
      <span className="text-sm font-medium text-[#686868]">{formatFn(row[key])}</span>
    ),
  }
}

export function categoryStatusColumn(render) {
  return {
    key: 'status',
    label: 'Status',
    headerClassName: CATEGORY_COL.statusHeader,
    cellClassName: CATEGORY_COL.statusCell,
    render,
  }
}

export function categoryActionsColumn(render) {
  return {
    key: 'actions',
    label: 'Actions',
    align: 'right',
    headerClassName: CATEGORY_COL.actionsHeader,
    cellClassName: CATEGORY_COL.actionsCell,
    render,
  }
}
