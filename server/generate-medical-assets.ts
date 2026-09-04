import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'public', 'assets', 'medical-images');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// -----------------------------------------------------------------------------------------
// 1. CLEAN EXAM ECG: Inferior Wall STEMI
// -----------------------------------------------------------------------------------------
const ecgInferiorStemiClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 460" width="100%" height="100%">
  <defs>
    <pattern id="smallGridClean" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#fecdd3" stroke-width="0.5"/>
    </pattern>
    <pattern id="gridClean" width="50" height="50" patternUnits="userSpaceOnUse">
      <rect width="50" height="50" fill="url(#smallGridClean)"/>
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#fda4af" stroke-width="1.2"/>
    </pattern>
  </defs>
  <rect width="920" height="460" fill="#fff1f2"/>
  <rect width="920" height="460" fill="url(#gridClean)"/>
  <text x="25" y="26" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#64748b">12-LEAD ELECTROCARDIOGRAM · 25 mm/sec · 10 mm/mV · 0.05-150 Hz</text>
  <path d="M 25 65 L 35 65 L 35 35 L 50 35 L 50 65 L 60 65" fill="none" stroke="#1e293b" stroke-width="1.8"/>

  <!-- LEAD I -->
  <g transform="translate(30, 50)">
    <text x="0" y="20" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#1e293b">I</text>
    <path d="M 0 55 Q 15 55 25 50 Q 35 55 45 55 L 50 58 L 55 15 L 60 65 L 65 55 L 80 63 Q 95 67 110 60 L 130 55 Q 145 55 155 50 Q 165 55 175 55 L 180 58 L 185 15 L 190 65 L 195 55 L 210 63 Q 225 67 240 60 L 260 55" fill="none" stroke="#0f172a" stroke-width="2.2"/>
  </g>

  <!-- LEAD II -->
  <g transform="translate(330, 50)">
    <text x="0" y="20" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#1e293b">II</text>
    <path d="M 0 55 Q 15 55 25 48 Q 35 55 45 55 L 50 59 L 55 10 L 60 63 L 65 33 Q 85 31 100 40 L 120 55 Q 135 55 145 48 Q 155 55 165 55 L 170 59 L 175 10 L 180 63 L 185 33 Q 205 31 220 40 L 240 55" fill="none" stroke="#0f172a" stroke-width="2.2"/>
  </g>

  <!-- LEAD III -->
  <g transform="translate(630, 50)">
    <text x="0" y="20" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#1e293b">III</text>
    <path d="M 0 55 Q 15 55 25 47 Q 35 55 45 55 L 50 59 L 55 12 L 60 63 L 65 30 Q 85 28 100 38 L 120 55 Q 135 55 145 47 Q 155 55 165 55 L 170 59 L 175 12 L 180 63 L 185 30 Q 205 28 220 38 L 240 55" fill="none" stroke="#0f172a" stroke-width="2.2"/>
  </g>

  <!-- LEAD aVR -->
  <g transform="translate(30, 160)">
    <text x="0" y="20" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#1e293b">aVR</text>
    <path d="M 0 55 Q 15 55 25 60 Q 35 55 45 55 L 50 52 L 55 90 L 60 48 L 65 55 L 80 48 Q 95 45 110 52 L 130 55 Q 145 55 155 60 Q 165 55 175 55 L 180 52 L 185 90 L 190 48 L 195 55 L 210 48 Q 225 45 240 52 L 260 55" fill="none" stroke="#0f172a" stroke-width="2.2"/>
  </g>

  <!-- LEAD aVL -->
  <g transform="translate(330, 160)">
    <text x="0" y="20" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#1e293b">aVL</text>
    <path d="M 0 55 Q 15 55 25 50 Q 35 55 45 55 L 50 58 L 55 20 L 60 65 L 65 55 L 80 67 Q 95 71 110 63 L 130 55 Q 145 55 155 50 Q 165 55 175 55 L 180 58 L 185 20 L 190 65 L 195 55 L 210 67 Q 225 71 240 63 L 260 55" fill="none" stroke="#0f172a" stroke-width="2.2"/>
  </g>

  <!-- LEAD aVF -->
  <g transform="translate(630, 160)">
    <text x="0" y="20" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#1e293b">aVF</text>
    <path d="M 0 55 Q 15 55 25 48 Q 35 55 45 55 L 50 59 L 55 14 L 60 63 L 65 34 Q 85 32 100 42 L 120 55 Q 135 55 145 48 Q 155 55 165 55 L 170 59 L 175 14 L 180 63 L 185 34 Q 205 32 220 42 L 240 55" fill="none" stroke="#0f172a" stroke-width="2.2"/>
  </g>

  <!-- LEAD V1 - V3 -->
  <g transform="translate(30, 270)">
    <text x="0" y="20" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#1e293b">V1</text>
    <path d="M 0 55 Q 15 55 25 52 Q 35 55 45 55 L 50 57 L 55 35 L 60 85 L 65 55 L 80 55 Q 95 55 110 55 L 130 55 Q 145 55 155 52 Q 165 55 175 55 L 180 57 L 185 35 L 190 85 L 195 55 L 210 55 Q 225 55 240 55 L 260 55" fill="none" stroke="#0f172a" stroke-width="2.2"/>
  </g>

  <!-- LEAD V4 - V6 -->
  <g transform="translate(330, 270)">
    <text x="0" y="20" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#1e293b">V4</text>
    <path d="M 0 55 Q 15 55 25 50 Q 35 55 45 55 L 50 58 L 55 10 L 60 65 L 65 55 L 80 48 Q 95 44 110 52 L 130 55 Q 145 55 155 50 Q 165 55 175 55 L 180 58 L 185 10 L 190 65 L 195 55 L 210 48 Q 225 44 240 52 L 260 55" fill="none" stroke="#0f172a" stroke-width="2.2"/>
  </g>

  <!-- Lead V4R -->
  <g transform="translate(630, 270)">
    <text x="0" y="20" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#1e293b">V4R</text>
    <path d="M 0 55 Q 15 55 25 49 Q 35 55 45 55 L 50 59 L 55 16 L 60 63 L 65 37 Q 85 35 100 45 L 120 55 Q 135 55 145 49 Q 155 55 165 55 L 170 59 L 175 16 L 180 63 L 185 37 Q 205 35 220 45 L 240 55" fill="none" stroke="#0f172a" stroke-width="2.2"/>
  </g>

  <!-- Lead II Rhythm Strip -->
  <g transform="translate(30, 380)">
    <text x="0" y="15" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#1e293b">II (Rhythm)</text>
    <path d="M 0 45 Q 15 45 25 38 Q 35 45 45 45 L 50 49 L 55 0 L 60 53 L 65 23 Q 85 21 100 30 L 120 45 L 150 45 Q 165 45 175 38 Q 185 45 195 45 L 200 49 L 205 0 L 210 53 L 215 23 Q 235 21 250 30 L 270 45 L 300 45 Q 315 45 325 38 Q 335 45 345 45 L 350 49 L 355 0 L 360 53 L 365 23 Q 385 21 400 30 L 420 45 L 450 45 Q 465 45 475 38 Q 485 45 495 45 L 500 49 L 505 0 L 510 53 L 515 23 Q 535 21 550 30 L 570 45 L 600 45 Q 615 45 625 38 Q 635 45 645 45 L 650 49 L 655 0 L 660 53 L 665 23 Q 685 21 700 30 L 720 45 L 750 45 Q 765 45 775 38 Q 785 45 795 45 L 800 49 L 805 0 L 810 53 L 815 23 Q 835 21 850 30 L 860 45" fill="none" stroke="#0f172a" stroke-width="2"/>
  </g>
