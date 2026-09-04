import {
  AppState,
  ErrorNotebookItem,
  FlashcardItem,
  VisualSlideItem,
  ClinicalCaseItem,
  PracticeSessionQuestion,
  PracticeOption,
} from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { recordMcqAttempt } from './performanceEngine';
import { getLocalDateKey } from './date';
import { generateSlideDeck } from './slideEngine';
import { generateFlashcardDeck } from './flashcardEngine';
import { generateTopicClinicalCasesDeck } from './clinicalCaseEngine';
import { generateTopicPearls } from './pearlEngine';
import { getTopicLearningContext } from './topicIntelligence';

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface ErrorConceptCluster {
  conceptId: string;
  conceptName: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  errorCount: number;
  whyItMatters: string;
  classicTrap: string;
  errors: ErrorNotebookItem[];
  depth: 'isolated' | 'repeated' | 'severe';
}

export interface ConceptRemediationPackage {
  id: string;
  conceptId: string;
  conceptName: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  whyItMatters: string;
  classicTrap: string;
  depth: 'isolated' | 'repeated' | 'severe';
  quickExplanation: {
    coreFact: string;
    mechanism: string;
    clinicalCorrelation: string;
    classicExamClue: string;
    commonTrap: string;
  };
  slides: VisualSlideItem[];
  flashcards: FlashcardItem[];
  clinicalCase: ClinicalCaseItem;
  retestQuestions: PracticeSessionQuestion[];
}

/**
 * Concept database of verified high-yield FMGE concept gaps.
 */
const VERIFIED_CONCEPT_DATABASE: Record<
  string,
  {
    conceptName: string;
    whyItMatters: string;
    classicTrap: string;
    coreFact: string;
    mechanism: string;
    clinicalCorrelation: string;
    classicExamClue: string;
    commonTrap: string;
    slides: VisualSlideItem[];
    flashcards: FlashcardItem[];
    clinicalCase: ClinicalCaseItem;
    retestQuestions: PracticeSessionQuestion[];
  }
