export type AIState = 'IDLE' | 'LISTENING' | 'THINKING' | 'RESPONDING' | 'SAVING' | 'ERROR';

export type ChatMode = 'GENERAL' | 'JOURNAL' | 'BRAINSTORM' | 'REFLECTION' | 'GOALS' | 'STUDY' | 'PLANNING';

export type MoodType = 'Energetic' | 'Optimistic' | 'Focused' | 'Calm' | 'Reflective' | 'Stressed' | 'Overwhelmed' | 'Melancholic' | 'Grateful';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  preferences?: {
    theme?: 'dark';
    aiModel?: string;
    memoryEnabled?: boolean;
    autoSummarize?: boolean;
    voiceAccent?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  mode?: ChatMode;
  extractedTasks?: ExtractedTask[];
}

export interface Conversation {
  id: string;
  title: string;
  mode: ChatMode;
  createdAt: string;
  updatedAt: string;
  summary?: string;
  messageCount: number;
}

export interface JournalEntry {
  id: string;
  title: string;
  rawContent: string;
  formattedContent?: string;
  summary?: string;
  mood: MoodType;
  emotions: string[];
  keyEvents: string[];
  topics: string[];
  lessons: string[];
  gratitude: string[];
  suggestedNextAction?: string;
  tags: string[];
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  isDraft?: boolean;
}

export interface Memory {
  id: string;
  category: 'preference' | 'goal' | 'project' | 'fact' | 'insight';
  content: string;
  confidence: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
  targetDays?: number;
  deadline?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'health' | 'learning' | 'personal' | 'financial';
  deadline?: string;
  progress: number; // 0 to 100
  milestones: GoalMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  goalId?: string;
  source?: 'conversation' | 'journal' | 'manual';
  createdAt: string;
}

export interface ExtractedTask {
  title: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface DailyReflection {
  id: string;
  date: string;
  wentWell: string;
  challenged: string;
  learned: string;
  tomorrow: string;
  synthesis: string;
  emotionalBalance: string;
  growthScore: number;
  coreTakeaway: string;
  createdAt: string;
}

export interface MorningBriefData {
  date: string;
  greeting: string;
  yesterdayRecap: string;
  priorityFocus: string;
  motivationalMessage: string;
  suggestedPace: string;
  goals: string[];
  tasks: string[];
  generatedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'ai';
  timestamp: string;
  read: boolean;
  link?: string;
}
