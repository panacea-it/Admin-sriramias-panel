import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FINANCE_COURSES } from '../data/financeMockData'
import { getStudentCourseFinancials } from '../data/studentCourseFeeProfiles'
import { VERIFICATION_STUDENT_OPTIONS } from '../data/financeVerificationData'
import { OFFLINE_SUBMIT_ACTIONS } from '../constants/offlinePaymentEmi'
import {
  applyEarlyEmiClosure,
  computeOpenEmiBalance,
  generateEmiSchedule,
  getEmiMonthLabel,
  rebalanceInstallmentAmounts,
  validateEmiPlan,
} from '../utils/emiSchedule'
import { validateStudentProfile } from '../utils/offlinePaymentValidation'
import { toast } from '../utils/toast'

const CENTER_OPTIONS = [
  'Delhi Center',
  'Mumbai Center',
  'Bangalore Center',
  'Chennai Center',
  'Hyderabad Center',
]

const DEFAULT_FORM = {
  paymentId: '',
  paymentMode: 'UPI',
  amount: '',
  utrNumber: '',
  paymentDate: '',
  remarks: '',
}

const DEFAULT_EMI_CONFIG = {
  installmentCount: 6,
  durationPreset: '6',
  downPayment: '',
  startDate: '',
  frequency: 'monthly',
}

const DEFAULT_STUDENT_PROFILE = {
  studentId: '',
  studentName: '',
  mobile: '',
  email: '',
  centerName: '',
  courseId: '',
  batchId: '',
  batchName: '',
  customFee: '',
  isWalkIn: false,
}

function buildFinancialsFromProfile(profile) {
  if (!profile?.courseId) return null
  const lookupId =
    profile.studentId && !profile.isWalkIn ? profile.studentId : 'STU-24001'
  const base = getStudentCourseFinancials(lookupId, profile.courseId)
  if (!base) return null

  let pendingAmount = base.pendingAmount
  if (profile.isWalkIn && profile.customFee) {
    pendingAmount = Math.max(0, Number(profile.customFee) || 0)
  }

  return {
    ...base,
    studentId: profile.studentId || 'WALKIN',
    studentName: profile.studentName?.trim() || base.studentName,
    centerName: profile.centerName || base.centerName,
    mobile: profile.mobile || '',
    email: profile.email || '',
    pendingAmount,
  }
}

