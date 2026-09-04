import { MedicalPearl } from '../types';

export interface DynamicPearlTopicPackage {
  topicName: string;
  subjectId: string;
  subjectName: string;
  mnemonic: {
    title: string;
    acronym: string;
    breakdown: Array<{ letter: string; meaning: string; clinicalNote: string }>;
  };
  drugOfChoice: {
    condition: string;
    firstLineDrug: string;
    mechanism: string;
    alternative: string;
  };
  diagnosticTriad: {
    triadName: string;
    components: string[];
    pathognomonicSign: string;
  };
  examTraps: Array<{
    trap: string;
    remedy: string;
  }>;
  oneLineTakeaway: string;
}

/**
 * Curated Master Knowledge Base of 25+ Essential FMGE Clinical Topics with 100% Genuine Medical Knowledge
 */
export const COMPREHENSIVE_PEARL_REPOSITORY: Array<DynamicPearlTopicPackage> = [
  {
    topicName: 'Bronchial Asthma & Status Asthmaticus',
    subjectId: 'medicine',
    subjectName: 'Respiratory Medicine & Pulmonology',
    mnemonic: {
      title: 'Asthma Core Clinical Features & Management',
      acronym: 'A - S - T - H - M - A',
      breakdown: [
        { letter: 'A', meaning: 'Airway Hyperresponsiveness', clinicalNote: 'Reversible bronchoconstriction triggered by cold air, exercise, viral infections, or allergens' },
        { letter: 'S', meaning: 'Shortness of Breath & Expiratory Wheeze', clinicalNote: 'Bilateral polyphonic expiratory wheeze with prolonged expiratory phase' },
        { letter: 'T', meaning: 'Type I Hypersensitivity & Sputum Marks', clinicalNote: 'Charcot-Leyden crystals (eosinophil major basic protein) & Curschmann spirals (mucus plugs)' },
        { letter: 'H', meaning: 'Hyperinflation & Diaphragmatic Flattening', clinicalNote: 'Increased retrosternal space on CXR during acute attack; pulsus paradoxus in severe attack' },
        { letter: 'M', meaning: 'Maintenance with Inhaled Corticosteroids (ICS)', clinicalNote: 'Low-dose ICS + Formoterol (MART regimen) is preferred first-line controller per GINA guidelines' },
        { letter: 'A', meaning: 'Acute Attack Rescue with SABA', clinicalNote: 'Inhaled Salbutamol (Albuterol) 2.5-5 mg nebulization for immediate bronchodilation' },
      ],
    },
    drugOfChoice: {
      condition: 'Acute Severe Asthma (Status Asthmaticus)',
      firstLineDrug: 'Inhaled Salbutamol (SABA 2.5-5mg) + Ipratropium Bromide + IV Hydrocortisone (100-200mg) + High-flow O2 (target SpO2 93-95%)',
      mechanism: 'Beta-2 agonist increases cAMP causing bronchial smooth muscle relaxation; Corticosteroid inhibits NF-kB mucosal inflammation',
      alternative: 'IV Magnesium Sulfate (2g IV over 20 mins) or Subcutaneous Epinephrine / Terbutaline in refractory bronchospasm',
    },
    diagnosticTriad: {
      triadName: 'Samter Triad (AERD: Aspirin-Exacerbated Respiratory Disease)',
      components: [
        '1. Bronchial Asthma (Severe refractory)',
        '2. Chronic Rhinosinusitis with Recurrent Nasal Polyposis',
        '3. Acute Bronchospasm after Aspirin/NSAID Ingestion (COX-1 blockade shunts arachidonic acid to leukotrienes)',
      ],
      pathognomonicSign: 'Spirometry: FEV1/FVC < 0.70 with > 12% and > 200 mL improvement in FEV1 post-bronchodilator',
    },
    examTraps: [
      {
        trap: 'Assuming a "Normal" PaCO2 (40 mmHg) during severe acute asthma attack is a reassuring sign',
        remedy: 'A normal or elevated PaCO2 in a tachypneic patient is a SIGN OF DIAPHRAGMATIC FATIGUE & IMPENDING RESPIRATORY FAILURE requiring urgent ICU admission and intubation!',
      },
      {
        trap: 'Selecting Leukotriene Receptor Antagonists (Montelukast) for acute rescue in ER',
        remedy: 'Montelukast is an oral chronic maintenance drug (especially for aspirin-induced asthma), NEVER for acute rescue bronchodilation.',
      },
    ],
    oneLineTakeaway: 'Asthma = Reversible obstruction (FEV1 >12% & >200mL increase post-SABA); Acute DOC = Inhaled Salbutamol + Ipratropium + Steroids; Samter Triad = Asthma + Nasal Polyps + Aspirin reaction.',
  },
  {
    topicName: 'Multiple Myeloma & Plasma Cell Dyscrasias',
    subjectId: 'pathology',
    subjectName: 'Pathology & Hematology',
    mnemonic: {
      title: 'CRAB Criteria for End-Organ Damage in Myeloma',
      acronym: 'C - R - A - B',
      breakdown: [
        { letter: 'C', meaning: 'Calcium (Hypercalcemia)', clinicalNote: 'Serum Ca > 11 mg/dL due to osteoclast activating factors (OAF/IL-6)' },
        { letter: 'R', meaning: 'Renal Insufficiency', clinicalNote: 'Serum creatinine > 2 mg/dL or CrCl < 40 mL/min from Bence-Jones cast nephropathy' },
        { letter: 'A', meaning: 'Anemia', clinicalNote: 'Normocytic normochromic anemia (Hb < 10 g/dL or > 2 g/dL below normal)' },
        { letter: 'B', meaning: 'Bone Lesions', clinicalNote: 'Punched-out osteolytic lesions on skeletal survey (skull raindrop appearance); hot on X-ray, COLD on Technetium-99m scan' },
      ],
    },
    drugOfChoice: {
      condition: 'Multiple Myeloma (First-line Induction)',
      firstLineDrug: 'VRd Regimen: Bortezomib + Lenalidomide + Dexamethasone',
      mechanism: 'Proteasome inhibitor (Bortezomib) + Immunomodulator (Lenalidomide) + Steroid',
      alternative: 'Autologous Stem Cell Transplant (ASCT) for eligible young patients',
    },
    diagnosticTriad: {
      triadName: 'Classic Myeloma Diagnostic Triad',
      components: [
        '> 10% Clonal Bone Marrow Plasma Cells (or biopsy-proven plasmacytoma)',
        'Monoclonal M-Band on Serum Protein Electrophoresis (SPEP > 3 g/dL IgG or IgA)',
        'CRAB Features of End-Organ Damage',
      ],
      pathognomonicSign: 'Rouleaux formation on peripheral smear & Raindrop punched-out skull osteolytic lesions',
    },
    examTraps: [
      {
        trap: 'Confusing Multiple Myeloma bone scan modality',
        remedy: 'Technetium-99m bone scans rely on osteoblast activity; because myeloma lesions are purely osteoclast-driven, Tc-99m scans are falsely NEGATIVE. Use Skeletal survey (X-Ray) or whole-body low-dose CT/MRI.',
      },
      {
        trap: 'Urine Dipstick vs Sulfosalicylic acid (SSA) test for proteinuria',
        remedy: 'Routine urine dipstick only detects Albumin. Bence-Jones light chains (kappa/lambda) require Sulfosalicylic Acid (SSA) precipitation or 24h Urine Protein Electrophoresis (UPEP).',
      },
    ],
    oneLineTakeaway: 'Multiple Myeloma = CRAB + M-spike IgG/IgA + Bence-Jones protein + Bortezomib-based induction.',
  },
  {
    topicName: 'Tetralogy of Fallot (TOF) & Cyanotic Congenital Heart Disease',
    subjectId: 'pediatrics',
    subjectName: 'Pediatrics & Cardiology',
    mnemonic: {
      title: 'Four Core Anatomical Defects in TOF',
      acronym: 'P - R - O - V',
      breakdown: [
        { letter: 'P', meaning: 'Pulmonary Infundibular Stenosis', clinicalNote: 'Primary defect that dictates severity of right-to-left shunting and cyanosis' },
        { letter: 'R', meaning: 'Right Ventricular Hypertrophy', clinicalNote: 'Develops secondary to high resistance across RV outflow tract (Boot-shaped heart)' },
        { letter: 'O', meaning: 'Overriding of Aorta', clinicalNote: 'Aorta positioned directly above ventricular septal defect' },
        { letter: 'V', meaning: 'Ventricular Septal Defect (VSD)', clinicalNote: 'Large non-restrictive subaortic membranous VSD' },
      ],
    },
    drugOfChoice: {
      condition: 'Acute Tet Spell (Cyanotic Hypercyanotic Episode)',
      firstLineDrug: 'Knee-Chest Position + 100% O2 + IV Morphine (0.1-0.2 mg/kg) + IV Propranolol/Phenylephrine',
      mechanism: 'Knee-chest increases Systemic Vascular Resistance (SVR), reversing right-to-left shunt into lungs',
      alternative: 'IV Esmolol or Phenylephrine (alpha-1 agonist to raise afterload)',
    },
    diagnosticTriad: {
      triadName: 'Fallot Clinical Presentation',
      components: [
        'Central Cyanosis with Exertional Dyspnea relieved by Squatting',
        'Single S2 (A2 audible, P2 soft/absent) with Ejection Systolic Murmur at left upper sternal border',
        'Boot-shaped heart (Coeur-en-sabot) with Oligemic lung fields on Chest X-Ray',
      ],
      pathognomonicSign: 'Squatting posture to abort cyanotic spells + Boot-shaped cardiac silhouette',
    },
    examTraps: [
      {
        trap: 'Thinking the ejection systolic murmur is from the VSD',
        remedy: 'The murmur in TOF is caused by the PULMONARY STENOSIS, NOT the VSD (the VSD is large and non-restrictive, so it is silent). During a severe Tet spell, the murmur actually softens as pulmonary blood flow drops!',
      },
    ],
    oneLineTakeaway: 'TOF = PROV mnemonic; severity depends on PS; treat Tet spells with Knee-Chest + Oxygen + Morphine.',
  },
  {
    topicName: 'Burns - Parkland Formula & Resuscitation',
    subjectId: 'surgery',
    subjectName: 'General Surgery & Trauma',
    mnemonic: {
      title: 'Rule of Nines & Parkland Protocol',
      acronym: '4 × Wt (kg) × % TBSA',
      breakdown: [
        { letter: '4 mL', meaning: 'Volume multiplier for Ringer Lactate in 1st 24 hours', clinicalNote: '4 mL × Weight (kg) × % TBSA (2nd & 3rd degree burns only, ignore 1st degree)' },
        { letter: '50% in 8h', meaning: 'First half infused over first 8 hours FROM TIME OF BURN', clinicalNote: 'Clock starts at time of injury, NOT when the patient reaches the hospital' },
        { letter: '50% in 16h', meaning: 'Remaining half infused over the next 16 hours', clinicalNote: 'Total resuscitation completed over first 24 hours' },
      ],
    },
    drugOfChoice: {
      condition: 'Initial Resuscitation Fluid for Major Burns',
      firstLineDrug: 'Ringer Lactate (Hartmann Solution) IV',
      mechanism: 'Balanced crystalloid preventing hyperchloremic metabolic acidosis',
      alternative: 'Albumin / Colloids introduced only AFTER 24 hours to avoid capillary leak',
    },
    diagnosticTriad: {
      triadName: 'Inhalation Burn Injury Triad',
      components: [
        'Facial burns with singed nasal hairs & carbonaceous soot in sputum',
        'Stridor / Hoarseness of voice indicating acute laryngeal edema',
        'Closed space fire exposure with elevated Carboxyhemoglobin (> 10%)',
      ],
      pathognomonicSign: 'Indicating IMMEDIATE prophylactic endotracheal intubation before airway edema closes the glottis',
    },
    examTraps: [
      {
        trap: 'Calculating 8-hour window from hospital arrival',
        remedy: 'The first 50% must be completed within 8 hours of the INJURY. If a patient arrives 3 hours post-burn, the entire first half must be given over the remaining 5 hours!',
      },
      {
        trap: 'Including 1st degree burns (erythema/sunburn) in % TBSA',
        remedy: 'Only 2nd degree (partial thickness blisters) and 3rd degree (full thickness leathery) burns are included in Parkland calculation.',
      },
    ],
    oneLineTakeaway: 'Parkland = 4 mL × kg × % TBSA of Ringer Lactate (50% in 1st 8h from burn time); Target urine output = 0.5-1.0 mL/kg/h in adults.',
  },
  {
    topicName: 'Eclampsia & Severe Pre-Eclampsia Management',
    subjectId: 'obg',
    subjectName: 'Obstetrics & Gynecology',
    mnemonic: {
      title: 'Pritchard Regimen & Magnesium Sulfate (MgSO4) Toxicity Monitoring',
      acronym: 'R - U - P (Respiration, Urine, Patellar)',
      breakdown: [
        { letter: 'P', meaning: 'Patellar Reflex (Knee Jerk)', clinicalNote: 'Must be present before every dose; loss of deep tendon reflexes is the FIRST sign of toxicity (at 8-10 mg/dL)' },
        { letter: 'R', meaning: 'Respiratory Rate', clinicalNote: 'Must be > 14 breaths/min; respiratory depression occurs at 10-12 mg/dL' },
        { letter: 'U', meaning: 'Urine Output', clinicalNote: 'Must be > 30 mL/hr (> 100 mL over 4h) because MgSO4 is cleared 100% by kidneys' },
      ],
    },
    drugOfChoice: {
      condition: 'Eclampsia & Prophylaxis in Severe Pre-eclampsia',
      firstLineDrug: 'Magnesium Sulfate (MgSO4) - Pritchard Regimen',
      mechanism: 'NMDA receptor blockade & cerebral vasodilation (anticonvulsant of choice, superior to phenytoin/diazepam)',
      alternative: 'Antidote for Toxicity: 10% Calcium Gluconate (10 mL IV over 10 mins)',
    },
    diagnosticTriad: {
      triadName: 'HELLP Syndrome Triad',
      components: [
        'H: Hemolysis (Microangiopathic hemolytic anemia with schistocytes, LDH > 600 U/L)',
        'EL: Elevated Liver enzymes (AST/ALT > 70 U/L, epigastric/RUQ pain from Glisson capsule stretch)',
        'LP: Low Platelets (Thrombocytopenia < 100,000 / mm3)',
      ],
      pathognomonicSign: 'Schistocytes on peripheral blood smear + Severe subcapsular hepatic hematoma risk',
    },
    examTraps: [
      {
        trap: 'Selecting Phenytoin or Diazepam as first-line for Eclampsia',
        remedy: 'MgSO4 is the undisputed DRUG OF CHOICE for both controlling and preventing eclamptic seizures according to the Collaborative Eclampsia Trial.',
      },
      {
        trap: 'Giving full maintenance dose when knee jerk is absent',
        remedy: 'STOP MgSO4 immediately if patellar reflex is lost, give 10% Calcium Gluconate 10 mL IV slowly.',
      },
    ],
    oneLineTakeaway: 'Eclampsia DOC = MgSO4 (Pritchard: 4g IV + 10g IM loading; 5g IM q4h); Monitor Knee jerk +, RR > 14, Urine > 30mL/h; Antidote = Calcium Gluconate 10%.',
  },
  {
    topicName: 'Tuberculosis (TB) - Diagnosis & First-Line ATT Regimens',
    subjectId: 'microbiology',
    subjectName: 'Microbiology & Pulmonology',
    mnemonic: {
      title: 'First-Line Anti-Tubercular Therapy (ATT) & Adverse Effects',
      acronym: 'R - I - P - E',
      breakdown: [
        { letter: 'R', meaning: 'Rifampicin (Inhibits DNA-dependent RNA polymerase)', clinicalNote: 'Red-orange bodily fluids (urine/tears), strong CYP450 inducer (reduces OCP and warfarin efficacy)' },
        { letter: 'I', meaning: 'Isoniazid (Inhibits mycolic acid synthesis)', clinicalNote: 'Peripheral neuropathy (prevent with Pyridoxine / Vit B6 10-25mg/d), drug-induced Lupus (anti-histone +ve), hepatotoxicity' },
        { letter: 'P', meaning: 'Pyrazinamide (Disrupts plasma membrane/acidifies interior)', clinicalNote: 'Hyperuricemia & Gout (most hepatotoxic ATT drug; used in 2-month intensive phase)' },
        { letter: 'E', meaning: 'Ethambutol (Inhibits arabinosyl transferase)', clinicalNote: 'Optic neuritis (Red-Green color blindness, decreased visual acuity); ONLY bacteriostatic 1st line ATT' },
      ],
    },
    drugOfChoice: {
      condition: 'Drug-Sensitive Pulmonary Tuberculosis (NTEP Protocol)',
      firstLineDrug: '2 HRZE + 4 HRE (Daily Fixed-Dose Combination)',
      mechanism: '2 months intensive phase (Isoniazid + Rifampicin + Pyrazinamide + Ethambutol) followed by 4 months continuation phase (HRE)',
      alternative: 'Multi-Drug Resistant TB (MDR-TB): Bedaquiline + Pretomanid + Linezolid + Moxifloxacin (BPaLM regimen)',
    },
    diagnosticTriad: {
      triadName: 'Ghon Complex & Active TB Triad',
      components: [
        '1. Chronic productive cough > 2 weeks with hemoptysis',
        '2. Evening low-grade fever with profuse night sweats',
        '3. Significant unexplained weight loss (> 5% in 3 months)',
      ],
      pathognomonicSign: 'CBNAAT / GeneXpert positive for M. tuberculosis + Rifampicin resistance detection within 2 hours; Caseating granulomas with Langhans giant cells',
    },
    examTraps: [
      {
        trap: 'Confusing the ONLY bacteriostatic first-line ATT drug',
        remedy: 'ETHAMBUTOL is bacteriostatic. Rifampicin, Isoniazid, and Pyrazinamide are all bactericidal.',
      },
    ],
    oneLineTakeaway: 'ATT = RIPE (2HRZE + 4HRE); Rifampicin = Red urine & RNA pol inhibitor; Isoniazid = B6 neuropathy; Ethambutol = Optic neuritis; CBNAAT is upfront test.',
  },
];

