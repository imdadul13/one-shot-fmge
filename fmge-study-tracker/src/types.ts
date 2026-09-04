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

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  examDate: string; // YYYY-MM-DD
  targetScore: number;
  dailyHoursTarget: number;
  createdAt: string;
  lastActiveAt: string;
  onboardingCompleted: boolean;
  preferences?: {
    coachingSource?: string;
    primaryPlatform?: string;
    theme?: 'calm-teal' | 'slate' | 'editorial';
    notificationsEnabled?: boolean;
  };
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

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
  /** Persistent completion state for generated Mission Control items. */
  completedMissionIds?: Record<string, boolean>;
  telegramQuestions?: TelegramMCQ[];
  telegramChannels?: TelegramChannelConfig[];
  telegramAnnouncements?: TelegramAnnouncement[];
}

// =================== FMGE PREDICTION ENGINE TYPES ===================

export type PredictionLevel = 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'MAINTAIN';

export type PredictionMode = 'combined' | 'exam' | 'personal';

export interface PredictionWeights {
  priorityScore: number; // e.g. 0.20
  subjectWeight: number; // e.g. 0.15
  highYieldSignal: number; // e.g. 0.15
  clinicalVignettePotential: number; // e.g. 0.10
  imageBasedPotential: number; // e.g. 0.05
  docPotential: number; // e.g. 0.10
  userErrorSignal: number; // e.g. 0.10
  revisionGap: number; // e.g. 0.10
  telegramRecurrence: number; // e.g. 0.05
}

export interface PredictionSignalBreakdown {
  priorityScore: { raw: number; weight: number; weighted: number; label: string };
  subjectWeight: { raw: number; weight: number; weighted: number; label: string };
  highYieldSignal: { raw: number; weight: number; weighted: number; label: string };
  clinicalVignettePotential: { raw: number; weight: number; weighted: number; label: string };
  imageBasedPotential: { raw: number; weight: number; weighted: number; label: string };
  docPotential: { raw: number; weight: number; weighted: number; label: string };
  userErrorSignal: { raw: number; weight: number; weighted: number; label: string };
  revisionGap: { raw: number; weight: number; weighted: number; label: string };
  telegramRecurrence: { raw: number; weight: number; weighted: number; label: string };
}

export interface TopicPrepStatus {
  notesDone: boolean;
  qBankDone: boolean;
  r1Done: boolean;
  r2Done: boolean;
  r3Done: boolean;
  r1Date?: string;
  r2Date?: string;
  r3Date?: string;
  lastRevisionText: string;
  completionRate: number; // 0 to 100
}

export interface PredictedTopicItem {
  rank: number;
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  subjectWeightage: number;
  phase: SubjectPhase;
  isHighYield: boolean;
  score: number; // 0 to 100
  level: PredictionLevel;
  levelLabel: string;
  personalRiskScore: number; // 0 to 100
  confidence: 'High' | 'Moderate' | 'Tentative';
  whyReasons: string[];
  recommendedAction: string;
  prepStatus: TopicPrepStatus;
  signals: PredictionSignalBreakdown;
  gtErrorCount: number;
  notebookErrorCount: number;
  highYieldPearl?: string;
}

export interface SubjectRiskSummary {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  weightage: number;
  averagePredictionScore: number;
  topRiskTopicCount: number;
  unrevisedTopicCount: number;
  userErrorCount: number;
}

// =================== FMGE EXAM MISSION CONTROL TYPES ===================

export type PreparationPhase =
  | 'PHASE_1_COVERAGE'
  | 'PHASE_2_CONSOLIDATION'
  | 'PHASE_3_EXAM_CONDITIONING'
  | 'FINAL_30_DAYS'
  | 'FINAL_14_DAYS'
  | 'FINAL_7_DAYS'
  | 'FINAL_3_DAYS'
  | 'FINAL_1_DAY';

export type TrajectoryStatus = 'AHEAD' | 'ON TRACK' | 'AT RISK' | 'BEHIND';

export interface MarksAtRiskItem {
  rank: number;
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  weightage: number;
  currentStatus: string;
  whyDangerous: string;
  recommendedAction: string;
  timeRequired: string;
  allocatedMinutes?: number;
  riskScore: number;
  isHighYield: boolean;
  errorCount: number;
  gtMistakes: number;
  revisionOverdueDays?: number;
  predictionScore: number;
}

