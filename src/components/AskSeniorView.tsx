import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Send } from 'lucide-react';
import { formatRoleLabel, matchMentorsForQuestion } from '../lib/smartRouting';
import { createQuestion } from '../services/firestoreService';
import { CATEGORIES, Category, SCHEMA_LIMITS, UserPublic } from '../types/camconnect';
import { Avatar } from './Avatar';

interface AskSeniorViewProps {
  mentors: UserPublic[];
  userProfile: UserPublic | null;
  preselectedMentorId?: string | null;
  onClearPreselectedMentor: () => void;
  onRequireAuth: () => void;
  onQuestionCreated: (questionId: string) => void;
}

const TOPIC_SUGGESTIONS: Record<Category, string[]> = {
  Academics: ['Elective Workload', 'Grading & Professors', 'Minor Degree', 'Lab Courses'],
  Internships: ['SWE Summer Internships', 'Core Engineering Internships', 'Research Internships', 'OA & Resume Prep'],
  Clubs: ['Technical Clubs', 'Cultural & Fest Teams', 'Leadership Balance', 'Lab Access'],
  Projects: ['Undergraduate Research', 'Capstone Pitch', 'Open Source', 'Hackathon Teams'],
  'Campus Life': ['Hostels & Rooms', 'Study Spaces', 'Mess & Dining', 'First-Year Transition'],
  'Career Guidance': ['MS vs Industry', 'Core vs Software', 'Placement Season', 'Higher Studies SOP'],
};

export function AskSeniorView({
  mentors,
  userProfile,
  preselectedMentorId,
  onClearPreselectedMentor,
  onRequireAuth,
  onQuestionCreated,
}: AskSeniorViewProps) {
  const [category, setCategory] = useState<Category>('Internships');
  const [topic, setTopic] = useState('SWE Summer Internships');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const preferredMentor = mentors.find((m) => m.uid === preselectedMentorId);

  const routingPreview = useMemo(() => {
    return matchMentorsForQuestion(
      category,
      topic || title,
      mentors,
      preselectedMentorId || undefined
    );
  }, [category, topic, title, mentors, preselectedMentorId]);

  const handleCategoryChange = (nextCategory: Category) => {
    setCategory(nextCategory);
    setTopic(TOPIC_SUGGESTIONS[nextCategory][0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!userProfile) {
      onRequireAuth();
      return;
    }

    if (title.trim().length < SCHEMA_LIMITS.TITLE_MIN) {
      setErrorMsg(`Question title must be at least ${SCHEMA_LIMITS.TITLE_MIN} characters.`);
      return;
    }
    if (body.trim().length < SCHEMA_LIMITS.QUESTION_BODY_MIN) {
      setErrorMsg(`Please add at least ${SCHEMA_LIMITS.QUESTION_BODY_MIN} characters of context.`);
      return;
    }

    setSubmitting(true);
    try {
      const id = await createQuestion({
        author: userProfile,
        category,
        topic: topic.trim() || category,
        title: title.trim(),
        body: body.trim(),
        routedMentorIds: routingPreview.routedMentorIds,
        routedMentorSummary: routingPreview.routedMentorSummary,
      });
      setTitle('');
      setBody('');
      onClearPreselectedMentor();
      onQuestionCreated(id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit question.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 text-balance">
          Ask a Senior
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Select a structured category and topic. CamConnect routes your question directly to verified seniors and alumni with matching experience—never lost in random chat feeds.
        </p>
      </div>

      {preferredMentor && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={preferredMentor.displayName} src={preferredMentor.avatarUrl} size="sm" />
            <div className="text-sm">
              <span className="text-slate-600">Directly routing to </span>
              <strong className="text-slate-900">{preferredMentor.displayName}</strong>
              <span className="text-slate-600"> · Class of {preferredMentor.batchYear}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearPreselectedMentor}
            className="text-xs font-medium text-blue-800 hover:underline cursor-pointer"
          >
            Clear target
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Structured Question Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
        >
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-slate-900">
              1. Choose Discussion Category
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-3.5 py-2.5 text-sm font-medium rounded-lg border text-left transition-colors cursor-pointer whitespace-nowrap truncate ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="ask-topic" className="block text-sm font-semibold text-slate-900">
              2. Specific Topic
            </label>
            <input
              id="ask-topic"
              type="text"
              required
              minLength={SCHEMA_LIMITS.TOPIC_MIN}
              maxLength={SCHEMA_LIMITS.TOPIC_MAX}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., SWE Summer Internships, CS304 Workload"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {TOPIC_SUGGESTIONS[category].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setTopic(suggestion)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                    topic === suggestion
                      ? 'border-blue-700 bg-blue-50 text-blue-800 font-medium'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="ask-title" className="block text-sm font-semibold text-slate-900">
              3. Question Headline
            </label>
            <input
              id="ask-title"
              type="text"
              required
              minLength={SCHEMA_LIMITS.TITLE_MIN}
              maxLength={SCHEMA_LIMITS.TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Be specific so future batches can search and benefit from the answer"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ask-body" className="block text-sm font-semibold text-slate-900">
              4. Context & What You Have Tried
            </label>
            <textarea
              id="ask-body"
              rows={5}
              required
              minLength={SCHEMA_LIMITS.QUESTION_BODY_MIN}
              maxLength={SCHEMA_LIMITS.QUESTION_BODY_MAX}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Include your current semester, courses or projects, and the exact decision you are trying to make."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              {userProfile
                ? `Submitting as ${userProfile.displayName} · Class of ${userProfile.batchYear}`
                : 'College email verification required to publish'}
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Routing Question...' : userProfile ? 'Route to Verified Seniors' : 'Verify Email & Ask'}</span>
            </button>
          </div>
        </form>

        {/* Right: Smart Mentorship Routing Preview */}
        <aside className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-display font-bold text-slate-900">
              Smart Mentorship Router
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {routingPreview.routedMentorSummary}. Matching reduces notification noise for busy seniors by directing questions only to relevant expertise.
            </p>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
            {routingPreview.matches.length === 0 ? (
              <div className="p-5 text-sm text-slate-600">
                All verified seniors monitoring <strong>{category}</strong> will see this question in their queue.
              </div>
            ) : (
              routingPreview.matches.map(({ mentor, reason }) => (
                <div key={mentor.uid} className="p-4 flex items-start gap-3">
                  <Avatar name={mentor.displayName} src={mentor.avatarUrl} size="md" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {mentor.displayName}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                        Class of {mentor.batchYear}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {formatRoleLabel(mentor.role)} · {mentor.department}
                    </p>
                    <p className="text-xs text-blue-700 font-medium flex items-center gap-1 pt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{reason}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Once answered, threads remain searchable for every incoming batch.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
