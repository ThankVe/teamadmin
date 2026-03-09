export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
}

export interface EventItem {
  id: string;
  title: string;
  activityName: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  photographers: TeamMember[];
  status: 'acknowledged' | 'in_progress' | 'completed';
  createdAt: string;
  coverImage?: string;
}

export interface SiteSettings {
  siteName: string;
  logo?: string;
  bannerImage?: string;
  description?: string;
}