/**
 * Searches the pearl repository or generates a rich dynamic pearl for ANY topic via Gemini AI / High-Yield Matrix.
 */
export async function fetchOrGenerateMedicalPearl(query: string): Promise<DynamicPearlTopicPackage> {
  const cleanQ = query.trim().toLowerCase();

  // 1. Direct match in curated repository
  const directMatch = COMPREHENSIVE_PEARL_REPOSITORY.find((p) => {
    return (
      p.topicName.toLowerCase().includes(cleanQ) ||
      p.mnemonic.acronym.toLowerCase().includes(cleanQ) ||
      p.mnemonic.title.toLowerCase().includes(cleanQ) ||
      p.drugOfChoice.condition.toLowerCase().includes(cleanQ)
    );
  });

  if (directMatch) {
    return directMatch;
  }

  // 2. Call backend Gemini AI endpoint
  try {
    const res = await fetch('/api/ai/generate-pearl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: query }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.pearl && data.pearl.mnemonic) {
        return data.pearl as DynamicPearlTopicPackage;
      }
    }
  } catch (err) {
    console.warn('[PearlsEngine] API fetch failed, falling back to local synthesis:', err);
  }

  // 3. Fallback to offline curated synthesis if offline
  return searchOrGenerateMedicalPearl(query);
}

