import { AppState } from '../types';
import { DEFAULT_TELEGRAM_CHANNELS, INITIAL_TELEGRAM_MCQS, DEFAULT_TELEGRAM_ANNOUNCEMENTS } from './telegramPresetData';
import { getLocalDateKey } from '../utils/date';

/** Content defaults only; authenticated progress is restored from userData/{uid}. */
export const getInitialAppState = (): AppState => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 75);

  return {
    settings: {
      userName: 'Dr. Aspirant',
      examDate: getLocalDateKey(targetDate),
      targetScore: 185,
      coachingSource: 'Marrow & Rapid Revision',
      dailyStudyHourGoal: 8,
      dailyQBankGoal: 80,
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
    telegramQuestions: INITIAL_TELEGRAM_MCQS,
    telegramChannels: DEFAULT_TELEGRAM_CHANNELS,
    telegramAnnouncements: DEFAULT_TELEGRAM_ANNOUNCEMENTS,
  };
};
