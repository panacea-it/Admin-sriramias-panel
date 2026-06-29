import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
  User,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../academics/AcademicsUi'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { cn } from '../../utils/cn'

function DetailSection({ title, description, children, className }) {
  return (
    <section
      className={cn(
        'rounded-xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:p-6',
        className,
      )}
    >
      <div className="mb-5 border-b border-[#eef2fc] pb-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#246392]">{title}</h2>
        {description ? <p className="mt-1 text-xs text-[#686868]">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

function DetailItem({ label, children, className }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-[#686868]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children}</div>
    </div>
  )
}

function EmptyValue({ children = 'Not available' }) {
  return <span className="font-medium text-[#9ca3af]">{children}</span>
}

function displayValue(value) {
  const v = typeof value === 'string' ? value.trim() : value
  if (v == null || v === '') return <EmptyValue />
  return v
}

function DocumentCard({ label, fileName, uploadedAt }) {
  return (
    <div className="rounded-xl border border-[#eef2fc] bg-gradient-to-b from-[#fafcff] to-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef6fc] ring-1 ring-[#cfe8f8]/80">
          <FileText className="h-5 w-5 text-[#246392]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#111]">{label}</p>
          {fileName ? (
            <>
              <p className="mt-1 truncate text-xs text-[#686868]">{fileName}</p>
              {uploadedAt ? (
                <p className="mt-0.5 text-xs text-[#9ca0a8]">{formatCategoryDateTime(uploadedAt)}</p>
              ) : null}
            </>
          ) : (
            <p className="mt-1 text-xs text-[#9ca3af]">No file uploaded</p>
          )}
        </div>
      </div>
    </div>
  )
}

const DOCUMENT_SLOTS = [
  { key: 'id_proof', label: 'ID Proof', types: ['aadhaar', 'pan', 'id_proof', 'idProof'] },
  { key: 'certificates', label: 'Certificates', types: ['certificate', 'certificates', 'scholarship'] },
  {
    key: 'supporting',
    label: 'Supporting Documents',
    types: ['payment_proof', 'fee_agreement', 'loan_agreement', 'supporting', 'other'],
  },
]

function resolveDocumentSlot(documents, slot) {
  return documents.find((doc) => {
    const type = String(doc.type || doc.documentType || '').toLowerCase()
    return slot.types.some((candidate) => type.includes(candidate))
  })
}

export default function UserDetailPageView({ model, loading, onEdit }) {
  if (loading) {
    return (
      <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-12 text-center">
        <p className="text-[#686868]">Loading user profile…</p>
      </div>
    )
  }

  if (!model) {
    return (
      <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-12 text-center">
        <p className="text-[#686868]">User not found.</p>
        <Link to="/users/manage" className="mt-4 inline-block font-semibold text-[#246392] hover:underline">
          ← Back to List Users
        </Link>
      </div>
    )
  }

  const { basic, student, family, address, access, documents, activity } = model
  const initials = basic.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7]">
      <div className="sticky top-0 z-20 border-b border-[#eef2fc] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-6">
          <Link
            to="/users/manage"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#246392] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List Users
          </Link>
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(36,99,146,0.28)] transition hover:brightness-110"
            >
              <Pencil className="h-4 w-4" />
              Edit User
            </button>
          ) : null}
        </div>
      </div>

      <section className="mx-auto max-w-screen-2xl space-y-6 px-4 pb-10 pt-6 sm:px-5 lg:px-6">
        <DetailSection title="Basic Information" description="Primary identity and contact profile.">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex shrink-0 items-center gap-4">
              {basic.avatar ? (
                <img
                  src={basic.avatar}
                  alt=""
                  className="h-20 w-20 rounded-2xl border-2 border-[#eef2fc] object-cover shadow-md"
                />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#eef6fc] text-2xl font-bold text-[#246392] ring-1 ring-[#cfe8f8]">
                  {initials || <User className="h-8 w-8" />}
                </span>
              )}
              <div className="min-w-0 lg:hidden">
                <p className="text-lg font-bold text-[#111]">{basic.fullName}</p>
                <p className="font-mono text-xs text-[#686868]">{displayValue(basic.username)}</p>
              </div>
            </div>
            <div className="grid flex-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <DetailItem label="Full Name" className="hidden lg:block sm:col-span-2 xl:col-span-3">
                {basic.fullName}
              </DetailItem>
              <DetailItem label="Username">{displayValue(basic.username)}</DetailItem>
              <DetailItem label="Email Address">
                <span className="inline-flex items-center gap-2 break-all">
                  <Mail className="h-4 w-4 shrink-0 text-[#686868]" />
                  {displayValue(basic.email)}
                </span>
              </DetailItem>
              <DetailItem label="Mobile Number">
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#686868]" />
                  {displayValue(basic.mobile)}
                </span>
              </DetailItem>
              <DetailItem label="Gender">{displayValue(basic.gender)}</DetailItem>
              <DetailItem label="Date of Birth">{displayValue(basic.dateOfBirth)}</DetailItem>
            </div>
          </div>
        </DetailSection>

        {student ? (
          <DetailSection
            title="Student Information"
            description="Enrollment and academic assignment details."
          >
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <DetailItem label="Student ID">
                <span className="font-mono text-xs">{displayValue(student.studentId)}</span>
              </DetailItem>
              <DetailItem label="Batch">{displayValue(student.batch)}</DetailItem>
              <DetailItem label="Course">{displayValue(student.course)}</DetailItem>
              <DetailItem label="Program">{displayValue(student.program)}</DetailItem>
              <DetailItem label="Center">
                <span className="inline-flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#686868]" />
                  {displayValue(student.center)}
                </span>
              </DetailItem>
              <DetailItem label="Admission Date">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#686868]" />
                  {displayValue(student.admissionDate)}
                </span>
              </DetailItem>
              <DetailItem label="Assigned Mentor">{displayValue(student.assignedMentor)}</DetailItem>
              <DetailItem label="Enrollment Status">
                <StatusBadge status={student.enrollmentStatus || access.accountStatus} />
              </DetailItem>
            </div>
          </DetailSection>
        ) : null}

        <DetailSection title="Family Details" description="Parent and guardian contact information.">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <DetailItem label="Father's Name">
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-[#686868]" />
                {displayValue(family.fatherName)}
              </span>
            </DetailItem>
            <DetailItem label="Mother's Name">{displayValue(family.motherName)}</DetailItem>
            <DetailItem label="Guardian Name">{displayValue(family.guardianName)}</DetailItem>
            <DetailItem label="Guardian Contact Number">
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#686868]" />
                {displayValue(family.guardianContact)}
              </span>
            </DetailItem>
            <DetailItem label="Emergency Contact">{displayValue(family.emergencyContact)}</DetailItem>
          </div>
        </DetailSection>

        <DetailSection title="Address" description="Residential and correspondence address.">
          <div className="grid gap-6 sm:grid-cols-2">
            <DetailItem label="Address Line" className="sm:col-span-2">
              <span className="inline-flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#686868]" />
                {displayValue(address.addressLine)}
              </span>
            </DetailItem>
            <DetailItem label="City">{displayValue(address.city)}</DetailItem>
            <DetailItem label="State">{displayValue(address.state)}</DetailItem>
            <DetailItem label="Country">{displayValue(address.country)}</DetailItem>
            <DetailItem label="Pincode">{displayValue(address.pincode)}</DetailItem>
          </div>
        </DetailSection>

        <DetailSection title="Access & Status" description="Role, account state, and audit timestamps.">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <DetailItem label="User Role">
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#686868]" />
                {displayValue(access.role)}
              </span>
            </DetailItem>
            <DetailItem label="Account Status">
              <StatusBadge status={access.accountStatus} />
            </DetailItem>
            <DetailItem label="Active / Inactive">
              {access.isActive ? 'Active' : 'Inactive'}
            </DetailItem>
            <DetailItem label="Last Login">
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#686868]" />
                {displayValue(access.lastLogin)}
              </span>
            </DetailItem>
            <DetailItem label="Created Date">{displayValue(access.createdDate)}</DetailItem>
            <DetailItem label="Updated Date">{displayValue(access.updatedDate)}</DetailItem>
          </div>
        </DetailSection>

        <DetailSection title="Documents" description="Uploaded identity and supporting files.">
          {documents.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DOCUMENT_SLOTS.map((slot) => (
                <DocumentCard key={slot.key} label={slot.label} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DOCUMENT_SLOTS.map((slot) => {
                const doc = resolveDocumentSlot(documents, slot)
                return (
                  <DocumentCard
                    key={slot.key}
                    label={slot.label}
                    fileName={doc?.fileName || doc?.name}
                    uploadedAt={doc?.uploadedAt}
                  />
                )
              })}
            </div>
          )}
          {documents.length === 0 ? (
            <p className="mt-4 text-center text-sm text-[#9ca3af]">No documents uploaded yet.</p>
          ) : null}
        </DetailSection>

        <DetailSection title="Activity Timeline" description="Recent account events and login history.">
          {activity.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#dbe4f0] bg-[#fafcff] px-6 py-10 text-center text-sm text-[#9ca3af]">
              No activity recorded yet.
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#686868]">
                  Recent Activity
                </h3>
                <ul className="space-y-0">
                  {activity.map((event) => (
                    <li
                      key={event.id}
                      className="relative flex gap-4 border-l-2 border-[#cbeeff] py-4 pl-6 last:pb-0"
                    >
                      <span className="absolute -left-[7px] top-5 h-3 w-3 rounded-full bg-[#55ace7]" />
                      <div>
                        <p className="font-semibold text-[#111]">{event.title}</p>
                        <p className="mt-1 text-xs capitalize text-[#686868]">{event.type}</p>
                        <p className="mt-0.5 text-xs text-[#9ca0a8]">
                          {formatCategoryDateTime(event.timestamp)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {model.loginHistory?.length > 0 ? (
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#686868]">
                    Login History
                  </h3>
                  <ul className="space-y-2">
                    {model.loginHistory.map((event) => (
                      <li
                        key={`login-${event.id}`}
                        className="flex items-center justify-between rounded-lg bg-[#f8fafc] px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-[#111]">{event.title}</span>
                        <span className="text-xs text-[#686868]">
                          {formatCategoryDateTime(event.timestamp)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </DetailSection>
      </section>
    </div>
  )
}
