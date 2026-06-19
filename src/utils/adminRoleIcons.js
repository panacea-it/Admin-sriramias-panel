import { Shield, Building2, Wrench, FileText, GraduationCap, BookOpen, HeartHandshake, Briefcase, Users, Megaphone, Settings, KeyRound, BadgeCheck } from 'lucide-react'

/** Preset icons for dynamic admin access types (IAM-style). */
export const ADMIN_ROLE_ICON_OPTIONS = [
  { key: 'shield', label: 'Shield', Icon: Shield },
  { key: 'building2', label: 'Organization', Icon: Building2 },
  { key: 'wrench', label: 'Operations', Icon: Wrench },
  { key: 'fileText', label: 'Content', Icon: FileText },
  { key: 'graduationCap', label: 'Mentor', Icon: GraduationCap },
  { key: 'bookOpen', label: 'Teaching', Icon: BookOpen },
  { key: 'heartHandshake', label: 'Counseling', Icon: HeartHandshake },
  { key: 'briefcase', label: 'Business', Icon: Briefcase },
  { key: 'users', label: 'People', Icon: Users },
  { key: 'megaphone', label: 'Marketing', Icon: Megaphone },
  { key: 'settings', label: 'Settings', Icon: Settings },
  { key: 'keyRound', label: 'Access', Icon: KeyRound },
  { key: 'badgeCheck', label: 'Compliance', Icon: BadgeCheck },
]

export const adminRoleIconMap = Object.fromEntries(
  ADMIN_ROLE_ICON_OPTIONS.map(({ key, Icon }) => [key, Icon]),
)