> = {
  'c-peroneal-nerve': {
    conceptName: 'Common Peroneal Nerve Injury at Fibular Neck',
    whyItMatters: 'Top 3 most repeated lower limb trauma MCQs in FMGE. Direct question on foot drop vs sensory loss.',
    classicTrap: 'Confusing deep peroneal (first web space) with superficial peroneal (dorsum of foot) or tibial nerve (loss of plantarflexion).',
    coreFact: 'Common peroneal nerve winds around the fibular neck and divides into superficial (dorsiflexion eversion + dorsum sensation) and deep peroneal (dorsiflexion inversion + 1st web space).',
    mechanism: 'Fibular neck fracture or tight plaster cast compresses nerve against bone → paralysis of anterior & lateral compartment muscles.',
    clinicalCorrelation: 'High-stepping gait (foot drop), loss of ankle dorsiflexion and eversion, loss of sensation over anterolateral leg and dorsum of foot.',
    classicExamClue: 'Patient with cast or lateral knee blow unable to walk on heels; sensory loss in 1st dorsal web space.',
    commonTrap: 'Tibial nerve injury causes inability to stand on toes (loss of plantarflexion) and sole numbness.',
    slides: [
      {
        id: 'cpn-s1',
        slideNumber: 1,
        title: 'Anatomy of Common Peroneal Nerve (L4–S2)',
        subtitle: 'Fibular Neck Vulnerability',
        category: 'anatomy_patho',
        bullets: [
          'Terminal branch of Sciatic nerve at upper popliteal fossa.',
          'Winds superficially around the neck of the fibula (subcutaneous).',
          'Divides into Deep Peroneal and Superficial Peroneal nerves.',
        ],
        keyTakeaways: [
          'Subcutaneous location makes it the most injured nerve in lower limb fractures.',
        ],
      },
      {
        id: 'cpn-s2',
        slideNumber: 2,
        title: 'Deep vs Superficial Peroneal Nerve',
        subtitle: 'Motor & Sensory Discriminators',
        category: 'diagnostics',
        bullets: [
          'Deep Peroneal: Tibialis anterior (dorsiflexion) + EHL/EDL + Sensation over FIRST WEB SPACE.',
          'Superficial Peroneal: Peroneus longus/brevis (eversion) + Sensation over DORSUM OF FOOT.',
          'Tibial Nerve (contrast): Plantarflexion (Gastrocnemius/Soleus) + Sensation on SOLE.',
        ],
        keyTakeaways: [
          'First web space sensory loss is 100% pathognomonic for Deep Peroneal involvement.',
        ],
      },
      {
        id: 'cpn-s3',
        slideNumber: 3,
        title: 'Clinical Presentation & Exam Traps',
        subtitle: 'Foot Drop & High-Stepping Gait',
        category: 'exam_traps',
        bullets: [
          'Motor: Inability to dorsiflex or evert foot → Foot Drop.',
          'Gait: High-stepping gait to clear toes during swing phase.',
          'Common causes: Fibular neck fracture, tight fibular cast, prolonged squatting, lithotomy position.',
        ],
        keyTakeaways: [
          'Inability to walk on heels = Peroneal nerve; Inability to walk on toes = Tibial nerve.',
        ],
      },
    ],
    flashcards: [
      {
        id: 'cpn-fc1',
        front: 'Which nerve is most vulnerable in a fracture of the neck of the fibula?',
        back: 'Common Peroneal Nerve (winds around fibular neck subcutaneously).',
        clinicalPearl: 'Fibular neck fractures frequently lacerate or compress the common peroneal nerve.',
        category: 'Anatomy High-Yield',
        difficulty: 'high-yield',
        topicId: 'anat-4',
        subjectId: 'anatomy',
      },
      {
        id: 'cpn-fc2',
        front: 'What is the characteristic sensory deficit of the Deep Peroneal Nerve?',
        back: 'Sensory loss strictly in the First Web Space (between 1st and 2nd toes).',
        clinicalPearl: 'The deep peroneal nerve supplies only the skin of the first interdigital cleft.',
        category: 'Anatomy High-Yield',
        difficulty: 'high-yield',
        topicId: 'anat-4',
        subjectId: 'anatomy',
      },
      {
        id: 'cpn-fc3',
        front: 'How do you clinically differentiate Common Peroneal vs Tibial nerve injury?',
        back: 'Peroneal = Foot drop, cannot walk on heels. Tibial = Loss of plantarflexion, cannot walk on toes.',
        clinicalPearl: 'Tibial nerve supplies posterior compartment muscles (soleus, gastrocnemius).',
        category: 'Clinical Discriminators',
        difficulty: 'high-yield',
        topicId: 'anat-4',
        subjectId: 'anatomy',
      },
    ],
    clinicalCase: {
      id: 'cpn-case1',
      caseNumber: 1,
      title: 'Post-Cast Foot Drop Following Fibula Injury',
      patientDemographics: '28-year-old male motorcyclist',
      presentation: 'Patient sustains a proximal fibula fracture managed with a plaster cast. Upon removal 4 weeks later, he drags his left foot while walking and trips over curbs. Examination reveals inability to dorsiflex the ankle or walk on heels, with sensory loss over the dorsal aspect of the foot and first web space. Plantarflexion and ankle reflex are preserved.',
      physicalExamOrLabs: 'Ankle dorsiflexion: 0/5 (Complete paralysis); Plantarflexion: 5/5; Sensory loss: Dorsum of left foot & 1st interdigital cleft; Achilles reflex: 2+ (Normal).',
      diagnosticQuestion: 'Which nerve is primarily injured, and what is the exact anatomical site of compression?',
      options: [
        { optionId: 'opt-1', key: 'A', text: 'Common peroneal nerve at the neck of the fibula', isCorrect: true },
        { optionId: 'opt-2', key: 'B', text: 'Tibial nerve at the popliteal fossa', isCorrect: false },
        { optionId: 'opt-3', key: 'C', text: 'Femoral nerve at the inguinal ligament', isCorrect: false },
        { optionId: 'opt-4', key: 'D', text: 'Obturator nerve in the obturator canal', isCorrect: false },
      ],
      correctOptionId: 'opt-1',
      correctAnswer: 'A',
      clinicalExplanation: 'Preserved plantarflexion and Achilles reflex rules out Sciatic/Tibial nerve lesions. Isolated dorsiflexion failure with dorsum numbness localized specifically to Common Peroneal at the fibular neck.',
      examPearl: 'Common peroneal nerve injury is classic after below-knee cast immobilization or fibular neck fracture.',
      focusArea: 'Lower Limb Peripheral Nerve Lesions',
    },
    retestQuestions: [
      {
        id: 'retest-cpn-1',
        sessionId: 'retest-session-cpn',
        sequenceNumber: 1,
        scenario: 'A 32-year-old male presents with a high-stepping gait following a lateral blow to the knee. On examination, he cannot dorsiflex or evert his right foot.',
        question: 'Which sensory region will confirm deep peroneal nerve involvement?',
        options: [
          { optionId: 'opt-1', key: 'A', text: 'First interdigital web space on the dorsum of foot', isCorrect: true },
          { optionId: 'opt-2', key: 'B', text: 'Sole of the foot and heel pad', isCorrect: false },
          { optionId: 'opt-3', key: 'C', text: 'Medial side of the leg and medial malleolus', isCorrect: false },
          { optionId: 'opt-4', key: 'D', text: 'Lateral border of the foot and fifth toe', isCorrect: false },
        ],
        correctOptionId: 'opt-1',
        correctAnswer: 'A',
        explanation: 'The deep peroneal nerve provides cutaneous sensory innervation exclusively to the first interdigital cleft (web space between great and 2nd toe).',
        subjectId: 'anatomy',
        subjectName: 'Anatomy',
        topicId: 'anat-4',
        topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
        isAiGenerated: false,
      },
      {
        id: 'retest-cpn-2',
        sessionId: 'retest-session-cpn',
        sequenceNumber: 2,
        scenario: 'A patient presents with acute foot drop following tight cast application around the proximal leg.',
        question: 'Which muscle is responsible for foot dorsiflexion and is paralyzed in common peroneal nerve injury?',
        options: [
          { optionId: 'opt-1', key: 'A', text: 'Tibialis anterior', isCorrect: true },
          { optionId: 'opt-2', key: 'B', text: 'Gastrocnemius', isCorrect: false },
          { optionId: 'opt-3', key: 'C', text: 'Tibialis posterior', isCorrect: false },
          { optionId: 'opt-4', key: 'D', text: 'Flexor hallucis longus', isCorrect: false },
        ],
        correctOptionId: 'opt-1',
        correctAnswer: 'A',
        explanation: 'Tibialis anterior is the primary dorsiflexor of the foot, innervated by the deep peroneal nerve.',
        subjectId: 'anatomy',
        subjectName: 'Anatomy',
        topicId: 'anat-4',
        topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
        isAiGenerated: false,
      },
      {
        id: 'retest-cpn-3',
        sessionId: 'retest-session-cpn',
        sequenceNumber: 3,
        scenario: 'A patient is unable to walk on their toes after a posterior knee dislocation.',
        question: 'Which nerve is most likely damaged?',
        options: [
          { optionId: 'opt-1', key: 'A', text: 'Tibial nerve', isCorrect: true },
          { optionId: 'opt-2', key: 'B', text: 'Common peroneal nerve', isCorrect: false },
          { optionId: 'opt-3', key: 'C', text: 'Superficial peroneal nerve', isCorrect: false },
          { optionId: 'opt-4', key: 'D', text: 'Saphenous nerve', isCorrect: false },
        ],
        correctOptionId: 'opt-1',
        correctAnswer: 'A',
        explanation: 'Inability to stand or walk on toes indicates paralysis of the gastrocnemius/soleus complex, supplied by the Tibial nerve.',
        subjectId: 'anatomy',
        subjectName: 'Anatomy',
        topicId: 'anat-4',
        topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
        isAiGenerated: false,
      },
      {
        id: 'retest-cpn-4',
        sessionId: 'retest-session-cpn',
        sequenceNumber: 4,
        scenario: 'Anatomical review of lower extremity peripheral motor innervation compartments.',
        question: 'The superficial peroneal nerve supplies motor innervation to which of the following muscular compartments?',
        options: [
          { optionId: 'opt-1', key: 'A', text: 'Lateral compartment (Peroneus longus and brevis)', isCorrect: true },
          { optionId: 'opt-2', key: 'B', text: 'Anterior compartment (Tibialis anterior and EDL)', isCorrect: false },
          { optionId: 'opt-3', key: 'C', text: 'Deep posterior compartment (Tibialis posterior)', isCorrect: false },
          { optionId: 'opt-4', key: 'D', text: 'Superficial posterior compartment (Soleus)', isCorrect: false },
        ],
        correctOptionId: 'opt-1',
        correctAnswer: 'A',
        explanation: 'Superficial peroneal nerve innervates the lateral compartment of the leg (Peroneus longus and brevis), producing eversion.',
        subjectId: 'anatomy',
        subjectName: 'Anatomy',
        topicId: 'anat-4',
        topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
        isAiGenerated: false,
      },
      {
        id: 'retest-cpn-5',
        sessionId: 'retest-session-cpn',
        sequenceNumber: 5,
        scenario: 'A young worker presents with gait abnormality after prolonged squatting during agricultural work.',
        question: 'Prolonged compression at the neck of the fibula most commonly produces which clinical deformity?',
        options: [
          { optionId: 'opt-1', key: 'A', text: 'Foot drop with loss of sensation on the dorsum of foot', isCorrect: true },
          { optionId: 'opt-2', key: 'B', text: 'Calcaneovalgus deformity with sole numbness', isCorrect: false },
          { optionId: 'opt-3', key: 'C', text: 'Waddling gait with Trendelenburg sign', isCorrect: false },
          { optionId: 'opt-4', key: 'D', text: 'Claw hand deformity with intrinsic wasting', isCorrect: false },
        ],
        correctOptionId: 'opt-1',
        correctAnswer: 'A',
        explanation: 'Common peroneal nerve compression at the neck of the fibula leads to foot drop and sensory impairment across the dorsum of the foot.',
        subjectId: 'anatomy',
        subjectName: 'Anatomy',
        topicId: 'anat-4',
        topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
        isAiGenerated: false,
      },
    ],
  },
  'c-atropine-toxicity': {
    conceptName: 'Anticholinergic Toxicity (Atropine Overdose & Antidote)',
    whyItMatters: 'Repeated 100% in Pharmacology. Direct questions on Physostigmine vs Neostigmine and mnemonic signs.',
    classicTrap: 'Giving Neostigmine (quaternary amine, does not cross BBB) instead of Physostigmine (tertiary amine, crosses BBB).',
    coreFact: 'Atropine toxicity presents as "Blind as a bat, Mad as a hatter, Red as a beet, Hot as a hare, Dry as a bone". Antidote is Physostigmine.',
    mechanism: 'Competitive blockade of muscarinic M1, M2, M3 receptors in central and peripheral nervous systems.',
    clinicalCorrelation: 'Mydriasis, cycloplegia, delirium, flushing, hyperthermia, dry mouth, urinary retention, tachycardia.',
    classicExamClue: 'Patient with Datura ingestion or organophosphate over-treatment presenting with fever, dilated unreactive pupils, and delirium.',
    commonTrap: 'Pralidoxime (2-PAM) is for organophosphate poisoning, NOT for atropine toxicity.',
    slides: [
      {
        id: 'atr-s1',
        slideNumber: 1,
        title: 'Anticholinergic Toxicity Syndrome',
        subtitle: 'The Classic Mnemonic Signs',
        category: 'pharmacology_mgmt',
        bullets: [
          '"Red as a beet": Cutaneous vasodilation.',
          '"Dry as a bone": Anhidrosis and dry mucous membranes.',
          '"Blind as a bat": Mydriasis (dilated fixed pupils) + cycloplegia.',
          '"Mad as a hatter": Central delirium, agitation, hallucinations.',
          '"Hot as a hare": Hyperthermia from inability to sweat.',
        ],
        keyTakeaways: [
          'Recognize the classic 5-component anticholinergic toxidrome immediately in exam vignettes.',
        ],
      },
      {
        id: 'atr-s2',
        slideNumber: 2,
        title: 'Drug of Choice / Antidote: Physostigmine',
        subtitle: 'Tertiary vs Quaternary Amine Discriminator',
        category: 'exam_traps',
        bullets: [
          'Physostigmine: Tertiary amine → Crosses Blood-Brain Barrier → Reverses central delirium AND peripheral signs.',
          'Neostigmine / Pyridostigmine: Quaternary amine → CANNOT cross BBB → Ineffective for central toxicity.',
          'Dose: 1-2 mg slow IV.',
        ],
        keyTakeaways: [
          'Physostigmine is the ONLY antidote that reverses central anticholinergic delirium.',
        ],
      },
    ],
    flashcards: [
      {
        id: 'atr-fc1',
        front: 'What is the specific antidote for severe Atropine toxicity with central delirium?',
        back: 'Physostigmine (Tertiary amine acetylcholinesterase inhibitor that crosses BBB).',
        clinicalPearl: 'Physostigmine reverses both central and peripheral antimuscarinic manifestations.',
        category: 'Pharmacology Antidotes',
        difficulty: 'high-yield',
        topicId: 'pharm-1',
        subjectId: 'pharmacology',
      },
      {
        id: 'atr-fc2',
        front: 'Why is Neostigmine NOT used as the antidote for Atropine toxicity?',
        back: 'Neostigmine is a quaternary amine and cannot cross the Blood-Brain Barrier to treat delirium.',
        clinicalPearl: 'Central muscarinic blockade requires a lipophilic tertiary amine like Physostigmine.',
        category: 'Pharmacology Antidotes',
        difficulty: 'high-yield',
        topicId: 'pharm-1',
        subjectId: 'pharmacology',
      },
      {
        id: 'atr-fc3',
        front: 'What is the ocular manifestation of Atropine toxicity?',
        back: 'Mydriasis (dilated pupils) with Cycloplegia (loss of accommodation).',
        clinicalPearl: 'Atropine blocks M3 receptors on pupillary sphincter and ciliary muscles.',
        category: 'Clinical Discriminators',
        difficulty: 'high-yield',
        topicId: 'pharm-1',
        subjectId: 'pharmacology',
      },
    ],
    clinicalCase: {
      id: 'atr-case1',
      caseNumber: 1,
      title: 'Datura Stramonium Ingestion with Delirium',
      patientDemographics: '24-year-old male with acute altered mental status',
      presentation: 'Patient is brought to the emergency department after ingesting Datura seeds. He is agitated, hallucinating, and plucking at imaginary objects. Temperature is 39.2°C, pulse 135 bpm, BP 140/90 mmHg. Physical examination reveals flushed dry skin, absent bowel sounds, palpable urinary bladder, and widely dilated non-reactive pupils.',
      physicalExamOrLabs: 'Pupils: 8mm bilateral, non-reactive; Skin: Flushed, hot, anhidrotic; Abdomen: Distended bladder, absent bowel sounds; Mental status: Agitated delirium.',
      diagnosticQuestion: 'Which of the following is the most appropriate definitive antidote to reverse his central and peripheral symptoms?',
      options: [
        { optionId: 'opt-1', key: 'A', text: 'Intravenous Physostigmine', isCorrect: true },
        { optionId: 'opt-2', key: 'B', text: 'Intravenous Neostigmine', isCorrect: false },
        { optionId: 'opt-3', key: 'C', text: 'Intravenous Pralidoxime (2-PAM)', isCorrect: false },
        { optionId: 'opt-4', key: 'D', text: 'Intravenous Naloxone', isCorrect: false },
      ],
      correctOptionId: 'opt-1',
      correctAnswer: 'A',
      clinicalExplanation: 'Datura seeds contain belladonna alkaloids (scopolamine, atropine). Physostigmine is the only cholinesterase inhibitor that crosses the blood-brain barrier to reverse central anticholinergic delirium.',
      examPearl: 'Physostigmine reverses central anticholinergic symptoms; Neostigmine does not cross the BBB.',
      focusArea: 'Anticholinergic Toxicity & Antidotes',
    },
    retestQuestions: [
      {
        id: 'retest-atr-1',
        sessionId: 'retest-session-atr',
        sequenceNumber: 1,
        scenario: 'A patient treated for organophosphate poisoning develops fever, blurred vision, dry mouth, and confusion.',
        question: 'Which antidote should be administered immediately for this iatrogenic complication?',
        options: [
          { optionId: 'opt-1', key: 'A', text: 'Physostigmine', isCorrect: true },
          { optionId: 'opt-2', key: 'B', text: 'Pralidoxime', isCorrect: false },
          { optionId: 'opt-3', key: 'C', text: 'Atropine', isCorrect: false },
          { optionId: 'opt-4', key: 'D', text: 'Edrophonium', isCorrect: false },
        ],
        correctOptionId: 'opt-1',
        correctAnswer: 'A',
        explanation: 'Atropine overdose during organophosphate therapy produces anticholinergic toxicity, treated with Physostigmine.',
        subjectId: 'pharmacology',
        subjectName: 'Pharmacology',
        topicId: 'pharm-1',
        topicName: 'Autonomic Nervous System Drugs',
        isAiGenerated: false,
      },
      {
        id: 'retest-atr-2',
        sessionId: 'retest-session-atr',
        sequenceNumber: 2,
        scenario: 'Pharmacological mechanism of acetylcholinesterase inhibitor BBB permeability.',
        question: 'Physostigmine is capable of reversing central atropine toxicity because it is a:',
        options: [
          { optionId: 'opt-1', key: 'A', text: 'Tertiary amine', isCorrect: true },
          { optionId: 'opt-2', key: 'B', text: 'Quaternary amine', isCorrect: false },
          { optionId: 'opt-3', key: 'C', text: 'Secondary amine', isCorrect: false },
          { optionId: 'opt-4', key: 'D', text: 'Irreversible organophosphate', isCorrect: false },
        ],
        correctOptionId: 'opt-1',
        correctAnswer: 'A',
        explanation: 'Physostigmine is a tertiary amine, allowing it to cross the lipophilic Blood-Brain Barrier.',
        subjectId: 'pharmacology',
        subjectName: 'Pharmacology',
        topicId: 'pharm-1',
        topicName: 'Autonomic Nervous System Drugs',
        isAiGenerated: false,
      },
      {
        id: 'retest-atr-3',
        sessionId: 'retest-session-atr',
        sequenceNumber: 3,
        scenario: 'Clinical distinction between cholinergic vs anticholinergic toxidromes.',
        question: 'Which of the following clinical features is NOT typically seen in anticholinergic poisoning?',
        options: [
          { optionId: 'opt-1', key: 'A', text: 'Diarrhea and hypersalivation', isCorrect: true },
          { optionId: 'opt-2', key: 'B', text: 'Urinary retention', isCorrect: false },
          { optionId: 'opt-3', key: 'C', text: 'Sinus tachycardia', isCorrect: false },
          { optionId: 'opt-4', key: 'D', text: 'Mydriasis', isCorrect: false },
        ],
        correctOptionId: 'opt-1',
        correctAnswer: 'A',
        explanation: 'Diarrhea and hypersalivation are cholinergic (SLUDGE) features, whereas anticholinergic toxicity causes constipation and dry mouth.',
        subjectId: 'pharmacology',
        subjectName: 'Pharmacology',
        topicId: 'pharm-1',
        topicName: 'Autonomic Nervous System Drugs',
        isAiGenerated: false,
      },
      {
        id: 'retest-atr-4',
        sessionId: 'retest-session-atr',
        sequenceNumber: 4,
        scenario: 'Ocular pharmacology of muscarinic antagonist agents.',
        question: 'Atropine induces cycloplegia (paralysis of accommodation) by blocking muscarinic receptors on which structure?',
        options: [
          { optionId: 'opt-1', key: 'A', text: 'Ciliary muscle', isCorrect: true },
          { optionId: 'opt-2', key: 'B', text: 'Constrictor pupillae muscle', isCorrect: false },
          { optionId: 'opt-3', key: 'C', text: 'Dilator pupillae muscle', isCorrect: false },
          { optionId: 'opt-4', key: 'D', text: 'Superior rectus muscle', isCorrect: false },
        ],
        correctOptionId: 'opt-1',
        correctAnswer: 'A',
        explanation: 'M3 receptor blockade on the ciliary muscle prevents accommodation for near vision (cycloplegia).',
        subjectId: 'pharmacology',
        subjectName: 'Pharmacology',
        topicId: 'pharm-1',
        topicName: 'Autonomic Nervous System Drugs',
        isAiGenerated: false,
      },
      {
        id: 'retest-atr-5',
        sessionId: 'retest-session-atr',
        sequenceNumber: 5,
        scenario: 'A child ingests belladonna berries and presents with dry hot red skin and tachycardia.',
        question: 'The primary mechanism of hyperthermia in anticholinergic toxicity is:',
        options: [
          { optionId: 'opt-1', key: 'A', text: 'Suppression of eccrine sweat gland secretion (anhidrosis)', isCorrect: true },
          { optionId: 'opt-2', key: 'B', text: 'Hypothalamic set-point elevation by interleukins', isCorrect: false },
          { optionId: 'opt-3', key: 'C', text: 'Peripheral vasoconstriction', isCorrect: false },
          { optionId: 'opt-4', key: 'D', text: 'Increased skeletal muscle thermogenesis', isCorrect: false },
        ],
        correctOptionId: 'opt-1',
        correctAnswer: 'A',
        explanation: 'Atropine blocks muscarinic receptors on eccrine sweat glands, preventing heat loss through evaporation.',
        subjectId: 'pharmacology',
        subjectName: 'Pharmacology',
        topicId: 'pharm-1',
        topicName: 'Autonomic Nervous System Drugs',
        isAiGenerated: false,
      },
    ],
  },
};

