import { useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { AskSeniorView } from './components/AskSeniorView';
import { BatchHandbooksView } from './components/BatchHandbooksView';
import { DiscussionsView } from './components/DiscussionsView';
import { MentorsView } from './components/MentorsView';
import { Navbar } from './components/Navbar';
import { OverviewView } from './components/OverviewView';
import { ProfileView } from './components/ProfileView';
import { QuestionDetailModal } from './components/QuestionDetailModal';
import { VerificationModal } from './components/VerificationModal';
import { SEED_GUIDES, SEED_MENTORS, SEED_QUESTIONS } from './data/seedData';
import { auth, testFirestoreConnection } from './lib/firebase';
import {
  fetchUserProfile,
  seedStarterCampusDataIfAdmin,
  subscribeCampusMentors,
  subscribeGuides,
  subscribeQuestions,
  subscribeUserBookmarks,
} from './services/firestoreService';
import {
  AppView,
  BatchGuide,
  Bookmark,
  Question,
  UserPrivate,
  UserPublic,
} from './types/camconnect';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('overview');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [userProfile, setUserProfile] = useState<UserPublic | null>(null);
  const [privateProfile, setPrivateProfile] = useState<UserPrivate | null>(null);

  const [liveMentors, setLiveMentors] = useState<UserPublic[]>([]);
  const [liveQuestions, setLiveQuestions] = useState<Question[]>([]);
  const [liveGuides, setLiveGuides] = useState<BatchGuide[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [preselectedMentorId, setPreselectedMentorId] = useState<string | null>(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    testFirestoreConnection().catch(() => {});
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);

      if (user) {
        try {
          if (user.email === 'bp2817433@gmail.com') {
            await seedStarterCampusDataIfAdmin(user.email);
          }
          const { publicProfile, privateProfile: priv } = await fetchUserProfile(user.uid);
          setUserProfile(publicProfile);
          setPrivateProfile(priv);
        } catch (err) {
          console.error(err);
        }
      } else {
        setUserProfile(null);
        setPrivateProfile(null);
        setBookmarks([]);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubMentors = subscribeCampusMentors(
      (data) => setLiveMentors(data),
      () => {}
    );
    const unsubQuestions = subscribeQuestions(
      (data) => setLiveQuestions(data),
      () => {}
    );
    const unsubGuides = subscribeGuides(
      (data) => setLiveGuides(data),
      () => {}
    );

    return () => {
      unsubMentors();
      unsubQuestions();
      unsubGuides();
    };
  }, []);

  useEffect(() => {
    if (!authReady || !firebaseUser) {
      setBookmarks([]);
      return;
    }
    const unsub = subscribeUserBookmarks(firebaseUser.uid, (data) => setBookmarks(data));
    return () => unsub();
  }, [authReady, firebaseUser]);

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    try {
      const { publicProfile, privateProfile: priv } = await fetchUserProfile(firebaseUser.uid);
      setUserProfile(publicProfile);
      setPrivateProfile(priv);
      setNotice('Campus verification profile saved.');
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Unable to refresh profile.');
    }
  };

  const isLiveFirestore = liveQuestions.length > 0;

  const mentors = useMemo(() => {
    const byId = new Map<string, UserPublic>();
    for (const m of SEED_MENTORS) byId.set(m.uid, m);
    for (const m of liveMentors) byId.set(m.uid, m);
    return Array.from(byId.values());
  }, [liveMentors]);

  const questions = useMemo(() => {
    if (liveQuestions.length > 0) return liveQuestions;
    return SEED_QUESTIONS;
  }, [liveQuestions]);

  const guides = useMemo(() => {
    if (liveGuides.length > 0) return liveGuides;
    return SEED_GUIDES;
  }, [liveGuides]);

  const selectedQuestion = useMemo(
    () => questions.find((q) => q.id === selectedQuestionId) || null,
    [questions, selectedQuestionId]
  );

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskMentor = (mentorId: string) => {
    setPreselectedMentorId(mentorId);
    handleNavigate('ask');
  };

  const showNotice = (msg: string) => {
    setNotice(msg);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar
        activeView={activeView}
        onNavigate={handleNavigate}
        userProfile={userProfile}
        isSignedIn={Boolean(firebaseUser)}
        onOpenAuth={() => setVerificationModalOpen(true)}
      />

      {/* Toast / Notice Banner */}
      {notice && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{notice}</span>
            </span>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setNotice(null)}
              className="p-1 text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {errorBanner && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{errorBanner}</span>
            </span>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setErrorBanner(null)}
              className="p-1 text-red-700 hover:text-red-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {activeView === 'overview' && (
          <OverviewView
            questions={questions}
            guides={guides}
            mentors={mentors}
            onNavigate={handleNavigate}
            onSelectQuestion={(q) => setSelectedQuestionId(q.id)}
            onAskMentor={handleAskMentor}
          />
        )}

        {activeView === 'discussions' && (
          <DiscussionsView
            mode="discussions"
            questions={questions}
            bookmarks={bookmarks}
            userProfile={userProfile}
            onSelectQuestion={(q) => setSelectedQuestionId(q.id)}
            onAskNew={() => handleNavigate('ask')}
          />
        )}

        {activeView === 'repository' && (
          <DiscussionsView
            mode="repository"
            questions={questions}
            bookmarks={bookmarks}
            userProfile={userProfile}
            onSelectQuestion={(q) => setSelectedQuestionId(q.id)}
            onAskNew={() => handleNavigate('ask')}
          />
        )}

        {activeView === 'ask' && (
          <AskSeniorView
            mentors={mentors}
            userProfile={userProfile}
            preselectedMentorId={preselectedMentorId}
            onClearPreselectedMentor={() => setPreselectedMentorId(null)}
            onRequireAuth={() => setVerificationModalOpen(true)}
            onQuestionCreated={(id) => {
              showNotice('Question routed to matching verified seniors and published.');
              handleNavigate('discussions');
              setSelectedQuestionId(id);
            }}
          />
        )}

        {activeView === 'handbooks' && (
          <BatchHandbooksView
            guides={guides}
            bookmarks={bookmarks}
            userProfile={userProfile}
            isLiveFirestore={isLiveFirestore}
            onRequireAuth={() => setVerificationModalOpen(true)}
            onActionNotice={showNotice}
          />
        )}

        {activeView === 'mentors' && (
          <MentorsView mentors={mentors} onAskMentor={handleAskMentor} />
        )}

        {activeView === 'profile' && (
          <ProfileView
            userProfile={userProfile}
            privateProfile={privateProfile}
            questions={questions}
            guides={guides}
            bookmarks={bookmarks}
            onEditProfile={() => setVerificationModalOpen(true)}
            onSelectQuestion={(q) => setSelectedQuestionId(q.id)}
            onNavigateHandbooks={() => handleNavigate('handbooks')}
          />
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="space-y-1">
            <span className="font-display font-bold text-sm text-slate-900">CamConnect</span>
            <p>Verified student knowledge and batch-to-batch mentorship commons.</p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-slate-600">
            <button type="button" onClick={() => handleNavigate('discussions')} className="hover:text-slate-900 cursor-pointer">
              Discussions
            </button>
            <button type="button" onClick={() => handleNavigate('ask')} className="hover:text-slate-900 cursor-pointer">
              Ask a Senior
            </button>
            <button type="button" onClick={() => handleNavigate('repository')} className="hover:text-slate-900 cursor-pointer">
              Knowledge Base
            </button>
            <button type="button" onClick={() => handleNavigate('handbooks')} className="hover:text-slate-900 cursor-pointer">
              Batch Handbooks
            </button>
            <button type="button" onClick={() => handleNavigate('mentors')} className="hover:text-slate-900 cursor-pointer">
              Mentors
            </button>
          </div>
        </div>
      </footer>

      <QuestionDetailModal
        question={selectedQuestion}
        onClose={() => setSelectedQuestionId(null)}
        userProfile={userProfile}
        isLiveFirestore={isLiveFirestore}
        bookmarks={bookmarks}
        onRequireAuth={() => setVerificationModalOpen(true)}
        onActionNotice={showNotice}
      />

      <VerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        firebaseUser={firebaseUser}
        existingProfile={userProfile}
        onProfileSaved={refreshProfile}
      />
    </div>
  );
}
