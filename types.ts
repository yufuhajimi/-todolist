
export type TabId = 'inbox' | 'tasks' | 'goals';

export interface InspirationItem {
  id: string;
  type: 'text' | 'image' | 'voice';
  title: string;      // Main heading displayed in menus
  content: string;    // Long body text
  timestamp: string;
  tags: string[];
  imageSrc?: string;
  duration?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  isDaily: boolean;
  date: string; // YYYY-MM-DD
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface GoalItem {
  id: string;
  category: string;
  title: string;
  bgImage: string;
  progress: number; // Derived from milestones
  milestones: Milestone[];
  deadline?: string;
}

export interface PriorityItem {
  id: number;
  title: string;
  subtitle: string;
  label?: string;
}
