import React, { useEffect, useRef } from 'react';
import { AIState } from '../../types';

interface AiOrbProps {
  state?: AIState;
  size?: number;
  interactive?: boolean;
  onClick?: () => void;
}

export const AiOrb: React.FC<AiOrbProps> = ({
  state = 'IDLE',
  size = 220,
  interactive = true,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // State color palettes
    const stateColors: Record<AIState, { primary: string; secondary: string; glow: string; speed: number }> = {
      IDLE: {
        primary: '#00f0ff',
        secondary: '#0066ff',
        glow: 'rgba(0, 240, 255, 0.4)',
        speed: 0.02,
      },
      LISTENING: {
        primary: '#00f0ff',
        secondary: '#00ffaa',
        glow: 'rgba(0, 255, 170, 0.65)',
        speed: 0.06,
      },
      THINKING: {
        primary: '#a855f7',
        secondary: '#6366f1',
        glow: 'rgba(168, 85, 247, 0.6)',
        speed: 0.05,
      },
      RESPONDING: {
        primary: '#10b981',
        secondary: '#00f0ff',
        glow: 'rgba(16, 185, 129, 0.6)',
        speed: 0.04,
      },
      SAVING: {
        primary: '#f59e0b',
        secondary: '#eab308',
        glow: 'rgba(245, 158, 11, 0.55)',
        speed: 0.035,
      },
      ERROR: {
        primary: '#f43f5e',
        secondary: '#e11d48',
        glow: 'rgba(244, 63, 94, 0.7)',
        speed: 0.08,
      },
    };

    const currentPalette = stateColors[state] || stateColors.IDLE;

    // Particle field
    const particleCount = 42;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      angle: (i / particleCount) * Math.PI * 2,
      radius: 50 + Math.random() * 45,
      size: 1.5 + Math.random() * 2,
      speed: (0.005 + Math.random() * 0.01) * (i % 2 === 0 ? 1 : -1),
    }));

    const render = () => {
      time += currentPalette.speed;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // 1. Ambient Outer Halo
      const outerGlowRadius = 85 + Math.sin(time * 1.5) * (state === 'LISTENING' ? 14 : 6);
      const outerGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        35,
        centerX,
        centerY,
        outerGlowRadius
      );
      outerGradient.addColorStop(0, currentPalette.glow);
      outerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = outerGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerGlowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Concentric Energy Rings
      const ringCount = state === 'LISTENING' ? 4 : 3;
      for (let r = 0; r < ringCount; r++) {
        const ringTimeOffset = time + r * 1.2;
        const ringRadius = 45 + r * 16 + Math.sin(ringTimeOffset) * 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = r % 2 === 0 ? currentPalette.primary : currentPalette.secondary;
        ctx.lineWidth = r === 0 ? 1.8 : 0.8;
        ctx.globalAlpha = 0.25 + Math.sin(ringTimeOffset) * 0.15;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // 3. Orbiting Quantum Particles
      for (const p of particles) {
        p.angle += p.speed * (state === 'THINKING' ? 2.5 : 1);
        const wobble = Math.sin(time * 2 + p.angle) * 4;
        const px = centerX + Math.cos(p.angle) * (p.radius + wobble);
        const py = centerY + Math.sin(p.angle) * (p.radius + wobble);

        ctx.fillStyle = currentPalette.primary;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Central Solid AI Core Sphere
      const coreRadius = 42 + Math.sin(time * 2) * (state === 'LISTENING' ? 6 : 2.5);
      const coreGradient = ctx.createRadialGradient(
        centerX - 8,
        centerY - 10,
        4,
        centerX,
        centerY,
        coreRadius
      );
      coreGradient.addColorStop(0, '#ffffff');
      coreGradient.addColorStop(0.35, currentPalette.primary);
      coreGradient.addColorStop(0.85, currentPalette.secondary);
      coreGradient.addColorStop(1, '#05070b');

      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.shadowColor = currentPalette.primary;
      ctx.shadowBlur = state === 'ERROR' ? 35 : 22;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // 5. Internal Synapse Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      for (let j = 0; j < 3; j++) {
        const offset = j * (Math.PI / 3) + time;
        const x1 = centerX + Math.cos(offset) * (coreRadius * 0.7);
        const y1 = centerY + Math.sin(offset) * (coreRadius * 0.7);
        const x2 = centerX - Math.cos(offset) * (coreRadius * 0.7);
        const y2 = centerY - Math.sin(offset) * (coreRadius * 0.7);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(
          centerX + Math.sin(time) * 12,
          centerY + Math.cos(time) * 12,
          centerX,
          centerY,
          x2,
          y2
        );
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state]);

  const stateLabels: Record<AIState, { text: string; bg: string; dot: string }> = {
    IDLE: { text: 'ONLINE • READY', bg: 'border-cyan-500/30 bg-cyan-500/10 text-cyan', dot: 'bg-cyan' },
    LISTENING: { text: 'LISTENING...', bg: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400 animate-ping' },
    THINKING: { text: 'THINKING...', bg: 'border-purple-500/30 bg-purple-500/10 text-purple-300', dot: 'bg-purple-400 animate-spin' },
    RESPONDING: { text: 'TRANSMITTING', bg: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', dot: 'bg-emerald-400' },
    SAVING: { text: 'ENCRYPTING & SAVING', bg: 'border-amber-500/30 bg-amber-500/10 text-amber-400', dot: 'bg-amber-400 animate-pulse' },
    ERROR: { text: 'ATTENTION REQUIRED', bg: 'border-rose-500/30 bg-rose-500/10 text-rose-400', dot: 'bg-rose-500' },
  };

  const currentBadge = stateLabels[state] || stateLabels.IDLE;

  return (
    <div
      data-testid="ai-orb-container"
      onClick={interactive ? onClick : undefined}
      className={`relative flex flex-col items-center justify-center select-none ${
        interactive ? 'cursor-pointer group' : ''
      }`}
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Subtle Ambient Radial Backlight */}
        <div
          className="absolute inset-0 -z-10 rounded-full blur-2xl opacity-40 pointer-events-none transition-colors duration-500"
          style={{
            background: state === 'THINKING' ? '#8b5cf6' : state === 'ERROR' ? '#f43f5e' : '#00f0ff',
          }}
        />
      </div>

      {/* State Status Pill */}
      <div
        className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium border backdrop-blur-md transition-all duration-300 ${currentBadge.bg}`}
      >
        <span className={`w-2 h-2 rounded-full ${currentBadge.dot}`} />
        <span>{currentBadge.text}</span>
      </div>
    </div>
  );
};
