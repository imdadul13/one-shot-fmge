import {
  AppState,
  CandidateTopicRecommendation,
  EducationalVideo,
  VideoInteraction,
  VideoRating,
  TopicPerformanceMetrics,
} from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { calculateTopicPerformanceMetrics } from './performanceEngine';
import { calculateAllTopicsAdaptivePriority } from './adaptivePriorityEngine';
import { getLocalDateKey } from './date';

export type {
  CandidateTopicRecommendation,
  EducationalVideo,
  VideoInteraction,
  VideoRating,
};

/**
 * High-Yield Curated Educational Medical Video Catalog.
 * Strictly mapped per subjectId and topicId.
 * NO fallback to unrelated subjects or generic videos.
 */
export const CURATED_MEDICAL_VIDEOS: EducationalVideo[] = [
  // =================== ANATOMY ===================
  {
    id: '3B3g6W4d5J4',
    title: 'Knee Joint Anatomy, Cruciate Ligaments & Menisci: High-Yield Clinical Review',
    channelName: 'AnatomyZone',
    duration: '14:25',
    durationSeconds: 865,
    thumbnailUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=3B3g6W4d5J4',
    embedUrl: 'https://www.youtube.com/embed/3B3g6W4d5J4',
    subjectId: 'anatomy',
    topicId: 'anat-4',
    topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
    subtopic: 'Knee Ligaments & Popliteal Fossa',
    highYieldScore: 98,
    recommendationReason: 'Crucial anatomy for ACL/PCL tears, unholy triad of O\'Donoghue, and common peroneal nerve compression at the fibular neck.',
    isCurated: true,
  },
  {
    id: 'YQ2r6tF_2Qk',
    title: 'Common Peroneal vs Tibial Nerve Lesions: Foot Drop & Sensory Loss',
    channelName: 'Medicosis Perfectionalis',
    duration: '16:10',
    durationSeconds: 970,
    thumbnailUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=YQ2r6tF_2Qk',
    embedUrl: 'https://www.youtube.com/embed/YQ2r6tF_2Qk',
    subjectId: 'anatomy',
    topicId: 'anat-4',
    topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
    subtopic: 'Peroneal Nerve Injury',
    highYieldScore: 96,
    recommendationReason: 'Differentiates deep vs superficial peroneal nerve injuries, motor deficits (loss of dorsiflexion/eversion), and high-yield FMGE PYQs.',
    isCurated: true,
  },
  {
    id: 'Xzv3p6Hq6qA',
    title: 'Brachial Plexus: Roots, Trunks, Divisions, Cords & Branches (Erb\'s vs Klumpke\'s)',
    channelName: 'Ninja Nerd',
    duration: '28:40',
    durationSeconds: 1720,
    thumbnailUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=Xzv3p6Hq6qA',
    embedUrl: 'https://www.youtube.com/embed/Xzv3p6Hq6qA',
    subjectId: 'anatomy',
    topicId: 'anat-1',
    topicName: 'Upper Limb - Brachial Plexus & Nerve Injuries',
    subtopic: 'Brachial Plexus Lesions',
    highYieldScore: 99,
    recommendationReason: 'Covers Erb-Duchenne palsy (C5-C6 waiter\'s tip) vs Klumpke paralysis (C8-T1 claw hand) and Horner syndrome association.',
    isCurated: true,
  },

  // =================== MEDICINE ===================
  {
    id: 'xIZQRjkwGsY',
    title: 'ECG Interpretation & Cardiac Arrhythmias (AFib, Flutter, VTach, AV Blocks)',
    channelName: 'Ninja Nerd',
    duration: '32:15',
    durationSeconds: 1935,
    thumbnailUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=xIZQRjkwGsY',
    embedUrl: 'https://www.youtube.com/embed/xIZQRjkwGsY',
    subjectId: 'medicine',
    topicId: 'med-1',
    topicName: 'Cardiology (ECG, MI, Arrhythmias, Heart Failure)',
    subtopic: 'Arrhythmias & ECG',
    highYieldScore: 99,
    recommendationReason: 'Complete step-by-step ECG algorithm for narrow vs wide complex tachycardias, delta waves in WPW, and heart blocks.',
    isCurated: true,
  },
  {
    id: '9f0OEQ8r6rI',
    title: 'Myocardial Infarction (STEMI vs NSTEMI): Coronary Anatomy & Biomarkers',
    channelName: 'Osmosis from Elsevier',
    duration: '18:50',
    durationSeconds: 1130,
    thumbnailUrl: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=9f0OEQ8r6rI',
    embedUrl: 'https://www.youtube.com/embed/9f0OEQ8r6rI',
    subjectId: 'medicine',
    topicId: 'med-1',
    topicName: 'Cardiology (ECG, MI, Arrhythmias, Heart Failure)',
    subtopic: 'Acute Coronary Syndrome',
    highYieldScore: 97,
    recommendationReason: 'Anterior vs Inferior vs Lateral wall STEMI localization, Troponin dynamics, and reperfusion therapy guidelines.',
    isCurated: true,
  },

  // =================== PHARMACOLOGY ===================
  {
    id: 's9h_7n0_tqU',
    title: 'Autonomic Nervous System Pharmacology: Cholinergic & Adrenergic Receptors',
    channelName: 'Ninja Nerd',
    duration: '34:20',
    durationSeconds: 2060,
    thumbnailUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=s9h_7n0_tqU',
    embedUrl: 'https://www.youtube.com/embed/s9h_7n0_tqU',
    subjectId: 'pharmacology',
    topicId: 'pharm-1',
    topicName: 'Autonomic Nervous System Drugs',
    subtopic: 'Adrenergic & Cholinergic Agonists/Antagonists',
    highYieldScore: 98,
    recommendationReason: 'Detailed receptor breakdown (alpha-1, alpha-2, beta-1, beta-2, muscarinic) and organophosphate poisoning reversal protocols.',
    isCurated: true,
  },
  {
    id: '5JkL2aZ9k7Q',
    title: 'Autonomic Drugs Rapid Review: Parasympathomimetics & Anticholinergics',
    channelName: 'Dirty Medicine',
    duration: '19:45',
    durationSeconds: 1185,
    thumbnailUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=5JkL2aZ9k7Q',
    embedUrl: 'https://www.youtube.com/embed/5JkL2aZ9k7Q',
    subjectId: 'pharmacology',
    topicId: 'pharm-1',
    topicName: 'Autonomic Nervous System Drugs',
    subtopic: 'High-Yield Memory Mnemonics',
    highYieldScore: 95,
    recommendationReason: 'High-yield mnemonics for atropine toxicity, physostigmine vs neostigmine, and glaucoma pharmacotherapy.',
    isCurated: true,
  },

  // =================== PATHOLOGY ===================
  {
    id: 'aK8pZ1eQ4vM',
    title: 'Neoplasia: Hallmarks of Cancer, Oncogenes & Tumor Suppressor Genes',
    channelName: 'Ninja Nerd',
    duration: '29:10',
    durationSeconds: 1750,
    thumbnailUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=aK8pZ1eQ4vM',
    embedUrl: 'https://www.youtube.com/embed/aK8pZ1eQ4vM',
    subjectId: 'pathology',
    topicId: 'path-4',
    topicName: 'Neoplasia - Hallmarks, Oncogenes & Tumor Markers',
    subtopic: 'Proto-Oncogenes & Knudson Two-Hit Hypothesis',
    highYieldScore: 99,
    recommendationReason: 'Master TP53, RB1, BRCA1/2, APC, RET, and RAS signaling pathways with tumor marker associations.',
    isCurated: true,
  },
  {
    id: 'W9xL2pQ8mR0',
    title: 'Glomerulonephritis: Nephritic vs Nephrotic Syndromes (Biopsy & EM Findings)',
    channelName: 'Medicosis Perfectionalis',
    duration: '22:30',
    durationSeconds: 1350,
    thumbnailUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=W9xL2pQ8mR0',
    embedUrl: 'https://www.youtube.com/embed/W9xL2pQ8mR0',
    subjectId: 'pathology',
    topicId: 'path-1',
    topicName: 'Cell Injury, Necrosis, Apoptosis & Amyloidosis',
    subtopic: 'Renal Pathology & Amyloid Stains',
    highYieldScore: 97,
    recommendationReason: 'Covers Congo Red apple-green birefringence in polarized light, AA vs AL amyloidosis, and light chain cast nephropathy.',
    isCurated: true,
  },

  // =================== OBSTETRICS & GYNECOLOGY ===================
  {
    id: 'Y8w_8tP9qL0',
    title: 'Preeclampsia, Eclampsia & HELLP Syndrome: Pritchard Regimen Management',
    channelName: 'Osmosis from Elsevier',
    duration: '21:15',
    durationSeconds: 1275,
    thumbnailUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=Y8w_8tP9qL0',
    embedUrl: 'https://www.youtube.com/embed/Y8w_8tP9qL0',
    subjectId: 'obg',
    topicId: 'obg-2',
    topicName: 'Pre-eclampsia, Eclampsia & MgSO4 Pritchard Regimen',
    subtopic: 'Hypertensive Disorders in Pregnancy',
    highYieldScore: 99,
    recommendationReason: 'Pritchard regimen loading/maintenance doses, patellar reflex monitoring, respiratory rate cut-offs, and calcium gluconate antidote.',
    isCurated: true,
  },
  {
    id: 'zP3xQ9mK1wR',
    title: 'Postpartum Hemorrhage (PPH): Prevention, Active Management & Uterotonics',
    channelName: 'Prepladder Medical Hub',
    duration: '18:40',
    durationSeconds: 1120,
    thumbnailUrl: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=zP3xQ9mK1wR',
    embedUrl: 'https://www.youtube.com/embed/zP3xQ9mK1wR',
    subjectId: 'obg',
    topicId: 'obg-1',
    topicName: 'Postpartum Hemorrhage (PPH) Management',
    subtopic: 'Active Management of 3rd Stage of Labor (AMTSL)',
    highYieldScore: 98,
    recommendationReason: 'Covers oxytocin, carboprost, methylergonovine contraindications, Bakri balloon, and surgical devascularization steps.',
    isCurated: true,
  },

  // =================== PSM ===================
  {
    id: 'Vhyw3Bf0jH8',
    title: 'Screening Tests: Sensitivity, Specificity, PPV, NPV & 2x2 Tables',
    channelName: 'Ninja Nerd',
    duration: '25:10',
    durationSeconds: 1510,
    thumbnailUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=Vhyw3Bf0jH8',
    embedUrl: 'https://www.youtube.com/embed/Vhyw3Bf0jH8',
    subjectId: 'psm',
    topicId: 'psm-1',
    topicName: 'Screening Tests & Sensitivity/Specificity',
    subtopic: 'Biostatistics Contingency Tables',
    highYieldScore: 99,
    recommendationReason: 'Formulas and calculations for True Positives, False Positives, and the effect of disease prevalence on PPV vs NPV.',
    isCurated: true,
  },
  {
    id: 'kJ9wX4mP7qR',
    title: 'Vaccine Cold Chain, VVM Stages & National Immunization Schedule',
    channelName: 'Marrow High-Yield Sessions',
    duration: '20:05',
    durationSeconds: 1205,
    thumbnailUrl: 'https://images.unsplash.com/photo-1632053002928-196e00b8e64c?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=kJ9wX4mP7qR',
    embedUrl: 'https://www.youtube.com/embed/kJ9wX4mP7qR',
    subjectId: 'psm',
    topicId: 'psm-2',
    topicName: 'Vaccine Storage & Cold Chain Management',
    subtopic: 'Cold Chain Equipment & ILR',
    highYieldScore: 97,
    recommendationReason: 'Ice-Lined Refrigerator (+2°C to +8°C) layout, deep freezer storage, and heat-sensitive vs freeze-sensitive vaccines.',
    isCurated: true,
  },

  // =================== SURGERY ===================
  {
    id: 'tP8xW2mK4vQ',
    title: 'Burns: Modified Parkland Formula, Rule of Nines & Resuscitation',
    channelName: 'Ninja Nerd',
    duration: '22:40',
    durationSeconds: 1360,
    thumbnailUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=tP8xW2mK4vQ',
    embedUrl: 'https://www.youtube.com/embed/tP8xW2mK4vQ',
    subjectId: 'surgery',
    topicId: 'surg-1',
    topicName: 'Burns - Parkland Formula & Resuscitation',
    subtopic: 'Fluid Calculation & Escharotomy',
    highYieldScore: 99,
    recommendationReason: 'Parkland fluid resuscitation calculations (4 mL x kg x %TBSA, half in first 8 hours), urine output goals, and inhalation injuries.',
    isCurated: true,
  },
  {
    id: 'xL9mQ2wP8rT',
    title: 'ATLS Primary Survey & Emergency FAST Exam Windows',
    channelName: 'DAMS Medical',
    duration: '16:50',
    durationSeconds: 1010,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=xL9mQ2wP8rT',
    embedUrl: 'https://www.youtube.com/embed/xL9mQ2wP8rT',
    subjectId: 'surgery',
    topicId: 'surg-2',
    topicName: 'Trauma Evaluation (ABCDE, FAST, Tension Pneumothorax)',
    subtopic: 'Emergency Trauma Protocol',
    highYieldScore: 95,
    recommendationReason: 'Evaluation of Morison\'s pouch, splenorenal recess, suprapubic, and pericardial windows with tension pneumothorax decompression.',
    isCurated: true,
  },
  // =================== MEDICINE (ARRHYTHMIAS & METABOLIC) ===================
  {
    id: 'b1K9vQ_4mR0',
    title: 'Heart Blocks: 1st, 2nd Degree (Mobitz I & II) & 3rd Degree AV Block ECGs',
    channelName: 'Ninja Nerd',
    duration: '24:15',
    durationSeconds: 1455,
    thumbnailUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=b1K9vQ_4mR0',
    embedUrl: 'https://www.youtube.com/embed/b1K9vQ_4mR0',
    subjectId: 'medicine',
    topicId: 'med-1',
    topicName: 'Cardiology (ECG, MI, Arrhythmias, Heart Failure)',
    subtopic: 'Heart Blocks & AV Dissociation',
    highYieldScore: 98,
    recommendationReason: 'PR interval prolongation, Wenckebach phenomenon, Cannon A waves in 3rd degree AV block, and permanent pacemaker indications.',
    isCurated: true,
  },
  {
    id: 'w9Q2r4tF_Lk',
    title: 'Wolff-Parkinson-White (WPW) Syndrome: Delta Wave, ECG & Pre-excitation',
    channelName: 'Dirty Medicine',
    duration: '14:30',
    durationSeconds: 870,
    thumbnailUrl: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=w9Q2r4tF_Lk',
    embedUrl: 'https://www.youtube.com/embed/w9Q2r4tF_Lk',
    subjectId: 'medicine',
    topicId: 'med-1',
    topicName: 'Cardiology (ECG, MI, Arrhythmias, Heart Failure)',
    subtopic: 'WPW Syndrome & Accessory Pathways',
    highYieldScore: 97,
    recommendationReason: 'Bundle of Kent pathway, short PR interval, slurred upstroke (delta wave), and drugs to avoid in WPW with AFib (ABCD: Adenosine, Beta-blockers, CCB, Digoxin).',
    isCurated: true,
  },
  {
    id: 'd3M4k9pQ1vR',
    title: 'Diabetes Mellitus Management: ADA Guidelines, Insulin Regimens & Oral Hypoglycemics',
    channelName: 'Osmosis from Elsevier',
    duration: '21:10',
    durationSeconds: 1270,
    thumbnailUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=d3M4k9pQ1vR',
    embedUrl: 'https://www.youtube.com/embed/d3M4k9pQ1vR',
    subjectId: 'medicine',
    topicId: 'med-3',
    topicName: 'Endocrinology - Diabetes Mellitus & Thyroid Disorders',
    subtopic: 'Diabetes Mellitus Pharmacotherapy',
    highYieldScore: 99,
    recommendationReason: 'Comprehensive review of Metformin, SGLT2 inhibitors (cardiorenal protection), GLP-1 RAs, DKA fluid resuscitation, and hypoglycemia protocols.',
    isCurated: true,
  },
  {
    id: 't8B2p9qL1wM',
    title: 'Tuberculosis & NTEP Guidelines: Diagnostic Algorithm, CBNAAT & Regimens',
    channelName: 'Marrow High-Yield Sessions',
    duration: '26:45',
    durationSeconds: 1605,
    thumbnailUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=t8B2p9qL1wM',
    embedUrl: 'https://www.youtube.com/embed/t8B2p9qL1wM',
    subjectId: 'medicine',
    topicId: 'med-5',
    topicName: 'Pulmonology - Pneumonia & Tuberculosis (NTEP)',
    subtopic: 'NTEP Guidelines & Anti-TB Therapy',
    highYieldScore: 99,
    recommendationReason: 'CBNAAT/GeneXpert interpretation for Rifampicin resistance, HRZE 2-month intensive phase vs 4-month continuation phase, and Nikshay portal monitoring.',
    isCurated: true,
  },

  // =================== DERMATOLOGY ===================
  {
    id: 'p4M1k9qL2wR',
    title: 'Bullous Disorders: Pemphigus Vulgaris vs Bullous Pemphigoid (Nikolsky Sign & IF)',
    channelName: 'Dirty Medicine',
    duration: '17:20',
    durationSeconds: 1040,
    thumbnailUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=p4M1k9qL2wR',
    embedUrl: 'https://www.youtube.com/embed/p4M1k9qL2wR',
    subjectId: 'dermatology',
    topicId: 'derm-1',
    topicName: 'Vesiculobullous Disorders (Pemphigus vs Pemphigoid)',
    subtopic: 'Autoimmune Blistering Diseases',
    highYieldScore: 99,
    recommendationReason: 'Desmoglein 3 vs 1 autoantibodies, intraepidermal suprabasal acantholysis, fishnet direct immunofluorescence, and Nikolsky sign positivity.',
    isCurated: true,
  },

  // =================== RADIOLOGY ===================
  {
    id: 'r9X2p4qL1wM',
    title: 'High-Yield Chest X-Ray Signs & Emergency Radiology Interpretation',
    channelName: 'Ninja Nerd',
    duration: '28:15',
    durationSeconds: 1695,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600',
    youtubeUrl: 'https://www.youtube.com/watch?v=r9X2p4qL1wM',
    embedUrl: 'https://www.youtube.com/embed/r9X2p4qL1wM',
    subjectId: 'radiology',
    topicId: 'rad-1',
    topicName: 'Chest Radiology - Classic X-Ray Signs & CT Chest',
    subtopic: 'Chest X-Ray Classical Signs',
    highYieldScore: 99,
    recommendationReason: 'Silhouette sign, Golden S curve of Storch, Sail sign in pneumomediastinum, Deep sulcus sign in supine pneumothorax, and Hampton hump in pulmonary embolism.',
    isCurated: true,
  },
];