</svg>`;

const ecgInferiorStemiAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 460" width="100%" height="100%">
  ${ecgInferiorStemiClean.replace('</svg>', '')}
  <g>
    <circle cx="415" cy="83" r="14" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="3,2"/>
    <text x="435" y="75" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#dc2626">ST Elevation (+3.5 mm)</text>
    <circle cx="715" cy="80" r="14" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="3,2"/>
    <text x="735" y="75" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#dc2626">ST Elevation (Lead III &gt; II)</text>
    <circle cx="715" cy="194" r="14" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="3,2"/>
    <text x="735" y="190" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#dc2626">ST Elevation</text>
    <circle cx="415" cy="223" r="14" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-dasharray="3,2"/>
    <text x="435" y="235" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#2563eb">Reciprocal ST Depression</text>
    <circle cx="715" cy="307" r="14" fill="none" stroke="#d97706" stroke-width="2.5" stroke-dasharray="3,2"/>
    <text x="735" y="305" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#d97706">ST Elevation in V4R (RV Infarct)</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 2. CLEAN EXAM ECG: Complete AV Block
// -----------------------------------------------------------------------------------------
const ecgCompleteHeartBlockClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 400" width="100%" height="100%">
  <defs>
    <pattern id="ecgCleanSmall" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#fecdd3" stroke-width="0.5"/>
    </pattern>
    <pattern id="ecgCleanGrid" width="50" height="50" patternUnits="userSpaceOnUse">
      <rect width="50" height="50" fill="url(#ecgCleanSmall)"/>
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#fda4af" stroke-width="1.2"/>
    </pattern>
  </defs>
  <rect width="920" height="400" fill="#fff1f2"/>
  <rect width="920" height="400" fill="url(#ecgCleanGrid)"/>
  <text x="25" y="30" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#64748b">CONTINUOUS LEAD II RHYTHM STRIP · 25 mm/sec · 10 mm/mV</text>

  <path d="
    M 25 180 
    L 85 180 Q 98 162 110 180 L 150 180
    L 170 180 L 175 185 L 185 110 L 195 230 L 205 180 L 210 180 Q 218 162 226 180 L 245 180 Q 260 198 280 180 L 320 180
    L 330 180 Q 338 162 346 180 L 440 180 Q 458 162 470 180 L 490 180
    L 505 180 L 510 185 L 520 110 L 530 230 L 540 180 L 565 180 Q 578 162 588 180 L 600 180 Q 615 198 635 180 L 685 180
    Q 698 162 708 180 L 800 180
    L 810 180 Q 818 162 826 180 L 840 180 L 845 185 L 855 110 L 865 230 L 875 180
  " fill="none" stroke="#0f172a" stroke-width="2.6"/>
</svg>`;

const ecgCompleteHeartBlockAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 400" width="100%" height="100%">
  ${ecgCompleteHeartBlockClean.replace('</svg>', '')}
  <g fill="#0284c7" font-family="sans-serif" font-size="11" font-weight="bold">
    <text x="95" y="140">P</text>
    <path d="M 98 145 L 98 165" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2,2"/>
    <text x="215" y="140">P</text>
    <path d="M 218 145 L 218 165" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2,2"/>
    <text x="335" y="140">P</text>
    <path d="M 338 145 L 338 165" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2,2"/>
    <text x="455" y="140">P</text>
    <path d="M 458 145 L 458 165" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2,2"/>
    <text x="575" y="140">P</text>
    <path d="M 578 145 L 578 165" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2,2"/>
    <text x="695" y="140">P</text>
    <path d="M 698 145 L 698 165" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2,2"/>
    <text x="815" y="140">P</text>
    <path d="M 818 145 L 818 165" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2,2"/>
  </g>
  <rect x="30" y="270" width="860" height="90" rx="12" fill="#ffffff" stroke="#cbd5e1" opacity="0.95"/>
  <text x="50" y="300" font-family="'Outfit', sans-serif" font-size="13" font-weight="bold" fill="#0f172a">AV DISSOCIATION MARKERS:</text>
  <text x="50" y="325" font-family="sans-serif" font-size="12" fill="#334155">Regular P-P intervals (blue markers, ~78/min) march through independent of the slow escape QRS rate (~34/min).</text>
  <text x="50" y="345" font-family="sans-serif" font-size="12" font-weight="bold" fill="#be123c">Treatment of choice: Permanent Pacemaker Implantation (PPI).</text>
