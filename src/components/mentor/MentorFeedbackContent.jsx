import React, { useState, useMemo } from 'react';
import { mockMentorFeedbacks } from '../../data/mockData';
import { MentorFeedbackHeader } from './MentorFeedbackHeader';
import { MentorSummary } from './MentorSummary';
import { FeedbackFilters } from './FeedbackFilters';
import { FeedbackCard } from './FeedbackCard';
import { FeedbackDetailsModal } from './FeedbackDetailsModal';
import { AddFeedbackModal } from './AddFeedbackModal';
import { RequestFeedbackModal } from './RequestFeedbackModal';
import { MessageSquareOff, Sparkles, Filter } from 'lucide-react';
import { Button } from '../common/Button';

export const MentorFeedbackContent = () => {
  const [feedbacks, setFeedbacks] = useState(mockMentorFeedbacks || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Compute metrics
  const totalReviews = feedbacks.length;
  const avgRating =
    totalReviews > 0
      ? (
          feedbacks.reduce((sum, f) => sum + (Number(f.rating) || 0), 0) /
          feedbacks.filter((f) => (Number(f.rating) || 0) > 0).length || 1
        ).toFixed(1)
      : '0.0';

  const allActionItems = feedbacks.flatMap((f) => f.actionItems || []);
  const openActionItems = allActionItems.filter((a) => !a.completed).length;
  const completedActionItems = allActionItems.filter((a) => a.completed).length;
  const completionRate =
    allActionItems.length > 0
      ? Math.round((completedActionItems / allActionItems.length) * 100)
      : 0;

  const allSkills = new Set(feedbacks.flatMap((f) => f.skillsTagged || []));
  const skillsReviewedCount = allSkills.size;

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMentor = (item.mentorName || '').toLowerCase().includes(q);
        const matchProject = (item.relatedProjectTitle || '').toLowerCase().includes(q);
        const matchCourse = (item.relatedCourseTitle || '').toLowerCase().includes(q);
        const matchSummary = (item.summary || item.feedback || '').toLowerCase().includes(q);
        const matchSkills = (item.skillsTagged || []).some((s) =>
          s.toLowerCase().includes(q)
        );
        const matchCategory = (item.category || '').toLowerCase().includes(q);

        if (
          !matchMentor &&
          !matchProject &&
          !matchCourse &&
          !matchSummary &&
          !matchSkills &&
          !matchCategory
        ) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }

      // Rating
      if (ratingFilter !== 'All') {
        const r = Number(item.rating) || 0;
        if (ratingFilter === '5' && r < 5.0) return false;
        if (ratingFilter === '4' && (r < 4.0 || r >= 5.0)) return false;
        if (ratingFilter === '3' && r >= 4.0) return false;
      }

      return true;
    });
  }, [feedbacks, searchQuery, statusFilter, categoryFilter, ratingFilter]);

  const handleUpdateFeedback = (updated) => {
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f))
    );
    if (selectedFeedback && selectedFeedback.id === updated.id) {
      setSelectedFeedback(updated);
    }
  };

  const handleAddFeedback = (newFeedback) => {
    setFeedbacks((prev) => [newFeedback, ...prev]);
  };

  const handleRequestFeedback = (newRequest) => {
    setFeedbacks((prev) => [newRequest, ...prev]);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setRatingFilter('All');
    setCategoryFilter('All');
  };

  return (
    <div className="space-y-6">
      {/* Header with quick stats */}
      <MentorFeedbackHeader
        totalReviews={totalReviews}
        avgRating={Number(avgRating)}
        openActionItems={openActionItems}
        latestDate={feedbacks[0]?.date || 'Recent'}
        onRequestFeedback={() => setIsRequestModalOpen(true)}
        onAddFeedback={() => setIsAddModalOpen(true)}
      />

      {/* Summary Cards */}
      <MentorSummary
        totalFeedback={totalReviews}
        averageRating={Number(avgRating)}
        openActionItems={openActionItems}
        skillsReviewedCount={skillsReviewedCount}
        completionRate={completionRate}
      />

      {/* Filters Bar */}
      <FeedbackFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        ratingFilter={ratingFilter}
        onRatingChange={setRatingFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        onResetFilters={handleResetFilters}
        totalCount={totalReviews}
        filteredCount={filteredFeedbacks.length}
      />

      {/* Feedbacks Grid */}
      {filteredFeedbacks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredFeedbacks.map((fb) => (
            <FeedbackCard
              key={fb.id}
              feedback={fb}
              onSelect={(item) => setSelectedFeedback(item)}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-[var(--card-bg)] border border-dashed border-[var(--border)] space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 mx-auto flex items-center justify-center">
            <MessageSquareOff className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-[var(--text-primary)]">
            No mentor reviews match your active filters
          </h4>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            Try adjusting your search keywords, status, or rating filter to view available evaluations.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="text-xs mt-2"
          >
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Modals */}
      {selectedFeedback && (
        <FeedbackDetailsModal
          isOpen={Boolean(selectedFeedback)}
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          onUpdateFeedback={handleUpdateFeedback}
        />
      )}

      <AddFeedbackModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddFeedback={handleAddFeedback}
      />

      <RequestFeedbackModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onRequestSubmitted={handleRequestFeedback}
      />
    </div>
  );
};
