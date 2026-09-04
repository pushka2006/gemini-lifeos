import { describe, it, expect, beforeEach } from 'vitest';
import {
  getJournalEntries,
  saveJournalEntry,
  getMemories,
  saveMemory,
  getGoals,
  saveGoal,
  getTasks,
  saveTask,
  deleteJournalEntry,
} from '../../src/services/storage';
import { JournalEntry, Memory, Goal, TaskItem } from '../../src/types';

describe('Security & Cross-User Data Isolation', () => {
  const USER_A = 'usr_alpha_999';
  const USER_B = 'usr_bravo_888';

  beforeEach(() => {
    localStorage.clear();
  });

  it('MUST prevent unauthenticated queries with missing UID', async () => {
    await expect(getJournalEntries('')).rejects.toThrow(/Security violation/);
    await expect(saveJournalEntry('', {} as JournalEntry)).rejects.toThrow(/Security violation/);
  });

  it('USER A CANNOT READ USER B\'S JOURNAL DATA', async () => {
    // 1. User A stores a confidential personal journal entry
    const userAEntry: JournalEntry = {
      id: 'entry_confidential_alpha',
      title: 'User A Secret Strategy Blueprint',
      rawContent: 'Strictly confidential proprietary research for User A.',
      mood: 'Focused',
      emotions: ['determined'],
      keyEvents: ['Secret R&D milestone'],
      topics: ['Classified'],
      lessons: ['Keep data isolated'],
      gratitude: ['Privacy'],
      tags: ['secret'],
      date: '2026-09-04',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveJournalEntry(USER_A, userAEntry);

    // 2. User B queries their journal entries
    const userBEntries = await getJournalEntries(USER_B);

    // 3. Verify User B gets ZERO of User A's entries
    expect(userBEntries).toHaveLength(0);
    expect(userBEntries.some(e => e.id === userAEntry.id)).toBe(false);

    // 4. Verify User A can still retrieve their own entry
    const userAEntries = await getJournalEntries(USER_A);
    expect(userAEntries).toHaveLength(1);
    expect(userAEntries[0].id).toBe('entry_confidential_alpha');
    expect(userAEntries[0].title).toBe('User A Secret Strategy Blueprint');
  });

  it('USER A CANNOT READ USER B\'S MEMORIES OR GOALS', async () => {
    // User A creates memory
    const userAMemory: Memory = {
      id: 'mem_a_1',
      category: 'preference',
      content: 'User A personal medical routine',
      confidence: 1.0,
      source: 'User Input',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveMemory(USER_A, userAMemory);

    // User B creates a separate goal
    const userBGoal: Goal = {
      id: 'goal_b_1',
      title: 'User B Marathon Target',
      description: 'Run 42km by December',
      category: 'health',
      progress: 25,
      milestones: [{ id: 'ms1', title: '5km run', completed: true }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveGoal(USER_B, userBGoal);

    // Verify isolation
    const userBMemories = await getMemories(USER_B);
    expect(userBMemories).toHaveLength(0);

    const userAGoals = await getGoals(USER_A);
    expect(userAGoals).toHaveLength(0);

    const userBGoals = await getGoals(USER_B);
    expect(userBGoals).toHaveLength(1);
    expect(userBGoals[0].id).toBe('goal_b_1');
  });

  it('Deletion in User A vault does not corrupt User B vault', async () => {
    const entryA: JournalEntry = {
      id: 'entry_shared_id_name',
      title: 'User A Entry',
      rawContent: 'Content A',
      mood: 'Calm',
      emotions: ['calm'],
      keyEvents: [],
      topics: [],
      lessons: [],
      gratitude: [],
      tags: [],
      date: '2026-09-04',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const entryB: JournalEntry = {
      id: 'entry_shared_id_name',
      title: 'User B Entry',
      rawContent: 'Content B',
      mood: 'Energetic',
      emotions: ['excited'],
      keyEvents: [],
      topics: [],
      lessons: [],
      gratitude: [],
      tags: [],
      date: '2026-09-04',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveJournalEntry(USER_A, entryA);
    await saveJournalEntry(USER_B, entryB);

    // User A deletes their entry
    await deleteJournalEntry(USER_A, 'entry_shared_id_name');

    // Verify User A has 0, but User B still has their entry intact!
    expect(await getJournalEntries(USER_A)).toHaveLength(0);
    const bEntries = await getJournalEntries(USER_B);
    expect(bEntries).toHaveLength(1);
    expect(bEntries[0].title).toBe('User B Entry');
  });
});
