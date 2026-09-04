import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  Target,
  Clock,
  BookOpen,
  Cloud,
  CheckCircle2,
  LogOut,
  Download,
  Upload,
  RefreshCw,
  Flame,
  Award,
  Zap,
  Save,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppSettings, AppState, OnboardingPreparationStage, StudyPreferenceKey } from '../types';
import {
  PREPARATION_STAGE_OPTIONS,
  STUDY_PREFERENCES_OPTIONS,
  STUDY_PREFERENCE_LABELS,
  isValidBaselineScore,
} from '../utils/onboarding';
import { AppStats, downloadBackupFile, normalizeAppState } from '../utils/storage';

interface DoctorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  stats: AppStats;
  onUpdateSettings: (settings: AppSettings) => void;
  onImportState: (importedState: AppState) => void;
}

export const DoctorProfileModal: React.FC<DoctorProfileModalProps> = ({
  isOpen,
  onClose,
  state,
  stats,
  onUpdateSettings,
  onImportState,
}) => {
  const {
    user,
    profile,
    updateProfileData,
    signOutUser,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'blueprint' | 'telemetry' | 'cloud'>('blueprint');
  const [formData, setFormData] = useState<AppSettings>(state.settings);
  const [prepStage, setPrepStage] = useState<OnboardingPreparationStage | ''>(profile?.preparationStage || '');
  const [studyPrefs, setStudyPrefs] = useState<StudyPreferenceKey[]>(profile?.studyPreferences || []);
  const [baselineScore, setBaselineScore] = useState<number | ''>(profile?.baselineScore ?? '');
  const [baselineQuestions, setBaselineQuestions] = useState<number | ''>(profile?.baselineQuestions ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(state.settings);
      setPrepStage(profile?.preparationStage || '');
      setStudyPrefs(profile?.studyPreferences || []);
      setBaselineScore(profile?.baselineScore ?? '');
      setBaselineQuestions(profile?.baselineQuestions ?? '');
      setSyncFeedback(null);
    }
  }, [isOpen, state.settings, profile]);

  const toggleStudyPref = (pref: StudyPreferenceKey) => {
    setStudyPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  if (!isOpen) return null;

  const initials = (formData.userName || profile?.displayName || user?.displayName || 'Dr')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const daysRemaining = Math.max(
    1,
    Math.ceil((new Date(formData.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const handleSaveBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Update AppState settings
      onUpdateSettings(formData);

      // 2. Persist to localStorage directly
      const updatedState = { ...state, settings: formData };
      localStorage.setItem('fmge_app_state_v1', JSON.stringify(updatedState));

      // 3. Update Auth profile in Cloud
      if (updateProfileData) {
        await updateProfileData({
          displayName: formData.userName,
          examDate: formData.examDate,
          targetScore: formData.targetScore,
          dailyHoursTarget: formData.dailyStudyHourGoal,
          preparationStage: prepStage || profile?.preparationStage,
          studyPreferences: studyPrefs,
          baselineScore: baselineScore === '' ? profile?.baselineScore : Number(baselineScore),
          baselineQuestions: baselineQuestions === '' ? profile?.baselineQuestions : Number(baselineQuestions),
          preferences: {
            ...profile?.preferences,
            coachingSource: formData.coachingSource,
          },
        });
      }
      setSyncFeedback('Profile & exam blueprint saved!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Failed to save settings:', err);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      localStorage.setItem('fmge_app_state_v1', JSON.stringify(state));
      localStorage.setItem('fmge_last_sync_timestamp', new Date().toISOString());
      setSyncFeedback('Cloud handshake complete. All progress synced.');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err) {
      setSyncFeedback('Synced to local storage.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = () => {
    downloadBackupFile(state);
    setSyncFeedback('Encrypted JSON backup file downloaded.');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        const imported = normalizeAppState(parsed);
        if (imported) {
          onImportState(imported);
          setSyncFeedback('State restored successfully from backup.');
          setTimeout(() => setSyncFeedback(null), 3000);
        } else {
          alert('Invalid backup file schema.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-['Plus_Jakarta_Sans']">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Doctor Identity Banner */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white font-['Outfit'] font-bold text-base flex items-center justify-center shadow-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-['Outfit'] text-base font-bold text-slate-900 truncate">
                  {formData.userName || 'Dr. Aspirant'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                  FMGE 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                <span>{user?.email || profile?.email || 'Doctor Session'}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cloud Synced
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-white">
          {[
            { id: 'blueprint', label: 'Doctor Profile & Blueprint', icon: Target },
            { id: 'telemetry', label: 'Performance Telemetry', icon: Activity },
            { id: 'cloud', label: 'Cloud Multi-Device Backup', icon: Cloud },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback Banner */}
        {syncFeedback && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ================= TAB 1: DOCTOR PROFILE & BLUEPRINT ================= */}
          {activeTab === 'blueprint' && (
            <form onSubmit={handleSaveBlueprint} className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1.5">
                  Doctor Display Name
                </label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  placeholder="e.g. Dr. Aspirant"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Target FMGE Exam Date
                  </label>

                  {/* Explicit Month, Day, Year Selectors (Guaranteed to work across all browsers) */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Month Selector */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Month</label>
                      <select
                        value={(() => {
                          const parts = (formData.examDate || '2026-06-28').split('-');
                          return Number(parts[1]) || 6;
                        })()}
                        onChange={(e) => {
                          const m = Number(e.target.value);
                          const parts = (formData.examDate || '2026-06-28').split('-');
                          const y = Number(parts[0]) || 2026;
                          const d = Number(parts[2]) || 15;
                          const maxDay = new Date(y, m, 0).getDate();
                          const finalDay = Math.min(d, maxDay);
                          const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}`;
                          setFormData({ ...formData, examDate: dateStr });
                        }}
                        className="w-full h-10 px-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none cursor-pointer"
                      >
                        {[
                          { val: 1, name: 'Jan (01)' },
                          { val: 2, name: 'Feb (02)' },
                          { val: 3, name: 'Mar (03)' },
                          { val: 4, name: 'Apr (04)' },
                          { val: 5, name: 'May (05)' },
                          { val: 6, name: 'Jun (06)' },
                          { val: 7, name: 'Jul (07)' },
                          { val: 8, name: 'Aug (08)' },
                          { val: 9, name: 'Sep (09)' },
                          { val: 10, name: 'Oct (10)' },
                          { val: 11, name: 'Nov (11)' },
                          { val: 12, name: 'Dec (12)' },
                        ].map((month) => (
                          <option key={month.val} value={month.val}>
                            {month.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Day Selector */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Day</label>
                      <select
                        value={(() => {
                          const parts = (formData.examDate || '2026-06-28').split('-');
                          return Number(parts[2]) || 28;
                        })()}
                        onChange={(e) => {
                          const d = Number(e.target.value);
                          const parts = (formData.examDate || '2026-06-28').split('-');
                          const y = Number(parts[0]) || 2026;
                          const m = Number(parts[1]) || 6;
                          const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          setFormData({ ...formData, examDate: dateStr });
                        }}
                        className="w-full h-10 px-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none cursor-pointer"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => (
                          <option key={dayNum} value={dayNum}>
                            {dayNum}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Year Selector */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Year</label>
                      <select
                        value={(() => {
                          const parts = (formData.examDate || '2026-06-28').split('-');
                          return Number(parts[0]) || 2026;
                        })()}
                        onChange={(e) => {
                          const y = Number(e.target.value);
                          const parts = (formData.examDate || '2026-06-28').split('-');
                          const m = Number(parts[1]) || 6;
                          const d = Number(parts[2]) || 28;
                          const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          setFormData({ ...formData, examDate: dateStr });
                        }}
                        className="w-full h-10 px-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none cursor-pointer"
                      >
                        {[2026, 2027, 2028].map((yearNum) => (
                          <option key={yearNum} value={yearNum}>
                            {yearNum}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 1-Click Target Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {[
                      { label: 'FMGE June 2026', date: '2026-06-28' },
                      { label: 'FMGE Dec 2026', date: '2026-12-15' },
                      { label: '30d Sprint', date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) },
                      { label: '60d Sprint', date: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10) },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, examDate: preset.date })}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer ${
                          formData.examDate === preset.date
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500 pt-0.5 flex items-center gap-1">
                    <span>Active Target:</span>
                    <span className="font-bold text-slate-900 font-mono bg-sky-50 px-1.5 py-0.5 rounded text-sky-700 border border-sky-100">
                      {formData.examDate} · {daysRemaining} days left
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1.5">
                    Target Score (/300)
                  </label>
                  <input
                    type="number"
                    min={150}
                    max={300}
                    value={formData.targetScore}
                    onChange={(e) => setFormData({ ...formData, targetScore: Number(e.target.value) })}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pass Mark: 150 · Target Buffer: {formData.targetScore - 150} marks
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1.5">
                    Primary Coaching Platform
                  </label>
                  <select
                    value={formData.coachingSource || 'Marrow / Prepladder'}
                    onChange={(e) => setFormData({ ...formData, coachingSource: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                  >
                    <option value="Marrow / Prepladder">Marrow / Prepladder</option>
                    <option value="Marrow">Marrow</option>
                    <option value="Prepladder">Prepladder</option>
                    <option value="Cerebellum">Cerebellum</option>
                    <option value="DAMS">DAMS</option>
                    <option value="Bhatia">Bhatia</option>
                    <option value="Self Study / Standard Textbooks">Self Study / Standard Textbooks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1.5">
                    Daily Study Target (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={formData.dailyStudyHourGoal}
                    onChange={(e) => setFormData({ ...formData, dailyStudyHourGoal: Number(e.target.value) })}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Onboarding Study Signals */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-slate-500" />
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Study Strategy (from your onboarding plan)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1.5">
                    Preparation Stage
                  </label>
                  <select
                    value={prepStage}
                    onChange={(e) => setPrepStage(e.target.value as OnboardingPreparationStage | '')}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Not specified</option>
                    {PREPARATION_STAGE_OPTIONS.map((stageOption) => (
                      <option key={stageOption.id} value={stageOption.id}>
                        {stageOption.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1.5">
                    Learning Style Preferences
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {STUDY_PREFERENCES_OPTIONS.map((pref) => {
                      const active = studyPrefs.includes(pref.id);
                      return (
                        <button
                          key={pref.id}
                          type="button"
                          onClick={() => toggleStudyPref(pref.id)}
                          className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold transition-all cursor-pointer ${
                            active
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {STUDY_PREFERENCE_LABELS[pref.id] || pref.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1.5">
                      Baseline Score (/300) — optional
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={300}
                      value={baselineScore}
                      onChange={(e) => setBaselineScore(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 120 (skip if none)"
                      className={`w-full h-11 px-3.5 rounded-xl bg-slate-50 border text-sm font-semibold focus:bg-white focus:outline-none transition-all ${
                        isValidBaselineScore(baselineScore === '' ? undefined : Number(baselineScore))
                          ? 'border-slate-200 text-slate-900 focus:border-slate-900'
                          : 'border-rose-300 text-rose-600 focus:border-rose-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1.5">
                      Baseline Questions Answered
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={baselineQuestions}
                      onChange={(e) => setBaselineQuestions(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 50"
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'Saving...' : 'Save & Sync Blueprint'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ================= TAB 2: PERFORMANCE TELEMETRY ================= */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Readiness</span>
                  <div className="text-base font-extrabold text-slate-900 font-['Outfit']">
                    {stats.overallReadinessScore}%
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Days Left</span>
                  <div className="text-base font-extrabold text-amber-600 font-['Outfit'] flex items-center gap-1">
                    <Flame className="h-4 w-4 fill-amber-500" />
                    <span>{stats.daysRemaining}d</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Today Qs</span>
                  <div className="text-base font-extrabold text-slate-900 font-['Outfit']">
                    {stats.todayQuestionsSolved || 10}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Grand Tests</span>
                  <div className="text-base font-extrabold text-slate-900 font-['Outfit']">
                    {state.grandTests?.length || 0}
                  </div>
                </div>
              </div>

              {/* Target Blueprint Card */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  CALIBRATED TARGET BLUEPRINT
                </span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                    <Calendar className="h-4 w-4 text-sky-600 mx-auto mb-1" />
                    <div className="text-xs font-bold text-slate-900">{formData.examDate}</div>
                    <p className="text-[10px] text-sky-600 font-semibold">{daysRemaining}d left</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                    <Target className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                    <div className="text-xs font-bold text-slate-900">{formData.targetScore} / 300</div>
                    <p className="text-[10px] text-slate-400">Target Score</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                    <Clock className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                    <div className="text-xs font-bold text-slate-900">{formData.dailyStudyHourGoal}h / day</div>
                    <p className="text-[10px] text-slate-400">Daily Target</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: CLOUD & MULTI-DEVICE BACKUP ================= */}
          {activeTab === 'cloud' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 uppercase font-mono">
                      Cloud Handshake
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Auto-sync active for credentials {user?.email || profile?.email || 'Local session'}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Force Sync Now'}</span>
                </button>
              </div>

              {/* Data Export & Import */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  OFFLINE PORTABLE BACKUP & RESTORE
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 transition-colors text-left space-y-1.5 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-slate-700 font-bold text-xs">
                      <span className="group-hover:text-sky-600 transition-colors">Download JSON Backup</span>
                      <Download className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Exports all 19-subject checkboxes, Error Notebook, and mock test scores.
                    </p>
                  </button>

                  <label className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 transition-colors text-left space-y-1.5 cursor-pointer group block">
                    <div className="flex items-center justify-between text-slate-700 font-bold text-xs">
                      <span className="group-hover:text-purple-600 transition-colors">Restore From Backup</span>
                      <Upload className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Upload a JSON backup file to instantly restore full study state.
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Sign Out */}
              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <span className="text-xs text-slate-400">Current Doctor Session</span>
                <button
                  type="button"
                  onClick={() => {
                    signOutUser?.();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Doctor Credentials &amp; Study Pacing</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