const MEDICAL_ABBREVIATION_EXPANSIONS: Record<string, string[]> = {
  mi: ['myocardial', 'infarction', 'stemi', 'nstemi', 'coronary'],
  ecg: ['ecg', 'ekg', 'electrocardiogram', 'arrhythmias', 'rhythm'],
  pph: ['postpartum', 'hemorrhage', 'uterotonics', 'atony'],
  fast: ['fast', 'trauma', 'ultrasound', 'emergency'],
  atls: ['atls', 'trauma', 'resuscitation', 'airway'],
  nis: ['immunization', 'schedule', 'vaccine'],
  ilr: ['refrigerator', 'cold', 'chain'],
  vvm: ['vvm', 'vaccine', 'vial'],
  psgn: ['glomerulonephritis', 'nephritic'],
  mgso4: ['magnesium', 'sulfate', 'pritchard', 'eclampsia'],
  crab: ['myeloma', 'calcium', 'renal', 'anemia', 'bone'],
  autonomic: ['autonomic', 'cholinergic', 'adrenergic', 'muscarinic', 'nicotinic', 'atropine', 'pralidoxime', 'organophosphate', 'pilocarpine', 'receptor', 'parasympathetic', 'sympathetic'],
  drugs: ['drug', 'drugs', 'antidote', 'agonist', 'antagonist', 'blocker', 'inhibitor', 'toxicity', 'pharmacology'],
};

