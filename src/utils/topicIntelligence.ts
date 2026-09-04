import { NormalizedTopicIntelligence, TopicCategoryType, TopicLearningContext } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getMedicalTopicKnowledge } from './topicKnowledgeBase';

/**
 * Detects the TopicCategoryType dynamically from subject and topic identifiers/names.
 */
export function detectTopicCategory(subjectId: string, topicName: string): TopicCategoryType {
  const s = (subjectId || '').toLowerCase();
  const t = (topicName || '').toLowerCase();

  if (
    s.includes('biochem') ||
    t.includes('enzyme') ||
    t.includes('kinetics') ||
    t.includes('lineweaver') ||
    t.includes('glycolysis') ||
    t.includes('krebs') ||
    t.includes('metabolism') ||
    t.includes('inborn error') ||
    t.includes('vitamin') ||
    t.includes('dna') ||
    t.includes('rna') ||
    t.includes('replication') ||
    t.includes('transcription') ||
    t.includes('translation') ||
    t.includes('lipid') ||
    t.includes('porphyria') ||
    t.includes('glycogen')
  ) {
    return 'biochemical_concept';
  }

  if (
    s.includes('anat') ||
    t.includes('plexus') ||
    t.includes('triangle') ||
    t.includes('canal') ||
    t.includes('fossa') ||
    t.includes('joint') ||
    t.includes('foramen') ||
    t.includes('sinus') ||
    t.includes('mediastinum') ||
    t.includes('tract') ||
    t.includes('ligament') ||
    t.includes('artery') ||
    t.includes('cranial nerve') ||
    t.includes('pharyngeal arch') ||
    t.includes('histology') ||
    t.includes('embryology')
  ) {
    return 'anatomical_structure';
  }

  if (
    s.includes('physio') ||
    t.includes('action potential') ||
    t.includes('membrane potential') ||
    t.includes('cardiac cycle') ||
    t.includes('wiggers') ||
    t.includes('compliance') ||
    t.includes('dissociation') ||
    t.includes('countercurrent') ||
    t.includes('gfr') ||
    t.includes('transport') ||
    t.includes('reflex')
  ) {
    return 'physiological_mechanism';
  }

  if (
    s.includes('pharm') ||
    t.includes('blocker') ||
    t.includes('agonist') ||
    t.includes('antagonist') ||
    t.includes('inhibitor') ||
    t.includes('antibiotic') ||
    t.includes('antidote') ||
    t.includes('autonomic') ||
    t.includes('diuretic') ||
    t.includes('chemotherapy') ||
    t.includes('toxicity') ||
    t.includes('drug') ||
    t.includes('nsaid')
  ) {
    return 'pharmacological_class';
  }

  if (
    s.includes('patho') ||
    t.includes('lymphoma') ||
    t.includes('leukemia') ||
    t.includes('neoplasm') ||
    t.includes('necrosis') ||
    t.includes('apoptosis') ||
    t.includes('amyloid') ||
    t.includes('inflammation') ||
    t.includes('glomerulonephritis') ||
    t.includes('granuloma') ||
    t.includes('anemia') ||
    t.includes('carcinoma')
  ) {
    return 'pathological_entity';
  }

  if (
    s.includes('micro') ||
    t.includes('bacillus') ||
    t.includes('cocci') ||
    t.includes('staphylococcus') ||
    t.includes('streptococcus') ||
    t.includes('virus') ||
    t.includes('fungus') ||
    t.includes('parasite') ||
    t.includes('malaria') ||
    t.includes('tuberculosis') ||
    t.includes('culture') ||
    t.includes('stain') ||
    t.includes('gram')
  ) {
    return 'microbiological_organism';
  }

  if (
    s.includes('psm') ||
    t.includes('immuniz') ||
    t.includes('cold chain') ||
    t.includes('vaccin') ||
    t.includes('nis') ||
    t.includes('epidemiolog') ||
    t.includes('biostat') ||
    t.includes('screening') ||
    t.includes('public health') ||
    t.includes('program')
  ) {
    return 'public_health_program';
  }

  if (
    s.includes('radio') ||
    t.includes('x-ray') ||
    t.includes('radiograph') ||
    t.includes('ct') ||
    t.includes('mri') ||
    t.includes('ultrasound') ||
    t.includes('ecg') ||
    t.includes('spirometry') ||
    t.includes('abg')
  ) {
    return 'diagnostic_investigation';
  }

  return 'clinical_disease';
}

/**
 * Normalized medical concept dictionaries & semantic expansions for FMGE topics.
 */
export const TOPIC_INTELLIGENCE_REGISTRY: Record<
  string,
  Omit<NormalizedTopicIntelligence, 'subjectId' | 'subjectName' | 'topicId'>
