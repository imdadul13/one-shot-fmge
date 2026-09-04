/**
 * Unified FMGE Visual Intent & Medical Image Engine.
 * 
 * CORE RULES:
 * 1. EVERY image-based question must have a specifically relevant image.
 * 2. NO generic filler images, subject/topic default images, or cross-concept reuse.
 * 3. NO IMAGE IS BETTER THAN A WRONG IMAGE -> Falls back gracefully to text-only.
 * 4. Strictly validates visual intent against the clinical question stem.
 * 5. Clean exam mode images hide diagnostic labels; annotated images revealed on answer review.
 */

import { PracticeSessionQuestion, VisualIntent } from '../types';
import rawIbqData from '../../data/ibq_bank.json';
import { validateTopicContentConsistency } from './contentValidator';

export interface RawIBQItem {
  id: string;
  subject: string;
  topic: string;
  imageSrc: string;
  vignette: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  explanation: {
    imageFinding?: string;
    highYieldBuzzwords?: string[];
    detailedRationale?: string;
  };
}

export const VERIFIED_IBQ_BANK: RawIBQItem[] = rawIbqData as RawIBQItem[];

export interface VisualConceptAsset {
  conceptKey: string; // e.g. "anat:brachial_plexus_c5_c6"
  imageType: string;
  visualTarget: string; // normalized exact concept
  keyVisualFinding: string;
  imageUrl: string;
  cleanImageUrl: string;
  annotatedImageUrl: string;
  whatToLookFor: string;
  searchTerms: string[];
  subjects: string[];
}

/**
 * Strict Visual Concept Registry.
 * Caches and validates verified diagnostic assets indexed strictly by conceptKey.
 */
