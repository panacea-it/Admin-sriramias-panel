const SOURCE_CYCLE = ['website', 'counselor', 'referral', 'offline_center']

function hashSeed(str) {
  let h = 0
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 9973
  return h
}

function pickFromCycle(id, cycle) {
  return cycle[hashSeed(id) % cycle.length]
}

function computeFinanceHealth(totalFees, totalPaid, totalPending) {
  if (totalFees <= 0) return 'partial'
  const pctPaid = totalPaid / totalFees
  if (totalPending <= 0 || pctPaid >= 0.99) return 'paid'
  if (pctPaid >= 0.5 && totalPending / totalFees < 0.35) return 'partial'
  return 'high'
}

function deriveLoanFromEmi(emiPlan, payments) {
  if (!emiPlan) {
    const hasEmi = payments.some((p) => p.paymentType === 'EMI')
    if (!hasEmi) {
      return { loanProvider: '', loanStatus: 'Not Applied', loanAmount: 0, approvedAmount: 0, disbursedAmount: 0, outstandingAmount: 0, providerRefId: '', providerRemarks: '', approvalTimeline: [] }
    }
    return {
      loanProvider: 'Institute EMI',
      loanStatus: 'Applied',
      loanAmount: payments[0]?.pendingAmount || 0,
      approvedAmount: 0,
      disbursedAmount: 0,
      outstandingAmount: payments[0]?.pendingAmount || 0,
      providerRefId: '',
      providerRemarks: 'Application in progress',
      approvalTimeline: [],
    }
  }
  return {
    loanProvider: emiPlan.loanProvider || 'Institute EMI',
    loanStatus: emiPlan.providerStatus || emiPlan.planStatus || 'EMI Active',
    loanAmount: emiPlan.loanAmount || emiPlan.totalFees || 0,
    approvedAmount: emiPlan.loanAmount || emiPlan.totalFees || 0,
    disbursedAmount: emiPlan.totalPaid || 0,
    outstandingAmount: emiPlan.pendingAmount || 0,
    providerRefId: emiPlan.providerRefId || '',
    providerRemarks: emiPlan.settlementRemarks || '',
    approvalTimeline: (emiPlan.planHistory || []).map((h) => ({
      step: h.action,
      detail: h.by ? `By ${h.by}` : '',
      timestamp: h.at,
      status: 'completed',
    })),
  }
}

export function buildProfilesFromPayments(payments) {
  const byStudent = new Map()
  for (const p of payments) {
    if (!p.studentId) continue
    const courseEntry = {
      courseId: p.courseId,
      courseName: p.courseName,
      courseType: p.courseType,
      paymentStatus: p.paymentStatus === 'Paid' ? 'Active' : p.paymentStatus === 'Partial' ? 'Pending Payment' : 'Pending Payment',
      date: p.paymentDate || '',
      paymentType: p.paymentType,
      paidAmount: p.amountPaid,
      pendingAmount: p.pendingAmount,
    }
    const existing = byStudent.get(p.studentId)
    if (existing) {
      existing.totalPaid += p.amountPaid || 0
      existing.totalPending += p.pendingAmount || 0
      existing.courses.push(courseEntry)
    } else {
      byStudent.set(p.studentId, {
        id: p.studentId,
        studentName: p.studentName,
        mobile: p.mobile,
        email: p.email,
        branch: p.branch,
        totalPaid: p.amountPaid || 0,
        totalPending: p.pendingAmount || 0,
        courses: [courseEntry],
      })
    }
  }
  return [...byStudent.values()]
}

