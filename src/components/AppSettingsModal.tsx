import React, { useState, useEffect } from 'react';
import {
  X,
  Palette,
  Sliders,
  Clock,
  Volume2,
  HardDrive,
  ShieldAlert,
  Save,
  CheckCircle2,
  Sparkles,
  Eye,
  Brain,
  Droplet,
  Trash2,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  Zap
} from 'lucide-react';
import { AppSettings, AppState } from '../types';
import { getInitialAppState } from '../data/sampleData';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onUpdateSettings: (settings: AppSettings) => void;
  onResetState: (freshState: AppState) => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateSettings,
  onResetState,
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'mcq' | 'wellness' | 'storage'>('theme');
  const [settings, setSettings] = useState<AppSettings>(state.settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState<'none' | 'progress' | 'full'>('none');
  const [typedConfirm, setTypedConfirm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSettings(state.settings);
      setSaveSuccess(false);
      setResetConfirmation('none');
      setTypedConfirm('');
    }
  }, [isOpen, state.settings]);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 500);
  };

  const handleResetProgress = () => {
    const fresh = getInitialAppState();
    const cleanProgressState: AppState = {
      ...fresh,
      settings,
      bookmarkedPearlIds: state.bookmarkedPearlIds,
      customPearls: state.customPearls,
      telegramChannels: state.telegramChannels,
      telegramQuestions: state.telegramQuestions,
      telegramAnnouncements: state.telegramAnnouncements,
    };
    onResetState(cleanProgressState);
    setResetConfirmation('none');
    onClose();
  };

  const handleResetFullAccount = () => {
    if (typedConfirm.trim().toUpperCase() !== 'RESET') return;
    const blank = getInitialAppState();
    onResetState(blank);
    setResetConfirmation('none');
    setTypedConfirm('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-['Plus_Jakarta_Sans']">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Sliders className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h3 className="font-['Outfit'] text-base font-bold text-slate-900">
                App Settings & Preferences
              </h3>
              <p className="text-xs text-slate-400">
                Visual themes, study pacing, cognitive breaks & storage
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

        {/* Tab Selection */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-white">
          {[
            { id: 'theme', label: 'Themes & Visuals', icon: Palette },
            { id: 'mcq', label: 'Study Pacing & MCQs', icon: Clock },
            { id: 'wellness', label: 'Cognitive Breaks', icon: Droplet },
            { id: 'storage', label: 'Storage & Reset', icon: HardDrive },
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

        {/* Save feedback banner */}
        {saveSuccess && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ================= TAB 1: THEMES & VISUALS ================= */}
          {activeTab === 'theme' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Study Atmosphere Wallpaper Mode */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Study Artwork Atmosphere
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose your ambient background or let it shift automatically with the time of day.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'auto', label: 'Automatic Circadian', desc: 'Syncs with time of day', icon: Zap },
                    { id: 'morning', label: 'Morning Desk', desc: '5 AM – 12 PM focus', icon: Sun },
                    { id: 'sunset', label: 'Sunset Horizon', desc: '12 PM – 6 PM focus', icon: Sunset },
                    { id: 'night', label: 'Rainy Night Lamp', desc: '6 PM – 5 AM focus', icon: Moon },
                  ].map((item) => {
                    const Icon = item.icon;
                    const selected = (settings.bgTheme || 'auto') === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSettings({ ...settings, bgTheme: item.id as any })}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          selected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Icon className={`h-4 w-4 ${selected ? 'text-amber-400' : 'text-slate-500'}`} />
                          {selected && <CheckCircle2 className="h-4 w-4 text-sky-400" />}
                        </div>
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className={`text-[10px] mt-0.5 ${selected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {item.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wallpaper Visibility Opacity */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                      Artwork Visibility
                    </h4>
                    <p className="text-xs text-slate-400">Controls backdrop contrast intensity</p>
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {Math.round((settings.bgOpacity ?? 0.8) * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Subtle (40%)', val: 0.4 },
                    { label: 'Vibrant (80%)', val: 0.8 },
                    { label: 'Minimal (Off)', val: 0.0 },
                  ].map((preset) => {
                    const active = (settings.bgOpacity ?? 0.8) === preset.val;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSettings({ ...settings, bgOpacity: preset.val })}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: MCQ & STUDY PACING ================= */}
          {activeTab === 'mcq' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Timer Pacing */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    MCQ Practice Timer Pacing
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Standardizes speed drills to simulate real NBE 1-minute exam pressure.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '60s NBE Real Exam', val: 60, desc: 'Real exam pacing' },
                    { label: '120s Deep Learning', val: 120, desc: 'Detailed analysis' },
                    { label: 'Untimed', val: 0, desc: 'No time limits' },
                  ].map((preset) => {
                    const active = (settings.mcqTimerSeconds ?? 60) === preset.val;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSettings({ ...settings, mcqTimerSeconds: preset.val })}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="text-xs font-bold">{preset.label}</div>
                        <div className={`text-[10px] mt-0.5 ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                          {preset.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation Reveal Mode */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Explanation Reveal Behavior
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    When to show answer rationale and high-yield discriminator pearls.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'instant', label: 'Instant Reveal on Click', desc: 'Immediate learning feedback' },
                    { id: 'summary', label: 'Session End Summary', desc: 'Mock exam style review' },
                  ].map((mode) => {
                    const active = (settings.explanationMode || 'instant') === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSettings({ ...settings, explanationMode: mode.id as any })}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="text-xs font-bold">{mode.label}</div>
                        <div className={`text-[10px] mt-0.5 ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                          {mode.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: COGNITIVE BREAKS & WELLNESS ================= */}
          {activeTab === 'wellness' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Hydration & 20-20-20 Eye Rest Cadence
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Periodic clinical prompts to prevent mental fatigue and preserve retinal focus.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Every 30m', val: 30 },
                    { label: 'Every 45m', val: 45 },
                    { label: 'Every 60m', val: 60 },
                    { label: 'Disabled', val: 0 },
                  ].map((preset) => {
                    const active = (settings.breakReminderInterval ?? 45) === preset.val;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSettings({ ...settings, breakReminderInterval: preset.val })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sound & Feedback */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900">Audio Feedback &amp; Timer Chimes</span>
                  <p className="text-xs text-slate-500">Play subtle cue sounds on correct MCQs and study milestones.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, hapticSoundEnabled: !(settings.hapticSoundEnabled ?? true) })}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    (settings.hapticSoundEnabled ?? true)
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {(settings.hapticSoundEnabled ?? true) ? 'Enabled' : 'Muted'}
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 4: STORAGE & DATA OPERATIONS ================= */}
          {activeTab === 'storage' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Storage Telemetry */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  LOCAL SYSTEM STORAGE
                </span>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Progress Ledger & Cache</span>
                  <span className="font-mono font-bold text-slate-900">~148 KB</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>19 Subjects Indexed</span>
                  <span className="font-mono font-bold text-emerald-600">100% Ready</span>
                </div>
              </div>

              {/* Reset Operations */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-4">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <ShieldAlert className="h-4 w-4" />
                  <span>DANGER ZONE — DATA OPERATIONS</span>
                </div>

                <div className="space-y-3">
                  {/* Reset Study Progress */}
                  <div className="p-3.5 rounded-xl bg-white border border-rose-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Reset Study Progress (0% Mastery)</h4>
                      <p className="text-[11px] text-slate-400">Clears notes, QBank, and revision checkboxes across all 19 subjects.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetConfirmation('progress')}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
                    >
                      Reset Progress
                    </button>
                  </div>

                  {resetConfirmation === 'progress' && (
                    <div className="p-3 bg-white rounded-xl border border-rose-300 space-y-2 animate-in fade-in">
                      <p className="text-xs text-rose-700 font-medium">Reset all 19 subject checkboxes to 0%?</p>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setResetConfirmation('none')}
                          className="px-3 py-1 text-xs text-slate-600 bg-slate-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleResetProgress}
                          className="px-3 py-1 text-xs text-white bg-rose-600 rounded-lg font-bold"
                        >
                          Yes, Reset to 0%
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Full Wipe */}
                  <div className="p-3.5 rounded-xl bg-white border border-rose-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Full Factory Wipe</h4>
                      <p className="text-[11px] text-slate-400">Permanently clears entire database including mistakes and grand tests.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetConfirmation('full')}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shrink-0"
                    >
                      Wipe Data
                    </button>
                  </div>

                  {resetConfirmation === 'full' && (
                    <div className="p-3 bg-white rounded-xl border border-rose-300 space-y-2 animate-in fade-in">
                      <p className="text-xs text-rose-700 font-medium">Type <span className="font-bold">RESET</span> to confirm factory wipe:</p>
                      <input
                        type="text"
                        value={typedConfirm}
                        onChange={(e) => setTypedConfirm(e.target.value)}
                        placeholder="RESET"
                        className="w-full px-3 py-1.5 border border-rose-300 rounded-lg text-xs font-mono"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setResetConfirmation('none')}
                          className="px-3 py-1 text-xs text-slate-600 bg-slate-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleResetFullAccount}
                          disabled={typedConfirm.trim().toUpperCase() !== 'RESET'}
                          className="px-3 py-1 text-xs text-white bg-rose-600 rounded-lg font-bold disabled:opacity-40"
                        >
                          Confirm Wipe
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            className="inline-flex items-center gap-1.5 px-6 py-2 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
