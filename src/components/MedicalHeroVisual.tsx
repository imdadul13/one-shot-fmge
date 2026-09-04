import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Activity, Sparkles, Zap, ShieldCheck, Compass, Orbit } from 'lucide-react';

export interface MedicalHeroVisualProps {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicId?: string;
  topicName?: string;
  className?: string;
}

/**
 * Shared SVG Lighting & Filter Definitions
 * High-definition volumetric specular lighting, ambient occlusions, and theme glows.
 */
function SharedDefs({ accent }: { accent: string }) {
  return (
    <defs>
      {/* 3D Volumetric Specular Lighting Filter */}
      <filter id="med-3d-specular" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="4" specularConstant="1.3" specularExponent="24" result="specular">
          <feDistantLight azimuth="220" elevation="45" />
        </feSpecularLighting>
        <feComposite in="specular" in2="SourceAlpha" operator="in" result="specular-cut" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="specular-cut" />
        </feMerge>
      </filter>

      {/* Volumetric Soft Depth Shadow Filter */}
      <filter id="med-depth-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#004d46" floodOpacity="0.28" />
      </filter>

      {/* Ambient Bio-Glow Filter */}
      <filter id="med-ambient-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="8" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Theme Gradients */}
      <linearGradient id="theme-teal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#006B63" />
        <stop offset="50%" stopColor="#0D9488" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>

      <linearGradient id="theme-cyan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="50%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#2dd4bf" />
      </linearGradient>

      <linearGradient id="theme-bone-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="40%" stopColor="#e2e8f0" />
        <stop offset="85%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>

      <linearGradient id="theme-titanium-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>

      <radialGradient id="cardiac-muscle-3d" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="35%" stopColor="#e11d48" />
        <stop offset="75%" stopColor="#9f1239" />
        <stop offset="100%" stopColor="#4c0519" />
      </radialGradient>

      <radialGradient id="specular-highlight" cx="30%" cy="25%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="vessel-aorta" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fb7185" />
        <stop offset="60%" stopColor="#e11d48" />
        <stop offset="100%" stopColor="#881337" />
      </radialGradient>

      <radialGradient id="vessel-pulmonary" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="60%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0f172a" />
      </radialGradient>

      <linearGradient id="nerve-axon-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="40%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
  );
}

/**
 * MedicalHeroVisual
 * Ultra-high-resolution 3D animated interactive medical visualization engine.
 * Tailored with precision to the Deep Teal (#006B63) / Turquoise (#0D9488) medical theme.
 */