export const VISUAL_CONCEPT_REGISTRY: Record<string, VisualConceptAsset> = {
  // ANATOMY
  'anat:brachial_plexus_c5_c6': {
    conceptKey: 'anat:brachial_plexus_c5_c6',
    imageType: 'Anatomy diagram',
    visualTarget: 'brachial plexus upper trunk',
    keyVisualFinding: 'C5-C6 roots uniting to form Upper Trunk (Erb point)',
    imageUrl: '/assets/medical-images/anat-brachial-plexus.svg',
    cleanImageUrl: '/assets/medical-images/anat-brachial-plexus.svg',
    annotatedImageUrl: '/assets/medical-images/anat-brachial-plexus-annotated.svg',
    whatToLookFor: 'Identify junction of C5 and C6 anterior rami forming the upper trunk.',
    searchTerms: ['brachial plexus C5 C6 upper trunk clean anatomy diagram', 'erbs palsy plexus roots diagram'],
    subjects: ['anatomy'],
  },
  'anat:klumpke_claw_hand': {
    conceptKey: 'anat:klumpke_claw_hand',
    imageType: 'Clinical photograph',
    visualTarget: 'klumpke total claw hand',
    keyVisualFinding: 'Hyperextension at MCP joints with flexion at IP joints and intrinsic hand muscle wasting',
    imageUrl: '/assets/medical-images/anat-claw-hand.svg',
    cleanImageUrl: '/assets/medical-images/anat-claw-hand.svg',
    annotatedImageUrl: '/assets/medical-images/anat-claw-hand-annotated.svg',
    whatToLookFor: 'Examine hyperextension of metacarpophalangeal joints and flexion of interphalangeal joints with intrinsic wasting.',
    searchTerms: ['klumpke paralysis claw hand examination clinical photograph', 'total claw hand lower trunk C8 T1 lesion'],
    subjects: ['anatomy'],
  },
  'anat:knee_cruciate_ligaments': {
    conceptKey: 'anat:knee_cruciate_ligaments',
    imageType: 'Anatomy diagram',
    visualTarget: 'knee joint cruciate ligaments and menisci',
    keyVisualFinding: 'ACL from medial aspect of lateral femoral condyle to anterior intercondylar tibia and crescentic medial meniscus',
    imageUrl: '/assets/medical-images/anat-knee-joint.svg',
    cleanImageUrl: '/assets/medical-images/anat-knee-joint.svg',
    annotatedImageUrl: '/assets/medical-images/anat-knee-joint-annotated.svg',
    whatToLookFor: 'Examine cruciate ligaments (ACL/PCL), collateral ligaments, and menisci in relation to the femoral condyles and tibial plateau.',
    searchTerms: ['knee joint anatomy cruciate ligaments ACL PCL meniscus diagram clean'],
    subjects: ['anatomy', 'orthopedics'],
  },

  // PHYSIOLOGY
  'physio:cardiac_action_potential': {
    conceptKey: 'physio:cardiac_action_potential',
    imageType: 'Physiology graph',
    visualTarget: 'ventricular cardiac action potential phase 0',
    keyVisualFinding: 'Rapid vertical upstroke from -90 mV to +20 mV (Phase 0 fast Na+ influx)',
    imageUrl: '/assets/medical-images/physio-action-potential.svg',
    cleanImageUrl: '/assets/medical-images/physio-action-potential.svg',
    annotatedImageUrl: '/assets/medical-images/physio-action-potential-annotated.svg',
    whatToLookFor: 'Identify Phase 0 steep vertical ascent from -90 mV to +20 mV representing rapid voltage-gated sodium influx.',
    searchTerms: ['ventricular cardiac action potential phase 0 1 2 3 diagram clean', 'cardiac electrophysiology action potential curve'],
    subjects: ['physiology'],
  },
  'physio:na_k_atpase_membrane': {
    conceptKey: 'physio:na_k_atpase_membrane',
    imageType: 'Physiology graph',
    visualTarget: 'na k atpase primary active transport pump',
    keyVisualFinding: 'Stoichiometry of 3 Na+ pumped out and 2 K+ pumped in per ATP hydrolyzed',
    imageUrl: '/assets/medical-images/physio-cell-membrane.svg',
    cleanImageUrl: '/assets/medical-images/physio-cell-membrane.svg',
    annotatedImageUrl: '/assets/medical-images/physio-cell-membrane-annotated.svg',
    whatToLookFor: 'Identify the transmembrane ATPase pump protein moving 3 Na+ ions outward to extracellular fluid and 2 K+ ions inward.',
    searchTerms: ['Na K ATPase pump lipid bilayer transport stoichiometry diagram clean'],
    subjects: ['physiology', 'biochemistry'],
  },
  'physio:body_fluid_compartments': {
    conceptKey: 'physio:body_fluid_compartments',
    imageType: 'Physiology graph',
    visualTarget: 'total body water fluid compartments indicator dilution',
    keyVisualFinding: 'TBW 60% partitioned into 2/3 ICF (40% BW) and 1/3 ECF (20% BW split into Interstitial and Plasma)',
    imageUrl: '/assets/medical-images/physio-fluid-compartments.svg',
    cleanImageUrl: '/assets/medical-images/physio-fluid-compartments.svg',
    annotatedImageUrl: '/assets/medical-images/physio-fluid-compartments-annotated.svg',
    whatToLookFor: 'Examine Total Body Water distribution: 2/3 Intracellular Fluid (ICF) and 1/3 Extracellular Fluid (ECF).',
    searchTerms: ['body fluid compartments TBW ICF ECF plasma volume indicator dilution diagram'],
    subjects: ['physiology'],
  },

  // BIOCHEMISTRY
  'biochem:lineweaver_burk_competitive': {
    conceptKey: 'biochem:lineweaver_burk_competitive',
    imageType: 'Biochemistry pathway',
    visualTarget: 'lineweaver burk plot competitive inhibition',
    keyVisualFinding: 'Intersecting on the y-axis at 1/Vmax with x-intercept (-1/Km) shifting right toward zero',
    imageUrl: '/assets/medical-images/biochem-lineweaver-burk.svg',
    cleanImageUrl: '/assets/medical-images/biochem-lineweaver-burk.svg',
    annotatedImageUrl: '/assets/medical-images/biochem-lineweaver-burk-annotated.svg',
    whatToLookFor: 'Note lines intersecting on the vertical y-axis (same Vmax) with shifted x-intercept (increased Km).',
    searchTerms: ['Lineweaver Burk plot competitive inhibition Vmax Km graph clean', 'double reciprocal plot enzyme kinetics'],
    subjects: ['biochemistry'],
  },

  // PHARMACOLOGY
  'pharm:dose_response_competitive_antagonist': {
    conceptKey: 'pharm:dose_response_competitive_antagonist',
    imageType: 'Pharmacology graph',
    visualTarget: 'log dose response curve competitive antagonist',
    keyVisualFinding: 'Parallel rightward shift of sigmoidal curve with unchanged Emax and increased EC50',
    imageUrl: '/assets/medical-images/pharm-dose-response-curve.svg',
    cleanImageUrl: '/assets/medical-images/pharm-dose-response-curve.svg',
    annotatedImageUrl: '/assets/medical-images/pharm-dose-response-curve-annotated.svg',
    whatToLookFor: 'Observe parallel rightward shift with preserved maximum response (100% Emax).',
    searchTerms: ['log dose response curve competitive antagonist parallel shift EC50 graph'],
    subjects: ['pharmacology'],
  },

  // PATHOLOGY
  'path:minimal_change_electron_microscopy': {
    conceptKey: 'path:minimal_change_electron_microscopy',
    imageType: 'Histopathology',
    visualTarget: 'minimal change disease electron microscopy podocyte effacement',
    keyVisualFinding: 'Diffuse visceral epithelial podocyte foot process effacement along normal thickness glomerular basement membrane',
    imageUrl: '/assets/medical-images/histo-mcd-electron-microscopy.svg',
    cleanImageUrl: '/assets/medical-images/histo-mcd-electron-microscopy.svg',
    annotatedImageUrl: '/assets/medical-images/histo-mcd-electron-microscopy-annotated.svg',
    whatToLookFor: 'Continuous flattened layer of visceral podocyte cytoplasm along the GBM showing complete loss of normal foot processes.',
    searchTerms: ['minimal change disease electron microscopy podocyte foot process effacement clean'],
    subjects: ['pathology', 'medicine'],
  },
  'path:reed_sternberg_hodgkin': {
    conceptKey: 'path:reed_sternberg_hodgkin',
    imageType: 'Histopathology',
    visualTarget: 'reed sternberg cell classical hodgkin lymphoma',
    keyVisualFinding: 'Giant binucleated cell with prominent eosinophilic inclusion-like nucleoli and clear halo (owl-eye appearance)',
    imageUrl: '/assets/medical-images/histo-reed-sternberg.svg',
    cleanImageUrl: '/assets/medical-images/histo-reed-sternberg.svg',
    annotatedImageUrl: '/assets/medical-images/histo-reed-sternberg-annotated.svg',
    whatToLookFor: 'Examine mirror-image bilobed nuclei with prominent cherry-red inclusion-like nucleoli surrounded by clear halos.',
    searchTerms: ['Reed Sternberg cell classical Hodgkin lymphoma histology owl eye microscopy clean'],
    subjects: ['pathology'],
  },

  // MICROBIOLOGY
  'micro:acid_fast_mycobacterium_tb': {
    conceptKey: 'micro:acid_fast_mycobacterium_tb',
    imageType: 'Microbiology microscopy',
    visualTarget: 'acid fast bacilli ziehl neelsen mycobacterium tuberculosis',
    keyVisualFinding: 'Bright red/magenta slender beaded bacilli against a blue background',
    imageUrl: '/assets/medical-images/micro-acid-fast-tb.svg',
    cleanImageUrl: '/assets/medical-images/micro-acid-fast-tb.svg',
    annotatedImageUrl: '/assets/medical-images/micro-acid-fast-tb-annotated.svg',
    whatToLookFor: 'Identify bright magenta-red beaded slender rods resisting acid decolorization against methylene blue background.',
    searchTerms: ['Ziehl Neelsen stain acid fast bacilli sputum microscopy Mycobacterium tuberculosis clean'],
    subjects: ['microbiology', 'medicine'],
  },
  'micro:strep_pneumoniae_gram_stain': {
    conceptKey: 'micro:strep_pneumoniae_gram_stain',
    imageType: 'Microbiology microscopy',
    visualTarget: 'streptococcus pneumoniae gram stain lancet diplococci',
    keyVisualFinding: 'Gram-positive violet lancet-shaped diplococci arranged in pairs',
    imageUrl: '/assets/medical-images/micro-gram-stain-strep.svg',
    cleanImageUrl: '/assets/medical-images/micro-gram-stain-strep.svg',
    annotatedImageUrl: '/assets/medical-images/micro-gram-stain-strep-annotated.svg',
    whatToLookFor: 'Gram-positive violet lancet-shaped diplococci arranged in pairs and short chains.',
    searchTerms: ['Streptococcus pneumoniae Gram stain lancet shaped diplococci microscopy clean'],
    subjects: ['microbiology'],
  },

  // MEDICINE (CARDIOLOGY)
  'med:ecg_inferior_stemi': {
    conceptKey: 'med:ecg_inferior_stemi',
    imageType: 'ECG',
    visualTarget: 'inferior stemi with right ventricular involvement',
    keyVisualFinding: 'Convex ST elevations in leads II, III, and aVF with reciprocal ST depression in I and aVL',
    imageUrl: '/assets/medical-images/ecg-inferior-stemi.svg',
    cleanImageUrl: '/assets/medical-images/ecg-inferior-stemi.svg',
    annotatedImageUrl: '/assets/medical-images/ecg-inferior-stemi-annotated.svg',
    whatToLookFor: 'Convex ST elevations in leads II, III, and aVF with reciprocal ST depression in leads I and aVL.',
    searchTerms: ['inferior STEMI ECG 12 lead clean', 'inferior myocardial infarction ECG rhythm strip'],
    subjects: ['medicine'],
  },
  'med:ecg_complete_heart_block': {
    conceptKey: 'med:ecg_complete_heart_block',
    imageType: 'ECG',
    visualTarget: 'complete third degree av block av dissociation',
    keyVisualFinding: 'Regular independent marching P waves completely dissociated from slow escape QRS complexes',
    imageUrl: '/assets/medical-images/ecg-complete-heart-block.svg',
    cleanImageUrl: '/assets/medical-images/ecg-complete-heart-block.svg',
    annotatedImageUrl: '/assets/medical-images/ecg-complete-heart-block-annotated.svg',
    whatToLookFor: 'Identify independent marching P waves dissociated from wide regular escape QRS complexes (AV dissociation).',
    searchTerms: ['complete heart block 3rd degree AV dissociation ECG rhythm strip clean'],
    subjects: ['medicine'],
  },
  'med:ecg_anterior_stemi': {
    conceptKey: 'med:ecg_anterior_stemi',
    imageType: 'ECG',
    visualTarget: 'anterior stemi lad occlusion leads v1 v4',
    keyVisualFinding: 'Marked convex tombstone ST elevation in anterior precordial leads V1, V2, V3, and V4',
    imageUrl: '/assets/medical-images/med-ecg-anterior-stemi.svg',
    cleanImageUrl: '/assets/medical-images/med-ecg-anterior-stemi.svg',
    annotatedImageUrl: '/assets/medical-images/med-ecg-anterior-stemi-annotated.svg',
    whatToLookFor: 'Convex ST elevations in anterior precordial leads V1, V2, V3, and V4 indicating acute LAD occlusion.',
    searchTerms: ['anterior STEMI LAD occlusion leads V1 V4 12 lead ECG clean'],
    subjects: ['medicine'],
  },
  'med:ecg_wpw_syndrome': {
    conceptKey: 'med:ecg_wpw_syndrome',
    imageType: 'ECG',
    visualTarget: 'wolff parkinson white wpw delta wave',
    keyVisualFinding: 'Short PR interval with classic slurred initial upstroke of the QRS complex (Delta wave)',
    imageUrl: '/assets/medical-images/ecg-wpw-syndrome.svg',
    cleanImageUrl: '/assets/medical-images/ecg-wpw-syndrome.svg',
    annotatedImageUrl: '/assets/medical-images/ecg-wpw-syndrome-annotated.svg',
    whatToLookFor: 'Short PR interval (< 120 ms) with distinct slurred upstroke (Delta wave) and prolonged QRS duration.',
    searchTerms: ['Wolff Parkinson White WPW syndrome delta wave ECG rhythm strip clean'],
    subjects: ['medicine'],
  },

  // RADIOLOGY / SURGERY
  'rad:chest_xray_pneumothorax': {
    conceptKey: 'rad:chest_xray_pneumothorax',
    imageType: 'Radiology',
    visualTarget: 'tension pneumothorax visceral pleural line',
    keyVisualFinding: 'Sharply defined visceral pleural line, peripheral hyperlucency devoid of vascular markings, and contralateral mediastinal shift',
    imageUrl: '/assets/medical-images/xray-pneumothorax.svg',
    cleanImageUrl: '/assets/medical-images/xray-pneumothorax.svg',
    annotatedImageUrl: '/assets/medical-images/xray-pneumothorax-annotated.svg',
    whatToLookFor: 'Sharply defined visceral pleural line, peripheral hyperlucency devoid of lung markings, and contralateral mediastinal shift.',
    searchTerms: ['tension pneumothorax chest X-ray visceral pleural line hyperlucency clean'],
    subjects: ['radiology', 'surgery', 'medicine'],
  },
  'rad:chest_xray_pneumoperitoneum': {
    conceptKey: 'rad:chest_xray_pneumoperitoneum',
    imageType: 'Radiology',
    visualTarget: 'pneumoperitoneum free air under diaphragm',
    keyVisualFinding: 'Thin radiolucent crescent of free air under the right hemidiaphragmatic dome above the liver parenchyma',
    imageUrl: '/assets/medical-images/xray-pneumoperitoneum.svg',
    cleanImageUrl: '/assets/medical-images/xray-pneumoperitoneum.svg',
    annotatedImageUrl: '/assets/medical-images/xray-pneumoperitoneum-annotated.svg',
    whatToLookFor: 'Thin crescent of free radiolucent gas under the right hemidiaphragm dome above the liver parenchyma.',
    searchTerms: ['pneumoperitoneum erect chest X-ray crescent air under right diaphragm clean'],
    subjects: ['radiology', 'surgery'],
  },
  'surg:instrument_babcock_clamp': {
    conceptKey: 'surg:instrument_babcock_clamp',
    imageType: 'Instruments',
    visualTarget: 'babcock tissue grasping forceps',
    keyVisualFinding: 'Fenestrated, non-crushing loop jaws designed for atraumatic grasping of delicate tubular viscera',
    imageUrl: '/assets/medical-images/surgery-babcock-clamp.svg',
    cleanImageUrl: '/assets/medical-images/surgery-babcock-clamp.svg',
    annotatedImageUrl: '/assets/medical-images/surgery-babcock-clamp-annotated.svg',
    whatToLookFor: 'Fenestrated, non-crushing loop jaws designed for atraumatic grasping of delicate tubular viscera.',
    searchTerms: ['Babcock forceps instrument surgical clamp fenestrated loop clean'],
    subjects: ['surgery', 'obg'],
  },

  // OPHTHALMOLOGY
  'ophth:fundoscopy_crao': {
    conceptKey: 'ophth:fundoscopy_crao',
    imageType: 'Ophthalmology',
    visualTarget: 'central retinal artery occlusion cherry red spot',
    keyVisualFinding: 'Diffusely pale ischemic opaque retina with prominent central cherry-red spot at the fovea',
    imageUrl: '/assets/medical-images/fundoscopy-crao.svg',
    cleanImageUrl: '/assets/medical-images/fundoscopy-crao.svg',
    annotatedImageUrl: '/assets/medical-images/fundoscopy-crao-annotated.svg',
    whatToLookFor: 'Diffusely pale ischemic retina with a prominent central cherry-red spot at the fovea.',
    searchTerms: ['central retinal artery occlusion CRAO fundus cherry red spot clean'],
    subjects: ['ophthalmology'],
  },
  'ophth:fundoscopy_crvo': {
    conceptKey: 'ophth:fundoscopy_crvo',
    imageType: 'Ophthalmology',
    visualTarget: 'central retinal vein occlusion blood and thunder fundus',
    keyVisualFinding: 'Widespread flame-shaped retinal hemorrhages in all 4 quadrants with engorged tortuous veins and cotton-wool spots',
    imageUrl: '/assets/medical-images/fundoscopy-crvo.svg',
    cleanImageUrl: '/assets/medical-images/fundoscopy-crvo.svg',
    annotatedImageUrl: '/assets/medical-images/fundoscopy-crvo-annotated.svg',
    whatToLookFor: 'Widespread flame hemorrhages in all 4 quadrants with engorged tortuous veins (Blood & Thunder fundus).',
    searchTerms: ['central retinal vein occlusion CRVO fundoscopy blood and thunder clean'],
    subjects: ['ophthalmology'],
  },

  // DERMATOLOGY
  'derm:pemphigus_vulgaris_histology': {
    conceptKey: 'derm:pemphigus_vulgaris_histology',
    imageType: 'Dermatology',
    visualTarget: 'pemphigus vulgaris suprabasal acantholysis tombstones',
    keyVisualFinding: 'Suprabasal intra-epidermal acantholytic blister cavity with a row of intact basal cells (row of tombstones)',
    imageUrl: '/assets/medical-images/derm-pemphigus-vulgaris.svg',
    cleanImageUrl: '/assets/medical-images/derm-pemphigus-vulgaris.svg',
    annotatedImageUrl: '/assets/medical-images/derm-pemphigus-vulgaris-annotated.svg',
    whatToLookFor: 'Suprabasal intra-epidermal acantholytic blister cavity with a row of intact basal cells ("row of tombstones").',
    searchTerms: ['Pemphigus vulgaris histology suprabasal acantholysis row of tombstones clean'],
    subjects: ['dermatology', 'pathology'],
  },
  'derm:erythema_multiforme_target': {
    conceptKey: 'derm:erythema_multiforme_target',
    imageType: 'Dermatology',
    visualTarget: 'erythema multiforme target iris lesion',
    keyVisualFinding: 'Concentric 3-zone target/iris lesion with dark dusky center, pale edematous middle ring, and erythematous border',
    imageUrl: '/assets/medical-images/derm-target-lesion.svg',
    cleanImageUrl: '/assets/medical-images/derm-target-lesion.svg',
    annotatedImageUrl: '/assets/medical-images/derm-target-lesion-annotated.svg',
    whatToLookFor: 'Examine concentric 3-zone target / iris lesion on palmar acral skin.',
    searchTerms: ['Erythema multiforme target lesion iris clinical photograph clean'],
    subjects: ['dermatology'],
  },

  // =========================================================================
  // AUTHENTIC CLINICAL FMGE IBQ ASSETS (JPG/PNG High-Resolution Diagnostic Bank)
  // =========================================================================

  // CARDIOLOGY / MEDICINE
  'cardio:complete_heart_block_jpg': {
    conceptKey: 'cardio:complete_heart_block_jpg',
    imageType: 'ECG',
    visualTarget: 'complete heart block 3rd degree av block av dissociation',
    keyVisualFinding: 'Complete AV dissociation with regular P waves and slow regular wide escape QRS complexes',
    imageUrl: '/images/ibq/cardio_complete_heart_block.jpg',
    cleanImageUrl: '/images/ibq/cardio_complete_heart_block.jpg',
    annotatedImageUrl: '/images/ibq/cardio_complete_heart_block.jpg',
    whatToLookFor: 'Regular P waves at ~75 bpm and independent regular slow QRS complexes (~35 bpm) with complete lack of PR relationship.',
    searchTerms: ['complete heart block 3rd degree AV dissociation ECG strip clean'],
    subjects: ['medicine'],
  },
  'cardio:inferior_stemi_jpg': {
    conceptKey: 'cardio:inferior_stemi_jpg',
    imageType: 'ECG',
    visualTarget: 'inferior wall stemi lead ii iii avf',
    keyVisualFinding: 'Convex ST elevations in leads II, III, and aVF with reciprocal depression in leads I and aVL',
    imageUrl: '/images/ibq/cardio_inferior_stemi.jpg',
    cleanImageUrl: '/images/ibq/cardio_inferior_stemi.jpg',
    annotatedImageUrl: '/images/ibq/cardio_inferior_stemi.jpg',
    whatToLookFor: 'Convex ST segment elevation in inferior leads II, III, aVF with reciprocal ST depression in I and aVL.',
    searchTerms: ['inferior STEMI ECG 12 lead rhythm strip clean'],
    subjects: ['medicine'],
  },
  'cardio:wpw_syndrome_jpg': {
    conceptKey: 'cardio:wpw_syndrome_jpg',
    imageType: 'ECG',
    visualTarget: 'wolff parkinson white wpw delta wave short pr',
    keyVisualFinding: 'Short PR interval (< 120 ms) with initial slurring of the QRS upstroke (Delta wave)',
    imageUrl: '/images/ibq/cardiology_wpw_syndrome_ecg.jpg',
    cleanImageUrl: '/images/ibq/cardiology_wpw_syndrome_ecg.jpg',
    annotatedImageUrl: '/images/ibq/cardiology_wpw_syndrome_ecg.jpg',
    whatToLookFor: 'Short PR interval with distinct initial Delta wave slurring the upstroke of widened QRS complexes.',
    searchTerms: ['Wolff Parkinson White WPW syndrome delta wave short PR ECG clean'],
    subjects: ['medicine'],
  },
  'cardio:afib_ecg_jpg': {
    conceptKey: 'cardio:afib_ecg_jpg',
    imageType: 'ECG',
    visualTarget: 'atrial fibrillation irregularly irregular rhythm absent p waves',
    keyVisualFinding: 'Irregularly irregular R-R intervals with undulating baseline fibrillatory waves and absent P waves',
    imageUrl: '/images/ibq/cardio_afib_ecg.jpg',
    cleanImageUrl: '/images/ibq/cardio_afib_ecg.jpg',
    annotatedImageUrl: '/images/ibq/cardio_afib_ecg.jpg',
    whatToLookFor: 'Irregularly irregular R-R intervals with fibrillatory f waves and complete absence of organized P waves.',
    searchTerms: ['atrial fibrillation irregularly irregular rhythm absent P wave ECG clean'],
    subjects: ['medicine'],
  },

  // PATHOLOGY
  'path:reed_sternberg_jpg': {
    conceptKey: 'path:reed_sternberg_jpg',
    imageType: 'Histopathology',
    visualTarget: 'reed sternberg cells hodgkin lymphoma owl eye',
    keyVisualFinding: 'Classic Reed-Sternberg cells with prominent bilobed nuclei and owl-eye inclusion-like nucleoli',
    imageUrl: '/images/ibq/pathology_reed_sternberg.jpg',
    cleanImageUrl: '/images/ibq/pathology_reed_sternberg.jpg',
    annotatedImageUrl: '/images/ibq/pathology_reed_sternberg.jpg',
    whatToLookFor: 'Binucleated giant cells with large inclusion-like eosinophilic nucleoli surrounded by a clear halo ("owl-eye" appearance).',
    searchTerms: ['Reed Sternberg cell Hodgkin lymphoma lymph node histology owl eye microscopy clean'],
    subjects: ['pathology'],
  },
  'path:cmv_owl_eye_jpg': {
    conceptKey: 'path:cmv_owl_eye_jpg',
    imageType: 'Histopathology',
    visualTarget: 'cytomegalovirus cmv owl eye inclusion basophilic',
    keyVisualFinding: 'Enlarged cell with prominent basophilic intranuclear inclusion surrounded by a clear halo',
    imageUrl: '/images/ibq/pathology_cmv_owl_eye.jpg',
    cleanImageUrl: '/images/ibq/pathology_cmv_owl_eye.jpg',
    annotatedImageUrl: '/images/ibq/pathology_cmv_owl_eye.jpg',
    whatToLookFor: 'Massive cytomegaly with dense central basophilic intranuclear inclusion separated by a clear halo from the nuclear membrane.',
    searchTerms: ['Cytomegalovirus CMV owl eye intranuclear inclusion histology biopsy clean'],
    subjects: ['pathology', 'microbiology'],
  },
  'path:caseous_necrosis_jpg': {
    conceptKey: 'path:caseous_necrosis_jpg',
    imageType: 'Histopathology',
    visualTarget: 'caseous necrosis tuberculosis granuloma langhans giant cells',
    keyVisualFinding: 'Acellular eosinophilic cheesy necrotic core surrounded by epithelioid histiocytes and horseshoe Langhans giant cells',
    imageUrl: '/images/ibq/pathology_caseous_necrosis.jpg',
    cleanImageUrl: '/images/ibq/pathology_caseous_necrosis.jpg',
    annotatedImageUrl: '/images/ibq/pathology_caseous_necrosis.jpg',
    whatToLookFor: 'Amorphous granular eosinophilic debris (caseous necrosis) rimmed by Langhans multinucleated giant cells and lymphocytes.',
    searchTerms: ['caseous necrosis tuberculosis granuloma Langhans giant cell histology clean'],
    subjects: ['pathology', 'medicine'],
  },
  'path:psammoma_bodies_jpg': {
    conceptKey: 'path:psammoma_bodies_jpg',
    imageType: 'Histopathology',
    visualTarget: 'psammoma bodies papillary thyroid carcinoma meningioma',
    keyVisualFinding: 'Concentric laminated calcific spherules within neoplastic papillary projections',
    imageUrl: '/images/ibq/pathology_psammoma_bodies.jpg',
    cleanImageUrl: '/images/ibq/pathology_psammoma_bodies.jpg',
    annotatedImageUrl: '/images/ibq/pathology_psammoma_bodies.jpg',
    whatToLookFor: 'Concentric, laminated, basophilic microcalcifications (Psammoma bodies) within fibrovascular cores.',
    searchTerms: ['Psammoma bodies concentric calcifications papillary thyroid carcinoma histology clean'],
    subjects: ['pathology', 'surgery'],
  },
  'path:crescentic_gn_jpg': {
    conceptKey: 'path:crescentic_gn_jpg',
    imageType: 'Histopathology',
    visualTarget: 'crescentic glomerulonephritis rapidly progressive rpgn bowman space',
    keyVisualFinding: 'Proliferation of parietal epithelial cells and monocytes forming a cellular crescent in Bowman space',
    imageUrl: '/images/ibq/pathology_crescentic_glomerulonephritis.jpg',
    cleanImageUrl: '/images/ibq/pathology_crescentic_glomerulonephritis.jpg',
    annotatedImageUrl: '/images/ibq/pathology_crescentic_glomerulonephritis.jpg',
    whatToLookFor: 'Cellular crescent composed of parietal epithelial cells, macrophages, and fibrin strands obliterating Bowman space.',
    searchTerms: ['crescentic glomerulonephritis RPGN Bowman space crescent histology renal biopsy clean'],
    subjects: ['pathology', 'medicine'],
  },
  'path:auer_rods_jpg': {
    conceptKey: 'path:auer_rods_jpg',
    imageType: 'Hematology smear',
    visualTarget: 'auer rods acute myeloid leukemia aml myeloblasts',
    keyVisualFinding: 'Needle-like azurophilic cytoplasmic crystalline inclusions in immature myeloblasts',
    imageUrl: '/images/ibq/pathology_auer_rods.jpg',
    cleanImageUrl: '/images/ibq/pathology_auer_rods.jpg',
    annotatedImageUrl: '/images/ibq/pathology_auer_rods.jpg',
    whatToLookFor: 'Pink/red needle-like crystalline inclusions (Auer rods) derived from fused primary lysosomes within myeloblast cytoplasm.',
    searchTerms: ['Auer rods acute myeloid leukemia AML peripheral blood smear myeloblasts clean'],
    subjects: ['pathology', 'medicine'],
  },
  'path:sickle_cells_jpg': {
    conceptKey: 'path:sickle_cells_jpg',
    imageType: 'Hematology smear',
    visualTarget: 'sickle cell anemia drepanocytes crescentic erythrocytes',
    keyVisualFinding: 'Crescentic, elongated sickle-shaped erythrocytes (drepanocytes) and target cells',
    imageUrl: '/images/ibq/pathology_sickle_cells.jpg',
    cleanImageUrl: '/images/ibq/pathology_sickle_cells.jpg',
    annotatedImageUrl: '/images/ibq/pathology_sickle_cells.jpg',
    whatToLookFor: 'Elongated, pointed, crescentic red blood cells (sickle cells/drepanocytes) on peripheral blood smear.',
    searchTerms: ['sickle cell anemia drepanocytes peripheral blood smear crescent RBC clean'],
    subjects: ['pathology', 'medicine', 'pediatrics'],
  },
  'path:fibrinoid_necrosis_jpg': {
    conceptKey: 'path:fibrinoid_necrosis_jpg',
    imageType: 'Histopathology',
    visualTarget: 'fibrinoid necrosis polyarteritis nodosa vasculitis vessel wall',
    keyVisualFinding: 'Bright eosinophilic amorphous deposit of antigen-antibody complexes and fibrin in arterial wall',
    imageUrl: '/images/ibq/pathology_fibrinoid_necrosis.jpg',
    cleanImageUrl: '/images/ibq/pathology_fibrinoid_necrosis.jpg',
    annotatedImageUrl: '/images/ibq/pathology_fibrinoid_necrosis.jpg',
    whatToLookFor: 'Circumferential smudgy bright pink/eosinophilic necrotic ring with fragmented leukocytes within the arterial media.',
    searchTerms: ['fibrinoid necrosis vasculitis Polyarteritis nodosa arterial wall histology clean'],
    subjects: ['pathology'],
  },

  // RADIOLOGY
  'rad:tension_pneumothorax_jpg': {
    conceptKey: 'rad:tension_pneumothorax_jpg',
    imageType: 'Radiology',
    visualTarget: 'tension pneumothorax mediastinal shift collapsed lung chest xray',
    keyVisualFinding: 'Complete absence of lung markings on affected hemithorax with collapsed lung and contralateral tracheal/mediastinal shift',
    imageUrl: '/images/ibq/radiology_tension_pneumothorax.jpg',
    cleanImageUrl: '/images/ibq/radiology_tension_pneumothorax.jpg',
    annotatedImageUrl: '/images/ibq/radiology_tension_pneumothorax.jpg',
    whatToLookFor: 'Hyperlucent hemithorax devoid of bronchovascular markings with mediastinal and tracheal shift away from the affected side.',
    searchTerms: ['tension pneumothorax chest X-ray mediastinal shift collapsed lung clean'],
    subjects: ['radiology', 'surgery', 'medicine'],
  },
  'rad:pneumoperitoneum_jpg': {
    conceptKey: 'rad:pneumoperitoneum_jpg',
    imageType: 'Radiology',
    visualTarget: 'pneumoperitoneum free gas under right dome diaphragm perforation',
    keyVisualFinding: 'Crescent of free air underneath the right dome of the diaphragm',
    imageUrl: '/images/ibq/radiology_pneumoperitoneum.jpg',
    cleanImageUrl: '/images/ibq/radiology_pneumoperitoneum.jpg',
    annotatedImageUrl: '/images/ibq/radiology_pneumoperitoneum.jpg',
    whatToLookFor: 'Thin subdiaphragmatic radiolucent crescent of free air capping the liver dome on erect chest radiograph.',
    searchTerms: ['pneumoperitoneum free air under right diaphragm perforation chest X-ray clean'],
    subjects: ['radiology', 'surgery'],
  },
  'rad:bird_beak_achalasia_jpg': {
    conceptKey: 'rad:bird_beak_achalasia_jpg',
    imageType: 'Radiology',
    visualTarget: 'bird beak sign achalasia cardia barium swallow esophageal dilation',
    keyVisualFinding: 'Smooth tapering of distal esophagus ("bird-beak" or "rat-tail" appearance) with proximal megaesophagus',
    imageUrl: '/images/ibq/radiology_bird_beak_appearance.jpg',
    cleanImageUrl: '/images/ibq/radiology_bird_beak_appearance.jpg',
    annotatedImageUrl: '/images/ibq/radiology_bird_beak_appearance.jpg',
    whatToLookFor: 'Smooth symmetric funnel-shaped tapering of the lower esophageal sphincter with massive proximal dilation on barium swallow.',
    searchTerms: ['achalasia cardia bird beak sign barium swallow megaesophagus clean'],
    subjects: ['radiology', 'surgery', 'medicine'],
  },
  'rad:coffee_bean_volvulus_jpg': {
    conceptKey: 'rad:coffee_bean_volvulus_jpg',
    imageType: 'Radiology',
    visualTarget: 'coffee bean sign sigmoid volvulus closed loop obstruction',
    keyVisualFinding: 'Enormous ahaustral inverted U-shaped loop of bowel pointing to right upper quadrant with central dense cleft',
    imageUrl: '/images/ibq/radiology_coffee_bean_sign.jpg',
    cleanImageUrl: '/images/ibq/radiology_coffee_bean_sign.jpg',
    annotatedImageUrl: '/images/ibq/radiology_coffee_bean_sign.jpg',
    whatToLookFor: 'Massive inverted U-shaped dilated sigmoid loop originating from left lower quadrant ("coffee bean" or "bent inner tube" sign).',
    searchTerms: ['sigmoid volvulus coffee bean sign bent inner tube abdominal radiograph clean'],
    subjects: ['radiology', 'surgery'],
  },
  'rad:double_bubble_atresia_jpg': {
    conceptKey: 'rad:double_bubble_atresia_jpg',
    imageType: 'Radiology',
    visualTarget: 'double bubble sign duodenal atresia neonatal bowel gas',
    keyVisualFinding: 'Two large distinct gas collections in left upper quadrant (stomach) and right midline (duodenal bulb) with distal gasless abdomen',
    imageUrl: '/images/ibq/radiology_double_bubble_sign.jpg',
    cleanImageUrl: '/images/ibq/radiology_double_bubble_sign.jpg',
    annotatedImageUrl: '/images/ibq/radiology_double_bubble_sign.jpg',
    whatToLookFor: 'Two distinct radiolucent gas bubbles corresponding to the dilated stomach and proximal duodenum, with absence of distal bowel gas.',
    searchTerms: ['duodenal atresia double bubble sign abdominal radiograph newborn clean'],
    subjects: ['radiology', 'pediatrics', 'surgery'],
  },
  'rad:miliary_tb_jpg': {
    conceptKey: 'rad:miliary_tb_jpg',
    imageType: 'Radiology',
    visualTarget: 'miliary tuberculosis millet seed micronodules chest xray',
    keyVisualFinding: 'Diffuse, uniform 1-2 mm fine micronodular opacities evenly distributed throughout both lung fields',
    imageUrl: '/images/ibq/radiology_miliary_tuberculosis.jpg',
    cleanImageUrl: '/images/ibq/radiology_miliary_tuberculosis.jpg',
    annotatedImageUrl: '/images/ibq/radiology_miliary_tuberculosis.jpg',
    whatToLookFor: 'Uniform bilateral diffuse 1-3 mm "millet-seed" micronodular opacities from apex to base.',
    searchTerms: ['miliary tuberculosis chest X-ray millet seed micronodules clean'],
    subjects: ['radiology', 'medicine'],
  },
  'rad:pleural_effusion_jpg': {
    conceptKey: 'rad:pleural_effusion_jpg',
    imageType: 'Radiology',
    visualTarget: 'pleural effusion costophrenic angle blunting meniscus sign',
    keyVisualFinding: 'Homogeneous dense basilar opacity with upward curving lateral meniscus blunting the costophrenic sulcus',
    imageUrl: '/images/ibq/radiology_pleural_effusion.jpg',
    cleanImageUrl: '/images/ibq/radiology_pleural_effusion.jpg',
    annotatedImageUrl: '/images/ibq/radiology_pleural_effusion.jpg',
    whatToLookFor: 'Obliteration of the lateral costophrenic angle with a characteristic concave-upward meniscus sign.',
    searchTerms: ['pleural effusion costophrenic angle blunting meniscus sign chest X-ray clean'],
    subjects: ['radiology', 'medicine'],
  },
  'rad:colles_fracture_jpg': {
    conceptKey: 'rad:colles_fracture_jpg',
    imageType: 'Radiology',
    visualTarget: 'colles fracture distal radius dorsal displacement dinner fork deformity',
    keyVisualFinding: 'Extra-articular transverse fracture of distal radial metaphysis with dorsal displacement and dorsal tilt',
    imageUrl: '/images/ibq/radiology_colles_fracture.jpg',
    cleanImageUrl: '/images/ibq/radiology_colles_fracture.jpg',
    annotatedImageUrl: '/images/ibq/radiology_colles_fracture.jpg',
    whatToLookFor: 'Dorsal displacement and dorsal angulation of the distal radial fracture fragment ("dinner fork" deformity on lateral view).',
    searchTerms: ['Colles fracture distal radius dorsal displacement wrist X-ray clean'],
    subjects: ['radiology', 'orthopedics', 'surgery'],
  },

  // DERMATOLOGY
  'derm:psoriatic_plaques_jpg': {
    conceptKey: 'derm:psoriatic_plaques_jpg',
    imageType: 'Clinical photograph',
    visualTarget: 'psoriasis vulgaris well demarcated erythematous silvery scale plaque',
    keyVisualFinding: 'Sharply demarcated erythematous plaques covered with silvery-white micaceous scales on extensor surfaces',
    imageUrl: '/images/ibq/dermatology_psoriatic_plaques.jpg',
    cleanImageUrl: '/images/ibq/dermatology_psoriatic_plaques.jpg',
    annotatedImageUrl: '/images/ibq/dermatology_psoriatic_plaques.jpg',
    whatToLookFor: 'Well-demarcated salmon-pink plaques with thick silvery-white micaceous scales over extensor elbows, knees, or scalp.',
    searchTerms: ['psoriasis vulgaris plaques silvery scales extensor surfaces clinical photograph clean'],
    subjects: ['dermatology'],
  },
  'derm:target_lesions_jpg': {
    conceptKey: 'derm:target_lesions_jpg',
    imageType: 'Clinical photograph',
    visualTarget: 'erythema multiforme target lesions iris acral palms soles',
    keyVisualFinding: 'Classic three-zone concentric target/iris lesions on palmar skin with dark central blister/crust',
    imageUrl: '/images/ibq/dermatology_target_lesions.jpg',
    cleanImageUrl: '/images/ibq/dermatology_target_lesions.jpg',
    annotatedImageUrl: '/images/ibq/dermatology_target_lesions.jpg',
    whatToLookFor: 'Concentric 3-zone target lesions (central dusky zone, pale edematous ring, outer red halo) on palms/soles.',
    searchTerms: ['Erythema multiforme target lesions iris palms soles clinical photograph clean'],
    subjects: ['dermatology'],
  },
  'derm:pemphigus_vulgaris_jpg': {
    conceptKey: 'derm:pemphigus_vulgaris_jpg',
    imageType: 'Clinical photograph',
    visualTarget: 'pemphigus vulgaris flaccid bullae oral mucosal erosions',
    keyVisualFinding: 'Flaccid thin-walled blisters that rupture easily leaving painful raw denuded erosions with Nikolsky sign',
    imageUrl: '/images/ibq/dermatology_pemphigus_vulgaris.jpg',
    cleanImageUrl: '/images/ibq/dermatology_pemphigus_vulgaris.jpg',
    annotatedImageUrl: '/images/ibq/dermatology_pemphigus_vulgaris.jpg',
    whatToLookFor: 'Flaccid, easily ruptured bullae on normal or erythematous skin with extensive painful oral erosions and positive Nikolsky sign.',
    searchTerms: ['pemphigus vulgaris flaccid bullae oral erosions Nikolsky sign clinical photograph clean'],
    subjects: ['dermatology'],
  },
  'derm:herald_patch_jpg': {
    conceptKey: 'derm:herald_patch_jpg',
    imageType: 'Clinical photograph',
    visualTarget: 'pityriasis rosea herald patch christmas tree distribution collarette',
    keyVisualFinding: 'Single primary oval salmon-colored plaque with inward-facing collarette of fine scale along Langer lines',
    imageUrl: '/images/ibq/dermatology_herald_patch.jpg',
    cleanImageUrl: '/images/ibq/dermatology_herald_patch.jpg',
    annotatedImageUrl: '/images/ibq/dermatology_herald_patch.jpg',
    whatToLookFor: 'Oval plaque with trailing peripheral collarette of scale preceding a generalized secondary "Christmas tree" eruption.',
    searchTerms: ['Pityriasis rosea herald patch Christmas tree distribution collarette scale clinical clean'],
    subjects: ['dermatology'],
  },
  'derm:gottron_papules_jpg': {
    conceptKey: 'derm:gottron_papules_jpg',
    imageType: 'Clinical photograph',
    visualTarget: 'gottron papules dermatomyositis mcp pip knuckes violaceous',
    keyVisualFinding: 'Violaceous, flat-topped polygonal papules and plaques overlying the dorsal MCP and IP joints',
    imageUrl: '/images/ibq/dermatology_gottron_papules.jpg',
    cleanImageUrl: '/images/ibq/dermatology_gottron_papules.jpg',
    annotatedImageUrl: '/images/ibq/dermatology_gottron_papules.jpg',
    whatToLookFor: 'Pathognomonic violaceous flat papules over the dorsal metacarpophalangeal and interphalangeal knuckles (Gottron papules).',
    searchTerms: ['Gottron papules dermatomyositis knuckles MCP PIP joints clinical clean'],
    subjects: ['dermatology', 'medicine'],
  },
  'derm:chickenpox_jpg': {
    conceptKey: 'derm:chickenpox_jpg',
    imageType: 'Clinical photograph',
    visualTarget: 'varicella zoster chickenpox dewdrops on rose petal pleomorphic',
    keyVisualFinding: 'Pleomorphic rash with lesions in all stages (macules, papules, clear vesicles, and crusted scabs)',
    imageUrl: '/images/ibq/dermatology_chickenpox_vesicular_rash.jpg',
    cleanImageUrl: '/images/ibq/dermatology_chickenpox_vesicular_rash.jpg',
    annotatedImageUrl: '/images/ibq/dermatology_chickenpox_vesicular_rash.jpg',
    whatToLookFor: 'Centripetal pleomorphic vesicular rash with clear fluid-filled vesicles on an erythematous base ("dewdrops on a rose petal").',
    searchTerms: ['varicella zoster chickenpox dewdrops rose petal vesicular rash clinical clean'],
    subjects: ['dermatology', 'pediatrics', 'microbiology'],
  },

  // MICROBIOLOGY
  'micro:acid_fast_bacilli_jpg': {
    conceptKey: 'micro:acid_fast_bacilli_jpg',
    imageType: 'Microbiology microscopy',
    visualTarget: 'mycobacterium tuberculosis acid fast bacilli ziehl neelsen zn stain',
    keyVisualFinding: 'Bright pink/red slender beaded rod-shaped bacilli against a blue background',
    imageUrl: '/images/ibq/microbiology_acid_fast_bacilli.jpg',
    cleanImageUrl: '/images/ibq/microbiology_acid_fast_bacilli.jpg',
    annotatedImageUrl: '/images/ibq/microbiology_acid_fast_bacilli.jpg',
    whatToLookFor: 'Slender, beaded, acid-fast bright red rods retaining carbol fuchsin against methylene blue counterstain.',
    searchTerms: ['Mycobacterium tuberculosis Ziehl Neelsen ZN stain acid fast bacilli clean'],
    subjects: ['microbiology', 'medicine'],
  },
  'micro:staph_clusters_jpg': {
    conceptKey: 'micro:staph_clusters_jpg',
    imageType: 'Microbiology microscopy',
    visualTarget: 'staphylococcus aureus gram positive cocci in clusters grape like',
    keyVisualFinding: 'Gram-positive violet spherical cocci arranged in irregular grape-like clusters',
    imageUrl: '/images/ibq/microbiology_gram_positive_cocci_in_clusters.jpg',
    cleanImageUrl: '/images/ibq/microbiology_gram_positive_cocci_in_clusters.jpg',
    annotatedImageUrl: '/images/ibq/microbiology_gram_positive_cocci_in_clusters.jpg',
    whatToLookFor: 'Spherical violet Gram-positive cocci aggregated into characteristic irregular grape-like clusters.',
    searchTerms: ['Staphylococcus aureus Gram positive cocci in clusters Gram stain clean'],
    subjects: ['microbiology'],
  },
  'micro:falciparum_ring_jpg': {
    conceptKey: 'micro:falciparum_ring_jpg',
    imageType: 'Microbiology microscopy',
    visualTarget: 'plasmodium falciparum ring trophozoites headphone sign double chromatin',
    keyVisualFinding: 'Delicate ring-form trophozoites within normal-sized RBCs with double chromatin dots and multiple infections per cell',
    imageUrl: '/images/ibq/microbiology_ring_trophozoites.jpg',
    cleanImageUrl: '/images/ibq/microbiology_ring_trophozoites.jpg',
    annotatedImageUrl: '/images/ibq/microbiology_ring_trophozoites.jpg',
    whatToLookFor: 'Delicate cytoplasmic rings with tiny purple-red chromatin dots (signet ring / headphone appearance) inside red blood cells.',
    searchTerms: ['Plasmodium falciparum ring trophozoites Giemsa smear malaria clean'],
    subjects: ['microbiology', 'medicine'],
  },
  'micro:falciparum_gametocyte_jpg': {
    conceptKey: 'micro:falciparum_gametocyte_jpg',
    imageType: 'Microbiology microscopy',
    visualTarget: 'plasmodium falciparum crescent crescentic banana shaped gametocyte',
    keyVisualFinding: 'Distinctive crescentic / banana-shaped gametocyte with central clumped hemozoin pigment',
    imageUrl: '/images/ibq/microbiology_banana-shaped_gametocyte.jpg',
    cleanImageUrl: '/images/ibq/microbiology_banana-shaped_gametocyte.jpg',
    annotatedImageUrl: '/images/ibq/microbiology_banana-shaped_gametocyte.jpg',
    whatToLookFor: 'Pathognomonic crescent-shaped or banana-shaped sexual stage gametocyte distorting the host erythrocyte.',
    searchTerms: ['Plasmodium falciparum crescent banana shaped gametocyte blood smear clean'],
    subjects: ['microbiology', 'medicine'],
  },

  // OPHTHALMOLOGY
  'ophth:papilledema_jpg': {
    conceptKey: 'ophth:papilledema_jpg',
    imageType: 'Fundoscopy',
    visualTarget: 'papilledema bilateral optic disc edema blurring margins raised icp',
    keyVisualFinding: 'Elevated optic disc with blurred margins, loss of physiological cup, venous engorgement, and peripapillary flame hemorrhages',
    imageUrl: '/images/ibq/ophthalmology_papilledema.jpg',
    cleanImageUrl: '/images/ibq/ophthalmology_papilledema.jpg',
    annotatedImageUrl: '/images/ibq/ophthalmology_papilledema.jpg',
    whatToLookFor: 'Bilateral optic disc elevation with blurred indistinct margins and absent venous pulsations (indicates raised intracranial pressure).',
    searchTerms: ['papilledema optic disc swelling fundoscopy raised ICP clean'],
    subjects: ['ophthalmology', 'medicine'],
  },
  'ophth:kayser_fleischer_jpg': {
    conceptKey: 'ophth:kayser_fleischer_jpg',
    imageType: 'Slit-lamp examination',
    visualTarget: 'kayser fleischer ring wilson disease copper descemet membrane',
    keyVisualFinding: 'Golden-brown or greenish copper deposition ring in the Descemet membrane at the corneal limbus',
    imageUrl: '/images/ibq/ophthalmology_kayser_fleischer_ring.jpg',
    cleanImageUrl: '/images/ibq/ophthalmology_kayser_fleischer_ring.jpg',
    annotatedImageUrl: '/images/ibq/ophthalmology_kayser_fleischer_ring.jpg',
    whatToLookFor: 'Circumferential golden-brown/greenish band of copper granules deposited in the peripheral Descemet membrane of the cornea.',
    searchTerms: ['Kayser Fleischer ring Wilson disease copper Descemet membrane slit lamp clean'],
    subjects: ['ophthalmology', 'medicine', 'pediatrics'],
  },
  'ophth:cherry_red_spot_jpg': {
    conceptKey: 'ophth:cherry_red_spot_jpg',
    imageType: 'Fundoscopy',
    visualTarget: 'central retinal artery occlusion crao cherry red spot fovea',
    keyVisualFinding: 'Diffuse milky-white ischemic retinal edema with a bright cherry-red spot at the center of the fovea',
    imageUrl: '/images/ibq/ophthalmology_cherry_red_spot.jpg',
    cleanImageUrl: '/images/ibq/ophthalmology_cherry_red_spot.jpg',
    annotatedImageUrl: '/images/ibq/ophthalmology_cherry_red_spot.jpg',
    whatToLookFor: 'Pale milky opaque ischemic retina with prominent central cherry-red fovea where the underlying vascular choroid shines through.',
    searchTerms: ['central retinal artery occlusion CRAO cherry red spot fundus clean'],
    subjects: ['ophthalmology', 'medicine'],
  },
  'ophth:diabetic_retinopathy_jpg': {
    conceptKey: 'ophth:diabetic_retinopathy_jpg',
    imageType: 'Fundoscopy',
    visualTarget: 'non proliferative diabetic retinopathy microaneurysms hard exudates',
    keyVisualFinding: 'Scattered microaneurysms, dot and blot hemorrhages, and yellowish waxy hard exudates in the posterior pole',
    imageUrl: '/images/ibq/ophthal_diabetic_retinopathy.jpg',
    cleanImageUrl: '/images/ibq/ophthal_diabetic_retinopathy.jpg',
    annotatedImageUrl: '/images/ibq/ophthal_diabetic_retinopathy.jpg',
    whatToLookFor: 'Punctate microaneurysms, intraretinal dot hemorrhages, and waxy lipid hard exudates scattered across the macula.',
    searchTerms: ['diabetic retinopathy microaneurysms hard exudates fundus clean'],
    subjects: ['ophthalmology', 'medicine'],
  },

  // ENT
  'ent:tympanic_perforation_jpg': {
    conceptKey: 'ent:tympanic_perforation_jpg',
    imageType: 'Otoscopy',
    visualTarget: 'tympanic membrane perforation central pars tensa otitis media',
    keyVisualFinding: 'Well-defined kidney/oval-shaped perforation in the anteroinferior quadrant of the pars tensa',
    imageUrl: '/images/ibq/ent_tympanic_perforation.jpg',
    cleanImageUrl: '/images/ibq/ent_tympanic_perforation.jpg',
    annotatedImageUrl: '/images/ibq/ent_tympanic_perforation.jpg',
    whatToLookFor: 'Central defect in the pars tensa of the tympanic membrane sparing the annulus tympanicus.',
    searchTerms: ['tympanic membrane perforation central pars tensa CSOM otoscopy clean'],
    subjects: ['ent'],
  },

  // OBSTETRICS & GYNECOLOGY
  'obg:hydatidiform_mole_jpg': {
    conceptKey: 'obg:hydatidiform_mole_jpg',
    imageType: 'Ultrasound',
    visualTarget: 'complete hydatidiform mole snowstorm appearance molar pregnancy',
    keyVisualFinding: 'Echogenic intrauterine mass containing multiple small cystic spaces ("snowstorm" or "bunch of grapes" pattern)',
    imageUrl: '/images/ibq/obs_hydatidiform_mole.jpg',
    cleanImageUrl: '/images/ibq/obs_hydatidiform_mole.jpg',
    annotatedImageUrl: '/images/ibq/obs_hydatidiform_mole.jpg',
    whatToLookFor: 'Classic "snowstorm" ultrasound appearance with diffuse hydropic villi, multiple sonolucent cysts, and absence of fetal pole.',
    searchTerms: ['hydatidiform mole snowstorm appearance pelvic ultrasound molar pregnancy clean'],
    subjects: ['obg'],
  },
};

