import React from 'react';
import { X } from 'lucide-react';
import { GrandTest, AppState } from '../types';
import { NewMcqAttemptInput } from '../utils/performanceEngine';
import { AiCoachView } from './AiCoachView';

interface AiCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy';
  initialSubject?: string;
  initialTopic?: string;
  latestGT?: GrandTest | null;
  daysRemaining: number;
  state?: AppState;
  onRecordAttempt?: (input: NewMcqAttemptInput) => void;
}

export const AiCoachModal: React.FC<AiCoachModalProps> = ({
  isOpen,
  onClose,
  initialTopic,
  initialSubject,
  initialTab,
  latestGT,
  daysRemaining,
  state,
  onRecordAttempt,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs overflow-y-auto font-['Plus_Jakarta_Sans']">
      <div className="relative w-full max-w-4xl my-auto bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200/90">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          title="Close Study Coach"
        >
          <X className="h-4 w-4" />
        </button>

        <AiCoachView
          state={state}
          latestGT={latestGT}
          daysRemaining={daysRemaining}
          initialTopic={initialTopic}
          initialSubject={initialSubject}
          initialTab={initialTab}
          onRecordAttempt={onRecordAttempt}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
