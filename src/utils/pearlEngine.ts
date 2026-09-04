import { TopicHighYieldPearl, TopicLearningContext } from '../types';
import { getTopicLearningContext } from './topicIntelligence';
import { getMedicalTopicKnowledge } from './topicKnowledgeBase';
import { filterTopicSafeContent } from './contentValidator';

export const VERIFIED_TOPIC_PEARLS: Record<string, TopicHighYieldPearl[]> = {
  // Anatomy - Knee Joint & Nerve Lesions
  'anat-4': [
    {
      id: 'pearl-anat-4-1',
      topicId: 'anat-4',
      subjectId: 'anatomy',
      statement: 'Popliteus muscle is the "key that unlocks the knee joint" by rotating the femur laterally on the fixed tibia (or rotating tibia medially on fixed femur).',
      category: 'Anatomical Mechanism',
      discriminatorTip: 'Innervated by the Tibial Nerve.',
    },
    {
      id: 'pearl-anat-4-2',
      topicId: 'anat-4',
      subjectId: 'anatomy',
      statement: 'Common Peroneal (Fibular) Nerve winds directly around the neck of the fibula; fracture or tight casting causes Foot Drop (loss of dorsiflexion and eversion).',
      category: 'Nerve Entrapment',
      examTrapWarning: 'Deep peroneal nerve supplies sensation to the first dorsal web space between great toe and second toe.',
    },
    {
      id: 'pearl-anat-4-3',
      topicId: 'anat-4',
      subjectId: 'anatomy',
      statement: 'Lachman Test (performed at 20-30° knee flexion) is the single most sensitive physical examination test for Anterior Cruciate Ligament (ACL) tear.',
      category: 'Clinical Maneuver',
      discriminatorTip: 'More sensitive than the traditional Anterior Drawer Test.',
    },
    {
      id: 'pearl-anat-4-4',
      topicId: 'anat-4',
      subjectId: 'anatomy',
      statement: 'Unholy Triad of O\'Donoghue consists of ACL rupture + MCL rupture + Medial Meniscus tear following a lateral valgus blow to the planted knee.',
      category: 'Trauma Triad',
    },
    {
      id: 'pearl-anat-4-5',
      topicId: 'anat-4',
      subjectId: 'anatomy',
      statement: 'In the Popliteal Fossa, neurovascular structures lie from superficial to deep in the order: Tibial Nerve -> Popliteal Vein -> Popliteal Artery (N-V-A).',
      category: 'Anatomical Relations',
    },
  ],

  // Anatomy - Thorax: Mediastinum, Heart & Coronary Circulation
  'anat-5': [
    {
      id: 'pearl-anat-5-1',
      topicId: 'anat-5',
      subjectId: 'anatomy',
      statement: 'Coronary Dominance is defined strictly by the artery that gives rise to the Posterior Descending Artery (PDA / Posterior Interventricular Artery). In 85% of humans, the circulation is Right Dominant (RCA -> PDA).',
      category: 'Coronary Anatomy',
      discriminatorTip: 'Left Dominance occurs when LCx gives origin to the PDA (10%).',
    },
    {
      id: 'pearl-anat-5-2',
      topicId: 'anat-5',
      subjectId: 'anatomy',
      statement: 'The Sinoatrial (SA) Node is supplied by the RCA in 60% of individuals (and LCx in 40%). The Atrioventricular (AV) Node is supplied by the RCA in 90% of individuals.',
      category: 'Conduction Blood Supply',
      examTrapWarning: 'Occlusion of the RCA in Inferior Wall MI frequently causes severe Sinus Bradycardia and Complete Heart Block.',
    },
    {
      id: 'pearl-anat-5-3',
      topicId: 'anat-5',
      subjectId: 'anatomy',
      statement: 'Transverse Thoracic Plane (Sternal Angle of Louis to T4/T5 disc) marks the carina bifurcation of the trachea, the aortic arch beginning/end, and the azygos vein entering the SVC.',
      category: 'Anatomical Landmarks',
      discriminatorTip: 'Divides the Mediastinum into Superior and Inferior divisions.',
    },
    {
      id: 'pearl-anat-5-4',
      topicId: 'anat-5',
      subjectId: 'anatomy',
      statement: 'Posterior Mediastinum contents mnemonic is DATES: Descending Aorta, Azygos vein, Thoracic duct, Esophagus, and Sympathetic trunks.',
      category: 'Mediastinal Spaces',
    },
    {
      id: 'pearl-anat-5-5',
      topicId: 'anat-5',
      subjectId: 'anatomy',
      statement: 'Beck\'s Triad for Cardiac Tamponade = (1) Hypotension, (2) Jugular Venous Distension (elevated JVP with prominent x descent), and (3) Muffled Heart Sounds.',
      category: 'Emergency Triad',
      examTrapWarning: 'Emergency Pericardiocentesis is performed via the subxiphoid Larrey space at a 45° angle aiming toward the left shoulder.',
    },
    {
      id: 'pearl-anat-5-6',
      topicId: 'anat-5',
      subjectId: 'anatomy',
      statement: 'Left Anterior Descending Artery (LAD, "the widow maker") courses down the anterior interventricular groove and supplies the anterior 2/3 of the interventricular septum, anterior LV wall, and apex.',
      category: 'Coronary Territory',
    },
  ],

  // Anatomy - Upper Limb Brachial Plexus
  'anat-1': [
    {
      id: 'pearl-anat-1-1',
      topicId: 'anat-1',
      subjectId: 'anatomy',
      statement: 'Erb-Duchenne Palsy damages C5-C6 roots (Upper trunk) producing "Waiter\'s tip hand" (limb adducted, internally rotated, elbow extended, forearm pronated).',
      category: 'Brachial Plexus',
    },
    {
      id: 'pearl-anat-1-2',
      topicId: 'anat-1',
      subjectId: 'anatomy',
      statement: 'Klumpke Paralysis damages C8-T1 roots (Lower trunk) causing "Total Claw Hand" and ipsilateral Horner Syndrome (ptosis, miosis, anhidrosis due to T1 sympathetic fibers).',
      category: 'Brachial Plexus',
    },
    {
      id: 'pearl-anat-1-3',
      topicId: 'anat-1',
      subjectId: 'anatomy',
      statement: 'Midshaft humerus fracture / spiral groove injury damages the Radial Nerve causing Wrist Drop with preserved triceps extension.',
      category: 'Nerve Entrapment',
    },
    {
      id: 'pearl-anat-1-4',
      topicId: 'anat-1',
      subjectId: 'anatomy',
      statement: 'Long Thoracic Nerve (roots C5, C6, C7) supplies Serratus Anterior; damage during mastectomy causes Winged Scapula.',
      category: 'Clinical Anatomy',
    },
  ],

  // Medicine - Cardiology
  'med-1': [
    {
      id: 'pearl-med-1-1',
      topicId: 'med-1',
      subjectId: 'medicine',
      statement: 'First-line therapy for stable narrow-complex SVT (AVNRT) is Vagal Maneuvers followed immediately by IV Adenosine (6 mg rapid push via large antecubital vein + saline flush).',
      category: 'Pharmacotherapy',
      discriminatorTip: 'Adenosine has a half-life of <10 seconds.',
    },
    {
      id: 'pearl-med-1-2',
      topicId: 'med-1',
      subjectId: 'medicine',
      statement: 'In Right Ventricular Myocardial Infarction (RVMI, lead V4R ST elevation in inferior STEMI), patients are strictly preload dependent: IV Normal Saline boluses are first-line; Nitrates and Diuretics are CONTRAINDICATED.',
      category: 'Exam Traps',
      examTrapWarning: 'Nitrates precipitate severe refractory hypotension in RVMI.',
    },
    {
      id: 'pearl-med-1-3',
      topicId: 'med-1',
      subjectId: 'medicine',
      statement: 'In Wolff-Parkinson-White (WPW) syndrome with pre-excited AFib, avoid AV nodal blockers (Adenosine, Digoxin, Verapamil, Beta-blockers); give IV Procainamide or Ibutilide.',
      category: 'Cardiology Protocol',
    },
  ],

  // Medicine - Valvular Heart Diseases & Endocarditis
  'med-3': [
    {
      id: 'pearl-med-3-1',
      topicId: 'med-3',
      subjectId: 'medicine',
      statement: 'Modified Duke Criteria for Definite Infective Endocarditis requires 2 Major Criteria OR 1 Major + 3 Minor Criteria OR 5 Minor Criteria.',
      category: 'Diagnostic Criteria',
      discriminatorTip: 'Major: 2 positive blood cultures + Positive Echo vegetation.',
    },
    {
      id: 'pearl-med-3-2',
      topicId: 'med-3',
      subjectId: 'medicine',
      statement: 'Janeway lesions are PAINLESS erythematous macular lesions on palms/soles caused by septic emboli (Vascular). Osler nodes are PAINFUL erythematous nodules on finger/toe pads caused by immune complex deposition (Immunologic).',
      category: 'Physical Signs',
      examTrapWarning: 'Never confuse Janeway (painless) with Osler (painful).',
    },
    {
      id: 'pearl-med-3-3',
      topicId: 'med-3',
      subjectId: 'medicine',
      statement: 'Mitral Stenosis auscultation triad: Loud S1 + Opening Snap + Low-pitched mid-diastolic rumbling murmur with presystolic accentuation (best heard at apex in left lateral decubitus position).',
      category: 'Murmur Auscultation',
    },
    {
      id: 'pearl-med-3-4',
      topicId: 'med-3',
      subjectId: 'medicine',
      statement: 'Severe Aortic Stenosis produces the SAD triad (Syncope, Angina, Dyspnea), a harsh crescendo-decrescendo systolic murmur radiating to the carotids, and Pulsus Parvus et Tardus (slow-rising, low-volume pulse).',
      category: 'Valvular Cardiology',
    },
  ],

  // Medicine - Pulmonology (Asthma & COPD)
  'med-4': [
    {
      id: 'pearl-med-4-1',
      topicId: 'med-4',
      subjectId: 'medicine',
      statement: 'Asthma diagnosis requires documented variable expiratory airflow limitation: Post-bronchodilator increase in FEV1 > 12% AND > 200 mL from baseline.',
      category: 'Diagnostic Criteria',
      discriminatorTip: 'Spirometry FEV1/FVC < 0.70 confirms obstructive defect.',
    },
    {
      id: 'pearl-med-4-2',
      topicId: 'med-4',
      subjectId: 'medicine',
      statement: 'GINA Guidelines: SABA monotherapy is NO LONGER recommended in Step 1/2. Preferred controller and reliever is as-needed Low-Dose Inhaled Corticosteroid (ICS) + Formoterol (MART regimen).',
      category: 'Treatment Guidelines',
      examTrapWarning: 'SABA monotherapy increases risk of severe exacerbations and asthma-related mortality.',
    },
    {
      id: 'pearl-med-4-3',
      topicId: 'med-4',
      subjectId: 'medicine',
      statement: 'COPD is defined by irreversible airflow obstruction: Post-bronchodilator FEV1/FVC < 0.70. GOLD staging is based on post-bronchodilator FEV1% predicted (GOLD 1 >= 80%, GOLD 2 50-79%, GOLD 3 30-49%, GOLD 4 < 30%).',
      category: 'GOLD Guidelines',
      discriminatorTip: 'GOLD 2023/2024 classification categorizes patients into A, B, and E (Exacerbation-prone) groups.',
    },
    {
      id: 'pearl-med-4-4',
      topicId: 'med-4',
      subjectId: 'medicine',
      statement: 'Long-Term Oxygen Therapy (LTOT) in COPD improves mortality if PaO2 <= 55 mmHg (or SaO2 <= 88%) at rest, OR PaO2 56-59 mmHg with cor pulmonale / polycythemia (Hct > 55%). Must be used >= 15 hours/day.',
      category: 'Mortality Benefits',
      discriminatorTip: 'Only Smoking Cessation and LTOT have proven mortality benefits in severe COPD.',
    },
    {
      id: 'pearl-med-4-5',
      topicId: 'med-4',
      subjectId: 'medicine',
      statement: 'Acute Severe Asthma (Status Asthmaticus) poor prognostic signs: "Silent Chest" (lack of wheezing due to severe exhaustion), normal/elevated PaCO2 (> 42 mmHg indicating impending respiratory failure), and Pulsus Paradoxus (> 10 mmHg drop in SBP on inspiration).',
      category: 'Emergency Traps',
      examTrapWarning: 'A "normal" PaCO2 of 40 mmHg in a tachypneic asthmatic is an ominous sign of impending respiratory arrest.',
    },
  ],

  // Pharmacology - Autonomic Drugs
  'pharm-1': [
    {
      id: 'pearl-pharm-1-1',
      topicId: 'pharm-1',
      subjectId: 'pharmacology',
      statement: 'Atropine in organophosphate poisoning is titrated to the clinical endpoint of DRY BRONCHIAL SECRETIONS (clearing of lung rales), NOT pupil dilation or heart rate.',
      category: 'Toxicology',
      examTrapWarning: 'Pralidoxime (2-PAM) reactivates acetylcholinesterase before chemical aging occurs.',
    },
    {
      id: 'pearl-pharm-1-2',
      topicId: 'pharm-1',
      subjectId: 'pharmacology',
      statement: 'Beta-blocker overdose antidote is IV Glucagon (stimulates adenylate cyclase independently of beta-adrenergic receptors).',
      category: 'Antidotes',
    },
    {
      id: 'pearl-pharm-1-3',
      topicId: 'pharm-1',
      subjectId: 'pharmacology',
      statement: 'Physostigmine is a tertiary amine that crosses the Blood-Brain Barrier (used for central anticholinergic toxicity). Neostigmine/Pyridostigmine are quaternary and DO NOT cross BBB.',
      category: 'Receptor Pharmacology',
    },
  ],

  // Pathology - Neoplasia
  'path-4': [
    {
      id: 'pearl-path-4-1',
      topicId: 'path-4',
      subjectId: 'pathology',
      statement: 'TP53 on chromosome 17p is the most frequently mutated tumor suppressor gene in human cancers; germline mutation causes Li-Fraumeni Syndrome (Sarcomas, Breast, Brain, Adrenal).',
      category: 'Tumor Suppressors',
    },
    {
      id: 'pearl-path-4-2',
      topicId: 'path-4',
      subjectId: 'pathology',
      statement: 'Philadelphia Chromosome t(9;22)(q34;q11) creates the BCR-ABL fusion oncogene with constitutively active tyrosine kinase, pathognomonic of Chronic Myeloid Leukemia (CML).',
      category: 'Cytogenetics',
      discriminatorTip: 'Targeted by Imatinib mesylate.',
    },
    {
      id: 'pearl-path-4-3',
      topicId: 'path-4',
      subjectId: 'pathology',
      statement: 'Burkitt Lymphoma features t(8;14) translocation resulting in overexpression of the c-MYC transcription factor and "starry sky" histological appearance.',
      category: 'Translocations',
    },
  ],

  // OBGYN - Pre-eclampsia & MgSO4
  'obg-2': [
    {
      id: 'pearl-obg-2-1',
      topicId: 'obg-2',
      subjectId: 'obg',
      statement: 'Magnesium Sulfate (MgSO4) is the anticonvulsant of choice for seizure prophylaxis in severe pre-eclampsia and treatment of eclampsia (Pritchard regimen: 4g IV + 10g IM).',
      category: 'Obstetric Emergency',
    },
    {
      id: 'pearl-obg-2-2',
      topicId: 'obg-2',
      subjectId: 'obg',
      statement: 'Earliest sign of Magnesium Toxicity is LOSS OF DEEP TENDON REFLEXES (Patellar Reflex / Knee Jerk) at serum levels of 8-10 mEq/L. Antidote is 10 mL 10% Calcium Gluconate IV over 10 minutes.',
      category: 'Toxicity Monitoring',
      examTrapWarning: 'Respiratory depression occurs at >12 mEq/L and cardiac arrest at >15 mEq/L.',
    },
    {
      id: 'pearl-obg-2-3',
      topicId: 'obg-2',
      subjectId: 'obg',
      statement: 'ACE inhibitors (e.g. Enalapril) and ARBs (e.g. Losartan) are strictly CONTRAINDICATED in pregnancy due to fetal renal dysgenesis and oligohydramnios (Potter sequence).',
      category: 'Drug Contraindication',
    },
  ],

  // =================== BIOCHEMISTRY ===================
  'bio-1': [
    {
      id: 'pearl-bio-1-1',
      topicId: 'bio-1',
      subjectId: 'biochemistry',
      statement: 'Competitive Inhibition: Km INCREASES (↑), Vmax remains UNCHANGED. Reversible and overcome by adding excess substrate. Lineweaver-Burk lines intersect on the vertical y-axis (same y-intercept = 1/Vmax).',
      category: 'Inhibition Kinetics',
      discriminatorTip: 'Classic examples: Statins (HMG-CoA reductase), Methotrexate (DHFR), Allopurinol (Xanthine Oxidase).',
    },
    {
      id: 'pearl-bio-1-2',
      topicId: 'bio-1',
      subjectId: 'biochemistry',
      statement: 'Noncompetitive Inhibition: Km is UNCHANGED, Vmax DECREASES (↓). Inhibitor binds allosteric site regardless of substrate. Lineweaver-Burk lines intersect on the negative x-axis (same x-intercept = -1/Km).',
      category: 'Inhibition Kinetics',
      examTrapWarning: 'Noncompetitive inhibition CANNOT be overcome by adding more substrate.',
    },
    {
      id: 'pearl-bio-1-3',
      topicId: 'bio-1',
      subjectId: 'biochemistry',
      statement: 'Uncompetitive Inhibition: BOTH Km and Vmax DECREASE (↓) by the exact same ratio. Inhibitor binds ONLY to the pre-formed Enzyme-Substrate (ES) complex. Yields strictly PARALLEL Lineweaver-Burk lines.',
      category: 'Inhibition Kinetics',
    },
    {
      id: 'pearl-bio-1-4',
      topicId: 'bio-1',
      subjectId: 'biochemistry',
      statement: 'Lineweaver-Burk Double-Reciprocal Parameters: y-intercept = 1/Vmax; x-intercept = -1/Km; Slope = Km/Vmax.',
      category: 'Graphical Calculations',
      examTrapWarning: 'A point closer to the origin on the negative x-axis represents a HIGHER Km (lower enzyme affinity).',
    },
  ],

  // =================== PHARMACOLOGY ===================
  'pharm-2': [
    {
      id: 'pearl-pharm-2-1',
      topicId: 'pharm-2',
      subjectId: 'pharmacology',
      statement: 'Cardioselective Beta-1 Blockers (AMEBA): Atenolol, Metoprolol, Esmolol (ultra-short acting t1/2 ~9 min), Bisoprolol, Acebutolol. Preferred in patients with mild COPD or diabetes.',
      category: 'Drug Classification',
    },
    {
      id: 'pearl-pharm-2-2',
      topicId: 'pharm-2',
      subjectId: 'pharmacology',
      statement: 'Beta-Blocker Toxicity Antidote: Intravenous GLUCAGON is the first-line antidote. It activates adenylyl cyclase via Gs bypass, elevating intracellular cAMP independent of beta-adrenergic receptors.',
      category: 'Toxicology & Antidotes',
      discriminatorTip: 'Administer along with IV fluids, atropine, and calcium gluconate as supportive care.',
    },
    {
      id: 'pearl-pharm-2-3',
      topicId: 'pharm-2',
      subjectId: 'pharmacology',
      statement: 'Pheochromocytoma Rule: NEVER administer a Beta-blocker before achieving adequate Alpha-blockade (Phenoxybenzamine), as unopposed Alpha-1 vasoconstriction causes fatal hypertensive crisis.',
      category: 'Endocrine Trap',
      examTrapWarning: 'Alpha blocker first (A before B), always.',
    },
  ],

  // =================== PATHOLOGY ===================
  'path-8': [
    {
      id: 'pearl-path-8-1',
      topicId: 'path-8',
      subjectId: 'pathology',
      statement: 'Reed-Sternberg Cells in Classic Hodgkin Lymphoma: Binucleated "owl-eye" giant cells. Immunophenotype: CD15 (+), CD30 (+), CD45 (-), CD20 (-).',
      category: 'Immunophenotyping',
      discriminatorTip: 'Popcorn cells in Nodular Lymphocyte-Predominant Hodgkin are CD20(+) and CD45(+).',
    },
    {
      id: 'pearl-path-8-2',
      topicId: 'path-8',
      subjectId: 'pathology',
      statement: 'Hodgkin Lymphoma Subtypes: Nodular Sclerosis is most common (~70%, lacunar cells, collagen bands, young females, mediastinal mass). Mixed Cellularity is associated with EBV (~70%) and eosinophils.',
      category: 'Subtype Histology',
    },
    {
      id: 'pearl-path-8-3',
      topicId: 'path-8',
      subjectId: 'pathology',
      statement: 'ABVD Chemotherapy Regimen: Adriamycin/Doxorubicin (dilated cardiomyopathy), Bleomycin (pulmonary fibrosis, monitor DLCO), Vinblastine (peripheral neuropathy / myelosuppression), Dacarbazine.',
      category: 'Chemotherapy Toxicities',
      examTrapWarning: 'Bleomycin pulmonary fibrosis is exacerbated by high fractional inspired oxygen (FiO2).',
    },
  ],

  // =================== PHYSIOLOGY ===================
  'phys-2': [
    {
      id: 'pearl-phys-2-1',
      topicId: 'phys-2',
      subjectId: 'physiology',
      statement: 'Resting Membrane Potential (-70 mV in nerves) is generated by high resting K+ permeability through leak channels and maintained by the electrogenic Na+/K+ ATPase (3 Na+ out, 2 K+ in).',
      category: 'Cell Biophysics',
    },
    {
      id: 'pearl-phys-2-2',
      topicId: 'phys-2',
      subjectId: 'physiology',
      statement: 'Depolarization Phase 0 is mediated by rapid voltage-gated Na+ channel influx (blocked by Tetrodotoxin TTX). Repolarization is mediated by voltage-gated K+ channel efflux (blocked by Tetraethylammonium TEA).',
      category: 'Ion Channels',
      discriminatorTip: 'Absolute refractory period is caused by closed-inactivated Na+ channel gates.',
    },
  ],
};

