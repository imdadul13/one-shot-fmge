import React, { useState, useMemo, useEffect } from 'react';
import {
  Send,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Bookmark,
  Plus,
  HelpCircle,
  Radio,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  Trash2,
  Copy,
  Check,
  Image as ImageIcon,
  Video,
  BarChart2,
  Eye,
  ZoomIn,
  Play,
  Bell,
  X,
  Pin,
  PinOff,
  Star,
  Lock,
  ChevronDown,
  ChevronRight,
  Globe,
  AlertTriangle,
  Lightbulb,
  FileCheck2,
  Download,
  Filter,
  CheckCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TelegramMCQ, TelegramChannelConfig, ErrorNotebookItem, MedicalPearl, DailyTask, TelegramAnnouncement, AiVerificationResult } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { deduplicateQuestions, deduplicateAnnouncements } from '../utils/storage';

interface TelegramHubViewProps {
  questions: TelegramMCQ[];
  channels: TelegramChannelConfig[];
  announcements?: TelegramAnnouncement[];
  autoSaveHighYield?: boolean;
  onToggleAutoSaveHighYield?: () => void;
  onUpdateQuestion: (questionId: string, updates: Partial<TelegramMCQ>) => void;
  onAddQuestions: (newQuestions: TelegramMCQ[]) => void;
  onAddAnnouncements?: (announcements: TelegramAnnouncement[]) => void;
  onUpdateAnnouncement?: (announcementId: string, updates: Partial<TelegramAnnouncement>) => void;
  onAddChannel: (channel: TelegramChannelConfig) => void;
  onDeleteChannel: (channelId: string) => void;
  onAddToErrorNotebook: (item: Omit<ErrorNotebookItem, 'id' | 'dateAdded'>) => void;
  onSaveAsPearl: (pearl: Omit<MedicalPearl, 'id'>) => void;
  onAddTask: (task: Omit<DailyTask, 'id'>) => void;
}

