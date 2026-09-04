import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  AIState,
  JournalEntry,
  Memory,
  Goal,
  TaskItem,
  DailyReflection,
  AppNotification,
  ExtractedTask,
} from '../types';
import {
  getJournalEntries,
  saveJournalEntry,
  deleteJournalEntry,
  getMemories,
  saveMemory,
  deleteMemory,
  clearAllMemories,
  getGoals,
  saveGoal,
  deleteGoal,
  getTasks,
  saveTask,
  deleteTask,
  getReflections,
  saveReflection,
} from '../services/storage';

interface LifeOSContextType {
  aiState: AIState;
  setAiState: (state: AIState) => void;
  entries: JournalEntry[];
  addEntry: (entry: JournalEntry) => Promise<void>;
  updateEntry: (entry: JournalEntry) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  memories: Memory[];
  addMemory: (category: Memory['category'], content: string, source?: string) => Promise<void>;
  removeMemory: (id: string) => Promise<void>;
  clearMemories: () => Promise<void>;
  goals: Goal[];
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  toggleMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  tasks: TaskItem[];
  addTask: (task: TaskItem) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  addTasksFromExtraction: (extracted: ExtractedTask[]) => Promise<void>;
  reflections: DailyReflection[];
  addReflection: (reflection: DailyReflection) => Promise<void>;
  notifications: AppNotification[];
  addNotification: (title: string, message: string, type?: AppNotification['type']) => void;
  markNotificationAsRead: (id: string) => void;
  memoryEnabled: boolean;
  setMemoryEnabled: (val: boolean) => void;
  autoSummarize: boolean;
  setAutoSummarize: (val: boolean) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  refreshAll: () => Promise<void>;
}

const LifeOSContext = createContext<LifeOSContextType | undefined>(undefined);

