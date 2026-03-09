import { EventItem, TeamMember, SiteSettings } from '@/types/event';

export const teamMembers: TeamMember[] = [
  { id: '1', name: 'สมชาย ใจดี' },
  { id: '2', name: 'สมหญิง รักงาน' },
  { id: '3', name: 'วิชัย กล้องดี' },
  { id: '4', name: 'นภา สว่างใส' },
  { id: '5', name: 'ธนกฤต มุ่งมั่น' },
];

export const mockEvents: EventItem[] = [
  {
    id: '1',
    title: 'งานปฐมนิเทศนักศึกษาใหม่',
    activityName: 'ปฐมนิเทศ ประจำปีการศึกษา 2568',
    date: '2026-02-01',
    startTime: '08:00',
    endTime: '16:00',
    location: 'หอประชุมใหญ่',
    description: 'งานต้อนรับนักศึกษาใหม่ทุกคณะ',
    photographers: [teamMembers[0], teamMembers[1]],
    status: 'acknowledged',
    createdAt: '2026-01-20',
  },
  {
    id: '2',
    title: 'การแข่งขันกีฬาสี',
    activityName: 'กีฬาสีประจำปี 2568',
    date: '2026-02-10',
    startTime: '07:00',
    endTime: '18:00',
    location: 'สนามกีฬากลาง',
    description: 'การแข่งขันกีฬาระหว่างคณะ',
    photographers: [teamMembers[0], teamMembers[2], teamMembers[3]],
    status: 'acknowledged',
    createdAt: '2026-01-22',
  },
  {
    id: '3',
    title: 'งานประชุมวิชาการ',
    activityName: 'ประชุมวิชาการนานาชาติ',
    date: '2026-02-15',
    startTime: '09:00',
    endTime: '17:00',
    location: 'ห้องประชุม 101',
    description: 'งานประชุมนำเสนอผลงานวิจัย',
    photographers: [teamMembers[1], teamMembers[4]],
    status: 'confirmed',
    createdAt: '2026-01-25',
  },
  {
    id: '4',
    title: 'พิธีมอบประกาศนียบัตร',
    activityName: 'รับวุฒิบัตร รุ่น 50',
    date: '2026-03-05',
    startTime: '10:00',
    endTime: '14:00',
    location: 'หอประชุมใหญ่',
    photographers: [teamMembers[0], teamMembers[1], teamMembers[2]],
    status: 'pending',
    createdAt: '2026-01-28',
  },
  {
    id: '5',
    title: 'งานแสดงนิทรรศการ',
    activityName: 'นิทรรศการศิลปะ',
    date: '2026-01-30',
    startTime: '09:00',
    endTime: '16:00',
    location: 'อาคารศิลปกรรม',
    photographers: [teamMembers[3]],
    status: 'completed',
    createdAt: '2026-01-15',
  },
];

export const defaultSettings: SiteSettings = {
  siteName: 'ทีมโสตทัศนศึกษา',
  description: 'ระบบจัดการงานถ่ายภาพและวิดีโอ',
};

export const getEventsByMonth = (events: EventItem[], year: number, month: number) => {
  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });
};

export const getEventsStats = (events: EventItem[]) => {
  const total = events.length;
  const pending = events.filter(e => e.status === 'pending').length;
  const confirmed = events.filter(e => e.status === 'confirmed').length;
  const completed = events.filter(e => e.status === 'completed').length;
  const cancelled = events.filter(e => e.status === 'cancelled').length;
  
  return { total, pending, confirmed, completed, cancelled };
};
