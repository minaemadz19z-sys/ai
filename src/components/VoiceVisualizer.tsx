import React, { useEffect, useRef } from 'react';

export type VoiceState = 'disconnected' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'muted';

interface VoiceVisualizerProps {
  state: VoiceState;
  userVolume: number; // 0.0 - 1.0 from microphone
  aiVolume: number;   // 0.0 - 1.0 from AI output audio
  analyserData?: Uint8Array | null;
  onOrbClick?: () => void;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  state,
  userVolume,
  aiVolume,
  analyserData,
  onOrbClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const smoothedVolumeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    const resizeCanvas = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      if (!canvas || !ctx) return;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Determine active target volume and colors
      let targetVolume = 0;
      let primaryColor = '139, 92, 246';   // Purple
      let secondaryColor = '59, 130, 246'; // Blue
      let accentColor = '236, 72, 153';    // Pink

      if (state === 'speaking') {
        targetVolume = Math.max(aiVolume, 0.15);
        primaryColor = '168, 85, 247';   // Neon purple
        secondaryColor = '56, 189, 248'; // Cyan
        accentColor = '244, 63, 94';     // Rose
      } else if (state === 'listening') {
        targetVolume = Math.max(userVolume, 0.08);
        primaryColor = '16, 185, 129';   // Emerald
        secondaryColor = '6, 182, 212';  // Cyan
        accentColor = '99, 102, 241';    // Indigo
      } else if (state === 'thinking') {
        targetVolume = 0.25;
        primaryColor = '245, 158, 11';   // Amber
        secondaryColor = '139, 92, 246'; // Violet
        accentColor = '59, 130, 246';    // Sky
      } else if (state === 'connecting') {
        targetVolume = 0.15;
        primaryColor = '99, 102, 241';   // Indigo
        secondaryColor = '168, 85, 247'; // Purple
        accentColor = '56, 189, 248';    // Sky
      } else if (state === 'muted') {
        targetVolume = 0.05;
        primaryColor = '239, 68, 68';    // Red
        secondaryColor = '249, 115, 22'; // Orange
        accentColor = '107, 114, 128';   // Gray
      } else {
        // Disconnected / idle
        targetVolume = 0.04;
        primaryColor = '99, 102, 241';
        secondaryColor = '139, 92, 246';
        accentColor = '168, 85, 247';
      }

      // Smooth volume transitions
      smoothedVolumeRef.current += (targetVolume - smoothedVolumeRef.current) * 0.18;
      const vol = smoothedVolumeRef.current;

      phaseRef.current += state === 'thinking' ? 0.045 : state === 'speaking' ? 0.035 : 0.018;
      const phase = phaseRef.current;

      const baseRadius = Math.min(width, height) * 0.22;
      const dynamicRadius = baseRadius + vol * 55;

