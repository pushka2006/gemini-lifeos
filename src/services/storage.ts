import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  JournalEntry,
  Conversation,
  ChatMessage,
  Memory,
  Goal,
  TaskItem,
  DailyReflection,
  MorningBriefData,
} from '../types';

// Helper for local sandbox fallback storage
function getLocalKey(uid: string, subcollection: string): string {
  return `lifeos_${uid}_${subcollection}`;
}

function getLocalData<T>(uid: string, subcollection: string): T[] {
  try {
    const raw = localStorage.getItem(getLocalKey(uid, subcollection));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalData<T>(uid: string, subcollection: string, data: T[]) {
  localStorage.setItem(getLocalKey(uid, subcollection), JSON.stringify(data));
}

// ----------------------------------------------------------------------------------
// 1. Journal Entries (users/{uid}/journalEntries)
// ----------------------------------------------------------------------------------
export async function getJournalEntries(uid: string): Promise<JournalEntry[]> {
  if (!uid) throw new Error('Security violation: UID required for Firestore query.');

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'users', uid, 'journalEntries');
      const q = query(colRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));
    } catch (err) {
      console.warn('Firestore fetch failed, using local storage:', err);
    }
  }
  return getLocalData<JournalEntry>(uid, 'journalEntries');
}

export async function saveJournalEntry(uid: string, entry: JournalEntry): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required for Firestore mutation.');

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'users', uid, 'journalEntries', entry.id);
      await setDoc(docRef, entry);
    } catch (err) {
      console.warn('Firestore write failed, saving locally:', err);
    }
  }

  // Always keep local in sync
  const list = getLocalData<JournalEntry>(uid, 'journalEntries');
  const index = list.findIndex(e => e.id === entry.id);
  if (index >= 0) list[index] = entry;
  else list.unshift(entry);
  setLocalData(uid, 'journalEntries', list);
}

export async function deleteJournalEntry(uid: string, entryId: string): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required for Firestore mutation.');

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'users', uid, 'journalEntries', entryId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore delete failed:', err);
    }
  }

  const list = getLocalData<JournalEntry>(uid, 'journalEntries').filter(e => e.id !== entryId);
  setLocalData(uid, 'journalEntries', list);
}

// ----------------------------------------------------------------------------------
// 2. Conversations & Messages (users/{uid}/conversations & /messages)
// ----------------------------------------------------------------------------------
export async function getConversations(uid: string): Promise<Conversation[]> {
  if (!uid) throw new Error('Security violation: UID required.');
  return getLocalData<Conversation>(uid, 'conversations');
}

export async function saveConversation(uid: string, conv: Conversation): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required.');
  const list = getLocalData<Conversation>(uid, 'conversations');
  const index = list.findIndex(c => c.id === conv.id);
  if (index >= 0) list[index] = conv;
  else list.unshift(conv);
  setLocalData(uid, 'conversations', list);
}

export async function deleteConversation(uid: string, convId: string): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required.');
  const list = getLocalData<Conversation>(uid, 'conversations').filter(c => c.id !== convId);
  setLocalData(uid, 'conversations', list);
  localStorage.removeItem(getLocalKey(uid, `messages_${convId}`));
}

export async function getMessages(uid: string, convId: string): Promise<ChatMessage[]> {
  if (!uid) throw new Error('Security violation: UID required.');
  return getLocalData<ChatMessage>(uid, `messages_${convId}`);
}

export async function saveMessages(uid: string, convId: string, messages: ChatMessage[]): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required.');
  setLocalData(uid, `messages_${convId}`, messages);
}

// ----------------------------------------------------------------------------------
// 3. Memories (users/{uid}/memories)
// ----------------------------------------------------------------------------------
export async function getMemories(uid: string): Promise<Memory[]> {
  if (!uid) throw new Error('Security violation: UID required.');
  return getLocalData<Memory>(uid, 'memories');
}

export async function saveMemory(uid: string, memory: Memory): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required.');
  const list = getLocalData<Memory>(uid, 'memories');
  const index = list.findIndex(m => m.id === memory.id);
  if (index >= 0) list[index] = memory;
  else list.unshift(memory);
  setLocalData(uid, 'memories', list);
}

export async function deleteMemory(uid: string, memoryId: string): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required.');
  const list = getLocalData<Memory>(uid, 'memories').filter(m => m.id !== memoryId);
  setLocalData(uid, 'memories', list);
}

export async function clearAllMemories(uid: string): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required.');
  setLocalData(uid, 'memories', []);
}