export function useOfflinePaymentEmiForm({ open, initialStudentProfile } = {}) {
  const [paymentType, setPaymentType] = useState('full')
  const [studentProfile, setStudentProfile] = useState(DEFAULT_STUDENT_PROFILE)
  const [financials, setFinancials] = useState(null)
  const [installments, setInstallments] = useState([])
  const [emiConfig, setEmiConfig] = useState(DEFAULT_EMI_CONFIG)
  const [emiPlanStatus, setEmiPlanStatus] = useState('Active')
  const [modeFields, setModeFields] = useState({})
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [proofFiles, setProofFiles] = useState([])
  const [editInstallment, setEditInstallment] = useState(null)
  const [collectInstallment, setCollectInstallment] = useState(null)
  const [collectDialogTitle, setCollectDialogTitle] = useState('Collect installment')
  const [collectDefaultAmount, setCollectDefaultAmount] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])

  const emiEnabled = paymentType === 'emi'

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
  } = useForm({ defaultValues: DEFAULT_FORM })

  const paymentMode = watch('paymentMode')
  const paymentId = watch('paymentId')

  const openSessionRef = useRef(false)

  useEffect(() => {
    if (!open) {
      openSessionRef.current = false
      return
    }
    if (openSessionRef.current) return
    openSessionRef.current = true

    reset({
      ...DEFAULT_FORM,
      paymentId: `OFF-${Date.now().toString().slice(-6)}`,
      paymentDate: new Date().toISOString().slice(0, 10),
    })
    setPaymentType('full')
    setStudentProfile(
      initialStudentProfile
        ? { ...DEFAULT_STUDENT_PROFILE, ...initialStudentProfile }
        : DEFAULT_STUDENT_PROFILE,
    )
    setFinancials(null)
    setInstallments([])
    setEmiConfig({
      ...DEFAULT_EMI_CONFIG,
      startDate: new Date().toISOString().slice(0, 10),
    })
    setEmiPlanStatus('Active')
    setModeFields({})
    setProofFile(null)
    setProofPreview(null)
    setProofFiles([])
    setValidationErrors([])
    setEditInstallment(null)
    setCollectInstallment(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    setFinancials(buildFinancialsFromProfile(studentProfile))
  }, [open, studentProfile])

  const emiConfigKey = `${emiConfig.installmentCount}|${emiConfig.downPayment}|${emiConfig.startDate}|${emiConfig.frequency}|${financials?.pendingAmount}|${emiConfig.durationPreset}`

  const schedulePreview = useMemo(() => {
    if (!emiEnabled) return null
    const down = Number(emiConfig.downPayment) || 0
    const result = generateEmiSchedule({
      installmentCount: emiConfig.installmentCount,
      downPayment: down,
      startDate: emiConfig.startDate,
      frequency: emiConfig.frequency,
      pendingBalance: financials?.pendingAmount ?? 0,
    })
    const avgEmi =
      result.installments.length > 0
        ? Math.round(result.totalEmiAmount / result.installments.length)
        : 0
    return { ...result, avgEmi }
  }, [financials, emiEnabled, emiConfigKey, emiConfig])

  useEffect(() => {
    if (!emiEnabled || emiPlanStatus === 'Closed Early') return
    const down = Number(emiConfig.downPayment) || 0
    const { installments: rows } = generateEmiSchedule({
      installmentCount: emiConfig.installmentCount,
      downPayment: down,
      startDate: emiConfig.startDate,
      frequency: emiConfig.frequency,
      pendingBalance: financials?.pendingAmount ?? 0,
    })
    setInstallments(rows)
  }, [emiEnabled, emiPlanStatus, financials, emiConfigKey, emiConfig])

  const openEmiBalance = useMemo(() => computeOpenEmiBalance(installments), [installments])

  const statusLabel = useMemo(() => {
    if (emiPlanStatus === 'Closed Early') return 'Closed Early'
    if (emiEnabled) return 'EMI Active'
    return 'Full Payment'
  }, [emiPlanStatus, emiEnabled])

  const handleSearchSelect = useCallback((studentId) => {
    if (!studentId) return
    const student = VERIFICATION_STUDENT_OPTIONS.find((s) => s.studentId === studentId)
    if (!student) return
    setStudentProfile((p) => ({
      ...p,
      studentId,
      studentName: student.studentName,
      centerName: student.centerName,
      isWalkIn: false,
      customFee: '',
      batchId: '',
      batchName: '',
    }))
    setValue('centerName', student.centerName)
  }, [setValue])

  const handleWalkIn = useCallback(() => {
    setStudentProfile({
      ...DEFAULT_STUDENT_PROFILE,
      studentId: `WALKIN-${Date.now().toString().slice(-5)}`,
      isWalkIn: true,
      studentName: '',
      mobile: '',
    })
    toast.info('Enter walk-in student details below')
  }, [])

  const handleProofChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProofFile(file)
    if (file.type.startsWith('image/')) {
      setProofPreview(URL.createObjectURL(file))
    } else {
      setProofPreview(null)
    }
  }, [])

  const handleProofFilesChange = useCallback((items) => {
    setProofFiles(items)
    const first = items[0]?.file || null
    setProofFile(first)
    setProofPreview(items[0]?.preview || null)
  }, [])

  const clearProof = useCallback(() => {
    setProofFile(null)
    setProofPreview(null)
    setProofFiles([])
  }, [])

  const expectedPrincipal = useMemo(() => {
    if (!financials) return 0
    const down = Number(emiConfig.downPayment) || 0
    return Math.max(0, (financials.pendingAmount ?? 0) - down)
  }, [financials, emiConfig.downPayment])

  const updateInstallment = useCallback(
    (updated) => {
      const { rebalanceRemaining, ...row } = updated
      setInstallments((rows) => {
        let next = rows.map((r) =>
          r.installmentNo === row.installmentNo
            ? { ...r, ...row, emiMonth: getEmiMonthLabel(row.dueDate || r.dueDate) }
            : r,
        )
        if (rebalanceRemaining && financials) {
          next = rebalanceInstallmentAmounts(
            next,
            row.installmentNo,
            row.emiAmount,
            expectedPrincipal,
          )
        }
        return next
      })
      toast.success(`Installment #${row.installmentNo} updated`)
    },
    [financials, expectedPrincipal],
  )

  const openCollectDialog = useCallback((row, { title, defaultAmount } = {}) => {
    setCollectDialogTitle(title || 'Collect installment')
    setCollectDefaultAmount(defaultAmount ?? null)
    setCollectInstallment(row)
  }, [])

  const collectInstallmentPayment = useCallback(
    (row) => {
      if (row._earlyClosure) {
        setInstallments((prev) =>
          applyEarlyEmiClosure(prev, row.remarks || 'Early full settlement'),
        )
        setEmiPlanStatus('Closed Early')
        toast.success('EMI plan closed early — all installments settled')
        return
      }
      setInstallments((rows) =>
        rows.map((r) => (r.installmentNo === row.installmentNo ? { ...row } : r)),
      )
      toast.success(
        row.status === 'Paid'
          ? `Installment #${row.installmentNo} paid`
          : `Partial payment recorded for #${row.installmentNo}`,
      )
    },
    [],
  )

  const handleEarlyClosure = useCallback(() => {
    const balance = computeOpenEmiBalance(installments)
    if (balance <= 0) {
      toast.error('No remaining EMI balance to close.')
      return
    }
    openCollectDialog(
      {
        installmentNo: 0,
        emiMonth: 'Early closure',
        dueDate: new Date().toISOString().slice(0, 10),
        emiAmount: balance,
        paidAmount: 0,
        status: 'Scheduled',
        _earlyClosure: true,
        paymentHistory: [],
      },
      { title: 'Close EMI — collect full balance', defaultAmount: balance },
    )
  }, [installments, openCollectDialog])

  const buildPayload = useCallback(
    (data, submitAction) => {
      const course = FINANCE_COURSES.find((c) => c.id === studentProfile.courseId)
      const amount = emiEnabled
        ? Number(emiConfig.downPayment) || Number(data.amount) || 0
        : Number(data.amount) || 0

      return {
        ...data,
        submitAction,
        emiEnabled,
        paymentType,
        studentId: studentProfile.studentId,
        studentName: studentProfile.studentName,
        centerName: studentProfile.centerName,
        courseId: studentProfile.courseId,
        batchId: studentProfile.batchId,
        batchName: studentProfile.batchName || financials?.batchName || '',
        mobile: studentProfile.mobile,
        email: studentProfile.email,
        courseName: course?.name || financials?.courseName || '',
        courseType: course?.type || financials?.courseType || 'Offline',
        amount,
        proofFileName: proofFile?.name || proofFiles[0]?.name || null,
        proofFile,
        proofFiles: proofFiles.map((p) => p.file).filter(Boolean),
        modeFields,
        financials,
        emiPlan: emiEnabled
          ? {
              installmentCount: emiConfig.installmentCount,
              durationPreset: emiConfig.durationPreset,
              downPayment: Number(emiConfig.downPayment) || 0,
              startDate: emiConfig.startDate,
              frequency: emiConfig.frequency,
              installments,
              planStatus: emiPlanStatus,
              totalFees: financials?.finalPayable,
              pendingAmount: financials?.pendingAmount,
            }
          : null,
        isWalkIn: studentProfile.isWalkIn,
      }
    },
    [
      emiEnabled,
      paymentType,
      studentProfile,
      emiConfig,
      installments,
      financials,
      proofFile,
      proofFiles,
      modeFields,
      emiPlanStatus,
    ],
  )

  const validate = useCallback(
    (data) => {
      const errs = [...validateStudentProfile(studentProfile)]
      if (!data.paymentId?.trim()) errs.push('Payment ID is required.')
      if (!studentProfile.centerName) errs.push('Center is required.')
      if (!studentProfile.courseId) errs.push('Course is required.')
      if (!studentProfile.batchId) errs.push('Batch is required.')
      if (!data.paymentDate) errs.push('Payment date is required.')

      if (emiEnabled) {
        if (!financials?.pendingAmount && !studentProfile.customFee) {
          errs.push('Set course fee / pending balance for EMI calculation.')
        }
        errs.push(
          ...validateEmiPlan({
            financials: financials || { pendingAmount: 0, finalPayable: 0 },
            downPayment: emiConfig.downPayment,
            installmentCount: emiConfig.installmentCount,
            schedule: installments,
          }),
        )
        if (emiPlanStatus === 'Closed Early') {
          const open = computeOpenEmiBalance(installments)
          if (open > 1) errs.push('Complete early closure collection before approving.')
        }
      } else {
        if (!data.amount || Number(data.amount) <= 0) errs.push('Amount paid is required.')
        const needsRef = ['UPI', 'Bank Transfer', 'POS Machine', 'Card'].includes(data.paymentMode)
        if (needsRef && !data.utrNumber?.trim()) {
          errs.push('UTR / reference number is required for this payment mode.')
        }
      }

      setValidationErrors(errs)
      return errs
    },
    [emiEnabled, studentProfile, financials, emiConfig, installments, emiPlanStatus],
  )

  return {
    register,
    handleSubmit,
    paymentType,
    setPaymentType,
    emiEnabled,
    studentProfile,
    setStudentProfile,
    financials,
    installments,
    emiConfig,
    setEmiConfig,
    emiPlanStatus,
    modeFields,
    setModeFields,
      proofFile,
      proofFiles,
      proofPreview,
      handleProofChange,
      handleProofFilesChange,
      clearProof,
    schedulePreview,
    validationErrors,
    editInstallment,
    setEditInstallment,
    collectInstallment,
    setCollectInstallment,
    collectDialogTitle,
    collectDefaultAmount,
    openEmiBalance,
    statusLabel,
    handleSearchSelect,
    handleWalkIn,
    updateInstallment,
    collectInstallmentPayment,
    openCollectDialog,
    handleEarlyClosure,
    buildPayload,
    validate,
    paymentMode,
    paymentId,
    centerOptions: CENTER_OPTIONS,
    OFFLINE_SUBMIT_ACTIONS,
  }
}
