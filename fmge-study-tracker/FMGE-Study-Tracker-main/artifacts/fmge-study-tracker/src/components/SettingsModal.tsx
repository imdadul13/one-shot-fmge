import React, { useEffect, useState } from 'react';
import {
  X,
  Settings,
  Download,
  Upload,
  RefreshCcw,
  ShieldAlert,
  User,
  Calendar,
  Target,
  Award,
  BookOpen
} from 'lucide-react';
import { AppSettings, AppState } from '../types';
import { downloadBackupFile, normalizeAppState } from '../utils/storage';
import { getInitialAppState } from '../data/sampleData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onUpdateSettings: (settings: AppSettings) => void;
  onImportState: (importedState: AppState) => void;
  onResetState: (freshState: AppState) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateSettings,
  onImportState,
  onResetState,
}) => {
  const [formData, setFormData] = useState<AppSettings>(state.settings);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(state.settings);
      setImportError(null);
    }
  }, [isOpen, state.settings]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const normalized = normalizeAppState(json);
        if (normalized) {
          onImportState(normalized);
          setImportError(null);
          onClose();
        } else {
          setImportError('Invalid backup file format.');
        }
      } catch (err) {
        setImportError('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToSample = () => {
    if (window.confirm('Reset all tracker data to sample FMGE study state?')) {
      onResetState(getInitialAppState());
      onClose();
    }
  };

  const handleResetToBlank = () => {
    if (window.confirm('Are you sure you want to clear all progress to 0%?')) {
      const blank: AppState = {
        settings: {
          userName: 'Doctor',
          examDate: '2026-12-15',
          targetScore: 180,
          primaryPlatform: 'Marrow',
          dailyStudyHourGoal: 8,
          dailyQuestionGoal: 100,
        },
        subjectProgress: {},
        topicsState: {},
        grandTests: [],
        dailyTasks: [],
        studyLogs: {},
        errorNotebook: [],
        customPearls: [],
        bookmarkedPearlIds: [],
      };
      onResetState(blank);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold">Settings & Data Backup</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 text-xs">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Your Name / Title</label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">FMGE Exam Date</label>
                <input
                  type="date"
                  value={formData.examDate}
                  onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Target Score (/ 300)</label>
                <input
                  type="number"
                  min="150"
                  max="300"
                  value={formData.targetScore}
                  onChange={(e) => setFormData({ ...formData, targetScore: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Primary Platform</label>
                <select
                  value={formData.primaryPlatform}
                  onChange={(e) => setFormData({ ...formData, primaryPlatform: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="Marrow">Marrow</option>
                  <option value="Prepladder">Prepladder</option>
                  <option value="Cerebellum">Cerebellum</option>
                  <option value="DAMS">DAMS</option>
                  <option value="Bhatia">Bhatia</option>
                  <option value="Mist">Mist FMGE</option>
                  <option value="Self Study">Self Study / Standard Books</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Daily Target (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={formData.dailyStudyHourGoal}
                  onChange={(e) => setFormData({ ...formData, dailyStudyHourGoal: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
            >
              Save Profile Preferences
            </button>
          </form>

          {/* Backup & Restore Section */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Data Backup & Sync
            </h3>
            <p className="text-slate-500 text-[11px]">
              All your topic checkboxes, Grand Tests, error notebooks, and study logs are stored securely in your browser's local storage. Export a JSON file to keep offline backups.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => downloadBackupFile(state)}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Export Backup (JSON)</span>
              </button>

              <label className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer text-center">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importError && (
              <p className="text-rose-600 font-semibold text-[11px]">{importError}</p>
            )}
          </div>

          {/* Reset Options */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <h3 className="font-bold text-rose-700 text-xs uppercase tracking-wider">
              Reset Options
            </h3>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleResetToSample}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px]"
              >
                Reset to Sample State
              </button>
              <button
                type="button"
                onClick={handleResetToBlank}
                className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-[11px]"
              >
                Clear All to 0% Blank
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
