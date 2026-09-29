import React, { useEffect, useRef } from 'react';

export type VoiceState = 'disconnected' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'muted';

interface VoiceVisualizerProps {
  state: VoiceState;
  userVolume: number; // 0.0 - 1.0 from microphone
  aiVolume: number;   // 0.0 - 1.0 from AI output audio
  analyserData?: Uint8Array | null;
  onOrbClick?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  alpha: number;
  life: number;
  maxLife: number;
  hue: number;
  speed: number;
  angle: number;
  radius: number;
  orbitSpeed: number;
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
  const smoothedAiVolRef = useRef<number>(0);
  const smoothedUserVolRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const hueShiftRef = useRef<number>(270); // Starts at purple

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

    // Initialize initial ambient particles pool
    if (particlesRef.current.length === 0) {
      const initialParticles: Particle[] = [];
      for (let i = 0; i < 45; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 80 + Math.random() * 120;
        initialParticles.push({
          x: 0,
          y: 0,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: 1.5 + Math.random() * 2.5,
          baseSize: 1.5 + Math.random() * 2.5,
          alpha: 0.15 + Math.random() * 0.6,
          life: Math.random() * 100,
          maxLife: 80 + Math.random() * 80,
          hue: 260 + Math.random() * 60,
          speed: 0.3 + Math.random() * 0.7,
          angle,
          radius,
          orbitSpeed: (Math.random() - 0.5) * 0.02,
        });
      }
      particlesRef.current = initialParticles;
    }

