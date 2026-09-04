import React, { useState } from 'react';
import { Database, Download, RefreshCw, Sparkles, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DataMigrationModal: React.FC = () => {
  const { profile, handleMigrateLocalData, handleStartFresh } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const onImport = async () => {
    setIsProcessing(true);
    try {
      await handleMigrateLocalData();
    } finally {
      setIsProcessing(false);
    }
  };

  const onStartFresh = async () => {
    setIsProcessing(true);
    try {
      await handleStartFresh();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#cfe2df] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#084d50] to-[#0d6866] p-6 text-white text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md mb-2 shadow-inner">
            <Database className="h-6 w-6 text-[#f5d58b]" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Existing local FMGE progress found</h2>
          <p className="text-xs text-[#b8ded9] mt-1">
            We detected previously saved study progress stored in this browser.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-center">
          <p className="text-xs text-[#345856] leading-relaxed">
            Would you like to import and link this existing study progress to your account (
            <span className="font-semibold text-[#084d50]">{profile?.email || 'authenticated account'}</span>
            ) for cloud synchronization across your MacBook, iPhone, and iPad, or start with a fresh workspace?
          </p>

          <div className="rounded-2xl border border-[#cfe2df] bg-[#f7faf9] p-4 text-left space-y-2 text-xs text-[#527776]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0d6866] shrink-0" />
              <span>Includes completed syllabus topics &amp; revisions</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0d6866] shrink-0" />
              <span>Includes logged Grand Tests &amp; Error Notebook items</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0d6866] shrink-0" />
              <span>Includes custom Daily Planner tasks &amp; Medical Pearls</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onImport}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#084d50] px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#063c3e] transition-all disabled:opacity-60"
            >
              {isProcessing ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Import This Progress</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={onStartFresh}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#cfe2df] bg-white px-5 py-2.5 text-xs font-semibold text-[#628084] hover:bg-[#f2f8f7] hover:text-[#183d3b] transition-all disabled:opacity-60"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Start Fresh</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
