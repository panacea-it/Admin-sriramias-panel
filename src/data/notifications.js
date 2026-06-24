import { Award, CheckCircle2, Clock, MessageCircle } from 'lucide-react'
import { REWARD_NOTIFICATION_SEEDS } from './rewardNotifications'

export const initialNotifications = [
  {
    id: 1,
    title: 'New Student Enrolled',
    message: 'Rahul Kumar joined Batch B4',
    time: '2 minutes ago',
    read: false,
    icon: CheckCircle2,
    iconBg: '#ecfdf5',
    iconColor: '#16a34a',
  },
  {
    id: 2,
    title: 'Class Starting Soon',
    message: 'Advanced Physics starts in 15 mins',
    time: '12 minutes ago',
    read: false,
    icon: Clock,
    iconBg: '#fff7ed',
    iconColor: '#ea580c',
  },
  {
    id: 3,
    title: 'New Query Received',
    message: 'Student query about exam schedule',
    time: '1 hour ago',
    read: false,
    icon: MessageCircle,
    iconBg: '#eff6ff',
    iconColor: '#2563eb',
  },
  {
    id: 4,
    title: 'Target Achieved',
    message: 'Delhi Center reached 90% attendance',
    time: '2 hours ago',
    read: true,
    icon: Award,
    iconBg: '#f5f3ff',
    iconColor: '#7c3aed',
  },
  ...REWARD_NOTIFICATION_SEEDS,
]
