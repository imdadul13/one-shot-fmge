export type SubjectPhase = 'pre-clinical' | 'para-clinical' | 'clinical';

export type ConfidenceLevel = 'not-started' | 'low' | 'moderate' | 'strong' | 'mastered';

export interface TopicItem {
  id: string;
  name: string;
  isHighYield: boolean;
  notesDone: boolean;
  qBankDone: boolean;
  qBankSolvedCount?: number;
  qBankAccuracy?: number; // percentage
  r1Done: boolean;
  r1Date?: string;
  r2Done: boolean;
  r2Date?: string;
  r3Done: boolean;
  r3Date?: string;
  personalNotes?: string;
  isBookmarked?: boolean;
}

export interface FMGESubject {
  id: string;
  name: string;
  code: string;
  phase: SubjectPhase;
  weightage: number; // Approximate marks in 300-mark FMGE exam
  color: string;
  iconName: string;
  description: string;
  highYieldTips: string;
  topics: TopicItem[];
}

export interface SubjectUserProgress {
  subjectId: string;
  confidence: ConfidenceLevel;
  customTopics?: TopicItem[];
  personalNotes?: string;
  notes?: string;
  qBankSolvedCount?: number;
  qBankAccuracy?: number;
  targetRevisionDate?: string;
}

export type SubjectProgress = SubjectUserProgress;

export interface GrandTest {
  id: string;
  title: string; // e.g. "Marrow GT 18", "Prepladder All India CBT 2"
  platform: 'Marrow' | 'Prepladder' | 'Cerebellum' | 'DAMS' | 'Bhatia' | 'NBE Mock' | 'Other';
  date: string;
  score: number; // out of 300
  totalMarks: number; // usually 300
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  percentile?: number;
  paper1Score?: number; // Pre/Para clinical (out of 150)
  paper2Score?: number; // Clinical (out of 150)
  weakSubjectIds: string[];
  strongSubjectIds: string[];
  keyMistakesNotes: string;
}

export interface ErrorNotebookItem {
  id: string;
  title?: string;
  subjectId: string;
  topic: string;
  questionGist: string;
  myMistake: string;
  correctConcept: string;
  isReviewed: boolean;
  dateAdded: string;
}

export interface DailyTask {
  id: string;
  title: string;
  subjectId?: string;
  topicName?: string;
  type: 'video' | 'qbank' | 'revision' | 'gt_review' | 'pearls' | 'other';
  durationMinutes: number;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface DailyStudyLog {
  date: string; // YYYY-MM-DD
  studyMinutes: number;
  questionsSolved: number;
  completedTaskIds: string[];
  mood: 'fire' | 'great' | 'okay' | 'tired' | 'stressed';
  notes?: string;
}

export interface MedicalPearl {
  id: string;
  subjectId: string;
  title: string;
  highYieldKey: string;
  explanation: string;
  tags: string[];
  content?: string;
  tag?: string;
  isHighYield?: boolean;
  isBookmarked?: boolean;
}

export interface AiVerificationResult {
  isVerified: boolean;
  verdict: 'verified_correct' | 'disputed_trap' | 'ambiguous';
  verdictSummary: string;
  counterTestAnalysis: string;
  distractorBreakdown: { key: string; isCorrect: boolean; explanation: string }[];
  trapWarning?: string;
  highYieldMemoryHook: string;
  groundedSources: { title: string; uri: string }[];
  lastChecked?: string;
}

export interface TelegramMCQ {
  id: string;
  sourceChannel: string; // e.g. "@fmge_highyield_daily", "Marrow FMGE Quiz", "Personal Forwarded Bot"
  channelTitle?: string;
  rawText?: string;
  subjectId: string; // e.g. "psm", "medicine", "obg", etc.
  topic: string; // e.g. "Parkland Formula & Burn Resuscitation"
  question: string;
  options: { key: string; text: string; percentage?: number }[]; // A, B, C, D
  correctKey: string; // "A" | "B" | "C" | "D"
  explanation: string;
  highYieldPearl?: string;
  difficulty?: 'standard' | 'high-yield' | 'trap';
  tags: string[];
  questionType?: 'mcq' | 'ibq' | 'video' | 'pearl' | 'poll';
  imageUrl?: string;
  imageCaption?: string;
  videoUrl?: string;
  videoThumbUrl?: string;
  viewsCount?: string;
  postUrl?: string;
  messageId?: string;
  datePulled: string;
  userStatus?: 'unsolved' | 'correct' | 'incorrect' | 'bookmarked';
  userSelectedOption?: string;
  isAutoSaved?: boolean;
  aiVerification?: AiVerificationResult;
}

export interface TelegramAnnouncement {
  id: string;
  sourceChannel: string;
  channelTitle?: string;
  type: 'announcement' | 'exam_alert' | 'high_yield_tip' | 'schedule' | 'faculty_note';
  title: string;
  content: string;
  date: string;
  pinned?: boolean;
  tags?: string[];
  imageUrl?: string;
  postUrl?: string;
  viewsCount?: string;
  isBookmarked?: boolean;
}

export interface TelegramChannelConfig {
  id: string;
  name: string;
  handle: string; // e.g. "targetfmgegroup", "targetfmgechannel", "mission_fmge8"
  description: string;
  category: string;
  isActive: boolean;
  lastSynced?: string;
  itemCount?: number;
  isCustom?: boolean;
  subscribersCount?: string;
  avatarUrl?: string;
  status?: 'verified' | 'active' | 'error' | 'syncing';
  autoSync?: boolean;
  channelType?: 'public' | 'bot' | 'private_forward';
}

export interface UserSettings {
  userName: string;
  examDate: string; // YYYY-MM-DD
  targetScore: number; // 150 minimum, 180-220 recommended
  coachingSource?: string;
  primaryPlatform?: string;
  dailyStudyHourGoal: number;
  dailyQuestionGoal?: number;
  dailyQBankGoal?: number;
  telegramBotToken?: string;
  autoSaveHighYield?: boolean;
}

export type AppSettings = UserSettings;

export interface AppState {
  settings: UserSettings;
  subjectProgress: Record<string, SubjectUserProgress>;
  topicsState: Record<string, Partial<TopicItem>>; // key: `${subjectId}-${topicId}`
  grandTests: GrandTest[];
  errorNotebook: ErrorNotebookItem[];
  dailyTasks: DailyTask[];
  studyLogs: Record<string, DailyStudyLog>; // key: date YYYY-MM-DD
  customPearls: MedicalPearl[];
  bookmarkedPearlIds: string[];
  telegramQuestions?: TelegramMCQ[];
  telegramChannels?: TelegramChannelConfig[];
  telegramAnnouncements?: TelegramAnnouncement[];
}