</svg>`;

// -----------------------------------------------------------------------------------------
// 3. CLEAN EXAM ECG: WPW Pre-excitation (Delta Wave)
// -----------------------------------------------------------------------------------------
const ecgWpwClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 400" width="100%" height="100%">
  <defs>
    <pattern id="wpwSmall" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#fecdd3" stroke-width="0.5"/>
    </pattern>
    <pattern id="wpwGrid" width="50" height="50" patternUnits="userSpaceOnUse">
      <rect width="50" height="50" fill="url(#wpwSmall)"/>
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#fda4af" stroke-width="1.2"/>
    </pattern>
  </defs>
  <rect width="920" height="400" fill="#fff1f2"/>
  <rect width="920" height="400" fill="url(#wpwGrid)"/>
  <text x="25" y="30" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#64748b">LEAD V2 TRACING · 25 mm/sec · 10 mm/mV</text>

  <!-- WPW Waveform with short PR (<120ms) and slurred upstroke delta wave -->
  <path d="
    M 30 200 L 90 200 Q 105 180 120 200 L 132 200 
    L 155 155 L 165 40 L 175 240 L 185 200 L 205 220 Q 230 230 255 200 L 330 200
    Q 345 180 360 200 L 372 200
    L 395 155 L 405 40 L 415 240 L 425 200 L 445 220 Q 470 230 495 200 L 570 200
    Q 585 180 600 200 L 612 200
    L 635 155 L 645 40 L 655 240 L 665 200 L 685 220 Q 710 230 735 200 L 880 200
  " fill="none" stroke="#0f172a" stroke-width="2.6"/>
</svg>`;

const ecgWpwAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 400" width="100%" height="100%">
  ${ecgWpwClean.replace('</svg>', '')}
  <g>
    <circle cx="145" cy="177" r="16" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="3,2"/>
    <text x="140" y="145" font-family="'Outfit', sans-serif" font-size="12" font-weight="bold" fill="#ef4444">Delta Wave (Slurred QRS Upstroke)</text>
    <text x="65" y="235" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#2563eb">Short PR (&lt; 120 ms)</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 4. CLEAN EXAM RADIOGRAPH: Tension Pneumothorax
// -----------------------------------------------------------------------------------------
const xrayPneumothoraxClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <rect width="600" height="600" fill="#020617"/>
  <path d="M 120 100 Q 300 60 480 100 Q 560 300 520 540 Q 300 580 80 540 Q 40 300 120 100 Z" fill="#0f172a" stroke="#334155" stroke-width="3"/>
  <path d="M 330 140 Q 460 160 470 480 Q 400 500 350 490 Q 330 350 330 140 Z" fill="#1e293b"/>
  <path d="M 360 250 Q 420 230 450 240 M 370 300 Q 430 320 460 340 M 360 350 Q 420 380 440 430" stroke="#64748b" stroke-width="2" fill="none" opacity="0.6"/>
  <path d="M 130 140 Q 270 140 280 490 Q 180 530 120 490 Q 90 300 130 140 Z" fill="#000000"/>
  <path d="M 270 240 Q 240 320 260 420 Q 280 340 270 240 Z" fill="#334155"/>
  <path d="M 280 90 Q 320 150 350 250 Q 370 360 360 490 L 310 490 Q 310 320 270 160 Z" fill="#475569" opacity="0.8"/>
  <path d="M 120 490 Q 200 540 280 500" stroke="#334155" stroke-width="3" fill="none"/>
  <text x="35" y="45" font-family="'Courier New', monospace" font-size="16" font-weight="bold" fill="#64748b">R</text>
