import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import courseRoutes from './routes/courseRoutes.js'
import batchRoutes from './routes/batchRoutes.js'
import batchEnrollmentRoutes from './routes/batchEnrollmentRoutes.js'
import financeRoutes from './routes/financeRoutes.js'
import salesAnalyticsRoutes from './routes/salesAnalyticsRoutes.js'
import classroomRoutes from './routes/classroomRoutes.js'
import bookstoreRoutes from './routes/bookstoreRoutes.js'
import contentLibraryRoutes from './routes/contentLibraryRoutes.js'
import facultySubjectContentRoutes from './routes/facultySubjectContentRoutes.js'
import evaluationOversightRoutes from './routes/evaluationOversightRoutes.js'
import testLanguageRoutes from './routes/testLanguageRoutes.js'
import testExamPatternRoutes from './routes/testExamPatternRoutes.js'
import testSectionConfigRoutes from './routes/testSectionConfigRoutes.js'
import youtubeVideoRoutes from './routes/youtubeVideoRoutes.js'
import rewardsRoutes from './routes/rewardsRoutes.js'
import masterBulkRoutes from './routes/masterBulkRoutes.js'
import { masterApiProxy } from './middleware/masterApiProxy.js'
import { getDashboardLegacy } from './controllers/rewardsController.js'
import { connectDB } from './config/db.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

const app = express()

/** Allowed browser origins (local dev + Vercel + custom domain) */
function getAllowedOrigins() {
  const fromEnv = [
    process.env.CLIENT_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.CLIENT_ORIGINS,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean)

  const origins = new Set(
    [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      ...fromEnv,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null,
    ].filter(Boolean),
  )
  return origins
}

const allowedOrigins = getAllowedOrigins()

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      if (allowedOrigins.has(origin)) return callback(null, true)
      if (/^https:\/\/[\w-]+\.vercel\.app$/i.test(origin)) return callback(null, true)
      if (/^https:\/\/[\w-]+--[\w-]+\.netlify\.app$/i.test(origin)) return callback(null, true)
      if (/^https:\/\/[\w-]+\.netlify\.app$/i.test(origin)) return callback(null, true)
      if (process.env.NODE_ENV !== 'production') return callback(null, true)
      return callback(null, false)
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))

/** Connect MongoDB once per serverless instance (cached across warm invocations) */
let dbReadyPromise = null
app.use(async (req, res, next) => {
  try {
    if (!dbReadyPromise) {
      dbReadyPromise = connectDB().catch((err) => {
        dbReadyPromise = null
        throw err
      })
    }
    await dbReadyPromise
    next()
  } catch (err) {
    console.error('Database connection failed:', err.message)
    res.status(503).json({
      success: false,
      message: 'Database unavailable',
      detail: process.env.NODE_ENV === 'production' ? undefined : err.message,
    })
  }
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
  })
})

/** Bulk status + master-management proxy (avoids browser CORS to remote API) */
app.use('/api', masterBulkRoutes)
app.use(masterApiProxy)

app.use('/api/courses', courseRoutes)
app.use('/api/batches', batchRoutes)
app.use('/api/batch-enrollments', batchEnrollmentRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/sales-analytics', salesAnalyticsRoutes)
app.use('/api/classrooms', classroomRoutes)
app.use('/api/bookstore', bookstoreRoutes)
app.use('/api/content-library', contentLibraryRoutes)
app.use('/api/faculty-subject-content', facultySubjectContentRoutes)
app.use('/api/evaluation-oversight', evaluationOversightRoutes)
app.use('/api/test-management/languages', testLanguageRoutes)
app.use('/api/test-management/exam-patterns', testExamPatternRoutes)
app.use('/api/test-management/section-configs', testSectionConfigRoutes)
app.use('/api/youtube-videos', youtubeVideoRoutes)
app.use('/api/rewards', rewardsRoutes)
app.get('/api/reward-dashboard', getDashboardLegacy)

app.use(notFound)
app.use(errorHandler)

export default app