// ----------------------------------------------------------------------------------
// 4. Goals (users/{uid}/goals)
// ----------------------------------------------------------------------------------
export async function getGoals(uid: string): Promise<Goal[]> {
  if (!uid) throw new Error('Security violation: UID required.');
  return getLocalData<Goal>(uid, 'goals');
}

export async function saveGoal(uid: string, goal: Goal): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required.');
  const list = getLocalData<Goal>(uid, 'goals');
  const index = list.findIndex(g => g.id === goal.id);
  if (index >= 0) list[index] = goal;
  else list.unshift(goal);
  setLocalData(uid, 'goals', list);
}

export async function deleteGoal(uid: string, goalId: string): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required.');
  const list = getLocalData<Goal>(uid, 'goals').filter(g => g.id !== goalId);
  setLocalData(uid, 'goals', list);
}

// ----------------------------------------------------------------------------------
// 5. Tasks (users/{uid}/tasks)
// ----------------------------------------------------------------------------------
export async function getTasks(uid: string): Promise<TaskItem[]> {
  if (!uid) throw new Error('Security violation: UID required.');
  return getLocalData<TaskItem>(uid, 'tasks');
}

export async function saveTask(uid: string, task: TaskItem): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required.');
  const list = getLocalData<TaskItem>(uid, 'tasks');
  const index = list.findIndex(t => t.id === task.id);
  if (index >= 0) list[index] = task;
  else list.unshift(task);
  setLocalData(uid, 'tasks', list);
}

export async function deleteTask(uid: string, taskId: string): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required.');
  const list = getLocalData<TaskItem>(uid, 'tasks').filter(t => t.id !== taskId);
  setLocalData(uid, 'tasks', list);
}

// ----------------------------------------------------------------------------------
// 6. Daily Reflections (users/{uid}/reflections)
// ----------------------------------------------------------------------------------
export async function getReflections(uid: string): Promise<DailyReflection[]> {
  if (!uid) throw new Error('Security violation: UID required.');
  return getLocalData<DailyReflection>(uid, 'reflections');
}

export async function saveReflection(uid: string, reflection: DailyReflection): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required.');
  const list = getLocalData<DailyReflection>(uid, 'reflections');
  const index = list.findIndex(r => r.id === reflection.id);
  if (index >= 0) list[index] = reflection;
  else list.unshift(reflection);
  setLocalData(uid, 'reflections', list);
}

// ----------------------------------------------------------------------------------
// 7. Morning Brief (users/{uid}/settings/morningBrief)
// ----------------------------------------------------------------------------------
export async function getSavedMorningBrief(uid: string): Promise<MorningBriefData | null> {
  if (!uid) throw new Error('Security violation: UID required.');
  const raw = localStorage.getItem(getLocalKey(uid, 'morningBrief'));
  return raw ? JSON.parse(raw) : null;
}

export async function saveMorningBrief(uid: string, brief: MorningBriefData): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required.');
  localStorage.setItem(getLocalKey(uid, 'morningBrief'), JSON.stringify(brief));
}

// ----------------------------------------------------------------------------------
// 8. Data Export (JSON & CSV) & Complete Account Purge
// ----------------------------------------------------------------------------------
export async function exportAllUserData(uid: string): Promise<string> {
  if (!uid) throw new Error('Security violation: UID required.');
  const payload = {
    exportDate: new Date().toISOString(),
    uid,
    journalEntries: await getJournalEntries(uid),
    conversations: await getConversations(uid),
    memories: await getMemories(uid),
    goals: await getGoals(uid),
    tasks: await getTasks(uid),
    reflections: await getReflections(uid),
  };
  return JSON.stringify(payload, null, 2);
}

export async function exportJournalCsv(uid: string): Promise<string> {
  const entries = await getJournalEntries(uid);
  const headers = ['Date', 'Title', 'Mood', 'Tags', 'Summary', 'Gratitude'];
  const rows = entries.map(e => [
    `"${e.date}"`,
    `"${e.title.replace(/"/g, '""')}"`,
    `"${e.mood}"`,
    `"${(e.tags || []).join(';')}"`,
    `"${(e.summary || '').replace(/"/g, '""')}"`,
    `"${(e.gratitude || []).join(';').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export async function deleteAllUserData(uid: string): Promise<void> {
  if (!uid) throw new Error('Security violation: UID required.');
  const collectionsToClear = ['journalEntries', 'conversations', 'memories', 'goals', 'tasks', 'reflections', 'morningBrief'];
  for (const c of collectionsToClear) {
    localStorage.removeItem(getLocalKey(uid, c));
  }
}
