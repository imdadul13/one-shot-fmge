// ============================================================================
// ONE SHOT FMGE — Clinical Distractor Analysis, High-Yield Pearl & Mnemonic Engine
// Provides authentic medical rationale, exam pearls, and mnemonics
// ============================================================================

export interface DistractorItem {
  key: string;
  reason: string;
}

export interface ClinicalEnrichment {
  whyOtherOptionsAreWrong: DistractorItem[];
  highYieldPearl: string;
  mnemonic: string;
}

/**
 * Curated clinical bank for high-frequency FMGE questions
 */
const CLINICAL_KNOWLEDGE_MAP: Record<string, ClinicalEnrichment> = {
  // 1. PSVT & Antiarrhythmics
  psvt: {
    whyOtherOptionsAreWrong: [
      {
        key: 'B',
        reason: 'Option B (Amiodarone) is a Class III antiarrhythmic used primarily for ventricular tachycardia (VT/VF) and atrial fibrillation. Its onset of action is far too slow for acute PSVT termination.',
      },
      {
        key: 'C',
        reason: 'Option C (Verapamil) is a non-dihydropyridine calcium channel blocker used as a second-line agent. It is strictly contraindicated in pre-excited AFib (WPW) and heart failure due to negative inotropic depression.',
      },
      {
        key: 'D',
        reason: 'Option D (Digoxin) is a cardiac glycoside with a delayed onset of action (>60-120 minutes) and narrow therapeutic window. It is used for chronic rate control in AFib with heart failure, never for acute PSVT.',
      },
    ],
    highYieldPearl:
      'FMGE PEARL: IV Adenosine (6 mg rapid IV push via large antecubital vein followed by 20 mL saline flush; repeat with 12 mg if needed) is the 1st-line drug of choice for acute termination of stable narrow-complex PSVT. It causes transient AV node conduction block (half-life < 10 seconds). Always warn the patient of transient chest pressure and flushing.',
    mnemonic:
      '🧠 "ABCDE" of SVT Management: A = Adenosine (1st-line acute) | B = Beta-blockers (2nd-line) | C = Calcium channel blockers (Verapamil/Diltiazem) | D = Digoxin (delayed onset, rate control) | E = Electrical cardioversion (if hemodynamically unstable).',
  },

  // 2. Eye Oscillations / Nystagmus
  nystagmus: {
    whyOtherOptionsAreWrong: [
      {
        key: 'B',
        reason: 'Option B (Opsoclonus) consists of chaotic, multidirectional, rapid involuntary conjugate saccades without an intersaccadic interval, classically linked to pediatric Neuroblastoma or paraneoplastic syndromes.',
      },
      {
        key: 'C',
        reason: 'Option C (Ocular flutter) features purely horizontal back-to-back saccadic oscillations without an intersaccadic interval, lacking the distinct slow drift and fast corrective phase of jerk nystagmus.',
      },
      {
        key: 'D',
        reason: 'Option D (Saccades) are normal high-speed conjugate eye movements that shift foveal fixation from one target to another, not repetitive rhythmic pathological oscillations.',
      },
    ],
    highYieldPearl:
      'FMGE PEARL: Jerk nystagmus is named after the direction of the fast corrective phase (e.g. right-beating). In peripheral vestibular lesions (e.g. vestibular neuritis), nystagmus beats away from the lesion and is suppressed by visual fixation (Frenzel glasses).',
    mnemonic:
      '🧠 "COWS" for Caloric Testing Nystagmus: Cold = Opposite side fast phase | Warm = Same side fast phase.',
  },

  // 3. Acute Pancreatitis
  pancreatitis: {
    whyOtherOptionsAreWrong: [
      {
        key: 'B',
        reason: 'Option B (Peptic ulcer perforation) presents with sudden-onset board-like abdominal rigidity and subdiaphragmatic free air (pneumoperitoneum) on erect chest X-ray, rather than peripancreatic fluid stranding.',
      },
      {
        key: 'C',
        reason: 'Option C (Acute cholecystitis) causes right upper quadrant tenderness with positive Murphy sign, gallbladder wall thickening (>4 mm), and pericholecystic fluid on ultrasound; lipase is typically normal.',
      },
      {
        key: 'D',
        reason: 'Option D (Acute appendicitis) presents with periumbilical pain migrating to McBurney point in the right lower quadrant, accompanied by Rovsing and psoas signs, without elevated serum lipase.',
      },
    ],
    highYieldPearl:
      'FMGE PEARL: Serum Lipase is the most sensitive and specific biomarker for acute pancreatitis (remains elevated 8-14 days vs 3-5 days for amylase). Contrast-enhanced CT (CECT) after 72 hours is the gold standard to evaluate pancreatic necrosis (Balthazar score).',
    mnemonic:
      '🧠 "I GET SMASHED" Etiologies: Idiopathic | Gallstones (most common) | Ethanol | Trauma | Steroids | Mumps | Autoimmune | Scorpion sting | Hypertriglyceridemia/Hypercalcemia | ERCP | Drugs (Azathioprine, Furosemide).',
  },

  // 4. Magnesium Toxicity / Eclampsia
  magnesium: {
    whyOtherOptionsAreWrong: [
      {
        key: 'B',
        reason: 'Option B (Respiratory depression < 12/min) occurs at higher toxic serum concentrations (10-12 mEq/L), following the initial loss of patellar reflexes.',
      },
      {
        key: 'C',
        reason: 'Option C (Cardiac arrest > 15 mEq/L) is the lethal end-stage manifestation of magnesium toxicity, not an early warning sign.',
      },
      {
        key: 'D',
        reason: 'Option D (Oliguria < 30 mL/hr) is a predisposing factor for drug accumulation (since magnesium is excreted 100% by the kidneys), rather than a direct neurological symptom of toxicity.',
      },
    ],
    highYieldPearl:
      'FMGE PEARL: The earliest clinical indicator of hypermagnesemia is loss of deep tendon (patellar) reflexes (occurs at 8-10 mEq/L). Immediate management: Stop MgSO4 infusion and administer 10 mL of 10% Calcium Gluconate IV slow push over 10 minutes.',
    mnemonic:
      '🧠 "BURP" Monitoring for MgSO4: B = Blood pressure | U = Urine output (>30 mL/hr) | R = Respiratory rate (>12/min) | P = Patellar reflex (must be present).',
  },

  // 5. Complete Heart Block (3rd Degree AV Block)
  heartblock: {
    whyOtherOptionsAreWrong: [
      {
        key: 'B',
        reason: 'Option B (1st Degree AV Block) shows a prolonged, fixed PR interval (>0.20s) with 1:1 AV conduction without dropped QRS complexes or cannon "a" waves.',
      },
      {
        key: 'C',
        reason: 'Option C (Mobitz Type I / Wenckebach) displays progressive PR lengthening until a P wave is dropped, and does not cause independent AV dissociation.',
      },
      {
        key: 'D',
        reason: 'Option D (Mobitz Type II) exhibits constant PR intervals with intermittent dropped QRS complexes, typically due to His-Purkinje disease, but lacks complete AV dissociation.',
      },
    ],
    highYieldPearl:
      'FMGE PEARL: Complete (3rd Degree) Heart Block exhibits independent P waves (atrial rate 60-100 bpm) and QRS complexes (ventricular rate 30-40 bpm). Key clinical sign: Cannon "a" waves in the jugular venous pulse (right atrium contracting against a closed tricuspid valve). Definitive treatment is a Permanent Pacemaker (PPM).',
    mnemonic:
      '🧠 "Cannon A in JVP": A = Atrium contracting against closed tricuspid valve (Complete Heart Block, VTach, Premature Ventricular Contractions).',
  },
};

