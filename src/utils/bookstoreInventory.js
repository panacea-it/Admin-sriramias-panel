import { MOCK_BOOKSTORE_PRODUCTS, MOCK_INVENTORY_LOGS } from '../data/bookstoreMockData'

let inventoryLogSeq = MOCK_INVENTORY_LOGS.length

const FULFILLMENT_STATUSES = new Set(['Confirmed', 'Packed', 'Shipped', 'Delivered'])

function nextInventoryLogId() {
  inventoryLogSeq += 1
  return `LOG-${inventoryLogSeq}`
}

export function getSortedInventoryLogs() {
  return [...MOCK_INVENTORY_LOGS].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function recordInventoryMovement({ productId, change, reason, stockAfter, transactionId }) {
  if (!change || change === 0) return null

  if (transactionId) {
    const existing = MOCK_INVENTORY_LOGS.find((log) => log.transactionId === transactionId)
    if (existing) return existing
  }

  const log = {
    id: nextInventoryLogId(),
    productId,
    change,
    reason,
    stockAfter,
    createdAt: new Date().toISOString(),
    ...(transactionId ? { transactionId } : {}),
  }

  MOCK_INVENTORY_LOGS.unshift(log)
  return log
}

export function applyStockChange(productId, change, { reason, transactionId } = {}) {
  if (!change || change === 0) return null

  const product = MOCK_BOOKSTORE_PRODUCTS.find((p) => p.id === productId)
  if (!product) return null

  if (transactionId) {
    const existing = MOCK_INVENTORY_LOGS.find((log) => log.transactionId === transactionId)
    if (existing) return existing
  }

  product.stockQuantity += change

  return recordInventoryMovement({
    productId,
    change,
    reason,
    stockAfter: product.stockQuantity,
    transactionId,
  })
}

export function recordInitialStock(productId, quantity) {
  if (!quantity || quantity <= 0) return null

  return recordInventoryMovement({
    productId,
    change: quantity,
    reason: 'Initial Stock',
    stockAfter: quantity,
    transactionId: `initial-stock-${productId}`,
  })
}

export function recordProductStockAdjustment(productId, previousStock, nextStock) {
  const change = nextStock - previousStock
  if (!change) return null

  return recordInventoryMovement({
    productId,
    change,
    reason: 'Stock Adjustment',
    stockAfter: nextStock,
    transactionId: `product-stock-${productId}-${previousStock}-to-${nextStock}`,
  })
}

export function processOrderInventoryChange(order, previousStatus, newStatus) {
  if (!order?.items?.length) return

  const wasFulfilled = FULFILLMENT_STATUSES.has(previousStatus)
  const isFulfilled = FULFILLMENT_STATUSES.has(newStatus)

  if (!wasFulfilled && isFulfilled) {
    order.items.forEach((item) => {
      const qty = Number(item.qty) || 1
      if (!item.productId || qty <= 0) return
      applyStockChange(item.productId, -qty, {
        reason: `Order ${order.id}`,
        transactionId: `order-${order.id}-${item.productId}`,
      })
    })
    return
  }

  if (wasFulfilled && newStatus === 'Cancelled' && previousStatus !== 'Cancelled') {
    order.items.forEach((item) => {
      const qty = Number(item.qty) || 1
      if (!item.productId || qty <= 0) return
      applyStockChange(item.productId, qty, {
        reason: `Order ${order.id} cancelled`,
        transactionId: `order-cancel-${order.id}-${item.productId}`,
      })
    })
  }
}