</svg>`;

const xrayPneumothoraxAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  ${xrayPneumothoraxClean.replace('</svg>', '')}
  <g>
    <path d="M 265 320 L 225 320" stroke="#38bdf8" stroke-width="2"/>
    <text x="140" y="325" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#38bdf8">Visceral Pleural Line</text>
    <path d="M 290 80 Q 320 120 335 150" stroke="#f59e0b" stroke-width="4" fill="none"/>
    <text x="345" y="110" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#f59e0b">Trachea Shifted Away →</text>
    <text x="50" y="240" font-family="'Outfit', sans-serif" font-size="12" font-weight="bold" fill="#ef4444">Jet-Black Hyperlucency</text>
    <text x="50" y="260" font-family="sans-serif" font-size="10" fill="#94a3b8">(Absent lung markings)</text>
    <text x="130" y="560" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#ef4444">Depressed Hemidiaphragm</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 5. CLEAN EXAM RADIOGRAPH: Pneumoperitoneum (Air under diaphragm)
// -----------------------------------------------------------------------------------------
const xrayPneumoperitoneumClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="100%" height="100%">
  <rect width="600" height="500" fill="#090d16"/>
  <!-- Right Hemidiaphragm Dome -->
  <path d="M 60 320 Q 200 180 320 320" stroke="#94a3b8" stroke-width="4" fill="none"/>
  <!-- Free Gas Crescent -->
  <path d="M 80 315 Q 200 200 300 315 Q 200 230 80 315 Z" fill="#000000" stroke="#475569" stroke-width="1.5"/>
  <!-- Liver Shadow below air crescent -->
  <path d="M 70 330 Q 200 240 310 330 L 310 480 L 60 480 Z" fill="#1e293b" opacity="0.9"/>
  <!-- Left Diaphragm and Gastric Bubble -->
  <path d="M 330 330 Q 440 210 540 340" stroke="#94a3b8" stroke-width="4" fill="none"/>
  <ellipse cx="440" cy="360" rx="60" ry="30" fill="#000000" stroke="#475569"/>
  <text x="35" y="45" font-family="'Courier New', monospace" font-size="16" font-weight="bold" fill="#64748b">ERECT CHEST X-RAY · R</text>
</svg>`;

const xrayPneumoperitoneumAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="100%" height="100%">
  ${xrayPneumoperitoneumClean.replace('</svg>', '')}
  <g>
    <path d="M 200 170 L 200 220" stroke="#f59e0b" stroke-width="2.5"/>
    <text x="120" y="160" font-family="'Outfit', sans-serif" font-size="12" font-weight="bold" fill="#f59e0b">Free Crescent of Air Under Right Diaphragm</text>
    <text x="120" y="420" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#38bdf8">Liver Parenchyma (Homogeneous Soft Tissue)</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 6. CLEAN EXAM ELECTRON MICROGRAPH: Minimal Change Disease
// -----------------------------------------------------------------------------------------
const histoMcdEmClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
  <rect width="600" height="450" fill="#0f172a"/>
  <rect x="20" y="20" width="560" height="410" rx="12" fill="#1e293b"/>
  <ellipse cx="180" cy="320" rx="120" ry="60" fill="#334155" stroke="#475569" stroke-width="3"/>
  <path d="M 30 180 Q 200 160 380 190 Q 480 200 570 170" fill="none" stroke="#64748b" stroke-width="24"/>
  <path d="M 30 160 Q 200 140 380 170 Q 480 180 570 150 L 570 60 L 30 60 Z" fill="#475569" opacity="0.9"/>
  <path d="M 30 160 Q 200 140 380 170 Q 480 180 570 150" fill="none" stroke="#64748b" stroke-width="4"/>
  <rect x="480" y="400" width="70" height="4" fill="#ffffff"/>
  <text x="495" y="395" font-family="'Courier New', monospace" font-size="11" fill="#ffffff">1.0 µm</text>
