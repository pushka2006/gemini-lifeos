import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AiOrb } from '../../src/components/orb/AiOrb';
import { AIState } from '../../src/types';

describe('AiOrb Component', () => {
  it('renders correctly in IDLE state with ONLINE badge', () => {
    render(<AiOrb state="IDLE" />);
    expect(screen.getByText(/ONLINE • READY/i)).toBeInTheDocument();
  });

  it('renders correctly in LISTENING state', () => {
    render(<AiOrb state="LISTENING" />);
    expect(screen.getByText(/LISTENING\.\.\./i)).toBeInTheDocument();
  });

  it('renders correctly in THINKING state', () => {
    render(<AiOrb state="THINKING" />);
    expect(screen.getByText(/THINKING\.\.\./i)).toBeInTheDocument();
  });

  it('renders all 6 states seamlessly without crashing', () => {
    const states: AIState[] = ['IDLE', 'LISTENING', 'THINKING', 'RESPONDING', 'SAVING', 'ERROR'];
    for (const st of states) {
      const { unmount } = render(<AiOrb state={st} />);
      expect(screen.getByTestId('ai-orb-container')).toBeInTheDocument();
      unmount();
    }
  });
});