    const render = () => {
      if (!canvas || !ctx) return;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Smooth volume measurements
      smoothedAiVolRef.current += (aiVolume - smoothedAiVolRef.current) * 0.22;
      smoothedUserVolRef.current += (userVolume - smoothedUserVolRef.current) * 0.22;
      const aiVol = smoothedAiVolRef.current;
      const userVol = smoothedUserVolRef.current;

      // Dynamic color shifting based on real-time AI volume
      // As AI volume fluctuates, hue smoothly traverses through vivid neon spectrum
      const targetHue = state === 'speaking'
        ? 260 + aiVol * 160 + Math.sin(phaseRef.current * 1.5) * 35
        : state === 'listening'
        ? 155 + userVol * 45
        : state === 'thinking'
        ? 35 + Math.sin(phaseRef.current * 2) * 25
        : state === 'muted'
        ? 0
        : 265; // Idle purple

      hueShiftRef.current += (targetHue - hueShiftRef.current) * 0.12;
      const currentHue = hueShiftRef.current;

      const dynamicSaturation = state === 'speaking' ? Math.min(100, 85 + aiVol * 25) : 85;
      const dynamicLightness = state === 'speaking' ? Math.min(75, 55 + aiVol * 25) : 60;

      // Target volume & active animation speeds
      let targetVolume = 0.05;
      if (state === 'speaking') {
        targetVolume = Math.max(aiVol, 0.18);
        phaseRef.current += 0.035 + aiVol * 0.05;
      } else if (state === 'listening') {
        targetVolume = Math.max(userVol, 0.1);
        phaseRef.current += 0.025 + userVol * 0.03;
      } else if (state === 'thinking') {
        targetVolume = 0.28;
        phaseRef.current += 0.048;
      } else if (state === 'connecting') {
        targetVolume = 0.15;
        phaseRef.current += 0.03;
      } else if (state === 'muted') {
        targetVolume = 0.04;
        phaseRef.current += 0.01;
      } else {
        targetVolume = 0.04;
        phaseRef.current += 0.016;
      }

      const phase = phaseRef.current;
      const vol = state === 'speaking' ? aiVol : state === 'listening' ? userVol : targetVolume;

      const baseRadius = Math.min(width, height) * 0.21;
      const dynamicRadius = baseRadius + vol * 58;

      // 1. DYNAMIC COLOR-SHIFTING HALOS (Radial Gradients responsive to AI Volume)
      const primaryRgba = `hsla(${currentHue}, ${dynamicSaturation}%, ${dynamicLightness}%, `;
      const secondaryRgba = `hsla(${(currentHue + 45) % 360}, ${dynamicSaturation}%, ${dynamicLightness - 10}%, `;
      const accentRgba = `hsla(${(currentHue + 110) % 360}, 95%, ${Math.min(85, dynamicLightness + 15)}%, `;

      // Outer glow
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        dynamicRadius * 0.35,
        centerX,
        centerY,
        dynamicRadius * (2.2 + (state === 'speaking' ? aiVol * 0.9 : 0))
      );
      glowGrad.addColorStop(0, `${primaryRgba}${0.35 + vol * 0.45})`);
      glowGrad.addColorStop(0.45, `${secondaryRgba}${0.18 + vol * 0.28})`);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius * (2.2 + (state === 'speaking' ? aiVol * 0.9 : 0)), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. SOUND-REACTIVE SHOCKWAVES & RIPPLES (Stronger when AI is speaking with volume surges)
      if (state === 'speaking' || state === 'listening') {
        const rings = state === 'speaking' ? 4 : 2;
        for (let r = 0; r < rings; r++) {
          const ringProgress = (phase * (1 + vol * 0.6) + (r / rings) * Math.PI * 2) % (Math.PI * 2);
          const expansionRatio = ringProgress / (Math.PI * 2);
          const ringRadius = baseRadius * 0.95 + expansionRatio * baseRadius * (1.3 + vol * 1.2);
          const alpha = Math.max(0, (1 - expansionRatio) * (0.2 + vol * 0.55));

          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
          const ringHue = (currentHue + r * 25) % 360;
          ctx.strokeStyle = `hsla(${ringHue}, 90%, 65%, ${alpha})`;
          ctx.lineWidth = 1.2 + vol * 3.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 3. DYNAMIC PARTICLE EFFECTS SYSTEM
      // When AI volume surges, spawn additional vibrant spark particles
      const particles = particlesRef.current;
      const targetParticleCount = state === 'speaking'
        ? Math.floor(40 + aiVol * 65)
        : state === 'listening'
        ? Math.floor(35 + userVol * 30)
        : 28;

      // Spawn or replenish particles
      if (particles.length < targetParticleCount) {
        const angle = Math.random() * Math.PI * 2;
        const speed = state === 'speaking' ? 1.2 + aiVol * 3.5 : 0.8 + Math.random() * 0.8;
        particles.push({
          x: centerX + Math.cos(angle) * (dynamicRadius * 0.8),
          y: centerY + Math.sin(angle) * (dynamicRadius * 0.8),
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.5,
          vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 0.5,
          size: 1.5 + Math.random() * (state === 'speaking' ? 3 + aiVol * 4 : 2),
          baseSize: 1.5 + Math.random() * 2.5,
          alpha: 0.8 + Math.random() * 0.2,
          life: 0,
          maxLife: 40 + Math.random() * 60,
          hue: (currentHue + (Math.random() - 0.5) * 60) % 360,
          speed,
          angle,
          radius: dynamicRadius,
          orbitSpeed: (Math.random() - 0.5) * 0.03,
        });
      }

      // Render and update dynamic particles with additive blend mode for glowing look
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;

        if (state === 'speaking') {
          // Particles burst or drift outwards from orb center powered by AI volume
          p.x += p.vx * (1 + aiVol * 1.5);
          p.y += p.vy * (1 + aiVol * 1.5);
          // Slight orbital swirl
          p.angle += p.orbitSpeed * (1 + aiVol * 2);
          p.size = p.baseSize * (1 + aiVol * 1.2);
        } else {
          // Gentle ambient float
          p.x += p.vx;
          p.y += p.vy;
        }

        const lifeRatio = p.life / p.maxLife;
        const currentAlpha = Math.max(0, p.alpha * (1 - lifeRatio) * (0.4 + vol * 0.8));

        // Draw particle glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, ${currentAlpha})`;
        ctx.fill();

        // Extra dynamic spark tail if AI volume is notable
        if (state === 'speaking' && aiVol > 0.2) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 3.5, p.y - p.vy * 3.5);
          ctx.strokeStyle = `hsla(${p.hue}, 100%, 80%, ${currentAlpha * 0.6})`;
          ctx.lineWidth = p.size * 0.6;
          ctx.stroke();
        }