/**
 * Extracts or maps the specific concept gap from an error entry.
 */
export function extractConceptGap(
  subjectId: string,
  topicId: string,
  questionGist = '',
  myMistake = ''
): { conceptId: string; conceptName: string; whyItMatters: string; classicTrap: string } {
  const sId = subjectId.toLowerCase();
  const tId = topicId.toLowerCase();
  const text = `${questionGist} ${myMistake} ${topicId}`.toLowerCase();

  if (
    sId === 'anatomy' &&
    (tId === 'anat-4' ||
      text.includes('peroneal') ||
      text.includes('fibular') ||
      text.includes('knee') ||
      text.includes('foot drop') ||
      text.includes('web space') ||
      text.includes('lower limb'))
  ) {
    return {
      conceptId: 'c-peroneal-nerve',
      conceptName: VERIFIED_CONCEPT_DATABASE['c-peroneal-nerve'].conceptName,
      whyItMatters: VERIFIED_CONCEPT_DATABASE['c-peroneal-nerve'].whyItMatters,
      classicTrap: VERIFIED_CONCEPT_DATABASE['c-peroneal-nerve'].classicTrap,
    };
  }

  if (
    sId === 'pharmacology' &&
    (tId === 'pharm-1' ||
      text.includes('atropine') ||
      text.includes('physostigmine') ||
      text.includes('anticholinergic') ||
      text.includes('datura') ||
      text.includes('autonomic'))
  ) {
    return {
      conceptId: 'c-atropine-toxicity',
      conceptName: VERIFIED_CONCEPT_DATABASE['c-atropine-toxicity'].conceptName,
      whyItMatters: VERIFIED_CONCEPT_DATABASE['c-atropine-toxicity'].whyItMatters,
      classicTrap: VERIFIED_CONCEPT_DATABASE['c-atropine-toxicity'].classicTrap,
    };
  }

  // Dynamic fallback concept gap derivation
  const sub = FMGE_SUBJECTS.find((s) => s.id === subjectId);
  const topic = sub?.topics.find((t) => t.id === topicId);
  const cleanName = topic?.name || `${subjectId} Core Clinical Topic`;

  return {
    conceptId: `concept-${subjectId}-${topicId}`,
    conceptName: `${cleanName} — Diagnostic Discriminators`,
    whyItMatters: `High-yield ${sub?.name || subjectId} exam concept with recurring past questions.`,
    classicTrap: 'Confusing hallmark physical examination findings with similar clinical presentations.',
  };
}

