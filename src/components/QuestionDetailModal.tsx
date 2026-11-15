import { useEffect, useState } from 'react';
import {
  Archive,
  Bookmark as BookmarkIcon,
  CheckCircle2,
  MessageSquare,
  ThumbsUp,
  X,
} from 'lucide-react';
import { SEED_ANSWERS } from '../data/seedData';
import { formatRelativeDate, formatRoleLabel } from '../lib/smartRouting';
import {
  acceptAnswerAndArchiveFaq,
  addAnswerToQuestion,
  hasUserVotedQuestion,
  subscribeQuestionAnswers,
  toggleBookmark,
  toggleQuestionVote,
} from '../services/firestoreService';
import { Answer, Bookmark, Question, SCHEMA_LIMITS, UserPublic } from '../types/camconnect';

interface QuestionDetailModalProps {
  question: Question | null;
  onClose: () => void;
  userProfile: UserPublic | null;
  isLiveFirestore: boolean;
  bookmarks: Bookmark[];
  onRequireAuth: () => void;
  onActionNotice: (msg: string) => void;
}

export function QuestionDetailModal({
  question,
  onClose,
  userProfile,
  isLiveFirestore,
  bookmarks,
  onRequireAuth,
  onActionNotice,
}: QuestionDetailModalProps) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [voted, setVoted] = useState(false);
  const [answerBody, setAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!question) return;
    setErrorMsg(null);
    setAnswerBody('');

    if (!isLiveFirestore) {
      setAnswers(SEED_ANSWERS[question.id] || []);
      setVoted(false);
      return;
    }

    const unsub = subscribeQuestionAnswers(question.id, (liveAnswers) => {
      if (liveAnswers.length === 0 && SEED_ANSWERS[question.id]) {
        setAnswers(SEED_ANSWERS[question.id]);
      } else {
        setAnswers(liveAnswers);
      }
    });

    if (userProfile) {
      hasUserVotedQuestion(question.id, userProfile.uid)
        .then(setVoted)
        .catch(() => setVoted(false));
    } else {
      setVoted(false);
    }

    return () => unsub();
  }, [question, isLiveFirestore, userProfile]);

  if (!question) return null;

  const existingBookmark = bookmarks.find(
    (b) => b.targetType === 'question' && b.targetId === question.id
  );

  const isAuthor = userProfile?.uid === question.authorId;

  const handleVote = async () => {
    if (!userProfile) {
      onRequireAuth();
      return;
    }
    if (!isLiveFirestore) {
      onActionNotice('Sign in as an administrator or create a live thread to persist votes.');
      return;
    }
    try {
      const nowVoted = await toggleQuestionVote(question, userProfile.uid);
      setVoted(nowVoted);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update vote.');
    }
  };

  const handleBookmark = async () => {
    if (!userProfile) {
      onRequireAuth();
      return;
    }
    try {
      const saved = await toggleBookmark({
        userId: userProfile.uid,
        targetType: 'question',
        targetId: question.id,
        title: question.title,
        category: question.category,
        existingBookmarkId: existingBookmark?.id,
      });
      onActionNotice(saved ? 'Saved to your campus bookmarks.' : 'Removed from bookmarks.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update bookmark.');
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      onRequireAuth();
      return;
    }
    setErrorMsg(null);
    if (answerBody.trim().length < SCHEMA_LIMITS.ANSWER_BODY_MIN) {
      setErrorMsg(`Please write at least ${SCHEMA_LIMITS.ANSWER_BODY_MIN} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      await addAnswerToQuestion({
        question,
        author: userProfile,
        body: answerBody.trim(),
      });
      setAnswerBody('');
      onActionNotice('Your answer has been added to the thread.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to post answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAndArchive = async (answerId: string, archiveToFaq: boolean) => {
    if (!userProfile || !isAuthor) return;
    try {
      await acceptAnswerAndArchiveFaq({
        questionId: question.id,
        answerId,
        archiveToFaq,
      });
      onActionNotice(
        archiveToFaq
          ? 'Answer accepted and archived in the Permanent Knowledge Base.'
          : 'Answer marked as accepted solution.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to accept answer.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="thread-modal-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-xs"
    >
      <div className="w-full max-w-3xl bg-white h-full overflow-y-auto border-l border-slate-200 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2 truncate">
            <span className="font-medium text-slate-800">{question.category}</span>
            <span aria-hidden="true">/</span>
            <span className="truncate">{question.topic}</span>
            {question.status === 'archived_faq' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-medium">Archived FAQ</span>
              </>
            )}
          </div>
          <button
            type="button"
            aria-label="Close discussion thread"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thread content */}
        <div className="p-6 sm:p-8 space-y-8 flex-1">
          <article className="space-y-4">
            <h2
              id="thread-modal-title"
              className="text-2xl font-display font-bold tracking-tight text-slate-900 text-balance"
            >
              {question.title}
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-800">{question.authorName}</span>
              <span aria-hidden="true">·</span>
              <span>{formatRoleLabel(question.authorRole)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">Class of {question.authorBatch}</span>
              <span aria-hidden="true">·</span>
              <span>{formatRelativeDate(question.createdAtMs)}</span>
            </div>

            <div className="text-xs text-blue-800 bg-blue-50/70 border border-blue-200/80 rounded-lg px-3.5 py-2 inline-block">
              Smart Mentorship: {question.routedMentorSummary}
            </div>

            <div className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-line pt-2">
              {question.body}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleVote}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  voted
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Helpful</span>
                <span className="font-mono tabular-nums">({question.helpfulCount})</span>
              </button>

              <button
                type="button"
                onClick={handleBookmark}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  existingBookmark
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                <BookmarkIcon className="w-3.5 h-3.5" />
                <span>{existingBookmark ? 'Saved' : 'Save Thread'}</span>
              </button>

              <span className="text-xs text-slate-500 ml-auto flex items-center gap-1.5 font-mono tabular-nums">
                <MessageSquare className="w-3.5 h-3.5" />
                {answers.length} {answers.length === 1 ? 'answer' : 'answers'}
              </span>
            </div>
          </article>

          {/* Answers section */}
          <section className="space-y-5 pt-4 border-t border-slate-200">
            <h3 className="text-base font-display font-semibold text-slate-900">
              Verified Senior & Peer Responses
            </h3>

            {answers.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                No responses yet. This question is currently routed to verified seniors in{' '}
                <strong className="text-slate-900">{question.category}</strong>.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
                {answers.map((ans) => {
                  const isAccepted = ans.isAccepted || question.acceptedAnswerId === ans.id;
                  return (
                    <div key={ans.id} className="p-5 sm:p-6 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-900 text-sm">
                            {ans.authorName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-700 font-medium">
                            {formatRoleLabel(ans.authorRole)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">Class of {ans.authorBatch}</span>
                          {ans.authorDepartment && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{ans.authorDepartment}</span>
                            </>
                          )}
                        </div>

                        {isAccepted && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" />
                            Accepted Solution
                          </span>
                        )}
                      </div>

                      <div className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-line">
                        {ans.body}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                        <span>{formatRelativeDate(ans.createdAtMs)}</span>

                        {isAuthor && question.status !== 'archived_faq' && (
                          <div className="flex items-center gap-2">
                            {!isAccepted && (
                              <button
                                type="button"
                                onClick={() => handleAcceptAndArchive(ans.id, false)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                              >
                                Mark Accepted
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAcceptAndArchive(ans.id, true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              Accept & Archive as FAQ
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Answer composer */}
          <section className="pt-4 border-t border-slate-200">
            <h3 className="text-base font-display font-semibold text-slate-900 mb-3">
              Contribute Experience-Based Guidance
            </h3>

            {!userProfile ? (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-slate-600">
                  Verify your college email ID to answer questions and preserve advice for future batches.
                </p>
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Verify Campus Email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitAnswer} className="space-y-3">
                <textarea
                  rows={4}
                  maxLength={SCHEMA_LIMITS.ANSWER_BODY_MAX}
                  value={answerBody}
                  onChange={(e) => setAnswerBody(e.target.value)}
                  placeholder="Share honest, practical context—workload hours, pitfalls, timelines, or resources that actually helped you..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-blue-700"
                />
                {errorMsg && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {errorMsg}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Posting as <strong className="text-slate-800">{userProfile.displayName}</strong> ·{' '}
                    {formatRoleLabel(userProfile.role)}
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg cursor-pointer"
                  >
                    {submitting ? 'Publishing...' : 'Post Verified Answer'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
