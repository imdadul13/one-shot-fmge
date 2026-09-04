import { FlashcardDeck, FlashcardItem, NormalizedTopicIntelligence } from '../types';
import { getNormalizedTopicIntelligence } from './topicIntelligence';
import { getMedicalTopicKnowledge } from './topicKnowledgeBase';
import { filterTopicSafeContent } from './contentValidator';

export const VERIFIED_TOPIC_FLASHCARDS: Record<string, Omit<FlashcardItem, 'id' | 'topicId' | 'subjectId'>[]> = {
  // Anatomy - Knee Joint & Nerve Lesions
  'anat-4': [
    {
      front: 'Which test is the MOST sensitive physical diagnostic maneuver for an Anterior Cruciate Ligament (ACL) tear?',
      back: 'Lachman Test (assesses excess anterior translation of the tibia with the knee flexed at 20–30°).',
      clinicalPearl: 'LAMP: Lateral femoral condyle = ACL; Medial femoral condyle = PCL.',
      category: 'Physical Examination',
      difficulty: 'high-yield',
    },
    {
      front: 'What are the three anatomical components of O\'Donoghue\'s "Unholy Triad" of the knee?',
      back: '1. Anterior Cruciate Ligament (ACL)\n2. Medial Collateral Ligament (MCL)\n3. Medial Meniscus (often accompanied by Lateral Meniscus).',
      clinicalPearl: 'Caused by lateral valgus blow to the flexed, planted knee.',
      category: 'Clinical Anatomy',
      difficulty: 'high-yield',
    },
    {
      front: 'Fracture of the neck of the fibula causes injury to which nerve, resulting in which clinical deficit?',
      back: 'Common Peroneal (Fibular) Nerve → causing Foot Drop (loss of dorsiflexion and eversion) and sensory loss on the dorsum of the foot.',
      clinicalPearl: 'PED = Peroneal Everts and Dorsiflexes; TIP = Tibial Inverts and Plantarflexes.',
      category: 'Nerve Injuries',
      difficulty: 'high-yield',
    },
    {
      front: 'Which muscle is known as the "Key that unlocks the knee joint" and what is its action?',
      back: 'Popliteus Muscle. In weight-bearing position, it unlocks the knee by laterally rotating the femur on the fixed tibia.',
      clinicalPearl: 'Innervated by the Tibial Nerve (L4–S1).',
      category: 'Myology',
      difficulty: 'core',
    },
    {
      front: 'What is the arrangement of neurovascular structures from superficial to deep in the Popliteal Fossa?',
      back: '1. Tibial Nerve (most superficial)\n2. Popliteal Vein (intermediate)\n3. Popliteal Artery (deepest, resting against femur/capsule).',
      clinicalPearl: 'NVA: Nerve is superficial, Artery is deep.',
      category: 'Surgical Spaces',
      difficulty: 'high-yield',
    },
    {
      front: 'Which three muscles insert into the Pes Anserinus on the proximal anteromedial tibia?',
      back: '1. Sartorius (Femoral n.)\n2. Gracilis (Obturator n.)\n3. Semitendinosus (Sciatic n.).',
      clinicalPearl: 'Mnemonic: "Say Grace before Tea" (S-G-T). Innervated by 3 different lower limb nerves.',
      category: 'Myology',
      difficulty: 'core',
    },
    {
      front: 'What isolated sensory deficit occurs with selective injury to the Deep Peroneal Nerve?',
      back: 'Sensory anesthesia over the First Dorsal Web Space (between 1st and 2nd toes).',
      clinicalPearl: 'Superficial peroneal nerve supplies the remainder of the dorsal foot skin.',
      category: 'Neuroanatomy',
      difficulty: 'trap',
    },
    {
      front: 'Which knee ligament is classically injured in a "Dashboard Injury" and what physical sign is positive?',
      back: 'Posterior Cruciate Ligament (PCL) → Posterior Sag Sign / Posterior Drawer Test positive.',
      clinicalPearl: 'PCL is the strongest knee ligament; attaches to the anterior aspect of Medial femoral condyle (P-M).',
      category: 'Trauma Anatomy',
      difficulty: 'high-yield',
    },
    {
      front: 'Why is the Medial Meniscus torn far more frequently than the Lateral Meniscus?',
      back: 'Because the Medial Meniscus is C-shaped and firmly anchored to the deep fibers of the Medial Collateral Ligament (MCL), making it less mobile.',
      clinicalPearl: 'Lateral meniscus is O-shaped and more mobile (separated from LCL by popliteus tendon).',
      category: 'Arthrology',
      difficulty: 'core',
    },
    {
      front: 'Which bursae around the knee communicates freely with the knee joint synovial cavity?',
      back: 'Suprapatellar Bursa (located between femur and quadriceps tendon).',
      clinicalPearl: 'Site of choice for arthrocentesis and knee joint aspiration.',
      category: 'Bursae',
      difficulty: 'core',
    },
  ],

  // Anatomy - Upper Limb Brachial Plexus
  'anat-1': [
    {
      front: 'What roots of the brachial plexus are injured in Erb-Duchenne Palsy and what is the characteristic posture?',
      back: 'C5 and C6 roots (Upper Trunk). Characteristic "Waiter\'s Tip" posture: Arm adducted, internally rotated, forearm pronated, wrist flexed.',
      clinicalPearl: 'Loss of Biceps reflex and Deltoid abduction (C5-C6).',
      category: 'Brachial Plexus',
      difficulty: 'high-yield',
    },
    {
      front: 'What roots are injured in Klumpke Paralysis and what associated autonomic syndrome can occur?',
      back: 'C8 and T1 roots (Lower Trunk). Results in "Total Claw Hand" (paralysis of all intrinsic hand muscles) + Ipsilateral Horner Syndrome (T1 sympathetic lesion: ptosis, miosis, anhidrosis).',
      clinicalPearl: 'Caused by upward traction on hyperabducted arm (catching tree branch during fall).',
      category: 'Brachial Plexus',
      difficulty: 'high-yield',
    },
    {
      front: 'Midshaft fracture of the humerus classically damages which nerve and artery in the spiral groove?',
      back: 'Radial Nerve and Profunda Brachii Artery → leading to Wrist Drop and loss of sensation in the anatomical snuffbox.',
      clinicalPearl: 'Surgical neck = Axillary nerve; Midshaft = Radial; Medial epicondyle = Ulnar.',
      category: 'Fractures & Nerves',
      difficulty: 'high-yield',
    },
    {
      front: 'What is Froment Sign and what nerve injury does it diagnose?',
      back: 'When asked to hold paper between thumb and index finger, the patient flexes the thumb IP joint (using FPL / Median n.) due to paralysis of Adductor Pollicis (Ulnar Nerve).',
      clinicalPearl: 'Positive Froment Sign = Ulnar nerve lesion at wrist or elbow.',
      category: 'Hand Examination',
      difficulty: 'high-yield',
    },
    {
      front: 'Injury to the Long Thoracic Nerve of Bell leads to which classic physical deformity?',
      back: 'Winged Scapula (paralysis of Serratus Anterior muscle, C5-C6-C7 roots).',
      clinicalPearl: '"C5, 6, 7 raise your arms to heaven" (Long thoracic nerve).',
      category: 'Clinical Anatomy',
      difficulty: 'core',
    },
  ],

  // Medicine - Cardiology: Arrhythmias & ACS
  'med-1': [
    {
      front: 'What is the first-line pharmacological treatment for acute conversion of stable Paroxysmal Supraventricular Tachycardia (PSVT)?',
      back: 'Intravenous Adenosine (6 mg rapid IV bolus followed by 20 mL saline flush; repeat 12 mg if unsuccessful).',
      clinicalPearl: 'Adenosine has a half-life < 10 seconds. Contraindicated in severe asthma (use Verapamil/Diltiazem).',
      category: 'Arrhythmias',
      difficulty: 'high-yield',
    },
    {
      front: 'In acute inferior wall STEMI, what classic triad indicates Right Ventricular Myocardial Infarction (RVMI)?',
      back: '1. Hypotension\n2. Elevated JVP (Jugular Venous Distension)\n3. Clear Lung Fields (absence of pulmonary rales).',
      clinicalPearl: 'RVMI is preload-dependent! Nitrates, Diuretics, and Morphine are strictly CONTRAINDICATED; treat with IV crystalloids.',
      category: 'Coronary Syndromes',
      difficulty: 'high-yield',
    },
    {
      front: 'What CHA2DS2-VASc score threshold mandates oral anticoagulation with DOACs in non-valvular Atrial Fibrillation?',
      back: 'Score >= 2 in Men, Score >= 3 in Women.',
      clinicalPearl: 'DOACs (Apixaban, Rivaroxaban, Dabigatran) preferred over Warfarin in non-valvular AFib.',
      category: 'Anticoagulation',
      difficulty: 'high-yield',
    },
    {
      front: 'What ECG finding is the hallmark of Wolff-Parkinson-White (WPW) syndrome?',
      back: '1. Short PR interval (<120 ms)\n2. Delta Wave (slurred upstroke of QRS)\n3. Wide QRS complex due to accessory pathway (Bundle of Kent).',
      clinicalPearl: 'DOC for WPW with AFib = Procainamide or Ibutilide. AV blockers (Adenosine, Digoxin, Verapamil) are contraindicated.',
      category: 'ECG Interpretation',
      difficulty: 'trap',
    },
    {
      front: 'What is the drug of choice for stable sustained Monomorphic Ventricular Tachycardia?',
      back: 'Intravenous Amiodarone (150 mg IV over 10 minutes followed by infusion) or IV Procainamide.',
      clinicalPearl: 'Unstable VT = Synchronized DC Cardioversion; Pulseless VT = Defibrillation (CPR).',
      category: 'Emergency Cardiology',
      difficulty: 'high-yield',
    },
  ],

  // Medicine - Valvular Heart Diseases & Endocarditis
  'med-3': [
    {
      front: 'What are the two Major Criteria in the Modified Duke Criteria for Infective Endocarditis?',
      back: '1. Positive Blood Cultures (2 separate cultures with typical IE microorganisms).\n2. Positive Echocardiography (oscillating intracardiac vegetation, abscess, new partial dehiscence of prosthetic valve, or new regurgitant murmur).',
      clinicalPearl: '2 Major OR 1 Major + 3 Minor OR 5 Minor = Definite Infective Endocarditis.',
      category: 'Duke Criteria',
      difficulty: 'high-yield',
    },
    {
      front: 'What is the clinical difference between Janeway lesions and Osler nodes in Endocarditis?',
      back: '• Janeway Lesions: Painless, erythematous macules on palms and soles (due to septic micro-emboli).\n• Osler Nodes: Painful, erythematous nodules on finger/toe pads (due to immune complex deposition).',
      clinicalPearl: 'O in Osler = "Ouch" (painful) + Immune complexes.',
      category: 'Physical Signs',
      difficulty: 'high-yield',
    },
    {
      front: 'What auscultatory findings are characteristic of Mitral Stenosis?',
      back: '1. Loud S1\n2. Opening Snap (OS - shorter A2-OS interval indicates more severe stenosis)\n3. Low-pitched mid-diastolic rumbling murmur at apex with presystolic accentuation.',
      clinicalPearl: 'Presystolic accentuation disappears when the patient develops Atrial Fibrillation (due to loss of atrial kick).',
      category: 'Murmur Auscultation',
      difficulty: 'high-yield',
    },
    {
      front: 'What is the classic symptom triad of Severe Aortic Stenosis and its prognosis?',
      back: 'SAD Triad:\n• Syncope (average survival 3 years)\n• Angina (average survival 5 years)\n• Dyspnea / Heart failure (average survival 2 years)',
      clinicalPearl: 'Onset of any symptom in severe AS is the definitive indication for Valve Replacement (SAVR/TAVR).',
      category: 'Clinical Triads',
      difficulty: 'high-yield',
    },
    {
      front: 'What are the classic peripheral eponymous signs of chronic Severe Aortic Regurgitation?',
      back: '• Corrigan / Water-hammer pulse (rapid distention and collapse)\n• de Musset sign (head bobbing with systole)\n• Traube sign ("pistol-shot" sound over femoral artery)\n• Duroziez sign (systolic murmur over femoral artery with proximal compression, diastolic murmur with distal compression)\n• Quincke pulse (capillary pulsations in nail beds).',
      clinicalPearl: 'Aortic regurgitation produces high systolic and very low diastolic BP (wide pulse pressure).',
      category: 'Eponymous Signs',
      difficulty: 'high-yield',
    },
  ],

  // Medicine - Pulmonology (Asthma & COPD)
  'med-4': [
    {
      front: 'What spirometry criteria definitively confirms Bronchial Asthma reversibility?',
      back: 'Post-bronchodilator increase in FEV1 > 12% AND > 200 mL compared to pre-bronchodilator baseline.',
      clinicalPearl: 'A normal spirometry does not exclude asthma; perform Methacholine challenge if clinical suspicion is high.',
      category: 'Diagnostic Criteria',
      difficulty: 'high-yield',
    },
    {
      front: 'According to GINA Guidelines (Track 1), what is the preferred reliever and controller for Steps 1 & 2 Asthma?',
      back: 'As-needed Low-Dose Inhaled Corticosteroid (ICS) + Formoterol (MART regimen).',
      clinicalPearl: 'SABA monotherapy is no longer recommended because it increases risk of severe exacerbations.',
      category: 'Pharmacology Guidelines',
      difficulty: 'high-yield',
    },
    {
      front: 'What is the diagnostic spirometry definition of Chronic Obstructive Pulmonary Disease (COPD)?',
      back: 'Post-bronchodilator FEV1 / FVC ratio < 0.70 demonstrating irreversible airflow limitation.',
      clinicalPearl: 'Unlike asthma, the airflow obstruction in COPD is fixed and does not normalize post-bronchodilator.',
      category: 'GOLD Guidelines',
      difficulty: 'high-yield',
    },
    {
      front: 'What are the only two non-surgical interventions proven to reduce mortality in severe COPD?',
      back: '1. Smoking Cessation (most impactful)\n2. Long-Term Oxygen Therapy (LTOT >= 15 hours/day).',
      clinicalPearl: 'LTOT criteria: PaO2 <= 55 mmHg (or SaO2 <= 88%) at rest, or PaO2 56-59 mmHg with cor pulmonale.',
      category: 'Mortality Reducers',
      difficulty: 'high-yield',
    },
    {
      front: 'In acute severe asthma, what is the clinical significance of a PaCO2 of 40-42 mmHg in a breathless patient?',
      back: 'Impending Respiratory Failure / Exhaustion. Asthmatics in severe distress should be hyperventilating with PaCO2 < 35 mmHg.',
      clinicalPearl: 'A "normal" or rising PaCO2 accompanied by a "Silent Chest" is a medical emergency requiring ICU/intubation.',
      category: 'Emergency Traps',
      difficulty: 'trap',
    },
  ],

  // Pharmacology - Autonomic Drugs
  'pharm-1': [
    {
      front: 'What two antidotes are required in Organophosphate Poisoning and what are their mechanisms?',
      back: '1. Atropine (blocks muscarinic receptors; titrated until bronchial secretions dry).\n2. Pralidoxime / 2-PAM (reactivates acetylcholinesterase before aging occurs).',
      clinicalPearl: 'In Carbamate poisoning, give Atropine ONLY (Pralidoxime is not indicated).',
      category: 'Toxicology',
      difficulty: 'high-yield',
    },
    {
      front: 'What is the specific antidote for severe Beta-Blocker toxicity and how does it work?',
      back: 'Intravenous Glucagon. It stimulates glucagon receptors on cardiomyocytes to increase intracellular cAMP, bypassing blocked beta receptors.',
      clinicalPearl: 'CCB overdose = IV Calcium Gluconate + High-Dose Insulin Euglycemia Therapy.',
      category: 'Antidotes',
      difficulty: 'high-yield',
    },
    {
      front: 'Which direct-acting muscarinic agonist eye drop is used in acute Angle-Closure Glaucoma?',
      back: 'Pilocarpine (2% topical drops) → contracts the pupillary sphincter (miosis) to pull the iris away from the trabecular meshwork.',
      clinicalPearl: 'Mydriatics (Atropine, Tropicamide) are STRICTLY CONTRAINDICATED in narrow angles.',
      category: 'Ocular Pharmacology',
      difficulty: 'high-yield',
    },
    {
      front: 'What drug is used to reverse non-depolarizing neuromuscular blockade (Rocuronium/Vecuronium) by direct encapsulation?',
      back: 'Sugammadex (a modified gamma-cyclodextrin that binds and inactivates steroid NMBAs).',
      clinicalPearl: 'Neostigmine + Glycopyrrolate is the traditional reversal agent.',
      category: 'Anesthesia Pharmacology',
      difficulty: 'core',
    },
    {
      front: 'What classic anticholinergic side-effect mnemonic is used for Atropine toxicity?',
      back: '"Hot as a hare (hyperthermia), Blind as a bat (cycloplegia/mydriasis), Dry as a bone (anhidrosis/dry mouth), Red as a beet (flushing), Mad as a hatter (delirium)."',
      clinicalPearl: 'Antidote for central anticholinergic toxicity = Physostigmine (crosses BBB).',
      category: 'Autonomic Toxicology',
      difficulty: 'core',
    },
  ],

  // OBGYN - Hypertensive Disorders & MgSO4
  'obg-2': [
    {
      front: 'What constitutes the standard loading dose of Magnesium Sulfate (Pritchard Regimen) for eclampsia?',
      back: '4 g IV (20% solution over 5–10 min) PLUS 10 g IM (5 g in each buttock as 50% solution with 1 mL 2% lidocaine).',
      clinicalPearl: 'Maintenance: 5 g IM 4-hourly in alternate buttocks.',
      category: 'Obstetric Protocols',
      difficulty: 'high-yield',
    },
    {
      front: 'What is the EARLIEST clinical sign of Magnesium Sulfate toxicity and at what serum level does it occur?',
      back: 'Loss of Deep Tendon Reflexes (Patellar Reflex / Knee Jerk), occurring at 8–10 mEq/L.',
      clinicalPearl: 'Respiratory depression at >12 mEq/L; Cardiac arrest at >15 mEq/L.',
      category: 'Toxicity Monitoring',
      difficulty: 'high-yield',
    },
    {
      front: 'What is the specific antidote for Magnesium Sulfate toxicity and its dosage?',
      back: '10 mL of 10% Calcium Gluconate IV administered slowly over 10 minutes.',
      clinicalPearl: 'Keep 10% Calcium Gluconate readily available at bedside during all MgSO4 infusions.',
      category: 'Antidote Protocols',
      difficulty: 'high-yield',
    },
    {
      front: 'What are the three essential prerequisites checked before administering each maintenance dose of MgSO4?',
      back: '1. Patellar reflex present\n2. Respiratory rate >= 12 breaths/min\n3. Urine output >= 30 mL/hr (since Mg is excreted exclusively by kidneys).',
      clinicalPearl: 'If urine output is low, reduce or withhold MgSO4 to prevent accumulation.',
      category: 'Clinical Prerequisites',
      difficulty: 'high-yield',
    },
    {
      front: 'What are the first-line oral and IV antihypertensive medications of choice in severe pre-eclampsia?',
      back: '1. IV Labetalol (or Hydralazine)\n2. Oral Nifedipine (extended-release)\n3. Oral Methyldopa (maintenance).',
      clinicalPearl: 'ACE Inhibitors and ARBs are strictly CONTRAINDICATED in pregnancy (cause renal dysgenesis and oligohydramnios).',
      category: 'Pharmacotherapy in Pregnancy',
      difficulty: 'high-yield',
    },
  ],

  // Anatomy - Thorax: Mediastinum, Heart & Coronary Circulation
  'anat-5': [
    {
      front: 'How is Coronary Dominance clinically and anatomically defined?',
      back: 'Coronary dominance is determined strictly by which artery gives origin to the Posterior Descending Artery (PDA / Posterior Interventricular Artery). 85% of humans are Right Dominant (RCA -> PDA); 10% are Left Dominant (LCx -> PDA); 5% are Co-dominant.',
      clinicalPearl: 'PDA supplies the posterior 1/3 of the interventricular septum and diaphragmatic LV wall.',
      category: 'Coronary Anatomy',
      difficulty: 'high-yield',
    },
    {
      front: 'Which coronary artery supplies the SA Node and AV Node in the majority of individuals?',
      back: 'Sinoatrial (SA) Node: 60% supplied by RCA, 40% by LCx.\nAtrioventricular (AV) Node: 90% supplied by RCA, 10% by LCx.',
      clinicalPearl: 'Inferior STEMI (RCA occlusion) frequently causes severe sinus bradycardia and complete heart block.',
      category: 'Conduction System',
      difficulty: 'high-yield',
    },
    {
      front: 'What anatomical structures are found at the level of the Sternal Angle of Louis (T4/T5 disc level)?',
      back: '1. Bifurcation of trachea (Carina)\n2. Arch of Aorta begins and ends\n3. Azygos vein arches over right main bronchus into SVC\n4. Thoracic duct crosses from right to left\n5. Boundary between Superior and Inferior Mediastinum.',
      clinicalPearl: 'Transverse Thoracic Plane of Ludwig = Sternal Angle to T4-T5 intervertebral disc.',
      category: 'Anatomical Landmarks',
      difficulty: 'high-yield',
    },
    {
      front: 'What are the contents of the Posterior Mediastinum (Mnemonic: DATES)?',
      back: 'D - Descending thoracic Aorta\nA - Azygos and Hemiazygos veins\nT - Thoracic duct\nE - Esophagus\nS - Sympathetic trunk and splanchnic nerves.',
      clinicalPearl: 'Vagus nerve accompanies esophagus through posterior mediastinum.',
      category: 'Mediastinal Spaces',
      difficulty: 'core',
    },
    {
      front: 'What are the three clinical signs comprising Beck\'s Triad in Cardiac Tamponade?',
      back: '1. Hypotension (with narrow pulse pressure)\n2. Distended Jugular Veins (JVD with absent y descent)\n3. Distant, Muffled Heart Sounds.',
      clinicalPearl: 'Pulsus Paradoxus = >10 mmHg drop in systolic BP during normal inspiration.',
      category: 'Clinical Triad',
      difficulty: 'high-yield',
    },
    {
      front: 'Where is the Transverse Pericardial Sinus located and what is its surgical significance?',
      back: 'Located behind the Ascending Aorta and Pulmonary Trunk, and in front of the Superior Vena Cava and upper left atrium.\nSurgical use: Clamping great vessels during cardiopulmonary bypass.',
      clinicalPearl: 'Oblique sinus is a blind recess behind the left atrium.',
      category: 'Pericardial Spaces',
      difficulty: 'core',
    },
    {
      front: 'Which artery is known as the "Widow Maker" and what territory does it supply?',
      back: 'Left Anterior Descending (LAD) artery. Supplies anterior 2/3 of interventricular septum, anterior wall of left ventricle, and apex.',
      clinicalPearl: 'LAD occlusion causes Anterior/Anteroseptal STEMI (leads V1-V4).',
      category: 'Coronary Territory',
      difficulty: 'high-yield',
    },
    {
      front: 'What is the needle insertion point and angle for emergency pericardiocentesis?',
      back: 'Subxiphoid approach (Larrey space) between the xiphoid process and left 7th costal cartilage at a 45° angle aimed toward the left shoulder.',
      clinicalPearl: 'Subxiphoid route avoids the internal thoracic vessels and pleura.',
      category: 'Emergency Procedures',
      difficulty: 'high-yield',
    },
    {
      front: 'Where does the Coronary Sinus drain and where is its opening located?',
      back: 'Drains the venous blood of the heart into the Right Atrium (opening located between IVC orifice and right atrioventricular orifice, guarded by Thebesian valve).',
      clinicalPearl: 'Great cardiac vein travels with LAD, middle cardiac vein with PDA, small cardiac vein with marginal.',
      category: 'Venous Drainage',
      difficulty: 'core',
    },
    {
      front: 'Why are Nitroglycerin and Diuretics strictly contraindicated in Right Ventricular Myocardial Infarction (RVMI)?',
      back: 'Because the ischemic right ventricle is severely preload-dependent. Nitrates and diuretics decrease preload, precipitating profound, refractory cardiogenic shock.',
      clinicalPearl: 'Treatment of RVMI: Immediate volume resuscitation with IV Normal Saline.',
      category: 'Pharmacology Trap',
      difficulty: 'trap',
    },
  ],

  // Pathology - Neoplasia
  'path-4': [
    {
      front: 'What is the molecular function of TP53 ("Guardian of the Genome") and what syndrome is caused by its germline mutation?',
      back: 'Encodes p53 transcription factor on 17p. In response to DNA damage, induces p21 (G1/S arrest) or BAX/BAK (apoptosis).\nGermline mutation causes Li-Fraumeni Syndrome (Sarcomas, Breast, Brain, Adrenal).',
      clinicalPearl: 'TP53 is mutated in >50% of all human cancers.',
      category: 'Tumor Suppressors',
      difficulty: 'high-yield',
    },
    {
      front: 'Which chromosomal translocation is pathognomonic for Chronic Myeloid Leukemia (CML) and what fusion protein does it produce?',
      back: 't(9;22)(q34;q11) - Philadelphia Chromosome.\nProduces BCR-ABL fusion protein with constitutively active tyrosine kinase activity.',
      clinicalPearl: 'Targeted by Imatinib (Gleevec) tyrosine kinase inhibitor.',
      category: 'Cytogenetics',
      difficulty: 'high-yield',
    },
    {
      front: 'What is the classic translocation and histologic appearance of Burkitt Lymphoma?',
      back: 't(8;14) translocating c-MYC proto-oncogene next to IgH heavy chain enhancer.\nHistology: "Starry sky" pattern (sheets of uniform lymphocytes with tingible body macrophages).',
      clinicalPearl: 'Associated with Epstein-Barr Virus (EBV) in endemic African variety (jaw lesion).',
      category: 'Translocations',
      difficulty: 'high-yield',
    },
    {
      front: 'Which tumor marker is elevated in Hepatocellular Carcinoma and Non-Seminomatous Yolk Sac Tumors?',
      back: 'Alpha-Fetoprotein (AFP). In Yolk Sac Tumors, Schiller-Duval bodies are seen on histology.',
      clinicalPearl: 'Beta-hCG is marker for Choriocarcinoma; CA-125 for Epithelial Ovarian cancer.',
      category: 'Tumor Markers',
      difficulty: 'high-yield',
    },
    {
      front: 'What is the Warburg Effect in tumor cell metabolism?',
      back: 'Aerobic Glycolysis: Malignant tumor cells preferentially convert glucose into lactate even in the presence of abundant oxygen to generate biosynthetic intermediates.',
      clinicalPearl: 'Basis of 18F-FDG PET scanning in clinical oncology staging.',
      category: 'Cancer Metabolism',
      difficulty: 'core',
    },
    {
      front: 'Which translocation is seen in Acute Promyelocytic Leukemia (APML - M3) and what is the treatment?',
      back: 't(15;17) PML-RARA fusion.\nTreatment: All-Trans Retinoic Acid (ATRA) + Arsenic Trioxide.',
      clinicalPearl: 'APML presents with severe risk of Disseminated Intravascular Coagulation (DIC).',
      category: 'Hematopathology',
      difficulty: 'high-yield',
    },
    {
      front: 'What is Knudson\'s "Two-Hit Hypothesis" for tumor suppressor genes?',
      back: 'Both alleles of a tumor suppressor gene must be inactivated to lose growth control. In hereditary retinoblastoma (RB1 on 13q), the 1st hit is inherited (germline) and 2nd hit is somatic.',
      clinicalPearl: 'Proto-oncogenes require only ONE hit (gain of function) to drive transformation.',
      category: 'Molecular Oncology',
      difficulty: 'core',
    },
    {
      front: 'Which tumor marker is used to monitor recurrence of Medullary Thyroid Carcinoma and what is its cell of origin?',
      back: 'Calcitonin. Derived from Parafollicular C cells of the thyroid (associated with RET proto-oncogene in MEN 2A and 2B).',
      clinicalPearl: 'Amyloid stroma (stains with Congo Red demonstrating apple-green birefringence).',
      category: 'Endocrine Pathology',
      difficulty: 'high-yield',
    },
    {
      front: 'What is the chromosomal translocation and classic histological finding in Ewing Sarcoma?',
      back: 't(11;22)(q24;q12) EWS-FLI1 fusion.\nHistology: Small round blue cell tumor. X-ray: "Onion-skin" concentric periosteal reaction in diaphysis of long bones.',
      clinicalPearl: 'CD99 (MIC2) positive membranous staining.',
      category: 'Bone Pathology',
      difficulty: 'high-yield',
    },
    {
      front: 'What are the classic histological features distinguishing benign from malignant neoplasms?',
      back: 'Malignancy features: Anaplasia, Pleomorphism, Hyperchromatic nuclei, High nuclear-to-cytoplasmic ratio (1:1), Atypical tripolar mitotic figures, Capsular and vascular invasion.',
      clinicalPearl: 'Vascular invasion and metastasis are the unequivocal hallmarks of malignancy.',
      category: 'General Pathology',
      difficulty: 'core',
    },
  ],

  // =================== BIOCHEMISTRY ===================
  'bio-1': [
    {
      front: 'What does the Michaelis constant (Km) represent in enzyme kinetics?',
      back: 'Km is the substrate concentration at which reaction velocity reaches half-maximal velocity (1/2 Vmax).\nIt is inversely related to enzyme affinity (Lower Km = Higher affinity).',
      clinicalPearl: 'Km is an intrinsic property of the enzyme-substrate pair and is independent of enzyme concentration.',
      category: 'Enzyme Kinetics',
      difficulty: 'high-yield',
    },
    {
      front: 'What changes occur to Km and Vmax in Competitive Inhibition?',
      back: 'Km INCREASES (shifts right / closer to 0 on Lineweaver-Burk).\nVmax is UNCHANGED.\nEffect can be overcome by adding excess substrate.',
      clinicalPearl: 'Statins (HMG-CoA reductase) and Methotrexate (DHFR) are classic competitive inhibitors.',
      category: 'Inhibition Kinetics',
      difficulty: 'high-yield',
    },
    {
      front: 'What changes occur to Km and Vmax in Noncompetitive Inhibition?',
      back: 'Km is UNCHANGED (binds allosteric site regardless of substrate binding).\nVmax DECREASES.\nCannot be overcome by adding excess substrate.',
      clinicalPearl: 'Lines intersect on the negative x-axis (-1/Km) on a Lineweaver-Burk plot.',
      category: 'Inhibition Kinetics',
      difficulty: 'high-yield',
    },
    {
      front: 'What are the x-intercept, y-intercept, and slope of a Lineweaver-Burk double-reciprocal plot?',
      back: '1. x-intercept = -1 / Km\n2. y-intercept = 1 / Vmax\n3. Slope = Km / Vmax',
      clinicalPearl: 'A steeper slope indicates a higher Km/Vmax ratio (less efficient catalytic reaction).',
      category: 'Graphical Analysis',
      difficulty: 'high-yield',
    },
    {
      front: 'What changes occur to Km and Vmax in Uncompetitive Inhibition and how do the Lineweaver-Burk lines appear?',
      back: 'BOTH Km and Vmax DECREASE by the exact same proportion.\nLineweaver-Burk lines are strictly PARALLEL (slope Km/Vmax remains constant).',
      clinicalPearl: 'Inhibitor binds ONLY to the pre-formed Enzyme-Substrate (ES) complex.',
      category: 'Inhibition Kinetics',
      difficulty: 'trap',
    },
    {
      front: 'How does reaction order differ when substrate concentration [S] is much less than Km vs much greater than Km?',
      back: 'When [S] << Km → First-order kinetics (rate is proportional to [S]).\nWhen [S] >> Km → Zero-order kinetics (enzyme is saturated; rate is constant Vmax).',
      clinicalPearl: 'Ethanol, Phenytoin, and high-dose Aspirin follow zero-order elimination kinetics.',
      category: 'Enzyme Kinetics',
      difficulty: 'core',
    },
  ],

  // =================== PHARMACOLOGY ===================
  'pharm-2': [
    {
      front: 'Which Beta-blockers are cardioselective for Beta-1 receptors? (Mnemonic: AMEBA)',
      back: 'A = Atenolol\nM = Metoprolol\nE = Esmolol (ultra-short acting, t1/2 ~9 min)\nB = Bisoprolol\nA = Acebutolol (has partial agonist ISA activity).',
      clinicalPearl: 'Cardioselective agents have less risk of bronchospasm than non-selective Propranolol.',
      category: 'Pharmacology',
      difficulty: 'high-yield',
    },
    {
      front: 'What is the specific antidote for acute Beta-blocker toxicity/overdose and what is its mechanism?',
      back: 'Intravenous GLUCAGON.\nMechanism: Activates glucagon receptors to stimulate Adenylyl Cyclase via Gs bypass, increasing intracellular cAMP and restoring cardiac contractility & heart rate.',
      clinicalPearl: 'Bypasses the blocked beta-adrenergic receptors entirely.',
      category: 'Toxicology & Antidotes',
      difficulty: 'high-yield',
    },
    {
      front: 'Why must Alpha-blockers ALWAYS be administered before Beta-blockers in Pheochromocytoma?',
      back: 'Giving a Beta-blocker first blocks Beta-2 vasodilation, resulting in UNOPPOSED Alpha-1 vasoconstriction and catastrophic hypertensive crisis.',
      clinicalPearl: 'Phenoxybenzamine (irreversible alpha blocker) is given first, followed by a beta blocker for tachycardia.',
      category: 'Endocrine Pharmacology',
      difficulty: 'trap',
    },
  ],

  // =================== PATHOLOGY ===================
  'path-8': [
    {
      front: 'What is the hallmark diagnostic cell of Classic Hodgkin Lymphoma and what is its immunophenotype?',
      back: 'Reed-Sternberg (RS) Cell ("owl-eye" binucleated giant cell with prominent eosinophilic nucleoli).\nImmunophenotype: CD15 (+), CD30 (+), CD45 (-), CD20 (-).',
      clinicalPearl: 'Popcorn cells in Nodular Lymphocyte-Predominant Hodgkin are CD20(+) and CD45(+).',
      category: 'Hematopathology',
      difficulty: 'high-yield',
    },
    {
      front: 'What is the most common subtype of Classic Hodgkin Lymphoma and what are its histological features?',
      back: 'Nodular Sclerosis Subtype (~70% of cases).\nFeatures: Collagen fibrous bands dividing lymph node into nodules, and "Lacunar" Reed-Sternberg cells. Most common in young females, mediastinal mass.',
      clinicalPearl: 'Has an excellent overall prognosis.',
      category: 'Hematopathology',
      difficulty: 'high-yield',
    },
    {
      front: 'What are the classic "B-symptoms" of lymphoma and how do they impact Ann Arbor staging?',
      back: '1. Unexplained fever >38°C (Pel-Ebstein cyclic fever)\n2. Drenching night sweats\n3. Unintentional weight loss >10% of body weight over 6 months.\nDenoted by suffix "B" (e.g. Stage II-B) and confers a poorer prognosis.',
      clinicalPearl: 'Alcohol-induced lymph node pain is a rare but highly specific classic sign.',
      category: 'Clinical Staging',
      difficulty: 'core',
    },
  ],

  // =================== PHYSIOLOGY ===================
  'phys-2': [
    {
      front: 'What ion movement causes Phase 0 depolarization in a nerve action potential and what toxin blocks it?',
      back: 'Rapid influx of Na+ through Voltage-Gated Sodium Channels.\nToxin Blockers: Tetrodotoxin (TTX from pufferfish) and Saxitoxin (red tide dinoflagellates).',
      clinicalPearl: 'Inactivation gate of Na+ channel closes during early repolarization causing Absolute Refractory Period.',
      category: 'Cell Biophysics',
      difficulty: 'high-yield',
    },
    {
      front: 'What is the difference between the Absolute Refractory Period and Relative Refractory Period?',
      back: 'Absolute Refractory Period: Na+ channels are in closed-inactivated state; NO stimulus can fire an action potential.\nRelative Refractory Period: K+ channels are open (hyperpolarized) and some Na+ channels have recovered; a SUPRATHRESHOLD stimulus can fire an action potential.',
      clinicalPearl: 'Refractory period prevents retrograde conduction along the axon.',
      category: 'Neurophysiology',
      difficulty: 'high-yield',
    },
  ],
};