export const MedicalHeroVisual: React.FC<MedicalHeroVisualProps> = ({
  subjectId,
  subjectName,
  subjectColor,
  topicId = '',
  topicName = '',
  className = '',
}) => {
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement | null>(null);

  // High-precision 3D tilt tracking for cursor & gyroscope
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Up to 12 degrees 3D rotation
    const rotX = ((y - centerY) / centerY) * -12;
    const rotY = ((x - centerX) / centerX) * 12;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const accent = subjectColor || '#006B63';

  // Topic-sensitive 3D high-resolution models
  const Scene = useMemo(() => {
    switch (subjectId) {
      case 'medicine':
        return <Heart3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'anatomy':
        return <Anatomy3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'physiology':
        return <Lungs3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'pathology':
        return <Pathology3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'pharmacology':
        return <Pharma3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'microbiology':
        return <Microbiology3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'biochemistry':
        return <Biochem3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'ophthalmology':
        return <Ophthalmology3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'ent':
        return <Ent3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'surgery':
        return <Surgery3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'obg':
        return <Obg3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'pediatrics':
        return <Pediatrics3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'orthopedics':
        return <Orthopedics3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'dermatology':
        return <Dermatology3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'psychiatry':
        return <Brain3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'radiology':
        return <Radiology3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'anesthesia':
        return <Anesthesia3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'fmt':
        return <Forensics3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'psm':
        return <Community3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      default:
        return <Generic3DModel accent={accent} subjectName={subjectName} reduced={Boolean(reducedMotion)} />;
    }
  }, [subjectId, accent, topicName, subjectName, reducedMotion]);

  // Telemetry metadata
  const telemetry = useMemo(() => {
    switch (subjectId) {
      case 'medicine':
        return { label: '72 bpm · Sinus Rhythm', status: 'Conduction Active' };
      case 'anatomy':
        return {
          label: topicName.includes('Knee') ? '120° Flexion · Intact ACL' : "Erb's Point (C5-C6) Intact",
          status: 'Motor/Sensory Normal',
        };
      case 'physiology':
        return { label: 'V/Q: 0.82 · SpO₂: 99%', status: 'Tidal Diffusion OK' };
      case 'pathology':
        return { label: 'GFR: 120 mL/min', status: 'Cellular Morphology' };
      case 'pharmacology':
        return { label: 'Kd: 1.2 nM · GPCR Agonist', status: 'Orthosteric Lock' };
      case 'microbiology':
        return { label: 'Capsid Icosahedron · 12 nm', status: 'Viral Spikes Active' };
      case 'biochemistry':
        return { label: 'ΔG°: -30.5 kJ/mol · ATP Rotor', status: 'DNA Double Helix' };
      case 'ophthalmology':
        return { label: 'IOP: 14 mmHg · Fovea 1.0', status: 'Optic Disc 0.3' };
      case 'ent':
        return { label: 'Stapes Reflex · 4 kHz', status: 'Cochlear Response' };
      case 'surgery':
        return { label: 'Trocar 10mm · FAST Normal', status: 'Hemostasis Secured' };
      case 'obg':
        return { label: 'FHR: 144 bpm · Low Resistance', status: 'Doppler S/D Ratio 2.2' };
      case 'pediatrics':
        return { label: 'APGAR: 10/10 · 50th Percentile', status: 'Primitive Reflex OK' };
      case 'orthopedics':
        return { label: 'Trabecular T-Score: -0.1', status: 'Cortical Ring Intact' };
      case 'dermatology':
        return { label: 'Stratum Basale · Nikolsky (-)', status: 'Dermal Papillae' };
      case 'psychiatry':
        return { label: 'Connectome · 5-HT/DA', status: 'Synaptic Exocytosis' };
      case 'radiology':
        return { label: 'Axial CT 1mm · 42 HU', status: 'Contrast Phase Live' };
      case 'anesthesia':
        return { label: 'EtCO₂: 38 mmHg · MAC: 1.0', status: 'Airway Secured' };
      case 'fmt':
        return { label: '12 Minutiae Match Points', status: 'Biometric Verified' };
      case 'psm':
        return { label: 'R₀: 0.9 · Cold Chain 4°C', status: 'Herd Threshold > 85%' };
      default:
        return { label: 'NBE High-Yield Model', status: 'Clinical Blueprint' };
    }
  }, [subjectId, topicName]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden rounded-3xl transition-transform duration-300 ${className}`}
      style={{
        perspective: '1200px',
        background: `radial-gradient(ellipse at 50% 45%, ${accent}12 0%, ${accent}05 45%, transparent 75%)`,
      }}
    >
      {/* Dynamic 3D Specimen Stage Container */}
      <motion.div
        animate={
          reducedMotion
            ? {}
            : {
                rotateX,
                rotateY,
                scale: isHovered ? 1.03 : 1,
                y: isHovered ? -3 : 0,
              }
        }
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full h-full flex items-center justify-center p-1 sm:p-2"
      >
        {/* Background Volumetric Depth Aura & Isometric Grid Rings */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ transform: 'translateZ(-40px)' }}
        >
          <div
            className="w-44 h-44 sm:w-56 sm:h-56 rounded-full"
            style={{
              background: `radial-gradient(circle, ${accent}26 0%, ${accent}0c 45%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
          />
        </div>

        {/* Ambient Hologram Crosshairs */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25 flex items-center justify-center"
          style={{ transform: 'translateZ(-20px)' }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full max-w-[200px] stroke-teal-500/30" fill="none">
            <circle cx="100" cy="100" r="70" strokeWidth="0.75" strokeDasharray="3 4" />
            <circle cx="100" cy="100" r="45" strokeWidth="0.75" />
            <line x1="20" y1="100" x2="180" y2="100" strokeWidth="0.5" strokeDasharray="2 3" />
            <line x1="100" y1="20" x2="100" y2="180" strokeWidth="0.5" strokeDasharray="2 3" />
          </svg>
        </div>

        {/* The Animated 3D Scene Viewport */}
        <div className="relative z-10 w-full h-full max-w-[380px] max-h-[240px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${subjectId}-${topicId}`}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, rotateY: -10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, rotateY: 10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full flex items-center justify-center"
              style={{ transform: 'translateZ(20px)' }}
            >
              {Scene}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Sleek Top-Left Telemetry Tag — Never collides with bottom container */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="absolute top-2.5 left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-2xs pointer-events-none z-20"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: accent }}
          />
          <span
            className="relative inline-flex rounded-full h-1.5 w-1.5"
            style={{ backgroundColor: accent }}
          />
        </span>
        <span className="text-[9.5px] font-mono font-bold text-slate-700 tracking-tight">
          {telemetry.label}
        </span>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   HIGH-RESOLUTION 3D ANATOMICAL & CLINICAL VISUALIZATIONS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 1. CARDIOLOGY / GENERAL MEDICINE
 * High-res 3D Anatomical Heart with Volumetric Ventricles, Aortic Arch Branches,
 * Coronary Circulation, SA/AV Electrical Conduction & Propagating Action Potential
 */
function Heart3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Floating 3D Base Radial Shadow with Organic Cardiac Breathing */}
      <motion.ellipse
        cx="230"
        cy="268"
        rx="105"
        ry="18"
        fill="#004d46"
        fillOpacity="0.16"
        animate={
          reduced
            ? {}
            : {
                rx: [100, 114, 98, 110, 100],
                ry: [16, 21, 15, 19, 16],
                opacity: [0.14, 0.22, 0.12, 0.19, 0.14],
              }
        }
        transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Background Superior Vena Cava & Pulmonary Veins (Blue & Red Stems) */}
      <g opacity="0.92">
        {/* Superior Vena Cava */}
        <path
          d="M176 50 L176 110"
          stroke="url(#vessel-pulmonary)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        {/* Inferior Vena Cava base */}
        <path
          d="M182 205 L182 235"
          stroke="url(#vessel-pulmonary)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Left & Right Pulmonary Vein pairs */}
        <ellipse cx="295" cy="115" rx="8" ry="12" fill="#e11d48" opacity="0.8" />
        <ellipse cx="160" cy="115" rx="8" ry="12" fill="#e11d48" opacity="0.8" />
      </g>

      {/* Pulmonary Artery Trunk (Bifurcating behind Aorta) */}
      <g>
        <path
          d="M210 120 C 205 90 185 78 155 86"
          stroke="url(#vessel-pulmonary)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M210 120 C 220 90 250 82 275 92"
          stroke="url(#vessel-pulmonary)"
          strokeWidth="16"
          strokeLinecap="round"
        />
      </g>

      {/* 3D Aortic Arch (Volumetric curved cylinder with 3 supra-aortic branches) */}
      <g filter="url(#med-3d-specular)">
        <path
          d="M215 125 C 210 65 255 45 285 70 C 300 82 298 115 292 135"
          stroke="url(#vessel-aorta)"
          strokeWidth="24"
          strokeLinecap="round"
        />
        {/* Branch 1: Brachiocephalic Trunk */}
        <path d="M236 56 L 228 32" stroke="url(#vessel-aorta)" strokeWidth="9" strokeLinecap="round" />
        {/* Branch 2: Left Common Carotid */}
        <path d="M256 50 L 254 26" stroke="url(#vessel-aorta)" strokeWidth="8" strokeLinecap="round" />
        {/* Branch 3: Left Subclavian Artery */}
        <path d="M275 55 L 282 30" stroke="url(#vessel-aorta)" strokeWidth="8" strokeLinecap="round" />
      </g>

      {/* 3D Pulsating Ventricular & Atrial Mass (Systole / Diastole dual-beat) */}
      <motion.g
        animate={
          reduced
            ? {}
            : {
                scale: [1, 1.07, 0.97, 1.04, 1],
                rotate: [0, -0.6, 0.4, -0.3, 0],
              }
        }
        transition={{
          duration: 1.15,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.16, 0.32, 0.48, 1],
        }}
        style={{ transformOrigin: '230px 165px' }}
      >
        {/* Right Atrium Body */}
        <ellipse cx="178" cy="132" rx="34" ry="28" fill="url(#cardiac-muscle-3d)" opacity="0.95" />

        {/* Left Atrium Auricle */}
        <path
          d="M276 115 C 295 120 300 135 288 150 C 275 160 268 140 276 115 Z"
          fill="url(#cardiac-muscle-3d)"
        />

        {/* Left & Right Ventricles Anatomical Body */}
        <path
          d="M230 252 C 165 224 135 186 135 146 C 135 115 162 98 195 98 C 215 98 226 110 230 120 C 234 110 246 98 268 98 C 300 98 325 115 325 146 C 325 186 295 224 230 252 Z"
          fill="url(#cardiac-muscle-3d)"
          filter="url(#med-3d-specular)"
        />

        {/* Specular 3D Organic Light Dome */}
        <path
          d="M230 252 C 165 224 135 186 135 146 C 135 115 162 98 195 98 C 215 98 226 110 230 120 C 234 110 246 98 268 98 C 300 98 325 115 325 146 C 325 186 295 224 230 252 Z"
          fill="url(#specular-highlight)"
        />

        {/* Anterior Interventricular Sulcus & Coronary Arterial Tree (LAD & Diagonal Branches) */}
        <path
          d="M230 122 Q 222 165 234 205 Q 238 230 230 250"
          stroke="#ffe4e6"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeOpacity="0.92"
        />
        {/* Diagonal Arterial Branches */}
        <path d="M225 150 Q 198 166 182 178" stroke="#ffe4e6" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.85" />
        <path d="M228 178 Q 206 195 195 208" stroke="#ffe4e6" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.8" />
        <path d="M231 168 Q 262 180 278 190" stroke="#ffe4e6" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.85" />
        <path d="M234 195 Q 260 210 270 222" stroke="#ffe4e6" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.8" />

        {/* Cardiac Conduction Network: SA Node -> Internodal -> AV Node -> His -> Purkinje */}
        <g opacity="0.95">
          {/* SA Node (Sinoatrial) */}
          <circle cx="180" cy="112" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
          <text x="176" y="104" fill="#fef08a" fontSize="8" fontWeight="bold" fontFamily="monospace">SA</text>

          {/* AV Node (Atrioventricular) */}
          <circle cx="225" cy="140" r="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
          <text x="210" y="138" fill="#fef08a" fontSize="8" fontWeight="bold" fontFamily="monospace">AV</text>

          {/* Internodal Pathway */}
          <path d="M180 112 Q 202 124 225 140" stroke="#fef08a" strokeWidth="2.2" strokeDasharray="3 3" />

          {/* Bundle of His & Left/Right Bundle Branches */}
          <path d="M225 140 L 227 175 L 210 215 M 227 175 L 248 215" stroke="#fef08a" strokeWidth="2" strokeDasharray="4 2" />
        </g>
      </motion.g>

      {/* Action Potential Traveling Light Packet */}
      {!reduced && (
        <motion.circle
          r="4.5"
          fill="#ffffff"
          filter="url(#med-ambient-glow)"
          animate={{
            cx: [180, 225, 227, 230],
            cy: [112, 140, 175, 248],
            opacity: [0, 1, 1, 0],
            scale: [0.8, 1.4, 1.2, 0.4],
          }}
          transition={{
            duration: 1.15,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}

      {/* Floating Dynamic ECG Vector Trace (P-Q-R-S-T Lead II) */}
      <g opacity="0.55">
        <path
          d="M30 270 L 110 270 L 120 262 L 130 270 L 138 274 L 145 220 L 154 286 L 162 270 L 175 270 L 190 258 L 205 270 L 230 270"
          stroke="#0D9488"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M230 270 L 260 270 L 270 262 L 280 270 L 288 274 L 295 220 L 304 286 L 312 270 L 325 270 L 340 258 L 355 270 L 430 270"
          stroke="#0D9488"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/**
 * 2. ANATOMY
 * Biomechanical Translucent 3D Knee Joint with Cruciate Ligaments (ACL/PCL)
 * or 3D Brachial Plexus Multi-tier Neural Network (Roots, Trunks, Divisions, Cords)
 */
function Anatomy3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  const isKnee =
    topicName.toLowerCase().includes('knee') ||
    topicName.toLowerCase().includes('joint') ||
    topicName.toLowerCase().includes('ortho') ||
    topicName.toLowerCase().includes('cruciate');

  if (isKnee) {
    return (
      <svg
        viewBox="0 0 460 300"
        className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
        fill="none"
        shapeRendering="geometricPrecision"
      >
        <SharedDefs accent={accent} />

        {/* 3D Distal Femur Shaft & Condyles (Upper Bone) */}
        <g filter="url(#med-3d-specular)">
          <path
            d="M185 30 L 185 95 C 185 125 155 130 170 152 C 185 170 215 170 225 152 C 230 138 238 138 245 152 C 255 170 285 170 300 152 C 315 130 285 125 285 95 L 285 30 Z"
            fill="url(#theme-bone-gradient)"
            stroke="#475569"
            strokeWidth="3"
          />
          {/* Femoral Patellar Groove Specular Contour */}
          <path d="M210 100 Q 235 120 260 100" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        </g>

        {/* 3D Proximal Tibial Plateau & Shaft (Lower Bone) */}
        <g filter="url(#med-3d-specular)">
          <path
            d="M145 185 C 168 172 208 172 235 178 C 262 172 302 172 325 185 C 315 220 275 228 275 275 L 195 275 C 195 228 155 220 145 185 Z"
            fill="url(#theme-bone-gradient)"
            stroke="#475569"
            strokeWidth="3"
          />
          {/* Fibular Head (Lateral) */}
          <path
            d="M140 195 C 128 202 124 218 132 232 L 138 275 L 152 275 L 148 220 Z"
            fill="url(#theme-bone-gradient)"
            stroke="#475569"
            strokeWidth="2.5"
          />
        </g>

        {/* Translucent Menisci (Turquoise fibrocartilaginous pads) */}
        <ellipse cx="178" cy="172" rx="28" ry="8" fill="#0D9488" fillOpacity="0.75" stroke="#14B8A6" strokeWidth="1.5" />
        <ellipse cx="292" cy="172" rx="28" ry="8" fill="#0D9488" fillOpacity="0.75" stroke="#14B8A6" strokeWidth="1.5" />

        {/* Anterior Cruciate Ligament (ACL) & Posterior Cruciate Ligament (PCL) */}
        {/* PCL (Back) */}
        <path
          d="M255 145 L 205 182"
          stroke="#E11D48"
          strokeWidth="9"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
        {/* ACL (Front with High-Resolution Striations) */}
        <motion.path
          d="M205 145 L 265 182"
          stroke="#006B63"
          strokeWidth="10"
          strokeLinecap="round"
          animate={reduced ? {} : { strokeWidth: [10, 11, 10], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* ACL Internal Tensile Fiber Highlight */}
        <path d="M208 145 L 262 180" stroke="#5eead4" strokeWidth="2.5" strokeLinecap="round" />

        {/* Stress Vector & Tension Indicators */}
        <g opacity="0.9">
          <circle cx="235" cy="164" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
          <text x="235" y="152" fill="#006B63" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            ACL Pivot
          </text>
        </g>
      </svg>
    );
  }

  // Brachial Plexus 3D Neural Architecture (C5-T1 Roots, Trunks, Divisions, Cords, Branches)
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* 3D Vertebral Cervical Root Pillars (C5, C6, C7, C8, T1) */}
      <g>
        {['C5', 'C6', 'C7', 'C8', 'T1'].map((root, i) => (
          <g key={root}>
            <rect
              x="45"
              y={55 + i * 42}
              width="44"
              height="26"
              rx="8"
              fill="#1e293b"
              stroke="#0D9488"
              strokeWidth="2"
              filter="url(#med-3d-specular)"
            />
            <text
              x="67"
              y={72 + i * 42}
              fill="#f8fafc"
              fontSize="12"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {root}
            </text>
          </g>
        ))}
      </g>

      {/* Neural Pathway Highway with Gold Axonal Sheaths */}
      <g stroke="url(#nerve-axon-gold)" strokeWidth="4.5" strokeLinecap="round" fill="none">
        {/* C5 + C6 -> Superior Trunk */}
        <path d="M89 68 C 135 68 150 90 195 90" />
        <path d="M89 110 C 135 110 150 90 195 90" />

        {/* C7 -> Middle Trunk */}
        <path d="M89 152 L 195 152" />

        {/* C8 + T1 -> Inferior Trunk */}
        <path d="M89 194 C 135 194 150 214 195 214" />
        <path d="M89 236 C 135 236 150 214 195 214" />

        {/* Divisions & Cords (Lateral, Posterior, Medial) */}
        <path d="M195 90 C 235 90 260 110 300 110" />
        <path d="M195 90 C 235 90 260 152 300 152" strokeDasharray="5 3" />
        <path d="M195 152 L 300 152" strokeDasharray="5 3" />
        <path d="M195 214 C 235 214 260 152 300 152" strokeDasharray="5 3" />
        <path d="M195 214 C 235 214 260 195 300 195" />

        {/* Terminal Motor Branches */}
        <path d="M300 110 C 345 110 375 75 425 75" />
        <path d="M300 110 C 345 110 375 130 425 130" />
        <path d="M300 152 C 345 152 375 115 425 115" />
        <path d="M300 152 C 345 152 375 170 425 170" />
        <path d="M300 195 C 345 195 375 225 425 225" />
      </g>

      {/* Erb's Point Landmark (C5-C6 Junction) */}
      <motion.circle
        cx="195"
        cy="90"
        r="9"
        fill="#006B63"
        stroke="#ffffff"
        strokeWidth="3"
        animate={reduced ? {} : { scale: [1, 1.25, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      <text
        x="195"
        y="72"
        fill="#006B63"
        fontSize="11"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
      >
        Erb's Point
      </text>

      {/* Racing Synaptic Action Potentials */}
      {!reduced && (
        <>
          <motion.circle
            r="4.5"
            fill="#ffffff"
            filter="url(#med-ambient-glow)"
            animate={{
              cx: [89, 140, 195, 250, 300, 360, 425],
              cy: [68, 79, 90, 100, 110, 92, 75],
              opacity: [0, 1, 1, 1, 1, 1, 0],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            r="4.5"
            fill="#ffffff"
            filter="url(#med-ambient-glow)"
            animate={{
              cx: [89, 140, 195, 250, 300, 360, 425],
              cy: [236, 225, 214, 204, 195, 210, 225],
              opacity: [0, 1, 1, 1, 1, 1, 0],
            }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 0.9, ease: 'easeInOut' }}
          />
        </>
      )}
    </svg>
  );
}

/**
 * 3. PHYSIOLOGY
 * 3D Volumetric Dual Lungs with Transparent Pleura, Bronchial Arborization & Alveolar Gas Exchange
 */
function Lungs3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Cartilaginous Trachea with 3D C-Rings */}
      <g>
        <path d="M230 30 L 230 95" stroke="#475569" strokeWidth="18" strokeLinecap="round" />
        {[40, 52, 64, 76, 88].map((y) => (
          <path key={y} d={`M221 ${y} L 239 ${y}`} stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
        ))}
        {/* Carina Bifurcation */}
        <path d="M230 92 L 195 125 M 230 92 L 265 125" stroke="#475569" strokeWidth="12" strokeLinecap="round" />
      </g>

      {/* Breathing Volumetric Lungs (Right 3 Lobes, Left 2 Lobes with Cardiac Notch) */}
      <motion.g
        animate={
          reduced
            ? {}
            : {
                scaleX: [1, 1.06, 1],
                scaleY: [1, 1.03, 1],
                y: [0, -4, 0],
              }
        }
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '230px 150px' }}
      >
        {/* Right Lung (Superior, Middle, Inferior Lobes) */}
        <g filter="url(#med-3d-specular)">
          <path
            d="M210 115 C 160 105 115 130 115 180 C 115 230 150 255 200 255 C 215 255 215 220 215 190 C 215 155 215 125 210 115 Z"
            fill="url(#theme-teal-gradient)"
            fillOpacity="0.85"
            stroke="#14B8A6"
            strokeWidth="3"
          />
          {/* Horizontal & Oblique Fissures */}
          <path d="M125 170 Q 165 175 210 162" stroke="#ffffff" strokeWidth="2.2" strokeOpacity="0.65" fill="none" />
          <path d="M135 212 Q 175 200 210 190" stroke="#ffffff" strokeWidth="2.2" strokeOpacity="0.65" fill="none" />
        </g>

        {/* Left Lung (Superior & Inferior Lobes with Cardiac Notch) */}
        <g filter="url(#med-3d-specular)">
          <path
            d="M250 115 C 300 105 345 130 345 180 C 345 230 310 255 260 255 C 245 255 245 220 245 190 C 245 170 236 150 250 115 Z"
            fill="url(#theme-teal-gradient)"
            fillOpacity="0.85"
            stroke="#14B8A6"
            strokeWidth="3"
          />
          {/* Oblique Fissure */}
          <path d="M252 180 Q 290 195 335 205" stroke="#ffffff" strokeWidth="2.2" strokeOpacity="0.65" fill="none" />
        </g>

        {/* Bronchial Tree Arborization Inside Lungs */}
        <g stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6">
          {/* Right bronchial branches */}
          <path d="M195 125 L 165 145 L 145 170 M 165 145 L 175 175" />
          <path d="M195 125 L 180 190 L 160 220" />
          {/* Left bronchial branches */}
          <path d="M265 125 L 295 145 L 315 170 M 295 145 L 285 175" />
          <path d="M265 125 L 280 190 L 300 220" />
        </g>
      </motion.g>

      {/* Luminous O2 / CO2 Alveolar Exchange Spheres */}
      {!reduced && (
        <g>
          {/* Mint Oxygen Uptake */}
          <motion.circle
            cx="160"
            cy="165"
            r="5"
            fill="#34D399"
            filter="url(#med-ambient-glow)"
            animate={{ scale: [0.7, 1.4, 0.7], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Cyan Alveolar Diffusion */}
          <motion.circle
            cx="300"
            cy="165"
            r="5"
            fill="#38BDF8"
            filter="url(#med-ambient-glow)"
            animate={{ scale: [0.7, 1.4, 0.7], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 1.1, ease: 'easeInOut' }}
          />
        </g>
      )}

      {/* Diaphragmatic Muscle Base Excursion */}
      <motion.path
        d="M100 268 Q 230 245 360 268"
        stroke="#006B63"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        animate={
          reduced
            ? {}
            : {
                d: [
                  'M100 268 Q 230 245 360 268',
                  'M100 274 Q 230 255 360 274',
                  'M100 268 Q 230 245 360 268',
                ],
              }
        }
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
}

/**
 * 4. PATHOLOGY
 * 3D Microscopic Glomerular Capsule with Podocytes & Filtration Slits, or Mitotic Neoplasia
 */
function Pathology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  const isNeoplasia =
    topicName.toLowerCase().includes('neoplasia') ||
    topicName.toLowerCase().includes('cancer') ||
    topicName.toLowerCase().includes('tumor');

  if (isNeoplasia) {
    return (
      <svg
        viewBox="0 0 460 300"
        className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
        fill="none"
        shapeRendering="geometricPrecision"
      >
        <SharedDefs accent={accent} />

        {/* 3D Dividing Mitotic Cell with Pleomorphic Membrane */}
        <motion.g
          animate={reduced ? {} : { rotate: [0, 360] }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '230px 150px' }}
        >
          <path
            d="M230 60 C 295 55 340 105 330 170 C 320 230 265 255 210 245 C 150 235 115 185 130 125 C 142 75 180 62 230 60 Z"
            fill="url(#cardiac-muscle-3d)"
            stroke="#fda4af"
            strokeWidth="4"
            filter="url(#med-3d-specular)"
          />

          {/* Hyperchromatic Nucleus & Chromatin Clumps */}
          <circle cx="205" cy="140" r="32" fill="#4c0519" stroke="#fda4af" strokeWidth="2.5" />
          <circle cx="255" cy="170" r="26" fill="#4c0519" stroke="#fda4af" strokeWidth="2.5" />

          {/* Mitotic Spindle Fibers */}
          <path d="M185 135 L 275 175 M 200 170 L 260 140" stroke="#fecdd3" strokeWidth="2.5" strokeDasharray="4 3" />
        </motion.g>

        {/* Neo-Angiogenesis Tumor Sprout Capillaries */}
        <path d="M50 150 Q 110 160 145 145" stroke="#E11D48" strokeWidth="4" strokeLinecap="round" />
        <path d="M410 150 Q 350 160 315 175" stroke="#E11D48" strokeWidth="4" strokeLinecap="round" />
        <circle cx="230" cy="150" r="6" fill="#fef08a" />
      </svg>
    );
  }

  // 3D Renal Glomerulus with Bowman's Capsule & Podocyte Filtration
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* 3D Bowman's Capsule Outer Shell */}
      <path
        d="M290 75 C 345 90 360 165 325 215 C 290 265 190 280 155 245 C 110 200 125 130 170 95 C 210 60 260 68 290 75 Z"
        fill="#042F2E"
        stroke="#0D9488"
        strokeWidth="4"
        filter="url(#med-3d-specular)"
      />

      {/* Capillary Tuft with Interlacing Podocyte Foot Processes */}
      <motion.circle
        cx="230"
        cy="155"
        r="42"
        fill="url(#cardiac-muscle-3d)"
        stroke="#ffffff"
        strokeWidth="3.5"
        animate={reduced ? {} : { scale: [1, 1.06, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Afferent & Efferent Arterioles */}
      <path d="M195 90 L 215 125" stroke="#E11D48" strokeWidth="7" strokeLinecap="round" />
      <path d="M265 90 L 245 125" stroke="#E11D48" strokeWidth="5.5" strokeLinecap="round" />

      {/* Filtration Stream into Proximal Convoluted Tubule */}
      <path
        d="M230 198 C 230 230 260 238 260 265"
        stroke="#38BDF8"
        strokeWidth="4.5"
        strokeDasharray="5 4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * 5. PHARMACOLOGY
 * 3D 7-Transmembrane GPCR Receptor Bundle in Lipid Bilayer with Docking Drug Molecule
 */
function Pharma3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Fluid Phospholipid Bilayer Membrane */}
      <g stroke="#cbd5e1" strokeWidth="3" strokeDasharray="8 5">
        <path d="M45 160 L 415 160" />
        <path d="M45 210 L 415 210" />
      </g>
      {/* Hydrophilic Heads */}
      {[70, 105, 140, 175, 210, 245, 280, 315, 350, 385].map((x) => (
        <React.Fragment key={x}>
          <circle cx={x} cy="155" r="5" fill="#0D9488" />
          <circle cx={x} cy="215" r="5" fill="#0D9488" />
        </React.Fragment>
      ))}

      {/* 3D GPCR 7-Transmembrane Alpha Helices */}
      {[100, 138, 176, 214, 252, 290, 328].map((x, i) => (
        <rect
          key={i}
          x={x}
          y={118}
          width="24"
          height="120"
          rx="12"
          fill="url(#theme-teal-gradient)"
          stroke="#5eead4"
          strokeWidth="2"
          filter="url(#med-3d-specular)"
        />
      ))}

      {/* Extracellular Orthosteric Binding Pocket */}
      <path
        d="M176 118 Q 214 152 252 118"
        stroke="#10B981"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* 3D Docking Drug Ligand Molecule */}
      <motion.g
        animate={
          reduced
            ? {}
            : {
                y: [0, 32, 0],
                rotate: [0, 8, 0],
              }
        }
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '214px 75px' }}
      >
        <polygon
          points="214,50 242,66 242,98 214,114 186,98 186,66"
          fill="url(#nerve-axon-gold)"
          stroke="#fef08a"
          strokeWidth="3.5"
          filter="url(#med-3d-specular)"
        />
        <circle cx="214" cy="82" r="9" fill="#ffffff" fillOpacity="0.85" />
      </motion.g>

      {/* G-Protein (Gα, Gβ, Gγ) Activation Pulse */}
      {!reduced && (
        <motion.circle
          cx="214"
          cy="255"
          r="12"
          fill="#38BDF8"
          stroke="#ffffff"
          strokeWidth="3"
          filter="url(#med-ambient-glow)"
          animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

/**
 * 6. MICROBIOLOGY
 * 3D Faceted Icosahedral Viral Capsid with Glycoprotein Spikes & Nucleic Acid
 */
function Microbiology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      <motion.g
        animate={reduced ? {} : { rotate: 360 }}
        transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '230px 150px' }}
      >
        {/* Radial Glycoprotein Spikes */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 230 + Math.cos(rad) * 62;
          const y1 = 150 + Math.sin(rad) * 62;
          const x2 = 230 + Math.cos(rad) * 94;
          const y2 = 150 + Math.sin(rad) * 94;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#14B8A6" strokeWidth="4" strokeLinecap="round" />
              <circle cx={x2} cy={y2} r="6" fill="#E11D48" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          );
        })}

        {/* 3D Icosahedral Core Sphere */}
        <circle
          cx="230"
          cy="150"
          r="66"
          fill="url(#theme-teal-gradient)"
          stroke="#5eead4"
          strokeWidth="3.5"
          filter="url(#med-3d-specular)"
        />

        {/* Encapsidated Viral Genome Strand */}
        <path
          d="M195 130 Q 230 150 195 170 Q 230 190 265 170 Q 230 150 265 130"
          stroke="#fef08a"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </motion.g>
    </svg>
  );
}

