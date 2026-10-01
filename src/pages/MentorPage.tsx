import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { MentorFeedbackCard } from '../components/mentor/MentorFeedbackCard';
import { apiService } from '../services/api';
import { MentorFeedback } from '../types';
import { Sparkles, MessageSquareQuote, Send, Star, ArrowRight, UserCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const MentorPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<MentorFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const data = await apiService.getMentorFeedback();
        setFeedbacks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  const latestFeedback = feedbacks[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Senior Mentor Feedback & Review Timeline"
        subtitle="Qualitative rubric assessments from verified Staff & Principal engineers to validate industry readiness."
        badge="Human-in-the-Loop"
        actions={
          <button
            onClick={() =>
              addToast(
                'Review Requested',
                'Your latest Tableau project report was queued for Sarah Chen’s upcoming review cycle.',
                'success'
              )
            }
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-950/40 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            Request Project Code Review
          </button>
        }
      />

      {/* Highlight Card: "Your Mentor's Latest Recommendation" */}
      {latestFeedback && (
        <div className="relative overflow-hidden bg-gradient-to-r from-[#151C2E] via-[#1E1B4B]/60 to-[#151C2E] border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Mentor's Latest Recommendation
            </span>
            <span className="text-xs text-slate-400">
              Reviewer: <strong className="text-white">{latestFeedback.mentorName}</strong> ({latestFeedback.mentorRole})
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white font-display mt-2 leading-snug">
            “{latestFeedback.suggestedNextAction}”
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-3xl">
            {latestFeedback.feedbackMessage}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-amber-400 font-bold bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{latestFeedback.rating}.0 / 5.0 Industry Rating</span>
            </div>
            <div className="text-indigo-300 font-semibold bg-indigo-950/50 px-3 py-1.5 rounded-xl border border-indigo-800/40">
              Focus: {latestFeedback.relatedSkill}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Timeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-base font-bold text-white font-display">
            Historical Feedback Thread ({feedbacks.length} Reviews)
          </h3>
          <span className="text-xs text-slate-400">Chronological audit stream</span>
        </div>

        <div className="space-y-6">
          {feedbacks.map((fb, idx) => (
            <MentorFeedbackCard key={fb.id} feedback={fb} isLatest={idx === 0} />
          ))}
        </div>
      </div>
    </div>
  );
};