> = {
  // =================== BIOCHEMISTRY ===================
  'bio-1': {
    canonicalName: 'Enzyme Kinetics & Lineweaver-Burk Plots',
    topicType: 'biochemical_concept',
    conceptClusters: [
      'Michaelis-Menten kinetics and equation (V0 = Vmax[S] / (Km + [S]))',
      'Km definition (substrate concentration at 1/2 Vmax, inverse affinity)',
      'Vmax and enzyme saturation kinetics',
      'Lineweaver-Burk double-reciprocal plot (1/V0 vs 1/[S])',
      'x-intercept (-1/Km) and y-intercept (1/Vmax) on Lineweaver-Burk plot',
      'Lineweaver-Burk slope = Km / Vmax',
      'Competitive inhibition (increased Km, unchanged Vmax, overcome by high [S])',
      'Noncompetitive inhibition (unchanged Km, decreased Vmax, allosteric binding)',
      'Uncompetitive inhibition (decreased Km and decreased Vmax, parallel Lineweaver-Burk lines)',
      'Irreversible enzyme inhibition (Aspirin on COX, Organophosphates on AChE)',
      'Pharmacologic enzyme inhibitors (Statins competitive HMG-CoA reductase, Allopurinol xanthine oxidase, Methotrexate DHFR)',
    ],
    synonyms: [
      'enzyme kinetics',
      'Lineweaver Burk plot',
      'Michaelis Menten',
      'competitive noncompetitive inhibition',
      'Km and Vmax',
      'double reciprocal plot',
      'uncompetitive inhibition',
    ],
    relatedTerms: ['Km', 'Vmax', 'slope Km/Vmax', 'x-intercept', 'y-intercept', 'competitive', 'noncompetitive', 'uncompetitive', 'statin', 'allopurinol'],
    highYieldKeywords: ['enzyme', 'kinetics', 'lineweaver', 'burk', 'km', 'vmax', 'michaelis', 'competitive', 'noncompetitive', 'uncompetitive', 'inhibition'],
    negativeKeywords: ['myocardial', 'infarction', 'stemi', 'ecg', 'knee', 'brachial', 'parkland', 'pritchard', 'preeclampsia'],
  },
  'biochem-1': {
    canonicalName: 'Enzyme Kinetics & Lineweaver-Burk Plots',
    topicType: 'biochemical_concept',
    conceptClusters: [
      'Michaelis-Menten kinetics and equation (V0 = Vmax[S] / (Km + [S]))',
      'Km definition (substrate concentration at 1/2 Vmax, inverse affinity)',
      'Vmax and enzyme saturation kinetics',
      'Lineweaver-Burk double-reciprocal plot (1/V0 vs 1/[S])',
      'x-intercept (-1/Km) and y-intercept (1/Vmax) on Lineweaver-Burk plot',
      'Lineweaver-Burk slope = Km / Vmax',
      'Competitive inhibition (increased Km, unchanged Vmax, overcome by high [S])',
      'Noncompetitive inhibition (unchanged Km, decreased Vmax, allosteric binding)',
      'Uncompetitive inhibition (decreased Km and decreased Vmax, parallel Lineweaver-Burk lines)',
      'Irreversible enzyme inhibition (Aspirin on COX, Organophosphates on AChE)',
      'Pharmacologic enzyme inhibitors (Statins competitive HMG-CoA reductase, Allopurinol xanthine oxidase, Methotrexate DHFR)',
    ],
    synonyms: [
      'enzyme kinetics',
      'Lineweaver Burk plot',
      'Michaelis Menten',
      'competitive noncompetitive inhibition',
      'Km and Vmax',
      'double reciprocal plot',
    ],
    relatedTerms: ['Km', 'Vmax', 'slope Km/Vmax', 'x-intercept', 'y-intercept', 'competitive', 'noncompetitive', 'uncompetitive'],
    highYieldKeywords: ['enzyme', 'kinetics', 'lineweaver', 'burk', 'km', 'vmax', 'michaelis', 'competitive', 'noncompetitive', 'inhibition'],
    negativeKeywords: ['myocardial', 'infarction', 'stemi', 'ecg', 'knee', 'brachial', 'parkland', 'pritchard'],
  },

  // =================== ANATOMY ===================
  'anat-1': {
    canonicalName: 'Upper Limb - Brachial Plexus & Nerve Injuries',
    topicType: 'anatomical_structure',
    conceptClusters: [
      'brachial plexus roots (C5-T1), trunks (upper, middle, lower), divisions, cords (lateral, posterior, medial), terminal branches',
      'Erb-Duchenne palsy (C5-C6 upper trunk waiter\'s tip hand, loss of abduction/lateral rotation/supination)',
      'Klumpke paralysis (C8-T1 lower trunk total claw hand with intrinsic hand muscle paralysis & Horner syndrome)',
      'radial nerve injury at spiral groove of humerus (wrist drop, preserved triceps)',
      'median nerve injury at supracondylar fracture (hand of benediction) and carpal tunnel (ape thumb)',
      'ulnar nerve injury at medial epicondyle and Guyon canal (Froment sign, ulnar claw hand)',
      'axillary nerve injury at surgical neck of humerus (deltoid atrophy, regimental badge sensory loss)',
      'long thoracic nerve injury (serratus anterior paralysis, winged scapula)',
    ],
    synonyms: [
      'brachial plexus anatomy',
      'Erb palsy',
      'Klumpke palsy',
      'wrist drop radial nerve',
      'claw hand ulnar nerve',
      'winged scapula',
    ],
    relatedTerms: ['roots C5-T1', 'waiter tip', 'Froment test', 'spiral groove', 'surgical neck', 'serratus anterior'],
    highYieldKeywords: ['brachial', 'plexus', 'erb', 'klumpke', 'radial', 'ulnar', 'median', 'axillary', 'wrist drop', 'claw hand'],
    negativeKeywords: ['myocardial', 'infarction', 'stemi', 'ecg', 'knee', 'peroneal', 'parkland', 'organophosphate'],
  },

  'anat-4': {
    canonicalName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
    topicType: 'anatomical_structure',
    conceptClusters: [
      'knee joint ligaments (ACL, PCL, MCL, LCL)',
      'Lachman test (most sensitive) and anterior drawer test for ACL',
      'meniscal tears and McMurray test',
      'common peroneal nerve injury at fibular neck causing Foot Drop (loss of dorsiflexion and eversion)',
      'tibial nerve injury in popliteal fossa (loss of plantarflexion and inversion)',
      'popliteal fossa neurovascular contents from superficial to deep: Tibial Nerve -> Popliteal Vein -> Popliteal Artery',
      'popliteus muscle unlocking the knee joint by lateral rotation of femur',
      'Unholy Triad of O\'Donoghue (ACL + MCL + Medial Meniscus tear)',
    ],
    synonyms: [
      'knee anatomy',
      'cruciate ligaments',
      'peroneal palsy',
      'drop foot anatomy',
      'tibial nerve entrapment',
      'popliteal fossa anatomy',
    ],
    relatedTerms: ['Lachman', 'McMurray', 'fibular neck', 'dorsiflexion', 'plantarflexion', 'gastrocnemius', 'soleus'],
    highYieldKeywords: ['knee', 'peroneal', 'tibial', 'acl', 'pcl', 'meniscus', 'popliteal', 'fibula', 'lachman', 'mcmurray'],
    negativeKeywords: ['myocardial', 'infarction', 'stemi', 'ecg', 'arrhythmia', 'linezolid', 'preeclampsia', 'parkland', 'brachial', 'plexus', 'erb', 'klumpke', 'celiac', 'peritoneum'],
  },

  'anat-8': {
    canonicalName: 'Abdomen - Peritoneum, Epiploic Foramen & Celiac Trunk',
    topicType: 'anatomical_structure',
    conceptClusters: [
      'boundaries of Epiploic Foramen of Winslow (anterior: free edge of lesser omentum with portal triad; posterior: IVC; superior: caudate lobe of liver; inferior: 1st part of duodenum)',
      'Pringle maneuver (compression of hepatoduodenal ligament / portal triad to arrest hepatic bleeding)',
      'peritoneal recesses and pouches: Morison hepatorenal pouch (most dependent space in supine position, evaluated on FAST ultrasound)',
      'rectovesical pouch (males) and rectouterine pouch of Douglas (females, culdocentesis for ectopic pregnancy/pelvic fluid)',
      'celiac trunk (originates at T12 level, branches into Left Gastric, Splenic, and Common Hepatic arteries)',
      'peptic ulcer arterial erosion: posterior gastric wall ulcer erodes into Splenic Artery; posterior duodenal bulb ulcer erodes into Gastroduodenal Artery',
      'greater omentum ("policeman of abdomen") and lesser omentum (hepatogastric and hepatoduodenal ligaments)',
      'peritoneal folds and ligaments (median, medial, and lateral umbilical folds; falciform ligament with ligamentum teres hepatis)',
    ],
    synonyms: [
      'peritoneum and peritoneal cavity',
      'epiploic foramen of winslow',
      'celiac trunk anatomy',
      'morison pouch',
      'pouch of douglas',
      'omental bursa',
      'lesser sac and greater sac',
      'pringle maneuver',
      'celiac axis',
      'gastroduodenal artery ulcer bleed',
      'splenic artery ulcer bleed',
    ],
    relatedTerms: ['Winslow', 'Pringle', 'Morison pouch', 'Douglas pouch', 'hepatoduodenal', 'celiac trunk', 'splenic artery', 'gastroduodenal artery', 'left gastric artery', 'lesser sac'],
    highYieldKeywords: ['peritoneum', 'celiac', 'epiploic', 'winslow', 'morison', 'douglas', 'pringle', 'omental', 'omenta', 'gastric artery', 'splenic artery', 'gastroduodenal', 'hepatoduodenal', 'lesser sac'],
    negativeKeywords: [
      'brachial', 'plexus', 'erb', 'duchenne', 'klumpke', 'waiter tip', 'claw hand', 'wrist drop', 'radial nerve',
      'ulnar nerve', 'median nerve', 'axillary nerve', 'peroneal', 'knee joint', 'lachman', 'mcmurray', 'foot drop',
      'myocardial', 'infarction', 'stemi', 'ecg', 'asthma', 'copd', 'parkland',
    ],
  },

  'anat-13': {
    canonicalName: 'Embryology - Pharyngeal Arches, Pouches & Heart Dev',
    topicType: 'anatomical_structure',
    conceptClusters: [
      'Pharyngeal Arch derivatives & cranial nerves: Arch 1 (CN V3 - mastication, Meckel cartilage, malleus, incus); Arch 2 (CN VII - facial expression, Reichert cartilage, stapes, styloid); Arch 3 (CN IX - stylopharyngeus, greater horn of hyoid); Arch 4 (CN X superior laryngeal - cricothyroid, pharyngeal constrictors); Arch 6 (CN X recurrent laryngeal - intrinsic laryngeal muscles except cricothyroid)',
      'Pharyngeal Pouches: Pouch 1 (auditory tube, middle ear); Pouch 2 (palatine tonsil crypts); Pouch 3 (inferior parathyroids, thymus); Pouch 4 (superior parathyroids, ultimobranchial body / C-cells of thyroid)',
      'DiGeorge syndrome (22q11 microdeletion: failure of 3rd and 4th pharyngeal pouches -> absent thymus / T-cell deficiency, absent parathyroids / hypocalcemia, conotruncal heart defects)',
      'Pharyngeal Clefts: Cleft 1 (external acoustic meatus); persistent cleft 2-4 (branchial cleft cyst lateral to sternocleidomastoid)',
      'Heart Embryology: Truncus arteriosus (ascending aorta & pulmonary trunk via neural crest cell spiraling); Bulbus cordis (smooth outflow tracts RV conus & LV vestibule); Primitive ventricle (trabeculated RV/LV); Primitive atrium (trabeculated RA/LA)',
      'Sinus venosus: right horn forms smooth part of RA (sinus venarum); left horn forms coronary sinus',
      'Endocardial cushions: atrial septum primum/secundum, membranous ventricular septum, AV valves (failure -> AV canal defect in Down syndrome)',
      'Aortic arch derivatives: Arch 1 (maxillary artery); Arch 2 (stapedial artery); Arch 3 (common carotid & proximal ICA); Arch 4 (systemic aortic arch on left, proximal subclavian on right); Arch 6 (pulmonary arteries & ductus arteriosus)',
    ],
    synonyms: [
      'pharyngeal arches',
      'branchial apparatus',
      'pharyngeal pouches and clefts',
      'cardiac embryology',
      'digeorge syndrome embryology',
      'truncus arteriosus development',
      'endocardial cushion defect',
      'aortic arch derivatives',
    ],
    relatedTerms: ['pharyngeal arch', 'pharyngeal pouch', 'pharyngeal cleft', 'truncus arteriosus', 'bulbus cordis', 'sinus venosus', 'endocardial cushion', 'Meckel', 'Reichert', 'DiGeorge', 'neural crest'],
    highYieldKeywords: ['pharyngeal', 'arch', 'pouch', 'cleft', 'branchial', 'embryology', 'truncus arteriosus', 'bulbus cordis', 'sinus venosus', 'endocardial cushion', 'digeorge', 'meckel', 'reichert', 'aortic arch'],
    negativeKeywords: [
      'brachial plexus', 'erb', 'klumpke', 'waiter tip', 'claw hand', 'wrist drop', 'radial nerve',
      'peroneal', 'knee joint', 'foot drop', 'popliteal', 'inguinal hernia', 'myocardial infarction stemi',
    ],
  },

  // =================== PHYSIOLOGY ===================
  'phys-2': {
    canonicalName: 'Nerve-Muscle Physiology & Action Potentials',
    topicType: 'physiological_mechanism',
    conceptClusters: [
      'resting membrane potential (-70 mV nerve, -90 mV skeletal muscle, Na+/K+ ATPase electrogenic pump)',
      'Nernst equation and Goldman-Hodgkin-Katz equation for membrane potential',
      'phase 0 depolarization: voltage-gated Na+ channels activation (blocked by Tetrodotoxin TTX, Saxitoxin)',
      'phase 1 & 2 repolarization: voltage-gated K+ channels activation (blocked by Tetraethylammonium TEA)',
      'absolute refractory period (inactivated Na+ channels) vs relative refractory period',
      'myelinated nerve saltatory conduction at nodes of Ranvier (proportional to fiber diameter)',
      'neuromuscular junction transmission: ACh release (blocked by Botulinum toxin), nicotinic ACh receptors (blocked by Curare)',
      'excitation-contraction coupling: Ryanodine receptor (RyR1), DHPR, and SERCA Ca2+ reuptake',
    ],
    synonyms: [
      'action potential',
      'resting membrane potential',
      'depolarization repolarization',
      'saltatory conduction',
      'neuromuscular junction',
      'voltage gated channels',
    ],
    relatedTerms: ['Na+ channel', 'K+ channel', 'depolarization', 'repolarization', 'refractory period', 'tetrodotoxin', 'myelin'],
    highYieldKeywords: ['action potential', 'depolarization', 'repolarization', 'resting membrane', 'sodium', 'potassium', 'refractory', 'nerve'],
    negativeKeywords: ['myocardial infarction', 'stemi', 'knee joint', 'parkland', 'pritchard'],
  },

  // =================== PHARMACOLOGY ===================
  'pharm-2': {
    canonicalName: 'Autonomic Nervous System - Adrenergic Agonists & Beta Blockers',
    topicType: 'pharmacological_class',
    conceptClusters: [
      'adrenergic receptor subtypes: Alpha-1 (Gq -> IP3/DAG -> vasoconstriction), Alpha-2 (Gi -> decreased cAMP -> auto-inhibition)',
      'Beta-1 (Gs -> increased cAMP -> positive inotropy/chronotropy), Beta-2 (Gs -> bronchodilation, vasodilation), Beta-3 (lipolysis)',
      'cardioselective Beta-1 blockers mnemonic AMEBA: Atenolol, Metoprolol, Esmolol, Bisoprolol, Acebutolol',
      'non-selective Beta blockers (Propranolol, Timolol, Nadolol)',
      'combined Alpha + Beta blockers: Labetalol (drug of choice in pregnancy/preeclampsia & aortic dissection), Carvedilol (heart failure GDMT)',
      'Beta-blockers with intrinsic sympathomimetic activity (ISA): Pindolol, Acebutolol',
      'Beta-blocker indications: Hypertension, Post-MI, HFrEF, Angina, Thyrotoxicosis, Essential tremor',
      'contraindications: Severe Asthma/COPD (bronchospasm), Bradycardia / High-degree AV Block, Raynaud phenomenon',
      'Beta-blocker overdose antidote: Intravenous Glucagon (bypasses beta receptors to increase intracellular cAMP)',
    ],
    synonyms: [
      'beta blockers pharmacology',
      'adrenergic antagonists',
      'cardioselective beta blockers',
      'labetalol propranolol metoprolol',
      'glucagon antidote beta blocker',
    ],
    relatedTerms: ['beta-1', 'beta-2', 'metoprolol', 'propranolol', 'labetalol', 'esmolol', 'carvedilol', 'glucagon', 'bronchospasm'],
    highYieldKeywords: ['beta blocker', 'metoprolol', 'propranolol', 'atenolol', 'labetalol', 'carvedilol', 'glucagon', 'adrenergic', 'cardioselective'],
    negativeKeywords: ['brachial plexus', 'knee joint', 'parkland', 'pritchard', 'organophosphate'],
  },

  // =================== PATHOLOGY ===================
  'path-8': {
    canonicalName: 'Hematology - Hodgkin & Non-Hodgkin Lymphomas',
    topicType: 'pathological_entity',
    conceptClusters: [
      'Hodgkin Lymphoma hallmark: Reed-Sternberg cells ("owl-eye" binucleated giant cells with prominent eosinophilic nucleoli)',
      'Reed-Sternberg cell immunophenotype: CD15 (+) and CD30 (+) in classic subtypes; CD45 (-) and CD20 (-)',
      'subtypes: Nodular Sclerosis (most common ~70%, lacunar cells, collagen bands, young females, excellent prognosis)',
      'Mixed Cellularity (EBV associated ~70%, eosinophils, biphasic age distribution)',
      'Lymphocyte Rich (best prognosis) vs Lymphocyte Depleted (worst prognosis, elderly/HIV)',
      'Lymphocyte Predominant Nodular Hodgkin: "Popcorn cells" (L&H cells), CD20 (+), CD45 (+), CD15 (-), CD30 (-)',
      'clinical features: painless cervical lymphadenopathy, Pel-Ebstein fever, alcohol-induced lymph node pain, B symptoms (fever, night sweats, >10% weight loss)',
      'Ann Arbor staging system and ABVD chemotherapy regimen (Adriamycin/Doxorubicin, Bleomycin, Vinblastine, Dacarbazine)',
    ],
    synonyms: [
      'Hodgkin lymphoma pathology',
      'Reed Sternberg cells',
      'CD15 CD30 lymphoma',
      'nodular sclerosis Hodgkin',
      'Ann Arbor staging',
      'ABVD regimen',
    ],
    relatedTerms: ['Reed Sternberg', 'CD15', 'CD30', 'owl eye', 'nodular sclerosis', 'Pel-Ebstein', 'Ann Arbor', 'ABVD', 'lacunar cell'],
    highYieldKeywords: ['hodgkin', 'lymphoma', 'reed', 'sternberg', 'cd15', 'cd30', 'nodular sclerosis', 'pel ebstein', 'abvd'],
    negativeKeywords: ['stemi', 'myocardial infarction', 'brachial plexus', 'knee joint', 'organophosphate', 'parkland'],
  },

  // =================== MEDICINE ===================
  'med-1': {
    canonicalName: 'Cardiology - Arrhythmias & Pre-excitation (WPW, AV Blocks)',
    topicType: 'clinical_disease',
    conceptClusters: [
      'Wolff-Parkinson-White (WPW) syndrome: bundle of Kent accessory pathway, short PR interval (<120ms), delta wave, wide QRS',
      'WPW management: Procainamide or Ibutilide for stable AF in WPW; Radiofrequency ablation is definitive cure',
      'contraindicated drugs in WPW + AFib: ABCD (Adenosine, Beta-blockers, Calcium channel blockers, Digoxin - block AV node and cause VFib)',
      'Paroxysmal Supraventricular Tachycardia (PSVT): Adenosine is first-line drug of choice (rapid IV push 6mg -> 12mg)',
      'Atrioventricular (AV) Blocks: 1st degree (prolonged PR >200ms), 2nd degree Mobitz I Wenckebach (progressive PR prolongation), Mobitz II (intermittent dropped QRS, requires pacemaker)',
      '3rd degree Complete Heart Block (AV dissociation, cannon a-waves in JVP, Stokes-Adams attacks, permanent pacemaker indicated)',
      'Atrial Fibrillation: irregularly irregular rhythm, absent P waves, CHA2DS2-VASc score for anticoagulation (DOACs preferred)',
    ],
    synonyms: [
      'WPW syndrome',
      'arrhythmias cardiology',
      'AV block heart blocks',
      'adenosine PSVT',
      'atrial fibrillation anticoagulation',
      'delta wave ECG',
    ],
    relatedTerms: ['wpw', 'delta wave', 'bundle of kent', 'adenosine', 'procainamide', 'psvt', 'complete heart block', 'cha2ds2-vasc', 'afib'],
    highYieldKeywords: ['wpw', 'arrhythmia', 'delta wave', 'adenosine', 'heart block', 'afib', 'psvt', 'procainamide', 'ecg'],
    negativeKeywords: ['asthma', 'copd', 'brachial plexus', 'knee joint', 'parkland', 'pritchard'],
  },

  'med-2': {
    canonicalName: 'Cardiology - Acute Coronary Syndromes (ACS) & Heart Failure',
    topicType: 'clinical_disease',
    conceptClusters: [
      'STEMI vs NSTEMI vs Unstable Angina: full-thickness vs subendocardial ischemia, cardiac biomarkers (Cardiac Troponin I/T is most specific, CK-MB for reinfarction within 48-72h)',
      'ECG localization: Inferior wall (II, III, aVF - RCA), Anteroseptal (V1-V4 - LAD), Lateral (I, aVL, V5, V6 - LCx), Right Ventricular MI (V3R-V4R - avoid nitrates, give IV normal saline)',
      'Primary PCI within 90 minutes door-to-balloon time; Thrombolysis (tPA/Tenecteplase) within 30 minutes door-to-needle time if PCI unavailable within 120 mins',
      'Dual Antiplatelet Therapy (DAPT): Aspirin + P2Y12 inhibitor (Ticagrelor or Prasugrel over Clopidogrel)',
      'Heart Failure with reduced Ejection Fraction (HFrEF, EF <= 40%): 4 pillars of Guideline-Directed Medical Therapy (GDMT): (1) ARNI/ACEi/ARB, (2) Beta-blocker (Metoprolol succinate, Carvedilol, Bisoprolol), (3) MRA (Spironolactone, Eplerenone), (4) SGLT2 inhibitor (Empagliflozin, Dapagliflozin)',
      'Killip classification in post-MI heart failure (Class I no rales, Class II crackles <50%, Class III pulmonary edema, Class IV cardiogenic shock)',
    ],
    synonyms: [
      'acute coronary syndrome',
      'acute coronary syndrome & stemi',
      'stemi and nstemi',
      'myocardial infarction',
      'heart failure gdmt',
      'troponin ck-mb mi',
      'inferior wall mi rv infarction',
      'killip classification',
    ],
    relatedTerms: ['stemi', 'nstemi', 'troponin', 'pci', 'rca', 'lad', 'lcx', 'rv infarction', 'dapt', 'aspirin', 'heart failure', 'gdmt', 'spironolactone', 'sglt2i'],
    highYieldKeywords: ['stemi', 'nstemi', 'infarction', 'coronary', 'troponin', 'pci', 'heart failure', 'killip', 'angina'],
    negativeKeywords: ['brachial plexus', 'knee joint', 'parkland', 'pritchard', 'organophosphate'],
  },

  'med-4': {
    canonicalName: 'Pulmonology - Asthma (GINA Guidelines), COPD (GOLD Guidelines)',
    topicType: 'clinical_disease',
    conceptClusters: [
      'Asthma pathophysiology: reversible bronchoconstriction, airway hyperresponsiveness, eosinophilic inflammation, Charcot-Leyden crystals & Curschmann spirals',
      'GINA 2023/2024 Asthma Guidelines: Track 1 preferred controller/reliever is low-dose ICS-Formoterol across all severity steps; SABA monotherapy no longer recommended',
      'PFT spirometry in Asthma: Obstructive pattern (FEV1/FVC < 0.70) with significant bronchodilator reversibility (>12% and >200 mL increase in FEV1)',
      'COPD pathophysiology: irreversible airflow limitation, emphysema (centrilobular in smokers, panacinar in Alpha-1 Antitrypsin deficiency) & chronic bronchitis',
      'GOLD Guidelines for COPD: Post-bronchodilator FEV1/FVC < 0.70 (fixed non-reversible obstruction); GOLD 1 (FEV1 >= 80%) to GOLD 4 (FEV1 < 30%)',
      'GOLD Pharmacotherapy Groups A, B, E: Group A (Bronchodilator), Group B (LABA + LAMA), Group E (LABA + LAMA, add ICS if blood eosinophils >= 300)',
      'COPD mortality reduction interventions: (1) Smoking Cessation, (2) Long-term Oxygen Therapy (LTOT if PaO2 <= 55 mmHg or SaO2 <= 88%)',
      'Acute exacerbation management: Systemic corticosteroids, nebulized SABA+SAMA (Ipratropium), and antibiotics if increased sputum purulence',
    ],
    synonyms: [
      'asthma GINA guidelines',
      'COPD GOLD guidelines',
      'asthma vs COPD spirometry',
      'ICS formoterol asthma',
      'LAMA LABA COPD',
      'smoking cessation LTOT',
      'obstructive airway disease',
    ],
    relatedTerms: ['gina', 'gold', 'fev1/fvc', 'ics-formoterol', 'lama', 'laba', 'tiotropium', 'salbutamol', 'ltot', 'spirometry', 'reversibility'],
    highYieldKeywords: ['asthma', 'copd', 'gina', 'gold', 'spirometry', 'fev1', 'bronchodilator', 'ics', 'formoterol', 'tiotropium', 'emphysema'],
    negativeKeywords: ['rv infarction', 'rca occlusion', 'stemi', 'inferior mi', 'wpw', 'brachial plexus', 'knee joint', 'parkland', 'pritchard'],
  },
};