/**
 * 7. BIOCHEMISTRY
 * 3D Rotating DNA Double Helix with Base Pairs & Catalytic ATP Rotor
 */
function Biochem3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      <g>
        {[-3, -2, -1, 0, 1, 2, 3].map((step, i) => {
          const cx = 230 + step * 48;
          return (
            <g key={i}>
              <motion.line
                x1={cx}
                y1={65}
                x2={cx}
                y2={235}
                stroke="#94a3b8"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                animate={reduced ? {} : { y1: [65, 235, 65], y2: [235, 65, 235] }}
                transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.28, ease: 'easeInOut' }}
              />
              <motion.circle
                cx={cx}
                r="8.5"
                fill="url(#theme-teal-gradient)"
                stroke="#ffffff"
                strokeWidth="2"
                filter="url(#med-3d-specular)"
                animate={reduced ? { cy: 80 } : { cy: [65, 235, 65] }}
                transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.28, ease: 'easeInOut' }}
              />
              <motion.circle
                cx={cx}
                r="8.5"
                fill="url(#nerve-axon-gold)"
                stroke="#ffffff"
                strokeWidth="2"
                filter="url(#med-3d-specular)"
                animate={reduced ? { cy: 210 } : { cy: [235, 65, 235] }}
                transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.28, ease: 'easeInOut' }}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/**
 * 8. OPHTHALMOLOGY
 * 3D Optical Eyeball with Cornea, Crystalline Lens & Retinal Vasculature
 */
