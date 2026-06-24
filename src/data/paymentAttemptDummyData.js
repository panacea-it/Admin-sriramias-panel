import { FINANCE_COURSES } from './financeMockData'
import { PAYMENT_FAILURE_CATEGORIES } from '../constants/paymentAttemptConstants'
import { DUMMY_PAYMENT_ATTEMPT_COUNSELORS } from '../constants/paymentAttemptConstants'

const CENTERS = [
  { key: 'Delhi', label: 'Delhi Center' },
  { key: 'Hyderabad', label: 'Hyderabad Center' },
  { key: 'Pune', label: 'Pune Center' },
]

const GATEWAYS = ['Razorpay', 'Cashfree', 'PayU']
const AMOUNTS = [45000, 55000, 75000, 95000, 25000, 85000]

const FIRST_NAMES = [
  'Aarav', 'Neha', 'Rahul', 'Sneha', 'Vikram', 'Priya', 'Amit', 'Pooja',
  'Kiran', 'Anita', 'Rohan', 'Divya', 'Arjun', 'Meera', 'Sanjay', 'Kavya',
  'Nikhil', 'Isha', 'Manish', 'Ritu', 'Deepak', 'Sonia', 'Varun', 'Lakshmi',
  'Gaurav', 'Nisha', 'Harsh', 'Tanvi', 'Yash', 'Simran',
]

const LAST_NAMES = [
  'Sharma', 'Verma', 'Mehta', 'Kapoor', 'Singh', 'Gupta', 'Reddy', 'Joshi',
  'Kumar', 'Desai', 'Patel', 'Nair', 'Iyer', 'Malhotra', 'Chopra', 'Bose',
  'Rao', 'Pillai', 'Saxena', 'Mishra', 'Khanna', 'Bhatt', 'Aggarwal', 'Das',
  'Chatterjee', 'Menon', 'Shetty', 'Kulkarni', 'Thakur', 'Banerjee',
]

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function pick(arr, index) {
  return arr[index % arr.length]
}

/** 30 UI-test payment attempt logs — 10 per Delhi, Hyderabad, Pune. */
export function buildPaymentAttemptDummyLogs() {
  const logs = []

  CENTERS.forEach((center, centerIdx) => {
    for (let i = 1; i <= 10; i += 1) {
      const globalIdx = centerIdx * 10 + (i - 1)
      const payNum = String(centerIdx + 1).padStart(3, '0')
      const attemptId = `PAY-${payNum}-${String(i).padStart(2, '0')}`
      const student = `${pick(FIRST_NAMES, globalIdx)} ${pick(LAST_NAMES, globalIdx + 3)}`
      const course = FINANCE_COURSES[globalIdx % FINANCE_COURSES.length]
      const preAssigned = globalIdx % 5 === 0
      const counselorName = preAssigned ? pick(DUMMY_PAYMENT_ATTEMPT_COUNSELORS, globalIdx) : null

      logs.push({
        id: attemptId,
        attemptId,
        paymentId: `PAY-${payNum}`,
        student,
        studentId: `STU-${25000 + globalIdx}`,
        mobile: `98${String(76543210 + globalIdx).slice(-8)}`,
        email: `${student.split(' ')[0].toLowerCase()}@example.com`,
        course: course.name,
        courseId: course.id,
        branch: center.label.replace(' Center', ' HQ'),
        centerName: center.label,
        center: center.key,
        transactionId: `TXN-${attemptId}`,
        attemptNo: i,
        gatewayProvider: pick(GATEWAYS, globalIdx),
        failureCategory: pick(PAYMENT_FAILURE_CATEGORIES, globalIdx),
        failureReason: pick(PAYMENT_FAILURE_CATEGORIES, globalIdx),
        amount: pick(AMOUNTS, globalIdx),
        dateTime: daysAgo(1 + (globalIdx % 14)),
        lastAttemptDate: daysAgo(1 + (globalIdx % 14)),
        retryCount: globalIdx % 4,
        paymentMode: pick(['UPI', 'Card', 'Bank Transfer'], globalIdx),
        status: 'Failed',
        counselorId: preAssigned ? `dummy-counselor-${(globalIdx % 8) + 1}` : null,
        counselorName,
      })
    }
  })

  return logs
}