export const LifeOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [aiState, setAiState] = useState<AIState>('IDLE');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-welcome',
      title: 'Gemini LifeOS Online',
      message: 'All neural telemetry and private memory vaults initialized.',
      type: 'ai',
      timestamp: new Date().toISOString(),
      read: false,
    }
  ]);

  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [autoSummarize, setAutoSummarize] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');

  // Load user-scoped data whenever authenticated user changes
  const loadUserData = useCallback(async (uid: string) => {
    try {
      const [userEntries, userMemories, userGoals, userTasks, userReflections] = await Promise.all([
        getJournalEntries(uid),
        getMemories(uid),
        getGoals(uid),
        getTasks(uid),
        getReflections(uid),
      ]);

      // Seed initial high-fidelity sample data if new user
      if (userEntries.length === 0 && userGoals.length === 0) {
        const initialDate = new Date().toISOString().split('T')[0];
        const seedEntry: JournalEntry = {
          id: 'entry-seed-1',
          title: 'Genesis: Launching Gemini LifeOS Workspace',
          rawContent: 'Started configuring my personal AI operating system today. I felt a surge of energy and focus building out the neural interface and isolating private memories.',
          formattedContent: 'Started configuring my personal AI operating system today.\n\nI felt a surge of energy and focus building out the neural interface and isolating private memories.',
          summary: 'Initiated Gemini LifeOS configuration with high focus and enthusiasm for private AI cognition.',
          mood: 'Energetic',
          emotions: ['focused', 'inspired', 'determined'],
          keyEvents: ['Initialized Gemini LifeOS workspace', 'Secured private Firestore data layer'],
          topics: ['Architecture', 'Productivity', 'AI'],
          lessons: ['Systematic design and clear boundaries accelerate complex engineering.'],
          gratitude: ['Modern web capabilities and generative AI companion technology.'],
          suggestedNextAction: 'Review pending milestones and schedule the next deep work sprint.',
          tags: ['lifeos', 'launch', 'productivity'],
          date: initialDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveJournalEntry(uid, seedEntry);
        userEntries.push(seedEntry);

        const seedGoal: Goal = {
          id: 'goal-seed-1',
          title: 'Deploy Gemini LifeOS Assistant by Q4',
          description: 'Build a production-grade personal AI workspace with streaming multi-turn chat, voice journaling, and knowledge retrieval.',
          category: 'career',
          deadline: '2026-11-30',
          progress: 65,
          milestones: [
            { id: 'm1', title: 'Design Glassmorphic Cyber Interface & AI Orb', completed: true },
            { id: 'm2', title: 'Implement Strict User-Scoped Firestore Security Rules', completed: true },
            { id: 'm3', title: 'Connect Streaming Multi-Turn Gemini Backend', completed: true },
            { id: 'm4', title: 'Deploy to Cloud & Verify Automated Test Suite', completed: false },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveGoal(uid, seedGoal);
        userGoals.push(seedGoal);

        const seedTasks: TaskItem[] = [
          {
            id: 'task-seed-1',
            title: 'Verify cross-user Firestore isolation tests',
            deadline: 'Tomorrow',
            priority: 'high',
            status: 'pending',
            source: 'conversation',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'task-seed-2',
            title: 'Record audio voice journal entry for testing',
            deadline: 'This afternoon',
            priority: 'medium',
            status: 'completed',
            source: 'journal',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'task-seed-3',
            title: 'Configure Google Cloud Secret Manager for production deploy',
            deadline: 'Friday',
            priority: 'high',
            status: 'pending',
            source: 'manual',
            createdAt: new Date().toISOString(),
          },
        ];
        for (const t of seedTasks) await saveTask(uid, t);
        userTasks.push(...seedTasks);

        const seedMemory: Memory = {
          id: 'mem-seed-1',
          category: 'preference',
          content: 'Prefers concise, actionable summaries and high-contrast obsidian dark themes.',
          confidence: 0.95,
          source: 'User Onboarding',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveMemory(uid, seedMemory);
        userMemories.push(seedMemory);
      }

      setEntries(userEntries);
      setMemories(userMemories);
      setGoals(userGoals);
      setTasks(userTasks);
      setReflections(userReflections);
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
      loadUserData(user.uid);
    } else {
      setEntries([]);
      setMemories([]);
      setGoals([]);
      setTasks([]);
      setReflections([]);
    }
  }, [user?.uid, loadUserData]);

  const addNotification = (title: string, message: string, type: AppNotification['type'] = 'info') => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const addEntry = async (entry: JournalEntry) => {
    if (!user?.uid) return;
    setAiState('SAVING');
    await saveJournalEntry(user.uid, entry);
    setEntries(prev => [entry, ...prev.filter(e => e.id !== entry.id)]);
    addNotification('Journal Entry Saved', `"${entry.title}" secured in your vault.`, 'success');
    setAiState('IDLE');
  };

  const updateEntry = async (entry: JournalEntry) => {
    if (!user?.uid) return;
    await saveJournalEntry(user.uid, entry);
    setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
  };

  const removeEntry = async (id: string) => {
    if (!user?.uid) return;
    await deleteJournalEntry(user.uid, id);
    setEntries(prev => prev.filter(e => e.id !== id));
    addNotification('Entry Removed', 'Journal record deleted.', 'info');
  };

  const addMemory = async (category: Memory['category'], content: string, source = 'User Defined') => {
    if (!user?.uid || !memoryEnabled) return;
    const mem: Memory = {
      id: `mem-${Date.now()}`,
      category,
      content,
      confidence: 0.9,
      source,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveMemory(user.uid, mem);
    setMemories(prev => [mem, ...prev]);
    addNotification('Memory Encrypted', `New long-term fact registered: ${content.slice(0, 30)}...`, 'ai');
  };

  const removeMemory = async (id: string) => {
    if (!user?.uid) return;
    await deleteMemory(user.uid, id);
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const clearMemories = async () => {
    if (!user?.uid) return;
    await clearAllMemories(user.uid);
    setMemories([]);
    addNotification('Memories Cleared', 'All personal memory vectors wiped.', 'warning');
  };

  const addGoal = async (goal: Goal) => {
    if (!user?.uid) return;
    await saveGoal(user.uid, goal);
    setGoals(prev => [goal, ...prev]);
    addNotification('Goal Initialized', `"${goal.title}" added to trajectory.`, 'success');
  };

  const updateGoal = async (goal: Goal) => {
    if (!user?.uid) return;
    await saveGoal(user.uid, goal);
    setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
  };

  const removeGoal = async (id: string) => {
    if (!user?.uid) return;
    await deleteGoal(user.uid, id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const toggleMilestone = async (goalId: string, milestoneId: string) => {
    if (!user?.uid) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedMilestones = goal.milestones.map(m =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100);

    const updatedGoal: Goal = {
      ...goal,
      milestones: updatedMilestones,
      progress,
      updatedAt: new Date().toISOString(),
    };
    await saveGoal(user.uid, updatedGoal);
    setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));

    if (progress === 100) {
      addNotification('Goal Achieved! 🏆', `Milestones 100% complete for "${goal.title}".`, 'success');
    }
  };

  const addTask = async (task: TaskItem) => {
    if (!user?.uid) return;
    await saveTask(user.uid, task);
    setTasks(prev => [task, ...prev]);
    addNotification('Task Added', task.title, 'info');
  };

  const toggleTask = async (id: string) => {
    if (!user?.uid) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated: TaskItem = {
      ...task,
      status: task.status === 'completed' ? 'pending' : 'completed',
    };
    await saveTask(user.uid, updated);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  const removeTask = async (id: string) => {
    if (!user?.uid) return;
    await deleteTask(user.uid, id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addTasksFromExtraction = async (extracted: ExtractedTask[]) => {
    if (!user?.uid) return;
    const newItems: TaskItem[] = extracted.map((ext, idx) => ({
      id: `task-ext-${Date.now()}-${idx}`,
      title: ext.title,
      deadline: ext.deadline,
      priority: ext.priority,
      status: 'pending',
      source: 'conversation',
      createdAt: new Date().toISOString(),
    }));
    for (const item of newItems) {
      await saveTask(user.uid, item);
    }
    setTasks(prev => [...newItems, ...prev]);
    addNotification('Tasks Extracted', `Added ${newItems.length} actionable items from conversation.`, 'ai');
  };

  const addReflection = async (ref: DailyReflection) => {
    if (!user?.uid) return;
    await saveReflection(user.uid, ref);
    setReflections(prev => [ref, ...prev]);
    addNotification('Daily Reflection Logged', `Growth score: ${ref.growthScore}%`, 'success');
  };

  const refreshAll = async () => {
    if (user?.uid) await loadUserData(user.uid);
  };

  return (
    <LifeOSContext.Provider
      value={{
        aiState,
        setAiState,
        entries,
        addEntry,
        updateEntry,
        removeEntry,
        memories,
        addMemory,
        removeMemory,
        clearMemories,
        goals,
        addGoal,
        updateGoal,
        removeGoal,
        toggleMilestone,
        tasks,
        addTask,
        toggleTask,
        removeTask,
        addTasksFromExtraction,
        reflections,
        addReflection,
        notifications,
        addNotification,
        markNotificationAsRead,
        memoryEnabled,
        setMemoryEnabled,
        autoSummarize,
        setAutoSummarize,
        selectedModel,
        setSelectedModel,
        refreshAll,
      }}
    >
      {children}
    </LifeOSContext.Provider>
  );
};

export const useLifeOS = () => {
  const ctx = useContext(LifeOSContext);
  if (!ctx) throw new Error('useLifeOS must be used within a LifeOSProvider');
  return ctx;
};
