export interface Project {
  id: string;
  name: string;
  domain: string;
  createdAt: Date;
  keywords: number;
  briefs: number;
}

export interface Keyword {
  id: string;
  keyword: string;
  volume: number;
  difficulty: number;
  status: 'pending' | 'analyzing' | 'ready' | 'published';
  projectId: string;
}

export interface ContentBrief {
  id: string;
  title: string;
  keyword: string;
  wordCount: number;
  status: 'draft' | 'generated' | 'published';
  createdAt: Date;
  publishedAt?: Date;
  projectId: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  status: 'scheduled' | 'published' | 'draft';
  briefId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}