function Ophthalmology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Sclera & Optical Globe */}
      <circle
        cx="220"
        cy="150"
        r="92"
        fill="url(#theme-bone-gradient)"
        stroke="#475569"
        strokeWidth="3.5"
        filter="url(#med-3d-specular)"
      />

      {/* Anterior Clear Cornea Dome */}
      <path
        d="M130 108 C 95 128 95 172 130 192"
        stroke="#38BDF8"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Iris & Pupil Sphincter */}
      <ellipse cx="146" cy="150" rx="18" ry="46" fill="url(#theme-teal-gradient)" />
      <ellipse cx="144" cy="150" rx="8" ry="24" fill="#020617" />

      {/* Crystalline Biconvex Lens */}
      <path
        d="M172 115 C 182 132 182 168 172 185 C 162 168 162 132 172 115 Z"
        fill="#e0f2fe"
        stroke="#38BDF8"
        strokeWidth="2.5"
      />

      {/* Optical Light Rays Converging on Fovea */}
      <g stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 3" opacity="0.9">
        <line x1="40" y1="105" x2="130" y2="124" />
        <line x1="130" y1="124" x2="172" y2="132" />
        <line x1="172" y1="132" x2="312" y2="150" />

        <line x1="40" y1="195" x2="130" y2="176" />
        <line x1="130" y1="176" x2="172" y2="168" />
        <line x1="172" y1="168" x2="312" y2="150" />
      </g>

      {/* Foveal Macular Target */}
      <circle cx="312" cy="150" r="7" fill="#E11D48" stroke="#ffffff" strokeWidth="2" />
      {/* Optic Nerve Head */}
      <path d="M305 168 L 355 186" stroke="#f59e0b" strokeWidth="11" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 9. ENT (OTORHINOLARYNGOLOGY)
 * 3D Middle Ear Ossicles (Malleus, Incus, Stapes) & Spiral Cochlea
 */
