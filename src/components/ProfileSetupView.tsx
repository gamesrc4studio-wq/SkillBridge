import React, { useState } from 'react';
import { CheckCircle2, Plus, Save, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  PROJECT_CATEGORIES,
  type AvailabilityStatus,
  type ExperienceLevel,
  type ProjectCategory,
  type SkillProficiency,
} from '../types';
import { sanitizeUsername, validateProfileInput } from '../utils/validation';
import { Avatar } from './Avatar';

interface ProfileSetupViewProps {
  isOnboarding?: boolean;
}

const SUGGESTED_SKILLS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Python',
  'Node.js',
  'MongoDB',
  'PostgreSQL',
  'Firebase',
  'AI/ML',
  'Data Science',
  'UI/UX',
  'Figma',
  'Docker',
  'Tailwind CSS',
  'PyTorch',
  'React Native',
];

export const ProfileSetupView: React.FC<ProfileSetupViewProps> = ({ isOnboarding = false }) => {
  const { authUser, currentProfile, saveProfile, setActiveView, postLoginView, setPostLoginView, pushToast } = useApp();

  const [name, setName] = useState(currentProfile?.name || authUser?.displayName || '');
  const [username, setUsername] = useState(
    currentProfile?.username || sanitizeUsername(authUser?.displayName || authUser?.email?.split('@')[0] || 'developer')
  );
  const [avatarUrl, setAvatarUrl] = useState(currentProfile?.avatarUrl || authUser?.photoURL || '');
  const [bio, setBio] = useState(currentProfile?.bio || '');
  const [education, setEducation] = useState(currentProfile?.education || '');
  const [college, setCollege] = useState(currentProfile?.college || '');
  const [skills, setSkills] = useState<string[]>(currentProfile?.skills || ['React', 'JavaScript']);
  const [skillLevels, setSkillLevels] = useState<Record<string, SkillProficiency>>(
    currentProfile?.skillLevels || { React: 'Intermediate', JavaScript: 'Intermediate' }
  );
  const [newSkill, setNewSkill] = useState('');
  const [experience, setExperience] = useState<ExperienceLevel>(currentProfile?.experience || 'Student');
  const [github, setGithub] = useState(currentProfile?.github || '');
  const [portfolio, setPortfolio] = useState(currentProfile?.portfolio || '');
  const [interests, setInterests] = useState<string[]>(currentProfile?.interests || []);
  const [newInterest, setNewInterest] = useState('');
  const [availability, setAvailability] = useState<AvailabilityStatus>(currentProfile?.availability || 'Available');
  const [preferredCategories, setPreferredCategories] = useState<ProjectCategory[]>(
    currentProfile?.preferredCategories || ['Web Development']
  );
  const [isPublic, setIsPublic] = useState<boolean>(currentProfile?.isPublic ?? true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkill('');
      return;
    }
    if (skills.length >= 25) {
      pushToast('error', 'Maximum 25 skills allowed.');
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setSkillLevels((prev) => ({ ...prev, [trimmed]: 'Intermediate' }));
    setNewSkill('');
  };

  const removeSkill = (skillName: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillName));
    setSkillLevels((prev) => {
      const next = { ...prev };
      delete next[skillName];
      return next;
    });
  };

  const addInterest = () => {
    const trimmed = newInterest.trim();
    if (!trimmed) return;
    if (!interests.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      setInterests((prev) => [...prev, trimmed].slice(0, 20));
    }
    setNewInterest('');
  };

  const toggleCategory = (cat: ProjectCategory) => {
    setPreferredCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat].slice(0, 10)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const validationErr = validateProfileInput({
      name,
      username,
      bio,
      skills,
      github,
      portfolio,
    });
    if (validationErr) {
      setErrorMsg(validationErr);
      return;
    }

    setSaving(true);
    try {
      await saveProfile({
        name: name.trim(),
        username: username.trim(),
        avatarUrl: avatarUrl.trim(),
        bio: bio.trim(),
        education: education.trim(),
        college: college.trim(),
        skills,
        skillLevels,
        experience,
        github: github.trim(),
        portfolio: portfolio.trim(),
        interests,
        availability,
        preferredCategories,
        isPublic,
        profileCompleted: true,
      });
      if (isOnboarding) {
        const dest =
          postLoginView && postLoginView !== 'landing' && postLoginView !== 'login'
            ? postLoginView
            : 'overview';
        setPostLoginView(null);
        setActiveView(dest);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 pb-4 border-b border-[#D1D9E0]">
        <h1 className="text-2xl font-bold text-[#1F2328]">
          {isOnboarding ? 'Complete Your Developer Profile' : 'Profile & Account Settings'}
        </h1>
        <p className="mt-1 text-sm text-[#656D76]">
          {isOnboarding
            ? 'Set up your skills, experience, and availability so SkillBridge can match you with projects and teammates.'
            : 'Keep your skills, proficiency levels, and public visibility up to date.'}
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3.5 rounded-lg bg-[#FFEBE9] border border-[#FF8182] text-sm text-[#CF222E]">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity Section */}
        <section className="p-5 bg-white border border-[#D1D9E0] rounded-lg space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={name || 'Developer'} src={avatarUrl} size="xl" />
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Profile Picture URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Username *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ada_dev"
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1F2328] mb-1">Short Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell teammates what you enjoy building..."
              className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Education / Degree</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="B.S. Computer Science"
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">College / University</label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="State University"
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
              />
            </div>
          </div>
        </section>

        {/* Skills & Proficiency */}
        <section className="p-5 bg-white border border-[#D1D9E0] rounded-lg space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[#1F2328]">Skills &amp; Proficiency *</h2>
            <p className="text-xs text-[#656D76] mt-0.5">
              Used directly by the Smart Skill Matching Engine to compute match scores.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill(newSkill);
                }
              }}
              placeholder="Add a skill (e.g. React, Python, Docker)"
              className="flex-1 px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
            />
            <button
              type="button"
              onClick={() => addSkill(newSkill)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#1F2328] bg-[#F6F8FA] hover:bg-[#EAEFF4] border border-[#D1D9E0] rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_SKILLS.filter((s) => !skills.some((k) => k.toLowerCase() === s.toLowerCase()))
              .slice(0, 10)
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkill(s)}
                  className="px-2.5 py-1 text-xs text-[#656D76] bg-[#F6F8FA] hover:text-[#0969DA] border border-[#D1D9E0] rounded-md"
                >
                  + {s}
                </button>
              ))}
          </div>

          <div className="space-y-2 pt-2">
            {skills.map((skill) => (
              <div
                key={skill}
                className="flex items-center justify-between gap-3 px-3 py-2 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
              >
                <span className="text-sm font-medium text-[#1F2328]">{skill}</span>
                <div className="flex items-center gap-2">
                  <select
                    value={skillLevels[skill] || 'Intermediate'}
                    onChange={(e) =>
                      setSkillLevels((prev) => ({
                        ...prev,
                        [skill]: e.target.value as SkillProficiency,
                      }))
                    }
                    className="px-2.5 py-1 text-xs bg-white border border-[#D1D9E0] rounded-md focus:outline-none focus:border-[#0969DA]"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                  <button
                    type="button"
                    aria-label={`Remove ${skill}`}
                    onClick={() => removeSkill(skill)}
                    className="p-1 text-[#656D76] hover:text-[#CF222E]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Experience, Links & Preferences */}
        <section className="p-5 bg-white border border-[#D1D9E0] rounded-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Experience Level</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
              >
                <option value="Student">Student</option>
                <option value="Entry">Entry (0–1 yrs)</option>
                <option value="Intermediate">Intermediate (1–3 yrs)</option>
                <option value="Senior">Senior (3+ yrs)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as AvailabilityStatus)}
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
              >
                <option value="Available">Available</option>
                <option value="Part-time">Part-time</option>
                <option value="Weekends Only">Weekends Only</option>
                <option value="Busy">Busy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">GitHub URL</label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Portfolio URL</label>
              <input
                type="url"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="https://yourportfolio.dev"
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1F2328] mb-1">Interests &amp; Domains</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addInterest();
                  }
                }}
                placeholder="e.g. EdTech, Developer Tools, Climate Tech"
                className="flex-1 px-3 py-1.5 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
              />
              <button
                type="button"
                onClick={addInterest}
                className="px-3 py-1.5 text-xs font-medium bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg hover:bg-[#EAEFF4]"
              >
                Add
              </button>
            </div>
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {interests.map((int) => (
                  <span
                    key={int}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#F6F8FA] border border-[#D1D9E0] rounded-md"
                  >
                    {int}
                    <button
                      type="button"
                      onClick={() => setInterests((prev) => prev.filter((x) => x !== int))}
                      className="text-[#656D76] hover:text-[#CF222E]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1F2328] mb-2">Preferred Project Categories</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_CATEGORIES.map((cat) => {
                const selected = preferredCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      selected
                        ? 'bg-[#0969DA] text-white border-[#0969DA]'
                        : 'bg-[#F6F8FA] text-[#1F2328] border-[#D1D9E0] hover:bg-[#EAEFF4]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-[#D1D9E0] flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#1F2328]">Public Developer Directory Profile</p>
              <p className="text-xs text-[#656D76]">
                Allow other developers and project owners to discover your profile and invite you to teams.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 accent-[#0969DA]"
              />
              <span className="text-xs font-medium text-[#1F2328]">{isPublic ? 'Public' : 'Private'}</span>
            </label>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          {!isOnboarding && (
            <button
              type="button"
              onClick={() => setActiveView('overview')}
              className="px-4 py-2 text-sm font-medium text-[#1F2328] bg-[#F6F8FA] hover:bg-[#EAEFF4] border border-[#D1D9E0] rounded-lg"
            >
              Back to Overview
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] disabled:opacity-60 rounded-lg transition-colors"
          >
            {isOnboarding ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : isOnboarding ? 'Complete Setup & Continue' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};
