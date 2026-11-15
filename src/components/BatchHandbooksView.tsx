import { useMemo, useState } from 'react';
import {
  Bookmark as BookmarkIcon,
  BookOpen,
  ExternalLink,
  Plus,
  Search,
  ThumbsUp,
  X,
} from 'lucide-react';
import { formatRelativeDate, formatRoleLabel } from '../lib/smartRouting';
import {
  createBatchGuide,
  toggleBookmark,
  toggleGuideVote,
} from '../services/firestoreService';
import {
  BatchGuide,
  Bookmark,
  CATEGORIES,
  Category,
  GUIDE_TYPES,
  GuideType,
  SCHEMA_LIMITS,
  UserPublic,
} from '../types/camconnect';

interface BatchHandbooksViewProps {
  guides: BatchGuide[];
  bookmarks: Bookmark[];
  userProfile: UserPublic | null;
  isLiveFirestore: boolean;
  onRequireAuth: () => void;
  onActionNotice: (msg: string) => void;
}

export function BatchHandbooksView({
  guides,
  bookmarks,
  userProfile,
  isLiveFirestore,
  onRequireAuth,
  onActionNotice,
}: BatchHandbooksViewProps) {
  const [selectedType, setSelectedType] = useState<GuideType | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGuide, setActiveGuide] = useState<BatchGuide | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  // Composer state
  const [guideType, setGuideType] = useState<GuideType>('Preparation Guide');
  const [category, setCategory] = useState<Category>('Internships');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [takeawaysInput, setTakeawaysInput] = useState('');
  const [resourcesInput, setResourcesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredGuides = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return guides.filter((g) => {
      if (selectedType !== 'All' && g.guideType !== selectedType) return false;
      if (selectedCategory !== 'All' && g.category !== selectedCategory) return false;
      if (q) {
        const hay = `${g.title} ${g.summary} ${g.content} ${g.authorName} ${g.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [guides, selectedType, selectedCategory, searchQuery]);

  const canPublishGuide =
    userProfile && (userProfile.role === 'senior' || userProfile.role === 'alumni');

  const handleOpenComposer = () => {
    if (!userProfile) {
      onRequireAuth();
      return;
    }
    if (!canPublishGuide) {
      onActionNotice(
        'Batch Handbooks are authored by Seniors and Alumni. Update your Campus Standing in Profile if you are a graduating senior or alum.'
      );
      return;
    }
    setFormError(null);
    setComposerOpen(true);
  };

  const handlePublishGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !canPublishGuide) return;
    setFormError(null);

    if (title.trim().length < SCHEMA_LIMITS.TITLE_MIN) {
      setFormError(`Title must be at least ${SCHEMA_LIMITS.TITLE_MIN} characters.`);
      return;
    }
    if (summary.trim().length < SCHEMA_LIMITS.GUIDE_SUMMARY_MIN) {
      setFormError(`Summary must be at least ${SCHEMA_LIMITS.GUIDE_SUMMARY_MIN} characters.`);
      return;
    }
    if (content.trim().length < SCHEMA_LIMITS.GUIDE_CONTENT_MIN) {
      setFormError(`Handbook body must be at least ${SCHEMA_LIMITS.GUIDE_CONTENT_MIN} characters.`);
      return;
    }

    const keyTakeaways = takeawaysInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, SCHEMA_LIMITS.MAX_TAKEAWAYS);

    const resourceLinks = resourcesInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, SCHEMA_LIMITS.MAX_RESOURCE_LINKS);

    setSubmitting(true);
    try {
      await createBatchGuide({
        author: userProfile,
        guideType,
        category,
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        keyTakeaways,
        resourceLinks,
      });
      setTitle('');
      setSummary('');
      setContent('');
      setTakeawaysInput('');
      setResourcesInput('');
      setComposerOpen(false);
      onActionNotice('Batch handbook published to the campus archive.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to publish batch handbook.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteGuide = async (guide: BatchGuide) => {
    if (!userProfile) {
      onRequireAuth();
      return;
    }
    if (!isLiveFirestore) {
      onActionNotice('Sign in as an administrator or publish a live handbook to record votes.');
      return;
    }
    try {
      await toggleGuideVote(guide, userProfile.uid);
    } catch (err) {
      onActionNotice(err instanceof Error ? err.message : 'Unable to record vote.');
    }
  };

  const handleBookmarkGuide = async (guide: BatchGuide) => {
    if (!userProfile) {
      onRequireAuth();
      return;
    }
    const existing = bookmarks.find(
      (b) => b.targetType === 'guide' && b.targetId === guide.id
    );
    try {
      const saved = await toggleBookmark({
        userId: userProfile.uid,
        targetType: 'guide',
        targetId: guide.id,
        title: guide.title,
        category: guide.category,
        existingBookmarkId: existing?.id,
      });
      onActionNotice(saved ? 'Handbook saved to your bookmarks.' : 'Removed from bookmarks.');
    } catch (err) {
      onActionNotice(err instanceof Error ? err.message : 'Unable to bookmark handbook.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 text-balance">
            Batch-to-Batch Handbooks
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Preparation guides, internship breakdowns, club handover manuals, and coursework advice left behind by graduating batches so juniors never start from zero.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenComposer}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Handbook</span>
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedType('All')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedType === 'All'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Handbooks
            </button>
            {GUIDE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedType === type
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              aria-label="Filter handbooks by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Category | 'All')}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search handbooks..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      {filteredGuides.length === 0 ? (
        <div className="p-10 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
          <p className="text-base font-display font-semibold text-slate-900">
            No handbooks match this filter
          </p>
          <p className="text-sm text-slate-600">
            Try clearing your category or search filter to view all batch-to-batch guides.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGuides.map((guide) => {
            const isSaved = bookmarks.some(
              (b) => b.targetType === 'guide' && b.targetId === guide.id
            );
            return (
              <article
                key={guide.id}
                onClick={() => setActiveGuide(guide)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveGuide(guide);
                  }
                }}
                className="bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-6 flex flex-col justify-between gap-5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-700"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-blue-700">{guide.guideType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{guide.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">Batch {guide.authorBatch}</span>
                  </div>

                  <h2 className="text-xl font-display font-bold text-slate-900 leading-snug">
                    {guide.title}
                  </h2>

                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {guide.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs text-slate-500">
                  <div>
                    <span className="font-medium text-slate-900">{guide.authorName}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{formatRoleLabel(guide.authorRole)}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                      {guide.helpfulCount}
                    </span>
                    {isSaved && <BookmarkIcon className="w-3.5 h-3.5 text-slate-900" />}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Handbook Reader Modal */}
      {activeGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-reader-title"
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-xs"
        >
          <div className="w-full max-w-3xl bg-white h-full overflow-y-auto border-l border-slate-200 flex flex-col">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-2 truncate">
                <BookOpen className="w-4 h-4 text-blue-700 shrink-0" />
                <span className="font-semibold text-slate-900">{activeGuide.guideType}</span>
                <span aria-hidden="true">·</span>
                <span>{activeGuide.category}</span>
              </div>
              <button
                type="button"
                aria-label="Close handbook"
                onClick={() => setActiveGuide(null)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-8 flex-1">
              <div className="space-y-4">
                <h2
                  id="guide-reader-title"
                  className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900 text-balance"
                >
                  {activeGuide.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">{activeGuide.authorName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-medium">
                    {formatRoleLabel(activeGuide.authorRole)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">Class of {activeGuide.authorBatch}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeGuide.authorDepartment}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatRelativeDate(activeGuide.createdAtMs)}</span>
                </div>
                <p className="text-base text-slate-600 leading-relaxed border-y border-slate-200 py-4">
                  {activeGuide.summary}
                </p>
              </div>

              <div className="text-[15px] leading-relaxed text-slate-800 whitespace-pre-line">
                {activeGuide.content}
              </div>

              {activeGuide.keyTakeaways.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
                  <h3 className="text-sm font-display font-bold text-slate-900">
                    Key Takeaways for Incoming Batches
                  </h3>
                  <ol className="space-y-2 text-sm text-slate-700 list-decimal pl-5">
                    {activeGuide.keyTakeaways.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {activeGuide.resourceLinks.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-display font-bold text-slate-900">
                    Curated References & Resources
                  </h3>
                  <ul className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
                    {activeGuide.resourceLinks.map((res, idx) => (
                      <li key={idx} className="px-4 py-3 text-sm text-slate-700 flex items-center justify-between gap-2">
                        <span>{res}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleVoteGuide(activeGuide)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-400 rounded-lg cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Helpful</span>
                  <span className="font-mono tabular-nums">({activeGuide.helpfulCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBookmarkGuide(activeGuide)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-400 rounded-lg cursor-pointer"
                >
                  <BookmarkIcon className="w-3.5 h-3.5" />
                  <span>
                    {bookmarks.some((b) => b.targetType === 'guide' && b.targetId === activeGuide.id)
                      ? 'Saved in Bookmarks'
                      : 'Save Handbook'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Handbook Modal */}
      {composerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 id="publish-guide-title" className="text-lg font-display font-bold text-slate-900">
                Leave Behind a Batch Handbook
              </h2>
              <button
                type="button"
                aria-label="Close handbook composer"
                onClick={() => setComposerOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishGuide} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guide-type" className="block text-xs font-medium text-slate-700 mb-1">
                    Handbook Type
                  </label>
                  <select
                    id="guide-type"
                    value={guideType}
                    onChange={(e) => setGuideType(e.target.value as GuideType)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-700"
                  >
                    {GUIDE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="guide-category" className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    id="guide-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-700"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="guide-title" className="block text-xs font-medium text-slate-700 mb-1">
                  Handbook Title
                </label>
                <input
                  id="guide-title"
                  type="text"
                  required
                  minLength={SCHEMA_LIMITS.TITLE_MIN}
                  maxLength={SCHEMA_LIMITS.TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Embedded Systems Internship Prep & Lab Survival Guide"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label htmlFor="guide-summary" className="block text-xs font-medium text-slate-700 mb-1">
                  One-Paragraph Summary
                </label>
                <textarea
                  id="guide-summary"
                  rows={2}
                  required
                  minLength={SCHEMA_LIMITS.GUIDE_SUMMARY_MIN}
                  maxLength={SCHEMA_LIMITS.GUIDE_SUMMARY_MAX}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Summarize who this guide is for and what batch experience it captures."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label htmlFor="guide-content" className="block text-xs font-medium text-slate-700 mb-1">
                  Full Guide Content
                </label>
                <textarea
                  id="guide-content"
                  rows={5}
                  required
                  minLength={SCHEMA_LIMITS.GUIDE_CONTENT_MIN}
                  maxLength={SCHEMA_LIMITS.GUIDE_CONTENT_MAX}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write detailed timelines, honest lessons learned, club handover workflows, or coursework tips..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guide-takeaways" className="block text-xs font-medium text-slate-700 mb-1">
                    Key Takeaways (one per line)
                  </label>
                  <textarea
                    id="guide-takeaways"
                    rows={3}
                    value={takeawaysInput}
                    onChange={(e) => setTakeawaysInput(e.target.value)}
                    placeholder="Start mock OAs 6 weeks before August&#10;Focus on 2 real projects over 5 clones"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div>
                  <label htmlFor="guide-resources" className="block text-xs font-medium text-slate-700 mb-1">
                    Resource References (one per line)
                  </label>
                  <textarea
                    id="guide-resources"
                    rows={3}
                    value={resourcesInput}
                    onChange={(e) => setResourcesInput(e.target.value)}
                    placeholder="OSTEP Textbook Chapters 1-20&#10;Campus Resume LaTeX Standard"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg cursor-pointer"
                >
                  {submitting ? 'Publishing...' : 'Publish to Archive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
