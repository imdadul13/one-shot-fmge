import React, { useEffect, useRef } from 'react';

interface MedicalWaveformProps {
  className?: string;
  color?: string;
  height?: number;
}

/**
 * MedicalWaveform: A subtle, calm, scientific ECG / cardiac waveform animation.
 * Features:
 * - Ambient slow sweep with P-Q-R-S-T morphology
 * - Low visual intensity (secondary to study actions)
 * - Strict prefers-reduced-motion support (renders static baseline or stops animation)
 * - High performance (lightweight canvas / requestAnimationFrame)
 */
export const MedicalWaveform: React.FC<MedicalWaveformProps> = ({
  className = 'w-full h-12',
  color = '#0284c7', // Slate/Sky accent
  height = 48,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isReducedMotion = mediaQuery.matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // ECG wave equation generator: P-wave, Q-dip, R-spike, S-dip, T-wave
    const getEcgY = (x: number, width: number, baseline: number) => {
      const cycleLength = 260; // wavelength in pixels
      const normalizedX = (x + offset) % cycleLength;

      // Flat isoelectric line
      if (normalizedX < 50) return baseline;

      // P wave (small upward deflection)
      if (normalizedX >= 50 && normalizedX < 80) {
        const pProgress = (normalizedX - 50) / 30;
        return baseline - Math.sin(pProgress * Math.PI) * 4;
      }

      // PR segment
      if (normalizedX >= 80 && normalizedX < 110) return baseline;

      // Q wave (small downward deflection)
      if (normalizedX >= 110 && normalizedX < 118) {
        const qProgress = (normalizedX - 110) / 8;
        return baseline + Math.sin(qProgress * Math.PI) * 3;
      }

      // R wave (sharp tall upward spike)
      if (normalizedX >= 118 && normalizedX < 132) {
        const rProgress = (normalizedX - 118) / 14;
        return baseline - Math.sin(rProgress * Math.PI) * 20;
      }

      // S wave (moderate downward deflection)
      if (normalizedX >= 132 && normalizedX < 144) {
        const sProgress = (normalizedX - 132) / 12;
        return baseline + Math.sin(sProgress * Math.PI) * 6;
      }

      // ST segment
      if (normalizedX >= 144 && normalizedX < 170) return baseline;

      // T wave (smooth upward deflection)
      if (normalizedX >= 170 && normalizedX < 215) {
        const tProgress = (normalizedX - 170) / 45;
        return baseline - Math.sin(tProgress * Math.PI) * 7;
      }

      // TP isoelectric baseline
      return baseline;
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const baseline = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Subtle gradient stroke for high-end look
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(14, 165, 233, 0.05)');
      gradient.addColorStop(0.5, 'rgba(14, 165, 233, 0.45)');
      gradient.addColorStop(1, 'rgba(14, 165, 233, 0.15)');

      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = gradient;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let x = 0; x <= width; x += 2) {
        const y = getEcgY(x, width, baseline);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      if (!isReducedMotion) {
        offset += 0.8; // gentle, calm pace
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [height, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none opacity-80 ${className}`}
      style={{ height: `${height}px` }}
      aria-hidden="true"
    />
  );
};
