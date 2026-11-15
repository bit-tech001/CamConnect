import { useMemo, useState } from 'react';
import { Bookmark as BookmarkIcon, CheckCircle2, MessageSquare, Search, ThumbsUp } from 'lucide-react';
import { formatRelativeDate, formatRoleLabel } from '../lib/smartRouting';
import { Bookmark, CATEGORIES, Category, Question, QuestionStatus, UserPublic } from '../types/camconnect';

interface DiscussionsViewProps {
  mode: 'discussions' | 'repository';
  questions: Question[];
  bookmarks: Bookmark[];
  userProfile: UserPublic | null;
  onSelectQuestion: (question: Question) => void;
  onAskNew: () => void;
}

export function DiscussionsView({
  mode,
  questions,
  bookmarks,
  userProfile,
  onSelectQuestion,
  onAskNew,
}: DiscussionsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | QuestionStatus | 'routed_to_me'>(
    mode === 'repository' ? 'archived_faq' : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const isSeniorOrAlumni = userProfile?.role === 'senior' || userProfile?.role === 'alumni';

  const filteredQuestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return questions.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;

      if (mode === 'repository') {
        if (statusFilter === 'archived_faq' && item.status !== 'archived_faq') return false;
        if (statusFilter === 'answered' && item.status === 'open') return false;
      } else {
        if (statusFilter === 'routed_to_me' && userProfile) {
          const isRouted =
            item.routedMentorIds.includes(userProfile.uid) ||
            userProfile.expertiseCategories.includes(item.category);
          if (!isRouted) return false;
        } else if (
          statusFilter !== 'all' &&
          statusFilter !== 'routed_to_me' &&
          item.status !== statusFilter
        ) {
          return false;
        }
      }

      if (q) {
        const hay = `${item.title} ${item.body} ${item.topic} ${item.category} ${item.authorName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [questions, selectedCategory, statusFilter, searchQuery, mode, userProfile]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 text-balance">
            {mode === 'repository' ? 'Permanent Knowledge Repository' : 'Structured Campus Discussions'}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            {mode === 'repository'
              ? 'Search verified answers and archived campus FAQs preserved across graduating batches—never lost in scrolling group chats.'
              : 'Conversations organized cleanly by academic and campus pillars instead of unsearchable feeds.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onAskNew}
          className="px-4 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          Ask a Senior
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Segmented Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Pillars
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                mode === 'repository'
                  ? 'Search archived FAQs & topics...'
                  : 'Search questions, courses, topics...'
              }
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
            />
          </div>
        </div>

        {/* Secondary Status Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            {mode === 'repository' ? (
              <>
                <button
                  type="button"
                  onClick={() => setStatusFilter('archived_faq')}
                  className={`px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                    statusFilter === 'archived_faq'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  Archived FAQs
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('answered')}
                  className={`px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                    statusFilter === 'answered'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  All Answered Threads
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  Include Open Queries
                </button>
              </>
            ) : (
              <>
                {(
                  [
                    { id: 'all', label: 'All Discussions' },
                    { id: 'open', label: 'Needs Senior Answer' },
                    { id: 'answered', label: 'Answered' },
                    { id: 'archived_faq', label: 'Archived FAQs' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                {isSeniorOrAlumni && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('routed_to_me')}
                    className={`px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                      statusFilter === 'routed_to_me'
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    Routed to My Queue
                  </button>
                )}
              </>
            )}
          </div>

          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {filteredQuestions.length} {filteredQuestions.length === 1 ? 'thread' : 'threads'}
          </span>
        </div>
      </div>

      {/* Thread List */}
      {filteredQuestions.length === 0 ? (
        <div className="p-10 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
          <p className="text-base font-display font-semibold text-slate-900">
            No matching campus discussions found
          </p>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Try clearing your search filter, switching categories, or ask a senior directly to add this topic to the repository.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
          {filteredQuestions.map((q) => {
            const isBookmarked = bookmarks.some(
              (b) => b.targetType === 'question' && b.targetId === q.id
            );

            return (
              <div
                key={q.id}
                onClick={() => onSelectQuestion(q)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectQuestion(q);
                  }
                }}
                className="p-6 hover:bg-slate-50/70 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    {/* Unboxed inline metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">{q.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{q.topic}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatRelativeDate(q.createdAtMs)}</span>
                      {q.status === 'archived_faq' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Archived FAQ
                          </span>
                        </>
                      )}
                      {q.status === 'open' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-700 font-medium">Awaiting Senior Answer</span>
                        </>
                      )}
                    </div>

                    <h2 className="text-lg font-display font-semibold text-slate-900 leading-snug">
                      {q.title}
                    </h2>

                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {q.body}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
                      <span className="font-medium text-slate-700">{q.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatRoleLabel(q.authorRole)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Class of {q.authorBatch}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-blue-700">{q.routedMentorSummary}</span>
                    </div>
                  </div>

                  {/* Right compact metrics */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2 shrink-0 text-xs text-slate-600 font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                      {q.helpfulCount} helpful
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      {q.answerCount} {q.answerCount === 1 ? 'answer' : 'answers'}
                    </span>
                    {isBookmarked && (
                      <span className="inline-flex items-center gap-1 text-slate-800 font-sans font-medium">
                        <BookmarkIcon className="w-3.5 h-3.5" />
                        Saved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
