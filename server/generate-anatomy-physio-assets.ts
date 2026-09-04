import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'public', 'assets', 'medical-images');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// -----------------------------------------------------------------------------------------
// 1. ANATOMY: Brachial Plexus Diagram (Roots, Trunks, Divisions, Cords, Branches)
// -----------------------------------------------------------------------------------------
const anatBrachialPlexusClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="100%" height="100%">
  <rect width="800" height="480" fill="#0f172a"/>
  
  <!-- Section Headers (Subtle, Non-Revealing Grid) -->
  <line x1="160" y1="40" x2="160" y2="440" stroke="#334155" stroke-dasharray="4,4"/>
  <line x1="300" y1="40" x2="300" y2="440" stroke="#334155" stroke-dasharray="4,4"/>
  <line x1="440" y1="40" x2="440" y2="440" stroke="#334155" stroke-dasharray="4,4"/>
  <line x1="600" y1="40" x2="600" y2="440" stroke="#334155" stroke-dasharray="4,4"/>
  <text x="90" y="30" font-family="'Courier New', monospace" font-size="12" fill="#94a3b8" text-anchor="middle">ROOTS</text>
  <text x="230" y="30" font-family="'Courier New', monospace" font-size="12" fill="#94a3b8" text-anchor="middle">TRUNKS</text>
  <text x="370" y="30" font-family="'Courier New', monospace" font-size="12" fill="#94a3b8" text-anchor="middle">DIVISIONS</text>
  <text x="520" y="30" font-family="'Courier New', monospace" font-size="12" fill="#94a3b8" text-anchor="middle">CORDS</text>
  <text x="700" y="30" font-family="'Courier New', monospace" font-size="12" fill="#94a3b8" text-anchor="middle">BRANCHES</text>

  <!-- Roots (C5 - T1) -->
  <g font-family="'Outfit', sans-serif" font-size="14" font-weight="bold" fill="#f8fafc">
    <text x="30" y="95">C5</text>
    <text x="30" y="165">C6</text>
    <text x="30" y="245">C7</text>
    <text x="30" y="325">C8</text>
    <text x="30" y="395">T1</text>
  </g>

  <!-- Nerve Traces (Clean Golden Yellow Plexus Pathways) -->
  <g fill="none" stroke="#fbbf24" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <!-- C5 & C6 merge into Upper Trunk -->
    <path d="M 60 90 L 160 90 Q 190 90 220 125 L 300 125"/>
    <path d="M 60 160 L 160 160 Q 190 160 220 125"/>

    <!-- C7 forms Middle Trunk -->
    <path d="M 60 240 L 300 240"/>

    <!-- C8 & T1 merge into Lower Trunk -->
    <path d="M 60 320 L 160 320 Q 190 320 220 355 L 300 355"/>
    <path d="M 60 390 L 160 390 Q 190 390 220 355"/>

    <!-- Divisions to Lateral Cord (Upper + Middle Anterior) -->
    <path d="M 300 125 L 440 125 L 520 160"/>
    <path d="M 300 240 Q 370 240 440 150 L 520 160"/>

    <!-- Divisions to Posterior Cord (Upper + Middle + Lower Posteriors) -->
    <path d="M 300 125 Q 370 180 440 240 L 580 240" stroke="#f59e0b" stroke-dasharray="6,3"/>
    <path d="M 300 240 L 440 240" stroke="#f59e0b" stroke-dasharray="6,3"/>
    <path d="M 300 355 Q 370 300 440 240" stroke="#f59e0b" stroke-dasharray="6,3"/>

    <!-- Divisions to Medial Cord (Lower Anterior) -->
    <path d="M 300 355 L 440 355 L 520 320"/>

    <!-- Terminal Branches from Lateral Cord: Musculocutaneous & Median Lateral Root -->
    <path d="M 520 160 L 620 120 L 760 120"/>
    <path d="M 520 160 L 620 200 L 680 240 L 760 240"/>

    <!-- Terminal Branches from Posterior Cord: Axillary & Radial -->
    <path d="M 580 240 L 650 200 L 760 180"/>
    <path d="M 580 240 L 760 260"/>

    <!-- Terminal Branches from Medial Cord: Ulnar & Median Medial Root -->
    <path d="M 520 320 L 680 240"/>
    <path d="M 520 320 L 620 360 L 760 360"/>
  </g>
