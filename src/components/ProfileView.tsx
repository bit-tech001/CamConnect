import { signOut } from 'firebase/auth';
import { Bookmark as BookmarkIcon, CheckCircle2, Edit3, LogOut, ShieldCheck } from 'lucide-react';
import { auth } from '../lib/firebase';
import { formatRelativeDate, formatRoleLabel } from '../lib/smartRouting';
import { BatchGuide, Bookmark, Question, UserPrivate, UserPublic } from '../types/camconnect';
import { Avatar } from './Avatar';

interface ProfileViewProps {
  userProfile: UserPublic | null;
  privateProfile: UserPrivate | null;
  questions: Question[];
  guides: BatchGuide[];
  bookmarks: Bookmark[];
  onEditProfile: () => void;
  onSelectQuestion: (q: Question) => void;
  onNavigateHandbooks: () => void;
}

export function ProfileView({
  userProfile,
  privateProfile,
  questions,
  guides,
  bookmarks,
  onEditProfile,
  onSelectQuestion,
  onNavigateHandbooks,
}: ProfileViewProps) {
  if (!userProfile) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <ShieldCheck className="w-10 h-10 text-blue-700 mx-auto" />
        <h1 className="text-2xl font-display font-bold text-slate-900">
          Verify Your Campus Email
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Sign in and verify your college email ID to access your personal bookmarks, routed mentorship queue, and question history.
        </p>
        <button
          type="button"
          onClick={onEditProfile}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
        >
          Verify Campus Email
        </button>
      </div>
    );
  }

  const myQuestions = questions.filter((q) => q.authorId === userProfile.uid);
  const routedToMe =
    userProfile.role === 'senior' || userProfile.role === 'alumni'
      ? questions.filter(
          (q) =>
            q.routedMentorIds.includes(userProfile.uid) ||
            userProfile.expertiseCategories.includes(q.category)
        )
      : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <Avatar name={userProfile.displayName} src={userProfile.avatarUrl} size="lg" />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-display font-bold text-slate-900">
                {userProfile.displayName}
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {formatRoleLabel(userProfile.role)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>{userProfile.universityName}</span>
              <span aria-hidden="true">·</span>
              <span>{userProfile.department}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">Class of {userProfile.batchYear}</span>
            </div>

            {privateProfile && (
              <p className="text-xs text-slate-500">
                Verified campus email:{' '}
                <span className="font-mono text-slate-700">{privateProfile.collegeEmail}</span>
              </p>
            )}

            <p className="text-sm text-slate-600 pt-1 max-w-2xl">{userProfile.bio}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onEditProfile}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={() => signOut(auth)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Two-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Questions / Mentorship Queue */}
        <div className="lg:col-span-7 space-y-6">
          {(userProfile.role === 'senior' || userProfile.role === 'alumni') && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-bold text-slate-900">
                  Questions Routed to Your Expertise
                </h2>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {routedToMe.length} threads
                </span>
              </div>

              {routedToMe.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                  No open questions are currently routed to your expertise categories.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
                  {routedToMe.slice(0, 6).map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => onSelectQuestion(q)}
                      className="w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-1"
                    >
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{q.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{q.topic}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatRelativeDate(q.createdAtMs)}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{q.title}</p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-slate-900">
                Questions You Asked
              </h2>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {myQuestions.length} threads
              </span>
            </div>

            {myQuestions.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                You have not posted any questions yet. Use Ask a Senior to route your first query.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
                {myQuestions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onSelectQuestion(q)}
                    className="w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-1"
                  >
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{q.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{q.answerCount} answers</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{q.title}</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: Saved Bookmarks */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
              <BookmarkIcon className="w-4 h-4 text-slate-700" />
              <span>Saved Repository Items</span>
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {bookmarks.length}
            </span>
          </div>

          {bookmarks.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
              Save useful discussions or batch handbooks to build your personal campus study shelf.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
              {bookmarks.map((bm) => {
                const linkedQ =
                  bm.targetType === 'question'
                    ? questions.find((q) => q.id === bm.targetId)
                    : undefined;
                const linkedG =
                  bm.targetType === 'guide'
                    ? guides.find((g) => g.id === bm.targetId)
                    : undefined;

                return (
                  <button
                    key={bm.id}
                    type="button"
                    onClick={() => {
                      if (linkedQ) onSelectQuestion(linkedQ);
                      else if (linkedG) onNavigateHandbooks();
                    }}
                    className="w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-1"
                  >
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="font-medium text-blue-700">
                        {bm.targetType === 'guide' ? 'Batch Handbook' : 'Discussion'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{bm.category}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{bm.title}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
