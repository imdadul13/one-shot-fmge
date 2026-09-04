// Dynamic Medical Subject & Topic Classifier + Clinical MCQ Engine for FMGE

export interface StructuredMCQ {
  subject: string;
  topic: string;
  questionType: string;
  stem: string;
  question: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  distractorBreakdown: Record<string, string>;
  fmgeTakeaway: string;
  memoryHook: string;
}

export function classifyTopicAndSubject(rawQuery: string): { subject: string; topic: string } {
  const clean = rawQuery
    .replace(/^give\s+me\s+(an?|the)?\s*/i, '')
    .replace(/^(fmge|neet|next)?\s*mcq\s*(on|about|for)?\s*/i, '')
    .replace(/^quiz\s+me\s*(on|about|for)?\s*/i, '')
    .replace(/^practice\s+question\s*(on|about)?\s*/i, '')
    .replace(/^test\s+me\s*(on|about)?\s*/i, '')
    .replace(/^(an?|the)\s+/i, '')
    .trim();

  const lower = rawQuery.toLowerCase();

  // 1. Anatomy
  if (lower.includes('cavernous sinus')) {
    return { subject: 'Anatomy', topic: 'Head & Neck · Cavernous Sinus & Cranial Nerves' };
  }
  if (lower.includes('brachial plexus') || lower.includes("erb") || lower.includes("klumpke")) {
    return { subject: 'Anatomy', topic: 'Upper Limb · Brachial Plexus Lesions' };
  }
  if (lower.includes('peroneal') || lower.includes('foot drop') || lower.includes('tibial')) {
    return { subject: 'Anatomy', topic: 'Lower Limb · Common Peroneal Nerve & Foot Drop' };
  }
  if (lower.includes('inguinal') || lower.includes('femoral hernia')) {
    return { subject: 'Anatomy', topic: 'Abdomen · Inguinal & Femoral Canal Anatomy' };
  }
  if (lower.includes('anatomy')) {
    const topicName = clean.replace(/anatomy/i, '').trim() || 'Gross Anatomy';
    return { subject: 'Anatomy', topic: `Clinical Anatomy · ${topicName.charAt(0).toUpperCase() + topicName.slice(1)}` };
  }

  // 2. Cardiology & Heart Blocks
  if (lower.includes('heart block') || lower.includes('av block') || lower.includes('wenckebach') || lower.includes('stokes-adams')) {
    return { subject: 'General Medicine', topic: 'Cardiology · AV Conduction & Heart Blocks' };
  }
  if (lower.includes('stemi') || lower.includes('myocardial infarction') || lower.includes('angina') || lower.includes('rvmi')) {
    return { subject: 'General Medicine', topic: 'Cardiology · Acute Coronary Syndromes & MI' };
  }
  if (lower.includes('arrhythmia') || lower.includes('afib') || lower.includes('flutter') || lower.includes('wpw')) {
    return { subject: 'General Medicine', topic: 'Cardiology · Arrhythmias & Pre-excitation' };
  }

  // 3. Nephrology & Renal
  if (lower.includes('nephrotic')) {
    return { subject: 'General Medicine', topic: 'Nephrology · Glomerular Disorders & Nephrotic Syndrome' };
  }
  if (lower.includes('nephritic') || lower.includes('psgn') || lower.includes('iga nephropathy')) {
    return { subject: 'General Medicine', topic: 'Nephrology · Nephritic Syndromes & Glomerulonephritis' };
  }

  // 4. Gastroenterology & IBD
  if (lower.includes('crohn') || lower.includes('ulcerative colitis') || lower.includes('ibd')) {
    return { subject: 'General Medicine', topic: 'Gastroenterology · Inflammatory Bowel Disease' };
  }
  if (lower.includes('cirrhosis') || lower.includes('portal hypertension') || lower.includes('ascites')) {
    return { subject: 'General Medicine', topic: 'Gastroenterology · Chronic Liver Disease & Cirrhosis' };
  }

  // 5. General Surgery
  if (lower.includes('burn') || lower.includes('parkland') || lower.includes('rule of nines')) {
    return { subject: 'General Surgery', topic: 'Trauma & Burns · Parkland Resuscitation' };
  }
  if (lower.includes('appendicitis') || lower.includes('cholecystitis') || lower.includes('bowel obstruction')) {
    return { subject: 'General Surgery', topic: 'Acute Abdomen · Surgical Emergencies' };
  }

  // 6. Obstetrics & Gynecology
  if (lower.includes('eclampsia') || lower.includes('preeclampsia') || lower.includes('mgso4') || lower.includes('pritchard')) {
    return { subject: 'Obstetrics & Gynecology', topic: 'Obstetrics · Hypertensive Disorders of Pregnancy' };
  }
  if (lower.includes('pph') || lower.includes('postpartum hemorrhage') || lower.includes('oxytocin')) {
    return { subject: 'Obstetrics & Gynecology', topic: 'Obstetrics · Postpartum Hemorrhage & Active Management' };
  }

  // 7. Pharmacology
  if (lower.includes('organophosphate') || lower.includes('atropine') || lower.includes('pralidoxime')) {
    return { subject: 'Pharmacology', topic: 'Autonomic Pharmacology · Cholinergic Poisoning & Antidotes' };
  }
  if (lower.includes('linezolid') || lower.includes('serotonin syndrome') || lower.includes('antibiotic')) {
    return { subject: 'Pharmacology', topic: 'Chemotherapy · Antibacterial Adverse Reactions' };
  }

  // Default clean formatting
  const formattedTopic = clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'High-Yield Clinical Scenario';
  return {
    subject: 'General Medicine',
    topic: `Clinical Medicine · ${formattedTopic}`
  };
}

