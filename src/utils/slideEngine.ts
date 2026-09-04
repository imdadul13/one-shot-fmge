import { SlideDeck, VisualSlideItem, NormalizedTopicIntelligence } from '../types';
import { getNormalizedTopicIntelligence } from './topicIntelligence';
import { getMedicalTopicKnowledge } from './topicKnowledgeBase';
import { filterTopicSafeContent } from './contentValidator';

export const VERIFIED_TOPIC_SLIDES: Record<string, VisualSlideItem[]> = {
  // Anatomy - Knee Joint & Nerve Lesions
  'anat-4': [
    {
      id: 'slide-anat-4-1',
      slideNumber: 1,
      title: 'Knee Joint & Nerve Injuries — High-Yield Overview',
      subtitle: 'Anatomy • FMGE High Priority Core',
      category: 'overview',
      bullets: [
        'The knee joint is a compound synovial modified hinge (bicondylar) joint.',
        'Primary stabilizers: ACL (prevents anterior translation), PCL (prevents posterior translation), MCL, and LCL.',
        'Common nerve injuries: Common Peroneal Nerve at the neck of the fibula (Foot Drop) and Tibial Nerve in the popliteal fossa.',
        'Crucial for high-frequency FMGE image-based and clinical trauma questions.',
      ],
      keyTakeaways: ['LAMP mnemonic: Lateral femoral condyle = ACL, Medial femoral condyle = PCL'],
    },
    {
      id: 'slide-anat-4-2',
      slideNumber: 2,
      title: 'Cruciate Ligaments & Menisci Anatomy',
      subtitle: 'Biomechanics and Injury Patterns',
      category: 'anatomy_patho',
      bullets: [
        'ACL: Originates anterior intercondylar tibia → Inserts medial surface of lateral femoral condyle.',
        'PCL: Originates posterior intercondylar tibia → Inserts lateral surface of medial femoral condyle. Stronger and thicker than ACL.',
        'Medial Meniscus: C-shaped, attached firmly to MCL (frequently injured).',
        'Lateral Meniscus: O-shaped, more mobile, separated from LCL by popliteus tendon.',
      ],
      keyTakeaways: [
        'O\'Donoghue\'s Unholy Triad: ACL + MCL + Medial Meniscus (valgus trauma)',
      ],
    },
    {
      id: 'slide-anat-4-3',
      slideNumber: 3,
      title: 'Physical Diagnostic Tests of the Knee',
      subtitle: 'Gold-Standard Clinical Maneuvers',
      category: 'diagnostics',
      bullets: [
        'Lachman Test: Most sensitive test for ACL rupture (20-30 degrees flexion).',
        'Anterior Drawer Test: Assesses ACL translation at 90 degrees flexion.',
        'Posterior Sag Sign & Posterior Drawer: Diagnostic for PCL rupture (Dashboard injury).',
        'McMurray Test: External rotation + valgus = Medial Meniscus; Internal rotation + varus = Lateral Meniscus.',
      ],
      keyTakeaways: ['Lachman is more sensitive than Anterior Drawer due to lack of hamstring spasm.'],
    },
    {
      id: 'slide-anat-4-4',
      slideNumber: 4,
      title: 'Common Peroneal vs Tibial Nerve Lesions',
      subtitle: 'Motor & Sensory Loss Comparison',
      category: 'pharmacology_mgmt',
      bullets: [
        'Common Peroneal Nerve (L4-S2): Winds around fibular neck. Vulnerable to casts and fractures.',
        'Deficit: Loss of Dorsiflexion + Eversion → Foot Drop with high-steppage gait.',
        'Sensory Deficit: Anterolateral leg and dorsum of foot (1st web space by Deep Peroneal).',
        'Tibial Nerve (L4-S3): Popliteal fossa & deep posterior compartment.',
        'Deficit: Loss of Plantarflexion + Inversion → Inability to stand on tiptoes.',
      ],
      keyTakeaways: ['PED: Peroneal Everts and Dorsiflexes; TIP: Tibial Inverts and Plantarflexes'],
    },
    {
      id: 'slide-anat-4-5',
      slideNumber: 5,
      title: 'Popliteal Fossa & Pes Anserinus',
      subtitle: 'Surgical Spaces & Bursae',
      category: 'exam_traps',
      bullets: [
        'Popliteal Fossa Contents (Superficial to Deep): Tibial Nerve → Popliteal Vein → Popliteal Artery (NVA).',
        'Popliteus Muscle: Unlocks the knee by lateral rotation of femur on fixed tibia.',
        'Pes Anserinus Muscles: Sartorius (Femoral), Gracilis (Obturator), Semitendinosus (Sciatic).',
        'Suprapatellar Bursa: Communicates freely with knee joint cavity; primary site of arthrocentesis.',
      ],
      examTrapWarning: 'Never confuse Prepatellar bursitis (Housemaid\'s knee) with Infrapatellar bursitis (Clergyman\'s knee).',
    },
    {
      id: 'slide-anat-4-6',
      slideNumber: 6,
      title: 'Rapid Revision Comparison Table',
      subtitle: 'Knee Pathology Master Table',
      category: 'summary_table',
      bullets: [
        'High-yield summary table for quick 2-minute revision of knee and lower limb trauma.',
        'Review the key clinical discriminator test and vulnerable anatomical site before exam day.',
      ],
      quickTable: {
        headers: ['Condition / Structure', 'Mechanism / Site', 'Key Clinical Finding', 'Nerve / Root'],
        rows: [
          ['ACL Rupture', 'Valgus twisting blow', 'Lachman test positive, hemarthrosis', 'Tibial translation'],
          ['PCL Rupture', 'Dashboard impact', 'Posterior sag sign positive', 'P-M attachment'],
          ['Peroneal Nerve Injury', 'Fibular neck fracture', 'Foot drop, high steppage gait', 'L4, L5, S1'],
          ['Tibial Nerve Injury', 'Popliteal laceration', 'Loss of tiptoe stance, sole anesthesia', 'S1, S2'],
          ['Pes Anserinus', 'Overuse tendonitis', 'Medial joint line pain below joint', 'Sartorius, Gracilis, ST'],
        ],
      },
    },
  ],

  // Anatomy - Upper Limb Brachial Plexus
  'anat-1': [
    {
      id: 'slide-anat-1-1',
      slideNumber: 1,
      title: 'Brachial Plexus & Upper Limb Nerve Lesions',
      subtitle: 'Anatomy • FMGE High Priority Core',
      category: 'overview',
      bullets: [
        'Roots: C5, C6, C7, C8, T1 anterior rami.',
        'Trunks: Upper (C5-C6), Middle (C7), Lower (C8-T1).',
        'Cords: Lateral, Posterior, Medial (named relative to Axillary Artery).',
        'Terminal Branches: Musculocutaneous, Axillary, Radial, Median, Ulnar.',
      ],
      keyTakeaways: ['High exam yield: Erb palsy (upper trunk) vs Klumpke palsy (lower trunk).'],
    },
    {
      id: 'slide-anat-1-2',
      slideNumber: 2,
      title: 'Erb-Duchenne vs Klumpke Paralysis',
      subtitle: 'Traction Injuries & Deformities',
      category: 'anatomy_patho',
      bullets: [
        'Erb\'s Palsy (C5-C6): Excessive traction between head and shoulder (breech delivery, fall on shoulder).',
        'Posture: Policeman\'s / Waiter\'s Tip hand (Adducted, internally rotated, forearm pronated).',
        'Klumpke\'s Paralysis (C8-T1): Upward traction on hyperabducted arm (catching branch).',
        'Posture: Total Claw Hand (MCP hyperextension, IP flexion) + Ipsilateral Horner Syndrome.',
      ],
      keyTakeaways: ['Klumpke damages T1 sympathetic fibers → Ptosis, Miosis, Anhidrosis.'],
    },
    {
      id: 'slide-anat-1-3',
      slideNumber: 3,
      title: 'Radial, Median & Ulnar Nerve Syndromes',
      subtitle: 'Fracture Correlations & Hand Deformities',
      category: 'diagnostics',
      bullets: [
        'Radial Nerve: Midshaft humerus fracture / Saturday night palsy → Wrist Drop (loss of extension).',
        'Median Nerve: Supracondylar humerus fracture & Carpal Tunnel → Ape Thumb & Hand of Benediction.',
        'Ulnar Nerve: Medial epicondyle fracture & Guyon canal → Ulnar Claw Hand & positive Froment Sign.',
        'Axillary Nerve: Surgical neck humerus fracture → Deltoid muscle atrophy & regimental badge sensory loss.',
      ],
      examTrapWarning: 'Ulnar Paradox: High ulnar lesion (elbow) has LESS severe clawing than low ulnar lesion (wrist).',
    },
    {
      id: 'slide-anat-1-4',
      slideNumber: 4,
      title: 'Nerve Injury Master Summary Table',
      subtitle: 'Upper Limb Rapid Revision',
      category: 'summary_table',
      bullets: [
        'Comprehensive upper limb nerve injury comparison for FMGE clinical and image-based MCQs.',
        'Always check the exact fracture location to predict the corresponding peripheral nerve injury.',
      ],
      quickTable: {
        headers: ['Nerve', 'Vulnerable Location', 'Motor Deformity', 'Sensory Loss Area'],
        rows: [
          ['Radial', 'Spiral groove of humerus', 'Wrist drop, loss of finger extension', '1st dorsal web space (snuffbox)'],
          ['Ulnar', 'Medial epicondyle / Guyon canal', 'Claw hand, Froment sign', 'Medial 1.5 fingers (hypothenar)'],
          ['Median', 'Carpal tunnel / Supracondylar', 'Ape thumb, thenar atrophy', 'Lateral 3.5 fingers (palmar)'],
          ['Axillary', 'Surgical neck of humerus', 'Loss of arm abduction (15-90°)', 'Regimental badge area (lateral shoulder)'],
          ['Long Thoracic', 'Axillary lymph node dissection', 'Winged scapula (Serratus anterior)', 'No major cutaneous loss'],
        ],
      },
    },
  ],

  // Medicine - Cardiology
  'med-1': [
    {
      id: 'slide-med-1-1',
      slideNumber: 1,
      title: 'Cardiology: Arrhythmias & Acute Coronary Syndromes',
      subtitle: 'Medicine • High-Yield Emergency Protocols',
      category: 'overview',
      bullets: [
        'Tachyarrhythmias: Narrow complex (SVT, AFib, Flutter) vs Wide complex (VTach, WPW pre-excitation).',
        'Acute Coronary Syndrome: STEMI (transmural, immediate reperfusion) vs NSTEMI/UA (subendocardial).',
        'Right Ventricular MI: Inferior MI complication requiring volume resuscitation, NO nitrates.',
        'Heart Failure: Quadruple GDMT (ARNI/ACEi, Beta-blocker, MRA, SGLT2 inhibitor).',
      ],
      keyTakeaways: ['Immediate synchronized cardioversion for any unstable tachyarrhythmia with pulse.'],
    },
    {
      id: 'slide-med-1-2',
      slideNumber: 2,
      title: 'Tachyarrhythmias Emergency Management Protocol',
      subtitle: 'Adenosine, Amiodarone & Cardioversion',
      category: 'pharmacology_mgmt',
      bullets: [
        'Stable Narrow Regular SVT: Vagal maneuvers → IV Adenosine (6 mg rapid push, then 12 mg).',
        'Atrial Fibrillation: Rate control (Beta-blocker / Diltiazem) + DOAC anticoagulation (CHA2DS2-VASc >= 2/3).',
        'Stable Monomorphic VT: IV Amiodarone (150 mg over 10 min) or IV Procainamide.',
        'Unstable Tachycardia (Hypotension, Shock, Chest pain): Immediate Synchronized DC Cardioversion.',
        'Pulseless VT / VFib: Immediate Unsynchronized Defibrillation (CPR + Epinephrine + Amiodarone).',
      ],
      keyTakeaways: ['Adenosine has half-life < 10 sec; give via large antecubital vein with rapid saline flush.'],
    },
    {
      id: 'slide-med-1-3',
      slideNumber: 3,
      title: 'STEMI vs RVMI Management Traps',
      subtitle: 'Coronary Anatomy & Contraindicated Drugs',
      category: 'exam_traps',
      bullets: [
        'Inferior Wall STEMI: ST elevation in II, III, aVF (Right Coronary Artery RCA).',
        'Right Ventricular MI Triad: Hypotension + Elevated JVP + Clear Lung Fields.',
        'CONTRAINDICATED in RVMI: Nitroglycerin, Morphine, Diuretics (cause severe circulatory collapse).',
        'TREATMENT in RVMI: Rapid IV Isotonic Normal Saline volume expansion.',
      ],
      examTrapWarning: 'Never give nitrates or diuretics to a hypotensive patient with inferior STEMI before checking V4R lead.',
    },
    {
      id: 'slide-med-1-4',
      slideNumber: 4,
      title: 'Wolff-Parkinson-White (WPW) & Pre-excitation',
      subtitle: 'Accessory Pathway & Antidysrhythmics',
      category: 'diagnostics',
      bullets: [
        'ECG Triad: Short PR interval (<120 ms) + Delta wave (slurred QRS upstroke) + Wide QRS.',
        'Pathophysiology: Accessory pathway (Bundle of Kent) bypassing the AV node.',
        'Drug of Choice for WPW with AFib: IV Procainamide or Ibutilide.',
        'CONTRAINDICATED: AV nodal blocking agents (Adenosine, Digoxin, Verapamil, Beta-blockers) accelerate conduction down accessory pathway and trigger VFib.',
      ],
      keyTakeaways: ['Avoid AV nodal blockers in WPW with pre-excited Atrial Fibrillation.'],
    },
  ],

  // Medicine - Valvular Heart Diseases & Endocarditis
  'med-3': [
    {
      id: 'slide-med-3-1',
      slideNumber: 1,
      title: 'Infective Endocarditis & Modified Duke Criteria',
      subtitle: 'Cardiology • Diagnostic Workup & Stigmata',
      category: 'overview',
      bullets: [
        'Modified Duke Criteria: 2 Major OR 1 Major + 3 Minor OR 5 Minor = Definite IE.',
        'Major Criteria 1: Positive blood cultures (2 separate cultures with typical IE organisms: Viridans strep, S. bovis, HACEK, S. aureus, Enterococci).',
        'Major Criteria 2: Positive Echocardiogram (oscillating vegetation, abscess, new partial dehiscence of prosthetic valve, new regurgitant murmur).',
        'Minor Criteria: Predisposing heart condition/IVDA, Fever >= 38°C, Vascular phenomena (Janeway lesions, emboli, splinter hemorrhages), Immunologic phenomena (Osler nodes, Roth spots, RF, glomerulonephritis), Microbiologic evidence not meeting major.',
      ],
      keyTakeaways: ['Janeway lesions = Painless erythematous macules on palms/soles (vascular emboli).', 'Osler nodes = Painful nodules on finger/toe pads (immune complexes).'],
    },
    {
      id: 'slide-med-3-2',
      slideNumber: 2,
      title: 'Valvular Murmurs & Diagnostic Maneuvers',
      subtitle: 'Auscultation Pearls & Dynamic Changes',
      category: 'diagnostics',
      bullets: [
        'Mitral Stenosis: Loud S1 + Opening Snap (closer to S2 = more severe) + Mid-diastolic rumbling murmur with presystolic accentuation (lost in AFib).',
        'Aortic Stenosis: Harsh crescendo-decrescendo systolic murmur at right 2nd ICS radiating to carotids + Pulsus parvus et tardus + Soft/absent A2.',
        'Aortic Regurgitation: Early diastolic decrescendo murmur at left sternal border + Wide pulse pressure (Water-hammer / Corrigan pulse).',
        'Mitral Regurgitation: Holosystolic blowing murmur at apex radiating to left axilla + Soft S1.',
        'Mitral Valve Prolapse (MVP): Mid-systolic click followed by late systolic murmur (Valsalva moves click EARLIER).',
      ],
      examTrapWarning: 'All right-sided murmurs INCREASE with inspiration (Carvallo sign); left-sided murmurs increase with expiration.',
    },
    {
      id: 'slide-med-3-3',
      slideNumber: 3,
      title: 'Valvular Disease Quick Comparison Master Table',
      subtitle: 'FMGE High-Yield Summary',
      category: 'summary_table',
      bullets: [
        'Rapid reference guide for valvular heart disease murmurs, radiation patterns, and classic peripheral signs.',
      ],
      quickTable: {
        headers: ['Valvular Lesion', 'Murmur Timing & Character', 'Radiation', 'Classic Physical Signs'],
        rows: [
          ['Mitral Stenosis', 'Mid-diastolic rumble + Opening snap', 'Localized to apex', 'Malar flush, tapping apex beat'],
          ['Aortic Stenosis', 'Crescendo-decrescendo systolic', 'Carotid arteries', 'Pulsus parvus et tardus, SAD triad'],
          ['Aortic Regurgitation', 'Early diastolic decrescendo', 'Left sternal border', 'Corrigan pulse, de Musset sign, Duroziez sign'],
          ['Mitral Regurgitation', 'Holosystolic blowing murmur', 'Left axilla', 'Displaced hyperdynamic apex beat'],
        ],
      },
    },
  ],

  // Medicine - Pulmonology (Asthma & COPD)
  'med-4': [
    {
      id: 'slide-med-4-1',
      slideNumber: 1,
      title: 'Asthma vs COPD: Spirometry & Pathophysiology',
      subtitle: 'Pulmonology • FMGE High Priority Core',
      category: 'overview',
      bullets: [
        'Obstructive Defect: Post-bronchodilator FEV1/FVC < 0.70 in both conditions.',
        'Asthma Reversibility: Post-bronchodilator FEV1 increase > 12% AND > 200 mL confirms asthma.',
        'COPD Irreversibility: Airflow limitation is fixed with post-BD FEV1/FVC < 0.70.',
        'Diffusion Capacity (DLCO): Normal or elevated in Asthma; REDUCED in emphysematous COPD.',
      ],
      keyTakeaways: ['Reversible obstruction with normal DLCO = Asthma; Fixed obstruction with reduced DLCO = Emphysema.'],
    },
    {
      id: 'slide-med-4-2',
      slideNumber: 2,
      title: 'GINA 2023/2024 Guidelines: Stepwise Pharmacotherapy',
      subtitle: 'Track 1 (Preferred) vs Track 2',
      category: 'pharmacology_mgmt',
      bullets: [
        'Track 1 (Preferred): Low-dose ICS-Formoterol as single maintenance and reliever therapy (SMART / MART).',
        'Steps 1 & 2: As-needed low-dose ICS-formoterol alone (NO daily controller needed for mild symptoms).',
        'Step 3: Low-dose daily ICS-formoterol maintenance + as-needed reliever.',
        'Step 4: Medium-dose daily ICS-formoterol maintenance + as-needed reliever.',
        'Step 5: High-dose ICS-LABA + Add-on LAMA (Tiotropium) or Biologics (Anti-IgE Omalizumab, Anti-IL5 Mepolizumab).',
      ],
      examTrapWarning: 'SABA monotherapy without ICS is contraindicated due to increased risk of fatal asthma exacerbations.',
    },
    {
      id: 'slide-med-4-3',
      slideNumber: 3,
      title: 'GOLD 2023/2024 Guidelines & COPD Management',
      subtitle: 'ABE Groups & Proven Mortality Reducers',
      category: 'diagnostics',
      bullets: [
        'Group A (0-1 moderate exacerbations, mMRC 0-1, CAT < 10): Bronchodilator (SABA or LABA/LAMA).',
        'Group B (0-1 moderate exacerbations, mMRC >= 2, CAT >= 10): LABA + LAMA combination (e.g. Indacaterol/Glycopyrronium).',
        'Group E (>= 2 moderate exacerbations or >= 1 hospitalization): LABA + LAMA. Add Inhaled Steroid (Triple Therapy) if blood eosinophils >= 300 cells/uL.',
        'Mortality Reducers: (1) Smoking cessation (most effective), (2) Long-Term Oxygen Therapy (LTOT >= 15h/day), (3) Lung volume reduction surgery in select upper-lobe emphysema.',
      ],
      keyTakeaways: ['Only Smoking Cessation and LTOT demonstrate definitive survival improvement in COPD.'],
    },
    {
      id: 'slide-med-4-4',
      slideNumber: 4,
      title: 'Acute Severe Asthma (Status Asthmaticus) Emergency Protocol',
      subtitle: 'Ominous Signs & Escalation Sequence',
      category: 'exam_traps',
      bullets: [
        'Initial Therapy: High-flow Oxygen (target SpO2 93-95%) + Nebulized Salbutamol + Ipratropium Bromide + IV Hydrocortisone / Oral Prednisolone.',
        'Second-Line: IV Magnesium Sulfate (2 g over 20 min) for severe refractory bronchospasm.',
        'Ominous Signs of Respiratory Failure: "Silent Chest" (loss of wheezing due to severe air hunger), PaCO2 >= 42 mmHg (exhaustion), Altered sensorium.',
        'Intubation Indications: Coma, cardiorespiratory arrest, or worsening respiratory acidosis despite maximal therapy.',
      ],
      examTrapWarning: 'A PaCO2 of 40 mmHg in a breathless, tachypneic asthmatic represents impending respiratory arrest, NOT normocapnia.',
    },
    {
      id: 'slide-med-4-5',
      slideNumber: 5,
      title: 'Pulmonology Master Comparison Table',
      subtitle: 'Asthma vs COPD Quick Revision',
      category: 'summary_table',
      bullets: [
        'High-yield comparison table for rapid 1-minute exam day revision.',
      ],
      quickTable: {
        headers: ['Parameter', 'Bronchial Asthma', 'Chronic Obstructive Pulmonary Disease (COPD)'],
        rows: [
          ['Onset Age', 'Usually childhood / young adult (<40 yrs)', 'Typically older adults (>40-50 yrs, heavy smoking)'],
          ['Airflow Obstruction', 'Reversible (>12% and >200 mL FEV1 increase)', 'Fixed / Irreversible post-BD FEV1/FVC < 0.70'],
          ['DLCO Diffusion', 'Normal or Elevated', 'Significantly Reduced in Emphysema'],
          ['Inflammatory Cells', 'Eosinophils, CD4+ Th2, IL-4/IL-5/IL-13', 'Neutrophils, CD8+ cytotoxic T cells, Macrophages'],
          ['First-Line Controller', 'Inhaled Corticosteroid (ICS-Formoterol)', 'Long-Acting Bronchodilators (LAMA + LABA)'],
        ],
      },
    },
  ],

  // Pharmacology - Autonomic Drugs
  'pharm-1': [
    {
      id: 'slide-pharm-1-1',
      slideNumber: 1,
      title: 'Autonomic Pharmacology & Antidotes',
      subtitle: 'Pharmacology • FMGE High Priority Core',
      category: 'overview',
      bullets: [
        'Cholinergic (Parasympathetic): Acetylcholine acts on Muscarinic (M1-M5) and Nicotinic (Nm, Nn) receptors.',
        'Adrenergic (Sympathetic): Norepinephrine/Epinephrine act on Alpha (a1, a2) and Beta (b1, b2, b3) receptors.',
        'Antidotes: Atropine + Pralidoxime for organophosphates; Glucagon for beta-blockers; Sugammadex for rocuronium.',
      ],
      keyTakeaways: ['High focus on poisoning presentations and receptor selectivity.'],
    },
    {
      id: 'slide-pharm-1-2',
      slideNumber: 2,
      title: 'Organophosphate Poisoning & Antidotes',
      subtitle: 'Toxidrome & Management Sequence',
      category: 'pharmacology_mgmt',
      bullets: [
        'Pathophysiology: Irreversible inhibition of Acetylcholinesterase → massive ACh accumulation.',
        'DUMBBELLS Toxidrome: Diarrhea, Urination, Miosis, Bradycardia, Bronchorrhea, Emesis, Lacrimation, Salivation.',
        'Atropine: Antagonizes muscarinic receptors; end point of titration is CLEARING of lung secretions.',
        'Pralidoxime (2-PAM): Cleaves organophosphate from AChE before chemical aging occurs.',
      ],
      examTrapWarning: 'Carbamate poisoning does NOT cause aging; treat with Atropine ONLY (Pralidoxime contraindicated).',
    },
    {
      id: 'slide-pharm-1-3',
      slideNumber: 3,
      title: 'Adrenergic Receptors & Clinical Agonists',
      subtitle: 'Receptor Selectivity Master Rules',
      category: 'diagnostics',
      bullets: [
        'Alpha-1 (Gq): Vascular smooth muscle constriction (Phenylephrine, Midodrine).',
        'Alpha-2 (Gi): Presynaptic inhibition of NE release (Clonidine, Methyldopa).',
        'Beta-1 (Gs): Increased heart rate and contractility (Dobutamine).',
        'Beta-2 (Gs): Bronchodilation and uterine relaxation (Salbutamol, Terbutaline).',
      ],
      keyTakeaways: ['Beta-blocker toxicity antidote is IV Glucagon (bypasses beta receptors via adenylate cyclase).'],
    },
    {
      id: 'slide-pharm-1-4',
      slideNumber: 4,
      title: 'Anticholinergic Toxicity (Atropine Overdose)',
      subtitle: 'Classic Mnemonic & Physostigmine Antidote',
      category: 'exam_traps',
      bullets: [
        'Mnemonic: Hot as a hare (hyperthermia), Blind as a bat (mydriasis/cycloplegia), Dry as a bone (anhidrosis), Red as a beet (flushing), Mad as a hatter (delirium).',
        'Antidote: Physostigmine (tertiary amine that crosses Blood-Brain Barrier).',
        'CONTRAINDICATION: Do not give Physostigmine for TCA overdose with wide QRS (give Sodium Bicarbonate instead).',
      ],
      examTrapWarning: 'Neostigmine and Pyridostigmine are quaternary amines and DO NOT cross the blood-brain barrier.',
    },
  ],

  // OBGYN - Pre-eclampsia & MgSO4
  'obg-2': [
    {
      id: 'slide-obg-2-1',
      slideNumber: 1,
      title: 'Preeclampsia, Eclampsia & MgSO4 Regimens',
      subtitle: 'OBGYN • High-Yield Emergency Obstetrics',
      category: 'overview',
      bullets: [
        'Diagnostic criteria: BP >= 140/90 after 20 weeks gestation + Proteinuria (>= 300 mg/24h or 1+ dipstick).',
        'Severe Preeclampsia: BP >= 160/110, severe headache, visual scotomata, epigastric pain, pulmonary edema.',
        'Eclampsia: Preeclampsia complicated by generalized tonic-clonic convulsions.',
        'Drug of Choice for Seizure Prophylaxis and Treatment: Magnesium Sulfate (MgSO4).',
      ],
      keyTakeaways: ['Definitive cure for preeclampsia/eclampsia is DELIVERY of fetus and placenta.'],
    },
    {
      id: 'slide-obg-2-2',
      slideNumber: 2,
      title: 'Pritchard vs Zuspan Regimens',
      subtitle: 'MgSO4 Dosing & Monitoring',
      category: 'pharmacology_mgmt',
      bullets: [
        'Pritchard Regimen: 4 g IV (20% solution over 5 min) + 10 g IM (5 g in each buttock) loading dose.',
        'Maintenance: 5 g IM 4-hourly in alternate buttocks for 24h postpartum / post-seizure.',
        'Zuspan Regimen: 4 g IV loading + 1–2 g/hr continuous IV infusion.',
        'Prerequisites before each dose: (1) Patellar reflex present, (2) RR >= 12/min, (3) Urine output >= 30 mL/h.',
      ],
      examTrapWarning: 'Magnesium toxicity antidote is 10 mL of 10% Calcium Gluconate IV given over 10 minutes.',
    },
    {
      id: 'slide-obg-2-3',
      slideNumber: 3,
      title: 'Magnesium Toxicity Signs & Cut-offs',
      subtitle: 'Clinical Monitoring & Antidote',
      category: 'diagnostics',
      bullets: [
        'Serum level 8-10 mEq/L: Loss of Deep Tendon Reflexes (Patellar Reflex / Knee Jerk).',
        'Serum level >12 mEq/L: Respiratory depression and arrest (<12 breaths/min).',
        'Serum level >15 mEq/L: Cardiac conduction arrest (Asystole).',
        'Immediate Action: Stop MgSO4 and administer 10 mL 10% Calcium Gluconate IV slowly over 10 minutes.',
      ],
      keyTakeaways: ['Loss of patellar reflex is the earliest warning sign of toxicity.'],
    },
    {
      id: 'slide-obg-2-4',
      slideNumber: 4,
      title: 'Antihypertensive Protocols in Pregnancy',
      subtitle: 'Safe vs Contraindicated Drugs',
      category: 'pharmacology_mgmt',
      bullets: [
        'First-line Emergency Antihypertensives: IV Labetalol (20 mg bolus), IV Hydralazine, Oral Nifedipine.',
        'Maintenance Antihypertensive: Oral Methyldopa (alpha-2 agonist) or oral Labetalol.',
        'CONTRAINDICATED: ACE Inhibitors (Enalapril) and ARBs (Losartan) cause fetal renal dysgenesis and oligohydramnios.',
      ],
      examTrapWarning: 'Never give ACEi or ARBs to any pregnant female at any gestational age.',
    },
  ],

  // Anatomy - Thorax: Mediastinum, Heart & Coronary Circulation
  'anat-5': [
    {
      id: 'slide-anat-5-1',
      slideNumber: 1,
      title: 'Mediastinal Divisions & Critical Landmarks',
      subtitle: 'Thoracic Anatomy • FMGE Core',
      category: 'overview',
      bullets: [
        'Mediastinum is divided into Superior and Inferior by the Transverse Thoracic Plane (Sternal Angle of Louis to T4/T5 intervertebral disc).',
        'Inferior Mediastinum is further subdivided into Anterior, Middle, and Posterior compartments.',
        'Sternal Angle (Angle of Louis) marks: Tracheal bifurcation (carina), Aortic arch start/end, Azygos vein entry into SVC, and Thoracic duct crossing.',
      ],
      keyTakeaways: ['Transverse thoracic plane is at the level of T4-T5 intervertebral disc.'],
    },
    {
      id: 'slide-anat-5-2',
      slideNumber: 2,
      title: 'Mediastinal Contents & Compartments',
      subtitle: 'Anatomical Spaces and Differential Diagnoses',
      category: 'anatomy_patho',
      bullets: [
        'Superior Mediastinum: Thymus, Brachiocephalic veins, SVC, Arch of Aorta and 3 branches, Trachea, Esophagus, Thoracic Duct, Vagus & Phrenic nerves.',
        'Middle Mediastinum: Pericardium, Heart, Ascending Aorta, Pulmonary trunk, Phrenic nerves, Pericardiacophrenic vessels.',
        'Posterior Mediastinum (DATES): Descending aorta, Azygos & Hemiazygos veins, Thoracic duct, Esophagus, Sympathetic trunks.',
        'Anterior Mediastinum: Thymic remnants, Internal thoracic lymph nodes, fat (site of Anterior Mediastinal Masses: 4Ts - Thymoma, Teratoma, Thyroid, Terrible lymphoma).',
      ],
      keyTakeaways: ['Posterior mediastinum mnemonic = DATES.'],
    },
    {
      id: 'slide-anat-5-3',
      slideNumber: 3,
      title: 'Coronary Arteries & Territorial Supply',
      subtitle: 'RCA vs LCA Clinical Distribution',
      category: 'diagnostics',
      bullets: [
        'Right Coronary Artery (RCA): Arises from anterior aortic sinus. Gives SA nodal artery (60%), Acute Marginal artery, AV nodal artery (90%), and PDA (85%).',
        'Left Coronary Artery (LCA): Arises from left posterior aortic sinus. Bifurcates into LAD and LCx.',
        'Left Anterior Descending (LAD): Anterior 2/3 of interventricular septum, anterior LV wall, and cardiac apex (most commonly occluded).',
        'Left Circumflex (LCx): Lateral LV free wall; gives Obtuse Marginal branch and SA nodal artery in 40%.',
      ],
      examTrapWarning: 'Coronary dominance is defined by the artery giving rise to the PDA (Posterior Descending Artery). 85% of humans are Right Dominant.',
    },
    {
      id: 'slide-anat-5-4',
      slideNumber: 4,
      title: 'Cardiac Conduction Blood Supply & MI Traps',
      subtitle: 'Nodal Ischemia & Preload Dependence',
      category: 'exam_traps',
      bullets: [
        'SA Node Blood Supply: 60% RCA, 40% LCx.',
        'AV Node Blood Supply: 90% RCA, 10% LCx.',
        'Inferior Wall STEMI (leads II, III, aVF) is caused by RCA occlusion and often presents with bradyarrhythmias and AV blocks.',
        'Right Ventricular MI (V4R ST elevation): Preload dependent! Give IV Isotonic Normal Saline; Nitrates and Diuretics are CONTRAINDICATED.',
      ],
      examTrapWarning: 'Never administer Nitrates to an Inferior STEMI patient without checking lead V4R for RV involvement.',
    },
    {
      id: 'slide-anat-5-5',
      slideNumber: 5,
      title: 'Pericardial Spaces, Beck\'s Triad & Pericardiocentesis',
      subtitle: 'Clinical Correlations & Emergency Procedures',
      category: 'pharmacology_mgmt',
      bullets: [
        'Transverse Sinus of Theile: Behind Ascending Aorta and Pulmonary trunk, in front of SVC (used for clamping great vessels in bypass surgery).',
        'Oblique Sinus: Cul-de-sac behind left atrium, bounded by pulmonary veins.',
        'Cardiac Tamponade Triad of Beck: Hypotension + Elevated JVP + Muffled Heart Sounds.',
        'Pericardiocentesis: Subxiphoid Larrey approach (between xiphoid process and left 7th costal cartilage at 45° angled toward left shoulder).',
      ],
      keyTakeaways: ['Larrey space subxiphoid puncture avoids the internal thoracic vessels and pleural cavity.'],
    },
  ],

  // Pathology - Neoplasia
  'path-4': [
    {
      id: 'slide-path-4-1',
      slideNumber: 1,
      title: 'Hallmarks of Cancer & Molecular Oncology',
      subtitle: 'Pathology • FMGE High Priority Core',
      category: 'overview',
      bullets: [
        'Eight Hallmarks of Cancer: Self-sufficiency in growth signals, Insensitivity to growth-inhibitory signals, Altered cellular metabolism (Warburg effect), Evasion of apoptosis, Limitless replicative potential (Telomerase), Sustained angiogenesis (VEGF), Invasion & Metastasis, Evasion of immune destruction.',
        'Proto-oncogenes require only ONE mutated allele (gain of function) to drive neoplastic transformation.',
        'Tumor suppressor genes require TWO mutated alleles (Knudson two-hit hypothesis / loss of function).',
      ],
      keyTakeaways: ['Warburg Effect = Aerobic glycolysis (glucose -> lactate even in presence of oxygen).'],
    },
    {
      id: 'slide-path-4-2',
      slideNumber: 2,
      title: 'Tumor Suppressor Genes & Clinical Syndromes',
      subtitle: 'TP53, RB1, APC, BRCA, WT1, NF1/2',
      category: 'anatomy_patho',
      bullets: [
        'TP53 (17p): "Guardian of the genome." Arrests cell cycle at G1/S via p21 or triggers BAX apoptosis. Mutation cause Li-Fraumeni syndrome (Sarcoma, Breast, Brain, Adrenal).',
        'RB1 (13q): Retinoblastoma and Osteosarcoma. Hypophosphorylated RB binds E2F and prevents G1->S progression.',
        'APC (5q): Regulates beta-catenin degradation. Mutation leads to Familial Adenomatous Polyposis (FAP).',
        'BRCA1 (17q) & BRCA2 (13q): DNA homologous recombination repair (Breast and Ovarian carcinomas).',
        'VHL (3p): Degrades HIF-1alpha. Mutation causes Von Hippel-Lindau syndrome (Renal cell carcinoma, Hemangioblastomas, Pheochromocytoma).',
      ],
      keyTakeaways: ['TP53 is the most common mutated gene in all human cancers.'],
    },
    {
      id: 'slide-path-4-3',
      slideNumber: 3,
      title: 'Chromosomal Translocations in Neoplasia',
      subtitle: 'Classic FMGE Cytogenetic Buzzwords',
      category: 'diagnostics',
      bullets: [
        't(9;22) BCR-ABL (Philadelphia chromosome): Chronic Myeloid Leukemia (CML) and ALL; treated with Imatinib.',
        't(8;14) c-MYC-IgH: Burkitt Lymphoma ("starry sky" appearance).',
        't(14;18) BCL2-IgH: Follicular Lymphoma (overexpression of anti-apoptotic BCL2).',
        't(11;14) Cyclin D1-IgH: Mantle Cell Lymphoma.',
        't(15;17) PML-RARA: Acute Promyelocytic Leukemia (APML - M3); treated with All-Trans Retinoic Acid (ATRA).',
        't(11;22): Ewing Sarcoma (small round blue cells, onion-skin periosteal reaction).',
      ],
      examTrapWarning: 'APML t(15;17) has high risk of DIC; urgent treatment with ATRA is curative.',
    },
    {
      id: 'slide-path-4-4',
      slideNumber: 4,
      title: 'Tumor Markers & Clinical Applications',
      subtitle: 'Screening, Monitoring & Staging',
      category: 'pharmacology_mgmt',
      bullets: [
        'Alpha-fetoprotein (AFP): Hepatocellular Carcinoma, Non-seminomatous Germ Cell Tumors (Yolk sac tumor).',
        'CEA (Carcinoembryonic Antigen): Colorectal Carcinoma (primarily for recurrence monitoring).',
        'CA-125: Epithelial Ovarian Carcinoma.',
        'CA 19-9: Pancreatic and Cholangiocarcinoma.',
        'Calcitonin: Medullary Thyroid Carcinoma (derived from parafollicular C cells, MEN 2).',
        'Beta-hCG: Choriocarcinoma and Hydatidiform Mole.',
        'S-100: Melanoma, Schwannoma, Langerhans Cell Histiocytosis.',
      ],
      keyTakeaways: ['Tumor markers are primarily used for MONITORING RESPONSE TO THERAPY and recurrence, not initial definitive diagnosis.'],
    },
  ],

  // =================== BIOCHEMISTRY ===================
  'bio-1': [
    {
      id: 'slide-bio-1-1',
      slideNumber: 1,
      title: 'Michaelis-Menten Kinetics, Km & Vmax',
      subtitle: 'Enzyme Kinetics & Substrate Affinity',
      category: 'overview',
      bullets: [
        'Michaelis-Menten Equation: V0 = (Vmax · [S]) / (Km + [S]).',
        'Km (Michaelis Constant): Substrate concentration at which velocity is half-maximal (1/2 Vmax).',
        'Km is inversely proportional to enzyme-substrate affinity: Lower Km = Higher affinity; Higher Km = Lower affinity.',
        'Vmax: Maximum reaction velocity achieved when all enzyme active sites are saturated with substrate.',
        'At [S] << Km: Reaction is First-Order (rate is directly proportional to substrate concentration).',
        'At [S] >> Km: Reaction is Zero-Order (rate is constant and independent of substrate concentration).',
      ],
      keyTakeaways: ['Km is an intrinsic constant for a given enzyme-substrate pair and is independent of enzyme concentration.'],
    },
    {
      id: 'slide-bio-1-2',
      slideNumber: 2,
      title: 'Lineweaver-Burk Double-Reciprocal Plot',
      subtitle: 'Graphical Analysis of Enzyme Kinetics',
      category: 'diagnostics',
      bullets: [
        'Equation: 1/V0 = (Km/Vmax) · (1/[S]) + (1/Vmax), derived from taking reciprocal of Michaelis-Menten equation.',
        'y-intercept = 1 / Vmax (point where line intersects the vertical y-axis at 1/[S] = 0).',
        'x-intercept = -1 / Km (point where line intersects the horizontal x-axis at 1/V0 = 0).',
        'Slope of the line = Km / Vmax.',
        'A higher y-intercept corresponds to a LOWER Vmax.',
        'An x-intercept closer to zero (less negative) corresponds to a HIGHER Km (lower affinity).',
      ],
      keyTakeaways: ['Lineweaver-Burk plots linearize hyperbolic Michaelis-Menten curves into a straight line (y = mx + c).'],
    },
    {
      id: 'slide-bio-1-3',
      slideNumber: 3,
      title: 'Competitive vs Noncompetitive vs Uncompetitive Inhibition',
      subtitle: 'Inhibition Patterns & Lineweaver-Burk Graphs',
      category: 'anatomy_patho',
      bullets: [
        'Competitive Inhibition: Inhibitor binds active site. Km INCREASES (shifts right / closer to 0), Vmax UNCHANGED. Overcome by adding excess substrate.',
        'Noncompetitive Inhibition: Inhibitor binds allosteric site (different from active site). Km UNCHANGED, Vmax DECREASES (shifts y-intercept upward). Cannot be overcome by substrate.',
        'Uncompetitive Inhibition: Inhibitor binds ONLY to the Enzyme-Substrate (ES) complex. BOTH Km and Vmax DECREASE by same proportion → Parallel Lineweaver-Burk lines.',
        'Irreversible Inhibition: Covalent modification of active site (e.g. Aspirin on COX, Organophosphates on AChE). Permanently reduces functional enzyme pool (acts like noncompetitive kinetics).',
      ],
      quickTable: {
        headers: ['Inhibition Type', 'Km Effect', 'Vmax Effect', 'Lineweaver-Burk Shift'],
        rows: [
          ['Competitive', 'Increases (↑)', 'Unchanged', 'Lines intersect on y-axis (same y-intercept)'],
          ['Noncompetitive', 'Unchanged', 'Decreases (↓)', 'Lines intersect on x-axis (same x-intercept)'],
          ['Uncompetitive', 'Decreases (↓)', 'Decreases (↓)', 'Parallel lines (same slope Km/Vmax)'],
        ],
      },
    },
    {
      id: 'slide-bio-1-4',
      slideNumber: 4,
      title: 'Pharmacological & Clinical Enzyme Inhibitors',
      subtitle: 'High-Yield Medical Examples',
      category: 'pharmacology_mgmt',
      bullets: [
        'Statins (Atorvastatin, Rosuvastatin): Competitive reversible inhibitors of HMG-CoA reductase (cholesterol synthesis).',
        'Methotrexate: Competitive inhibitor of Dihydrofolate Reductase (DHFR) in DNA nucleotide synthesis.',
        'Allopurinol: Competitive suicide inhibitor of Xanthine Oxidase (uric acid synthesis in Gout).',
        'Physostigmine / Neostigmine: Reversible carbamate inhibitors of Acetylcholinesterase (AChE).',
        'Lead Poisoning: Noncompetitive inhibitor of Ferrochelatase and ALA dehydratase (heme synthesis).',
      ],
      keyTakeaways: ['High-dose folate can overcome methotrexate inhibition; leucovorin (folinic acid) bypasses DHFR completely.'],
    },
    {
      id: 'slide-bio-1-5',
      slideNumber: 5,
      title: 'FMGE Traps & Calculation Pearls',
      subtitle: 'Avoid Common Examiner Traps',
      category: 'exam_traps',
      bullets: [
        'Exam Trap: Confusing Km with Affinity. A drug with Km = 2 μM has HIGHER affinity than a drug with Km = 20 μM.',
        'Exam Trap: If [S] = Km, reaction velocity V0 is EXACTLY 50% of Vmax (1/2 Vmax).',
        'Exam Trap: Competitive inhibitors do NOT change Vmax because infinite substrate outcompetes the inhibitor.',
        'Exam Trap: Double-reciprocal slope calculation = (y-intercept) / |x-intercept| = (1/Vmax) / (1/Km) = Km / Vmax.',
      ],
      examTrapWarning: 'If Lineweaver-Burk lines cross at the vertical y-axis, the inhibition is COMPETITIVE. If they cross at the negative horizontal x-axis, it is NONCOMPETITIVE.',
    },
  ],

  // =================== PHARMACOLOGY - BETA BLOCKERS ===================
  'pharm-2': [
    {
      id: 'slide-pharm-2-1',
      slideNumber: 1,
      title: 'Adrenergic Agonists & Beta Blockers',
      subtitle: 'Pharmacology • Receptor Subtypes & Drug Classification',
      category: 'overview',
      bullets: [
        'Beta-1 Receptors (Gs): Located in heart (SA/AV node, myocardium) & juxtaglomerular cells (renin release). Increases HR, contractility, and conduction velocity.',
        'Beta-2 Receptors (Gs): Located in bronchial smooth muscle (bronchodilation), vascular smooth muscle (vasodilation), and liver (glycogenolysis).',
        'Cardioselective Beta-1 Blockers (AMEBA): Atenolol, Metoprolol, Esmolol (ultra-short acting, t1/2 ~9 min), Bisoprolol, Acebutolol.',
        'Non-selective Beta Blockers (Beta-1 + Beta-2): Propranolol (lipophilic, crosses BBB → essential tremor, migraine prophylaxis), Timolol (glaucoma), Nadolol (variceal bleed prophylaxis).',
        'Alpha + Beta Blockers: Labetalol (DOC in pregnancy preeclampsia & aortic dissection) and Carvedilol (antioxidant, mortality benefit in HFrEF).',
      ],
      keyTakeaways: ['AMEBA mnemonic = Atenolol, Metoprolol, Esmolol, Bisoprolol, Acebutolol (Cardioselective Beta-1).'],
    },
    {
      id: 'slide-pharm-2-2',
      slideNumber: 2,
      title: 'Clinical Indications, Contraindications & Antidote',
      subtitle: 'Evidence-Based Indications & Toxicity Management',
      category: 'pharmacology_mgmt',
      bullets: [
        'Indications: Post-MI (reduces ventricular remodeling and sudden cardiac death), HFrEF (Carvedilol, Metoprolol succinate, Bisoprolol), Hypertension, Angina, Thyrotoxicosis, Pheochromocytoma (ALWAYS give Alpha blocker first!).',
        'Contraindications: Severe Asthma/COPD (bronchospasm via Beta-2 blockade), 2nd/3rd degree AV Block, Cardiogenic shock, Decompensated Acute Heart Failure, Raynaud phenomenon.',
        'Exam Trap: Giving a non-selective Beta blocker in Pheochromocytoma BEFORE Alpha blockade causes lethal unopposed Alpha-1 vasoconstriction hypertensive crisis.',
        'Beta Blocker Overdose: Bradycardia, hypotension, hypoglycemia, altered mental status.',
        'Antidote of Choice: Intravenous GLUCAGON (stimulates adenylyl cyclase via Gs bypass, increasing cAMP and cardiac inotropy/chronotropy).',
      ],
      keyTakeaways: ['Glucagon is the antidote for Beta-blocker overdose; Atropine and IV fluids are initial supportive measures.'],
    },
  ],

  // =================== PATHOLOGY - HODGKIN LYMPHOMA ===================
  'path-8': [
    {
      id: 'slide-path-8-1',
      slideNumber: 1,
      title: 'Hodgkin Lymphoma & Reed-Sternberg Cells',
      subtitle: 'Hematopathology • Diagnostic Criteria & Subtypes',
      category: 'overview',
      bullets: [
        'Hodgkin Lymphoma is characterized by giant binucleated Reed-Sternberg (RS) cells ("owl-eye" appearance with prominent eosinophilic nucleoli).',
        'Immunophenotype of Classic Reed-Sternberg Cells: CD15 (+) and CD30 (+); CD45 (-) and CD20 (-).',
        'Subtypes of Classic Hodgkin Lymphoma: (1) Nodular Sclerosis (most common ~70%, lacunar cells, collagen bands, young females), (2) Mixed Cellularity (EBV associated, eosinophils), (3) Lymphocyte-Rich (best prognosis), (4) Lymphocyte-Depleted (worst prognosis, HIV/elderly).',
        'Non-Classic Subtype: Nodular Lymphocyte-Predominant (NLPHL) with "Popcorn cells" (L&H cells) → CD20 (+), CD45 (+), CD15 (-), CD30 (-).',
        'Clinical Presentation: Painless non-tender cervical/mediastinal lymphadenopathy, Pel-Ebstein fever, alcohol-induced lymph node pain, and B-symptoms (fever, drenching night sweats, >10% weight loss).',
      ],
      keyTakeaways: ['Classic Hodgkin RS cells are CD15(+) and CD30(+). Popcorn cells in NLPHL are CD20(+) and CD45(+).'],
    },
    {
      id: 'slide-path-8-2',
      slideNumber: 2,
      title: 'Ann Arbor Staging & ABVD Chemotherapy Protocol',
      subtitle: 'Clinical Staging & Standard First-Line Regimen',
      category: 'pharmacology_mgmt',
      bullets: [
        'Ann Arbor Stage I: Single lymph node region or single extralymphatic site.',
        'Ann Arbor Stage II: Two or more lymph node regions on the SAME side of the diaphragm.',
        'Ann Arbor Stage III: Lymph node regions on BOTH sides of the diaphragm (may include spleen Stage III-S).',
        'Ann Arbor Stage IV: Diffuse or disseminated involvement of one or more extralymphatic organs (liver, bone marrow, lungs).',
        'Standard Chemotherapy Regimen: ABVD (Adriamycin/Doxorubicin - cardiotoxicity, Bleomycin - pulmonary fibrosis, Vinblastine - peripheral neuropathy, Dacarbazine - myelosuppression).',
      ],
      keyTakeaways: ['Bleomycin toxicity manifests as pulmonary fibrosis (monitor DLCO); Doxorubicin causes dilated cardiomyopathy (monitor LVEF).'],
    },
  ],

  // =================== PHYSIOLOGY - ACTION POTENTIAL ===================
  'phys-2': [
    {
      id: 'slide-phys-2-1',
      slideNumber: 1,
      title: 'Membrane Potentials & Action Potential Biophysics',
      subtitle: 'Nerve-Muscle Physiology • Ion Gradients & Refractory Periods',
      category: 'overview',
      bullets: [
        'Resting Membrane Potential (RMP): -70 mV in nerve axons, -90 mV in skeletal muscle. Established by high resting K+ permeability (K+ leak channels) and maintained by electrogenic Na+/K+ ATPase (pumps 3 Na+ out, 2 K+ in).',
        'Nernst Equilibrium Potentials: E_Na = +60 mV, E_K = -90 mV, E_Cl = -70 mV, E_Ca = +125 mV.',
        'Depolarization (Phase 0): Opening of voltage-gated Na+ channels (inflow of Na+ towards E_Na). Blocked by Tetrodotoxin (TTX) from pufferfish and Saxitoxin.',
        'Repolarization: Inactivation of Na+ channels (inactivation gate closes) and opening of voltage-gated K+ channels (K+ outflow). Blocked by Tetraethylammonium (TEA).',
        'Hyperpolarization: Delayed closure of K+ channels bringing membrane potential transiently closer to E_K (-90 mV).',
        'Absolute Refractory Period: From threshold to early repolarization; Na+ channels are in closed-inactivated state. No stimulus can trigger another AP.',
        'Relative Refractory Period: Elevated threshold during late repolarization/hyperpolarization; strong suprathreshold stimulus can generate a second AP.',
      ],
      keyTakeaways: ['Absolute refractory period sets the upper limit for action potential firing frequency and ensures unidirectional conduction.'],
    },
  ],
};