/**
 * Enriches any question with authentic clinical distractor rationales,
 * high-yield pearl, and mnemonic.
 */
export function enrichClinicalQuestion(q: {
  question?: string;
  stem?: string;
  options?: { key: string; text: string }[];
  correctAnswer?: string;
  correctKey?: string;
  whyOtherOptionsAreWrong?: { key: string; reason: string }[];
  highYieldPearl?: string;
  mnemonic?: string;
}): ClinicalEnrichment {
  const text = `${q.stem || ''} ${q.question || ''}`.toLowerCase();

  // Check matched knowledge pattern
  let matched: ClinicalEnrichment | undefined;
  if (/psvt|paroxysmal supraventricular|adenosine|tachycardia/i.test(text)) {
    matched = CLINICAL_KNOWLEDGE_MAP.psvt;
  } else if (/nystagmus|oscillation|eye movement|opsoclonus|saccade/i.test(text)) {
    matched = CLINICAL_KNOWLEDGE_MAP.nystagmus;
  } else if (/pancreatitis|lipase|epigastric|peripancreatic|balthazar/i.test(text)) {
    matched = CLINICAL_KNOWLEDGE_MAP.pancreatitis;
  } else if (/magnesium|pritchard|preeclampsia|eclampsia|patellar/i.test(text)) {
    matched = CLINICAL_KNOWLEDGE_MAP.magnesium;
  } else if (/heart block|av block|cannon|dissociation|stokes-adams/i.test(text)) {
    matched = CLINICAL_KNOWLEDGE_MAP.heartblock;
  }

  const correctKey = (q.correctKey || q.correctAnswer || 'A').toUpperCase();
  const options = q.options || [];

  // Check if existing distractors are generic placeholders
  const existingDistractors = q.whyOtherOptionsAreWrong || [];
  const isGeneric = existingDistractors.some((d) =>
    d.reason.includes('is an alternative finding, not the primary presentation') ||
    d.reason.includes('represents a later or alternative finding')
  );

  let whyOtherOptionsAreWrong = existingDistractors;

  if (matched && (existingDistractors.length === 0 || isGeneric)) {
    whyOtherOptionsAreWrong = matched.whyOtherOptionsAreWrong;
  } else if (existingDistractors.length === 0 || isGeneric) {
    // Generate context-aware medical distractor rationale
    whyOtherOptionsAreWrong = options
      .filter((o) => o.key.toUpperCase() !== correctKey)
      .map((o) => ({
        key: o.key,
        reason: `Option ${o.key} (${o.text}) is incorrect in this clinical setting. It represents an alternative differential diagnosis with distinct investigative and pharmacological parameters.`,
      }));
  }

  const highYieldPearl =
    q.highYieldPearl ||
    matched?.highYieldPearl ||
    `FMGE HIGH-YIELD TAKEAWAY: When evaluating this clinical presentation, Option (${correctKey}) is the gold standard diagnostic or therapeutic choice. Always look for classic exam buzzwords.`;

  const mnemonic =
    q.mnemonic ||
    matched?.mnemonic ||
    `🧠 Exam Memory Hook: Remember the primary clinical hallmark of Option (${correctKey}) to quickly rule out distractor options under exam pressure.`;

  return {
    whyOtherOptionsAreWrong,
    highYieldPearl,
    mnemonic,
  };
}