export function generateStructuredClinicalMCQ(rawQuery: string): StructuredMCQ {
  const { subject, topic } = classifyTopicAndSubject(rawQuery);
  const lower = rawQuery.toLowerCase();

  // 1. Cavernous Sinus
  if (lower.includes('cavernous sinus')) {
    return {
      subject,
      topic,
      questionType: 'clinical_vignette',
      stem: "A 24-year-old male presents with severe headache, high-grade fever, periorbital edema, chemosis, and proptosis 4 days after squeezing a boil in the 'danger area of the face' (nasolabial fold). On neurological examination, he has ptosis, a dilated fixed pupil, and loss of sensation over the forehead and cheek. An inability to abduct the left eye is noted first.",
      question: "Which of the following structures lies internally inside the cavernous sinus cavity alongside the internal carotid artery and is typically affected first?",
      options: [
        { key: 'A', text: 'Oculomotor nerve (CN III)' },
        { key: 'B', text: 'Trochlear nerve (CN IV)' },
        { key: 'C', text: 'Abducens nerve (CN VI)' },
        { key: 'D', text: 'Ophthalmic division of trigeminal nerve (CN V1)' }
      ],
      correctAnswer: 'C',
      explanation: "The Abducens nerve (CN VI) runs centrally THROUGH the cavernous sinus cavity alongside the Internal Carotid Artery (ICA). Because of its central, free-floating location inside the venous blood pool, it is the first cranial nerve compressed in cavernous sinus thrombosis, causing lateral rectus palsy (loss of abduction). Cranial nerves III, IV, V1, and V2 lie embedded within the lateral wall of the sinus.",
      distractorBreakdown: {
        'A': 'CN III runs in the lateral wall of the cavernous sinus, not freely inside the sinus cavity.',
        'B': 'CN IV runs in the lateral wall of the cavernous sinus.',
        'D': 'CN V1 (Ophthalmic) and CN V2 (Maxillary) run in the lateral wall, causing facial sensory loss secondarily.'
      },
      fmgeTakeaway: "Structures passing INSIDE Cavernous Sinus = Internal Carotid Artery + Abducens Nerve (CN VI). Lateral wall = CN III, IV, V1, V2.",
      memoryHook: "O-T-O-M in lateral wall (Oculomotor, Trochlear, Ophthalmic, Maxillary). VI and ICA are INSIDE the pool."
    };
  }

  // 2. Heart Blocks
  if (lower.includes('heart block') || lower.includes('av block') || lower.includes('wenckebach')) {
    return {
      subject,
      topic,
      questionType: 'clinical_vignette',
      stem: "A 68-year-old man presents to the emergency department with dizziness and recurrent episodes of fainting (Stokes-Adams attacks). Physical examination reveals a slow, regular pulse of 36/min, intermittent cannon 'a' waves in the jugular venous pulse, and varying intensity of the first heart sound (S1). 12-lead ECG demonstrates regular P waves at 82/min and regular wide QRS complexes at 36/min with complete AV dissociation (no consistent relationship between P waves and QRS complexes).",
      question: "What is the definitive management of choice for this patient?",
      options: [
        { key: 'A', text: 'Permanent pacemaker implantation (PPI)' },
        { key: 'B', text: 'Intravenous Digoxin bolus' },
        { key: 'C', text: 'Oral Amiodarone maintenance therapy' },
        { key: 'D', text: 'Immediate synchronized DC cardioversion' }
      ],
      correctAnswer: 'A',
      explanation: "This patient has symptomatic Third-Degree (Complete) Heart Block with AV dissociation and Stokes-Adams attacks. Permanent pacemaker implantation (PPI) is the definitive Class I indication. Cannon 'a' waves occur when the right atrium contracts against a closed tricuspid valve during AV dissociation.",
      distractorBreakdown: {
        'B': 'Digoxin blocks AV node conduction and is strictly contraindicated in high-grade AV block.',
        'C': 'Amiodarone slows nodal conduction and can induce fatal asystole in complete AV block.',
        'D': 'DC cardioversion is used for tachyarrhythmias, not for severe bradycardic heart block.'
      },
      fmgeTakeaway: "Complete AV dissociation + Cannon 'a' waves + Stokes-Adams syncope = Complete Heart Block. Permanent pacemaker (PPI) is the definitive treatment.",
      memoryHook: "P and QRS divorced in Complete Heart Block -> Pacemaker is the lifesaver."
    };
  }

  // 3. Nephrotic Syndrome
  if (lower.includes('nephrotic')) {
    return {
      subject,
      topic,
      questionType: 'clinical_vignette',
      stem: "A 6-year-old boy is brought by his parents with generalized swelling (facial puffiness prominent in the morning and dependent pitting pedal edema) and frothy urine for 1 week. Urinalysis reveals 4+ proteinuria with a 24-hour urine protein of 4.2 g/day. Serum albumin is 2.1 g/dL and total cholesterol is 380 mg/dL. Renal biopsy under light microscopy shows normal glomeruli, but electron microscopy reveals diffuse effacement of podocyte foot processes.",
      question: "What is the first-line drug of choice for this patient?",
      options: [
        { key: 'A', text: 'Oral Prednisolone' },
        { key: 'B', text: 'Intravenous Cyclophosphamide' },
        { key: 'C', text: 'Oral Cyclosporine' },
        { key: 'D', text: 'Intravenous Furosemide monotherapy' }
      ],
      correctAnswer: 'A',
      explanation: "The clinical presentation and electron microscopy finding of diffuse podocyte foot process effacement with normal light microscopy are diagnostic of Minimal Change Disease (MCD), the most common cause of nephrotic syndrome in children. First-line therapy is oral Corticosteroids (Prednisolone 2 mg/kg/day for 6 weeks), which achieves complete remission in >90% of pediatric cases.",
      distractorBreakdown: {
        'B': 'Cyclophosphamide is reserved for steroid-dependent or frequent-relapsing MCD, not initial therapy.',
        'C': 'Cyclosporine is a second-line calcineurin inhibitor used in steroid-resistant nephrotic syndrome.',
        'D': 'Diuretics provide symptomatic edema relief but do not treat the underlying podocyte filtration barrier defect.'
      },
      fmgeTakeaway: "Child + Frothy Urine + Edema + Normal Light Microscopy + Podocyte Foot Process Effacement on EM = Minimal Change Disease. Drug of Choice = Oral Corticosteroids (Prednisolone).",
      memoryHook: "MCD in Kids = Minimal on Light, Massive Podocyte Effacement on EM, Miracle response to Steroids."
    };
  }

  // 4. Crohn's Disease vs Ulcerative Colitis
  if (lower.includes('crohn') || lower.includes('ulcerative colitis') || lower.includes('ibd')) {
    return {
      subject,
      topic,
      questionType: 'clinical_vignette',
      stem: "A 28-year-old woman presents with right lower quadrant colicky abdominal pain, non-bloody chronic diarrhea, low-grade fever, and 6 kg weight loss over 4 months. Colonoscopy reveals patchy ulcerations with normal intervening mucosa ('skip lesions') predominantly involving the terminal ileum and cecum, along with a 'cobblestone' appearance. Full-thickness mucosal biopsy demonstrates non-caseating granulomas with transmural inflammation.",
      question: "Which of the following serological markers is most characteristically positive in this condition?",
      options: [
        { key: 'A', text: 'Anti-Saccharomyces cerevisiae antibody (ASCA)' },
        { key: 'B', text: 'Perinuclear anti-neutrophil cytoplasmic antibody (p-ANCA)' },
        { key: 'C', text: 'Anti-tissue transglutaminase (anti-tTG) antibody' },
        { key: 'D', text: 'Anti-cyclic citrullinated peptide (anti-CCP) antibody' }
      ],
      correctAnswer: 'A',
      explanation: "The presence of skip lesions, terminal ileum involvement, transmural inflammation, and non-caseating granulomas is classic for Crohn's Disease. ASCA (Anti-Saccharomyces cerevisiae antibody) is characteristically positive in Crohn's Disease (~60-70%), whereas p-ANCA is positive in Ulcerative Colitis (>70%).",
      distractorBreakdown: {
        'B': 'p-ANCA is strongly associated with Ulcerative Colitis, not Crohn disease.',
        'C': 'Anti-tTG is the screening investigation of choice for Celiac disease.',
        'D': 'Anti-CCP is highly specific for Rheumatoid Arthritis.'
      },
      fmgeTakeaway: "Crohn's Disease = Skip lesions + Transmural + Non-caseating granulomas + Terminal ileum + ASCA (+). Ulcerative Colitis = Continuous + Mucosal + Crypt abscesses + p-ANCA (+).",
      memoryHook: "Crohn's = ASCA (A Straying Colitis / Anywhere from gum to bum). UC = p-ANCA (Starts at rectum, continuous)."
    };
  }

  // 5. Default High-Yield Clinical Scenario
  return {
    subject,
    topic,
    questionType: 'clinical_vignette',
    stem: `A 48-year-old patient presents to the outpatient department for evaluation of symptoms related to ${topic}. Following a standardized clinical assessment, laboratory evaluations and imaging investigations confirm the classic high-yield presentation.`,
    question: "What is the most appropriate first-line guideline-recommended management / investigation for this patient?",
    options: [
      { key: 'A', text: 'Initiate guideline-recommended first-line pharmacotherapy' },
      { key: 'B', text: 'Immediate surgical exploration and tissue biopsy' },
      { key: 'C', text: 'Supportive monitoring with lifestyle modification alone' },
      { key: 'D', text: 'Empirical broad-spectrum antimicrobial administration' }
    ],
    correctAnswer: 'A',
    explanation: `For ${topic} in the FMGE syllabus, prompt initiation of first-line evidence-based pharmacotherapy is the standard gold-standard approach according to standard NMC guidelines.`,
    distractorBreakdown: {
      'B': 'Surgical exploration is reserved for refractory cases or acute anatomical emergencies.',
      'C': 'Supportive monitoring is insufficient when active disease criteria are met.',
      'D': 'Empirical broad-spectrum therapy without diagnostic indication promotes resistance and toxicity.'
    },
    fmgeTakeaway: `Master the first-line drug of choice (DOC) and key diagnostic criteria for ${topic}.`,
    memoryHook: `Always identify the single pathognomonic finding before selecting the management step.`
  };
}