/**
 * Resolves normalized intelligence for any topic across the 19 subjects.
 */
export function getNormalizedTopicIntelligence(
  subjectId: string,
  topicId: string,
  topicName?: string
): NormalizedTopicIntelligence {
  const foundSubject = FMGE_SUBJECTS.find(s => s.id === subjectId);
  const subjectName = foundSubject?.name || subjectId;
  const resolvedTopicName = topicName || foundSubject?.topics.find(t => t.id === topicId)?.name || topicId;

  // 1. Direct registry lookup by exact ID if canonical name or synonyms match resolved topic name
  const exact = TOPIC_INTELLIGENCE_REGISTRY[topicId];
  if (exact) {
    const exactLower = exact.canonicalName.toLowerCase();
    const resolvedLower = resolvedTopicName.toLowerCase();
    const isTopicMatch =
      exactLower.includes(resolvedLower) ||
      resolvedLower.includes(exactLower) ||
      exact.synonyms.some(s => resolvedLower.includes(s.toLowerCase()) || s.toLowerCase().includes(resolvedLower));

    if (isTopicMatch) {
      return {
        subjectId,
        subjectName,
        topicId,
        canonicalName: exact.canonicalName,
        topicType: exact.topicType,
        conceptClusters: exact.conceptClusters,
        synonyms: exact.synonyms,
        relatedTerms: exact.relatedTerms,
        highYieldKeywords: exact.highYieldKeywords,
        negativeKeywords: exact.negativeKeywords,
      };
    }
  }

  // 2. Lookup by topic name keywords in registry
  const lowerName = resolvedTopicName.toLowerCase().trim();
  for (const [key, val] of Object.entries(TOPIC_INTELLIGENCE_REGISTRY)) {
    const valName = val.canonicalName.toLowerCase().trim();
    // Strict exact match or synonym match
    if (
      valName === lowerName ||
      val.synonyms.some(s => s.toLowerCase().trim() === lowerName)
    ) {
      return {
        subjectId,
        subjectName,
        topicId,
        canonicalName: val.canonicalName,
        topicType: val.topicType,
        conceptClusters: val.conceptClusters,
        synonyms: val.synonyms,
        relatedTerms: val.relatedTerms,
        highYieldKeywords: val.highYieldKeywords,
        negativeKeywords: val.negativeKeywords,
      };
    }
  }

  // 3. Dynamic Topic-Type-Aware Intelligence Generation
  const topicType = detectTopicCategory(subjectId, resolvedTopicName);
  const cleanTokens = resolvedTopicName
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !['and', 'the', 'for', 'with', 'from'].includes(t.toLowerCase()));

  let conceptClusters: string[] = [];

  switch (topicType) {
    case 'biochemical_concept':
      conceptClusters = [
        `Fundamental molecular mechanisms, biochemical equations & enzyme reactions in ${resolvedTopicName}`,
        `Key rate-limiting enzymes, cofactors, regulatory activators & allosteric inhibitors in ${resolvedTopicName}`,
        `Kinetic curves, Lineweaver-Burk double-reciprocal plots, Km & Vmax alterations in ${resolvedTopicName}`,
        `Clinical inborn errors of metabolism, enzymatic deficiencies & diagnostic biomarker assays`,
        `Pharmacological enzyme inhibitors, target receptors & high-frequency FMGE exam pearls`,
      ];
      break;

    case 'anatomical_structure': {
      const lowerT = resolvedTopicName.toLowerCase();
      const isVisceral = lowerT.includes('abdomen') || lowerT.includes('peritone') || lowerT.includes('celiac') || lowerT.includes('pelvi') || lowerT.includes('hernia') || lowerT.includes('thorax') || lowerT.includes('mediastin') || lowerT.includes('lung') || lowerT.includes('viscera');
      const isCranial = lowerT.includes('head') || lowerT.includes('neck') || lowerT.includes('cranial') || lowerT.includes('pharyn') || lowerT.includes('laryn') || lowerT.includes('triang');
      const isEmbryo = lowerT.includes('embryo') || lowerT.includes('arch') || lowerT.includes('pouch') || lowerT.includes('cleft') || lowerT.includes('develop');

      if (isVisceral) {
        conceptClusters = [
          `Peritoneal folds, omenta, spaces & dependent fluid accumulation recesses (Morison & Douglas pouches) in ${resolvedTopicName}`,
          `Visceral arterial trunks, branches, collateral anastomotic arcades & surgical clamping maneuvers`,
          `High-frequency surgical landmarks, hernia orifices, visceral relations & cross-sectional imaging`,
          `Vascular erosion in peptic ulceration, visceral ischemia & emergency trauma FAST ultrasound findings`,
          `FMGE discriminator surgical buzzwords, fascial boundaries & classic examiner traps`,
        ];
      } else if (isEmbryo) {
        conceptClusters = [
          `Embryological germ layers, pharyngeal apparatus, arches, pouches & cleft derivatives in ${resolvedTopicName}`,
          `Cranial nerve innervation and skeletal/muscular derivatives of individual embryonic structures`,
          `Congenital malformations, branchial anomalies, persistent embryonic structures & syndromic associations`,
          `Cardiovascular development, septation mechanisms, aortic arch derivatives & congenital heart anomalies`,
          `FMGE embryology discriminator pearls, high-yield timeline milestones & classic exam traps`,
        ];
      } else if (isCranial) {
        conceptClusters = [
          `Cranial triangles, fascial layers & topographical relations in ${resolvedTopicName}`,
          `Course of cranial nerves, parasympathetic ganglia, autonomic pathways & foramina of skull base`,
          `Neurovascular relations, carotid sheath contents, venous sinuses & lymphatic drainage levels`,
          `Surgical approaches, nerve preservation landmarks & clinical entrapment/palsy signs`,
          `FMGE head & neck discriminator pearls, cross-sectional landmarks & examiner traps`,
        ];
      } else {
        conceptClusters = [
          `Anatomical boundaries, fascial compartments, nerve roots & vascular relations in ${resolvedTopicName}`,
          `Course of peripheral nerves, motor branches, sensory innervation & cutaneous dermatomes`,
          `Classic nerve entrapment syndromes, traumatic injuries, muscle denervation & postural signs`,
          `Surgical landmarks, fascial spaces, collateral anastomoses & clinical examination maneuvers`,
          `FMGE discriminator buzzwords, anatomical relations & classic examiner traps`,
        ];
      }
      break;
    }

    case 'physiological_mechanism':
      conceptClusters = [
        `Biophysical mechanisms, ion channel gating, electrochemical gradients & resting potentials in ${resolvedTopicName}`,
        `Dynamic physiological curves, nomograms, pressure-volume loops & regulatory feedback loops`,
        `Homeostatic responses, autonomic nervous regulation & organ clearance mechanisms`,
        `Pathophysiological alterations in disease states, compensatory reflexes & clinical manifestations`,
        `High-yield physiological calculations, normal laboratory reference values & FMGE traps`,
      ];
      break;

    case 'pharmacological_class':
      conceptClusters = [
        `Mechanism of action, target receptor selectivity, intracellular signaling pathways & pharmacodynamics in ${resolvedTopicName}`,
        `Pharmacokinetic profiles: bioavailability, hepatic CYP metabolism, renal elimination & half-life`,
        `First-line clinical indications, guideline-directed evidence & comparative efficacy`,
        `Critical contraindications, black-box warnings, adverse drug reactions & severe drug interactions`,
        `Toxicology, specific reversal antidotes, management of acute overdose & FMGE traps`,
      ];
      break;

    case 'pathological_entity':
      conceptClusters = [
        `Pathogenesis, etiology, cellular injury mechanisms, molecular oncogenes & genetic mutations in ${resolvedTopicName}`,
        `Gross anatomical morphology, characteristic microscopic histopathology & pathognomonic diagnostic cells`,
        `Immunohistochemistry markers (IHC), cluster of differentiation (CD) antigens & molecular cytogenetics`,
        `Clinical presentation, paraneoplastic syndromes, staging classification systems & prognostic determinants`,
        `High-yield histopathological buzzwords, classic slide appearances & FMGE discriminator tips`,
      ];
      break;

    case 'microbiological_organism':
      conceptClusters = [
        `Microbiological characteristics: morphology, Gram stain/special stains, motility & virulence factors in ${resolvedTopicName}`,
        `Pathogenesis, transmission dynamics, clinical syndromes & toxin-mediated complications`,
        `Laboratory diagnosis: culture media, biochemical identification, serological titers & molecular PCR`,
        `First-line antimicrobial pharmacotherapy, drug-resistance mechanisms & second-line regimens`,
        `Vaccination protocols, prophylaxis guidelines, vector control & FMGE exam traps`,
      ];
      break;

    case 'public_health_program':
      conceptClusters = [
        `Epidemiological principles: incidence, prevalence, study designs, sensitivity, specificity & predictive values in ${resolvedTopicName}`,
        `National Health Programs, National Immunization Schedule (NIS) timelines, cold chain equipment & VVM indicators`,
        `Disease transmission dynamics, vector indices, surveillance strategies & outbreak control measures`,
        `Biostatistical tests: Chi-square, Student t-test, ANOVA, p-values & interpretation of confidence intervals`,
        `Screening criteria, public health benchmarks, sustainable development goals (SDGs) & FMGE pearls`,
      ];
      break;

    case 'diagnostic_investigation':
      conceptClusters = [
        `Principles of investigation, diagnostic methodology, normal baseline appearances & technical parameters in ${resolvedTopicName}`,
        `Pathognomonic imaging signs, classic radiological patterns, waveforms & diagnostic criteria`,
        `Best initial screening investigation vs gold-standard confirmatory diagnostic modalities`,
        `Sensitivity, specificity, common imaging artifacts & clinical diagnostic pitfalls`,
        `Discriminator features separating lookalike conditions & FMGE high-yield takeaways`,
      ];
      break;

    case 'clinical_disease':
    default:
      conceptClusters = [
        `Pathophysiology, clinical risk factors & cardinal presenting signs in ${resolvedTopicName}`,
        `Diagnostic algorithms, best initial tests vs gold-standard confirmatory investigations`,
        `Guideline-directed medical management, first-line medications (DOC) & interventional procedures`,
        `Emergency stabilization protocols, acute complications & intensive care management`,
        `Lookalike differential diagnoses, high-yield clinical buzzwords & FMGE exam traps`,
      ];
      break;
  }

  const kb = getMedicalTopicKnowledge(subjectId, topicId, resolvedTopicName);
  if (kb && kb.coreConcepts && kb.coreConcepts.length > 0) {
    conceptClusters = kb.coreConcepts;
  }

  return {
    subjectId,
    subjectName,
    topicId,
    canonicalName: resolvedTopicName,
    topicType,
    conceptClusters,
    synonyms: [`${subjectName} ${resolvedTopicName}`, `${resolvedTopicName} FMGE review`],
    relatedTerms: cleanTokens,
    highYieldKeywords: [subjectId, ...cleanTokens],
    negativeKeywords: ['irrelevant medical entity'],
  };
}