</svg>`;

const histoMcdEmAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
  ${histoMcdEmClean.replace('</svg>', '')}
  <g>
    <path d="M 30 160 Q 200 140 380 170 Q 480 180 570 150" fill="none" stroke="#38bdf8" stroke-width="6"/>
    <text x="50" y="90" font-family="'Outfit', sans-serif" font-size="13" font-weight="bold" fill="#38bdf8">Diffuse Podocyte Foot Process Effacement</text>
    <text x="50" y="115" font-family="sans-serif" font-size="11" fill="#e2e8f0">Loss of individual slit diaphragms along the GBM</text>
    <text x="400" y="160" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#cbd5e1">GBM (No dense deposits)</text>
    <text x="120" y="325" font-family="'Outfit', sans-serif" font-size="12" font-weight="bold" fill="#94a3b8">Capillary Lumen</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 7. CLEAN EXAM OPHTHALMOLOGY: Central Retinal Artery Occlusion (CRAO) Fundoscopy
// -----------------------------------------------------------------------------------------
const fundoscopyCraoClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <radialGradient id="retinaPale" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="70%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </radialGradient>
  </defs>
  <rect width="500" height="500" fill="#020617"/>
  <!-- Retinal Field (Milky Pale Retina) -->
  <circle cx="250" cy="250" r="230" fill="url(#retinaPale)"/>
  
  <!-- Pale Optic Disc -->
  <ellipse cx="140" cy="240" rx="36" ry="46" fill="#ffedd5" stroke="#fed7aa" stroke-width="2"/>
  
  <!-- Attenuated Retinal Vessels (Box-carring/Cattle-trucking) -->
  <path d="M 140 240 Q 180 180 250 140 Q 320 110 420 100" stroke="#be123c" stroke-width="2" fill="none"/>
  <path d="M 140 240 Q 190 310 280 340 Q 360 360 440 370" stroke="#be123c" stroke-width="1.8" fill="none"/>
  <path d="M 140 240 Q 90 170 50 140 M 140 240 Q 90 320 50 360" stroke="#be123c" stroke-width="1.5" fill="none"/>

  <!-- Cherry Red Spot at the Fovea (Thin choroidal reflex through thin fovea) -->
  <circle cx="310" cy="250" r="14" fill="#991b1b"/>
  <circle cx="310" cy="250" r="6" fill="#7f1d1d"/>
</svg>`;

const fundoscopyCraoAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  ${fundoscopyCraoClean.replace('</svg>', '')}
  <g>
    <circle cx="310" cy="250" r="24" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="3,2"/>
    <text x="230" y="215" font-family="'Outfit', sans-serif" font-size="12" font-weight="bold" fill="#ffffff">Cherry-Red Spot at Fovea</text>
    <text x="40" y="110" font-family="'Outfit', sans-serif" font-size="12" font-weight="bold" fill="#0f172a">Milky Pale Ischemic Retina</text>
    <text x="50" y="300" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#0f172a">Pale Optic Disc &amp; Attenuated Arterioles</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 8. CLEAN EXAM DERMATOLOGY: Pemphigus Vulgaris (Flaccid Bulla & Tombstoning)
// -----------------------------------------------------------------------------------------
const dermPemphigusClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <rect width="500" height="400" fill="#0f172a"/>
  <!-- Stratum Basale Row (Tombstone pattern) -->
  <g fill="#f43f5e" stroke="#881337" stroke-width="1">
    <rect x="50" y="280" width="20" height="35" rx="3"/>
    <rect x="75" y="280" width="20" height="35" rx="3"/>
    <rect x="100" y="280" width="20" height="35" rx="3"/>
    <rect x="125" y="280" width="20" height="35" rx="3"/>
    <rect x="150" y="280" width="20" height="35" rx="3"/>
    <rect x="175" y="280" width="20" height="35" rx="3"/>
    <rect x="200" y="280" width="20" height="35" rx="3"/>
    <rect x="225" y="280" width="20" height="35" rx="3"/>
    <rect x="250" y="280" width="20" height="35" rx="3"/>
    <rect x="275" y="280" width="20" height="35" rx="3"/>
    <rect x="300" y="280" width="20" height="35" rx="3"/>
    <rect x="325" y="280" width="20" height="35" rx="3"/>
    <rect x="350" y="280" width="20" height="35" rx="3"/>
    <rect x="375" y="280" width="20" height="35" rx="3"/>
    <rect x="400" y="280" width="20" height="35" rx="3"/>
    <rect x="425" y="280" width="20" height="35" rx="3"/>
  </g>
  <!-- Dermis Basement Membrane Line -->
  <line x1="40" y1="315" x2="460" y2="315" stroke="#fda4af" stroke-width="4"/>

  <!-- Intra-epidermal Suprabasal Acantholytic Split / Bulla Cavity -->
  <path d="M 50 160 Q 250 80 440 160 L 440 260 Q 250 260 50 260 Z" fill="#ffe4e6" opacity="0.8"/>
  
  <!-- Floating Acantholytic Tzanck Cells -->
  <circle cx="150" cy="200" r="16" fill="#e11d48" stroke="#9f1239" stroke-width="2"/>
  <circle cx="150" cy="200" r="8" fill="#4c0519"/>
  <circle cx="280" cy="180" r="18" fill="#e11d48" stroke="#9f1239" stroke-width="2"/>
  <circle cx="280" cy="180" r="9" fill="#4c0519"/>
  <circle cx="360" cy="220" r="14" fill="#e11d48" stroke="#9f1239" stroke-width="2"/>
  <circle cx="360" cy="220" r="7" fill="#4c0519"/>

  <!-- Upper Epidermis Roof -->
  <rect x="50" y="120" width="395" height="40" rx="4" fill="#fda4af"/>
