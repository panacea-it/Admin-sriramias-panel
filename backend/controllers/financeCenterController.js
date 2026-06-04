import {
  compareCenters,
  getCenterDashboard,
  getCenterPerformance,
  getCenterRanking,
  getOverallDashboard,
} from '../services/financeCenterService.js'

export async function overallDashboard(req, res, next) {
  try {
    const data = await getOverallDashboard(req.financeScope, req.query)
    res.json({ success: true, data })
  } catch (e) {
    next(e)
  }
}

export async function centerDashboard(req, res, next) {
  try {
    const { centerId } = req.params
    const centerName = req.query.centerName || ''
    const data = await getCenterDashboard(centerId, centerName, req.query)
    res.json({ success: true, data })
  } catch (e) {
    next(e)
  }
}

export async function compareCentersHandler(req, res, next) {
  try {
    const ids = String(req.query.centerIds || '')
      .split(',')
      .filter(Boolean)
    const names = String(req.query.centerNames || '')
      .split(',')
      .filter(Boolean)
    const data = await compareCenters(ids, names)
    res.json({ success: true, data })
  } catch (e) {
    next(e)
  }
}

export async function centerPerformance(req, res, next) {
  try {
    const data = await getCenterPerformance()
    res.json({ success: true, data })
  } catch (e) {
    next(e)
  }
}

export async function centerRanking(req, res, next) {
  try {
    const data = await getCenterRanking()
    res.json({ success: true, data })
  } catch (e) {
    next(e)
  }
}