/**
 * Groups Error Vault items by Concept Gap.
 */
export function groupErrorsByConcept(errors: ErrorNotebookItem[]): ErrorConceptCluster[] {
  const clusterMap: Record<string, ErrorConceptCluster> = {};

  errors.forEach((err) => {
    const gap = extractConceptGap(err.subjectId, err.topicId || 'top-1', err.questionGist, err.myMistake);
    const sub = FMGE_SUBJECTS.find((s) => s.id === err.subjectId);
    const key = `${err.subjectId}-${gap.conceptId}`;

    if (!clusterMap[key]) {
      clusterMap[key] = {
        conceptId: gap.conceptId,
        conceptName: gap.conceptName,
        subjectId: err.subjectId,
        subjectName: sub?.name || err.subjectId,
        topicId: err.topicId || 'top-1',
        topicName: err.topic || 'General Topic',
        errorCount: 0,
        whyItMatters: gap.whyItMatters,
        classicTrap: gap.classicTrap,
        errors: [],
        depth: 'isolated',
      };
    }

    clusterMap[key].errorCount++;
    clusterMap[key].errors.push(err);
  });

  // Calculate adaptive depth for each cluster
  return Object.values(clusterMap).map((cluster) => {
    let depth: 'isolated' | 'repeated' | 'severe' = 'isolated';
    if (cluster.errorCount >= 3) {
      depth = 'severe';
    } else if (cluster.errorCount >= 2) {
      depth = 'repeated';
    }
    return { ...cluster, depth };
  });
}