/**
 * Extracts key medical tokens from a topic name and subject for query building and relevance checks.
 */
export function extractTopicKeywords(subjectName: string, topicName: string): string[] {
  const text = `${subjectName} ${topicName}`
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const stopWords = new Set([
    'and', 'or', 'the', 'of', 'in', 'for', 'with', 'vs', 'to', 'a', 'an', 'on', 'at', 'by', 'from',
    'paper', 'clinical', 'pre', 'para', 'general', 'module', 'notes', 'overview'
  ]);

  const rawTokens = text.split(' ').filter((w) => w.length >= 2 && !stopWords.has(w));
  const keywordsSet = new Set<string>(rawTokens);

  for (const token of rawTokens) {
    const expansions = MEDICAL_ABBREVIATION_EXPANSIONS[token];
    if (expansions) {
      for (const exp of expansions) {
        keywordsSet.add(exp);
      }
    }
  }

  return Array.from(keywordsSet);
}

/**
 * Builds precise, topic-specific search queries for YouTube.
 */
export function buildTopicSearchQueries(subjectName: string, topicName: string): string[] {
  const cleanTopic = topicName.replace(/\([^)]*\)/g, '').replace(/[^\w\s-]/g, ' ').trim();
  return [
    `FMGE ${subjectName} ${cleanTopic} rapid revision`,
    `medical ${cleanTopic} high yield review`,
    `FMGE ${subjectName} ${cleanTopic} PYQ`,
  ];
}

