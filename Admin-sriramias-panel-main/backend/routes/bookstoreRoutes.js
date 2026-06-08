import { Router } from 'express'
import {
  getDashboard,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getInventory,
  restockProduct,
  listCombos,
  createCombo,
  listBundles,
  createBundle,
  listOrders,
  patchOrderStatus,
  listPayments,
  listWallet,
  listRecommendations,
  getCartRecommendations,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
  listInvoices,
  getReports,
} from '../controllers/bookstoreController.js'

const router = Router()

router.get('/dashboard', getDashboard)
router.get('/products', listProducts)
router.post('/products', createProduct)
router.put('/products/:id', updateProduct)
router.delete('/products/:id', deleteProduct)
router.get('/inventory', getInventory)
router.post('/inventory/:id/restock', restockProduct)
router.get('/combos', listCombos)
router.post('/combos', createCombo)
router.put('/combos/:id', createCombo)
router.get('/bundles', listBundles)
router.post('/bundles', createBundle)
router.put('/bundles/:id', createBundle)
router.get('/orders', listOrders)
router.patch('/orders/:id/status', patchOrderStatus)
router.get('/payments', listPayments)
router.get('/wallet', listWallet)
router.get('/recommendations', listRecommendations)
router.get('/recommendations/cart', getCartRecommendations)
router.post('/recommendations', createRecommendation)
router.put('/recommendations/:id', updateRecommendation)
router.delete('/recommendations/:id', deleteRecommendation)
router.get('/invoices', listInvoices)
router.get('/reports', getReports)

export default router
