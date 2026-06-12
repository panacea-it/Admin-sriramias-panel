const PAYMENT_STATUSES = ['Paid', 'Pending', 'Partial', 'Overdue']
const BATCH_STATUSES = ['Active', 'Inactive']
const STUDENT_STATUSES = ['Active', 'In Active']

function makeStudent(
  id,
  name,
  email,
  phone,
  enrollmentId,
  paymentStatus,
  attendance,
  progress,
  status = 'Active',
) {
  return {
    id,
    name,
    email,
    phone,
    enrollmentId,
    paymentStatus,
    attendance,
    progress,
    status,
  }
}

function makeBatch({
  id,
  batchId,
  courseName,
  batchLabel,
  trainerName,
  startDate,
  endDate,
  status,
  students = [],
}) {
  return {
    id,
    batchId,
    courseName,
    batchLabel,
    displayName: `${courseName} - ${batchLabel}`,
    trainerName,
    startDate,
    endDate,
    status,
    students,
  }
}

export const INITIAL_BATCHES = [
  makeBatch({
    id: 'batch-1',
    batchId: 'BATCH-2025-001',
    courseName: 'MERN Stack',
    batchLabel: 'Batch A',
    trainerName: 'Arjun Mehta',
    startDate: '2025-01-15',
    endDate: '2025-07-15',
    status: 'Active',
    students: [
      makeStudent('s-1-1', 'Priya Sharma', 'priya.sharma@email.com', '+91 98765 43210', 'ENR-2025-1001', 'Paid', 92, 78),
      makeStudent('s-1-2', 'Rahul Verma', 'rahul.verma@email.com', '+91 91234 56789', 'ENR-2025-1002', 'Paid', 88, 72),
      makeStudent('s-1-3', 'Ananya Iyer', 'ananya.iyer@email.com', '+91 99887 76655', 'ENR-2025-1003', 'Partial', 76, 65),
      makeStudent('s-1-4', 'Karan Patel', 'karan.patel@email.com', '+91 97654 32109', 'ENR-2025-1004', 'Pending', 68, 54, 'In Active'),
      makeStudent('s-1-5', 'Sneha Reddy', 'sneha.reddy@email.com', '+91 93456 78901', 'ENR-2025-1005', 'Paid', 95, 81),
    ],
  }),
  makeBatch({
    id: 'batch-2',
    batchId: 'BATCH-2024-018',
    courseName: 'Java Full Stack',
    batchLabel: 'Evening Batch',
    trainerName: 'Neha Kapoor',
    startDate: '2024-09-01',
    endDate: '2025-03-01',
    status: 'Completed',
    students: [
      makeStudent('s-2-1', 'Vikram Singh', 'vikram.singh@email.com', '+91 98123 45678', 'ENR-2024-2201', 'Paid', 98, 100),
      makeStudent('s-2-2', 'Meera Joshi', 'meera.joshi@email.com', '+91 99012 34567', 'ENR-2024-2202', 'Paid', 94, 96),
      makeStudent('s-2-3', 'Amit Desai', 'amit.desai@email.com', '+91 94567 89012', 'ENR-2024-2203', 'Paid', 91, 92),
    ],
  }),
  makeBatch({
    id: 'batch-3',
    batchId: 'BATCH-2025-012',
    courseName: 'Data Science',
    batchLabel: 'Weekend Batch',
    trainerName: 'Dr. Sanjay Rao',
    startDate: '2025-03-01',
    endDate: '2025-11-30',
    status: 'Active',
    students: [
      makeStudent('s-3-1', 'Isha Gupta', 'isha.gupta@email.com', '+91 98701 23456', 'ENR-2025-3001', 'Paid', 85, 42),
      makeStudent('s-3-2', 'Rohan Malhotra', 'rohan.m@email.com', '+91 91230 98765', 'ENR-2025-3002', 'Paid', 79, 38),
      makeStudent('s-3-3', 'Divya Nair', 'divya.nair@email.com', '+91 99876 54321', 'ENR-2025-3003', 'Partial', 72, 35),
      makeStudent('s-3-4', 'Arun Krishnan', 'arun.k@email.com', '+91 97650 11223', 'ENR-2025-3004', 'Overdue', 61, 28, 'In Active'),
    ],
  }),
  makeBatch({
    id: 'batch-4',
    batchId: 'BATCH-2026-003',
    courseName: 'UI/UX Design',
    batchLabel: 'Batch 2026',
    trainerName: 'Lisa Fernandes',
    startDate: '2026-01-10',
    endDate: '2026-08-10',
    status: 'Upcoming',
    students: [
      makeStudent('s-4-1', 'Tanya Bose', 'tanya.bose@email.com', '+91 98111 22334', 'ENR-2026-4001', 'Pending', 0, 0),
      makeStudent('s-4-2', 'Nikhil Rao', 'nikhil.rao@email.com', '+91 93444 55667', 'ENR-2026-4002', 'Pending', 0, 0),
    ],
  }),
  makeBatch({
    id: 'batch-5',
    batchId: 'BATCH-2025-008',
    courseName: 'Python Full Stack',
    batchLabel: 'Morning Batch',
    trainerName: 'Rajesh Kumar',
    startDate: '2025-02-01',
    endDate: '2025-08-31',
    status: 'Active',
    students: [
      makeStudent('s-5-1', 'Pooja Menon', 'pooja.menon@email.com', '+91 98760 11122', 'ENR-2025-5001', 'Paid', 90, 68),
      makeStudent('s-5-2', 'Suresh Babu', 'suresh.babu@email.com', '+91 91220 33445', 'ENR-2025-5002', 'Paid', 87, 64),
      makeStudent('s-5-3', 'Lakshmi Devi', 'lakshmi.d@email.com', '+91 99880 55667', 'ENR-2025-5003', 'Partial', 74, 58),
      makeStudent('s-5-4', 'Harish Pillai', 'harish.p@email.com', '+91 97600 77889', 'ENR-2025-5004', 'Paid', 82, 61),
      makeStudent('s-5-5', 'Deepa Thomas', 'deepa.t@email.com', '+91 93400 99001', 'ENR-2025-5005', 'Pending', 65, 48),
      makeStudent('s-5-6', 'Manoj Nambiar', 'manoj.n@email.com', '+91 98100 11223', 'ENR-2025-5006', 'Paid', 91, 70),
    ],
  }),
  makeBatch({
    id: 'batch-6',
    batchId: 'BATCH-2025-015',
    courseName: 'DevOps & Cloud',
    batchLabel: 'Batch B',
    trainerName: 'Chris Anderson',
    startDate: '2025-04-15',
    endDate: '2025-10-15',
    status: 'Active',
    students: [
      makeStudent('s-6-1', 'Aditya Shah', 'aditya.shah@email.com', '+91 98711 44556', 'ENR-2025-6001', 'Paid', 88, 55),
      makeStudent('s-6-2', 'Bhavna Kulkarni', 'bhavna.k@email.com', '+91 91299 66778', 'ENR-2025-6002', 'Paid', 84, 52),
      makeStudent('s-6-3', 'Chetan Agarwal', 'chetan.a@email.com', '+91 99822 88990', 'ENR-2025-6003', 'Overdue', 58, 40, 'In Active'),
    ],
  }),
  makeBatch({
    id: 'batch-7',
    batchId: 'BATCH-2024-042',
    courseName: 'AWS Solutions Architect',
    batchLabel: 'Corporate Batch',
    trainerName: 'Michael Chen',
    startDate: '2024-06-01',
    endDate: '2024-12-15',
    status: 'Completed',
    students: [
      makeStudent('s-7-1', 'Emily Watson', 'emily.w@corp.com', '+91 98155 00112', 'ENR-2024-7001', 'Paid', 96, 100),
      makeStudent('s-7-2', 'James Miller', 'james.m@corp.com', '+91 93455 00334', 'ENR-2024-7002', 'Paid', 93, 98),
      makeStudent('s-7-3', 'Sarah Johnson', 'sarah.j@corp.com', '+91 99855 00556', 'ENR-2024-7003', 'Paid', 89, 95),
      makeStudent('s-7-4', 'David Lee', 'david.lee@corp.com', '+91 97655 00778', 'ENR-2024-7004', 'Paid', 91, 97),
    ],
  }),
  makeBatch({
    id: 'batch-8',
    batchId: 'BATCH-2025-021',
    courseName: 'React Native Mobile',
    batchLabel: 'Batch C',
    trainerName: 'Sofia Martinez',
    startDate: '2025-05-01',
    endDate: '2025-11-01',
    status: 'Active',
    students: [
      makeStudent('s-8-1', 'Farhan Ali', 'farhan.ali@email.com', '+91 98722 33445', 'ENR-2025-8001', 'Paid', 86, 45),
      makeStudent('s-8-2', 'Geeta Pandey', 'geeta.p@email.com', '+91 91288 55667', 'ENR-2025-8002', 'Partial', 71, 38),
      makeStudent('s-8-3', 'Himanshu Rawat', 'himanshu.r@email.com', '+91 99833 77889', 'ENR-2025-8003', 'Paid', 89, 50),
    ],
  }),
  makeBatch({
    id: 'batch-9',
    batchId: 'BATCH-2026-007',
    courseName: 'Cyber Security',
    batchLabel: 'Advanced Batch',
    trainerName: 'Col. Ravi Menon',
    startDate: '2026-02-01',
    endDate: '2026-09-30',
    status: 'Upcoming',
    students: [
      makeStudent('s-9-1', 'Indira Das', 'indira.das@email.com', '+91 98166 11223', 'ENR-2026-9001', 'Pending', 0, 0),
    ],
  }),
  makeBatch({
    id: 'batch-10',
    batchId: 'BATCH-2025-005',
    courseName: 'Digital Marketing',
    batchLabel: 'Hybrid Batch',
    trainerName: 'Priya Nambiar',
    startDate: '2025-01-20',
    endDate: '2025-06-20',
    status: 'Active',
    students: [
      makeStudent('s-10-1', 'Jatin Mehra', 'jatin.m@email.com', '+91 98733 44556', 'ENR-2025-10001', 'Paid', 94, 88),
      makeStudent('s-10-2', 'Kavita Sinha', 'kavita.s@email.com', '+91 91277 66778', 'ENR-2025-10002', 'Paid', 91, 85),
      makeStudent('s-10-3', 'Lalit Oberoi', 'lalit.o@email.com', '+91 99844 88990', 'ENR-2025-10003', 'Paid', 88, 82),
      makeStudent('s-10-4', 'Maya Krishnan', 'maya.k@email.com', '+91 97666 00112', 'ENR-2025-10004', 'Partial', 77, 74),
      makeStudent('s-10-5', 'Naveen Chopra', 'naveen.c@email.com', '+91 93466 22334', 'ENR-2025-10005', 'Pending', 62, 58),
    ],
  }),
]

export { PAYMENT_STATUSES, BATCH_STATUSES, STUDENT_STATUSES }

export function formatBatchDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function nextEnrollmentId(batches) {
  let max = 2025000
  for (const batch of batches) {
    for (const s of batch.students) {
      const num = parseInt(String(s.enrollmentId).replace(/\D/g, ''), 10)
      if (num > max) max = num
    }
  }
  return `ENR-${max + 1}`
}

export function nextStudentId() {
  return `student-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