</svg>`;

const dermPemphigusAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  ${dermPemphigusClean.replace('</svg>', '')}
  <g>
    <text x="60" y="60" font-family="'Outfit', sans-serif" font-size="12" font-weight="bold" fill="#38bdf8">Suprabasal Intraepidermal Acantholytic Split</text>
    <text x="210" y="145" font-family="'Outfit', sans-serif" font-size="11" font-weight="bold" fill="#f43f5e">Rounded Acantholytic (Tzanck) Cells</text>
    <text x="60" y="360" font-family="'Outfit', sans-serif" font-size="12" font-weight="bold" fill="#fb7185">"Row of Tombstones" Appearance along Basal Layer</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 9. CLEAN EXAM MICROBIOLOGY: Gram Stain (Lancet Diplococci - Streptococcus pneumoniae)
// -----------------------------------------------------------------------------------------
const microStrepClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <rect width="500" height="400" fill="#0f172a"/>
  <!-- Microscopic Field -->
  <circle cx="250" cy="200" r="180" fill="#ffe4e6"/>
  <!-- Neutrophils background (Pink cytoplasm, lobed nucleus) -->
  <ellipse cx="160" cy="180" rx="45" ry="35" fill="#fbcfe8" opacity="0.6"/>
  <ellipse cx="145" cy="175" rx="10" ry="12" fill="#701a75"/>
  <ellipse cx="165" cy="185" rx="11" ry="9" fill="#701a75"/>
  
  <!-- Gram-Positive Violet Lancet Pairs (Strep pneumoniae) -->
  <g fill="#4c1d95" stroke="#312e81" stroke-width="1.2">
    <!-- Pair 1 -->
    <path d="M 230 140 Q 234 130 238 140 Q 238 150 230 150 Z"/>
    <path d="M 242 140 Q 246 130 250 140 Q 250 150 242 150 Z"/>

    <!-- Pair 2 -->
    <path d="M 280 220 Q 284 210 288 220 Q 288 230 280 230 Z"/>
    <path d="M 292 220 Q 296 210 300 220 Q 300 230 292 230 Z"/>

    <!-- Pair 3 -->
    <path d="M 180 260 Q 184 250 188 260 Q 188 270 180 270 Z"/>
    <path d="M 192 260 Q 196 250 200 260 Q 200 270 192 270 Z"/>

    <!-- Short Chain -->
    <circle cx="330" cy="160" r="5"/>
    <circle cx="340" cy="165" r="5"/>
    <circle cx="350" cy="170" r="5"/>
    <circle cx="360" cy="175" r="5"/>
  </g>
</svg>`;

const microStrepAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  ${microStrepClean.replace('</svg>', '')}
  <g>
    <circle cx="240" cy="142" r="22" fill="none" stroke="#2563eb" stroke-width="2"/>
    <text x="70" y="70" font-family="'Outfit', sans-serif" font-size="12" font-weight="bold" fill="#38bdf8">Gram-Positive Lancet-Shaped Diplococci in Pairs</text>
    <text x="70" y="90" font-family="sans-serif" font-size="11" fill="#cbd5e1">Bile soluble, Optochin sensitive (Streptococcus pneumoniae)</text>
  </g>