      // 1. Draw outer diffuse glow halos
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        dynamicRadius * 0.4,
        centerX,
        centerY,
        dynamicRadius * 2.4
      );
      glowGrad.addColorStop(0, `rgba(${primaryColor}, ${0.35 + vol * 0.4})`);
      glowGrad.addColorStop(0.5, `rgba(${secondaryColor}, ${0.15 + vol * 0.25})`);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Concentric dynamic ripples if speaking or active
      if (state === 'speaking' || state === 'listening') {
        const rings = 3;
        for (let r = 0; r < rings; r++) {
          const ringProgress = (phase * 0.8 + (r / rings) * Math.PI * 2) % (Math.PI * 2);
          const ringRadius = baseRadius * 1.1 + (ringProgress / (Math.PI * 2)) * baseRadius * 1.2;
          const alpha = Math.max(0, (1 - ringProgress / (Math.PI * 2)) * (0.2 + vol * 0.4));

          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${primaryColor}, ${alpha})`;
          ctx.lineWidth = 1.5 + vol * 3;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 3. Fluid Blob / Deformed Orb using harmonic sin waves
      const numPoints = 64;
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        let distortion = 0;

        if (state === 'speaking' && analyserData && analyserData.length > 0) {
          const freqIndex = Math.floor((i / numPoints) * Math.min(32, analyserData.length));
          const freqValue = analyserData[freqIndex] / 255;
          distortion = Math.sin(angle * 5 + phase * 2) * (freqValue * 30 + vol * 25);
        } else if (state === 'listening') {
          distortion =
            Math.sin(angle * 4 + phase * 2.5) * (vol * 32) +
            Math.cos(angle * 3 - phase) * (vol * 15);
        } else if (state === 'thinking') {
          distortion =
            Math.sin(angle * 3 + phase * 3) * 16 +
            Math.cos(angle * 6 - phase * 2) * 10;
        } else {
          // Idle breathing
          distortion = Math.sin(angle * 3 + phase) * 6;
        }

        const r = dynamicRadius + distortion;
        points.push({
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
        });
      }

      // Draw smooth closed polygon
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }
      ctx.closePath();

      // Fluid internal orb gradient
      const angleOffset = phase * 0.6;
      const gradX1 = centerX + Math.cos(angleOffset) * dynamicRadius;
      const gradY1 = centerY + Math.sin(angleOffset) * dynamicRadius;
      const gradX2 = centerX - Math.cos(angleOffset) * dynamicRadius;
      const gradY2 = centerY - Math.sin(angleOffset) * dynamicRadius;

      const bodyGrad = ctx.createLinearGradient(gradX1, gradY1, gradX2, gradY2);
      bodyGrad.addColorStop(0, `rgb(${primaryColor})`);
      bodyGrad.addColorStop(0.5, `rgb(${secondaryColor})`);
      bodyGrad.addColorStop(1, `rgb(${accentColor})`);

      ctx.fillStyle = bodyGrad;
      ctx.shadowColor = `rgba(${primaryColor}, 0.8)`;
      ctx.shadowBlur = 35 + vol * 30;
      ctx.fill();

      // Inner highlight sheen
      const innerGlow = ctx.createRadialGradient(
        centerX - dynamicRadius * 0.3,
        centerY - dynamicRadius * 0.3,
        dynamicRadius * 0.05,
        centerX,
        centerY,
        dynamicRadius
      );
      innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
      innerGlow.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
      innerGlow.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
      innerGlow.addColorStop(1, 'rgba(0, 0, 0, 0.35)');

      ctx.fillStyle = innerGlow;
      ctx.fill();
      ctx.restore();

      // 4. Subtle particles around orb
      ctx.save();
      const particleCount = 12;
      for (let p = 0; p < particleCount; p++) {
        const pAngle = (p / particleCount) * Math.PI * 2 + phase * 0.3;
        const pDist = dynamicRadius * (1.25 + 0.3 * Math.sin(phase * 2 + p * 1.5));
        const px = centerX + Math.cos(pAngle) * pDist;
        const py = centerY + Math.sin(pAngle) * pDist;
        const pSize = 1.5 + (p % 3) + vol * 3;
        const pAlpha = 0.25 + 0.45 * Math.sin(phase + p);

        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${secondaryColor}, ${pAlpha})`;
        ctx.fill();
      }
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, userVolume, aiVolume, analyserData]);

  // Status badges & text
  const getStatusText = () => {
    switch (state) {
      case 'connecting':
        return 'Connecting to Gemini Live...';
      case 'listening':
        return 'Listening to you...';
      case 'thinking':
        return 'Gemini is thinking...';
      case 'speaking':
        return 'Gemini is speaking...';
      case 'muted':
        return 'Microphone muted';
      case 'disconnected':
      default:
        return 'Tap orb or button below to start';
    }
  };

  const getBadgeStyle = () => {
    switch (state) {
      case 'listening':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'speaking':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse';
      case 'thinking':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'muted':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'connecting':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-neutral-800 text-neutral-400 border-neutral-700';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-lg aspect-square mx-auto">
      {/* Visual Canvas */}
      <canvas
        ref={canvasRef}
        onClick={onOrbClick}
        className={`w-full h-full cursor-pointer select-none transition-transform duration-300 ${
          state === 'disconnected' ? 'hover:scale-105 active:scale-95' : ''
        }`}
      />

      {/* Floating Status Pill */}
      <div className="absolute -bottom-2 sm:bottom-4 flex flex-col items-center gap-1.5 pointer-events-none select-none">
        <div
          className={`px-3.5 py-1 rounded-full text-xs font-medium tracking-wide border backdrop-blur-md transition-all duration-300 shadow-lg ${getBadgeStyle()}`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                state === 'listening'
                  ? 'bg-emerald-400 animate-ping'
                  : state === 'speaking'
                  ? 'bg-purple-400 animate-pulse'
                  : state === 'thinking'
                  ? 'bg-amber-400 animate-spin'
                  : state === 'muted'
                  ? 'bg-red-400'
                  : state === 'connecting'
                  ? 'bg-indigo-400 animate-pulse'
                  : 'bg-neutral-500'
              }`}
            />
            {getStatusText()}
          </div>
        </div>
      </div>
    </div>
  );
};
