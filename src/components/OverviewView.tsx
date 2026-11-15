import { useState } from 'react';
import { ArrowRight, BookOpen, MessageSquare, ShieldCheck, ThumbsUp } from 'lucide-react';
import { formatRelativeDate, formatRoleLabel } from '../lib/smartRouting';
import { AppView, BatchGuide, CATEGORIES, Category, Question, UserPublic } from '../types/camconnect';
import { Avatar } from './Avatar';

interface OverviewViewProps {
  questions: Question[];
  guides: BatchGuide[];
  mentors: UserPublic[];
  onNavigate: (view: AppView) => void;
  onSelectQuestion: (q: Question) => void;
  onAskMentor: (mentorId: string) => void;
}

const PILLAR_DESCRIPTIONS: Record<Category, string> = {
  Academics: 'Course workloads, professor grading styles, lab pairings, and minor degrees.',
  Internships: 'Summer SWE, core, and research shortlists, OA pacing, and interview debriefs.',
  Clubs: 'Technical wings, student chapter time budgets, and honest sophomore onboarding.',
  Projects: 'Faculty lab pitches, capstone execution, open-source teams, and funding.',
  'Campus Life': 'Hostels, quiet late-night study halls, dining, and first-year transition.',
  'Career Guidance': 'Industry offers vs MS/PhD timelines, portfolio reviews, and alumni pivots.',
};

export function OverviewView({
  questions,
  guides,
  mentors,
  onNavigate,
  onSelectQuestion,
  onAskMentor,
}: OverviewViewProps) {
  const [heroImgError, setHeroImgError] = useState(false);

  const featuredQuestions = questions.slice(0, 4);
  const featuredGuides = guides.slice(0, 2);
  const featuredMentors = mentors
    .filter((m) => m.role === 'senior' || m.role === 'alumni')
    .slice(0, 3);

  return (
    <div className="bg-white">
      {/* 1. Hero Section: 2-Column Editorial Split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-2 space-y-6">
            <div className="space-y-5">
              <p className="text-xs font-medium text-blue-700 tracking-wide">
                Verified Campus Knowledge & Mentorship
              </p>

              <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-slate-900 leading-[1.1] text-balance">
                Honest student guidance, preserved across every batch.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                LinkedIn shows achievements. Reddit shows anonymous opinions. College portals show official rules. CamConnect bridges the gap by connecting verified juniors, seniors, and alumni in one searchable repository.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('ask')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Ask a Senior</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('repository')}
                className="px-5 py-3 text-sm font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Browse Knowledge Base
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 min-h-[280px] lg:min-h-[380px]">
            {!heroImgError ? (
              <img
                src="/src/assets/images/hero_campus_library_1794725164621.jpg"
                alt="Students collaborating in a sunlit modern university library atrium"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgError(true)}
                className="w-full h-full max-h-[420px] lg:max-h-none object-cover rounded-xl border border-slate-200"
              />
            ) : (
              <div className="w-full h-full min-h-[320px] rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-8 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-blue-700" />
                <p className="text-base font-display font-semibold text-slate-900">
                  CamConnect Campus Commons
                </p>
                <p className="text-sm text-slate-600 max-w-xs">
                  Verified academic mentorship across graduating batches.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 4-Column Full-Width Core Value Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 pt-8 border-t border-slate-200">
          <div className="space-y-1.5">
            <h2 className="text-sm font-display font-bold text-slate-900">
              01. Verified College Community
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Institutional email verification ensures advice comes from real students and alumni, not anonymous strangers.
            </p>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-sm font-display font-bold text-slate-900">
              02. Smart Senior Routing
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Questions are matched by category and topic to seniors with relevant experience, respecting their time.
            </p>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-sm font-display font-bold text-slate-900">
              03. Permanent Knowledge Base
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Answers never vanish in scrolling group chats. Resolved threads become searchable campus FAQs.
            </p>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-sm font-display font-bold text-slate-900">
              04. Batch-to-Batch Handbooks
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Seniors leave behind prep roadmaps, internship debriefs, and club handover manuals for every next batch.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Structured Discussions (6 Pillars) */}
      <section className="bg-slate-50/70 border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-display font-bold tracking-tight text-slate-900">
                Structured Discussions, Not Random Feeds
              </h2>
              <p className="text-sm text-slate-600">
                Every campus question lives inside six clear academic and student-life pillars.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('discussions')}
              className="text-sm font-medium text-blue-700 hover:underline whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
            >
              View all discussions →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((category) => {
              const count = questions.filter((q) => q.category === category).length;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onNavigate('discussions')}
                  className="bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-5 text-left transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-display font-bold text-slate-900">
                      {category}
                    </h3>
                    <span className="text-xs font-mono tabular-nums text-slate-500">
                      {count} {count === 1 ? 'thread' : 'threads'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {PILLAR_DESCRIPTIONS[category]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Recent Verified Threads + Batch Handbooks Split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left 7 cols: Active Campus Q&A */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold tracking-tight text-slate-900">
                Recent Senior-Routed Threads
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('discussions')}
                className="text-sm font-medium text-blue-700 hover:underline cursor-pointer"
              >
                Explore all
              </button>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
              {featuredQuestions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onSelectQuestion(q)}
                  className="w-full text-left p-5 hover:bg-slate-50/80 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">{q.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{q.topic}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatRelativeDate(q.createdAtMs)}</span>
                  </div>

                  <h3 className="text-base font-display font-semibold text-slate-900 leading-snug">
                    {q.title}
                  </h3>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                    <span>
                      {q.authorName} · Class of {q.authorBatch}
                    </span>
                    <div className="flex items-center gap-4 font-mono tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                        {q.helpfulCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        {q.answerCount}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right 5 cols: Batch Handbooks & Featured Mentors */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold tracking-tight text-slate-900">
                  Batch Handbooks
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('handbooks')}
                  className="text-sm font-medium text-blue-700 hover:underline cursor-pointer"
                >
                  All guides
                </button>
              </div>

              <div className="space-y-4">
                {featuredGuides.map((guide) => (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => onNavigate('handbooks')}
                    className="w-full text-left bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-5 transition-colors cursor-pointer space-y-2"
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                      <span className="font-semibold text-blue-700">{guide.guideType}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Batch {guide.authorBatch}</span>
                    </div>
                    <h3 className="text-base font-display font-bold text-slate-900 leading-snug">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {guide.summary}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold tracking-tight text-slate-900">
                  Active Senior Mentors
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('mentors')}
                  className="text-sm font-medium text-blue-700 hover:underline cursor-pointer"
                >
                  Directory
                </button>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
                {featuredMentors.map((mentor) => (
                  <div key={mentor.uid} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={mentor.displayName} src={mentor.avatarUrl} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {mentor.displayName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {formatRoleLabel(mentor.role)} · Class of {mentor.batchYear}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAskMentor(mentor.uid)}
                      className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Ask
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