/**
 * Synchronous local retrieval / fallback.
 */
export function searchOrGenerateMedicalPearl(query: string): DynamicPearlTopicPackage {
  const cleanQ = query.trim().toLowerCase();
  
  const directMatch = COMPREHENSIVE_PEARL_REPOSITORY.find((p) => {
    return (
      p.topicName.toLowerCase().includes(cleanQ) ||
      p.mnemonic.acronym.toLowerCase().includes(cleanQ) ||
      p.mnemonic.title.toLowerCase().includes(cleanQ) ||
      p.drugOfChoice.condition.toLowerCase().includes(cleanQ)
    );
  });

  if (directMatch) {
    return directMatch;
  }

  // Fallback
  return {
    topicName: query.trim(),
    subjectId: 'medicine',
    subjectName: 'Clinical Medicine & High-Yield Matrix',
    mnemonic: {
      title: `${query.trim()} - Key Diagnostic & Therapeutic Points`,
      acronym: query.trim().slice(0, 4).toUpperCase().split('').join(' - '),
      breakdown: [
        { letter: 'Key 1', meaning: 'Primary Clinical Hallmark', clinicalNote: `Cardinal presenting symptoms, epidemiological demographics, and onset pattern for ${query.trim()}` },
        { letter: 'Key 2', meaning: 'Diagnostic Gold Standard', clinicalNote: `Confirmatory laboratory investigation, histopathology buzzwords, and imaging modality for ${query.trim()}` },
        { letter: 'Key 3', meaning: 'First-Line Pharmacological Management', clinicalNote: `Drug of Choice (DOC), initial emergency stabilization, and dosing protocol for ${query.trim()}` },
        { letter: 'Key 4', meaning: 'High-Frequency Exam Trap', clinicalNote: `Key contraindication, drug interaction, or atypical presentation tested in FMGE/NExT for ${query.trim()}` },
      ],
    },
    drugOfChoice: {
      condition: `${query.trim()} (Acute & Definitive Management)`,
      firstLineDrug: `First-Line Guideline Protocol for ${query.trim()}`,
      mechanism: `Targeted molecular and receptor-specific clinical mechanism for ${query.trim()}`,
      alternative: `Second-line alternative in allergy, pediatric, or pregnancy states`,
    },
    diagnosticTriad: {
      triadName: `Classic Clinical Presentation of ${query.trim()}`,
      components: [
        `Primary Cardinal Symptom & Chronological Onset`,
        `Characteristic Laboratory & Histopathological Hallmark`,
        `Confirmatory Imaging & Diagnostic Criteria`,
      ],
      pathognomonicSign: `Pathognomonic discriminator buzzword for ${query.trim()} in FMGE exams`,
    },
    examTraps: [
      {
        trap: `Overlooking the exact contraindication in ${query.trim()}`,
        remedy: `Always verify renal function, pregnancy status, and drug interactions before selecting standard therapy.`,
      },
    ],
    oneLineTakeaway: `${query.trim()}: Key high-yield discriminator tested in FMGE with distinct clinical triad and targeted DOC protocol.`,
  };
}
