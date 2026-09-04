import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'public', 'assets', 'medical-images');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// -----------------------------------------------------------------------------------------
// 1. ANATOMY: Klumpke's Total Claw Hand
// -----------------------------------------------------------------------------------------
const anatClawHandClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <rect width="500" height="400" fill="#0f172a"/>
  <!-- Forearm and Wrist -->
  <path d="M 120 360 L 140 240 L 190 220" stroke="#94a3b8" stroke-width="28" stroke-linecap="round" fill="none"/>
  <!-- Dorsum of Hand and Hyperextended MCP joints -->
  <path d="M 190 220 Q 240 180 290 190" stroke="#cbd5e1" stroke-width="24" stroke-linecap="round" fill="none"/>
  <!-- Flexed Interphalangeal Joints (Claw posture) -->
  <path d="M 290 190 L 330 240 L 320 290" stroke="#f8fafc" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M 305 180 L 350 230 L 345 285" stroke="#f8fafc" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M 320 170 L 370 220 L 365 275" stroke="#f8fafc" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M 330 160 L 380 210 L 375 260" stroke="#f8fafc" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <!-- Thumb in abduction -->
  <path d="M 210 230 L 250 270 L 280 290" stroke="#f8fafc" stroke-width="14" stroke-linecap="round" fill="none"/>
  <!-- Hypothenar and Interossei Wasting Hollows -->
  <ellipse cx="230" cy="220" rx="14" ry="8" fill="#1e293b"/>
  <ellipse cx="260" cy="210" rx="12" ry="6" fill="#1e293b"/>
  <text x="30" y="40" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#64748b">CLINICAL PHOTOGRAPH · HAND EXAMINATION</text>
</svg>`;

const anatClawHandAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  ${anatClawHandClean.replace('</svg>', '')}
  <g font-family="'Outfit', sans-serif" font-size="12" font-weight="bold">
    <text x="210" y="140" fill="#ef4444">Hyperextension at MCP Joints</text>
    <text x="320" y="325" fill="#38bdf8">Flexion at IP Joints (Clawing)</text>
    <text x="40" y="190" fill="#fbbf24">Intrinsic Muscle Wasting (Lumbricals/Interossei)</text>
    <text x="40" y="210" fill="#fde047" font-size="10">Lower Trunk Injury (C8-T1, Klumpke's Palsy)</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 2. PHYSIOLOGY: Body Fluid Compartments (TBW, ICF, ECF, Interstitial, Plasma)
// -----------------------------------------------------------------------------------------
const physioFluidsClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 400" width="100%" height="100%">
  <rect width="700" height="400" fill="#0f172a"/>
  <text x="350" y="45" font-family="'Outfit', sans-serif" font-size="15" font-weight="bold" fill="#f8fafc" text-anchor="middle">TOTAL BODY WATER (60% of Body Weight, ~42 L in 70kg male)</text>
  
  <!-- Outer TBW Container Box -->
  <rect x="50" y="70" width="600" height="280" rx="16" fill="none" stroke="#475569" stroke-width="3"/>

  <!-- Intracellular Fluid (ICF, 2/3 of TBW, 40% BW, ~28 L) -->
  <rect x="60" y="80" width="380" height="260" rx="12" fill="#0369a1" opacity="0.85"/>
  <text x="250" y="190" font-family="'Outfit', sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">INTRACELLULAR FLUID (ICF)</text>
  <text x="250" y="220" font-family="'Outfit', sans-serif" font-size="14" fill="#bae6fd" text-anchor="middle">2/3 of TBW (40% BW, ~28 L)</text>
  <text x="250" y="245" font-family="'Courier New', monospace" font-size="12" fill="#e0f2fe" text-anchor="middle">Major Cation: K+, Major Anions: HPO4 2-, Proteins</text>

  <!-- Extracellular Fluid (ECF, 1/3 of TBW, 20% BW, ~14 L) -->
  <g transform="translate(455, 80)">
    <!-- Interstitial Fluid (ISF, 3/4 of ECF, 15% BW, ~10.5 L) -->
    <rect x="0" y="0" width="185" height="180" rx="10" fill="#0284c7" opacity="0.7"/>
    <text x="92" y="80" font-family="'Outfit', sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">INTERSTITIAL</text>
    <text x="92" y="100" font-family="'Outfit', sans-serif" font-size="12" fill="#e0f2fe" text-anchor="middle">3/4 of ECF (~10.5 L)</text>

    <!-- Plasma Volume (PV, 1/4 of ECF, 5% BW, ~3.5 L) -->
    <rect x="0" y="190" width="185" height="70" rx="10" fill="#be123c" opacity="0.8"/>
    <text x="92" y="225" font-family="'Outfit', sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">PLASMA VOLUME</text>
    <text x="92" y="245" font-family="'Outfit', sans-serif" font-size="11" fill="#fecdd3" text-anchor="middle">1/4 of ECF (~3.5 L)</text>
  </g>
</svg>`;

const physioFluidsAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 400" width="100%" height="100%">
  ${physioFluidsClean.replace('</svg>', '')}
  <g font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#fef08a">
    <text x="70" y="310">Indicator Dilution: D2O / Antipyrine measures TBW</text>
    <text x="440" y="375" fill="#fef08a">Inulin / Mannitol measures ECF · Evans Blue / RISA measures Plasma</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 3. MEDICINE: Anterior STEMI (Leads V1 - V4 ST Elevation)
// -----------------------------------------------------------------------------------------
const ecgAnteriorStemiClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 400" width="100%" height="100%">
  <defs>
    <pattern id="ecgAntSmall" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#fecdd3" stroke-width="0.5"/>
    </pattern>
    <pattern id="ecgAntGrid" width="50" height="50" patternUnits="userSpaceOnUse">
      <rect width="50" height="50" fill="url(#ecgAntSmall)"/>
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#fda4af" stroke-width="1.2"/>
    </pattern>
  </defs>
  <rect width="920" height="400" fill="#fff1f2"/>
  <rect width="920" height="400" fill="url(#ecgAntGrid)"/>
  <text x="25" y="26" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#64748b">12-LEAD ECG · LEADS V1-V4 (ANTERIOR CHEST LEADS) · 25 mm/sec · 10 mm/mV</text>

  <!-- Lead V1 -->
  <g transform="translate(30, 60)">
    <text x="0" y="20" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#1e293b">V1</text>
    <path d="M 0 60 L 20 60 Q 30 55 40 60 L 45 60 L 50 63 L 55 40 L 60 95 L 65 35 Q 85 30 105 45 L 120 60 L 140 60 Q 150 55 160 60 L 165 60 L 170 63 L 175 40 L 180 95 L 185 35 Q 205 30 225 45 L 240 60" fill="none" stroke="#0f172a" stroke-width="2.4"/>
  </g>

  <!-- Lead V2 -->
  <g transform="translate(470, 60)">
    <text x="0" y="20" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#1e293b">V2</text>
    <path d="M 0 60 L 20 60 Q 30 55 40 60 L 45 60 L 50 63 L 55 30 L 60 110 L 65 15 Q 90 10 115 35 L 130 60 L 150 60 Q 160 55 170 60 L 175 60 L 180 63 L 185 30 L 190 110 L 195 15 Q 220 10 245 35 L 260 60" fill="none" stroke="#0f172a" stroke-width="2.4"/>
  </g>

  <!-- Lead V3 -->
  <g transform="translate(30, 210)">
    <text x="0" y="20" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#1e293b">V3</text>
    <path d="M 0 60 L 20 60 Q 30 55 40 60 L 45 60 L 50 63 L 55 15 L 60 95 L 65 10 Q 90 5 115 30 L 130 60 L 150 60 Q 160 55 170 60 L 175 60 L 180 63 L 185 15 L 190 95 L 195 10 Q 220 5 245 30 L 260 60" fill="none" stroke="#0f172a" stroke-width="2.4"/>
  </g>

  <!-- Lead V4 -->
  <g transform="translate(470, 210)">
    <text x="0" y="20" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#1e293b">V4</text>
    <path d="M 0 60 L 20 60 Q 30 55 40 60 L 45 60 L 50 63 L 55 10 L 60 75 L 65 20 Q 90 15 115 40 L 130 60 L 150 60 Q 160 55 170 60 L 175 60 L 180 63 L 185 10 L 190 75 L 195 20 Q 220 15 245 40 L 260 60" fill="none" stroke="#0f172a" stroke-width="2.4"/>
  </g>
</svg>`;

const ecgAnteriorStemiAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 400" width="100%" height="100%">
  ${ecgAnteriorStemiClean.replace('</svg>', '')}
  <g font-family="'Outfit', sans-serif" font-size="12" font-weight="bold" fill="#dc2626">
    <circle cx="535" cy="75" r="16" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="3,2"/>
    <text x="560" y="75">Marked Tombstone ST Elevation in V2 (+5 mm)</text>
    <circle cx="95" cy="220" r="16" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="3,2"/>
    <text x="120" y="220">Hyperacute ST Elevation in V3</text>
    <text x="560" y="230">Occluded Artery: Left Anterior Descending (LAD)</text>
  </g>
</svg>`;

// Write all new assets
const newAssets = [
  { name: 'anat-claw-hand', clean: anatClawHandClean, ann: anatClawHandAnnotated },
  { name: 'physio-fluid-compartments', clean: physioFluidsClean, ann: physioFluidsAnnotated },
  { name: 'med-ecg-anterior-stemi', clean: ecgAnteriorStemiClean, ann: ecgAnteriorStemiAnnotated },
];

for (const asset of newAssets) {
  fs.writeFileSync(path.join(outDir, `${asset.name}.svg`), asset.clean, 'utf-8');
  fs.writeFileSync(path.join(outDir, `${asset.name}-annotated.svg`), asset.ann, 'utf-8');
}

console.log(`Generated distinct visual assets in ${outDir}`);
