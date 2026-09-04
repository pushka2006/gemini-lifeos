import { describe, it, expect } from 'vitest';
import { extractTasks } from '../../src/services/api';

describe('AI Task Extraction Engine', () => {
  it('correctly detects actionable tasks with deadlines from natural conversational sentences', async () => {
    const text = 'I need to finish the frontend and submit the project Friday.';
    const tasks = await extractTasks(text);

    expect(tasks.length).toBeGreaterThan(0);
    const task = tasks[0];
    expect(task.title.toLowerCase()).toContain('finish the frontend');
    expect(task.confidence).toBeGreaterThan(0.5);
  });

  it('returns empty array when text contains no actionable commitments', async () => {
    const text = 'The weather was nice today and the clouds were peaceful.';
    const tasks = await extractTasks(text);
    expect(tasks).toHaveLength(0);
  });
});