/**
 * Creates a canonical TopicLearningContext object that is passed immutably to all learning modules.
 */
export function getTopicLearningContext(
  subjectId: string,
  topicId: string,
  topicName?: string,
  meta?: {
    accuracy?: number;
    totalAttempts?: number;
    repeatedErrorsCount?: number;
  }
): TopicLearningContext {
  const intel = getNormalizedTopicIntelligence(subjectId, topicId, topicName);
  const foundSubject = FMGE_SUBJECTS.find(s => s.id === subjectId);
  const foundTopic = foundSubject?.topics.find(t => t.id === topicId);
  const isHighYield = foundTopic?.isHighYield ?? true;
  const estimatedMarks = Math.max(
    2,
    Math.round(((foundSubject?.weightage || 15) / Math.max(1, foundSubject?.topics.length || 10)) * 1.8)
  );

  let fmgePriority: TopicLearningContext['fmgePriority'] = 'HIGH';
  if ((meta?.accuracy !== undefined && meta.accuracy < 50) || (meta?.repeatedErrorsCount || 0) >= 2) {
    fmgePriority = 'URGENT CORE';
  } else if (isHighYield) {
    fmgePriority = 'VERY HIGH';
  }

  return {
    subjectId: intel.subjectId,
    subjectName: intel.subjectName,
    topicId: intel.topicId,
    topicName: intel.canonicalName,
    topicType: intel.topicType,
    subtopicId: topicId,
    subtopicName: intel.canonicalName,
    fmgePriority,
    estimatedMarks,
    isHighYield,
    conceptClusters: intel.conceptClusters,
    synonyms: intel.synonyms,
    clinicalConcepts: intel.conceptClusters.slice(0, 3),
    commonExamTraps: [
      `Commonly confused lookalike entities and examiner traps in ${intel.canonicalName}`,
      `Distractor options and contraindicated interventions in ${intel.subjectName}`,
    ],
    highYieldKeywords: intel.highYieldKeywords,
    negativeKeywords: intel.negativeKeywords,
  };
}