</svg>`;

const anatBrachialPlexusAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="100%" height="100%">
  ${anatBrachialPlexusClean.replace('</svg>', '')}
  <g font-family="'Outfit', sans-serif" font-size="12" font-weight="bold">
    <!-- Erb's Point Annotation -->
    <circle cx="220" cy="125" r="16" fill="none" stroke="#ef4444" stroke-width="3" stroke-dasharray="3,2"/>
    <text x="140" y="70" fill="#ef4444">Erb's Point (C5-C6 Upper Trunk Injury)</text>
    <text x="140" y="86" fill="#fca5a5" font-size="10">Waiter's Tip Deformity</text>

    <!-- Klumpke's Point Annotation -->
    <circle cx="220" cy="355" r="16" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="3,2"/>
    <text x="140" y="440" fill="#38bdf8">Klumpke's Point (C8-T1 Lower Trunk Injury)</text>
    <text x="140" y="456" fill="#bae6fd" font-size="10">Total Claw Hand + Horner's Syndrome</text>

    <!-- Terminal Nerve Labels -->
    <text x="640" y="110" fill="#fde047">Musculocutaneous</text>
    <text x="680" y="170" fill="#fde047">Axillary</text>
    <text x="700" y="230" fill="#fde047">Median</text>
    <text x="700" y="280" fill="#fde047">Radial</text>
    <text x="700" y="380" fill="#fde047">Ulnar</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 2. ANATOMY: Knee Joint Ligamentous Anatomy & Lachman / Meniscus View
// -----------------------------------------------------------------------------------------
const anatKneeJointClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="100%" height="100%">
  <rect width="600" height="500" fill="#0f172a"/>
  
  <!-- Distal Femur with Condyles -->
  <path d="M 200 40 L 200 160 Q 180 230 220 250 Q 270 260 300 210 Q 330 260 380 250 Q 420 230 400 160 L 400 40 Z" fill="#334155" stroke="#64748b" stroke-width="3"/>
  <text x="300" y="100" font-family="'Outfit', sans-serif" font-size="14" font-weight="bold" fill="#94a3b8" text-anchor="middle">FEMUR</text>

  <!-- Proximal Tibia with Tibial Plateau -->
  <path d="M 180 320 Q 300 300 420 320 L 370 460 L 230 460 Z" fill="#334155" stroke="#64748b" stroke-width="3"/>
  <text x="300" y="420" font-family="'Outfit', sans-serif" font-size="14" font-weight="bold" fill="#94a3b8" text-anchor="middle">TIBIA</text>

  <!-- Fibula on Lateral Side -->
  <path d="M 170 350 Q 150 360 140 400 L 150 460 L 175 460 L 175 355 Z" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="130" y="440" font-family="'Outfit', sans-serif" font-size="11" fill="#64748b">Fibula (L)</text>

  <!-- Medial Meniscus (C-shaped, fixed) & Lateral Meniscus (O-shaped) -->
  <ellipse cx="235" cy="300" rx="35" ry="10" fill="#0284c7" opacity="0.8"/>
  <ellipse cx="365" cy="300" rx="30" ry="10" fill="#0284c7" opacity="0.8"/>

  <!-- Anterior Cruciate Ligament (ACL) - Crossing from Anterior Tibia to Lateral Femoral Condyle -->
  <path d="M 285 305 L 360 215" stroke="#fbbf24" stroke-width="12" stroke-linecap="round"/>

  <!-- Posterior Cruciate Ligament (PCL) - Posterior Tibia to Medial Femoral Condyle -->
  <path d="M 315 305 L 240 215" stroke="#d97706" stroke-width="10" stroke-linecap="round" opacity="0.85"/>

  <!-- Collateral Ligaments: LCL & MCL -->
  <path d="M 175 220 L 160 350" stroke="#e2e8f0" stroke-width="6" stroke-linecap="round"/>
  <path d="M 405 210 L 415 340" stroke="#e2e8f0" stroke-width="8" stroke-linecap="round"/>
</svg>`;

const anatKneeJointAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="100%" height="100%">
  ${anatKneeJointClean.replace('</svg>', '')}
  <g font-family="'Outfit', sans-serif" font-size="12" font-weight="bold">
    <!-- ACL Marker -->
    <path d="M 320 260 L 430 240" stroke="#fbbf24" stroke-width="2"/>
    <text x="440" y="245" fill="#fbbf24">Anterior Cruciate Ligament (ACL)</text>
    <text x="440" y="260" fill="#fef08a" font-size="10">LAMP: Lateral Condyle &lt;- Anterior Tibia</text>

    <!-- PCL Marker -->
    <path d="M 270 260 L 160 250" stroke="#d97706" stroke-width="2"/>
    <text x="40" y="245" fill="#d97706">Posterior Cruciate Ligament (PCL)</text>

    <!-- Meniscus Marker -->
    <text x="430" y="315" fill="#38bdf8">Medial Meniscus (C-shaped, fixed to MCL)</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 3. PHYSIOLOGY: Cardiac / Nerve Action Potential Curve
