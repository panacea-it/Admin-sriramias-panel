import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { OFFLINE_SUBMIT_ACTIONS } from '../constants/offlinePaymentEmi'
import {
  computeOpenEmiBalance,
  getEmiMonthLabel,
  rebalanceInstallmentAmounts,
  validateEmiPlan,
} from '../utils/emiSchedule'
import { validateStudentProfile } from '../utils/offlinePaymentValidation'
import {
  mapBatchAmountsToFinancials,
  mapBatchesToOptions,
  mapCoursesToOptions,
  mapEligibleStudentToProfile,
  mapEmiInstallmentsToUi,
  mapPaymentModesToOptions,
  resolvePaymentModeId,
} from '../utils/paymentVerificationHelpers'
import {
  calculateEmiPlan,
  fetchBatchAmounts,
  fetchBatchesByCourse,
  fetchCoursesByCenter,
  fetchVerificationCentersDropdown,
  fetchVerificationPaymentModes,
  searchEligibleStudents,
  validateEmiSchedule,
} from '../api/paymentVerificationAPI'
import { toast } from '../utils/toast'

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
  receivedBy: '',
  startDate: '',
  frequency: 'monthly',
}

const DEFAULT_STUDENT_PROFILE = {
  studentObjectId: '',
  studentId: '',
  studentName: '',
  mobile: '',
  email: '',
  centerId: '',
  centerName: '',
  courseId: '',
  courseName: '',
  batchId: '',
  batchName: '',
  customFee: '',
  isWalkIn: false,
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
  const [downPaymentProofFiles, setDownPaymentProofFiles] = useState([])
  const [downPaymentFieldErrors, setDownPaymentFieldErrors] = useState({})
  const [editInstallment, setEditInstallment] = useState(null)
  const [collectInstallment, setCollectInstallment] = useState(null)
  const [collectDialogTitle, setCollectDialogTitle] = useState('Collect installment')
  const [collectDefaultAmount, setCollectDefaultAmount] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [centerOptions, setCenterOptions] = useState([])
  const [courseOptions, setCourseOptions] = useState([])
  const [batchOptions, setBatchOptions] = useState([])
  const [studentOptions, setStudentOptions] = useState([])
  const [paymentModes, setPaymentModes] = useState([])
  const [batchesLoading, setBatchesLoading] = useState(false)
  const [batchesFetchError, setBatchesFetchError] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)

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
  const emiRequestRef = useRef(0)

  const paymentModeOptions = useMemo(() => {
    const fromApi = mapPaymentModesToOptions(paymentModes)
    if (fromApi.length) return fromApi
    return []
  }, [paymentModes])

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
    setDownPaymentProofFiles([])
    setDownPaymentFieldErrors({})
    setValidationErrors([])
    setEditInstallment(null)
    setCollectInstallment(null)
    setCourseOptions([])
    setBatchOptions([])
    setStudentOptions([])

    setSetupLoading(true)
    Promise.all([fetchVerificationCentersDropdown(), fetchVerificationPaymentModes()])
      .then(([centers, modes]) => {
        setCenterOptions(
          centers.map((c) => ({
            id: c.id || c._id,
            name: c.centerName || c.name || c.label,
          })),
        )
        const mappedModes = mapPaymentModesToOptions(modes)
        setPaymentModes(modes)
        if (mappedModes[0]?.name) {
          setValue('paymentMode', mappedModes[0].name)
        }
      })
      .catch(() => {
        toast.error('Failed to load offline payment setup data')
      })
      .finally(() => setSetupLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open || studentProfile.isWalkIn) return
    let cancelled = false
    searchEligibleStudents({
      search: '',
      centerId: studentProfile.centerId || undefined,
      limit: 25,
    })
      .then((items) => {
        if (cancelled) return
        setStudentOptions(
          items.map((item) => {
            const profile = mapEligibleStudentToProfile(item)
            return {
              ...profile,
              studentObjectId: item._id,
            }
          }),
        )
      })
      .catch(() => {
        if (!cancelled) setStudentOptions([])
      })
    return () => {
      cancelled = true
    }
  }, [open, studentProfile.centerId, studentProfile.isWalkIn])

  useEffect(() => {
    if (!open || !studentProfile.centerId) {
      setCourseOptions([])
      return
    }
    let cancelled = false
    fetchCoursesByCenter(studentProfile.centerId)
      .then((items) => {
        if (!cancelled) setCourseOptions(mapCoursesToOptions(items))
      })
      .catch(() => {
        if (!cancelled) setCourseOptions([])
      })
    return () => {
      cancelled = true
    }
  }, [open, studentProfile.centerId])

  useEffect(() => {
    if (!open || !studentProfile.courseId) {
      setBatchOptions([])
      return
    }
    let cancelled = false
    setBatchesLoading(true)
    setBatchesFetchError('')
    fetchBatchesByCourse(studentProfile.courseId)
      .then((items) => {
        if (!cancelled) setBatchOptions(mapBatchesToOptions(items))
      })
      .catch((err) => {
        if (!cancelled) {
          setBatchOptions([])
          setBatchesFetchError(err?.message || 'Failed to load batches')
        }
      })
      .finally(() => {
        if (!cancelled) setBatchesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, studentProfile.courseId])

  useEffect(() => {
    if (!open || !studentProfile.batchId) {
      setFinancials(null)
      return
    }
    let cancelled = false
    fetchBatchAmounts({
      batchId: studentProfile.batchId,
      studentId: studentProfile.studentObjectId || undefined,
      centerId: studentProfile.centerId || undefined,
      deliveryMode: 'OFFLINE',
    })
      .then((data) => {
        if (!cancelled) {
          setFinancials(mapBatchAmountsToFinancials(data, studentProfile))
        }
      })
      .catch(() => {
        if (!cancelled) setFinancials(null)
      })
    return () => {
      cancelled = true
    }
  }, [open, studentProfile.batchId, studentProfile.studentObjectId, studentProfile.centerId, studentProfile])

  const emiConfigKey = `${emiConfig.installmentCount}|${emiConfig.downPayment}|${emiConfig.startDate}|${emiConfig.frequency}|${financials?.pendingAmount}|${emiConfig.durationPreset}|${studentProfile.batchId}`

  useEffect(() => {
    if (!open || !emiEnabled || emiPlanStatus === 'Closed Early' || !studentProfile.batchId) return
    const months = Number(emiConfig.installmentCount)
    if (!months && emiConfig.durationPreset !== 'custom') return

    const requestId = ++emiRequestRef.current
    calculateEmiPlan({
      batchId: studentProfile.batchId,
      studentId: studentProfile.studentObjectId || undefined,
      deliveryMode: 'OFFLINE',
      downPayment: Number(emiConfig.downPayment) || 0,
      months: months || undefined,
      emiStartDate: emiConfig.startDate,
      isCustom: emiConfig.durationPreset === 'custom',
      includeAllPlans: false,
    })
      .then((data) => {
        if (requestId !== emiRequestRef.current) return
        if (data?.installments?.length) {
          setInstallments(mapEmiInstallmentsToUi(data.installments))
        }
      })
      .catch(() => {
        if (requestId !== emiRequestRef.current) return
      })
  }, [open, emiEnabled, emiPlanStatus, studentProfile.batchId, studentProfile.studentObjectId, emiConfigKey, emiConfig])

  const openEmiBalance = useMemo(() => computeOpenEmiBalance(installments), [installments])

  const statusLabel = useMemo(() => {
    if (emiPlanStatus === 'Closed Early') return 'Closed Early'
    if (emiEnabled) return 'EMI Active'
    return 'Full Payment'
  }, [emiPlanStatus, emiEnabled])

  const handleSearchSelect = useCallback(
    (studentObjectId) => {
      if (!studentObjectId) return
      const student = studentOptions.find(
        (s) => s.studentObjectId === studentObjectId || s.studentId === studentObjectId,
      )
      if (!student) return
      setStudentProfile((p) => ({
        ...p,
        studentObjectId: student.studentObjectId || studentObjectId,
        studentId: student.studentId,
        studentName: student.studentName,
        mobile: student.mobile || '',
        email: student.email || '',
        centerId: student.centerId || p.centerId,
        centerName: student.centerName || p.centerName,
        isWalkIn: false,
        customFee: '',
        batchId: '',
        batchName: '',
        courseId: '',
        courseName: '',
      }))
    },
    [studentOptions],
  )

  const handleWalkIn = useCallback(() => {
    setStudentProfile({
      ...DEFAULT_STUDENT_PROFILE,
      isWalkIn: true,
      studentObjectId: '',
      studentId: '',
      studentName: '',
      mobile: '',
    })
    setStudentOptions([])
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

  const handleDownPaymentProofFilesChange = useCallback((items) => {
    setDownPaymentProofFiles(items)
    setDownPaymentFieldErrors((prev) => ({ ...prev, proof: undefined }))
  }, [])

  const clearDownPaymentProof = useCallback(() => {
    setDownPaymentProofFiles([])
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
      const { rebalanceRemaining, silent, ...row } = updated
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
      if (!silent) {
        toast.success(`Installment #${row.installmentNo} updated`)
      }
    },
    [financials, expectedPrincipal],
  )

  const openCollectDialog = useCallback((row, { title, defaultAmount } = {}) => {
    setCollectDialogTitle(title || 'Collect installment')
    setCollectDefaultAmount(defaultAmount ?? null)
    setCollectInstallment(row)
  }, [])

  const collectInstallmentPayment = useCallback((row) => {
    setInstallments((rows) =>
      rows.map((r) => (r.installmentNo === row.installmentNo ? { ...row } : r)),
    )
    toast.success(
      row.status === 'Paid'
        ? `Installment #${row.installmentNo} paid`
        : `Partial payment recorded for #${row.installmentNo}`,
    )
  }, [])

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
      const amount = emiEnabled
        ? Number(emiConfig.downPayment) || Number(data.amount) || 0
        : Number(data.amount) || 0

      const activeProofFiles = emiEnabled ? downPaymentProofFiles : proofFiles
      const activeProofFile = emiEnabled
        ? downPaymentProofFiles[0]?.file || null
        : proofFile

      return {
        ...data,
        submitAction,
        emiEnabled,
        paymentType,
        studentObjectId: studentProfile.studentObjectId,
        studentId: studentProfile.studentId,
        studentName: studentProfile.studentName,
        centerId: studentProfile.centerId,
        centerName: studentProfile.centerName,
        courseId: studentProfile.courseId,
        batchId: studentProfile.batchId,
        batchName: studentProfile.batchName || financials?.batchName || '',
        mobile: studentProfile.mobile,
        email: studentProfile.email,
        courseName: studentProfile.courseName || financials?.courseName || '',
        paymentModeId: resolvePaymentModeId(data.paymentMode, paymentModes),
        amount,
        proofFileName: activeProofFile?.name || activeProofFiles[0]?.name || null,
        proofFile: activeProofFile,
        proofFiles: activeProofFiles.map((p) => p.file).filter(Boolean),
        downPaymentProofFiles,
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
              receivedBy: emiConfig.receivedBy,
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
      downPaymentProofFiles,
      paymentModes,
    ],
  )

  const validateDownPaymentFields = useCallback(() => {
    const down = Number(emiConfig.downPayment) || 0
    const fieldErrors = {}
    if (down > 0) {
      if (!emiConfig.receivedBy?.trim()) {
        fieldErrors.receivedBy = 'Employee ID is required when collecting down payment.'
      }
      if (!downPaymentProofFiles.length) {
        fieldErrors.proof = 'Down payment proof upload is required.'
      }
    }
    setDownPaymentFieldErrors(fieldErrors)
    return fieldErrors
  }, [emiConfig.downPayment, emiConfig.receivedBy, downPaymentProofFiles])

  const validate = useCallback(
    (data) => {
      const errs = [...validateStudentProfile(studentProfile)]
      if (!data.paymentId?.trim()) errs.push('Payment ID is required.')
      if (!studentProfile.centerId) errs.push('Center is required.')
      if (!studentProfile.courseId) errs.push('Course is required.')
      if (!studentProfile.batchId) errs.push('Batch is required.')
      if (!data.paymentDate) errs.push('Payment date is required.')

      if (emiEnabled) {
        if (!financials?.pendingAmount && !studentProfile.customFee) {
          errs.push('Select a course with fee details for EMI calculation.')
        }
        const dpFieldErrors = validateDownPaymentFields()
        if (dpFieldErrors.receivedBy) errs.push(dpFieldErrors.receivedBy)
        if (dpFieldErrors.proof) errs.push(dpFieldErrors.proof)
        errs.push(
          ...validateEmiPlan({
            financials: financials || { pendingAmount: 0, finalPayable: 0 },
            downPayment: emiConfig.downPayment,
            installmentCount: emiConfig.installmentCount,
            schedule: installments,
          }),
        )
      } else {
        if (!data.amount || Number(data.amount) <= 0) errs.push('Amount paid is required.')
        const needsRef = ['UPI', 'Bank Transfer', 'POS Machine', 'Card', 'Net Banking'].includes(
          data.paymentMode,
        )
        if (needsRef && !data.utrNumber?.trim()) {
          errs.push('UTR / reference number is required for this payment mode.')
        }
        if (!proofFile && !proofFiles.length) {
          errs.push('Payment proof upload is required.')
        }
      }

      setValidationErrors(errs)
      return errs
    },
    [
      emiEnabled,
      studentProfile,
      financials,
      emiConfig,
      installments,
      validateDownPaymentFields,
      proofFile,
      proofFiles,
    ],
  )

  const validateScheduleWithApi = useCallback(async () => {
    if (!emiEnabled || !studentProfile.batchId) return { valid: true }
    try {
      const result = await validateEmiSchedule({
        batchId: studentProfile.batchId,
        studentId: studentProfile.studentObjectId || undefined,
        deliveryMode: 'OFFLINE',
        downPayment: Number(emiConfig.downPayment) || 0,
        installments: installments.map((row) => ({
          amount: Math.round(Number(row.emiAmount) || 0),
        })),
      })
      if (result?.valid === false) {
        return { valid: false, message: 'Installment schedule does not match payable amount.' }
      }
      return { valid: true }
    } catch (err) {
      return { valid: false, message: err?.message || 'Failed to validate EMI schedule' }
    }
  }, [emiEnabled, studentProfile, emiConfig.downPayment, installments])

  const handleEmiConfigChange = useCallback((next) => {
    setEmiConfig(next)
    if (Number(next.downPayment) || 0) {
      setDownPaymentFieldErrors((prev) => ({
        ...prev,
        receivedBy: next.receivedBy?.trim() ? undefined : prev.receivedBy,
      }))
    } else {
      setDownPaymentFieldErrors({})
    }
  }, [])

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
    setEmiConfig: handleEmiConfigChange,
    emiPlanStatus,
    modeFields,
    setModeFields,
    proofFile,
    proofFiles,
    proofPreview,
    handleProofChange,
    handleProofFilesChange,
    clearProof,
    downPaymentProofFiles,
    handleDownPaymentProofFilesChange,
    clearDownPaymentProof,
    downPaymentFieldErrors,
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
    validateScheduleWithApi,
    paymentMode,
    paymentId,
    centerOptions,
    courseOptions,
    batchOptions,
    studentOptions,
    paymentModeOptions,
    batchesLoading,
    batchesFetchError,
    setupLoading,
    paymentModes,
    OFFLINE_SUBMIT_ACTIONS,
  }
}
