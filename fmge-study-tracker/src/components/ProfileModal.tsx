import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Calendar,
  Target,
  Clock,
  Sparkles,
  Flame,
  Award,
  BookOpen,
  Cloud,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Settings,
  Database,
  Edit2,
  Save,
  Download,
  Upload,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppStats, downloadBackupFile, exportAppStateToJSON } from '../utils/storage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: AppStats;
  onOpenSettings: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  stats,
  onOpenSettings,
}) => {
  const {
    user,
    profile,
    syncStatus,
    appState,
    updateProfileData,
    forceSyncToCloud,
    signOutUser,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'backup'>('overview');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState(profile?.displayName || user?.displayName || '');
  const [editExamDate, setEditExamDate] = useState(profile?.examDate || '2026-10-15');
  const [editTargetScore, setEditTargetScore] = useState(profile?.targetScore || 185);
  const [editDailyHours, setEditDailyHours] = useState(profile?.dailyHoursTarget || 6);
  const [editCoachingSource, setEditCoachingSource] = useState(
    profile?.preferences?.coachingSource || 'Marrow'
  );

  if (!isOpen) return null;

  const initials = (profile?.displayName || user?.displayName || user?.email || 'Dr')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfileData({
        displayName: editName.trim(),
        examDate: editExamDate,
        targetScore: editTargetScore,
        dailyHoursTarget: editDailyHours,
        preferences: {
          ...profile?.preferences,
          coachingSource: editCoachingSource,
        },
      });
      setActiveTab('overview');
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    setSyncFeedback(null);
    try {
      await forceSyncToCloud();
      setSyncFeedback('Cloud sync successful! All records up to date.');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err: any) {
      setSyncFeedback('Sync failed. Please check network connection.');
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutUser();
      onClose();
    } catch (err) {
      console.error('Sign out error:', err);
      setSyncFeedback('Sign out paused because your latest progress could not be saved. Please retry after checking your connection.');
      setIsSigningOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-[#cfe2df] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Avatar & User Info */}
        <div className="relative bg-gradient-to-r from-[#084d50] via-[#0d6866] to-[#12585c] p-6 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition-all"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-4">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                referrerPolicy="no-referrer"
                className="h-16 w-16 rounded-2xl border-2 border-white/40 object-cover shadow-md"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold font-display text-white border border-white/20 shadow-inner">
                {initials || 'DR'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xl font-bold tracking-tight text-white">
                  {profile?.displayName || user?.displayName || 'Dr. Doctor'}
                </h2>
                <span className="shrink-0 rounded-full bg-[#f6d58a]/20 border border-[#f6d58a]/40 px-2 py-0.5 text-[10px] font-bold text-[#fce8b3]">
                  FMGE 2026
                </span>
              </div>
              <p className="truncate text-xs text-[#b8ded9] flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user?.email || profile?.email || 'Authenticated User'}</span>
              </p>

              {/* Sync Status Badge */}
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    syncStatus === 'synced'
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                      : syncStatus === 'syncing'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                      : syncStatus === 'offline'
                      ? 'bg-slate-500/20 text-slate-200 border border-slate-400/30'
                      : 'bg-rose-500/20 text-rose-200 border border-rose-400/30'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      syncStatus === 'synced'
                        ? 'bg-emerald-400'
                        : syncStatus === 'syncing'
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-rose-400'
                    }`}
                  />
                  {syncStatus === 'synced'
                    ? 'Cloud Synced'
                    : syncStatus === 'syncing'
                    ? 'Syncing...'
                    : syncStatus === 'offline'
                    ? 'Offline (Cached)'
                    : 'Sync Error'}
                </span>
                <span className="text-[10px] text-white/60">
                  MacBook · iPhone · iPad
                </span>
              </div>
            </div>
          </div>

          {/* Sub-nav Tabs */}
          <div className="mt-5 flex gap-2 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-[#084d50] shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              Overview &amp; Metrics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'edit'
                  ? 'bg-white text-[#084d50] shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'backup'
                  ? 'bg-white text-[#084d50] shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              Data &amp; Backup
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          
          {/* TAB 1: OVERVIEW & KEY METRICS */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Target Plan Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#739291] mb-2.5">
                  Target FMGE Blueprint
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-[#cfe2df] bg-[#f8fbfa] p-3 text-center">
                    <Calendar className="h-4 w-4 mx-auto text-[#0d6866] mb-1" />
                    <span className="block text-[10px] uppercase font-bold text-[#88a5a4]">Exam Date</span>
                    <span className="font-mono text-sm font-bold text-[#183d3b]">
                      {profile?.examDate || '2026-10-15'}
                    </span>
                    <span className="block text-[10px] font-bold text-[#0d6866]">
                      {stats.daysRemaining} days left
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#cfe2df] bg-[#f8fbfa] p-3 text-center">
                    <Target className="h-4 w-4 mx-auto text-[#e8806d] mb-1" />
                    <span className="block text-[10px] uppercase font-bold text-[#88a5a4]">Target Score</span>
                    <span className="font-mono text-sm font-bold text-[#183d3b]">
                      {profile?.targetScore || 185} / 300
                    </span>
                    <span className="block text-[10px] font-bold text-[#e8806d]">
                      {((profile?.targetScore || 185) / 3).toFixed(0)}% Target
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#cfe2df] bg-[#f8fbfa] p-3 text-center">
                    <Clock className="h-4 w-4 mx-auto text-[#0d6866] mb-1" />
                    <span className="block text-[10px] uppercase font-bold text-[#88a5a4]">Study Target</span>
                    <span className="font-mono text-sm font-bold text-[#183d3b]">
                      {profile?.dailyHoursTarget || 6}h / day
                    </span>
                    <span className="block text-[10px] font-bold text-[#0d6866]">
                      {profile?.preferences?.coachingSource || 'Marrow'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Preparation Summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#739291] mb-2.5">
                  Live Preparation Statistics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-2xl border border-[#cfe2df] bg-white p-3 shadow-xs">
                    <span className="block text-[10px] font-bold text-[#739291] uppercase">Current Readiness</span>
                    <p className="font-mono text-lg font-bold text-[#0d6866] mt-0.5">
                      {stats.overallReadinessScore}%
                    </p>
                    <div className="w-full bg-[#e2edea] h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-[#0d6866] h-full rounded-full"
                        style={{ width: `${Math.min(100, stats.overallReadinessScore)}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#cfe2df] bg-white p-3 shadow-xs">
                    <span className="block text-[10px] font-bold text-[#739291] uppercase">Study Streak</span>
                    <p className="font-mono text-lg font-bold text-[#e8806d] mt-0.5 flex items-center gap-1">
                      <Flame className="h-4 w-4 fill-[#e8806d]" />
                      <span>{Object.keys(appState.studyLogs).length || 1} days</span>
                    </p>
                    <span className="block text-[10px] text-[#739291] mt-1.5">
                      {stats.todayStudyMinutes}m today
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#cfe2df] bg-white p-3 shadow-xs">
                    <span className="block text-[10px] font-bold text-[#739291] uppercase">Total MCQs</span>
                    <p className="font-mono text-lg font-bold text-[#183d3b] mt-0.5">
                      {stats.completedQBankTopics * 50 + stats.todayQuestionsSolved}
                    </p>
                    <span className="block text-[10px] text-[#739291] mt-1.5">
                      {stats.todayQuestionsSolved} solved today
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#cfe2df] bg-white p-3 shadow-xs">
                    <span className="block text-[10px] font-bold text-[#739291] uppercase">Grand Tests</span>
                    <p className="font-mono text-lg font-bold text-[#183d3b] mt-0.5">
                      {stats.totalGTsCount}
                    </p>
                    <span className="block text-[10px] text-[#0d6866] mt-1.5 font-semibold">
                      {stats.latestGTScore ? `Latest: ${stats.latestGTScore}/300` : 'No GT yet'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cloud Synchronization Details */}
              <div className="rounded-2xl border border-[#cfe2df] bg-[#f8fbfa] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#e3f0ee] text-[#084d50] flex items-center justify-center">
                    <Cloud className="h-5 w-5 text-[#0d6866]" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#183d3b]">Cloud Storage &amp; Multi-Device</h5>
                    <p className="text-[11px] text-[#527776]">
                      Synced across MacBook, iPhone &amp; iPad on account {user?.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isManualSyncing}
                  className="rounded-xl border border-[#cfe2df] bg-white px-3 py-1.5 text-xs font-bold text-[#0d6866] hover:bg-[#f2f8f7] transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Now</span>
                </button>
              </div>

              {syncFeedback && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{syncFeedback}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EDIT PROFILE */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#183d3b] mb-1">
                  Display Name / Doctor Title
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Dr. Imdadul"
                  className="w-full rounded-xl border border-[#cfe2df] bg-[#fbfdfc] px-3.5 py-2 text-sm text-[#183d3b] focus:border-[#0d6866] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#183d3b] mb-1">
                  Target FMGE Exam Date
                </label>
                <input
                  type="date"
                  required
                  value={editExamDate}
                  onChange={(e) => setEditExamDate(e.target.value)}
                  className="w-full rounded-xl border border-[#cfe2df] bg-[#fbfdfc] px-3.5 py-2 text-sm text-[#183d3b] focus:border-[#0d6866] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#183d3b] mb-1">
                    Target Score (/300)
                  </label>
                  <input
                    type="number"
                    min={150}
                    max={280}
                    value={editTargetScore}
                    onChange={(e) => setEditTargetScore(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#cfe2df] bg-[#fbfdfc] px-3.5 py-2 text-sm font-mono text-[#183d3b] focus:border-[#0d6866] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#183d3b] mb-1">
                    Daily Study Target (Hours)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={16}
                    value={editDailyHours}
                    onChange={(e) => setEditDailyHours(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#cfe2df] bg-[#fbfdfc] px-3.5 py-2 text-sm font-mono text-[#183d3b] focus:border-[#0d6866] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#183d3b] mb-1">
                  Primary Coaching Platform
                </label>
                <select
                  value={editCoachingSource}
                  onChange={(e) => setEditCoachingSource(e.target.value)}
                  className="w-full rounded-xl border border-[#cfe2df] bg-[#fbfdfc] px-3.5 py-2 text-sm text-[#183d3b] focus:border-[#0d6866] focus:outline-none"
                >
                  <option value="Marrow">Marrow</option>
                  <option value="Prepladder">Prepladder</option>
                  <option value="Cerebellum">Cerebellum</option>
                  <option value="DAMS">DAMS</option>
                  <option value="Bhatia">Bhatia</option>
                  <option value="Self Study">Self Study / Standard Textbooks</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-[#628084] hover:bg-[#f2f8f7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-xl bg-[#084d50] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#063c3e] transition-all disabled:opacity-60"
                >
                  {isSaving ? (
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: DATA & BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#cfe2df] bg-[#f8fbfa] p-4 space-y-3">
                <h5 className="text-xs font-bold text-[#183d3b] flex items-center gap-2">
                  <Download className="h-4 w-4 text-[#0d6866]" />
                  <span>Download Offline JSON Backup</span>
                </h5>
                <p className="text-xs text-[#527776]">
                  Export a timestamped JSON backup file containing your complete 19-subject syllabus completions, Grand Test history, Error Notebook, and Medical Pearls.
                </p>
                <button
                  type="button"
                  onClick={() => downloadBackupFile(appState)}
                  className="flex items-center gap-2 rounded-xl bg-[#084d50] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#063c3e] transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Backup File</span>
                </button>
              </div>

              <div className="rounded-2xl border border-[#cfe2df] bg-[#f8fbfa] p-4 space-y-3">
                <h5 className="text-xs font-bold text-[#183d3b] flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-[#0d6866]" />
                  <span>Force Cloud Synchronization</span>
                </h5>
                <p className="text-xs text-[#527776]">
                  Upload current in-memory study state immediately to the Firestore cloud database.
                </p>
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isManualSyncing}
                  className="flex items-center gap-2 rounded-xl border border-[#cfe2df] bg-white px-4 py-2 text-xs font-bold text-[#0d6866] hover:bg-[#f2f8f7] transition-all"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                  <span>{isManualSyncing ? 'Syncing...' : 'Sync to Cloud Now'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#cfe2df] bg-[#f7faf9] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[#cfe2df] bg-white px-3.5 py-2 text-xs font-bold text-[#345856] hover:bg-[#edf5f4] transition-all"
            >
              <Settings className="h-3.5 w-3.5 text-[#0d6866]" />
              <span>App Settings</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-1.5 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-3.5 py-2 text-xs font-bold text-[#991b1b] hover:bg-[#fee2e2] transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
