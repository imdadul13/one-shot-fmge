import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'public', 'assets', 'medical-images');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// -----------------------------------------------------------------------------------------
// 1. BIOCHEMISTRY: Lineweaver-Burk Double Reciprocal Plot (Competitive Inhibition)
// -----------------------------------------------------------------------------------------
const biochemLineweaverBurkClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
  <rect width="600" height="450" fill="#0f172a"/>
  <text x="300" y="36" font-family="'Outfit', sans-serif" font-size="14" font-weight="bold" fill="#f8fafc" text-anchor="middle">LINEWEAVER-BURK DOUBLE RECIPROCAL PLOT (1/V vs 1/[S])</text>
  
  <!-- Axes -->
  <!-- X-Axis (1/[S]) -->
  <line x1="60" y1="360" x2="540" y2="360" stroke="#94a3b8" stroke-width="2.5"/>
  <polygon points="545,360 535,355 535,365" fill="#94a3b8"/>
  <text x="500" y="390" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#94a3b8">1 / [S]</text>

  <!-- Y-Axis (1/V) -->
  <line x1="220" y1="410" x2="220" y2="60" stroke="#94a3b8" stroke-width="2.5"/>
  <polygon points="220,55 215,65 225,65" fill="#94a3b8"/>
  <text x="160" y="80" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#94a3b8">1 / V</text>

  <!-- Origin (0,0) -->
  <text x="205" y="380" font-family="'Courier New', monospace" font-size="11" fill="#64748b">0</text>

  <!-- Control Line (No Inhibitor) - Blue Line -->
  <!-- Crosses Y-axis at (220, 200) and X-axis at (100, 360) -->
  <line x1="80" y1="386" x2="480" y2="70" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
  <!-- Point on Y-axis (1/Vmax) -->
  <circle cx="220" cy="200" r="5" fill="#f8fafc" stroke="#38bdf8" stroke-width="2"/>
  <!-- Point on X-axis (-1/Km) -->
  <circle cx="100" cy="360" r="5" fill="#f8fafc" stroke="#38bdf8" stroke-width="2"/>

  <!-- Inhibitor Line (+ Inhibitor) - Coral Line -->
  <!-- Crosses SAME Y-axis at (220, 200) and X-axis shifted right to (150, 360) -->
  <line x1="130" y1="405" x2="440" y2="60" stroke="#f43f5e" stroke-width="3.5" stroke-linecap="round"/>
  <!-- Point on X-axis with Inhibitor (-1/Km') -->
  <circle cx="150" cy="360" r="5" fill="#f8fafc" stroke="#f43f5e" stroke-width="2"/>

  <!-- Legend -->
  <g transform="translate(380, 110)">
    <rect width="180" height="70" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
    <line x1="15" y1="25" x2="45" y2="25" stroke="#38bdf8" stroke-width="3"/>
    <text x="55" y="29" font-family="'Outfit', sans-serif" font-size="12" font-weight="bold" fill="#e2e8f0">Curve A (Control)</text>
    
    <line x1="15" y1="50" x2="45" y2="50" stroke="#f43f5e" stroke-width="3"/>
    <text x="55" y="54" font-family="'Outfit', sans-serif" font-size="12" font-weight="bold" fill="#e2e8f0">Curve B (+ Drug X)</text>
  </g>
</svg>`;

const biochemLineweaverBurkAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
  ${biochemLineweaverBurkClean.replace('</svg>', '')}
  <g font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#fef08a">
    <!-- Intersection Annotation -->
    <path d="M 230 195 L 300 170" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="3,2"/>
    <text x="305" y="170">Y-intercept unchanged = 1/Vmax constant (Vmax unchanged)</text>

    <!-- X-intercept shift Annotation -->
    <path d="M 125 365 L 125 410" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="3,2"/>
    <text x="50" y="425">X-intercept shifts right toward zero = Km increased (Affinity decreased)</text>
    
    <text x="300" y="320" fill="#34d399" font-size="13">Classic Hallmark: Competitive Inhibition (Overcome by high [S])</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 2. PHARMACOLOGY: Log Dose-Response Curve (Competitive Antagonist)
// -----------------------------------------------------------------------------------------
const pharmDoseResponseClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="100%" height="100%">
  <rect width="600" height="420" fill="#0f172a"/>
  <text x="300" y="35" font-family="'Outfit', sans-serif" font-size="14" font-weight="bold" fill="#f8fafc" text-anchor="middle">LOG DOSE-RESPONSE CURVE (% MAXIMAL EFFECT)</text>

  <!-- Axes -->
  <line x1="70" y1="340" x2="540" y2="340" stroke="#94a3b8" stroke-width="2.5"/>
  <polygon points="545,340 535,335 535,345" fill="#94a3b8"/>
  <text x="440" y="375" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#94a3b8">log [Agonist Dose]</text>

  <line x1="80" y1="350" x2="80" y2="60" stroke="#94a3b8" stroke-width="2.5"/>
  <polygon points="80,55 75,65 85,65" fill="#94a3b8"/>
  <text x="25" y="80" font-family="'Courier New', monospace" font-size="11" font-weight="bold" fill="#94a3b8">% Response</text>

  <!-- 100% and 50% grid lines -->
  <line x1="80" y1="100" x2="520" y2="100" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,4"/>
  <text x="35" y="105" font-family="'Courier New', monospace" font-size="11" fill="#64748b">100%</text>

  <line x1="80" y1="220" x2="520" y2="220" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,4"/>
  <text x="42" y="225" font-family="'Courier New', monospace" font-size="11" fill="#64748b">50%</text>

  <!-- Curve 1: Agonist Alone (Sigmoidal curve centered at x=200) -->
  <path d="M 90 335 C 150 335, 170 270, 200 220 C 230 170, 250 100, 310 100 L 510 100" fill="none" stroke="#38bdf8" stroke-width="3.5"/>
  <circle cx="200" cy="220" r="5" fill="#f8fafc" stroke="#38bdf8" stroke-width="2"/>

  <!-- Curve 2: Agonist + Competitive Antagonist (Parallel rightward shift centered at x=340) -->
  <path d="M 230 335 C 290 335, 310 270, 340 220 C 370 170, 390 100, 450 100 L 510 100" fill="none" stroke="#fbbf24" stroke-width="3.5"/>
  <circle cx="340" cy="220" r="5" fill="#f8fafc" stroke="#fbbf24" stroke-width="2"/>

  <!-- Legend -->
  <g transform="translate(110, 110)">
    <rect width="170" height="65" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
    <line x1="12" y1="22" x2="38" y2="22" stroke="#38bdf8" stroke-width="3"/>
    <text x="46" y="26" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#e2e8f0">Agonist alone</text>
    
    <line x1="12" y1="46" x2="38" y2="46" stroke="#fbbf24" stroke-width="3"/>
    <text x="46" y="50" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#e2e8f0">Agonist + Antagonist</text>
  </g>
</svg>`;

const pharmDoseResponseAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="100%" height="100%">
  ${pharmDoseResponseClean.replace('</svg>', '')}
  <g font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#fde047">
    <!-- Arrow showing parallel rightward shift -->
    <path d="M 215 220 L 325 220" stroke="#fde047" stroke-width="2.5" marker-end="url(#arrow)"/>
    <text x="210" y="200">Parallel Rightward Shift (Potency decreased, EC50 increased)</text>
    <text x="320" y="80" fill="#34d399">Emax remains 100% (Efficacy Unchanged)</text>
    <text x="120" y="395" fill="#a7f3d0" font-size="12">Mechanism: Reversible Competitive Antagonism</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 3. MICROBIOLOGY: Acid-Fast Stain (Mycobacterium tuberculosis - Red Beaded Bacilli)
// -----------------------------------------------------------------------------------------
const microAcidFastClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <!-- Blue background simulating methylene blue counterstain -->
  <rect width="500" height="400" fill="#0284c7" opacity="0.85"/>
  <circle cx="250" cy="200" r="185" fill="#0369a1" stroke="#0f172a" stroke-width="12"/>
  
  <text x="250" y="32" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#f8fafc" text-anchor="middle">ZIEHL-NEELSEN (ZN) ACID-FAST SPUTUM MICROSCOPY (1000x OIL IMMERSION)</text>

  <!-- Blue cellular background debris and inflammatory cells -->
  <ellipse cx="140" cy="180" rx="35" ry="25" fill="#075985" opacity="0.7"/>
  <ellipse cx="360" cy="240" rx="45" ry="30" fill="#075985" opacity="0.7"/>
  <ellipse cx="280" cy="120" rx="25" ry="20" fill="#075985" opacity="0.7"/>

  <!-- Bright Red/Magenta Slender Beaded Acid-Fast Bacilli -->
  <!-- Cluster 1 -->
  <g stroke="#f43f5e" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="7,3">
    <path d="M 220 180 Q 235 190 250 185"/>
    <path d="M 245 200 L 275 220"/>
    <path d="M 210 215 Q 230 225 245 240"/>
    <path d="M 270 170 L 295 185"/>
    <path d="M 180 150 Q 195 160 210 155"/>
    <path d="M 310 210 L 335 235"/>
    <path d="M 280 250 Q 300 260 320 255"/>
  </g>
</svg>`;

const microAcidFastAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  ${microAcidFastClean.replace('</svg>', '')}
  <g font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#fef08a">
    <circle cx="250" cy="200" r="60" fill="none" stroke="#f43f5e" stroke-width="2" stroke-dasharray="4,3"/>
    <text x="70" y="340">Bright Red / Magenta Beaded Slender Rods</text>
    <text x="70" y="360" fill="#bae6fd">Mycolic acid lipid wall resists 20% H2SO4 decolorization</text>
    <text x="70" y="380" fill="#fef08a">Diagnosis: Mycobacterium tuberculosis (Acid-Fast Bacilli / AFB Positive)</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 4. PATHOLOGY: Reed-Sternberg Cell (Classical Hodgkin Lymphoma)
// -----------------------------------------------------------------------------------------
const histoReedSternbergClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <!-- Lymph node background with mixed inflammatory infiltrate -->
  <rect width="500" height="400" fill="#312e81"/>
  <circle cx="250" cy="200" r="185" fill="#4338ca" stroke="#0f172a" stroke-width="12"/>
  <text x="250" y="32" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#f8fafc" text-anchor="middle">LYMPH NODE BIOPSY · H&amp;E SECTION (400x HIGH POWER FIELD)</text>

  <!-- Small background lymphocytes (blue dots) and eosinophils (pink dots) -->
  <g fill="#1e1b4b" opacity="0.6">
    <circle cx="120" cy="120" r="10"/><circle cx="145" cy="110" r="9"/><circle cx="110" cy="150" r="11"/>
    <circle cx="370" cy="130" r="10"/><circle cx="390" cy="160" r="9"/><circle cx="360" cy="180" r="10"/>
    <circle cx="130" cy="270" r="10"/><circle cx="160" cy="290" r="9"/><circle cx="120" cy="310" r="11"/>
    <circle cx="360" cy="280" r="10"/><circle cx="380" cy="300" r="9"/><circle cx="340" cy="320" r="10"/>
  </g>

  <!-- Giant Binucleated Reed-Sternberg Cell (Abundant pale amphophilic cytoplasm) -->
  <ellipse cx="250" cy="200" rx="90" ry="70" fill="#a855f7" opacity="0.5" stroke="#c084fc" stroke-width="2"/>

  <!-- Left Nucleus with prominent eosinophilic inclusion-like nucleolus & clear halo -->
  <ellipse cx="215" cy="195" rx="30" ry="36" fill="#1e1b4b" stroke="#7e22ce" stroke-width="2.5"/>
  <circle cx="215" cy="195" r="18" fill="#581c87"/>
  <circle cx="215" cy="195" r="9" fill="#f43f5e"/> <!-- Inclusion-like nucleolus -->

  <!-- Right Nucleus (Mirror image / Owl-Eye appearance) -->
  <ellipse cx="285" cy="195" rx="30" ry="36" fill="#1e1b4b" stroke="#7e22ce" stroke-width="2.5"/>
  <circle cx="285" cy="195" r="18" fill="#581c87"/>
  <circle cx="285" cy="195" r="9" fill="#f43f5e"/> <!-- Inclusion-like nucleolus -->
</svg>`;

const histoReedSternbergAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  ${histoReedSternbergClean.replace('</svg>', '')}
  <g font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#fef08a">
    <text x="140" y="115">Mirror-image Bilobed Nuclei ("Owl-Eye" appearance)</text>
    <text x="110" y="295">Large cherry-red eosinophilic inclusion nucleoli</text>
    <text x="80" y="375" fill="#34d399">Classical Hodgkin Lymphoma · Reed-Sternberg Cells (CD15+, CD30+, CD45-)</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 5. OPHTHALMOLOGY: Central Retinal Vein Occlusion (Blood & Thunder Fundus)
// -----------------------------------------------------------------------------------------
const fundoscopyCrvoClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <rect width="500" height="400" fill="#0f172a"/>
  <!-- Fundus Circular Aperture -->
  <circle cx="250" cy="200" r="180" fill="#991b1b" stroke="#1e293b" stroke-width="10"/>
  <text x="250" y="30" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#f8fafc" text-anchor="middle">FUNDOSCOPY · POSTERIOR POLE (CENTRAL RETINA)</text>

  <!-- Swollen Hyperemic Optic Disc with blurred margins -->
  <circle cx="170" cy="200" r="30" fill="#f87171" opacity="0.9"/>

  <!-- Extremely Engorged, Dilated, Tortuous Retinal Veins radiating in all 4 quadrants -->
  <path d="M 170 200 Q 150 140 120 80" stroke="#7f1d1d" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M 170 200 Q 230 130 330 90" stroke="#7f1d1d" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M 170 200 Q 160 270 110 330" stroke="#7f1d1d" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M 170 200 Q 250 260 350 310" stroke="#7f1d1d" stroke-width="9" fill="none" stroke-linecap="round"/>

  <!-- Widespread Flame-shaped Retinal Hemorrhages (Blood and Thunder) -->
  <g fill="#450a0a">
    <ellipse cx="230" cy="140" rx="30" ry="12" transform="rotate(-20 230 140)"/>
    <ellipse cx="290" cy="160" rx="40" ry="15" transform="rotate(15 290 160)"/>
    <ellipse cx="260" cy="230" rx="35" ry="14" transform="rotate(30 260 230)"/>
    <ellipse cx="320" cy="220" rx="45" ry="18" transform="rotate(-10 320 220)"/>
    <ellipse cx="140" cy="260" rx="25" ry="10" transform="rotate(45 140 260)"/>
    <ellipse cx="200" cy="290" rx="35" ry="12" transform="rotate(-30 200 290)"/>
  </g>

  <!-- Soft Exudates (Cotton Wool Spots - White Patches) -->
  <g fill="#f8fafc" opacity="0.85">
    <ellipse cx="210" cy="170" rx="10" ry="7"/>
    <ellipse cx="280" cy="190" rx="12" ry="8"/>
    <ellipse cx="190" cy="240" rx="9" ry="6"/>
  </g>
</svg>`;

const fundoscopyCrvoAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  ${fundoscopyCrvoClean.replace('</svg>', '')}
  <g font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#fef08a">
    <text x="130" y="70">Widespread Flame Hemorrhages in all 4 quadrants</text>
    <text x="120" y="360">Engorged tortuous veins + Papilledema ("Blood &amp; Thunder Fundus")</text>
    <text x="140" y="380" fill="#34d399">Diagnosis: Central Retinal Vein Occlusion (CRVO)</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 6. DERMATOLOGY: Target / Iris Lesion (Erythema Multiforme)
// -----------------------------------------------------------------------------------------
const dermTargetLesionClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <rect width="500" height="400" fill="#0f172a"/>
  <!-- Skin base (Acral extremity skin surface) -->
  <rect x="50" y="50" width="400" height="300" rx="20" fill="#fbcfe8"/>
  <text x="250" y="36" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#f8fafc" text-anchor="middle">CLINICAL DERMATOLOGY · PALMAR ACRAL ERUPTION</text>

  <!-- Central Target Lesion (Concentric 3 Zones) -->
  <!-- Outer Erythematous Ring (Zone 1) -->
  <circle cx="250" cy="200" r="95" fill="#f43f5e" opacity="0.85"/>
  <!-- Middle Pale Edematous Ring (Zone 2) -->
  <circle cx="250" cy="200" r="65" fill="#fed7aa" opacity="0.95"/>
  <!-- Inner Dusky Violaceous / Bullous Center (Zone 3) -->
  <circle cx="250" cy="200" r="35" fill="#881337"/>

  <!-- Satellite Target Lesions -->
  <g transform="translate(-110, -70)">
    <circle cx="200" cy="180" r="35" fill="#f43f5e" opacity="0.85"/>
    <circle cx="200" cy="180" r="22" fill="#fed7aa"/>
    <circle cx="200" cy="180" r="10" fill="#881337"/>
  </g>
  <g transform="translate(140, 60)">
    <circle cx="250" cy="200" r="40" fill="#f43f5e" opacity="0.85"/>
    <circle cx="250" cy="200" r="26" fill="#fed7aa"/>
    <circle cx="250" cy="200" r="12" fill="#881337"/>
  </g>
</svg>`;

const dermTargetLesionAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  ${dermTargetLesionClean.replace('</svg>', '')}
  <g font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#fef08a">
    <text x="60" y="110">1. Outer erythematous macular halo</text>
    <text x="60" y="130">2. Middle pale edematous ring</text>
    <text x="60" y="150">3. Central dusky / necrotic dark center ("Target / Iris" lesion)</text>
    <text x="80" y="375" fill="#34d399">Diagnosis: Erythema Multiforme (Most commonly triggered by HSV infection)</text>
  </g>
</svg>`;

// Write all generated specialty assets
const assetsToWrite = [
  { name: 'biochem-lineweaver-burk', clean: biochemLineweaverBurkClean, ann: biochemLineweaverBurkAnnotated },
  { name: 'pharm-dose-response-curve', clean: pharmDoseResponseClean, ann: pharmDoseResponseAnnotated },
  { name: 'micro-acid-fast-tb', clean: microAcidFastClean, ann: microAcidFastAnnotated },
  { name: 'histo-reed-sternberg', clean: histoReedSternbergClean, ann: histoReedSternbergAnnotated },
  { name: 'fundoscopy-crvo', clean: fundoscopyCrvoClean, ann: fundoscopyCrvoAnnotated },
  { name: 'derm-target-lesion', clean: dermTargetLesionClean, ann: dermTargetLesionAnnotated },
];

for (const asset of assetsToWrite) {
  fs.writeFileSync(path.join(outDir, `${asset.name}.svg`), asset.clean, 'utf-8');
  fs.writeFileSync(path.join(outDir, `${asset.name}-annotated.svg`), asset.ann, 'utf-8');
}

console.log(`Generated all FMGE specialty assets successfully.`);