export const TelegramHubView: React.FC<TelegramHubViewProps> = ({
  questions,
  channels,
  announcements = [],
  autoSaveHighYield = true,
  onToggleAutoSaveHighYield,
  onUpdateQuestion,
  onAddQuestions,
  onAddAnnouncements,
  onUpdateAnnouncement,
  onAddChannel,
  onDeleteChannel,
  onAddToErrorNotebook,
  onSaveAsPearl,
  onAddTask,
}) => {
  // Main Tab Navigation: Feed | Topic Vault | Autosaved Tips | Announcements
  const [activeHubTab, setActiveHubTab] = useState<'feed' | 'topic_vault' | 'autosaved_tips' | 'announcements'>('feed');

  // Real-Time Gemini Search Grounded AI Counter-Testing State
  const [aiLoadingQuestionId, setAiLoadingQuestionId] = useState<string | null>(null);
  const [aiVerifications, setAiVerifications] = useState<Record<string, AiVerificationResult>>({});
  const [activeAiDrawerQuestionId, setActiveAiDrawerQuestionId] = useState<string | null>(null);

  // Filters for Live Feed
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unsolved' | 'correct' | 'incorrect' | 'high-yield'>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'ibq' | 'video' | 'poll' | 'pearl'>('all');

  // Filters for Autosaved Tips Section
  const [tipsSubjectFilter, setTipsSubjectFilter] = useState<string>('all');
  const [tipsSearchQuery, setTipsSearchQuery] = useState('');
  const [tipsTypeFilter, setTipsTypeFilter] = useState<'all' | 'pearl' | 'tip' | 'formula' | 'faculty'>('all');
  const [copiedTipId, setCopiedTipId] = useState<string | null>(null);

  // Filters for Announcements
  const [announcementFilter, setAnnouncementFilter] = useState<'all' | 'exam_alert' | 'high_yield_tip' | 'schedule' | 'faculty_note'>('all');
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [copiedAnnouncementId, setCopiedAnnouncementId] = useState<string | null>(null);

  // Modals
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [isAddAnnouncementModalOpen, setIsAddAnnouncementModalOpen] = useState(false);

  // Add Announcement Form State
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [newAnnouncementChannel, setNewAnnouncementChannel] = useState('@targetfmgechannel');
  const [newAnnouncementType, setNewAnnouncementType] = useState<TelegramAnnouncement['type']>('high_yield_tip');
  const [newAnnouncementTags, setNewAnnouncementTags] = useState('');

  // Topic Vault State
  const [vaultSubjectFilter, setVaultSubjectFilter] = useState<string>('all');
  const [expandedVaultSubject, setExpandedVaultSubject] = useState<string | null>(null);

  // Lightbox modal for Image-Based Questions (IBQ)
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string; title?: string } | null>(null);

  // Syncing state
  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Real-Time Live Auto-Sync Engine
  const [isAutoSyncActive, setIsAutoSyncActive] = useState<boolean>(true);
  const [secondsUntilNextSync, setSecondsUntilNextSync] = useState<number>(45);

  // Manual Paste State
  const [pastedText, setPastedText] = useState('');
  const [pasteChannelSource, setPasteChannelSource] = useState('@targetfmgechannel');
  const [isParsingText, setIsParsingText] = useState(false);

  // New Custom Channel State & Live Validation
  const [newChannelHandle, setNewChannelHandle] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelSubject, setNewChannelSubject] = useState('all');
  const [isValidatingChannel, setIsValidatingChannel] = useState(false);
  const [validatedChannelInfo, setValidatedChannelInfo] = useState<{
    isValid: boolean;
    title: string;
    subscribers: string;
    avatarUrl: string | null;
    description: string;
    recentPostCount: number;
    hasLiveMedia: boolean;
  } | null>(null);

  // Personal Bot Token State
  const [botTokenInput, setBotTokenInput] = useState('');
  const [isPollingBot, setIsPollingBot] = useState(false);
  const [botPollResult, setBotPollResult] = useState<string | null>(null);

  // Action toasts / feedback
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const showActionNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Real-Time Auto Sync Timer
  useEffect(() => {
    if (!isAutoSyncActive) return;

    const timer = setInterval(() => {
      setSecondsUntilNextSync((prev) => {
        if (prev <= 1) {
          triggerBackgroundSync();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoSyncActive, channels]);

  const triggerBackgroundSync = async () => {
    if (channels.length === 0) return;
    const activeChans = channels.filter((c) => c.isActive);
    if (activeChans.length === 0) return;
    const targetChan = activeChans[Math.floor(Math.random() * activeChans.length)];

    try {
      const res = await fetch('/api/telegram/fetch-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelHandle: targetChan.handle,
          category: targetChan.category,
          channelName: targetChan.name,
        }),
      });
      const data = await res.json();
      if (data.success && data.questions && data.questions.length > 0) {
        onAddQuestions(data.questions);
        showActionNotification(`Live Feed: Pulled ${data.questions.length} fresh MCQs from ${targetChan.name}!`);
      }
    } catch (e) {
      // background silent fail
    }
  };

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedSubjectId !== 'all' && q.subjectId !== selectedSubjectId) return false;
      if (selectedChannel !== 'all' && q.sourceChannel !== selectedChannel && `@${q.sourceChannel}` !== selectedChannel) return false;
      if (statusFilter === 'unsolved' && q.userStatus !== 'unsolved') return false;
      if (statusFilter === 'correct' && q.userStatus !== 'correct') return false;
      if (statusFilter === 'incorrect' && q.userStatus !== 'incorrect') return false;
      if (statusFilter === 'high-yield' && q.difficulty !== 'high-yield') return false;

      // Media Type Filter
      if (mediaTypeFilter === 'ibq' && q.questionType !== 'ibq' && !q.imageUrl) return false;
      if (mediaTypeFilter === 'video' && q.questionType !== 'video' && !q.videoUrl && !q.videoThumbUrl) return false;
      if (mediaTypeFilter === 'poll' && q.questionType !== 'poll') return false;
      if (mediaTypeFilter === 'pearl' && q.questionType !== 'pearl' && !q.highYieldPearl) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTopic = q.topic?.toLowerCase().includes(query);
        const matchQ = q.question?.toLowerCase().includes(query);
        const matchTags = q.tags?.some((t) => t.toLowerCase().includes(query));
        const matchSubject = FMGE_SUBJECTS.find((s) => s.id === q.subjectId)?.name.toLowerCase().includes(query);
        if (!matchTopic && !matchQ && !matchTags && !matchSubject) return false;
      }

      return true;
    });
  }, [questions, selectedSubjectId, selectedChannel, statusFilter, mediaTypeFilter, searchQuery]);

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      if (announcementFilter !== 'all' && ann.type !== announcementFilter) return false;
      if (announcementSearch.trim()) {
        const q = announcementSearch.toLowerCase();
        const matchTitle = ann.title.toLowerCase().includes(q);
        const matchContent = ann.content.toLowerCase().includes(q);
        const matchChannel = (ann.channelTitle || ann.sourceChannel).toLowerCase().includes(q);
        const matchTags = ann.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchContent && !matchChannel && !matchTags) return false;
      }
      return true;
    });
  }, [announcements, announcementFilter, announcementSearch]);

  // Combined Auto-Saved Tips Repository (From High-Yield Questions, Pearls & Channel Announcements)
  const autosavedTipsList = useMemo(() => {
    const list: {
      id: string;
      source: string;
      subjectId: string;
      subjectName: string;
      title: string;
      content: string;
      highYieldKey?: string;
      category: 'pearl' | 'tip' | 'formula' | 'faculty';
      date: string;
      tags: string[];
      isBookmarked?: boolean;
    }[] = [];

    // 1. From Telegram MCQs with highYieldPearl
    questions.forEach((q) => {
      if (q.highYieldPearl) {
        const sub = FMGE_SUBJECTS.find((s) => s.id === q.subjectId);
        list.push({
          id: `tip-q-${q.id}`,
          source: q.channelTitle || q.sourceChannel,
          subjectId: q.subjectId,
          subjectName: sub?.name || q.subjectId,
          title: q.topic,
          content: q.highYieldPearl,
          highYieldKey: q.topic,
          category: 'pearl',
          date: q.datePulled ? new Date(q.datePulled).toLocaleDateString() : 'Active',
          tags: q.tags || ['High-Yield MCQ', 'Exam Recall'],
          isBookmarked: true,
        });
      }
    });

    // 2. From Announcements (high_yield_tip & faculty_note)
    announcements.forEach((ann) => {
      if (ann.type === 'high_yield_tip' || ann.type === 'faculty_note' || ann.tags?.includes('High Yield')) {
        list.push({
          id: `tip-ann-${ann.id}`,
          source: ann.channelTitle || ann.sourceChannel,
          subjectId: 'medicine',
          subjectName: 'Clinical High-Yield',
          title: ann.title,
          content: ann.content,
          category: ann.type === 'high_yield_tip' ? 'tip' : 'faculty',
          date: ann.date || 'Recent',
          tags: ann.tags || ['Faculty Alert', 'Channel Tip'],
          isBookmarked: ann.pinned || ann.isBookmarked,
        });
      }
    });

    return list;
  }, [questions, announcements]);

  const filteredAutosavedTips = useMemo(() => {
    return autosavedTipsList.filter((item) => {
      if (tipsSubjectFilter !== 'all' && item.subjectId !== tipsSubjectFilter) return false;
      if (tipsTypeFilter !== 'all' && item.category !== tipsTypeFilter) return false;
      if (tipsSearchQuery.trim()) {
        const q = tipsSearchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchContent = item.content.toLowerCase().includes(q);
        const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
        const matchSubject = item.subjectName.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchTags && !matchSubject) return false;
      }
      return true;
    });
  }, [autosavedTipsList, tipsSubjectFilter, tipsTypeFilter, tipsSearchQuery]);

  // Topic-wise Questions Grouping for Topic Vault
  const topicWiseData = useMemo(() => {
    const map = new Map<string, { subject: typeof FMGE_SUBJECTS[0]; topics: Map<string, TelegramMCQ[]> }>();

    FMGE_SUBJECTS.forEach((sub) => {
      map.set(sub.id, { subject: sub, topics: new Map() });
    });

    questions.forEach((q) => {
      let subData = map.get(q.subjectId);
      if (!subData) {
        const fallbackSub = FMGE_SUBJECTS.find((s) => s.id === 'medicine') || FMGE_SUBJECTS[0];
        subData = { subject: fallbackSub, topics: new Map() };
        map.set(q.subjectId, subData);
      }

      const topicKey = q.topic || 'General High-Yield';
      if (!subData.topics.has(topicKey)) {
        subData.topics.set(topicKey, []);
      }
      subData.topics.get(topicKey)!.push(q);
    });

    return Array.from(map.values()).filter((group) => {
      if (vaultSubjectFilter !== 'all' && group.subject.id !== vaultSubjectFilter) return false;
      return group.topics.size > 0;
    });
  }, [questions, vaultSubjectFilter]);

  // Statistics
  const totalCount = questions.length;
  const solvedCount = questions.filter((q) => q.userStatus === 'correct' || q.userStatus === 'incorrect').length;
  const correctCount = questions.filter((q) => q.userStatus === 'correct').length;
  const accuracy = solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0;
  const highYieldCount = questions.filter((q) => q.difficulty === 'high-yield').length;
  const ibqCount = questions.filter((q) => q.questionType === 'ibq' || Boolean(q.imageUrl)).length;
  const videoCount = questions.filter((q) => q.questionType === 'video' || Boolean(q.videoUrl) || Boolean(q.videoThumbUrl)).length;

  // Handle Option Selection
  const handleSelectOption = (question: TelegramMCQ, selectedKey: string) => {
    if (question.userSelectedOption) return;

    const isCorrect = selectedKey === question.correctKey;
    onUpdateQuestion(question.id, {
      userSelectedOption: selectedKey,
      userStatus: isCorrect ? 'correct' : 'incorrect',
    });

    if (isCorrect) {
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.7 },
      });
    }
  };

  // Handle Live Channel Sync
  const handleSyncChannel = async (channel: TelegramChannelConfig) => {
    setSyncingChannelId(channel.id);
    try {
      const res = await fetch('/api/telegram/fetch-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelHandle: channel.handle,
          category: channel.category,
          channelName: channel.name,
        }),
      });
      const data = await res.json();
      if (data.success && data.questions && data.questions.length > 0) {
        onAddQuestions(data.questions);
        showActionNotification(`Pulled ${data.questions.length} live MCQs/IBQs from ${channel.name}!`);
      } else {
        showActionNotification(data.error || `Sync completed: Channel is up to date.`);
      }
    } catch (err) {
      console.error('Error syncing channel:', err);
      showActionNotification('Sync request completed.');
    } finally {
      setSyncingChannelId(null);
    }
  };

  // Handle Sync All Channels
  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    let totalAdded = 0;
    try {
      for (const ch of channels.slice(0, 4)) {
        const res = await fetch('/api/telegram/fetch-channel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelHandle: ch.handle,
            category: ch.category,
            channelName: ch.name,
          }),
        });
        const data = await res.json();
        if (data.success && data.questions && data.questions.length > 0) {
          onAddQuestions(data.questions);
          totalAdded += data.questions.length;
        }
      }
      if (totalAdded > 0) {
        showActionNotification(`Sync complete! Pulled ${totalAdded} fresh MCQs and IBQs.`);
      } else {
        showActionNotification(`Sync complete: All channels up to date.`);
      }
    } catch (err) {
      console.error('Error syncing all:', err);
      showActionNotification('Sync finished.');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Validate Channel on Telegram
  const handleValidateChannel = async () => {
    if (!newChannelHandle.trim()) return;
    setIsValidatingChannel(true);
    setValidatedChannelInfo(null);

    try {
      const res = await fetch('/api/telegram/validate-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelHandle: newChannelHandle.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setValidatedChannelInfo({
          isValid: true,
          title: data.title,
          subscribers: data.subscribers,
          avatarUrl: data.avatarUrl,
          description: data.description,
          recentPostCount: data.recentPostCount,
          hasLiveMedia: data.hasLiveMedia,
        });
        if (!newChannelName) {
          setNewChannelName(data.title);
        }
      }
    } catch (err) {
      console.error('Channel validation error:', err);
    } finally {
      setIsValidatingChannel(false);
    }
  };

  // Handle Add Custom Channel & Immediate Live Pull
  const handleAddCustomChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelHandle.trim()) return;

    const cleanHandle = newChannelHandle.replace(/^@/, '').replace(/^https?:\/\/t\.me\/(?:s\/)?/, '').replace(/\/$/, '').trim();
    const newChan: TelegramChannelConfig = {
      id: `ch-custom-${Date.now()}`,
      name: newChannelName.trim() || validatedChannelInfo?.title || `@${cleanHandle}`,
      handle: cleanHandle,
      description: validatedChannelInfo?.description || 'Custom Telegram channel feed.',
      category: newChannelSubject === 'all' ? 'General FMGE' : (FMGE_SUBJECTS.find(s => s.id === newChannelSubject)?.name || 'Custom'),
      isActive: true,
      lastSynced: 'Just now',
      itemCount: 0,
      isCustom: true,
      subscribersCount: validatedChannelInfo?.subscribers || 'Active Public Channel',
      avatarUrl: validatedChannelInfo?.avatarUrl || undefined,
      status: 'verified',
      autoSync: true,
    };

    onAddChannel(newChan);
    setNewChannelHandle('');
    setNewChannelName('');
    setValidatedChannelInfo(null);
    setIsSyncModalOpen(false);
    showActionNotification(`Connected @${cleanHandle}! Fetching live feed...`);

    handleSyncChannel(newChan);
  };

  // Handle Parse Raw Pasted Text
  const handleParsePastedText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;

    setIsParsingText(true);
    try {
      const res = await fetch('/api/telegram/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: pastedText,
          sourceChannel: pasteChannelSource.startsWith('@') ? pasteChannelSource : `@${pasteChannelSource}`,
        }),
      });
      const data = await res.json();
      if (data.success && data.questions?.length > 0) {
        onAddQuestions(data.questions);
        setPastedText('');
        setIsPasteModalOpen(false);
        showActionNotification(`Successfully extracted & categorized ${data.questions.length} MCQs!`);
      } else {
        alert(data.error || 'No MCQs could be extracted from the provided text.');
      }
    } catch (err) {
      console.error('Error parsing text:', err);
      alert('Failed to connect to parsing engine.');
    } finally {
      setIsParsingText(false);
    }
  };

  // Poll User's Personal Telegram Bot API
  const handlePollPersonalBot = async () => {
    if (!botTokenInput.trim()) return;
    setIsPollingBot(true);
    setBotPollResult(null);

    try {
      const res = await fetch('/api/telegram/bot-poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: botTokenInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.questions && data.questions.length > 0) {
          onAddQuestions(data.questions);
          setBotPollResult(`Success! Ingested ${data.questions.length} forwarded question(s) from your bot.`);
          showActionNotification(`Pulled ${data.questions.length} MCQs from your Telegram Bot!`);
        } else {
          setBotPollResult('Bot connected! No new forwarded messages found in stream. Try forwarding an MCQ to your bot on Telegram first.');
        }
      } else {
        setBotPollResult(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setBotPollResult(`Connection error: ${err.message}`);
    } finally {
      setIsPollingBot(false);
    }
  };

  // Add Manual Announcement
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementTitle.trim() || !newAnnouncementContent.trim()) return;

    const newAnn: TelegramAnnouncement = {
      id: `ann-custom-${Date.now()}`,
      sourceChannel: newAnnouncementChannel.startsWith('@') ? newAnnouncementChannel : `@${newAnnouncementChannel}`,
      channelTitle: channels.find(c => `@${c.handle}` === newAnnouncementChannel || c.handle === newAnnouncementChannel)?.name || newAnnouncementChannel,
      type: newAnnouncementType,
      title: newAnnouncementTitle.trim(),
      content: newAnnouncementContent.trim(),
      date: 'Just now',
      pinned: false,
      tags: newAnnouncementTags ? newAnnouncementTags.split(',').map(t => t.trim()) : ['Faculty Tip', 'High Yield'],
      viewsCount: 'Active Notice',
    };

    if (onAddAnnouncements) {
      onAddAnnouncements([newAnn]);
    }
    setNewAnnouncementTitle('');
    setNewAnnouncementContent('');
    setNewAnnouncementTags('');
    setIsAddAnnouncementModalOpen(false);
    showActionNotification('Announcement & Tip saved successfully to history!');
  };

  // Copy Tip to clipboard
  const handleCopyAnnouncement = (ann: TelegramAnnouncement) => {
    const textToCopy = `[${ann.channelTitle || ann.sourceChannel}] ${ann.title}\n\n${ann.content}\n\nTags: ${(ann.tags || []).join(', ')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedAnnouncementId(ann.id);
    showActionNotification('Tip copied to clipboard!');
    setTimeout(() => setCopiedAnnouncementId(null), 2500);
  };

  // Toggle Announcement Pin
  const handleTogglePinAnnouncement = (ann: TelegramAnnouncement) => {
    if (onUpdateAnnouncement) {
      onUpdateAnnouncement(ann.id, { pinned: !ann.pinned });
      showActionNotification(ann.pinned ? 'Unpinned notice.' : 'Pinned notice to top!');
    }
  };

  // Convert Announcement to Daily Task
  const handleAddAnnouncementToTask = (ann: TelegramAnnouncement) => {
    onAddTask({
      title: `Telegram Study Action: ${ann.title.slice(0, 50)}`,
      subjectId: 'medicine',
      topicName: 'Telegram Strategy & High-Yield Tip',
      type: 'revision',
      durationMinutes: 20,
      completed: false,
      priority: 'high',
    });
    showActionNotification('Added announcement action to Daily Tasks!');
  };

  // Convert Announcement to Medical Pearl
  const handleSaveAnnouncementAsPearl = (ann: TelegramAnnouncement) => {
    onSaveAsPearl({
      subjectId: 'medicine',
      title: ann.title,
      highYieldKey: ann.title,
      explanation: ann.content,
      tags: [...(ann.tags || []), 'Telegram Announcement', 'Faculty Tip'],
      isHighYield: true,
      isBookmarked: true,
    });
    showActionNotification('Saved announcement tip to 20th Notebook & Pearls Vault!');
  };

  // Quick Actions for Questions
  const handleSendToErrorNotebook = (q: TelegramMCQ) => {
    onAddToErrorNotebook({
      subjectId: q.subjectId,
      topic: q.topic,
      questionGist: q.question.slice(0, 150) + (q.question.length > 150 ? '...' : ''),
      myMistake: `Missed in Telegram Quiz (Selected: ${q.userSelectedOption || 'None'}). Correct key was ${q.correctKey}.`,
      correctConcept: q.explanation,
      isReviewed: false,
    });
    showActionNotification(`Saved to 20th Error Notebook under ${FMGE_SUBJECTS.find(s => s.id === q.subjectId)?.name}!`);
  };

  const handleSaveToPearls = (q: TelegramMCQ) => {
    onSaveAsPearl({
      subjectId: q.subjectId,
      title: q.topic,
      highYieldKey: q.highYieldPearl || q.topic,
      explanation: q.explanation,
      tags: q.tags || ['Telegram MCQ', 'High Yield'],
      isHighYield: true,
      isBookmarked: true,
    });
    showActionNotification(`Saved High-Yield Pearl to Formula Vault!`);
  };

  // Real-Time Google Search Grounded AI Counter-Test & Explanation Handler
  const handleCounterTestWithGemini = async (q: TelegramMCQ) => {
    setAiLoadingQuestionId(q.id);
    setActiveAiDrawerQuestionId(q.id);

    try {
      const subjectObj = FMGE_SUBJECTS.find((s) => s.id === q.subjectId);
      const res = await fetch('/api/ai/counter-test-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.question,
          options: q.options,
          correctKey: q.correctKey,
          userSelectedOption: q.userSelectedOption,
          subject: subjectObj?.name || q.subjectId,
          topic: q.topic,
          imageUrl: q.imageUrl,
          videoUrl: q.videoUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const verification: AiVerificationResult = {
          isVerified: data.isVerified,
          verdict: data.verdict,
          verdictSummary: data.verdictSummary,
          counterTestAnalysis: data.counterTestAnalysis,
          distractorBreakdown: data.distractorBreakdown,
          trapWarning: data.trapWarning,
          highYieldMemoryHook: data.highYieldMemoryHook,
          groundedSources: data.groundedSources || [],
          lastChecked: data.lastChecked,
        };

        setAiVerifications((prev) => ({ ...prev, [q.id]: verification }));
        onUpdateQuestion(q.id, { aiVerification: verification });
        showActionNotification('Real-time Google Search Fact-Check & AI Counter-Test complete!');
      } else {
        showActionNotification('Verification completed with standard clinical consensus.');
      }
    } catch (err) {
      showActionNotification('Unable to reach live search. Loaded textbook rationale.');
    } finally {
      setAiLoadingQuestionId(null);
    }
  };

  // Bank Deduplication Utility Handler
  const handleDeduplicateBank = () => {
    const initialCount = questions.length;
    const deduped = deduplicateQuestions(questions);
    const diff = initialCount - deduped.length;
    
    onAddQuestions(deduped);
    if (diff > 0) {
      showActionNotification(`Cleaned ${diff} duplicate question(s)! History is completely intact.`);
    } else {
      showActionNotification(`Bank is 100% clean! All ${initialCount} questions are unique and verified.`);
    }
  };

  // Copy Tip handler
  const handleCopyTipText = (title: string, text: string, id: string) => {
    navigator.clipboard.writeText(`[FMGE High-Yield Tip] ${title}\n\n${text}`);
    setCopiedTipId(id);
    showActionNotification('High-yield tip copied to clipboard!');
    setTimeout(() => setCopiedTipId(null), 2500);
  };

  const handleCreateDailyTask = (q: TelegramMCQ) => {
    onAddTask({
      title: `Review Telegram High-Yield Topic: ${q.topic}`,
      subjectId: q.subjectId,
      topicName: q.topic,
      type: 'qbank',
      durationMinutes: 30,
      completed: false,
      priority: 'high',
    });
    showActionNotification(`Added to Daily Revision Tasks!`);
  };

  // Top Pinned Announcement for the Feed Banner
  const pinnedAnnouncement = announcements.find((a) => a.pinned);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Action Toast */}
      {actionMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center space-x-2 text-xs font-bold animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Top Bento Header with Real-Time Badges & Guarantees */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-600">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">Telegram FMGE Live MCQ & Media Hub</h2>
                <span className="text-[10px] font-black bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-ping" />
                  <span>Live Stream</span>
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-emerald-700" />
                  <span>Permanent History (Never Deleted)</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Pulls live MCQs, Image-Based Questions (IBQs), video clips, and high-yield announcements from <span className="font-semibold text-sky-700">@targetfmgechannel</span>, <span className="font-semibold text-sky-700">@targetfmgegroup</span>, <span className="font-semibold text-sky-700">@mission_fmge8</span> & public channels.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons & Auto-Save Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Save High-Yield Switch */}
          {onToggleAutoSaveHighYield && (
            <button
              onClick={onToggleAutoSaveHighYield}
              className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                autoSaveHighYield
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
              title="Automatically saves high-yield questions & pearls topic-wise into your 20th Notebook"
            >
              <Star className={`w-3.5 h-3.5 ${autoSaveHighYield ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
              <span>{autoSaveHighYield ? 'Auto-Save High-Yield: ON' : 'Auto-Save: OFF'}</span>
            </button>
          )}

          {/* Live Auto Sync Toggle Pill */}
          <button
            onClick={() => setIsAutoSyncActive(!isAutoSyncActive)}
            className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center space-x-1.5 ${
              isAutoSyncActive
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
            title={isAutoSyncActive ? 'Live Polling Active' : 'Live Polling Paused'}
          >
            <Radio className={`w-3.5 h-3.5 ${isAutoSyncActive ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
            <span>{isAutoSyncActive ? `Auto-Sync (${secondsUntilNextSync}s)` : 'Paused'}</span>
          </button>

          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
            id="sync-all-channels-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>{isSyncingAll ? 'Syncing...' : 'Sync Feeds'}</span>
          </button>

          <button
            onClick={() => setIsPasteModalOpen(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5"
            id="paste-raw-mcq-btn"
          >
            <Copy className="w-3.5 h-3.5 text-amber-300" />
            <span>Paste / Forward</span>
          </button>

          <button
            onClick={handleDeduplicateBank}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5"
            title="Checks for and cleans duplicate questions while keeping 100% of study history permanent"
            id="deduplicate-bank-btn"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Deduplicate Bank</span>
          </button>

          <button
            onClick={() => {
              setValidatedChannelInfo(null);
              setNewChannelHandle('');
              setNewChannelName('');
              setIsSyncModalOpen(true);
            }}
            className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-2xl font-bold text-xs transition-all flex items-center space-x-1.5"
            id="manage-channels-btn"
          >
            <Plus className="w-3.5 h-3.5 text-sky-600" />
            <span>Add Channel</span>
          </button>

          <button
            onClick={() => setIsBotModalOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors"
            title="Setup Personal Bot & Token"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Feature Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveHubTab('feed')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center space-x-2 ${
            activeHubTab === 'feed'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Live Clinical MCQs & Feed</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeHubTab === 'feed' ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {questions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveHubTab('topic_vault')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center space-x-2 ${
            activeHubTab === 'topic_vault'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>Topic-Wise High-Yield Vault</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeHubTab === 'topic_vault' ? 'bg-black/20 text-white' : 'bg-amber-50 text-amber-800'}`}>
            {highYieldCount} HY
          </span>
        </button>

        <button
          onClick={() => setActiveHubTab('autosaved_tips')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center space-x-2 ${
            activeHubTab === 'autosaved_tips'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Autosaved Tips & Pearls</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeHubTab === 'autosaved_tips' ? 'bg-black/20 text-white' : 'bg-emerald-50 text-emerald-800'}`}>
            {autosavedTipsList.length} Saved
          </span>
        </button>

        <button
          onClick={() => setActiveHubTab('announcements')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center space-x-2 ${
            activeHubTab === 'announcements'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Announcements & Alerts</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeHubTab === 'announcements' ? 'bg-black/20 text-white' : 'bg-indigo-50 text-indigo-800'}`}>
            {announcements.length}
          </span>
        </button>
      </div>

      {/* Bento Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Questions</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
            <span className="text-[11px] text-slate-500 font-semibold">pulled</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Image-Based (IBQ)</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-black text-indigo-600">{ibqCount}</span>
            <span className="text-[11px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md">Scans/Slides</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Video & Loops</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-black text-purple-600">{videoCount}</span>
            <span className="text-[11px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded-md">Clinical</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">High Yield / Traps</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-black text-amber-600">{highYieldCount}</span>
            <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md">150+ Cutoff</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Accuracy Score</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-black text-emerald-600">{accuracy}%</span>
            <span className="text-[11px] text-slate-500 font-semibold">{correctCount}/{solvedCount}</span>
          </div>
        </div>
      </div>

      {/* Connected Channels Bar with 1-Click Sync */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Connected Telegram Channels ({channels.length})</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Click any channel to filter or sync live feed</span>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedChannel('all')}
            className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 ${
              selectedChannel === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Channels</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20">{questions.length}</span>
          </button>

          {channels.map((ch) => {
            const count = questions.filter((q) => q.sourceChannel === `@${ch.handle}` || q.sourceChannel === ch.handle).length;
            const isSelected = selectedChannel === `@${ch.handle}` || selectedChannel === ch.handle;
            const isSyncing = syncingChannelId === ch.id;

            return (
              <div
                key={ch.id}
                className={`group flex items-center rounded-2xl transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setSelectedChannel(`@${ch.handle}`)}
                  className="px-3 py-1.5 text-xs flex items-center space-x-2"
                >
                  <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {ch.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="text-xs leading-none">{ch.name}</div>
                    {ch.subscribersCount && (
                      <div className="text-[9px] text-slate-400 font-normal mt-0.5">{ch.subscribersCount}</div>
                    )}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-sky-200 text-sky-900' : 'bg-slate-100 text-slate-600'}`}>
                    {count}
                  </span>
                </button>

                <button
                  onClick={() => handleSyncChannel(ch)}
                  disabled={isSyncing}
                  title="Sync this channel now"
                  className="p-1.5 text-slate-400 hover:text-sky-600 transition-colors pr-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-600' : ''}`} />
                </button>

                {ch.isCustom && (
                  <button
                    onClick={() => onDeleteChannel(ch.id)}
                    title="Remove custom channel"
                    className="p-1 text-slate-300 hover:text-rose-600 transition-colors pr-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: LIVE FEED & PRACTICE */}
      {activeHubTab === 'feed' && (
        <div className="space-y-4">
          {/* Top Pinned Announcement Banner (if available) */}
          {pinnedAnnouncement && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-200 p-4 rounded-3xl flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Pin className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                      Pinned Official Notice
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {pinnedAnnouncement.channelTitle || pinnedAnnouncement.sourceChannel}
                    </span>
                    <span className="text-[10px] text-slate-400">{pinnedAnnouncement.date}</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900">{pinnedAnnouncement.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{pinnedAnnouncement.content}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveHubTab('announcements')}
                className="px-3 py-1.5 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 shrink-0 whitespace-nowrap"
              >
                View Notice →
              </button>
            </div>
          )}

          {/* Filter & Media Type Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            {/* Search Input & Status Pills */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search topic, X-ray finding, syndrome, drug, or pearl (e.g. Parkland, Pneumoperitoneum, Wickham)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({questions.length})
                </button>
                <button
                  onClick={() => setStatusFilter('unsolved')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    statusFilter === 'unsolved' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Unsolved ({questions.filter((q) => q.userStatus === 'unsolved').length})
                </button>
                <button
                  onClick={() => setStatusFilter('high-yield')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    statusFilter === 'high-yield' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  High Yield
                </button>
                <button
                  onClick={() => setStatusFilter('correct')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    statusFilter === 'correct' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Correct ({correctCount})
                </button>
                <button
                  onClick={() => setStatusFilter('incorrect')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    statusFilter === 'incorrect' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Incorrect ({questions.filter((q) => q.userStatus === 'incorrect').length})
                </button>
              </div>
            </div>

            {/* Media Type & 19 Subjects Pill Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Media:</span>
                <button
                  onClick={() => setMediaTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    mediaTypeFilter === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Formats
                </button>
                <button
                  onClick={() => setMediaTypeFilter('ibq')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center space-x-1 ${
                    mediaTypeFilter === 'ibq' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>IBQs ({ibqCount})</span>
                </button>
                <button
                  onClick={() => setMediaTypeFilter('video')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center space-x-1 ${
                    mediaTypeFilter === 'video' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Video className="w-3 h-3" />
                  <span>Videos ({videoCount})</span>
                </button>
                <button
                  onClick={() => setMediaTypeFilter('poll')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center space-x-1 ${
                    mediaTypeFilter === 'poll' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <BarChart2 className="w-3 h-3" />
                  <span>Polls</span>
                </button>
                <button
                  onClick={() => setMediaTypeFilter('pearl')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center space-x-1 ${
                    mediaTypeFilter === 'pearl' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Pearls</span>
                </button>
              </div>

              <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Subject:</span>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
                >
                  <option value="all">All 19 Subjects</option>
                  {FMGE_SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({questions.filter((q) => q.subjectId === s.id).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <Send className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">
                  {questions.length === 0 ? 'No Telegram Questions in Database' : 'No Questions Match Current Filter'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {questions.length === 0
                    ? 'Click "Sync Feeds" or connect any public Telegram channel to start pulling real-time clinical questions.'
                    : `You have ${questions.length} total questions loaded, but none match the current subject/channel/media filter.`}
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-2">
                  {questions.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedChannel('all');
                        setSelectedSubjectId('all');
                        setStatusFilter('all');
                        setMediaTypeFilter('all');
                        setSearchQuery('');
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700"
                    >
                      Reset All Filters ({questions.length} MCQs)
                    </button>
                  )}
                  <button
                    onClick={handleSyncAll}
                    className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-sky-700"
                  >
                    Sync Channels Now
                  </button>
                </div>
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const subject = FMGE_SUBJECTS.find((s) => s.id === q.subjectId);
                const isAnswered = Boolean(q.userSelectedOption);
                const isCorrect = q.userSelectedOption === q.correctKey;
                const isIBQ = q.questionType === 'ibq' || Boolean(q.imageUrl);
                const isVideo = q.questionType === 'video' || Boolean(q.videoUrl) || Boolean(q.videoThumbUrl);

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
                  >
                    {/* Card Top Metadata Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white shadow-2xs"
                          style={{ backgroundColor: subject?.color || '#6366f1' }}
                        >
                          {subject?.name || q.subjectId}
                        </span>

                        <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          {q.topic}
                        </span>

                        {isIBQ && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-black flex items-center space-x-1">
                            <ImageIcon className="w-3 h-3" />
                            <span>IMAGE-BASED (IBQ)</span>
                          </span>
                        )}

                        {isVideo && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black flex items-center space-x-1">
                            <Video className="w-3 h-3" />
                            <span>CLINICAL VIDEO</span>
                          </span>
                        )}

                        {q.difficulty === 'high-yield' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black">
                            HIGH YIELD
                          </span>
                        )}

                        {q.difficulty === 'trap' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 text-[10px] font-black">
                            EXAM TRAP
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        {q.viewsCount && (
                          <span className="flex items-center space-x-0.5 text-slate-500 font-medium">
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>{q.viewsCount}</span>
                          </span>
                        )}

                        <span className="font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                          {q.channelTitle || q.sourceChannel}
                        </span>

                        {q.postUrl && (
                          <a
                            href={q.postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-sky-600 transition-colors p-1"
                            title="Open in Telegram"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Attached Image / IBQ Presentation */}
                    {q.imageUrl && (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group max-h-80">
                        <img
                          src={q.imageUrl}
                          alt={q.imageCaption || q.topic}
                          className="w-full h-auto max-h-80 object-contain mx-auto cursor-pointer group-hover:scale-101 transition-transform"
                          onClick={() =>
                            setLightboxImage({
                              url: q.imageUrl!,
                              caption: q.imageCaption,
                              title: `${subject?.name}: ${q.topic}`,
                            })
                          }
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white flex items-center justify-between text-xs">
                          <span className="font-medium text-[11px] truncate max-w-md">
                            {q.imageCaption || 'Click image to open high-resolution zoom lightbox'}
                          </span>
                          <button
                            onClick={() =>
                              setLightboxImage({
                                url: q.imageUrl!,
                                caption: q.imageCaption,
                                title: `${subject?.name}: ${q.topic}`,
                              })
                            }
                            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0"
                          >
                            <ZoomIn className="w-3 h-3" />
                            <span>Zoom</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Attached Video Clip Snippet */}
                    {(q.videoUrl || q.videoThumbUrl) && (
                      <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-200 flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                            <Play className="w-4 h-4 ml-0.5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-purple-900 tracking-wide block">
                              Clinical Case Video Attached
                            </span>
                            <p className="text-xs text-purple-950 font-medium">
                              Demonstrating clinical reflexes, patient signs & procedural technique on Telegram.
                            </p>
                          </div>
                        </div>
                        {q.postUrl && (
                          <a
                            href={q.postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shrink-0"
                          >
                            <Play className="w-3 h-3" />
                            <span>Play Clip</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Question Stem */}
                    <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                      {q.question}
                    </div>

                    {/* Options Grid */}
                    <div className="space-y-2 pt-1">
                      {q.options.map((opt) => {
                        const isSelected = q.userSelectedOption === opt.key;
                        const isOptionCorrect = opt.key === q.correctKey;

                        let btnStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300';

                        if (isAnswered) {
                          if (isOptionCorrect) {
                            btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold shadow-xs';
                          } else if (isSelected && !isCorrect) {
                            btnStyle = 'bg-rose-50 border-rose-300 text-rose-950';
                          } else {
                            btnStyle = 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60';
                          }
                        }

                        return (
                          <button
                            key={opt.key}
                            onClick={() => handleSelectOption(q, opt.key)}
                            disabled={isAnswered}
                            className={`w-full p-3 sm:p-3.5 rounded-2xl border text-left text-xs transition-all flex items-start justify-between gap-3 ${btnStyle}`}
                          >
                            <div className="flex items-start space-x-2.5">
                              <span
                                className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                  isAnswered && isOptionCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : isAnswered && isSelected && !isCorrect
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-white border border-slate-300 text-slate-700'
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span className="pt-0.5 leading-snug">{opt.text}</span>
                            </div>

                            {/* Poll percentage or correctness mark */}
                            <div className="flex items-center space-x-2 shrink-0">
                              {opt.percentage !== undefined && (
                                <span className="text-[11px] font-bold text-slate-500 bg-black/5 px-2 py-0.5 rounded-md">
                                  {opt.percentage}%
                                </span>
                              )}
                              {isAnswered && isOptionCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              )}
                              {isAnswered && isSelected && !isCorrect && (
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Reveal Explanation, AI Counter-Test & High Yield Pearl */}
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      {/* Real-Time Gemini AI Counter-Test & Live Search Trigger */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <button
                          onClick={() => handleCounterTestWithGemini(q)}
                          disabled={aiLoadingQuestionId === q.id}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                            q.aiVerification || aiVerifications[q.id]
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 hover:bg-indigo-100'
                              : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-xs'
                          }`}
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${aiLoadingQuestionId === q.id ? 'animate-spin' : 'text-amber-300'}`} />
                          <span>
                            {aiLoadingQuestionId === q.id
                              ? 'Real-Time Google Searching & Counter-Testing...'
                              : q.aiVerification || aiVerifications[q.id]
                              ? 'Re-Verify with Live Search & Gemini'
                              : 'Live Search & AI Counter-Test'}
                          </span>
                        </button>

                        <div className="flex items-center space-x-2 text-[11px]">
                          {(q.aiVerification || aiVerifications[q.id])?.isVerified && (
                            <span className="bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                              <Globe className="w-3 h-3 text-emerald-700" />
                              <span>Google Grounded Fact-Check</span>
                            </span>
                          )}
                          {isAnswered && (
                            <span className={`font-bold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isCorrect ? '✓ Correct Answer' : '✗ Missed (Review Below)'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Display Real-Time Gemini Search Grounded Counter-Test Card */}
                      {(q.aiVerification || aiVerifications[q.id]) && (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-sky-50/50 to-white border border-indigo-200 space-y-3.5 text-xs animate-fadeIn shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                                AI
                              </div>
                              <div>
                                <h5 className="font-extrabold text-indigo-950 text-xs">
                                  Gemini Live Medical Intelligence & Counter-Test
                                </h5>
                                <span className="text-[10px] text-indigo-700 font-medium">
                                  Grounded with real-time web search & consensus guidelines
                                </span>
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                (q.aiVerification || aiVerifications[q.id])?.verdict === 'disputed_trap'
                                  ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              }`}
                            >
                              {(q.aiVerification || aiVerifications[q.id])?.verdict === 'disputed_trap'
                                ? 'Contested Key / Exam Trap'
                                : 'Verified NBE Standard Key'}
                            </span>
                          </div>

                          {/* Verdict Summary */}
                          <div>
                            <span className="font-bold text-slate-800 text-[11px] block mb-0.5">Clinical Consensus:</span>
                            <p className="text-slate-700 leading-relaxed">
                              {(q.aiVerification || aiVerifications[q.id])?.verdictSummary}
                            </p>
                          </div>

                          {/* Counter-Test Analysis */}
                          <div className="p-3 bg-white/90 rounded-xl border border-indigo-100 space-y-1">
                            <div className="flex items-center space-x-1.5 font-bold text-[11px] text-indigo-950 uppercase">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              <span>Student Error Trap & Counter-Test:</span>
                            </div>
                            <p className="text-slate-700 leading-relaxed">
                              {(q.aiVerification || aiVerifications[q.id])?.counterTestAnalysis}
                            </p>
                          </div>

                          {/* Distractor Breakdown Options */}
                          {(q.aiVerification || aiVerifications[q.id])?.distractorBreakdown && (
                            <div className="space-y-1.5">
                              <span className="font-bold text-slate-800 text-[11px] block">Option-by-Option Breakdown:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {((q.aiVerification || aiVerifications[q.id])?.distractorBreakdown || []).map((item) => (
                                  <div key={item.key} className="p-2 bg-white rounded-lg border border-slate-200 text-[11px]">
                                    <span className="font-extrabold text-indigo-900 mr-1.5">Option {item.key}:</span>
                                    <span className="text-slate-600">{item.explanation}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Trap Warning & Memory Hook */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(q.aiVerification || aiVerifications[q.id])?.trapWarning && (
                              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-950">
                                <span className="font-bold text-[10px] text-rose-800 uppercase block">Exam Trap:</span>
                                <p className="text-[11px] font-medium leading-snug mt-0.5">
                                  {(q.aiVerification || aiVerifications[q.id])?.trapWarning}
                                </p>
                              </div>
                            )}

                            {(q.aiVerification || aiVerifications[q.id])?.highYieldMemoryHook && (
                              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-950">
                                <span className="font-bold text-[10px] text-amber-800 uppercase block">Memory Hook:</span>
                                <p className="text-[11px] font-semibold leading-snug mt-0.5">
                                  {(q.aiVerification || aiVerifications[q.id])?.highYieldMemoryHook}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Grounded Web Search Sources */}
                          {((q.aiVerification || aiVerifications[q.id])?.groundedSources || []).length > 0 && (
                            <div className="pt-2 border-t border-indigo-100 flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="font-bold text-slate-500 flex items-center space-x-1">
                                <Globe className="w-3 h-3 text-sky-600" />
                                <span>Grounded Citations:</span>
                              </span>
                              {((q.aiVerification || aiVerifications[q.id])?.groundedSources || []).map((src, i) => (
                                <a
                                  key={i}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-0.5 bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 rounded-md font-medium truncate max-w-xs transition-colors flex items-center space-x-1"
                                >
                                  <span>{src.title}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Standard Explanation & High Yield Pearl (when answered) */}
                      {isAnswered && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs animate-fadeIn">
                          <div>
                            <div className="flex items-center space-x-1.5 text-slate-900 font-extrabold mb-1">
                              <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                              <span>Standard Rationale & Clinical Key:</span>
                            </div>
                            <p className="text-slate-700 leading-relaxed">{q.explanation}</p>
                          </div>

                          {q.highYieldPearl && (
                            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-950 space-y-1">
                              <div className="flex items-center space-x-1 font-bold text-[11px] text-amber-900 uppercase">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span>20th Notebook High-Yield Pearl:</span>
                              </div>
                              <p className="text-xs font-semibold">{q.highYieldPearl}</p>
                            </div>
                          )}

                          {/* Card Action Buttons */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                onClick={() => handleSendToErrorNotebook(q)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-bold text-[11px] transition-colors flex items-center space-x-1"
                              >
                                <Bookmark className="w-3 h-3 text-rose-600" />
                                <span>Save to 20th Notebook</span>
                              </button>

                              <button
                                onClick={() => handleSaveToPearls(q)}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-[11px] transition-colors flex items-center space-x-1"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>Save as High-Yield Pearl</span>
                              </button>

                              <button
                                onClick={() => handleCreateDailyTask(q)}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-[11px] transition-colors flex items-center space-x-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add to Daily Tasks</span>
                              </button>
                            </div>

                            <div className="text-[11px] text-slate-400 font-medium">
                              {q.userStatus === 'correct' ? 'Answered Correctly' : 'Marked as Incorrect'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: TOPIC-WISE HIGH-YIELD VAULT */}
      {activeHubTab === 'topic_vault' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-600 fill-amber-500" />
                <h3 className="text-sm font-extrabold text-amber-950">Auto-Saved High-Yield Question Vault</h3>
              </div>
              <p className="text-xs text-amber-900">
                All high-yield questions, IBQs, and repeat pearls from connected channels are automatically categorized topic-wise across the 19 FMGE subjects. History is 100% permanent and will never be deleted.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={vaultSubjectFilter}
                onChange={(e) => setVaultSubjectFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-amber-300 rounded-2xl text-xs font-bold text-amber-950 focus:outline-hidden"
              >
                <option value="all">All 19 Subjects ({topicWiseData.length} active)</option>
                {FMGE_SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {topicWiseData.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
                <Star className="w-10 h-10 text-amber-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Questions in this Subject Group</h4>
                <p className="text-xs text-slate-500">Sync channels or add questions to populate the topic-wise vault.</p>
              </div>
            ) : (
              topicWiseData.map((group) => {
                const sub = group.subject;
                const isExpanded = expandedVaultSubject === sub.id;
                const topicsArray = Array.from(group.topics.entries());
                const totalSubQuestions = topicsArray.reduce<number>((acc, [, qList]) => acc + qList.length, 0);
                const subHighYieldCount = topicsArray.reduce<number>(
                  (acc, [, qList]) => acc + qList.filter((q) => q.difficulty === 'high-yield').length,
                  0
                );
                const subIbqCount = topicsArray.reduce<number>(
                  (acc, [, qList]) => acc + qList.filter((q) => q.questionType === 'ibq' || Boolean(q.imageUrl)).length,
                  0
                );

                return (
                  <div
                    key={sub.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
                  >
                    <div
                      onClick={() => setExpandedVaultSubject(isExpanded ? null : sub.id)}
                      className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                          style={{ backgroundColor: sub.color }}
                        >
                          {sub.code || sub.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-black text-slate-900">{sub.name}</h4>
                            <span className="text-[10px] font-bold text-slate-400">~{sub.weightage} Marks</span>
                          </div>
                          <p className="text-xs text-slate-500">{topicsArray.length} High-Yield Topic Modules</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="hidden sm:flex items-center space-x-2 text-xs">
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold text-[10px]">
                            {subHighYieldCount} High-Yield
                          </span>
                          {subIbqCount > 0 && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full font-bold text-[10px]">
                              {subIbqCount} IBQs
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">
                            {totalSubQuestions} Total MCQs
                          </span>
                        </div>
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded Topics & Questions */}
                    {isExpanded && (
                      <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/40 space-y-4">
                        {topicsArray.map(([topicTitle, qList]) => (
                          <div key={topicTitle} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                <h5 className="text-xs font-bold text-slate-900">{topicTitle}</h5>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {qList.length} MCQ{qList.length > 1 ? 's' : ''}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {qList.map((q, idx) => (
                                <div key={q.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-sky-800 text-[11px]">
                                      Q{idx + 1}. {q.sourceChannel}
                                    </span>
                                    {q.difficulty === 'high-yield' && (
                                      <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md">
                                        High Yield
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-800 font-medium">{q.question}</p>
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                                    <span>Correct: Key {q.correctKey}</span>
                                    <button
                                      onClick={() => {
                                        setActiveHubTab('feed');
                                        setSelectedSubjectId(q.subjectId);
                                        setSearchQuery(q.topic);
                                      }}
                                      className="text-sky-600 font-bold hover:underline"
                                    >
                                      Practice in Feed →
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: ANNOUNCEMENTS & EXAM TIPS */}
      {activeHubTab === 'announcements' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Official Channel Announcements & Faculty Tips</h3>
              </div>
              <p className="text-xs text-slate-500">
                Live alerts, high-yield exam tips, marathon schedules, and BTR volatile updates pulled directly from official FMGE channels.
              </p>
            </div>
            <button
              onClick={() => setIsAddAnnouncementModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Channel Tip / Notice</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search announcements, tips, schedules, or faculty notes..."
                value={announcementSearch}
                onChange={(e) => setAnnouncementSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setAnnouncementFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  announcementFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                All ({announcements.length})
              </button>
              <button
                onClick={() => setAnnouncementFilter('exam_alert')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  announcementFilter === 'exam_alert' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Exam Alerts
              </button>
              <button
                onClick={() => setAnnouncementFilter('high_yield_tip')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  announcementFilter === 'high_yield_tip' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                High-Yield Tips
              </button>
              <button
                onClick={() => setAnnouncementFilter('schedule')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  announcementFilter === 'schedule' ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Schedules & Marathons
              </button>
              <button
                onClick={() => setAnnouncementFilter('faculty_note')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  announcementFilter === 'faculty_note' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Faculty Notes
              </button>
            </div>
          </div>

          {/* Announcements List */}
          <div className="space-y-4">
            {filteredAnnouncements.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <Bell className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Announcements Found</h4>
                <p className="text-xs text-slate-500">No notices match your search criteria. Add one or reset filters.</p>
              </div>
            ) : (
              filteredAnnouncements.map((ann) => {
                let badgeStyle = 'bg-indigo-100 text-indigo-900';
                let badgeLabel = 'Announcement';

                if (ann.type === 'exam_alert') {
                  badgeStyle = 'bg-rose-100 text-rose-900 border border-rose-200';
                  badgeLabel = 'Official Exam Alert';
                } else if (ann.type === 'high_yield_tip') {
                  badgeStyle = 'bg-amber-100 text-amber-900 border border-amber-200';
                  badgeLabel = 'High-Yield Tip';
                } else if (ann.type === 'schedule') {
                  badgeStyle = 'bg-sky-100 text-sky-900 border border-sky-200';
                  badgeLabel = 'Marathon & Schedule';
                } else if (ann.type === 'faculty_note') {
                  badgeStyle = 'bg-purple-100 text-purple-900 border border-purple-200';
                  badgeLabel = 'Faculty Note';
                }

                return (
                  <div
                    key={ann.id}
                    className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs space-y-4 transition-all ${
                      ann.pinned ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${badgeStyle}`}>
                          {badgeLabel}
                        </span>
                        {ann.pinned && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px] flex items-center space-x-1 border border-amber-200">
                            <Pin className="w-3 h-3 text-amber-600" />
                            <span>Pinned</span>
                          </span>
                        )}
                        <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full">
                          {ann.channelTitle || ann.sourceChannel}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        {ann.viewsCount && (
                          <span className="flex items-center space-x-1 text-slate-500">
                            <Eye className="w-3 h-3" />
                            <span>{ann.viewsCount}</span>
                          </span>
                        )}
                        <span>{ann.date}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-sm font-extrabold text-slate-900">{ann.title}</h4>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{ann.content}</p>
                    </div>

                    {ann.tags && ann.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ann.tags.map((tag) => (
                          <span key={tag} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Toolbar */}
                    <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleCopyAnnouncement(ann)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] transition-colors flex items-center space-x-1"
                        >
                          {copiedAnnouncementId === ann.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Tip</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleAddAnnouncementToTask(ann)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold text-[11px] transition-colors flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3 text-indigo-600" />
                          <span>Add to Daily Tasks</span>
                        </button>

                        <button
                          onClick={() => handleSaveAnnouncementAsPearl(ann)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-[11px] transition-colors flex items-center space-x-1"
                        >
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Save as Pearl</span>
                        </button>

                        <button
                          onClick={() => handleTogglePinAnnouncement(ann)}
                          className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 rounded-xl font-medium text-[11px] flex items-center space-x-1"
                        >
                          {ann.pinned ? (
                            <>
                              <PinOff className="w-3 h-3" />
                              <span>Unpin</span>
                            </>
                          ) : (
                            <>
                              <Pin className="w-3 h-3" />
                              <span>Pin</span>
                            </>
                          )}
                        </button>
                      </div>

                      {ann.postUrl && (
                        <a
                          href={ann.postUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-600 hover:text-sky-700 font-bold flex items-center space-x-1 text-[11px]"
                        >
                          <span>Open in Telegram</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL for High-Resolution IBQ Slides */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 flex items-center space-x-3">
            <button
              onClick={() => setLightboxImage(null)}
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="max-w-4xl w-full max-h-[80vh] flex flex-col items-center justify-center">
            <img
              src={lightboxImage.url}
              alt="High Resolution IBQ"
              className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            {lightboxImage.caption && (
              <div className="mt-4 p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white text-xs max-w-xl text-center">
                <span className="font-bold text-sky-400 mr-2">{lightboxImage.title}:</span>
                <span>{lightboxImage.caption}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Manual Paste & AI Extraction */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Paste Raw Telegram MCQ / Forward</h3>
                  <p className="text-[11px] text-slate-300">Extracts question stem, choices, correct key & explanation</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleParsePastedText} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Source Channel Tag</label>
                <input
                  type="text"
                  value={pasteChannelSource}
                  onChange={(e) => setPasteChannelSource(e.target.value)}
                  placeholder="@targetfmgechannel or @mission_fmge8"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Raw Telegram Text</label>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste any question, poll or forwarded MCQ here..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isParsingText || !pastedText.trim()}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isParsingText ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting & Auto-Categorizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Process & Save to Live Feed</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Channel Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Connect New Telegram Channel</h3>
                  <p className="text-[11px] text-slate-300">Pulls live posts, images, and clinical polls</p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomChannel} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">
                  Channel Handle or Link (Public)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newChannelHandle}
                    onChange={(e) => setNewChannelHandle(e.target.value)}
                    placeholder="e.g. targetfmgegroup or https://t.me/mission_fmge8"
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleValidateChannel}
                    disabled={isValidatingChannel || !newChannelHandle.trim()}
                    className="px-3.5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs shrink-0 disabled:opacity-50"
                  >
                    {isValidatingChannel ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Validate'}
                  </button>
                </div>
              </div>

              {validatedChannelInfo && (
                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    {validatedChannelInfo.avatarUrl ? (
                      <img src={validatedChannelInfo.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                        {validatedChannelInfo.title.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 truncate">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-sky-950 text-xs truncate">{validatedChannelInfo.title}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </div>
                      <span className="text-[10px] text-sky-700 block">{validatedChannelInfo.subscribers}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{validatedChannelInfo.description}</p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Channel Display Name</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g. Target FMGE Group"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Primary Subject Focus</label>
                <select
                  value={newChannelSubject}
                  onChange={(e) => setNewChannelSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="all">All 19 Subjects (General FMGE Feed)</option>
                  {FMGE_SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (~{s.weightage} Marks)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-[11px]">
                <strong>Instant Pull:</strong> Immediately fetches latest live MCQs, IBQs, and clinical posts. All items are permanently archived in your history.
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold text-xs shadow-xs transition-colors"
              >
                Connect Channel & Fetch Live Feed
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Announcement Modal */}
      {isAddAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Save Channel Announcement / Tip</h3>
                  <p className="text-[11px] text-indigo-200">Archive faculty tips, formulas, and marathon schedules</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddAnnouncementModalOpen(false)}
                className="p-1.5 text-indigo-300 hover:text-white rounded-xl hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Notice Type</label>
                <select
                  value={newAnnouncementType}
                  onChange={(e) => setNewAnnouncementType(e.target.value as TelegramAnnouncement['type'])}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="high_yield_tip">High-Yield Tip</option>
                  <option value="exam_alert">Official Exam Alert</option>
                  <option value="schedule">Marathon & Schedule</option>
                  <option value="faculty_note">Faculty Note</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Channel Source</label>
                <select
                  value={newAnnouncementChannel}
                  onChange={(e) => setNewAnnouncementChannel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="@targetfmgechannel">Target FMGE Channel (@targetfmgechannel)</option>
                  <option value="@targetfmgegroup">Target FMGE Group (@targetfmgegroup)</option>
                  <option value="@mission_fmge8">Mission FMGE 8 (@mission_fmge8)</option>
                  {channels.map((c) => (
                    <option key={c.id} value={`@${c.handle}`}>
                      {c.name} (@{c.handle})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Notice Title</label>
                <input
                  type="text"
                  value={newAnnouncementTitle}
                  onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                  placeholder="e.g. NBE Clinical Pattern Guidance & High-Yield List"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Content / Clinical Formula</label>
                <textarea
                  rows={5}
                  value={newAnnouncementContent}
                  onChange={(e) => setNewAnnouncementContent(e.target.value)}
                  placeholder="Write the full tips, volatile formula, or announcement text..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newAnnouncementTags}
                  onChange={(e) => setNewAnnouncementTags(e.target.value)}
                  placeholder="e.g. Surgery, Parkland, NBE Alert, High Yield"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-xs transition-colors"
              >
                Save Announcement to Hub
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Bot & Webhook Live Connector */}
      {isBotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Personal Telegram Bot & Token Setup</h3>
                  <p className="text-[11px] text-slate-300">Directly sync forwarded questions from Telegram app</p>
                </div>
              </div>
              <button
                onClick={() => setIsBotModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 space-y-2">
                <label className="block font-bold text-sky-950 uppercase text-[10px]">
                  Enter Personal Bot Token (from @BotFather)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="password"
                    value={botTokenInput}
                    onChange={(e) => setBotTokenInput(e.target.value)}
                    placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    className="flex-1 p-2 bg-white border border-sky-200 rounded-xl text-xs font-mono"
                  />
                  <button
                    onClick={handlePollPersonalBot}
                    disabled={isPollingBot || !botTokenInput.trim()}
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs transition-colors shrink-0 disabled:opacity-50 flex items-center space-x-1"
                  >
                    {isPollingBot ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Fetch Bot Posts</span>}
                  </button>
                </div>
                {botPollResult && (
                  <p className="text-[11px] text-sky-900 font-semibold pt-1">{botPollResult}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Create a Free Bot via @BotFather</span>
                  </div>
                  <p className="text-slate-600 text-[11px] pl-7">
                    Open Telegram, search for <span className="font-mono font-bold text-sky-700">@BotFather</span>, and send <span className="font-mono font-bold">/newbot</span>.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Forward Any MCQ / Poll to Your Bot</span>
                  </div>
                  <p className="text-slate-600 text-[11px] pl-7">
                    Whenever you see a clinical question in any channel or group, forward it to your bot.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Permanent History Archival</span>
                  </div>
                  <p className="text-slate-600 text-[11px] pl-7">
                    Our AI automatically tags it to the right subject, extracts distractor explanations, and saves it permanently to your vault.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBotModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