// -----------------------------------------------------------------------------------------
const physioActionPotentialClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 450" width="100%" height="100%">
  <rect width="700" height="450" fill="#0f172a"/>
  
  <!-- Voltage Axes -->
  <line x1="80" y1="40" x2="80" y2="380" stroke="#475569" stroke-width="2"/>
  <line x1="80" y1="380" x2="650" y2="380" stroke="#475569" stroke-width="2"/>
  
  <!-- Voltage Calibration Labels (Exam standard) -->
  <g font-family="'Courier New', monospace" font-size="12" fill="#94a3b8">
    <text x="30" y="80">+20 mV</text>
    <text x="45" y="150">0 mV</text>
    <text x="30" y="230">-50 mV</text>
    <text x="30" y="340">-90 mV</text>
    <line x1="75" y1="145" x2="650" y2="145" stroke="#334155" stroke-dasharray="3,3"/>
    <line x1="75" y1="335" x2="650" y2="335" stroke="#334155" stroke-dasharray="3,3"/>
    <text x="340" y="420">Time (ms)</text>
  </g>

  <!-- Ventricular Myocyte Action Potential (Phase 0, 1, 2, 3, 4) -->
  <path d="
    M 80 335 
    L 160 335 
    L 180 75 
    Q 200 110 220 120 
    L 380 135 
    Q 460 170 520 335 
    L 650 335
  " fill="none" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"/>