function Ent3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Tympanic Membrane (Eardrum) */}
      <ellipse cx="105" cy="150" rx="12" ry="60" fill="#334155" stroke="#64748b" strokeWidth="3" />

      {/* Ossicular Chain (Malleus, Incus, Stapes) */}
      <path
        d="M110 128 L 160 115 L 160 165"
        stroke="url(#theme-bone-gradient)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M160 115 L 205 130 L 212 165"
        stroke="url(#theme-bone-gradient)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M212 165 L 240 158 L 240 172 Z" fill="#94a3b8" stroke="#475569" strokeWidth="2" />

      {/* 3D Spiral Cochlea Shell */}
      <path
        d="M255 165 C 270 125 320 120 340 150 C 355 180 340 215 305 215 C 275 215 270 195 285 180 C 300 165 315 172 315 188"
        stroke="url(#theme-teal-gradient)"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />

      {/* Acoustic Sound Pressure Waves */}
      {!reduced && (
        <motion.path
          d="M45 120 Q 65 150 45 180 M 65 112 Q 85 150 65 188"
          stroke="#38BDF8"
          strokeWidth="4"
          strokeLinecap="round"
          animate={{ opacity: [0.3, 1, 0.3], x: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

/**
 * 10. SURGERY
 * 3D Laparoscopic Optical Instrument, FAST Ultrasound Sector & Tissue Planes
 */
function Surgery3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Abdominal Wall Surgical Plane */}
      <polygon
        points="70,225 390,225 350,165 110,165"
        fill="#042F2E"
        fillOpacity="0.35"
        stroke="#0D9488"
        strokeWidth="2"
      />

      {/* Laparoscopic Trocar Shaft */}
      <path
        d="M345 45 L 230 195"
        stroke="url(#theme-titanium-gradient)"
        strokeWidth="14"
        strokeLinecap="round"
        filter="url(#med-3d-specular)"
      />
      <circle cx="345" cy="45" r="14" fill="#0D9488" stroke="#ffffff" strokeWidth="3" />

      {/* Precision Micro-Scissors Tip */}
      <path d="M230 195 L 210 212 M 230 195 L 218 220" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />

      {/* Laser Guidance Alignment Reticle */}
      <circle cx="215" cy="210" r="20" stroke="#10B981" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="215" cy="210" r="4" fill="#10B981" />
    </svg>
  );
}

/**
 * 11. OBSTETRICS & GYNECOLOGY (OBG)
 * 3D Gravid Uterus, Umbilical Cord Helical Twist & Pulsatile Doppler Waveform
 */
function Obg3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Gravid Uterus Myometrium */}
      <path
        d="M230 60 C 310 60 340 135 330 210 C 325 260 280 275 230 275 C 180 275 135 260 130 210 C 120 135 150 60 230 60 Z"
        fill="url(#cardiac-muscle-3d)"
        stroke="#fecdd3"
        strokeWidth="4"
        filter="url(#med-3d-specular)"
      />

      {/* Amniotic Fluid Cavity & Fetal Contour */}
      <path
        d="M230 95 C 265 95 285 130 275 168 C 268 198 238 212 216 205 C 200 198 205 174 220 170 C 234 165 238 140 224 125"
        stroke="#ffffff"
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      {/* Pulsing Umbilical Doppler Flow Indicator */}
      <motion.circle
        cx="230"
        cy="162"
        r="8"
        fill="#38BDF8"
        stroke="#ffffff"
        strokeWidth="2.5"
        filter="url(#med-ambient-glow)"
        animate={reduced ? {} : { scale: [1, 1.35, 1] }}
        transition={{ duration: 0.85, repeat: Infinity }}
      />
    </svg>
  );
}

