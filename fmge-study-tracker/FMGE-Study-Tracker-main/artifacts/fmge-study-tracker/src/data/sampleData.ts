import { AppState } from '../types';
import { INITIAL_PEARLS } from './initialPearls';
import { DEFAULT_TELEGRAM_CHANNELS, INITIAL_TELEGRAM_MCQS, DEFAULT_TELEGRAM_ANNOUNCEMENTS } from './telegramPresetData';
import { getLocalDateKey } from '../utils/date';

// Default initial state
export const getInitialAppState = (): AppState => {
  // Target upcoming exam date (e.g. 75 days from now)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 75);
  const examDateStr = getLocalDateKey(targetDate);

  const todayStr = getLocalDateKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateKey(yesterday);

  return {
    settings: {
      userName: 'Dr. Aspirant',
      examDate: examDateStr,
      targetScore: 185,
      coachingSource: 'Marrow & Rapid Revision',
      dailyStudyHourGoal: 8,
      dailyQBankGoal: 80,
      autoSaveHighYield: true,
    },
    subjectProgress: {
      psm: { subjectId: 'psm', confidence: 'strong', targetRevisionDate: examDateStr },
      obg: { subjectId: 'obg', confidence: 'moderate', targetRevisionDate: examDateStr },
      pharmacology: { subjectId: 'pharmacology', confidence: 'moderate', targetRevisionDate: examDateStr },
      anatomy: { subjectId: 'anatomy', confidence: 'low', targetRevisionDate: examDateStr },
      pediatrics: { subjectId: 'pediatrics', confidence: 'strong', targetRevisionDate: examDateStr },
      pathology: { subjectId: 'pathology', confidence: 'moderate', targetRevisionDate: examDateStr },
      surgery: { subjectId: 'surgery', confidence: 'moderate', targetRevisionDate: examDateStr },
      medicine: { subjectId: 'medicine', confidence: 'low', targetRevisionDate: examDateStr },
      fmt: { subjectId: 'fmt', confidence: 'mastered', targetRevisionDate: examDateStr },
      ophthalmology: { subjectId: 'ophthalmology', confidence: 'moderate', targetRevisionDate: examDateStr },
      ent: { subjectId: 'ent', confidence: 'strong', targetRevisionDate: examDateStr },
      dermatology: { subjectId: 'dermatology', confidence: 'strong', targetRevisionDate: examDateStr },
      anesthesia: { subjectId: 'anesthesia', confidence: 'strong', targetRevisionDate: examDateStr },
      radiology: { subjectId: 'radiology', confidence: 'moderate', targetRevisionDate: examDateStr },
      psychiatry: { subjectId: 'psychiatry', confidence: 'mastered', targetRevisionDate: examDateStr },
      orthopedics: { subjectId: 'orthopedics', confidence: 'moderate', targetRevisionDate: examDateStr },
      microbiology: { subjectId: 'microbiology', confidence: 'moderate', targetRevisionDate: examDateStr },
      biochemistry: { subjectId: 'biochemistry', confidence: 'low', targetRevisionDate: examDateStr },
      physiology: { subjectId: 'physiology', confidence: 'moderate', targetRevisionDate: examDateStr },
    },
    topicsState: {
      // PSM (High Yield Completed)
      'psm-psm-1': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 65, qBankAccuracy: 82 },
      'psm-psm-2': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 50, qBankAccuracy: 78 },
      'psm-psm-3': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 45, qBankAccuracy: 88 },
      'psm-psm-6': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: true, qBankSolvedCount: 80, qBankAccuracy: 92 },
      'psm-psm-8': { notesDone: true, qBankDone: true, r1Done: true, r2Done: false, r3Done: false, qBankSolvedCount: 70, qBankAccuracy: 75 },
      'psm-psm-10': { notesDone: true, qBankDone: true, r1Done: true, r2Done: false, r3Done: false, qBankSolvedCount: 40, qBankAccuracy: 85 },
      
      // OBG
      'obg-obg-1': { notesDone: true, qBankDone: true, r1Done: true, r2Done: false, r3Done: false, qBankSolvedCount: 55, qBankAccuracy: 76 },
      'obg-obg-2': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 60, qBankAccuracy: 84 },
      'obg-obg-4': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 75, qBankAccuracy: 80 },
      'obg-obg-6': { notesDone: true, qBankDone: true, r1Done: true, r2Done: false, r3Done: false, qBankSolvedCount: 50, qBankAccuracy: 82 },

      // Pharmacology
      'pharm-pharm-1': { notesDone: true, qBankDone: true, r1Done: true, r2Done: false, r3Done: false, qBankSolvedCount: 45, qBankAccuracy: 70 },
      'pharm-pharm-2': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 60, qBankAccuracy: 85 },
      'pharm-pharm-7': { notesDone: true, qBankDone: true, r1Done: true, r2Done: false, r3Done: false, qBankSolvedCount: 90, qBankAccuracy: 74 },
      'pharm-pharm-12': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 40, qBankAccuracy: 90 },

      // Pediatrics
      'ped-ped-1': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 45, qBankAccuracy: 88 },
      'ped-ped-2': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: true, qBankSolvedCount: 50, qBankAccuracy: 94 },
      'ped-ped-3': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 40, qBankAccuracy: 85 },

      // FMT
      'fmt-fmt-1': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: true, qBankSolvedCount: 50, qBankAccuracy: 90 },
      'fmt-fmt-3': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 45, qBankAccuracy: 82 },
      'fmt-fmt-8': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 50, qBankAccuracy: 86 },

      // ENT
      'ent-ent-1': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 40, qBankAccuracy: 88 },
      'ent-ent-2': { notesDone: true, qBankDone: true, r1Done: true, r2Done: false, r3Done: false, qBankSolvedCount: 45, qBankAccuracy: 80 },

      // Dermatology
      'derm-derm-1': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 40, qBankAccuracy: 85 },
      'derm-derm-2': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 35, qBankAccuracy: 88 },
      'derm-derm-4': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 50, qBankAccuracy: 90 },

      // Psychiatry
      'psych-psych-1': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 40, qBankAccuracy: 85 },
      'psych-psych-4': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 35, qBankAccuracy: 92 },

      // Anesthesia
      'anes-anes-4': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: false, qBankSolvedCount: 30, qBankAccuracy: 85 },
      'anes-anes-7': { notesDone: true, qBankDone: true, r1Done: true, r2Done: true, r3Done: true, qBankSolvedCount: 40, qBankAccuracy: 95 },
    },
    grandTests: [
      {
        id: 'gt-1',
        title: 'Marrow Grand Test 12',
        platform: 'Marrow',
        date: '2026-07-15',
        score: 139,
        totalMarks: 300,
        correctCount: 154,
        incorrectCount: 122,
        skippedCount: 24,
        percentile: 48.2,
        paper1Score: 68,
        paper2Score: 71,
        weakSubjectIds: ['psm', 'anatomy', 'obg'],
        strongSubjectIds: ['fmt', 'psychiatry', 'dermatology'],
        keyMistakesNotes: 'Silly mistakes in PSM biostatistics calculation and OBG partogram questions. Need rapid revision of High-Yield formulas.',
      },
      {
        id: 'gt-2',
        title: 'Prepladder National Mock 1',
        platform: 'Prepladder',
        date: '2026-07-28',
        score: 152,
        totalMarks: 300,
        correctCount: 168,
        incorrectCount: 110,
        skippedCount: 22,
        percentile: 62.5,
        paper1Score: 74,
        paper2Score: 78,
        weakSubjectIds: ['medicine', 'biochemistry', 'surgery'],
        strongSubjectIds: ['psm', 'pediatrics', 'ent'],
        keyMistakesNotes: 'Crossed the 150 mark! PSM improved after revising NIS and Epidemiological formulas. Need to work on Medicine ECG and Surgery burns.',
      },
      {
        id: 'gt-3',
        title: 'Cerebellum Super GT 5',
        platform: 'Cerebellum',
        date: '2026-08-12',
        score: 168,
        totalMarks: 300,
        correctCount: 182,
        incorrectCount: 98,
        skippedCount: 20,
        percentile: 74.8,
        paper1Score: 82,
        paper2Score: 86,
        weakSubjectIds: ['anatomy', 'biochemistry'],
        strongSubjectIds: ['obg', 'pharmacology', 'pediatrics', 'fmt'],
        keyMistakesNotes: 'Solid score! Clinical scenario questions in OBG and Pharma felt much clearer. Revision 2 of High Yield subjects paying off.',
      },
    ],
    errorNotebook: [
      {
        id: 'err-1',
        subjectId: 'psm',
        title: 'Odds Ratio vs Relative Risk in Cohort vs Case Control',
        topic: 'Epidemiology - Measures of Association',
        questionGist: 'Study started with diseased and healthy subjects and asked past exposure history. Asked which measure to calculate.',
        myMistake: 'Calculated Relative Risk (RR) instead of Odds Ratio (OR).',
        correctConcept: 'Case-Control study ALWAYS uses Odds Ratio (OR = ad/bc). Cohort study uses Relative Risk (RR = Incidence in exposed / Incidence in unexposed).',
        isReviewed: true,
        dateAdded: '2026-07-16',
      },
      {
        id: 'err-2',
        subjectId: 'obg',
        title: 'Pritchard Regimen MgSO4 Loading vs Maintenance dose concentration',
        topic: 'Eclampsia - Pritchard Regimen',
        questionGist: 'What is the concentration of IM MgSO4 given in Pritchard regimen?',
        myMistake: 'Marked 20% IM instead of 50% IM.',
        correctConcept: 'Loading: 20% IV (4g) + 50% IM (10g, 5g in each buttock). Maintenance: 50% IM (5g) every 4 hours.',
        isReviewed: true,
        dateAdded: '2026-07-29',
      },
      {
        id: 'err-3',
        subjectId: 'surgery',
        title: 'Parkland Formula Time Zero reference',
        topic: 'Burns Management',
        questionGist: 'Patient arrived at hospital 3 hours after burn injury. When should first half of fluid be completed?',
        myMistake: 'Calculated 8 hours starting from hospital admission time.',
        correctConcept: 'The first 8-hour window is strictly counted from the TIME OF INJURY, so only 5 hours were left to complete the first 50% fluid!',
        isReviewed: false,
        dateAdded: '2026-08-13',
      },
      {
        id: 'err-4',
        subjectId: 'pharmacology',
        title: 'Antiepileptic of Choice in Absence Seizures with generalized tonic clonic',
        topic: 'CNS - Anti-epileptics',
        questionGist: 'Child with absence seizures + occasional tonic clonic seizures. Drug of choice?',
        myMistake: 'Marked Ethosuximide.',
        correctConcept: 'Pure Absence seizure DOC = Ethosuximide. But Absence + GTCS coexistence DOC = Sodium Valproate (broad spectrum).',
        isReviewed: false,
        dateAdded: '2026-08-20',
      },
    ],
    dailyTasks: [
      {
        id: 'task-1',
        title: 'Solve 50 MCQs of OBG Preeclampsia & PPH',
        subjectId: 'obg',
        topicName: 'Hypertensive Disorders in Pregnancy',
        type: 'qbank',
        durationMinutes: 60,
        completed: true,
        priority: 'high',
      },
      {
        id: 'task-2',
        title: 'Rapid Revision of PSM National Health Programs (NTEP & NVBDCP)',
        subjectId: 'psm',
        topicName: 'National Health Programs',
        type: 'revision',
        durationMinutes: 90,
        completed: true,
        priority: 'high',
      },
      {
        id: 'task-3',
        title: 'Watch & Review Surgery ATLS & Trauma Primary Survey',
        subjectId: 'surgery',
        topicName: 'Trauma & ATLS Protocol',
        type: 'video',
        durationMinutes: 75,
        completed: false,
        priority: 'medium',
      },
      {
        id: 'task-4',
        title: 'Review 15 High Yield Pearls in Formula Vault',
        subjectId: 'pharmacology',
        topicName: 'Essential High-Yield Drugs of Choice',
        type: 'pearls',
        durationMinutes: 30,
        completed: false,
        priority: 'medium',
      },
      {
        id: 'task-5',
        title: 'Practice 10 AI Clinical Vignette questions in Medicine Cardiology',
        subjectId: 'medicine',
        topicName: 'Cardiology ECGs & STEMI',
        type: 'qbank',
        durationMinutes: 45,
        completed: false,
        priority: 'high',
      },
    ],
    studyLogs: {
      [yesterdayStr]: {
        date: yesterdayStr,
        studyMinutes: 480,
        questionsSolved: 110,
        completedTaskIds: ['task-prev-1', 'task-prev-2', 'task-prev-3'],
        mood: 'fire',
        notes: 'Great flow state! Finished PSM screening formulas and 100 QBank questions.',
      },
      [todayStr]: {
        date: todayStr,
        studyMinutes: 210,
        questionsSolved: 50,
        completedTaskIds: ['task-1', 'task-2'],
        mood: 'great',
        notes: 'Morning session completed efficiently. Ready for afternoon surgery revision.',
      },
    },
    customPearls: [],
    bookmarkedPearlIds: ['pearl-1', 'pearl-2', 'pearl-3', 'pearl-5', 'pearl-7'],
    telegramQuestions: INITIAL_TELEGRAM_MCQS,
    telegramChannels: DEFAULT_TELEGRAM_CHANNELS,
    telegramAnnouncements: DEFAULT_TELEGRAM_ANNOUNCEMENTS,
  };
};
