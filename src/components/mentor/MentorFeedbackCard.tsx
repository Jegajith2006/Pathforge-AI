import React from 'react';
import { MentorFeedback } from '../../types';
import { Star, CheckCircle, AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';

interface MentorFeedbackCardProps {
  feedback: MentorFeedback;
  isLatest?: boolean;
}

export const MentorFeedbackCard: React.FC<MentorFeedbackCardProps> = ({
  feedback,
  isLatest = false,
}) => {
  return (
    <div
      className={`bg-[#151C2E] border rounded-2xl p-6 transition-all duration-300 shadow-xl ${
        isLatest
          ? 'border-indigo-500/50 shadow-indigo-950/40'
          : 'border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Header with Avatar, Name, Role, Rating and Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <img
            src={feedback.mentorAvatar}
            alt={feedback.mentorName}
            className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500/30"
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-white font-display">
                {feedback.mentorName}
              </h4>
              {isLatest && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Latest Review
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{feedback.mentorRole}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < feedback.rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-700 fill-slate-700'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500">{feedback.date}</span>
        </div>
      </div>

      {/* Target Skill Tag */}
      <div className="mt-4">
        <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/40 border border-indigo-800/30 px-2.5 py-1 rounded-lg">
          Focus Competency: {feedback.relatedSkill}
        </span>
      </div>

      {/* Feedback Message */}
      <p className="text-sm text-slate-300 leading-relaxed mt-4 italic">
        "{feedback.feedbackMessage}"
      </p>

      {/* Strengths & Improvement Areas grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-800/80">
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            Key Strengths Identified:
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
            {feedback.strengths.map((s, idx) => (
              <li key={idx} className="leading-snug">
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Improvement Recommendations:
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
            {feedback.improvementAreas.map((a, idx) => (
              <li key={idx} className="leading-snug">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suggested Next Action */}
      <div className="mt-4 p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-2.5">
        <ArrowRight className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
        <p className="text-xs text-indigo-200">
          <strong className="text-white">Mentor Action Item: </strong>
          {feedback.suggestedNextAction}
        </p>
      </div>
    </div>
  );
};
