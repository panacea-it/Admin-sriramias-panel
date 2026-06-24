import { CART_RECOMMENDATION_PLACEMENT, CART_RECOMMENDATION_TITLE } from '../constants/bookstoreRecommendations'

export function calcDiscountPercent(originalPrice, discountPrice) {
  const orig = Number(originalPrice) || 0
  const disc = Number(discountPrice) || 0
  if (!orig || disc >= orig) return 0
  return Math.round(((orig - disc) / orig) * 100)
}

export function productById(products, id) {
  return products.find((p) => p.id === id)
}

export function productDisplayName(products, id) {
  return productById(products, id)?.name || id || '—'
}

export function mapProductsToRecommendationCards(products, ids, { bestsellerIds = [] } = {}) {
  return ids
    .map((id) => productById(products, id))
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      name: p.name,
      thumbnailUrl: p.thumbnailUrl || '',
      originalPrice: p.originalPrice,
      discountPrice: p.discountPrice,
      discountPercent: calcDiscountPercent(p.originalPrice, p.discountPrice),
      isBestseller: bestsellerIds.includes(p.id) || Boolean(p.isBestseller),
      subject: p.subject,
    }))
}

/**
 * Resolves active recommendation rules for the student cart API.
 * Picks the highest-priority (lowest priorityOrder) matching rule, then ordered product IDs.
 */
export function resolveCartRecommendations(rules, products, {
  sourceProductId,
  placement = CART_RECOMMENDATION_PLACEMENT,
  recommendationType = 'Cart Recommendations',
} = {}) {
  const matching = rules
    .filter(
      (r) =>
        r.status === 'active' &&
        r.sourceProductId === sourceProductId &&
        r.placement === placement &&
        r.recommendationType === recommendationType,
    )
    .sort((a, b) => (a.priorityOrder ?? 99) - (b.priorityOrder ?? 99))

  const rule = matching[0]
  if (!rule) {
    return { title: CART_RECOMMENDATION_TITLE, placement, products: [] }
  }

  const ids = rule.recommendedProductIds || rule.targetProductIds || []
  return {
    title: CART_RECOMMENDATION_TITLE,
    placement,
    recommendationType: rule.recommendationType,
    ruleId: rule.id,
    products: mapProductsToRecommendationCards(products, ids, {
      bestsellerIds: rule.bestsellerProductIds || [],
    }),
  }
}

export function emptyRecommendationRule() {
  return {
    sourceProductId: '',
    recommendedProductIds: [],
    status: 'active',
    bestsellerProductIds: [],
  }
}

export function normalizeRuleFromApi(rule) {
  return {
    ...rule,
    recommendedProductIds: rule.recommendedProductIds || rule.targetProductIds || [],
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  }
}