export type DailyMissionItemType =
  | 'most_important'
  | 'second_priority'
  | 'third_priority'
  | 'mcq_target'
  | 'revision_due'
  | 'error_notebook'
  | 'gt_prep';

export interface DailyMissionItem {
  id: string;
  type: DailyMissionItemType;
  badgeLabel: string;
  title: string;
  subtitle?: string;
  subjectId?: string;
  subjectName?: string;
  subjectCode?: string;
  subjectColor?: string;
  topicName?: string;
  allocatedMinutes: number;
  whyReasons: string[];
  actionLabel: string;
  isCompleted?: boolean;
  targetCount?: number;
  unitLabel?: string;
  relatedErrorCount?: number;
  relatedPredictionScore?: number;
}

export interface DailyMissionPlan {
  availableHours: number;
  totalAllocatedMinutes: number;
  isMinimumViableDay: boolean;
  isRecoveryPlan?: boolean;
  missedDaysCount?: number;
  phase: PreparationPhase;
  phaseTitle: string;
  phaseDescription: string;
  items: DailyMissionItem[];
  highYieldFocusSubjectIds: string[];
}

export interface BackwardPlanAnalysis {
  remainingDays: number;
  totalSyllabusTopics: number;
  completedSyllabusTopics: number;
  remainingSyllabusTopics: number;
  syllabusPercentage: number;
  expectedSyllabusPercentage: number;
  totalRevisionsNeeded: number;
  completedRevisions: number;
  remainingRevisions: number;
  revisionPercentage: number;
  expectedRevisionPercentage: number;
  currentGtAverage: number;
  targetGtScore: number;
  gtScoreTrajectoryExpected: number;
  scoreGap: number;
  trajectoryStatus: TrajectoryStatus;
  trajectoryReason: string;
  trajectoryDetails: {
    syllabusStatus: string;
    revisionStatus: string;
    gtStatus: string;
  };
  requiredMcqsTotal: number;
  requiredMcqsPerDay: number;
  requiredGtsRemaining: number;
  nextGtRecommendedDate: string;
  targetTopicsByToday: number;
  finalRevisionWindowDays: number;
  phase: PreparationPhase;
  phaseBadge: string;
  phaseColor: string;
  phaseRule: string;
}

export interface RecoverableMarkOpportunity {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  weightage: number;
  potentialGain: number;
  rationale: string;
  highYieldAction: string;
}

export interface ReadinessTrendPoint {
  label: string;
  date: string;
  readinessScore: number;
  gtScore: number;
  mcqAccuracy: number;
  syllabusCoverage: number;
  revisionCoverage: number;
  isProjected?: boolean;
}

export interface ReadinessComponentDetail {
  id: string;
  name: string;
  weight: number; // configured base weight percentage
  effectiveWeight: number; // dynamically normalized weight percentage
  score: number; // 0-100 score in this component
  status: 'good' | 'moderate' | 'needs_work' | 'neutral' | 'no_data';
  label: string; // e.g. "84% accuracy"
  details: string; // e.g. "27 topics with QBank data"
}

export interface ReadinessExplanation {
  topicMastery: string;
  highYieldMastery: string;
  mcqAccuracy: string;
  gtPerformance: string;
  recentTrend: string;
  revisionCompletion: string;
  errorBurden: string;
  studyConsistency: string;
}

export interface ReadinessBreakdown {
  hasEnoughData: boolean;
  score: number | null; // null if !hasEnoughData
  components: ReadinessComponentDetail[];
  summaryText: string;
  trendText: string;
  whyExplanation: ReadinessExplanation;
}

export interface WeeklyCommandReport {
  weekNumber: number;
  readinessScore: number | null;
  readinessDelta: number;
  gtTrendText: string;
  averageGtScore: number;
  mcqAccuracy: number;
  syllabusCoverage: number;
  revisionCoverage: number;
  topWeaknesses: { subjectName: string; subjectCode: string; scorePct: number; reason: string }[];
  topRepeatedErrors: { topic: string; subject: string; count: number; gist: string }[];
  topMarksAtRisk: MarksAtRiskItem[];
  nextWeekPriorities: string[];
  isImprovingFastEnough: boolean;
  improvementVelocityText: string;
}