/**
 * Generates a targeted remediation package for a specific concept.
 */
export function generateConceptRemediationPackage(
  subjectId: string,
  topicId: string,
  conceptId: string,
  conceptName: string,
  depth: 'isolated' | 'repeated' | 'severe' = 'repeated'
): ConceptRemediationPackage {
  const sub = FMGE_SUBJECTS.find((s) => s.id === subjectId);
  const topic = sub?.topics.find((t) => t.id === topicId);
  const verified = VERIFIED_CONCEPT_DATABASE[conceptId];

  if (verified) {
    // Randomize retest question answer positions genuinely
    const randomizedQuestions: PracticeSessionQuestion[] = verified.retestQuestions.map((q) => {
      const shuffledOptions = shuffleArray([...q.options]);
      const correctText = q.options.find((o) => o.isCorrect)?.text || q.options[0].text;
      const newCorrectIdx = shuffledOptions.findIndex((o) => o.text === correctText);
      const newCorrectLetter = (['A', 'B', 'C', 'D'][newCorrectIdx >= 0 ? newCorrectIdx : 0]) as 'A' | 'B' | 'C' | 'D';
      const newCorrectOptionId = shuffledOptions[newCorrectIdx >= 0 ? newCorrectIdx : 0]?.optionId || 'opt-1';

      return {
        ...q,
        options: shuffledOptions.map((opt, idx) => ({
          ...opt,
          key: (['A', 'B', 'C', 'D'][idx]) as 'A' | 'B' | 'C' | 'D',
          isCorrect: opt.text === correctText,
        })),
        correctOptionId: newCorrectOptionId,
        correctAnswer: newCorrectLetter,
      };
    });

    return {
      id: `remediation-pkg-${subjectId}-${conceptId}`,
      conceptId,
      conceptName: verified.conceptName,
      subjectId,
      subjectName: sub?.name || subjectId,
      topicId,
      topicName: topic?.name || 'High-Yield Topic',
      whyItMatters: verified.whyItMatters,
      classicTrap: verified.classicTrap,
      depth,
      quickExplanation: {
        coreFact: verified.coreFact,
        mechanism: verified.mechanism,
        clinicalCorrelation: verified.clinicalCorrelation,
        classicExamClue: verified.classicExamClue,
        commonTrap: verified.commonTrap,
      },
      slides: depth === 'isolated' ? verified.slides.slice(0, 2) : verified.slides,
      flashcards: depth === 'isolated' ? verified.flashcards.slice(0, 3) : verified.flashcards,
      clinicalCase: verified.clinicalCase,
      retestQuestions: depth === 'isolated' ? randomizedQuestions.slice(0, 3) : randomizedQuestions,
    };
  }

  // Dynamic synthesis using authentic topic study materials
  const cleanTopicName = topic?.name || `${subjectId} Core Concept`;
  const topicIntel = getTopicLearningContext(subjectId, topicId, cleanTopicName);
  const slideDeck = generateSlideDeck(subjectId, topicId, cleanTopicName);
  const flashcardDeck = generateFlashcardDeck(subjectId, topicId, cleanTopicName);
  const casesDeck = generateTopicClinicalCasesDeck(subjectId, topicId, cleanTopicName);
  const topicPearls = generateTopicPearls(subjectId, topicId, cleanTopicName);

  const realSlides: VisualSlideItem[] =
    slideDeck.slides && slideDeck.slides.length > 0
      ? slideDeck.slides
      : [
          {
            id: `dyn-s1-${conceptId}`,
            slideNumber: 1,
            title: `${cleanTopicName} — High-Yield Overview`,
            subtitle: `${sub?.name || subjectId} • FMGE Priority Blueprint`,
            category: 'overview',
            bullets: topicIntel.conceptClusters.slice(0, 4),
            keyTakeaways: [
              topicPearls[0]?.statement ||
                `Master the hallmark discriminators for ${cleanTopicName} to secure core NBE marks.`,
            ],
            examTrapWarning:
              topicIntel.commonExamTraps[0] ||
              'Differentiate primary diagnostic criteria from clinical mimics.',
          },
          {
            id: `dyn-s2-${conceptId}`,
            slideNumber: 2,
            title: `${cleanTopicName} — Clinical Discriminators & Traps`,
            subtitle: 'Differentiating Look-Alike Vignettes',
            category: 'exam_traps',
            bullets: [
              topicPearls[1]?.statement ||
                `Key clinical hallmarks and diagnostic gold standards in ${cleanTopicName}.`,
              topicPearls[2]?.statement ||
                `Management guidelines and initial drug of choice protocols.`,
              `Examiner trap: ${topicIntel.commonExamTraps[1] || 'Misreading acute vs chronic presentation timeline.'}`,
            ],
            keyTakeaways: [
              topicPearls[0]?.discriminatorTip ||
                'Prioritize definitive diagnostic confirmation over general screening.',
            ],
            examTrapWarning: topicIntel.commonExamTraps[0],
          },
        ];

  const realFlashcards: FlashcardItem[] =
    flashcardDeck.cards && flashcardDeck.cards.length > 0
      ? flashcardDeck.cards
      : [
          {
            id: `dyn-fc1-${conceptId}`,
            front: `What is the hallmark diagnostic finding / gold standard for ${cleanTopicName}?`,
            back:
              topicPearls[0]?.statement ||
              `Definitive clinical hallmark and confirmatory diagnostic criteria for ${cleanTopicName}.`,
            clinicalPearl:
              topicPearls[0]?.discriminatorTip ||
              `Always prioritize definitive diagnostic criteria over non-specific screening.`,
            category: 'Diagnostics',
            difficulty: 'high-yield',
            topicId,
            subjectId,
          },
          {
            id: `dyn-fc2-${conceptId}`,
            front: `What is the first-line pharmacotherapeutic management / drug of choice in ${cleanTopicName}?`,
            back:
              topicPearls[1]?.statement ||
              `Guideline-directed medical management and initial therapeutic protocol.`,
            clinicalPearl:
              topicPearls[1]?.examTrapWarning ||
              `Differentiate acute emergency stabilization from long-term maintenance.`,
            category: 'Pharmacology',
            difficulty: 'high-yield',
            topicId,
            subjectId,
          },
          {
            id: `dyn-fc3-${conceptId}`,
            front: `What is the most common exam trap associated with ${cleanTopicName}?`,
            back:
              topicIntel.commonExamTraps[0] ||
              `Confusing lookalike clinical presentations or contraindications.`,
            clinicalPearl:
              topicPearls[2]?.statement ||
              `Scrutinize clinical discriminators and patient age in question stems.`,
            category: 'Exam Traps',
            difficulty: 'high-yield',
            topicId,
            subjectId,
          },
        ];

  const realCase: ClinicalCaseItem =
    casesDeck.cases && casesDeck.cases.length > 0
      ? casesDeck.cases[0]
      : {
          id: `dyn-case-${conceptId}`,
          caseNumber: 1,
          title: `Clinical Vignette: ${cleanTopicName}`,
          patientDemographics: '45-year-old patient',
          presentation: `A 45-year-old patient presents with classic signs and symptoms of ${cleanTopicName}. Physical examination and initial diagnostic investigations confirm the characteristic clinical triad.`,
          physicalExamOrLabs: `Diagnostic findings consistent with ${cleanTopicName}; vital signs stable.`,
          diagnosticQuestion: `Which of the following is the most appropriate next step in diagnosis or management?`,
          options: [
            {
              optionId: 'opt-1',
              key: 'A',
              text:
                topicPearls[0]?.statement ||
                'Initiate first-line guideline-directed medical therapy',
              isCorrect: true,
            },
            {
              optionId: 'opt-2',
              key: 'B',
              text: 'Prescribe contraindicated or non-specific conservative therapy',
              isCorrect: false,
            },
            {
              optionId: 'opt-3',
              key: 'C',
              text: 'Discharge with reassurance and no follow-up',
              isCorrect: false,
            },
            {
              optionId: 'opt-4',
              key: 'D',
              text: 'Perform invasive exploratory surgery without confirmation',
              isCorrect: false,
            },
          ],
          correctOptionId: 'opt-1',
          correctAnswer: 'A',
          clinicalExplanation:
            topicPearls[0]?.statement ||
            `First-line guideline medical management is indicated immediately upon clinical and diagnostic confirmation.`,
          examPearl:
            topicPearls[0]?.discriminatorTip ||
            `Follow structured guideline escalation for clinical management.`,
          focusArea: 'Clinical Management & Treatment Guidelines',
        };

  const realRetestQuestions: PracticeSessionQuestion[] = [
    {
      id: `dyn-q1-${conceptId}`,
      sessionId: `retest-${conceptId}`,
      sequenceNumber: 1,
      scenario: `Diagnostic evaluation of a patient presenting with symptoms suggestive of ${cleanTopicName}.`,
      question: `Which of the following represents the hallmark diagnostic discriminator for ${cleanTopicName}?`,
      options: [
        {
          optionId: 'opt-1',
          key: 'A',
          text:
            topicPearls[0]?.statement ||
            'Definitive first-line confirmatory finding',
          isCorrect: true,
        },
        {
          optionId: 'opt-2',
          key: 'B',
          text: 'Non-specific inflammatory marker elevation',
          isCorrect: false,
        },
        {
          optionId: 'opt-3',
          key: 'C',
          text: 'Incidental age-related physiological variation',
          isCorrect: false,
        },
        {
          optionId: 'opt-4',
          key: 'D',
          text: 'Atypical transient lab anomaly',
          isCorrect: false,
        },
      ],
      correctOptionId: 'opt-1',
      correctAnswer: 'A',
      explanation:
        topicPearls[0]?.statement ||
        'First-line confirmatory findings provide the highest sensitivity and specificity for definitive diagnosis.',
      subjectId,
      subjectName: sub?.name || subjectId,
      topicId,
      topicName: cleanTopicName,
      isAiGenerated: false,
    },
    {
      id: `dyn-q2-${conceptId}`,
      sessionId: `retest-${conceptId}`,
      sequenceNumber: 2,
      scenario: `Clinical decision-making in ${cleanTopicName}.`,
      question: `What is the primary high-yield exam takeaway for ${cleanTopicName}?`,
      options: [
        {
          optionId: 'opt-1',
          key: 'A',
          text:
            topicPearls[1]?.statement ||
            topicIntel.conceptClusters[0] ||
            'Guideline-directed medical management',
          isCorrect: true,
        },
        {
          optionId: 'opt-2',
          key: 'B',
          text: 'Non-targeted broad spectrum management',
          isCorrect: false,
        },
        {
          optionId: 'opt-3',
          key: 'C',
          text: 'Unrelated alternative pathology',
          isCorrect: false,
        },
        {
          optionId: 'opt-4',
          key: 'D',
          text: 'Immediate surgical excision without imaging',
          isCorrect: false,
        },
      ],
      correctOptionId: 'opt-1',
      correctAnswer: 'A',
      explanation:
        topicPearls[1]?.statement ||
        'Targeted therapy addresses the primary pathophysiological trigger directly.',
      subjectId,
      subjectName: sub?.name || subjectId,
      topicId,
      topicName: cleanTopicName,
      isAiGenerated: false,
    },
    {
      id: `dyn-q3-${conceptId}`,
      sessionId: `retest-${conceptId}`,
      sequenceNumber: 3,
      scenario: `Exam vignette and high-yield discriminator for ${cleanTopicName}.`,
      question: `Which exam trap must be avoided when evaluating ${cleanTopicName}?`,
      options: [
        {
          optionId: 'opt-1',
          key: 'A',
          text:
            topicIntel.commonExamTraps[0] ||
            topicPearls[2]?.statement ||
            'Confusing lookalike clinical presentations or contraindications',
          isCorrect: true,
        },
        {
          optionId: 'opt-2',
          key: 'B',
          text: 'Failing to perform routine baseline vitals assessment',
          isCorrect: false,
        },
        {
          optionId: 'opt-3',
          key: 'C',
          text: 'Relying strictly on confirmatory histopathology',
          isCorrect: false,
        },
        {
          optionId: 'opt-4',
          key: 'D',
          text: 'Over-interpreting normal physiological variations',
          isCorrect: false,
        },
      ],
      correctOptionId: 'opt-1',
      correctAnswer: 'A',
      explanation:
        topicIntel.commonExamTraps[0] ||
        topicPearls[2]?.statement ||
        'Carefully verify specific exclusion criteria and lookalike mimics to avoid classic exam traps.',
      subjectId,
      subjectName: sub?.name || subjectId,
      topicId,
      topicName: cleanTopicName,
      isAiGenerated: false,
    },
  ];

  // Derive genuine quickExplanation facts
  const coreFact =
    topicPearls[0]?.statement ||
    (slideDeck.slides && slideDeck.slides[0]?.bullets[0]) ||
    `Core NBE blueprint high-yield concept for ${cleanTopicName} (${sub?.weightage || 15} Marks).`;

  const mechanism =
    topicPearls[1]?.statement ||
    (slideDeck.slides && slideDeck.slides[1]?.bullets[0]) ||
    topicIntel.conceptClusters[0] ||
    `Pathophysiological and pharmacological mechanisms in ${cleanTopicName}.`;

  const clinicalCorrelation =
    (slideDeck.slides && slideDeck.slides[1]?.bullets[1]) ||
    (casesDeck.cases && casesDeck.cases[0]?.presentation) ||
    `Characteristic presentation, physical signs, and diagnostic imaging in ${cleanTopicName}.`;

  const classicExamClue =
    topicPearls[0]?.discriminatorTip ||
    (casesDeck.cases && casesDeck.cases[0]?.examPearl) ||
    `Hallmark presentation and pathognomonic findings in ${cleanTopicName}.`;

  const commonTrap =
    topicIntel.commonExamTraps[0] ||
    topicPearls[0]?.examTrapWarning ||
    `Confusing ${cleanTopicName} with lookalike conditions in time-pressured exam vignettes.`;

  return {
    id: `remediation-pkg-${subjectId}-${conceptId}`,
    conceptId,
    conceptName,
    subjectId,
    subjectName: sub?.name || subjectId,
    topicId,
    topicName: cleanTopicName,
    whyItMatters:
      topicPearls[0]?.statement ||
      `High-yield ${sub?.name || subjectId} exam concept with ${sub?.weightage || 15} marks weightage.`,
    classicTrap: commonTrap,
    depth,
    quickExplanation: {
      coreFact,
      mechanism,
      clinicalCorrelation,
      classicExamClue,
      commonTrap,
    },
    slides: depth === 'isolated' ? realSlides.slice(0, 2) : realSlides,
    flashcards: depth === 'isolated' ? realFlashcards.slice(0, 3) : realFlashcards,
    clinicalCase: realCase,
    retestQuestions: realRetestQuestions,
  };
}