/**
 * Calculates topic relevance score for a video based on topic keyword presence in title and description.
 */
export function isRelevantMedicalVideo(
  video: { title: string; description?: string },
  subjectName: string,
  topicName: string
): boolean {
  const keywords = extractTopicKeywords(subjectName, topicName);
  if (keywords.length === 0) return true;

  const content = `${video.title} ${video.description || ''}`.toLowerCase();

  let matchedCount = 0;
  for (const kw of keywords) {
    if (content.includes(kw)) {
      matchedCount++;
    }
  }

  return matchedCount >= 1;
}

/**
 * Identifies and ranks candidate topics that need learning/video reinforcement,
 * powered by the unified FMGE Adaptive Priority Engine.
 */
export function identifyCandidateTopics(state: AppState): CandidateTopicRecommendation[] {
  const adaptivePriorities = calculateAllTopicsAdaptivePriority(state);

  const videoInteractions = Array.isArray(state.videoInteractions) ? state.videoInteractions : [];
  const unhelpfulTopicCounts: Record<string, number> = {};
  for (const vi of videoInteractions) {
    if (vi.userRating === 'not_helpful') {
      const key = `${vi.subjectId}-${vi.topicId}`;
      unhelpfulTopicCounts[key] = (unhelpfulTopicCounts[key] || 0) + 1;
    }
  }

  const candidates: CandidateTopicRecommendation[] = adaptivePriorities.map((ap) => {
    const key = `${ap.subjectId}-${ap.topicId}`;
    const unhelpfulCount = unhelpfulTopicCounts[key] || 0;

    // Apply feedback demotion if student disliked videos for this topic
    let score = ap.priorityScore;
    if (unhelpfulCount > 0) {
      score = Math.max(0, score - unhelpfulCount * 30);
    }

    let priorityLabel: CandidateTopicRecommendation['priorityLabel'] = 'MODERATE';
    if (score >= 75) priorityLabel = 'URGENT CORE';
    else if (score >= 55) priorityLabel = 'VERY HIGH';
    else if (score >= 40) priorityLabel = 'HIGH';
    else if (score >= 25) priorityLabel = 'MODERATE';
    else priorityLabel = 'MAINTAIN';

    const searchQueries = buildTopicSearchQueries(ap.subjectName, ap.topicName);

    return {
      subjectId: ap.subjectId,
      subjectName: ap.subjectName,
      subjectCode: ap.subjectCode,
      subjectColor: ap.subjectColor,
      topicId: ap.topicId,
      topicName: ap.topicName,
      isHighYield: ap.isHighYield,
      weightage: ap.subjectWeightage,
      accuracy: ap.accuracy,
      recentAccuracy: ap.recentAccuracy,
      totalAttempts: ap.attemptCount,
      repeatedErrorsCount: ap.repeatedErrorCount,
      isRevisionDue: ap.revisionDue,
      isWeakSubjectInGT: ap.grandTestWeakness,
      recommendationScore: score,
      priorityScore: ap.priorityScore,
      masteryScore: ap.masteryScore,
      priorityLabel,
      reasons: [ap.explanation],
      primaryReason: ap.explanation,
      searchQueries,
      adaptivePriority: ap,
    };
  });

  return candidates.sort((a, b) => b.recommendationScore - a.recommendationScore);
}