/**
 * Generates specific, high-precision search query variations for YouTube and clinical literature.
 */
export function generateTopicSearchQueries(topic: NormalizedTopicIntelligence | TopicLearningContext): string[] {
  const queries: string[] = [];
  const canonicalName = 'canonicalName' in topic ? topic.canonicalName : topic.topicName;

  queries.push(`FMGE ${topic.subjectName} ${canonicalName} rapid revision`);

  if (topic.conceptClusters.length > 0) {
    const cluster1 = topic.conceptClusters[0].replace(/\([^)]*\)/g, '').trim();
    queries.push(`medical ${topic.subjectName} ${cluster1} review`);
  }

  if (topic.conceptClusters.length > 1) {
    const cluster2 = topic.conceptClusters[1].replace(/\([^)]*\)/g, '').trim();
    queries.push(`${topic.subjectName} ${cluster2} high yield`);
  }

  if (topic.synonyms && topic.synonyms.length > 0) {
    queries.push(`FMGE ${topic.synonyms[0]}`);
  }

  queries.push(`FMGE ${topic.subjectName} ${canonicalName} PYQ clinical review`);

  return Array.from(new Set(queries)).slice(0, 6);
}

/**
 * Computes a weighted semantic relevance score (0-100) for a video/question against topic intelligence.
 */