/**
 * 12. PEDIATRICS
 * 3D Infant Growth Arc & Vital Milestone Sphere
 */
function Pediatrics3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Growth Percentile Grid (50th, 97th percentile arcs) */}
      <path d="M60 240 Q 200 210 400 60" stroke="#475569" strokeWidth="2.5" strokeDasharray="5 4" />
      <path d="M60 255 Q 200 232 400 105" stroke="#0D9488" strokeWidth="4" />

      {/* 3D Vital Milestone Sphere */}
      <circle
        cx="230"
        cy="172"
        r="50"
        fill="url(#theme-teal-gradient)"
        stroke="#ffffff"
        strokeWidth="4"
        filter="url(#med-3d-specular)"
      />
      <path d="M212 172 Q 230 190 248 172" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="218" cy="158" r="4" fill="#ffffff" />
      <circle cx="242" cy="158" r="4" fill="#ffffff" />
    </svg>
  );
}

/**
 * 13. ORTHOPEDICS
 * 3D Trabecular Bone Architecture (Femoral Neck, Ward's Triangle & Stress Vectors)
 */
function Orthopedics3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Femur Bone Head, Neck & Shaft */}
      <path
        d="M115 75 C 135 45 180 52 188 90 C 190 112 180 135 200 150 L 320 225 C 342 240 365 225 372 202 L 385 255 L 305 270 L 188 180 C 165 165 145 172 130 150 L 100 120 Z"
        fill="url(#theme-bone-gradient)"
        stroke="#334155"
        strokeWidth="3.5"
        filter="url(#med-3d-specular)"
      />

      {/* Trabecular Stress Lines (Ward's Triangle) */}
      <g stroke="#0D9488" strokeWidth="2.2" opacity="0.85">
        <line x1="130" y1="90" x2="180" y2="135" />
        <line x1="145" y1="75" x2="195" y2="120" />
        <line x1="160" y1="68" x2="210" y2="105" />
      </g>

      {/* Biomechanical Compression Vector Arrow */}
      <path d="M100 25 L 150 68" stroke="#E11D48" strokeWidth="4.5" strokeLinecap="round" />
      <polygon points="150,68 135,62 142,50" fill="#E11D48" />
    </svg>
  );
}