</svg>`;

const physioActionPotentialAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 450" width="100%" height="100%">
  ${physioActionPotentialClean.replace('</svg>', '')}
  <g font-family="'Outfit', sans-serif" font-size="12" font-weight="bold">
    <!-- Phase 0 -->
    <circle cx="170" cy="200" r="14" fill="#0284c7"/>
    <text x="166" y="205" fill="#ffffff">0</text>
    <text x="100" y="170" fill="#38bdf8">Phase 0: Rapid Na+ Influx (INa)</text>

    <!-- Phase 1 -->
    <circle cx="210" cy="115" r="14" fill="#0284c7"/>
    <text x="206" y="120" fill="#ffffff">1</text>
    <text x="230" y="90" fill="#fbbf24">Phase 1: Transient K+ Efflux (Ito)</text>

    <!-- Phase 2 (Plateau) -->
    <circle cx="300" cy="130" r="14" fill="#0284c7"/>
    <text x="296" y="135" fill="#ffffff">2</text>
    <text x="270" y="170" fill="#ef4444">Phase 2: L-type Ca2+ Influx balanced by K+ Efflux (Plateau)</text>

    <!-- Phase 3 -->
    <circle cx="480" cy="240" r="14" fill="#0284c7"/>
    <text x="476" y="245" fill="#ffffff">3</text>
    <text x="500" y="245" fill="#a855f7">Phase 3: Rapid Repolarization (IKr / IKs)</text>

    <!-- Phase 4 -->
    <circle cx="580" cy="335" r="14" fill="#0284c7"/>
    <text x="576" y="340" fill="#ffffff">4</text>
    <text x="530" y="370" fill="#94a3b8">Phase 4: Resting Membrane Potential (IK1 / Na-K Pump)</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 4. PHYSIOLOGY: Cell Membrane Transport & Na+/K+ ATPase Pump
// -----------------------------------------------------------------------------------------
const physioMembraneClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 400" width="100%" height="100%">
  <rect width="700" height="400" fill="#0f172a"/>
  <text x="40" y="40" font-family="'Outfit', sans-serif" font-size="13" font-weight="bold" fill="#94a3b8">EXTRACELLULAR FLUID (High Na+, Low K+)</text>
  <text x="40" y="370" font-family="'Outfit', sans-serif" font-size="13" font-weight="bold" fill="#94a3b8">INTRACELLULAR CYTOPLASM (High K+, Low Na+)</text>

  <!-- Lipid Bilayer Phospholipid Heads -->
  <g fill="#f43f5e">
    <!-- Top Layer -->
    <circle cx="60" cy="140" r="8"/><circle cx="90" cy="140" r="8"/><circle cx="120" cy="140" r="8"/><circle cx="150" cy="140" r="8"/>
    <circle cx="350" cy="140" r="8"/><circle cx="380" cy="140" r="8"/><circle cx="410" cy="140" r="8"/><circle cx="440" cy="140" r="8"/>
    <circle cx="470" cy="140" r="8"/><circle cx="500" cy="140" r="8"/><circle cx="530" cy="140" r="8"/><circle cx="560" cy="140" r="8"/>
    <circle cx="590" cy="140" r="8"/><circle cx="620" cy="140" r="8"/><circle cx="650" cy="140" r="8"/>

    <!-- Bottom Layer -->
    <circle cx="60" cy="240" r="8"/><circle cx="90" cy="240" r="8"/><circle cx="120" cy="240" r="8"/><circle cx="150" cy="240" r="8"/>
    <circle cx="350" cy="240" r="8"/><circle cx="380" cy="240" r="8"/><circle cx="410" cy="240" r="8"/><circle cx="440" cy="240" r="8"/>
    <circle cx="470" cy="240" r="8"/><circle cx="500" cy="240" r="8"/><circle cx="530" cy="240" r="8"/><circle cx="560" cy="240" r="8"/>
    <circle cx="590" cy="240" r="8"/><circle cx="620" cy="240" r="8"/><circle cx="650" cy="240" r="8"/>
  </g>

  <!-- Fatty acid hydrocarbon tails -->
  <g stroke="#fb7185" stroke-width="2">
    <line x1="60" y1="148" x2="60" y2="232"/><line x1="90" y1="148" x2="90" y2="232"/>
    <line x1="120" y1="148" x2="120" y2="232"/><line x1="150" y1="148" x2="150" y2="232"/>
    <line x1="350" y1="148" x2="350" y2="232"/><line x1="380" y1="148" x2="380" y2="232"/>
    <line x1="410" y1="148" x2="410" y2="232"/><line x1="440" y1="148" x2="440" y2="232"/>
    <line x1="470" y1="148" x2="470" y2="232"/><line x1="500" y1="148" x2="500" y2="232"/>
    <line x1="530" y1="148" x2="530" y2="232"/><line x1="560" y1="148" x2="560" y2="232"/>
  </g>

  <!-- Transmembrane Na+/K+ ATPase Pump Protein (Alpha & Beta Subunits) -->
  <path d="M 180 120 Q 250 100 320 120 L 300 260 Q 250 280 200 260 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="3"/>
  <ellipse cx="250" cy="190" rx="35" ry="45" fill="#0369a1"/>
</svg>`;

const physioMembraneAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 400" width="100%" height="100%">
  ${physioMembraneClean.replace('</svg>', '')}
  <g font-family="'Outfit', sans-serif" font-size="12" font-weight="bold">
    <!-- 3 Na+ Out -->
    <path d="M 230 180 L 210 70" stroke="#fbbf24" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="140" y="80" fill="#fbbf24">3 Na+ pumped OUT</text>

    <!-- 2 K+ In -->
    <path d="M 280 80 L 290 280" stroke="#38bdf8" stroke-width="3"/>
    <text x="310" y="330" fill="#38bdf8">2 K+ pumped IN</text>

    <!-- ATP -> ADP -->
    <text x="180" y="315" fill="#f43f5e">ATP → ADP + Pi (Primary Active Transport)</text>
    <text x="360" y="190" fill="#e2e8f0">Inhibited by: Ouabain &amp; Digoxin</text>
  </g>
</svg>`;

// Write all assets to disk
const multiSpecialtyAssets = [
  { name: 'anat-brachial-plexus', clean: anatBrachialPlexusClean, ann: anatBrachialPlexusAnnotated },
  { name: 'anat-knee-joint', clean: anatKneeJointClean, ann: anatKneeJointAnnotated },
  { name: 'physio-action-potential', clean: physioActionPotentialClean, ann: physioActionPotentialAnnotated },
  { name: 'physio-cell-membrane', clean: physioMembraneClean, ann: physioMembraneAnnotated },
];

for (const asset of multiSpecialtyAssets) {
  fs.writeFileSync(path.join(outDir, `${asset.name}.svg`), asset.clean, 'utf-8');
  fs.writeFileSync(path.join(outDir, `${asset.name}-annotated.svg`), asset.ann, 'utf-8');
}

console.log(`Generated Anatomy & Physiology SVG assets in ${outDir}`);