export function calculateSemanticRelevanceScore(
  text: string,
  topic: NormalizedTopicIntelligence
): { score: number; isRelevant: boolean; reason: string } {
  const lowerText = text.toLowerCase();

  for (const neg of topic.negativeKeywords) {
    if (lowerText.includes(neg.toLowerCase())) {
      return {
        score: 0,
        isRelevant: false,
        reason: `Disqualified: Content heavily mentions off-target clinical entity "${neg}".`,
      };
    }
  }

  let score = 20;
  const matchedConcepts: string[] = [];

  let kwMatches = 0;
  for (const kw of topic.highYieldKeywords) {
    if (lowerText.includes(kw.toLowerCase())) {
      kwMatches++;
      matchedConcepts.push(kw);
    }
  }
  score += Math.min(40, kwMatches * 10);

  for (const syn of topic.synonyms) {
    if (lowerText.includes(syn.toLowerCase())) {
      score += 20;
      matchedConcepts.push(syn);
    }
  }

  for (const term of topic.relatedTerms) {
    if (lowerText.includes(term.toLowerCase())) {
      score += 5;
    }
  }

  score = Math.min(100, score);
  const isRelevant = score >= 35 && (kwMatches >= 1 || matchedConcepts.length >= 1);

  return {
    score,
    isRelevant,
    reason: isRelevant
      ? `Strong medical concept alignment with: ${matchedConcepts.slice(0, 3).join(', ')}`
      : 'Insufficient concept overlap with requested topic.',
  };
}