/**
 * 14. DERMATOLOGY
 * 3D Tri-layer Cutaneous Architecture (Stratum Corneum, Epidermis, Dermis & Papillary Loops)
 */
function Dermatology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Stratum Corneum & Epidermis */}
      <polygon
        points="60,90 400,90 370,128 30,128"
        fill="#fbcfe8"
        stroke="#f472b6"
        strokeWidth="2"
        filter="url(#med-3d-specular)"
      />
      {/* Dermis with Papillae */}
      <polygon
        points="30,128 370,128 340,210 0,210"
        fill="#fda4af"
        stroke="#fb7185"
        strokeWidth="2"
      />
      {/* Subcutis (Adipose Lobules) */}
      <polygon
        points="0,210 340,210 310,270 -30,270"
        fill="#fef08a"
        stroke="#fde047"
        strokeWidth="2"
      />

      {/* Hair Shaft & Follicle Root */}
      <path d="M230 240 L 200 60" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
      <circle cx="230" cy="240" r="10" fill="#78350f" />

      {/* Dermal Capillary Loop */}
      <path d="M130 210 C 130 142 160 142 160 210" stroke="#E11D48" strokeWidth="3.5" fill="none" />
    </svg>
  );
}

/**
 * 15. PSYCHIATRY & NEUROLOGY
 * 3D Cortical Brain Hemispheres with Connectome Tractography & Synaptic Spark
 */