export function enrichStudentProfile(base, payments, emiPlans) {
  const studentPayments = payments.filter((p) => p.studentId === base.id)
  const emiPlan = emiPlans.find((e) => e.studentId === base.id)
  const totalPaid = studentPayments.reduce((s, p) => s + (p.amountPaid || 0), 0) || base.totalPaid || 0
  const totalPending = studentPayments.reduce((s, p) => s + (p.pendingAmount || 0), 0) || base.totalPending || 0
  const totalFees = studentPayments.reduce((s, p) => s + (p.totalFees || 0), 0) || totalPaid + totalPending
  const gst = studentPayments.reduce((s, p) => s + (p.gst || 0), 0)
  const scholarshipAmount = Math.round(totalFees * 0.05 * (hashSeed(base.id) % 3))
  const discountAmount = Math.round(totalFees * 0.03 * (hashSeed(`${base.id}x`) % 2))
  const refundAmount = studentPayments.reduce((s, p) => s + (p.refundAmount || 0), 0)
  const walletBalance = (hashSeed(base.id) % 5) * 500
  const sourceId = pickFromCycle(base.id, SOURCE_CYCLE)
  const loan = deriveLoanFromEmi(emiPlan, studentPayments)
  const primaryCourse = studentPayments[0]?.courseName || base.courses?.[0]?.courseName || '—'

  const profile = {
    ...base,
    studentId: base.id,
    primaryCourse,
    totalFees,
    scholarshipAmount,
    discountAmount,
    totalPaid,
    totalPending,
    activeEmiAmount: emiPlan?.pendingAmount || 0,
    refundAmount,
    walletBalance,
    enrollmentSource: sourceId,
    enrollmentSourceLabel: sourceId.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    referredBy: sourceId === 'referral' ? 'Alumni Network' : '',
    counselorName: emiPlan?.counselorName || '',
    enrollmentDate: studentPayments[0]?.registrationDate || base.courses?.[0]?.date,
    feeBreakdown: {
      courseFee: Math.max(0, totalFees - gst - 8000),
      admissionFee: 5000,
      materialFee: 3000,
      gstTax: gst,
      scholarshipAmount,
      discountAmount,
      additionalCharges: 0,
      refundAdjustments: refundAmount,
      totalFees,
      revisions: [{ id: 'rev-1', label: 'Initial fee assignment', amount: totalFees, at: studentPayments[0]?.registrationDate || new Date().toISOString(), by: 'System' }],
    },
    loan,
    emiStatus: emiPlan?.planStatus || emiPlan?.status || '—',
    loanStatus: loan.loanStatus,
    healthLevel: computeFinanceHealth(totalFees, totalPaid, totalPending),
    paymentProgress: totalFees ? Math.min(100, Math.round((totalPaid / totalFees) * 100)) : 0,
    riskScore: Math.min(100, Math.round((totalPending / Math.max(totalFees, 1)) * 60 + (studentPayments.length ? 10 : 30))),
    updatedAt: studentPayments.map((p) => p.paymentDate).filter(Boolean).sort().reverse()[0] || new Date().toISOString(),
  }

  return profile
}

export function buildEnrichedProfiles(payments, emiPlans) {
  const bases = buildProfilesFromPayments(payments)
  return bases.map((b) => enrichStudentProfile(b, payments, emiPlans))
}

export function buildProfileDetail(studentId, payments, emiPlans) {
  const bases = buildProfilesFromPayments(payments)
  const base = bases.find((b) => b.id === studentId)
  if (!base) return null
  const profile = enrichStudentProfile(base, payments, emiPlans)
  const studentPayments = payments.filter((p) => p.studentId === studentId)
  const emiPlan = emiPlans.find((e) => e.studentId === studentId)

  profile.walletTransactions = [
    { id: `WLT-${studentId}-1`, type: 'Credit', amount: profile.walletBalance, remarks: 'Wallet balance', at: new Date().toISOString(), by: 'System', balanceAfter: profile.walletBalance },
  ]
  profile.documents = [
    { id: `DOC-${studentId}-aadhaar`, type: 'aadhaar', label: 'Aadhaar', fileName: 'aadhaar.pdf', uploadedAt: new Date().toISOString(), status: 'uploaded' },
    { id: `DOC-${studentId}-fee`, type: 'fee_agreement', label: 'Fee Agreement', fileName: 'fee-agreement.pdf', uploadedAt: new Date().toISOString(), status: 'uploaded' },
  ]
  if (emiPlan?.agreements?.length) {
    profile.documents.push({
      id: emiPlan.agreements[0].id,
      type: 'loan_agreement',
      label: 'Loan Agreement',
      fileName: emiPlan.agreements[0].fileName,
      uploadedAt: emiPlan.agreements[0].uploadedAt,
      status: 'uploaded',
    })
  }
  profile.refunds = profile.refundAmount
    ? [{ id: `REF-${studentId}`, amount: profile.refundAmount, reason: 'Adjustment', mode: 'Wallet', status: 'Processed', requestedAt: profile.updatedAt, processedDate: profile.updatedAt, approvedBy: 'Finance Admin' }]
    : []
  profile.notifications = []
  if (profile.totalPending > 0) {
    profile.notifications.push({ id: `NTF-${studentId}-1`, type: 'pending_payment', title: 'Pending payment', message: 'Outstanding balance', channel: 'In-app', read: false, at: new Date().toISOString() })
  }
  profile.timeline = studentPayments.flatMap((p) =>
    (p.timeline || []).map((t, i) => ({
      id: `${p.id}-${i}`,
      actionType: 'payment',
      label: t.event,
      detail: p.courseName,
      at: t.timestamp,
      by: 'System',
    })),
  )
  profile.analytics = {
    riskScore: profile.riskScore,
    reliabilityScore: 100 - profile.riskScore,
    behaviorLabel: profile.riskScore >= 70 ? 'High Risk' : profile.riskScore >= 45 ? 'Moderate Risk' : 'Good',
    preferredPaymentMode: studentPayments[0]?.paymentMode || 'UPI',
    insights: profile.totalPending > 0 ? ['Outstanding dues on account'] : ['Account in good standing'],
    monthlyTrend: [],
    emiCompletion: (emiPlan?.installments || []).map((inst) => ({ label: `EMI ${inst.emiNo}`, value: inst.status === 'Paid' ? 100 : 40 })),
  }
  return profile
}
