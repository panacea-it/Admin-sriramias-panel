export const NOTIFICATION_CENTERS = ['New Delhi', 'Hyderabad', 'Pune']

export const NOTIFICATION_TYPES = ['Video', 'Text', 'PDF', 'Image']

export const USER_TYPE_OPTIONS = [
  'All Users',
  'Students',
  'Faculty',
  'Center Admins',
]

export const INITIAL_PUSH_NOTIFICATIONS = [
  {
    id: 56565,
    sentBy: 'Admin',
    device: 'Android',
    message: 'GEOGRAPHY MAY 14 class is live on 2026-05-14 09:18',
    center: 'New Delhi',
    type: 'Video',
    sentTime: '10 AM',
    sentDate: '26 March 2026',
    dateBucket: 'Today',
    userType: 'All Users',
    title: 'Geography class live',
    url: '',
  },
  {
    id: 56566,
    sentBy: 'Admin',
    device: 'iOS',
    message: 'CHEMISTRY revision session starts at 2 PM today.',
    center: 'Hyderabad',
    type: 'Video',
    sentTime: '9 AM',
    sentDate: '26 March 2026',
    dateBucket: 'Today',
    userType: 'Students',
    title: 'Chemistry revision',
    url: '',
  },
  {
    id: 56567,
    sentBy: 'Priya Sharma',
    device: 'Android',
    message: 'New study material uploaded for Current Affairs — March 2026.',
    center: 'Pune',
    type: 'Text',
    sentTime: '8 AM',
    sentDate: '25 March 2026',
    dateBucket: 'This Week',
    userType: 'All Users',
    title: 'Current Affairs update',
    url: 'https://example.com/ca-march',
  },
  {
    id: 56568,
    sentBy: 'Admin',
    device: 'Android',
    message: 'Physics doubt session recording is now available.',
    center: 'New Delhi',
    type: 'Video',
    sentTime: '6 PM',
    sentDate: '24 March 2026',
    dateBucket: 'This Week',
    userType: 'Students',
    title: 'Physics recording',
    url: '',
  },
]

export const EMPTY_NOTIFICATION_FORM = {
  userType: 'All Users',
  title: '',
  message: '',
  url: '',
  pdfName: '',
  videoName: '',
  imageName: '',
}