/**
 * Processes remediation retest outcome and updates application state.
 */
export function processRemediationResult(
  state: AppState,
  subjectId: string,
  topicId: string,
  conceptId: string,
  score: number,
  total: number,
  retestAttempts: Array<{ questionId: string; isCorrect: boolean; selectedAnswer: string; correctAnswer: string }>
): {
  updatedState: AppState;
  remediationStatus: 'mastered' | 'improving' | 'weak' | 'needs_remediation';
  statusLabel: string;
  nextRevisionDate: string;
} {
  const accuracy = total > 0 ? (score / total) * 100 : 0;
  let remediationStatus: 'mastered' | 'improving' | 'weak' | 'needs_remediation' = 'improving';
  let statusLabel = 'CONCEPT IMPROVING';

  if (accuracy >= 90) {
    remediationStatus = 'mastered';
    statusLabel = 'CONCEPT MASTERED';
  } else if (accuracy >= 70) {
    remediationStatus = 'improving';
    statusLabel = 'CONCEPT IMPROVING';
  } else if (accuracy >= 40) {
    remediationStatus = 'weak';
    statusLabel = 'CONCEPT STILL WEAK';
  } else {
    remediationStatus = 'needs_remediation';
    statusLabel = 'REQUIRES DEEPER REMEDIATION';
  }

  // 1. Record each retest attempt in MCQ Performance Engine
  let intermediateState = state;
  retestAttempts.forEach((att, idx) => {
    intermediateState = recordMcqAttempt(intermediateState, {
      questionId: att.questionId || `retest-${conceptId}-${idx + 1}`,
      subjectId,
      topicId,
      source: 'error_vault',
      selectedAnswer: att.selectedAnswer,
      correctAnswer: att.correctAnswer,
      isCorrect: att.isCorrect,
      attemptNumber: 2,
    }).updatedState;
  });

  // 2. Mark corresponding errors in Error Notebook as reviewed/remediated
  const nowStr = new Date().toISOString();
  const updatedErrorNotebook = (intermediateState.errorNotebook || []).map((err) => {
    if (err.subjectId === subjectId && (err.topicId === topicId || err.topic.toLowerCase().includes(topicId))) {
      return {
        ...err,
        isReviewed: true,
        remediatedAt: nowStr,
        remediationScore: accuracy,
      };
    }
    return err;
  });

  // 3. Schedule follow-up spaced revision interval in Revision Matrix
  const nextDate = new Date();
  if (remediationStatus === 'mastered') {
    nextDate.setDate(nextDate.getDate() + 7); // Schedule R1 check in 7 days
  } else {
    nextDate.setDate(nextDate.getDate() + 2); // Quick re-check in 2 days
  }
  const nextRevisionDate = nextDate.toISOString().split('T')[0];

  const topicKey = `${subjectId}-${topicId}`;
  const existingTopicState = intermediateState.topicsState[topicKey] || {};
  const updatedTopicsState = {
    ...intermediateState.topicsState,
    [topicKey]: {
      ...existingTopicState,
      r1Done: existingTopicState.r1Done ?? true,
      r1Date: existingTopicState.r1Date ?? nowStr,
    },
  };

  const finalState: AppState = {
    ...intermediateState,
    errorNotebook: updatedErrorNotebook,
    topicsState: updatedTopicsState,
  };

  return {
    updatedState: finalState,
    remediationStatus,
    statusLabel,
    nextRevisionDate,
  };
}