        // Recycle dead or far particles
        const distFromCenter = Math.hypot(p.x - centerX, p.y - centerY);
        if (p.life >= p.maxLife || distFromCenter > Math.max(width, height) * 0.6) {
          if (particles.length > targetParticleCount) {
            particles.splice(i, 1);
          } else {
            // Respawn near the perimeter of the orb
            const newAngle = Math.random() * Math.PI * 2;
            const newDist = dynamicRadius * (0.85 + Math.random() * 0.35);
            p.x = centerX + Math.cos(newAngle) * newDist;
            p.y = centerY + Math.sin(newAngle) * newDist;
            const newSpeed = state === 'speaking' ? 0.8 + aiVol * 2.8 : 0.4 + Math.random() * 0.6;
            p.vx = Math.cos(newAngle) * newSpeed;
            p.vy = Math.sin(newAngle) * newSpeed;
            p.life = 0;
            p.maxLife = 50 + Math.random() * 50;
            p.hue = (currentHue + (Math.random() - 0.5) * 50 + 360) % 360;
          }
        }
      }
      ctx.restore();

      // 4. FLUID HARMONIC DEFORMED ORB (Reactive to Frequency and Volume)
      const numPoints = 64;
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        let distortion = 0;

        if (state === 'speaking') {
          if (analyserData && analyserData.length > 0) {
            const freqIndex = Math.floor((i / numPoints) * Math.min(32, analyserData.length));
            const freqValue = analyserData[freqIndex] / 255;
            distortion =
              Math.sin(angle * 5 + phase * 2.5) * (freqValue * 32 + aiVol * 30) +
              Math.cos(angle * 3 - phase * 1.5) * (aiVol * 18);
          } else {
            distortion =
              Math.sin(angle * 4 + phase * 3) * (aiVol * 38) +
              Math.cos(angle * 2 - phase * 2) * (aiVol * 22);
          }
        } else if (state === 'listening') {
          distortion =
            Math.sin(angle * 4 + phase * 2.5) * (userVol * 32) +
            Math.cos(angle * 3 - phase) * (userVol * 16);
        } else if (state === 'thinking') {
          distortion =
            Math.sin(angle * 3 + phase * 3.2) * 18 +
            Math.cos(angle * 6 - phase * 2) * 12;
        } else {
          // Idle gentle breathing
          distortion = Math.sin(angle * 3 + phase) * 6;
        }

        const r = dynamicRadius + distortion;
        points.push({
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
        });
      }

      // Draw smooth closed shape
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

      // Fluid internal orb gradient with dynamic color shifts
      const angleOffset = phase * 0.6;
      const gradX1 = centerX + Math.cos(angleOffset) * dynamicRadius;
      const gradY1 = centerY + Math.sin(angleOffset) * dynamicRadius;
      const gradX2 = centerX - Math.cos(angleOffset) * dynamicRadius;
      const gradY2 = centerY - Math.sin(angleOffset) * dynamicRadius;

      const bodyGrad = ctx.createLinearGradient(gradX1, gradY1, gradX2, gradY2);
      bodyGrad.addColorStop(0, `hsl(${currentHue}, ${dynamicSaturation}%, ${dynamicLightness}%)`);
      bodyGrad.addColorStop(0.5, `hsl(${(currentHue + 40) % 360}, ${dynamicSaturation}%, ${dynamicLightness - 8}%)`);
      bodyGrad.addColorStop(1, `hsl(${(currentHue + 80) % 360}, 90%, ${dynamicLightness}%)`);

      ctx.fillStyle = bodyGrad;
      ctx.shadowColor = `hsla(${currentHue}, 90%, 65%, ${0.7 + vol * 0.3})`;
      ctx.shadowBlur = 38 + vol * 38;
      ctx.fill();

      // 5. INNER HIGHLIGHT SHEEN & CORE SPECULAR REFLECTION
      const innerGlow = ctx.createRadialGradient(
        centerX - dynamicRadius * 0.3,
        centerY - dynamicRadius * 0.3,
        dynamicRadius * 0.06,
        centerX,
        centerY,
        dynamicRadius
      );
      innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      innerGlow.addColorStop(0.28, 'rgba(255, 255, 255, 0.22)');
      innerGlow.addColorStop(0.65, 'rgba(255, 255, 255, 0)');
      innerGlow.addColorStop(1, 'rgba(0, 0, 0, 0.38)');

      ctx.fillStyle = innerGlow;
      ctx.fill();
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
