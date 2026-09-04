import { describe, it, expect } from 'vitest';
import { analyzeJournal } from '../../src/services/api';

describe('AI Journal Analysis Engine', () => {
  it('extracts structured mood, emotions, and gratitude from journal text', async () => {
    const rawText = 'Today I felt really productive and happy because our team finished the sprint on time. I am grateful for my supportive teammates.';
    const result = await analyzeJournal(rawText);

    expect(result).toBeDefined();
    expect(result.title).toBeTruthy();
    expect(result.summary).toBeTruthy();
    expect(['Energetic', 'Optimistic', 'Focused', 'Calm', 'Reflective', 'Grateful']).toContain(result.mood);
    expect(result.gratitude.length).toBeGreaterThan(0);
    expect(result.tags.length).toBeGreaterThan(0);
  });

  it('detects stressed mood when anxiety/stress markers are prevalent', async () => {
    const rawText = 'I am overwhelmed and stressed with too many deadlines this week.';
    const result = await analyzeJournal(rawText);

    expect(result.mood).toBe('Stressed');
  });
});