/**
 * Generates high-yield FMGE pearls for any topic.
 */
export function generateTopicPearls(
  subjectId: string,
  topicId: string,
  topicName?: string
): TopicHighYieldPearl[] {
  const context: TopicLearningContext = getTopicLearningContext(subjectId, topicId, topicName);
  const verified = VERIFIED_TOPIC_PEARLS[topicId] || [];

  // Shared topic-contamination validation boundary applied to every generated pearl deck.
  const safe = (pearls: TopicHighYieldPearl[]): TopicHighYieldPearl[] =>
    filterTopicSafeContent(pearls, subjectId, topicId, context.topicName, (p) => `${p.statement} ${p.discriminatorTip || ''} ${p.examTrapWarning || ''}`, context.topicType);

  if (VERIFIED_TOPIC_PEARLS[topicId] && VERIFIED_TOPIC_PEARLS[topicId].length > 0) {
    return safe(VERIFIED_TOPIC_PEARLS[topicId]);
  }

  // Dynamic topic-type-aware pearls for uncataloged topics
  if (context.topicType === 'biochemical_concept') {
    return safe([
      {
        id: `pearl-${topicId}-1`,
        topicId,
        subjectId,
        statement: `Competitive Inhibition: Km increases (↑), Vmax is unchanged. Can be overcome by substrate. Lineweaver-Burk lines intersect on the vertical y-axis.`,
        category: 'Inhibition Kinetics',
        discriminatorTip: `Statins and Methotrexate are classic competitive inhibitors.`,
      },
      {
        id: `pearl-${topicId}-2`,
        topicId,
        subjectId,
        statement: `Noncompetitive Inhibition: Km is unchanged, Vmax decreases (↓). Allosteric site binding cannot be overcome by excess substrate.`,
        category: 'Inhibition Kinetics',
        examTrapWarning: `Lineweaver-Burk lines cross on the negative x-axis (-1/Km).`,
      },
      {
        id: `pearl-${topicId}-3`,
        topicId,
        subjectId,
        statement: `Lineweaver-Burk Parameters: x-intercept = -1/Km; y-intercept = 1/Vmax; Slope = Km/Vmax.`,
        category: 'Graphical Formulas',
      },
      {
        id: `pearl-${topicId}-4`,
        topicId,
        subjectId,
        statement: `Kinetic Regulation: ${context.conceptClusters[0] || 'Enzymatic rate-limiting steps'} govern metabolic pathway flow.`,
        category: 'Metabolic Regulation',
      },
    ]);
  }

  if (context.topicType === 'anatomical_structure') {
    return safe([
      {
        id: `pearl-${topicId}-1`,
        topicId,
        subjectId,
        statement: `Anatomical Boundaries: Master the topographical relations, neurovascular bundle order, and fascial spaces in ${context.topicName}.`,
        category: 'Topographical Relations',
        discriminatorTip: `Neurovascular relations from superficial to deep are frequently tested on FMGE.`,
      },
      {
        id: `pearl-${topicId}-2`,
        topicId,
        subjectId,
        statement: `Nerve Lesion Postures: Identify characteristic motor deformities and sensory autonomous testing zones for peripheral nerve injuries.`,
        category: 'Clinical Deformities',
        examTrapWarning: `Distinguish between proximal nerve trunk entrapment and distal branch lesions.`,
      },
      {
        id: `pearl-${topicId}-3`,
        topicId,
        subjectId,
        statement: `Surgical Spaces: ${context.conceptClusters[0] || 'Anatomical fascial compartments'} dictate surgical approaches and infection spread.`,
        category: 'Surgical Anatomy',
      },
    ]);
  }

  if (context.topicType === 'pharmacological_class') {
    return safe([
      {
        id: `pearl-${topicId}-1`,
        topicId,
        subjectId,
        statement: `Mechanism of Action: ${context.conceptClusters[0] || 'Target receptor selectivity'} determines therapeutic efficacy and hemodynamic profile.`,
        category: 'Pharmacodynamics',
        discriminatorTip: `Distinguish between cardioselective and non-selective receptor antagonists.`,
      },
      {
        id: `pearl-${topicId}-2`,
        topicId,
        subjectId,
        statement: `Critical Contraindications: Always verify absolute contraindications (e.g. bronchospasm, heart block, severe peripheral vascular disease).`,
        category: 'Contraindications',
        examTrapWarning: `Specific toxicity reversal antidotes are top-priority exam questions.`,
      },
    ]);
  }

  const kb = getMedicalTopicKnowledge(subjectId, topicId, context.topicName);
  return safe([
    {
      id: `pearl-${topicId}-1`,
      topicId,
      subjectId,
      statement: kb.keyTakeaways[0] || kb.highYieldSummary,
      category: 'Pathognomonic Core',
      discriminatorTip: kb.goldStandardTest,
    },
    {
      id: `pearl-${topicId}-2`,
      topicId,
      subjectId,
      statement: kb.coreConcepts[0] || kb.keyTakeaways[1] || kb.classicPresentation,
      category: 'Diagnostic Gold Standard',
      examTrapWarning: kb.examTrap,
    },
    {
      id: `pearl-${topicId}-3`,
      topicId,
      subjectId,
      statement: kb.firstLineTreatment || kb.coreConcepts[1] || (kb.keyTakeaways.length > 2 ? kb.keyTakeaways[2] : kb.highYieldSummary),
      category: 'Management & Pearls',
      discriminatorTip: kb.keyTakeaways[1] || kb.goldStandardTest,
    },
  ]);
}

