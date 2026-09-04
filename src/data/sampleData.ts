import { AppState } from '../types';
import { getLocalDateKey } from '../utils/date';

/** Content defaults only; authenticated progress is restored from userData/{uid}. */
export const getInitialAppState = (): AppState => {
  return {
    settings: {
      userName: 'Dr. Aspirant',
      examDate: '2026-06-28', // Standard FMGE June Session target
      targetScore: 200,
      coachingSource: 'Marrow / Prepladder',
      dailyStudyHourGoal: 6,
      dailyQBankGoal: 50,
      autoSaveHighYield: true,
    },
    subjectProgress: {},
    topicsState: {},
    grandTests: [],
    errorNotebook: [],
    dailyTasks: [],
    studyLogs: {},
    customPearls: [],
    bookmarkedPearlIds: [],
    completedMissionIds: {},
    telegramQuestions: [],
    telegramChannels: [],
    telegramAnnouncements: [],
    rawTelegramMessages: [],
    canonicalQuestions: [],
    questionSources: [],
    telegramDiagnostics: {},
    mcqAttempts: [],
    videoInteractions: [],
  };
};