/**
 * Generates an exam-oriented visual crash course module for any FMGE topic.
 */
export function generateSlideDeck(
  subjectId: string,
  topicId: string,
  topicName?: string
): SlideDeck {
  const topicIntel: NormalizedTopicIntelligence = getNormalizedTopicIntelligence(subjectId, topicId, topicName);
  const key = topicId;
  const verifiedSlides = VERIFIED_TOPIC_SLIDES[key] || [];

  if (VERIFIED_TOPIC_SLIDES[key] && VERIFIED_TOPIC_SLIDES[key].length > 0) {
    return {
      topicId,
      topicName: topicIntel.canonicalName,
      subjectId,
      subjectName: topicIntel.subjectName,
      slides: VERIFIED_TOPIC_SLIDES[key],
    };
  }

  // Dynamic Topic-Type-Aware Slide Generation
  const dynamicSlides: VisualSlideItem[] = [];

  switch (topicIntel.topicType) {
    case 'biochemical_concept':
      dynamicSlides.push(
        {
          id: `slide-${topicId}-1`,
          slideNumber: 1,
          title: `${topicIntel.canonicalName} — Fundamentals & Kinetic Principles`,
          subtitle: `${topicIntel.subjectName} • FMGE Biochemical Review`,
          category: 'overview',
          bullets: [
            `Core molecular mechanism: ${topicIntel.conceptClusters[0] || 'Enzymatic kinetics and substrate binding equilibria'}.`,
            `Rate-limiting steps & cofactors: ${topicIntel.conceptClusters[1] || 'Regulatory allosteric controls and coenzyme requirements'}.`,
            'Kinetic parameters: Master the mathematical relationship between Km, Vmax, and substrate saturation.',
            'High-frequency FMGE exam focus on graphical transformations and enzyme modulation.',
          ],
          keyTakeaways: [`Understand intrinsic enzyme affinity (Km) and maximal catalytic velocity (Vmax).`],
        },
        {
          id: `slide-${topicId}-2`,
          slideNumber: 2,
          title: 'Lineweaver-Burk & Graphical Transformations',
          subtitle: 'Double-Reciprocal Plot Diagnostics',
          category: 'diagnostics',
          bullets: [
            'Double-reciprocal equation: 1/V0 = (Km/Vmax) · (1/[S]) + (1/Vmax).',
            'x-intercept = -1 / Km (reflects substrate affinity; closer to zero = higher Km).',
            'y-intercept = 1 / Vmax (reflects maximal reaction capacity; higher intercept = lower Vmax).',
            'Slope of line = Km / Vmax.',
          ],
          keyTakeaways: ['Graphical analysis allows rapid visual identification of inhibition mechanisms.'],
        },
        {
          id: `slide-${topicId}-3`,
          slideNumber: 3,
          title: 'Inhibition Patterns & Clinical Pharmacology',
          subtitle: 'Competitive, Noncompetitive & Uncompetitive Mechanisms',
          category: 'anatomy_patho',
          bullets: [
            'Competitive Inhibition: ↑Km, unchanged Vmax (overcome by adding substrate). E.g. Statins, Methotrexate.',
            'Noncompetitive Inhibition: Unchanged Km, ↓Vmax (allosteric binding). E.g. Heavy metals, Lead.',
            'Uncompetitive Inhibition: ↓Km, ↓Vmax (binds ES complex only). Parallel Lineweaver-Burk lines.',
            'Irreversible Inhibition: Covalent active site binding (e.g. Aspirin, Organophosphates).',
          ],
          quickTable: {
            headers: ['Inhibition Mechanism', 'Km Change', 'Vmax Change', 'Lineweaver-Burk Intercepts'],
            rows: [
              ['Competitive', 'Increases (↑)', 'Unchanged', 'Same y-intercept (1/Vmax)'],
              ['Noncompetitive', 'Unchanged', 'Decreases (↓)', 'Same x-intercept (-1/Km)'],
              ['Uncompetitive', 'Decreases (↓)', 'Decreases (↓)', 'Parallel lines (same slope)'],
            ],
          },
        },
        {
          id: `slide-${topicId}-4`,
          slideNumber: 4,
          title: 'FMGE Traps & High-Yield Calculations',
          subtitle: 'Examiner Pitfalls & Buzzwords',
          category: 'exam_traps',
          bullets: [
            'Never confuse Km with affinity: Lower Km indicates HIGHER substrate affinity.',
            'At [S] = Km, the reaction rate is exactly half of Vmax (1/2 Vmax).',
            'Competitive inhibitors shift the Lineweaver-Burk plot to the right.',
          ],
          examTrapWarning: 'Distinguish between reversible competitive inhibitors (overcome by substrate) and irreversible suicide inhibitors.',
        }
      );
      break;

    case 'anatomical_structure':
      // Region-aware slide generation: only limb/nerve topics feature characteristic
      // peripheral-nerve posture examples; abdomen/embryology/thorax/pelvis/head-neck
      // topics must never receive cross-regional nerve-lesion content.
      const isNeuromuscularRegion =
        /upper limb|lower limb|knee|brachial|plexus|nerve|peroneal|tibial|radial|ulnar|median|femoral|hand|foot/i.test(topicIntel.canonicalName);
      dynamicSlides.push(
        {
          id: `slide-${topicId}-1`,
          slideNumber: 1,
          title: `${topicIntel.canonicalName} — Anatomical Organization`,
          subtitle: `${topicIntel.subjectName} • Surgical & Regional Anatomy`,
          category: 'overview',
          bullets: [
            `Topographical landmarks: ${topicIntel.conceptClusters[0] || 'Anatomical boundaries and fascial compartments'}.`,
            `Neurovascular bundle relations: ${topicIntel.conceptClusters[1] || 'Arterial, venous, and neural courses'}.`,
            'Mastering anatomical spaces, fascial sheaths, and muscular attachments.',
            'High-frequency FMGE image-based cross-sections and clinical trauma correlations.',
          ],
          keyTakeaways: ['Memorize neurovascular relations from superficial to deep in this region.'],
        },
        {
          id: `slide-${topicId}-2`,
          slideNumber: 2,
          title: 'Innervation, Blood Supply & Functional Mechanics',
          subtitle: 'Regional Distribution & Autonomous Zones',
          category: 'anatomy_patho',
          bullets: [
            'Motor branches: Muscle innervation and classic functional deficits.',
            'Sensory dermatomes: Cutaneous nerve distributions and autonomous sensory zones.',
            'Collateral arterial anastomoses and vulnerability to ischemic necrosis.',
          ],
          keyTakeaways: ['Identify autonomous sensory testing zones for individual peripheral nerves.'],
        },
        {
          id: `slide-${topicId}-3`,
          slideNumber: 3,
          title: isNeuromuscularRegion ? 'Clinical Lesions, Nerve Entrapments & Surgical Traps' : 'Regional Clinical Correlations & Surgical Traps',
          subtitle: isNeuromuscularRegion ? 'High-Yield Postures & Signs' : 'Topographical Correlates',
          category: 'exam_traps',
          bullets: isNeuromuscularRegion
            ? [
                'Characteristic clinical deformities (e.g. wrist drop, claw hand, foot drop, winged scapula).',
                'Surgical neck, shaft, and joint fracture associations.',
                'Entrapment points across fibro-osseous canals.',
              ]
            : [
                'Peritoneal/visceral relations, spaces, and their clinical relevance.',
                'Surgical approaches and high-yield access routes.',
                'Vascular territories and their pathological sequelae.',
              ],
          ...(isNeuromuscularRegion
            ? { examTrapWarning: 'Always evaluate proximal vs distal nerve lesions; distal lesions exhibit paradoxical worsening of deformities.' }
            : { examTrapWarning: 'Map the regional anatomy to its applied surgical and pathological correlations for FMGE.' }),
        }
      );
      break;

    case 'pharmacological_class':
      dynamicSlides.push(
        {
          id: `slide-${topicId}-1`,
          slideNumber: 1,
          title: `${topicIntel.canonicalName} — Mechanisms & Receptors`,
          subtitle: `${topicIntel.subjectName} • Drug Class Review`,
          category: 'overview',
          bullets: [
            `Primary receptor target: ${topicIntel.conceptClusters[0] || 'Receptor selectivity and second messenger signaling'}.`,
            `Pharmacodynamic actions: ${topicIntel.conceptClusters[1] || 'Cardiovascular, autonomic, and organ effects'}.`,
            'Classification of prototype agents, cardioselectivity, and duration of action.',
          ],
          keyTakeaways: ['Distinguish between selective and non-selective receptor antagonists.'],
        },
        {
          id: `slide-${topicId}-2`,
          slideNumber: 2,
          title: 'Clinical Indications & First-Line Protocols',
          subtitle: 'Evidence-Based Pharmacotherapy',
          category: 'pharmacology_mgmt',
          bullets: [
            'Approved guideline indications and mortality-benefit clinical trials.',
            'Dosing protocols, acute emergency administration vs chronic maintenance therapy.',
            'Special population considerations (pregnancy, renal impairment, elderly).',
          ],
          keyTakeaways: ['Know the specific agent of choice for pregnancy-induced disorders and emergencies.'],
        },
        {
          id: `slide-${topicId}-3`,
          slideNumber: 3,
          title: 'Contraindications, Adverse Reactions & Antidotes',
          subtitle: 'Toxicity Management & Drug Interactions',
          category: 'exam_traps',
          bullets: [
            'Absolute contraindications (e.g. bronchospasm, heart block, unopposed alpha-vasoconstriction).',
            'Important drug-drug interactions and CYP450 metabolism.',
            'Specific toxicity reversal protocols and antidotes of choice.',
          ],
          examTrapWarning: 'Never administer non-selective agents in active bronchospasm or high-degree AV block.',
        }
      );
      break;

    case 'clinical_disease':
    default: {
      const kb = getMedicalTopicKnowledge(subjectId, topicId, topicName || topicIntel.canonicalName);
      dynamicSlides.push(
        {
          id: `slide-${topicId}-1`,
          slideNumber: 1,
          title: `${topicIntel.canonicalName} — High-Yield Clinical Core`,
          subtitle: `${topicIntel.subjectName} • FMGE Core Blueprint`,
          category: 'overview',
          bullets: kb.coreConcepts.slice(0, 4),
          keyTakeaways: kb.keyTakeaways.length > 0 ? [kb.keyTakeaways[0]] : [kb.highYieldSummary],
          examTrapWarning: kb.examTrap,
        },
        {
          id: `slide-${topicId}-2`,
          slideNumber: 2,
          title: 'Diagnostic Algorithm & Gold Standard',
          subtitle: 'Best Initial vs Confirmatory Modalities',
          category: 'diagnostics',
          bullets: [
            `Gold-Standard Test: ${kb.goldStandardTest}`,
            `Classic Presentation: ${kb.classicPresentation}`,
            `Core Discriminators: ${kb.keyTakeaways[0] || 'Prioritize definitive diagnostic confirmation over non-specific screening.'}`,
          ],
          keyTakeaways: [kb.goldStandardTest],
        },
        {
          id: `slide-${topicId}-3`,
          slideNumber: 3,
          title: 'Guideline Management & Stepwise Regimens',
          subtitle: 'Evidence-Based Interventions',
          category: 'pharmacology_mgmt',
          bullets: [
            `First-Line Management: ${kb.firstLineTreatment}`,
            `High-Yield Clinical Takeaways: ${kb.keyTakeaways[1] || 'Guideline-directed medical therapy.'}`,
            `Common Pitfalls & Traps: ${kb.examTrap}`,
          ],
          keyTakeaways: [kb.firstLineTreatment],
          examTrapWarning: kb.examTrap,
        },
        {
          id: `slide-${topicId}-4`,
          slideNumber: 4,
          title: 'FMGE Exam Traps & Lookalike Differentials',
          subtitle: 'Clinical Vignette Discriminators',
          category: 'exam_traps',
          bullets: [
            `Top Exam Trap: ${kb.examTrap}`,
            `Diagnostic Discriminator: ${kb.keyTakeaways[0] || 'Differentiate primary diagnostic criteria from clinical mimics.'}`,
            `Guideline Consensus: ${kb.keyTakeaways[1] || 'Follow structured guideline escalation.'}`,
          ],
          keyTakeaways: [kb.examTrap],
          examTrapWarning: kb.examTrap,
        }
      );
      break;
    }
  }

  // Shared topic-contamination validation boundary: drop any slide whose content carries
  // cross-topic/regional-anatomy contamination for the ACTIVE topic before it reaches the UI.
  const topicNameForValidation = topicName || topicIntel.canonicalName;
  const safeSlides = filterTopicSafeContent(dynamicSlides, subjectId, topicId, topicNameForValidation, (s) => `${s.title} ${s.subtitle} ${(s.bullets || []).join(' ')} ${(s.keyTakeaways || []).join(' ')} ${s.examTrapWarning || ''}`, topicIntel.topicType);

  return {
    topicId,
    topicName: topicIntel.canonicalName,
    subjectId,
    subjectName: topicIntel.subjectName,
    slides: safeSlides,
  };
}
