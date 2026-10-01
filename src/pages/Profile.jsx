import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { mockProfileData } from '../data/mockProfile';
import {
  User,
  Compass,
  Award,
  BookOpen,
  FolderGit2,
  ShieldCheck,
  Edit3,
  Calendar,
  Mail,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Github,
  Globe,
  MapPin,
  Briefcase,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export const Profile = () => {
  const { user, setUser, activeCareer } = useApp();

  // Profile fields state initialized from mockProfileData + user from context
  const [profile, setProfile] = useState({
    ...mockProfileData,
    name: user.name,
    email: user.email,
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: user.name,
    email: user.email,
    title: profile.title,
    bio: profile.bio,
    location: profile.location,
    experienceLevel: profile.experienceLevel,
    learningStyle: profile.learningStyle,
    githubUrl: profile.githubUrl,
    linkedinUrl: profile.linkedinUrl,
    portfolioUrl: profile.portfolioUrl,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleInputChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setProfile((prev) => ({
      ...prev,
      ...editFormData,
    }));
    setUser((prev) => ({
      ...prev,
      name: editFormData.name,
      email: editFormData.email,
    }));
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsEditModalOpen(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Candidate Profile"
        description="Review and configure your professional baseline, verified technical credentials, and explainable learning telemetry."
        badge="Live Telemetry"
        badgeVariant="cyan"
        action={
          <Button
            onClick={() => {
              setEditFormData({
                name: user.name,
                email: user.email,
                title: profile.title,
                bio: profile.bio,
                location: profile.location,
                experienceLevel: profile.experienceLevel,
                learningStyle: profile.learningStyle,
                githubUrl: profile.githubUrl,
                linkedinUrl: profile.linkedinUrl,
                portfolioUrl: profile.portfolioUrl,
              });
              setIsEditModalOpen(true);
            }}
            variant="primary"
            size="sm"
            leftIcon={Edit3}
          >
            Edit Profile
          </Button>
        }
      />

      {/* Hero Summary Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[var(--card-bg)] via-[var(--surface-secondary)] to-[var(--card-bg)] border border-[var(--card-border)] shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <Avatar
              src={user.avatar}
              name={user.name}
              size="xl"
              status="online"
              ringColor="ring-indigo-500/50"
            />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-bold font-display text-[var(--text-primary)]">
                  {profile.name}
                </h2>
                <Badge variant="cyan" size="sm" dot>
                  {user.readinessTier}
                </Badge>
              </div>

              <p className="text-sm font-medium text-indigo-600 dark:text-cyan-400">
                {profile.title}
              </p>

              <p className="text-xs text-[var(--text-secondary)] font-sans max-w-2xl leading-relaxed">
                {profile.bio}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--text-muted)] pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {profile.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                  Member since {profile.joinedDate}
                </span>
              </div>
            </div>
          </div>

          <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-[var(--border)] shrink-0">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">Composite Readiness</span>
            <div className="text-3xl font-extrabold font-display text-cyan-600 dark:text-cyan-400 mt-0.5">
              {user.readinessScore}%
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              {user.readinessPercentile}
            </span>
          </div>
        </div>

        {/* External Links Bar */}
        <div className="mt-6 pt-4 border-t border-[var(--border)] flex flex-wrap items-center gap-3">
          <a
            href={profile.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Github className="w-3.5 h-3.5 text-[var(--text-primary)]" />
            <span>GitHub Profile</span>
            <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
          </a>

          <a
            href={profile.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>Personal Portfolio</span>
            <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
          </a>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Skills Tracked"
          value={`${user.skillsTracked} Skills`}
          subtitle="Evaluated across 4 domains"
          icon={Award}
          color="indigo"
        />
        <StatCard
          title="Completed Courses"
          value={`${user.completedCourses} Modules`}
          subtitle="94.8% average rubric score"
          icon={BookOpen}
          color="cyan"
        />
        <StatCard
          title="Production Repos"
          value={`${user.completedProjects} Capstones`}
          subtitle="Audited in Evidence Vault"
          icon={FolderGit2}
          color="blue"
        />
        <StatCard
          title="Verified Hashes"
          value={`${user.evidenceVerified} Proofs`}
          subtitle="Cryptographically logged"
          icon={ShieldCheck}
          color="emerald"
        />
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Target Career Configuration */}
          <SectionCard
            title="Career Trajectory Configuration"
            subtitle="Your current profile is optimized for this target role and level."
            badge={<Badge variant="indigo" size="sm">Active Target</Badge>}
          >
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--text-muted)]">Target Role</span>
                  <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">Tier 1 Hiring Bar</span>
                </div>
                <h4 className="text-lg font-bold text-[var(--text-primary)] font-display">
                  {activeCareer || user.targetCareer}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {user.careerDescription}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">Experience Tier</span>
                  <p className="text-sm font-bold text-[var(--text-primary)] font-display mt-1">
                    {profile.experienceLevel}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">Study Bandwidth</span>
                  <p className="text-sm font-bold text-[var(--text-primary)] font-display mt-1">
                    {user.weeklyHours} hrs / week
                  </p>
                  <p className="text-[11px] text-amber-500 font-medium mt-0.5">
                    {user.learningStreakDays} day active streak
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Top Competencies */}
          <SectionCard
            title="Core Technical Competencies"
            subtitle="Current verified levels vs target thresholds for Tier 1 roles."
          >
            <div className="space-y-3.5">
              {profile.topSkills.map((skill) => {
                const isMet = skill.level >= skill.target;
                return (
                  <div
                    key={skill.name}
                    className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-primary)] font-display">
                          {skill.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            isMet
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {skill.status}
                        </span>
                      </div>
                      <span className="text-xs font-mono">
                        <span className="font-bold text-[var(--text-primary)]">{skill.level}%</span>
                        <span className="text-[var(--text-muted)]"> / target {skill.target}%</span>
                      </span>
                    </div>

                    <div className="w-full bg-[var(--surface-tertiary)] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isMet ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Learning Style */}
          <SectionCard
            title="Learning Style & Methodology"
            subtitle="PathForge AI sprint calibration mode."
          >
            <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-indigo-500/30 flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] font-display">
                  {profile.learningStyle}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Prioritizes building verifiable GitHub repositories, containerized microservices, and end-to-end evaluation suites over passive video lectures.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Readiness Factor Breakdown */}
          <SectionCard
            title="Readiness Factor Weights"
            subtitle="Explainable breakdown powering your 68% index."
          >
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-secondary)] font-medium">Core Skill Match</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {user.factors.skillMatch}%
                  </span>
                </div>
                <div className="w-full bg-[var(--surface-secondary)] border border-[var(--border)] h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${user.factors.skillMatch}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-secondary)] font-medium">Curriculum Progress</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {user.factors.curriculumProgress}%
                  </span>
                </div>
                <div className="w-full bg-[var(--surface-secondary)] border border-[var(--border)] h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${user.factors.curriculumProgress}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-secondary)] font-medium">Practical Evidence</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {user.factors.practicalEvidence}%
                  </span>
                </div>
                <div className="w-full bg-[var(--surface-secondary)] border border-[var(--border)] h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${user.factors.practicalEvidence}%` }} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Connected Verified Accounts */}
          <SectionCard
            title="Connected Authority Accounts"
            subtitle="Third-party verification platforms feeding the telemetry pipeline."
          >
            <div className="space-y-3">
              {profile.connectedAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={acc.avatar} alt={acc.provider} className="w-4 h-4 rounded-sm" />
                    <div>
                      <p className="font-bold text-[var(--text-primary)] font-display leading-tight">
                        {acc.provider}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">@{acc.username}</p>
                    </div>
                  </div>

                  <span className="text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {acc.status}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Candidate Profile"
        description="Update your personal details, target experience tier, and portfolio links."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              value={editFormData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={editFormData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>

          <Input
            label="Professional Title"
            value={editFormData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Professional Bio
            </label>
            <textarea
              rows={3}
              value={editFormData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--input-text)] focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Location"
              value={editFormData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
            <Input
              label="Experience Level"
              value={editFormData.experienceLevel}
              onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Preferred Learning Style
            </label>
            <select
              value={editFormData.learningStyle}
              onChange={(e) => handleInputChange('learningStyle', e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--input-text)] focus:outline-hidden focus:border-indigo-500"
            >
              <option value="Hands-on Production Code & CI/CD Pipelines">
                Hands-on Production Code & CI/CD Pipelines
              </option>
              <option value="Interactive Notebooks & Math Deep Dives">
                Interactive Notebooks & Math Deep Dives
              </option>
              <option value="Curated Video Lectures & Rigorous Problem Sets">
                Curated Video Lectures & Rigorous Problem Sets
              </option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="GitHub URL"
              value={editFormData.githubUrl}
              onChange={(e) => handleInputChange('githubUrl', e.target.value)}
            />
            <Input
              label="Portfolio URL"
              value={editFormData.portfolioUrl}
              onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
            />
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
