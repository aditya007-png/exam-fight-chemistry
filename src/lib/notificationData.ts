import { NotificationItem } from '../types/notification';

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'CHEM-302 Official Certificate Issued',
    message: 'Congratulations! Your official Certificate of Chemistry Mastery for Advanced Organic Chemistry is ready to download.',
    timestamp: '10 mins ago',
    read: false,
    category: 'grade',
    linkUrl: '/student/certificate/res-001',
    actionLabel: 'View Certificate',
  },
  {
    id: 'notif-2',
    title: 'Live Faculty Broadcast: Exam Update',
    message: 'Dr. Evelyn Vance posted an announcement regarding Question 4 stereochemistry nomenclature on CHEM-302.',
    timestamp: '1 hour ago',
    read: false,
    category: 'broadcast',
    linkUrl: '/student/dashboard',
  },
  {
    id: 'notif-3',
    title: '360° Room Scan Evidence Verified',
    message: 'Your pre-exam 360° environmental room recording was encrypted and approved by the proctoring engine.',
    timestamp: '2 hours ago',
    read: true,
    category: 'security',
    linkUrl: '/student/dashboard',
  },
  {
    id: 'notif-4',
    title: 'AI Diagnostic Study Plan Generated',
    message: 'Your personalized chemistry remediation study plan for Carbonyl Chemistry is now available.',
    timestamp: '1 day ago',
    read: true,
    category: 'exam',
    linkUrl: '/student/study-plan',
    actionLabel: 'Open Study Plan',
  },
];
