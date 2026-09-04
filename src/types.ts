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

export type MedicalImageCategory =
  | 'ecg'
  | 'radiology'
  | 'xray'
  | 'ct'
  | 'mri'
  | 'ultrasound'
  | 'histopathology'
  | 'gross_pathology'
  | 'dermatology'
  | 'ophthalmology'
  | 'fundoscopy'
  | 'anatomy'
  | 'physiology'
  | 'microbiology'
  | 'hematology'
  | 'clinical'
  | 'instruments'
  | 'surgery';

export interface MedicalImageAsset {
  assetId: string;
  imageUrl: string;
  cleanImageUrl?: string;
  annotatedImageUrl?: string;
  isCleanForExam?: boolean;
  thumbnailUrl?: string;
  sourceUrl?: string;
  sourceName?: string;
  license?: string;
  attribution?: string;
  searchQuery?: string;
  imageCategory: MedicalImageCategory;
  medicalFinding: string;
  whatToLookFor?: string;
  validationConfidence?: number;
  width?: number;
  height?: number;
}

export interface ErrorNotebookItem {
  id: string;
  title?: string;
  subjectId: string;
  topic: string;
  topicId?: string;
  subtopicId?: string;
  conceptId?: string;
  conceptName?: string;
  questionGist: string;
  myMistake: string;
  correctConcept: string;
  isReviewed: boolean;
  dateAdded: string;
  remediatedAt?: string;
  remediationScore?: number;
  imageUrl?: string;
  imageCategory?: MedicalImageCategory;
  imageAsset?: MedicalImageAsset;
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

// =================== TELEGRAM INGESTION V2 DATA PIPELINE TYPES ===================

export type TelegramProcessingStatus =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'QUESTION_CREATED'
  | 'DUPLICATE'
  | 'MEDIA_ONLY'
  | 'NEEDS_REVIEW'
  | 'RAW_MESSAGE_SAVED'
  | 'AI_PROCESSING_FAILED'
  | 'FAILED';

export type TelegramMediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'POLL' | 'NONE';

export interface TelegramMediaRecord {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  storageKey?: string;
  mimeType?: string;
  url: string;
  thumbnailUrl?: string;
  telegramFileId?: string;
  telegramFileUniqueId?: string;
  width?: number;
  height?: number;
  duration?: number;
  sourceMessageId?: string;
  processingStatus?: TelegramProcessingStatus;
}

export interface QuestionSource {
  questionId: string;
  telegramMessageId: string | number;
  telegramChatId?: string | number;
  channelId: string;
  channelTitle?: string;
  sourceUrl?: string;
  sourceDate: string;
  isPrimary?: boolean;
}

export interface RawTelegramMessage {
  id: string;
  channelId: string;
  telegramMessageId: string | number;
  telegramChatId: string | number;
  messageDate: string;
  text: string;
  caption?: string;
  mediaType: TelegramMediaType;
  media?: TelegramMediaRecord[];
  sourceUrl: string;
  replyToMessageId?: string | number;
  rawPayload?: any;
  ingestedAt: string;
  processedAt?: string;
  processingStatus: TelegramProcessingStatus;
  processingError?: string;
  /** Unique composite key: `${telegramChatId}:${telegramMessageId}` */
  compositeKey: string;
}

export type CanonicalQuestionType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'CLINICAL_CASE' | 'POLL' | 'OTHER';

export interface CanonicalQuestion {
  id: string;
  stem: string;
  options: { key: string; text: string; percentage?: number }[];
  correctAnswer: string | null; // null if poll / unknown
  explanation: string;
  subject: string; // valid 19 FMGE subject id e.g. "medicine"
  topic: string;
  subtopic?: string;
  questionType: CanonicalQuestionType;
  difficulty: 'standard' | 'high-yield' | 'trap';
  highYield: boolean;
  media: TelegramMediaRecord[];
  sources: QuestionSource[];
  needsVerification?: boolean;
  normalizedQuestionHash: string;
  tags: string[];
  highYieldPearl?: string;
  createdAt: string;
  updatedAt: string;
  possibleDuplicate?: boolean;
  duplicateOfQuestionId?: string;
  userStatus?: 'unsolved' | 'correct' | 'incorrect' | 'bookmarked';
  userSelectedOption?: string;
}

export interface TelegramSyncDiagnostics {
  channelId: string;
  channelHandle: string;
  channelTitle: string;
  lastSuccessfulSync?: string;
  lastAttemptedSync?: string;
  lastSyncedCursor?: string | number;
  messagesReceivedCount: number;
  messagesProcessedCount: number;
  questionsCreatedCount: number;
  duplicatesDetectedCount: number;
  mediaProcessedCount: number;
  failedCount: number;
  lastError?: string;
  status: 'idle' | 'syncing' | 'live' | 'paused' | 'error';
}

export interface AiCrossCheckResult {
  status: 'verified' | 'needs_review' | 'inconsistent';
  notes: string;
  confidence: number;
  verifiedAt: string;
  medicalConsistency: boolean;
}

export interface MediaAsset {
  id: string;
  telegramMessageId: string | number;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  originalFilename?: string;
  mimeType?: string;
  storageUrl: string;
  telegramFileIdentifier?: string;
  filePath?: string;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: string;
}

export interface ExamTip {
  id: string;
  sourceMessageId: string | number;
  originalText: string;
  cleanedText: string;
  subject: string;
  topic: string;
  sourceChannel: string;
  timestamp: string;
  isHighYield?: boolean;
  tags?: string[];
  createdAt: string;
}

export interface Notice {
  id: string;
  sourceMessageId: string | number;
  originalText: string;
  cleanedText: string;
  noticeDate: string;
  importance: 'general' | 'important' | 'critical';
  sourceChannel: string;
  timestamp: string;
  postUrl?: string;
  tags?: string[];
  createdAt: string;
}

export interface ProcessingJob {
  id: string;
  telegramMessageId: string | number;
  status: 'RECEIVED' | 'STORED' | 'MEDIA_DOWNLOADED' | 'CLASSIFIED' | 'AI_PROCESSED' | 'DEDUPLICATED' | 'SAVED' | 'READY' | 'FAILED';
  attempts: number;
  error?: string;
  processedAt?: string;
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
  whyOtherOptionsAreWrong?: { key: string; reason: string }[];
  highYieldPearl?: string;
  mnemonic?: string;
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
  aiCrossCheckStatus?: 'verified' | 'needs_review' | 'inconsistent';
  aiCrossCheckNotes?: string;
  sources?: QuestionSource[];
  seenInChannelsCount?: number;
  normalizedHash?: string;
}

export interface TelegramKnowledgeBank {
  questions: TelegramMCQ[];
  canonicalQuestions: CanonicalQuestion[];
  rawMessages: RawTelegramMessage[];
  mediaAssets: MediaAsset[];
  examTips: ExamTip[];
  notices: Notice[];
  channels: TelegramChannelConfig[];
  processingJobs: ProcessingJob[];
  lastSyncTimestamp?: string;
  syncStatus: 'idle' | 'syncing' | 'live' | 'error';
  lastError?: string;
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
  status?: 'verified' | 'active' | 'error' | 'syncing' | 'live' | 'paused';
  autoSync?: boolean;
  channelType?: 'public' | 'bot' | 'private_forward';
  telegramChatId?: string | number;
  lastSyncedMessageId?: string | number;
  lastSyncedAt?: string;
  lastError?: string;
  videoCount?: number;
  imageCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type OnboardingPreparationStage =
  | 'just_starting'
  | 'building_foundation'
  | 'most_subjects_completed'
  | 'in_revision'
  | 'mostly_mcqs_gt'
  | 'final_revision';

export type StudyPreferenceKey =
  | 'high_yield_notes'
  | 'clinical_cases'
  | 'flashcards'
  | 'mcqs'
  | 'grand_tests'
  | 'videos_lectures'
  | 'rapid_revision';

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
  /** Version of the onboarding flow the user completed. Allows future migrations. */
  onboardingVersion?: number;
  /** Self-declared preparation stage; drives personalization signals. */
  preparationStage?: OnboardingPreparationStage;
  /** How the user prefers to learn; used as an additional personalization signal. */
  studyPreferences?: StudyPreferenceKey[];
  /** Optional recent Grand Test score (0-300). Absent when the user has no baseline. */
  baselineScore?: number;
  /** Optional number of questions answered in the baseline GT session. */
  baselineQuestions?: number;
  /** When onboarding was completed (ISO string). */
  onboardingCompletedAt?: string;
  /** Last time the profile was edited (ISO string). */
  profileUpdatedAt?: string;
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
  // App UI & Study Engine Preferences
  bgTheme?: 'auto' | 'morning' | 'sunset' | 'night';
  bgOpacity?: number; // e.g. 0.8, 0.4, 0.0
  mcqTimerSeconds?: number; // 60, 120, 0
  explanationMode?: 'instant' | 'summary';
  breakReminderInterval?: number; // 30, 45, 60, 0
  hapticSoundEnabled?: boolean;
}

export type AppSettings = UserSettings;

// =================== MCQ ATTEMPT & PERFORMANCE ENGINE TYPES ===================

export type McqAttemptSource =
  | 'qbank'
  | 'grand_test'
  | 'error_vault'
  | 'ai_coach'
  | 'telegram'
  | 'recommended_video_practice'
  | 'custom'
  | 'other';

export interface NormalizedTopicIntelligence {
  subjectId: string;
  subjectName: string;
  topicId: string;
  canonicalName: string;
  topicType: TopicCategoryType;
  conceptClusters: string[];
  synonyms: string[];
  relatedTerms: string[];
  highYieldKeywords: string[];
  negativeKeywords: string[];
}

export interface PracticeOption {
  optionId: string; // e.g. "opt_1"
  key: string; // "A" | "B" | "C" | "D" (assigned after shuffle)
  text: string;
  isCorrect?: boolean;
}

export interface VisualIntent {
  requiresImage: boolean;
  imageType?:
    | 'ECG'
    | 'Radiology'
    | 'Histopathology'
    | 'Dermatology'
    | 'Ophthalmology'
    | 'Anatomy diagram'
    | 'Physiology graph'
    | 'Biochemistry pathway'
    | 'Microbiology microscopy'
    | 'Pharmacology graph'
    | 'Instruments'
    | 'Clinical photograph';
  visualTarget?: string;
  keyVisualFinding?: string;
  anatomy?: string;
  questionPurpose?: string;
  searchTerms?: string[];
}

export interface PracticeSessionQuestion {
  id: string;
  sessionId: string;
  sequenceNumber: number; // 1 to 10
  scenario: string;
  question: string;
  options: PracticeOption[];
  correctOptionId: string; // stable identifier of the correct option
  correctAnswer: string; // 'A' | 'B' | 'C' | 'D' (dynamically resolved after shuffle)
  explanation: string;
  highYieldPearl?: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  subtopic?: string;
  difficulty?: 'standard' | 'high-yield';
  isAiGenerated: boolean;
  imageUrl?: string;
  cleanImageUrl?: string;
  annotatedImageUrl?: string;
  videoUrl?: string;
  mediaType?: 'ibq' | 'video' | 'ecg' | 'xray' | 'ct' | 'histology' | 'anatomy' | 'physiology' | 'microbiology' | 'fundoscopy' | 'dermatology' | 'surgery';
  imageAsset?: MedicalImageAsset;
  whatToLookFor?: string;
  visualIntent?: VisualIntent;
}

export interface PracticeSessionContext {
  sessionId: string;
  source: 'recommended_video' | 'dashboard_weak_topic' | 'ai_coach' | 'daily_mission';
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  subtopic?: string;
  targetQuestionCount: number; // 10
}

export interface PracticeSessionSummary {
  sessionId: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  totalTimeSeconds: number;
  averageTimeSeconds: number;
  questions: PracticeSessionQuestion[];
  userAnswers: Record<string, { selectedAnswer: string; selectedOptionId?: string; isCorrect: boolean; timeTakenSeconds: number }>;
  weakConceptsDetected: string[];
}

export interface FlashcardItem {
  id: string;
  topicId: string;
  subjectId: string;
  front: string;
  back: string;
  clinicalPearl?: string;
  category: string;
  difficulty: 'high-yield' | 'core' | 'trap';
  mastered?: boolean;
  reviewCount?: number;
  lastReviewed?: string;
  isBookmarked?: boolean;
}

export interface FlashcardDeck {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  cards: FlashcardItem[];
  masteredCount: number;
  totalCards: number;
}

export interface VisualSlideItem {
  id: string;
  slideNumber: number;
  title: string;
  subtitle?: string;
  category: 'overview' | 'anatomy_patho' | 'diagnostics' | 'pharmacology_mgmt' | 'exam_traps' | 'summary_table';
  bullets: string[];
  keyTakeaways?: string[];
  examTrapWarning?: string;
  quickTable?: {
    headers: string[];
    rows: string[][];
  };
}

export type TopicCategoryType =
  | 'biochemical_concept'      // e.g. Enzyme Kinetics, Lineweaver-Burk, Glycolysis, DNA Repair, Vitamins
  | 'anatomical_structure'     // e.g. Brachial Plexus, Knee Joint, Inguinal Canal, Cavernous Sinus, Popliteal Fossa
  | 'physiological_mechanism'  // e.g. Action Potential, Renal Countercurrent, Oxy-Hb Curve, Cardiac Cycle
  | 'pharmacological_class'    // e.g. Beta Blockers, Autonomic Drugs, Anti-arrhythmics, Cephalosporins
  | 'pathological_entity'      // e.g. Hodgkin Lymphoma, Glomerulonephritis, Amyloidosis, Cell Injury
  | 'microbiological_organism' // e.g. Mycobacterium, Plasmodium, Rabies, Staph, Streptococci, Viroid
  | 'clinical_disease'         // e.g. Asthma, COPD, Acute Coronary Syndrome, Heart Failure, Preeclampsia
  | 'diagnostic_investigation' // e.g. ECG interpretation, Chest X-Ray, Spirometry, ABG
  | 'public_health_program';   // e.g. National Immunization Schedule, Cold Chain, Biostatistics, Screening

export interface TopicLearningContext {
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  topicType: TopicCategoryType;
  subtopicId?: string;
  subtopicName?: string;
  fmgePriority: 'URGENT CORE' | 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'MAINTAIN';
  estimatedMarks: number;
  isHighYield: boolean;
  conceptClusters: string[];
  synonyms: string[];
  clinicalConcepts: string[];
  commonExamTraps: string[];
  highYieldKeywords: string[];
  negativeKeywords: string[];
}

export interface ClinicalCaseItem {
  id: string;
  caseNumber: number;
  title: string;
  patientDemographics: string; // e.g. "58-year-old male with hypertension"
  presentation: string; // Chief complaint and history
  physicalExamOrLabs: string; // Key clinical / radiological / laboratory findings
  diagnosticQuestion: string; // Core question
  options: PracticeOption[];
  correctOptionId: string;
  correctAnswer: string; // "A" | "B" | "C" | "D"
  clinicalExplanation: string; // Deep pathophysiological / anatomical breakdown
  examPearl: string;
  focusArea: string; // e.g. "Coronary Territory Localization", "Mediastinal Mass Differential"
}

export interface TopicClinicalCasesDeck {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  cases: ClinicalCaseItem[];
}

export interface TopicHighYieldPearl {
  id: string;
  topicId: string;
  subjectId: string;
  statement: string;
  category: string;
  examTrapWarning?: string;
  discriminatorTip?: string;
}

export interface SlideDeck {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  slides: VisualSlideItem[];
}

export interface TopicMasteryLearningPackage {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  videoCompleted: boolean;
  activeVideoId?: string;
  flashcardsMastered: number;
  flashcardsTotal: number;
  slidesCompleted: boolean;
  clinicalCasesCompletedCount?: number;
  clinicalCasesTotal?: number;
  mcqsCompletedCount: number;
  mcqsCorrectCount: number;
  mcqAccuracy: number;
  masteryScorePct: number;
  nextRevisionDate?: string;
  lastStudiedDate?: string;
}

export type McqDifficulty = 'easy' | 'medium' | 'hard' | 'high-yield' | 'standard' | 'trap';

export type McqConfidence = 'guess' | 'low' | 'medium' | 'high' | 'certain';

export type TopicMasteryStatus =
  | 'unattempted'
  | 'struggling'
  | 'developing'
  | 'proficient'
  | 'mastered';

export interface McqAttempt {
  id: string;
  questionId: string;
  subjectId: string;
  topicId: string;
  topicName?: string;
  subtopicId?: string;
  subtopic?: string;
  isCorrect: boolean;
  selectedAnswer: string;
  selectedOptionId?: string;
  correctAnswer?: string;
  correctOptionId?: string;
  timeTakenSeconds: number;
  difficulty?: McqDifficulty;
  confidence?: McqConfidence;
  attemptNumber: number;
  timestamp: string; // ISO date string e.g. 2026-08-31T13:15:00.000Z
  source: McqAttemptSource;
  sessionId?: string;
  practiceSessionId?: string;
  isImageBased?: boolean;
  imageCategory?: MedicalImageCategory;
  imageUrl?: string;
  imageAssetId?: string;
  tags?: string[];
  notes?: string;
}

export interface TopicPerformanceMetrics {
  subjectId: string;
  topicId: string;
  topicName: string;
  isHighYield: boolean;
  totalAttempts: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number; // 0 - 100 percentage
  recentAccuracy: number; // 0 - 100 percentage (e.g. over last 5 attempts)
  avgResponseTimeSeconds: number;
  repeatedErrorsCount: number;
  lastAttemptedDate: string | null;
  masteryStatus: TopicMasteryStatus;
  attemptsBySource: Record<McqAttemptSource, number>;
  sourceAccuracies: Partial<Record<McqAttemptSource, number>>;
}

export interface SubjectPerformanceMetrics {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  phase: SubjectPhase;
  weightage: number;
  color: string;
  totalAttempts: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number; // 0 - 100
  recentAccuracy: number; // 0 - 100
  avgResponseTimeSeconds: number;
  repeatedErrorsCount: number;
  lastAttemptedDate: string | null;
  masteryStatus: TopicMasteryStatus;
  topicsMasteredCount: number;
  topicsProficientCount: number;
  topicsDevelopingCount: number;
  topicsStrugglingCount: number;
  topicsUnattemptedCount: number;
  totalTopicsCount: number;
  topicMetrics: Record<string, TopicPerformanceMetrics>;
  sourceBreakdown: Record<McqAttemptSource, { attempts: number; correct: number; accuracy: number }>;
}

export interface OverallPerformanceSummary {
  totalAttempts: number;
  totalCorrect: number;
  totalIncorrect: number;
  overallAccuracy: number;
  recentAccuracy: number;
  avgResponseTimeSeconds: number;
  totalRepeatedErrors: number;
  totalMasteredTopics: number;
  totalProficientTopics: number;
  totalDevelopingTopics: number;
  totalStrugglingTopics: number;
  totalUnattemptedTopics: number;
  totalTopics: number;
  lastActiveTimestamp: string | null;
  subjectMetrics: Record<string, SubjectPerformanceMetrics>;
  recentAttempts: McqAttempt[];
}

// =================== VIDEO RECOMMENDATION ENGINE TYPES ===================

export interface EducationalVideo {
  id: string; // YouTube video ID or curated ID
  title: string;
  channelName: string;
  channelAvatarUrl?: string;
  duration: string; // e.g. "18:45"
  durationSeconds?: number;
  thumbnailUrl: string;
  youtubeUrl: string;
  embedUrl?: string;
  subjectId: string;
  topicId: string;
  topicName: string;
  subtopic?: string;
  highYieldScore?: number;
  recommendationReason?: string;
  relevanceScore?: number;
  tags?: string[];
  isCurated?: boolean;
  publishedAt?: string;
  viewCount?: string;
}

export type VideoRating = 'helpful' | 'not_helpful' | 'neutral';

export interface VideoInteraction {
  videoId: string;
  subjectId: string;
  topicId: string;
  topicName?: string;
  openedAt: string; // ISO string
  openedCount: number;
  completed?: boolean;
  userRating?: VideoRating;
  feedbackTimestamp?: string;
  notes?: string;
}

export interface CandidateTopicRecommendation {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  topicId: string;
  topicName: string;
  isHighYield: boolean;
  weightage: number;
  accuracy: number;
  recentAccuracy: number;
  totalAttempts: number;
  repeatedErrorsCount: number;
  isRevisionDue: boolean;
  recommendationScore: number; // 0 - 100
  priorityScore?: number; // 0 - 100 from Adaptive Priority Engine
  masteryScore?: number; // 0 - 100% from Adaptive Priority Engine
  priorityLabel: 'URGENT CORE' | 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'MAINTAIN';
  reasons: string[];
  primaryReason: string;
  searchQueries: string[];
  adaptivePriority?: TopicAdaptivePriority;
}

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
  /** Telegram Ingestion V2 Data Pipeline Stores */
  rawTelegramMessages?: RawTelegramMessage[];
  canonicalQuestions?: CanonicalQuestion[];
  questionSources?: QuestionSource[];
  telegramDiagnostics?: Record<string, TelegramSyncDiagnostics>;
  /** Robust MCQ Attempt History across all QBank/GT/Telegram/AI/Error sources */
  mcqAttempts?: McqAttempt[];
  /** Tracked educational video interactions (views, ratings, completion) */
  videoInteractions?: VideoInteraction[];
  /** Topic mastery learning package state (video, flashcards, slides, MCQs, revision schedule) */
  topicMasteryPackages?: Record<string, TopicMasteryLearningPackage>;
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

// =================== FMGE ADAPTIVE PRIORITY ENGINE TYPES ===================

export type TopicPriorityStatus =
  | 'critical'
  | 'high_priority'
  | 'needs_attention'
  | 'learning'
  | 'stable'
  | 'unattempted';

export type StudyActionType =
  | 'practice_mcqs'
  | 'review_errors'
  | 'complete_revision'
  | 'master_topic'
  | 'rapid_review';

export type LearningPathwayStep = 'slides' | 'cases' | 'flashcards' | 'video' | 'mcqs';

export interface NextBestStudyAction {
  id: string;
  type: StudyActionType;
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  weightage: number;
  priorityScore: number;
  masteryScore: number;
  status: TopicPriorityStatus;
  actionLabel: string;
  actionDescription: string;
  reason: string;
  allocatedMinutes: number;
  urgencyLevel: 'critical' | 'high' | 'medium';
  recommendedPathway: LearningPathwayStep[];
}

export interface TopicAdaptivePriorityScoreBreakdown {
  fmgeWeightContribution: number;
  weaknessContribution: number;
  recencyDecayContribution: number;
  errorBurdenContribution: number;
  revisionUrgencyContribution: number;
  grandTestContribution: number;
  unattemptedBonusContribution: number;
  examProximityAdjustment: number;
  masteryProtectionDeduction: number;
}

export interface TopicAdaptivePriority {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  phase: SubjectPhase;
  subjectWeightage: number;
  isHighYield: boolean;
  priorityScore: number; // 0 - 100
  masteryScore: number; // 0 - 100%
  status: TopicPriorityStatus;
  dataConfidence: 'preliminary' | 'moderate' | 'high';
  fmgeImportanceScore: number;
  accuracy: number;
  recentAccuracy: number;
  attemptCount: number;
  errorCount: number;
  repeatedErrorCount: number;
  daysSinceLastStudy: number;
  revisionDue: boolean;
  revisionOverdueDays: number;
  revisionStage: 'R0' | 'R1' | 'R2' | 'R3' | 'COMPLETED';
  grandTestWeakness: boolean;
  grandTestMistakeCount: number;
  recommendedAction: NextBestStudyAction;
  explanation: string;
  scoreBreakdown: TopicAdaptivePriorityScoreBreakdown;
  recommendedPathway: LearningPathwayStep[];
}

export interface SubjectAdaptivePriority {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  phase: SubjectPhase;
  weightage: number;
  priorityScore: number; // 0 - 100
  averageMastery: number; // 0 - 100%
  criticalTopicCount: number;
  highPriorityTopicCount: number;
  unattemptedCount: number;
  totalTopics: number;
  totalAttempts: number;
  subjectAccuracy: number;
  isGrandTestWeakness: boolean;
  explanation: string;
  topTopics: TopicAdaptivePriority[];
}

// =================== START MY DAY DAILY MISSION TYPES ===================

export type DailyMissionTaskType =
  | 'MASTER_TOPIC'
  | 'PRACTICE_MCQS'
  | 'REVIEW_ERROR_VAULT'
  | 'REVISION'
  | 'FLASHCARDS'
  | 'CRASH_SLIDES'
  | 'CLINICAL_CASES'
  | 'MIXED_HIGH_YIELD_MCQS';

export interface DailyMissionTask {
  id: string;
  sequenceNumber: number;
  type: DailyMissionTaskType;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  topicId: string;
  topicName: string;
  subtopic?: string;
  isHighYield: boolean;
  priorityScore: number;
  masteryScore: number;
  durationMinutes: number;
  reason: string;
  actionLabel: string;
  actionDescription: string;
  targetCount?: number;
  isCompleted: boolean;
  completedAt?: string;
  recommendedPathway?: LearningPathwayStep[];
  performanceResult?: {
    accuracy?: number;
    score?: number;
    errorsResolved?: number;
  };
}

export interface DailyMissionSummary {
  timeSpentMinutes: number;
  mcqsSolved: number;
  averageAccuracy: number;
  topicsImproved: number;
  errorsFixed: number;
  weakTopicsRemaining: number;
}

export interface GeneratedDailyMission {
  id: string;
  dateKey: string;
  timeBudgetMinutes: number;
  totalAllocatedMinutes: number;
  tasks: DailyMissionTask[];
  completedTaskCount: number;
  totalTaskCount: number;
  isCompleted: boolean;
  studyStreakDays: number;
  summary?: DailyMissionSummary;
}