/**
 * Generates an authentic flashcard deck for any FMGE topic.
 */
export function generateFlashcardDeck(
  subjectId: string,
  topicId: string,
  topicName?: string
): FlashcardDeck {
  const topicIntel: NormalizedTopicIntelligence = getNormalizedTopicIntelligence(subjectId, topicId, topicName);
  const key = topicId;
  const verifiedCards = VERIFIED_TOPIC_FLASHCARDS[key] || [];

  const cards: FlashcardItem[] = verifiedCards.map((c, idx) => ({
    ...c,
    id: `fc-${subjectId}-${topicId}-${idx + 1}`,
    topicId,
    subjectId,
    mastered: false,
    reviewCount: 0,
  }));

  // If uncataloged topic or short deck, retrieve authentic topic-specific medical knowledge
  if (cards.length < 3) {
    const kb = getMedicalTopicKnowledge(subjectId, topicId, topicName || topicIntel.canonicalName);
    kb.flashcards.forEach((fc, idx) => {
      // Avoid duplicate card fronts
      if (!cards.some((c) => c.front === fc.front)) {
        cards.push({
          id: `fc-${subjectId}-${topicId}-${cards.length + 1}`,
          topicId,
          subjectId,
          front: fc.front,
          back: fc.back,
          clinicalPearl: fc.clinicalPearl,
          category: 'High-Yield Clinical Core',
          difficulty: idx === 0 ? 'high-yield' : idx === 1 ? 'core' : 'trap',
          mastered: false,
          reviewCount: 0,
        });
      }
    });
  }

  // Shared topic-contamination validation boundary: drop any card whose content carries
  // cross-topic/regional-anatomy contamination for the ACTIVE topic before it reaches the UI.
  const topicNameForValidation = topicName || topicIntel.canonicalName;
  const safeCards = filterTopicSafeContent(cards, subjectId, topicId, topicNameForValidation, (fc) => `${fc.front} ${fc.back} ${fc.clinicalPearl || ''}`, topicIntel.topicType);

  return {
    topicId,
    topicName: topicIntel.canonicalName,
    subjectId,
    subjectName: topicIntel.subjectName,
    cards: safeCards,
    masteredCount: 0,
    totalCards: safeCards.length,
  };
}