function Brain3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* 3D Cerebral Hemispheres with Cortical Sulci & Gyri */}
      <path
        d="M230 60 C 320 58 360 120 350 188 C 345 240 310 262 230 262 C 150 262 115 240 110 188 C 100 120 140 58 230 60 Z"
        fill="url(#theme-teal-gradient)"
        stroke="#99f6e4"
        strokeWidth="4"
        filter="url(#med-3d-specular)"
      />

      {/* Deep Cortical Gyral Grooves */}
      <path
        d="M175 110 Q 230 135 215 185 Q 200 225 230 248"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M260 110 Q 230 142 268 185"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Synaptic Connectome Firing Spark */}
      {!reduced && (
        <motion.circle
          cx="230"
          cy="140"
          r="6"
          fill="#fef08a"
          filter="url(#med-ambient-glow)"
          animate={{ scale: [0.8, 1.6, 0.8], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

/**
 * 16. RADIOLOGY
 * 3D Volumetric Axial CT/MRI Gantry with Rotating Laser Scanning Beam
 */
function Radiology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* 3D CT Gantry Ring */}
      <ellipse
        cx="230"
        cy="150"
        rx="135"
        ry="105"
        fill="#042F2E"
        stroke="#0D9488"
        strokeWidth="6"
        filter="url(#med-3d-specular)"
      />
      <ellipse cx="230" cy="150" rx="80" ry="65" fill="#020617" />

      {/* Patient Gantry Couch */}
      <polygon
        points="175,195 285,195 315,275 145,275"
        fill="url(#theme-titanium-gradient)"
        stroke="#94a3b8"
        strokeWidth="2.5"
      />

      {/* Moving Holographic Scanning Laser Plane */}
      <motion.line
        x1="150"
        y1="105"
        x2="310"
        y2="105"
        stroke="#38BDF8"
        strokeWidth="4.5"
        strokeLinecap="round"
        filter="url(#med-ambient-glow)"
        animate={reduced ? { y1: 150, y2: 150 } : { y1: [95, 205, 95], y2: [95, 205, 95] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
}

/**
 * 17. ANESTHESIOLOGY
 * 3D Vaporizer Dial & Capnographic Airway
 */
function Anesthesia3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      <circle cx="230" cy="150" r="80" fill="#042F2E" stroke="#0D9488" strokeWidth="6" filter="url(#med-3d-specular)" />
      <circle cx="230" cy="150" r="50" fill="#1e293b" />
      <line x1="230" y1="150" x2="265" y2="115" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M75 255 L 150 255 L 180 210 L 270 210 L 280 255 L 385 255"
        stroke="#10B981"
        strokeWidth="3.5"
        fill="none"
      />
    </svg>
  );
}

/**
 * 18. FORENSIC MEDICINE & TOXICOLOGY (FMT)
 * 3D Dactyloscopic Minutiae Hologram & Trajectory Calibration
 */
function Forensics3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {[22, 42, 64, 86].map((r, i) => (
        <ellipse
          key={i}
          cx="230"
          cy="150"
          rx={r * 1.25}
          ry={r * 1.55}
          stroke="#0D9488"
          strokeWidth="3.5"
          strokeDasharray={`${30 + i * 15} 9`}
          fill="none"
        />
      ))}
      <circle cx="230" cy="150" r="8" fill="#E11D48" filter="url(#med-ambient-glow)" />
    </svg>
  );
}

/**
 * 19. PSM / COMMUNITY MEDICINE
 * 3D Global Epidemiological Surveillance Sphere with Herd Immunity Shield
 */
function Community3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      <circle
        cx="230"
        cy="150"
        r="75"
        fill="url(#theme-teal-gradient)"
        stroke="#7dd3fc"
        strokeWidth="3.5"
        filter="url(#med-3d-specular)"
      />
      <ellipse cx="230" cy="150" rx="72" ry="26" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 3" fill="none" />
      <circle cx="200" cy="128" r="6" fill="#fef08a" />
      <circle cx="260" cy="172" r="6" fill="#fef08a" />
    </svg>
  );
}

/**
 * GENERIC CLINICAL FALLBACK
 */
function Generic3DModel({ accent, subjectName, reduced }: { accent: string; subjectName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      <circle
        cx="230"
        cy="150"
        r="75"
        fill="url(#theme-teal-gradient)"
        stroke="#ffffff"
        strokeWidth="4"
        filter="url(#med-3d-specular)"
      />
      <path d="M200 150 L 260 150 M 230 120 L 230 180" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