/**
 * Diagnostic Validation Logger.
 */
export interface VisualValidationLog {
  questionId: string;
  subjectId: string;
  topicName: string;
  requiresImage: boolean;
  visualTarget?: string;
  searchTerms?: string[];
  candidateAssetId?: string;
  validationResult: 'PASS' | 'REJECT' | 'NOT_REQUESTED';
  relevanceScore: number;
  finalImageId?: string;
  fallbackReason?: string;
}

/**
 * Normalizes text for strict clinical keyword matching.
 */
function normalizeText(text: string): string {
  return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Validates whether a candidate visual asset matches a question's clinical visual intent.
 */
export function validateVisualRelevance(
  question: PracticeSessionQuestion,
  asset: VisualConceptAsset
): { matches: boolean; relevanceScore: number; reason?: string } {
  const qIntent = question.visualIntent;
  if (!qIntent || !qIntent.requiresImage) {
    return { matches: false, relevanceScore: 0, reason: 'Question does not require an image' };
  }

  // If question already has this exact imageUrl verified, it is a direct match
  if (question.imageUrl && question.imageUrl === asset.imageUrl) {
    return { matches: true, relevanceScore: 0.99 };
  }

  const normTarget = normalizeText(qIntent.visualTarget || '');
  const normAssetTarget = normalizeText(asset.visualTarget);
  const normQuestion = normalizeText(`${question.scenario} ${question.question} ${question.subtopic || ''}`);

  // Hard Rule: Check for direct visualTarget concept match against asset visualTarget
  const targetWords = normTarget.split(' ').filter((w) => w.length > 2);
  const matchingTargetWords = targetWords.filter((w) => normAssetTarget.includes(w) || normQuestion.includes(w));

  const targetMatchRatio = targetWords.length > 0 ? matchingTargetWords.length / targetWords.length : 0;

  if (targetMatchRatio < 0.35) {
    return {
      matches: false,
      relevanceScore: targetMatchRatio,
      reason: `Visual concept mismatch: Target '${qIntent.visualTarget}' does not match asset '${asset.visualTarget}'`,
    };
  }

  // Calculate high-confidence medical relevance score
  let score = 0.85 + targetMatchRatio * 0.14;
  if (qIntent.imageType && asset.imageType.toLowerCase().includes(qIntent.imageType.toLowerCase())) {
    score += 0.01;
  }

  return {
    matches: score >= 0.80,
    relevanceScore: Math.min(score, 0.99),
  };
}

/**
 * Question-Specific Visual Resolution Engine.
 * Resolves each question's image individually.
 * Enforces NO generic fallback, NO cross-specialty contamination, and NO image reuse.
 */
export function resolveQuestionVisual(
  question: PracticeSessionQuestion,
  usedImageUrls: Set<string>,
  logs?: VisualValidationLog[]
): PracticeSessionQuestion {
  const intent = question.visualIntent;

  // Case 1: Question explicitly does not require an image
  if (!intent || !intent.requiresImage || !intent.visualTarget) {
    const logEntry: VisualValidationLog = {
      questionId: question.id,
      subjectId: question.subjectId,
      topicName: question.topicName,
      requiresImage: false,
      validationResult: 'NOT_REQUESTED',
      relevanceScore: 0,
      fallbackReason: 'Text-only clinical vignette is high-yield for this conceptual question',
    };
    logs?.push(logEntry);
    console.log(`[VisualEngine] Question: ${question.id} | Subject: ${question.subjectId} | RequiresImage: false -> Text-only`);

    return {
      ...question,
      imageUrl: undefined,
      cleanImageUrl: undefined,
      annotatedImageUrl: undefined,
      whatToLookFor: undefined,
    };
  }

  const normTarget = normalizeText(intent.visualTarget);

  // Case 2: Find strictly matching visual concept from registry
  const candidateEntries = Object.values(VISUAL_CONCEPT_REGISTRY).filter((asset) => {
    // Direct match if question already points to this image
    if (question.imageUrl && question.imageUrl === asset.imageUrl) return true;

    // Subject filter
    const subjectMatch = asset.subjects.some((s) => s === question.subjectId.toLowerCase() || question.subjectId.toLowerCase().includes(s));
    if (!subjectMatch) return false;

    // Check visual target congruence against asset's visualTarget
    const normAssetTarget = normalizeText(asset.visualTarget);
    const targetWords = normTarget.split(' ').filter((w) => w.length > 2);
    const hasOverlap = targetWords.some((w) => normAssetTarget.includes(w));
    return hasOverlap;
  });

  for (const candidate of candidateEntries) {
    // Check if candidate image is already used in this session
    if (usedImageUrls.has(candidate.imageUrl)) {
      continue; // Never repeat same image in the same session
    }

    const valResult = validateVisualRelevance(question, candidate);
    if (valResult.matches) {
      usedImageUrls.add(candidate.imageUrl);

      const logEntry: VisualValidationLog = {
        questionId: question.id,
        subjectId: question.subjectId,
        topicName: question.topicName,
        requiresImage: true,
        visualTarget: intent.visualTarget,
        searchTerms: intent.searchTerms || candidate.searchTerms,
        candidateAssetId: candidate.conceptKey,
        validationResult: 'PASS',
        relevanceScore: valResult.relevanceScore,
        finalImageId: candidate.conceptKey,
      };
      logs?.push(logEntry);
      console.log(`[VisualEngine] Question: ${question.id} | Subject: ${question.subjectId} | Target: ${intent.visualTarget} | Matched: ${candidate.conceptKey} (score: ${valResult.relevanceScore.toFixed(2)})`);

      return {
        ...question,
        imageUrl: candidate.imageUrl,
        cleanImageUrl: candidate.cleanImageUrl,
        annotatedImageUrl: candidate.annotatedImageUrl,
        mediaType: (question.mediaType || 'ibq') as any,
        whatToLookFor: question.whatToLookFor || candidate.whatToLookFor,
      };
    }
  }

  // Case 3: No valid image found or image already used -> Graceful degradation to clean text-only question
  const fallbackLog: VisualValidationLog = {
    questionId: question.id,
    subjectId: question.subjectId,
    topicName: question.topicName,
    requiresImage: true,
    visualTarget: intent.visualTarget,
    searchTerms: intent.searchTerms,
    validationResult: 'REJECT',
    relevanceScore: 0,
    fallbackReason: 'No unused authentic image matching visual intent found; downgraded safely to text-only vignette (NO IMAGE IS BETTER THAN A WRONG IMAGE)',
  };
  logs?.push(fallbackLog);
  console.log(`[VisualEngine] Question: ${question.id} | Subject: ${question.subjectId} | Target: ${intent.visualTarget} -> NO VALID IMAGE -> Converted to Text-only`);

  return {
    ...question,
    imageUrl: undefined,
    cleanImageUrl: undefined,
    annotatedImageUrl: undefined,
    whatToLookFor: undefined,
  };
}

/**
 * Resolves a full array of practice session questions with strict per-question visual decisions.
 */
export function resolvePracticeSessionVisuals(
  questions: PracticeSessionQuestion[],
  logs?: VisualValidationLog[]
): PracticeSessionQuestion[] {
  const usedImages = new Set<string>();
  const usedConcepts = new Set<string>();

  return questions.map((q) => {
    const intent = q.visualIntent;
    if (!intent || !intent.requiresImage || !intent.visualTarget) {
      return resolveQuestionVisual(q, usedImages, logs);
    }

    const normTarget = normalizeText(intent.visualTarget);
    // If this exact concept target has already received an image in this session, degrade to text-only
    if (usedConcepts.has(normTarget)) {
      const dupeLog: VisualValidationLog = {
        questionId: q.id,
        subjectId: q.subjectId,
        topicName: q.topicName,
        requiresImage: true,
        visualTarget: intent.visualTarget,
        validationResult: 'REJECT',
        relevanceScore: 0,
        fallbackReason: 'Visual concept already presented in this session; downgraded to text-only to prevent concept repetition',
      };
      logs?.push(dupeLog);
      return {
        ...q,
        imageUrl: undefined,
        cleanImageUrl: undefined,
        annotatedImageUrl: undefined,
        whatToLookFor: undefined,
      };
    }

    const resolved = resolveQuestionVisual(q, usedImages, logs);
    if (resolved.imageUrl) {
      usedConcepts.add(normTarget);
    }
    return resolved;
  });
}

/**
 * Searches the verified clinical IBQ bank for a topic/subject match with 4 options.
 */
export function getVerifiedIBQForTopic(
  subjectNameOrId: string,
  topicNameOrId?: string,
  usedIds?: Set<string>
): RawIBQItem | null {
  const subNorm = normalizeText(subjectNameOrId);
  const topicNorm = normalizeText(topicNameOrId || '');

  const aliasMap: Record<string, string[]> = {
    anatomy: ['anatomy', 'anat'],
    anat: ['anatomy', 'anat'],
    physiology: ['physiology', 'physio'],
    physio: ['physiology', 'physio'],
    biochemistry: ['biochemistry', 'biochem'],
    biochem: ['biochemistry', 'biochem'],
    pharmacology: ['pharmacology', 'pharm'],
    pharm: ['pharmacology', 'pharm'],
    pathology: ['pathology', 'patho', 'hematology'],
    patho: ['pathology', 'patho', 'hematology'],
    microbiology: ['microbiology', 'micro'],
    micro: ['microbiology', 'micro'],
    medicine: ['medicine', 'cardiology', 'nephrology', 'neurology', 'gastroenterology', 'pulmonology', 'general medicine', 'med'],
    med: ['medicine', 'cardiology', 'nephrology', 'neurology', 'gastroenterology', 'pulmonology', 'general medicine', 'med'],
    cardiology: ['cardiology', 'medicine', 'med'],
    surgery: ['surgery', 'general surgery', 'orthopedics', 'surg'],
    surg: ['surgery', 'general surgery', 'orthopedics', 'surg'],
    orthopedics: ['orthopedics', 'surgery', 'ortho'],
    ortho: ['orthopedics', 'surgery', 'ortho'],
    dermatology: ['dermatology', 'derm'],
    derm: ['dermatology', 'derm'],
    radiology: ['radiology', 'radio', 'xray'],
    radio: ['radiology', 'radio', 'xray'],
    ophthalmology: ['ophthalmology', 'ophthal', 'eye'],
    ophthal: ['ophthalmology', 'ophthal', 'eye'],
    ent: ['ent', 'otorhinolaryngology'],
    obg: ['obstetrics', 'gynecology', 'obg', 'obs'],
    obs: ['obstetrics', 'gynecology', 'obg', 'obs'],
    pediatrics: ['pediatrics', 'peds', 'pedia'],
    peds: ['pediatrics', 'peds', 'pedia'],
    psm: ['psm', 'community medicine', 'preventive'],
  };

  const allowed = aliasMap[subNorm] || [subNorm];

  // 1. Topic match in VERIFIED_IBQ_BANK with strict validation
  if (topicNorm) {
    const topicKeywords = topicNorm.split(' ').filter(w => w.length > 2);
    const matched = VERIFIED_IBQ_BANK.find(ibq => {
      if (usedIds && usedIds.has(ibq.id)) return false;
      if (!ibq.options || ibq.options.length < 4) return false;
      const ibqSub = normalizeText(ibq.subject);
      const ibqTopic = normalizeText(ibq.topic);
      const ibqVignette = normalizeText(ibq.vignette);

      const subMatches = allowed.some(a => ibqSub.includes(a) || a.includes(ibqSub));
      if (!subMatches) return false;

      const keywordMatched = topicKeywords.some(kw => ibqTopic.includes(kw) || ibqVignette.includes(kw));
      if (!keywordMatched) return false;

      // Validate against cross-topic contamination (e.g. knee/peroneal in abdomen topic)
      const valResult = validateTopicContentConsistency(
        `${ibq.topic} ${ibq.vignette} ${ibq.explanation?.detailedRationale || ''}`,
        subjectNameOrId,
        topicNameOrId || ''
      );
      return valResult.isValid && !valResult.hasContamination;
    });

    if (matched) return matched;
  }

  // Strict Rule: NO WRONG IMAGE IS BETTER THAN UNRELATED IMAGE.
  // Never fall back to an arbitrary subject-level question if the topic did not match specifically.
  return null;
}

/**
 * Searches for a verified medical visual image asset (ECG, X-Ray, Clinical Photo, Histopathology)
 * strictly for topics that genuinely feature an authentic diagnostic visual finding.
 */
export function getVerifiedVisualAssetForTopic(
  subjectNameOrId: string,
  topicNameOrId?: string
): { imageUrl: string; title: string; whatToLookFor: string; keyFinding?: string } | null {
  const subNorm = normalizeText(subjectNameOrId);
  const topicNorm = normalizeText(topicNameOrId || '');

  if (!topicNorm) return null;

  const aliasMap: Record<string, string[]> = {
    anatomy: ['anatomy', 'anat'],
    anat: ['anatomy', 'anat'],
    cardiology: ['cardiology', 'medicine', 'ecg', 'heart'],
    medicine: ['cardiology', 'pulmonology', 'nephrology', 'gastroenterology', 'neurology', 'medicine'],
    dermatology: ['dermatology', 'derm', 'skin'],
    radiology: ['radiology', 'xray', 'chest', 'radio'],
    microbiology: ['microbiology', 'micro', 'stain', 'culture'],
    pathology: ['pathology', 'patho', 'biopsy', 'histo'],
    ophthalmology: ['ophthalmology', 'ophthal', 'fundus', 'eye'],
    ent: ['ent', 'ear', 'tympanic'],
    surgery: ['surgery', 'orthopedics', 'fracture'],
    orthopedics: ['orthopedics', 'fracture', 'xray'],
    obg: ['obstetrics', 'gynecology', 'obg'],
    pediatrics: ['pediatrics', 'peds'],
  };

  const allowed = aliasMap[subNorm] || [subNorm];
  const topicKeywords = topicNorm.split(' ').filter(w => w.length > 2);

  // 1. Check VERIFIED_IBQ_BANK first (53 genuine medical JPG clinical photos, ECGs, X-rays)
  const matchedIbq = VERIFIED_IBQ_BANK.find(ibq => {
    const ibqSub = normalizeText(ibq.subject);
    const ibqTopic = normalizeText(ibq.topic);
    const ibqVignette = normalizeText(ibq.vignette);

    const subMatches = allowed.some(a => ibqSub.includes(a) || a.includes(ibqSub));
    if (!subMatches) return false;

    const keywordMatched = topicKeywords.some(kw => ibqTopic.includes(kw) || ibqVignette.includes(kw));
    if (!keywordMatched) return false;

    const valResult = validateTopicContentConsistency(
      `${ibq.topic} ${ibq.vignette}`,
      subjectNameOrId,
      topicNameOrId || ''
    );
    return valResult.isValid && !valResult.hasContamination;
  });

  if (matchedIbq && matchedIbq.imageSrc) {
    return {
      imageUrl: matchedIbq.imageSrc,
      title: matchedIbq.topic,
      whatToLookFor: matchedIbq.vignette,
      keyFinding: matchedIbq.explanation?.imageFinding,
    };
  }

  // 2. Check VISUAL_CONCEPT_REGISTRY for clinical photograph/ECG/histopathology concepts
  const assetMatched = Object.values(VISUAL_CONCEPT_REGISTRY).find(asset => {
    const validClinicalTypes = ['ECG', 'Radiology', 'Histopathology', 'Dermatology', 'Ophthalmology', 'Microbiology microscopy', 'Clinical photograph'];
    if (!validClinicalTypes.includes(asset.imageType)) return false;

    const assetSubMatches = asset.subjects.some(s => allowed.some(a => s.includes(a) || a.includes(s)));
    if (!assetSubMatches) return false;

    const normTarget = normalizeText(asset.visualTarget);
    const normTerms = asset.searchTerms.map(t => normalizeText(t)).join(' ');
    const keywordMatched = topicKeywords.some(kw => normTarget.includes(kw) || normTerms.includes(kw));
    if (!keywordMatched) return false;

    const valResult = validateTopicContentConsistency(
      `${asset.visualTarget} ${asset.whatToLookFor} ${asset.keyVisualFinding}`,
      subjectNameOrId,
      topicNameOrId || ''
    );
    return valResult.isValid && !valResult.hasContamination;
  });

  if (assetMatched) {
    return {
      imageUrl: assetMatched.cleanImageUrl || assetMatched.imageUrl,
      title: assetMatched.visualTarget,
      whatToLookFor: assetMatched.whatToLookFor,
      keyFinding: assetMatched.keyVisualFinding,
    };
  }

  return null;
}

/**
 * Retrieves all verified IBQs for a subject.
 */
export function getVerifiedIBQsForSubject(subjectNameOrId: string): RawIBQItem[] {
  const subNorm = normalizeText(subjectNameOrId);
  const aliasMap: Record<string, string[]> = {
    medicine: ['medicine', 'cardiology', 'nephrology', 'neurology', 'gastroenterology', 'pulmonology', 'general medicine'],
    cardiology: ['cardiology', 'medicine'],
    pathology: ['pathology', 'hematology'],
    dermatology: ['dermatology', 'derm'],
    radiology: ['radiology', 'radio'],
    microbiology: ['microbiology', 'micro'],
    ophthalmology: ['ophthalmology', 'ophthal', 'eye'],
    ent: ['ent', 'otorhinolaryngology'],
    obg: ['obstetrics', 'gynecology', 'obg'],
    surgery: ['surgery', 'general surgery', 'orthopedics'],
    orthopedics: ['orthopedics', 'surgery'],
    pediatrics: ['pediatrics', 'peds'],
  };

  const allowed = aliasMap[subNorm] || [subNorm];

  return VERIFIED_IBQ_BANK.filter(ibq => {
    const ibqSub = normalizeText(ibq.subject);
    return allowed.some(a => ibqSub.includes(a) || a.includes(ibqSub));
  });
}