</svg>`;

// -----------------------------------------------------------------------------------------
// 10. CLEAN EXAM SURGERY: Babcock Forceps (Atraumatic Visceral Grasping)
// -----------------------------------------------------------------------------------------
const surgeryBabcockClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <rect width="500" height="400" fill="#0f172a"/>
  <!-- Metallic Steel Finish -->
  <g stroke="#94a3b8" stroke-width="8" stroke-linecap="round" fill="none">
    <!-- Handles and Ratchet -->
    <path d="M 100 340 L 220 220 M 100 220 L 220 340"/>
    <!-- Shaft -->
    <path d="M 220 280 L 370 280"/>
  </g>
  <!-- Finger Rings -->
  <circle cx="90" cy="350" r="24" stroke="#cbd5e1" stroke-width="6" fill="none"/>
  <circle cx="90" cy="210" r="24" stroke="#cbd5e1" stroke-width="6" fill="none"/>
  <!-- Distinctive Babcock Fenestrated Triangular Jaw -->
  <path d="M 370 270 Q 420 240 450 270 Q 420 280 370 275" fill="none" stroke="#cbd5e1" stroke-width="6"/>
  <path d="M 370 290 Q 420 320 450 290 Q 420 280 370 285" fill="none" stroke="#cbd5e1" stroke-width="6"/>
  <!-- Fenestrated Opening inside jaws -->
  <ellipse cx="420" cy="280" rx="18" ry="12" fill="#0f172a" stroke="#cbd5e1" stroke-width="3"/>
</svg>`;

const surgeryBabcockAnnotated = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  ${surgeryBabcockClean.replace('</svg>', '')}
  <g>
    <circle cx="420" cy="280" r="32" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="3,2"/>
    <text x="240" y="90" font-family="'Outfit', sans-serif" font-size="13" font-weight="bold" fill="#38bdf8">Babcock Forceps: Fenestrated Loop Jaw</text>
    <text x="240" y="115" font-family="sans-serif" font-size="11" fill="#e2e8f0">Atraumatic grasping of tubular viscus (Appendix, Fallopian Tube, Ureter)</text>
  </g>
</svg>`;

// Write all Clean Exam SVGs & Annotated Review Counterparts
const assetsToGenerate = [
  { name: 'ecg-inferior-stemi', clean: ecgInferiorStemiClean, ann: ecgInferiorStemiAnnotated },
  { name: 'ecg-complete-heart-block', clean: ecgCompleteHeartBlockClean, ann: ecgCompleteHeartBlockAnnotated },
  { name: 'ecg-wpw-syndrome', clean: ecgWpwClean, ann: ecgWpwAnnotated },
  { name: 'xray-pneumothorax', clean: xrayPneumothoraxClean, ann: xrayPneumothoraxAnnotated },
  { name: 'xray-pneumoperitoneum', clean: xrayPneumoperitoneumClean, ann: xrayPneumoperitoneumAnnotated },
  { name: 'histo-mcd-electron-microscopy', clean: histoMcdEmClean, ann: histoMcdEmAnnotated },
  { name: 'fundoscopy-crao', clean: fundoscopyCraoClean, ann: fundoscopyCraoAnnotated },
  { name: 'derm-pemphigus-vulgaris', clean: dermPemphigusClean, ann: dermPemphigusAnnotated },
  { name: 'micro-gram-stain-strep', clean: microStrepClean, ann: microStrepAnnotated },
  { name: 'surgery-babcock-clamp', clean: surgeryBabcockClean, ann: surgeryBabcockAnnotated },
];

for (const asset of assetsToGenerate) {
  fs.writeFileSync(path.join(outDir, `${asset.name}.svg`), asset.clean, 'utf-8');
  fs.writeFileSync(path.join(outDir, `${asset.name}-annotated.svg`), asset.ann, 'utf-8');
}

console.log(`Generated ${assetsToGenerate.length * 2} clean and annotated medical image assets in ${outDir}`);