/**
 * Strictly returns curated high-yield medical videos matching subjectId and topicId.
 * NEVER leaks videos from other topics or subjects!
 */
export function getCuratedVideosForTopic(subjectId: string, topicId: string): EducationalVideo[] {
  return CURATED_MEDICAL_VIDEOS.filter(
    (v) => v.subjectId === subjectId && v.topicId === topicId
  );
}

/**
 * Fetches video recommendations for a given topic from the backend YouTube API proxy,
 * with strict topic relevance validation and clean fallback.
 */
export async function fetchTopicVideoRecommendations(
  candidate: CandidateTopicRecommendation,
  interactions: VideoInteraction[] = []
): Promise<EducationalVideo[]> {
  const unhelpfulVideoIds = new Set(
    interactions.filter((i) => i.userRating === 'not_helpful').map((i) => i.videoId)
  );

  // 1. Try Live YouTube Data API via backend proxy
  try {
    const query = candidate.searchQueries[0];
    const url = `/api/videos/recommendations?subjectId=${encodeURIComponent(
      candidate.subjectId
    )}&topicId=${encodeURIComponent(candidate.topicId)}&query=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.videos) && data.videos.length > 0) {
        // Validate each video for genuine topic relevance
        const relevant = (data.videos as EducationalVideo[]).filter((v) => {
          if (unhelpfulVideoIds.has(v.id)) return false;
          // Must be relevant to this topic
          return isRelevantMedicalVideo(v, candidate.subjectName, candidate.topicName);
        });

        if (relevant.length > 0) {
          return relevant;
        }
      }
    }
  } catch (err) {
    console.warn('Backend video recommendations query notice, checking curated library:', err);
  }

  // 2. Curated Fallback (STRICTLY for this subject and topic)
  const curatedMatches = getCuratedVideosForTopic(candidate.subjectId, candidate.topicId).filter(
    (v) => !unhelpfulVideoIds.has(v.id)
  );

  return curatedMatches;
}

/**
 * Records a video view/open interaction into AppState.
 */
export function recordVideoView(
  state: AppState,
  videoId: string,
  subjectId: string,
  topicId: string,
  topicName?: string
): AppState {
  const existing = state.videoInteractions || [];
  const foundIndex = existing.findIndex((i) => i.videoId === videoId);
  const now = new Date().toISOString();

  let updatedList: VideoInteraction[];
  if (foundIndex >= 0) {
    const item = existing[foundIndex];
    updatedList = [
      ...existing.slice(0, foundIndex),
      {
        ...item,
        openedAt: now,
        openedCount: (item.openedCount || 1) + 1,
      },
      ...existing.slice(foundIndex + 1),
    ];
  } else {
    updatedList = [
      {
        videoId,
        subjectId,
        topicId,
        topicName,
        openedAt: now,
        openedCount: 1,
      },
      ...existing,
    ];
  }

  return {
    ...state,
    videoInteractions: updatedList,
  };
}

/**
 * Rates a video as helpful or not helpful in AppState.
 */
export function rateVideoInteraction(
  state: AppState,
  videoId: string,
  rating: VideoRating,
  subjectId?: string,
  topicId?: string
): AppState {
  const existing = state.videoInteractions || [];
  const foundIndex = existing.findIndex((i) => i.videoId === videoId);
  const now = new Date().toISOString();

  let updatedList: VideoInteraction[];
  if (foundIndex >= 0) {
    const item = existing[foundIndex];
    updatedList = [
      ...existing.slice(0, foundIndex),
      {
        ...item,
        userRating: rating,
        feedbackTimestamp: now,
      },
      ...existing.slice(foundIndex + 1),
    ];
  } else {
    updatedList = [
      {
        videoId,
        subjectId: subjectId || 'medicine',
        topicId: topicId || 'general',
        openedAt: now,
        openedCount: 1,
        userRating: rating,
        feedbackTimestamp: now,
      },
      ...existing,
    ];
  }

  return {
    ...state,
    videoInteractions: updatedList,
  };
}
