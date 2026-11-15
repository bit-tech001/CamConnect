import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Answer,
  BatchGuide,
  Bookmark,
  Category,
  GuideType,
  Question,
  SCHEMA_LIMITS,
  UserPrivate,
  UserPublic,
  UserRole,
} from '../types/camconnect';
import { SEED_ANSWERS, SEED_GUIDES, SEED_MENTORS, SEED_QUESTIONS } from '../data/seedData';

function toMillis(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'number') return val;
  if (val && typeof val === 'object' && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

function clampString(val: string, max: number): string {
  return val.trim().slice(0, max);
}

function makeDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, SCHEMA_LIMITS.ID_MAX);
}

export function subscribeCampusMentors(
  onData: (mentors: UserPublic[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'users_public';
  const q = query(collection(db, path), where('visibility', '==', 'campus'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: UserPublic[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: data.uid || d.id,
          displayName: data.displayName || 'Campus Member',
          role: data.role || 'junior',
          batchYear: data.batchYear || '2026',
          department: data.department || 'Computer Science & Engineering',
          universityName: data.universityName || 'Campus University',
          collegeDomain: data.collegeDomain || 'campus.edu',
          isCollegeVerified: Boolean(data.isCollegeVerified),
          expertiseCategories: Array.isArray(data.expertiseCategories) ? data.expertiseCategories : [],
          bio: data.bio || '',
          avatarUrl: data.avatarUrl,
          helpfulCount: typeof data.helpfulCount === 'number' ? data.helpfulCount : 0,
          visibility: 'campus',
          createdAtMs: toMillis(data.createdAt),
          updatedAtMs: toMillis(data.updatedAt),
        };
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export function subscribeQuestions(
  onData: (questions: Question[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'questions';
  const q = query(collection(db, path), where('visibility', '==', 'campus'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Question[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          authorId: data.authorId,
          authorName: data.authorName,
          authorRole: data.authorRole,
          authorBatch: data.authorBatch,
          authorVerified: Boolean(data.authorVerified),
          category: data.category,
          topic: data.topic,
          title: data.title,
          body: data.body,
          routedMentorIds: Array.isArray(data.routedMentorIds) ? data.routedMentorIds : [],
          routedMentorSummary: data.routedMentorSummary || '',
          status: data.status || 'open',
          acceptedAnswerId: data.acceptedAnswerId || '',
          lastAnswerId: data.lastAnswerId || '',
          answerCount: typeof data.answerCount === 'number' ? data.answerCount : 0,
          helpfulCount: typeof data.helpfulCount === 'number' ? data.helpfulCount : 0,
          visibility: 'campus',
          createdAtMs: toMillis(data.createdAt),
          updatedAtMs: toMillis(data.updatedAt),
        };
      });
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export function subscribeQuestionAnswers(
  questionId: string,
  onData: (answers: Answer[]) => void
): () => void {
  const path = `questions/${questionId}/answers`;
  const q = query(
    collection(db, 'questions', questionId, 'answers'),
    where('visibility', '==', 'campus')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Answer[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          questionId: data.questionId,
          authorId: data.authorId,
          authorName: data.authorName,
          authorRole: data.authorRole,
          authorBatch: data.authorBatch,
          authorDepartment: data.authorDepartment || '',
          authorVerified: Boolean(data.authorVerified),
          body: data.body,
          isAccepted: Boolean(data.isAccepted),
          helpfulCount: typeof data.helpfulCount === 'number' ? data.helpfulCount : 0,
          visibility: 'campus',
          createdAtMs: toMillis(data.createdAt),
          updatedAtMs: toMillis(data.updatedAt),
        };
      });
      list.sort((a, b) => a.createdAtMs - b.createdAtMs);
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeGuides(
  onData: (guides: BatchGuide[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'guides';
  const q = query(collection(db, path), where('visibility', '==', 'campus'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: BatchGuide[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          authorId: data.authorId,
          authorName: data.authorName,
          authorRole: data.authorRole,
          authorBatch: data.authorBatch,
          authorDepartment: data.authorDepartment || '',
          guideType: data.guideType,
          category: data.category,
          title: data.title,
          summary: data.summary,
          content: data.content,
          keyTakeaways: Array.isArray(data.keyTakeaways) ? data.keyTakeaways : [],
          resourceLinks: Array.isArray(data.resourceLinks) ? data.resourceLinks : [],
          helpfulCount: typeof data.helpfulCount === 'number' ? data.helpfulCount : 0,
          visibility: 'campus',
          createdAtMs: toMillis(data.createdAt),
          updatedAtMs: toMillis(data.updatedAt),
        };
      });
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export function subscribeUserBookmarks(
  userId: string,
  onData: (bookmarks: Bookmark[]) => void
): () => void {
  const path = 'bookmarks';
  const q = query(collection(db, path), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Bookmark[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          userId: data.userId,
          targetType: data.targetType,
          targetId: data.targetId,
          title: data.title,
          category: data.category,
          createdAtMs: toMillis(data.createdAt),
        };
      });
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function fetchUserProfile(
  uid: string
): Promise<{ publicProfile: UserPublic | null; privateProfile: UserPrivate | null }> {
  const pubPath = `users_public/${uid}`;
  const privPath = `users_private/${uid}`;
  let publicProfile: UserPublic | null = null;
  let privateProfile: UserPrivate | null = null;

  try {
    const pubSnap = await getDoc(doc(db, 'users_public', uid));
    if (pubSnap.exists()) {
      const d = pubSnap.data();
      publicProfile = {
        uid: d.uid,
        displayName: d.displayName,
        role: d.role,
        batchYear: d.batchYear,
        department: d.department,
        universityName: d.universityName,
        collegeDomain: d.collegeDomain,
        isCollegeVerified: Boolean(d.isCollegeVerified),
        expertiseCategories: Array.isArray(d.expertiseCategories) ? d.expertiseCategories : [],
        bio: d.bio || '',
        avatarUrl: d.avatarUrl,
        helpfulCount: typeof d.helpfulCount === 'number' ? d.helpfulCount : 0,
        visibility: 'campus',
        createdAtMs: toMillis(d.createdAt),
        updatedAtMs: toMillis(d.updatedAt),
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pubPath);
  }

  try {
    const privSnap = await getDoc(doc(db, 'users_private', uid));
    if (privSnap.exists()) {
      const d = privSnap.data();
      privateProfile = {
        uid: d.uid,
        authEmail: d.authEmail,
        collegeEmail: d.collegeEmail,
        verificationMethod: d.verificationMethod,
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, privPath);
  }

  return { publicProfile, privateProfile };
}

export async function saveVerifiedUserProfile(params: {
  uid: string;
  authEmail: string;
  collegeEmail: string;
  verificationMethod: 'domain_auto' | 'campus_code';
  displayName: string;
  role: UserRole;
  batchYear: string;
  department: string;
  universityName: string;
  collegeDomain: string;
  expertiseCategories: Category[];
  bio: string;
  avatarUrl?: string;
}): Promise<void> {
  const pubRef = doc(db, 'users_public', params.uid);
  const privRef = doc(db, 'users_private', params.uid);

  let existingPub = false;
  let existingPriv = false;
  let existingHelpful = 0;

  try {
    const pubSnap = await getDoc(pubRef);
    if (pubSnap.exists()) {
      existingPub = true;
      existingHelpful = typeof pubSnap.data().helpfulCount === 'number' ? pubSnap.data().helpfulCount : 0;
    }
    const privSnap = await getDoc(privRef);
    existingPriv = privSnap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users_public/${params.uid}`);
  }

  const batch = writeBatch(db);
  const safeExpertise = params.expertiseCategories.slice(0, SCHEMA_LIMITS.MAX_EXPERTISE);

  if (existingPub) {
    const updatePayload: Record<string, unknown> = {
      displayName: clampString(params.displayName, SCHEMA_LIMITS.NAME_MAX),
      role: params.role,
      batchYear: clampString(params.batchYear, 16),
      department: clampString(params.department, SCHEMA_LIMITS.NAME_MAX),
      universityName: clampString(params.universityName, 120),
      collegeDomain: clampString(params.collegeDomain, 80),
      isCollegeVerified: true,
      expertiseCategories: safeExpertise,
      bio: clampString(params.bio, SCHEMA_LIMITS.BIO_MAX),
      updatedAt: serverTimestamp(),
    };
    if (params.avatarUrl) {
      updatePayload.avatarUrl = clampString(params.avatarUrl, 300);
    }
    batch.update(pubRef, updatePayload);
  } else {
    const createPayload: Record<string, unknown> = {
      uid: params.uid,
      displayName: clampString(params.displayName, SCHEMA_LIMITS.NAME_MAX),
      role: params.role,
      batchYear: clampString(params.batchYear, 16),
      department: clampString(params.department, SCHEMA_LIMITS.NAME_MAX),
      universityName: clampString(params.universityName, 120),
      collegeDomain: clampString(params.collegeDomain, 80),
      isCollegeVerified: true,
      expertiseCategories: safeExpertise,
      bio: clampString(params.bio, SCHEMA_LIMITS.BIO_MAX),
      helpfulCount: existingHelpful,
      visibility: 'campus',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (params.avatarUrl) {
      createPayload.avatarUrl = clampString(params.avatarUrl, 300);
    }
    batch.set(pubRef, createPayload);
  }

  if (existingPriv) {
    batch.update(privRef, {
      collegeEmail: clampString(params.collegeEmail, 160),
      verificationMethod: params.verificationMethod,
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(privRef, {
      uid: params.uid,
      authEmail: clampString(params.authEmail, 160),
      collegeEmail: clampString(params.collegeEmail, 160),
      verificationMethod: params.verificationMethod,
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users_public/${params.uid}`);
  }
}

export async function createQuestion(params: {
  author: UserPublic;
  category: Category;
  topic: string;
  title: string;
  body: string;
  routedMentorIds: string[];
  routedMentorSummary: string;
}): Promise<string> {
  const questionId = makeDocId('q');
  const path = `questions/${questionId}`;
  const payload = {
    id: questionId,
    authorId: params.author.uid,
    authorName: clampString(params.author.displayName, SCHEMA_LIMITS.NAME_MAX),
    authorRole: params.author.role,
    authorBatch: clampString(params.author.batchYear, 16),
    authorVerified: params.author.isCollegeVerified,
    category: params.category,
    topic: clampString(params.topic, SCHEMA_LIMITS.TOPIC_MAX),
    title: clampString(params.title, SCHEMA_LIMITS.TITLE_MAX),
    body: clampString(params.body, SCHEMA_LIMITS.QUESTION_BODY_MAX),
    routedMentorIds: params.routedMentorIds.slice(0, SCHEMA_LIMITS.MAX_ROUTED_MENTORS),
    routedMentorSummary: clampString(params.routedMentorSummary, 160),
    status: 'open',
    acceptedAnswerId: '',
    lastAnswerId: '',
    answerCount: 0,
    helpfulCount: 0,
    visibility: 'campus',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'questions', questionId), payload);
    return questionId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function addAnswerToQuestion(params: {
  question: Question;
  author: UserPublic;
  body: string;
}): Promise<string> {
  const answerId = makeDocId('ans');
  const path = `questions/${params.question.id}/answers/${answerId}`;
  const questionRef = doc(db, 'questions', params.question.id);
  const answerRef = doc(db, 'questions', params.question.id, 'answers', answerId);

  const batch = writeBatch(db);
  batch.set(answerRef, {
    id: answerId,
    questionId: params.question.id,
    authorId: params.author.uid,
    authorName: clampString(params.author.displayName, SCHEMA_LIMITS.NAME_MAX),
    authorRole: params.author.role,
    authorBatch: clampString(params.author.batchYear, 16),
    authorDepartment: clampString(params.author.department, SCHEMA_LIMITS.NAME_MAX),
    authorVerified: params.author.isCollegeVerified,
    body: clampString(params.body, SCHEMA_LIMITS.ANSWER_BODY_MAX),
    isAccepted: false,
    helpfulCount: 0,
    visibility: 'campus',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (params.question.status !== 'archived_faq') {
    batch.update(questionRef, {
      answerCount: params.question.answerCount + 1,
      lastAnswerId: answerId,
      status: 'answered',
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    return answerId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function acceptAnswerAndArchiveFaq(params: {
  questionId: string;
  answerId: string;
  archiveToFaq: boolean;
}): Promise<void> {
  const path = `questions/${params.questionId}`;
  const batch = writeBatch(db);
  batch.update(doc(db, 'questions', params.questionId), {
    acceptedAnswerId: params.answerId,
    status: params.archiveToFaq ? 'archived_faq' : 'answered',
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'questions', params.questionId, 'answers', params.answerId), {
    isAccepted: true,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function hasUserVotedQuestion(questionId: string, userId: string): Promise<boolean> {
  const path = `questions/${questionId}/votes/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'questions', questionId, 'votes', userId));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function toggleQuestionVote(question: Question, userId: string): Promise<boolean> {
  const voteRef = doc(db, 'questions', question.id, 'votes', userId);
  const questionRef = doc(db, 'questions', question.id);
  const path = `questions/${question.id}/votes/${userId}`;

  let alreadyVoted = false;
  try {
    const snap = await getDoc(voteRef);
    alreadyVoted = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const batch = writeBatch(db);
  if (alreadyVoted) {
    batch.delete(voteRef);
    batch.update(questionRef, {
      helpfulCount: Math.max(0, question.helpfulCount - 1),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(voteRef, {
      userId,
      targetId: question.id,
      createdAt: serverTimestamp(),
    });
    batch.update(questionRef, {
      helpfulCount: question.helpfulCount + 1,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    return !alreadyVoted;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createBatchGuide(params: {
  author: UserPublic;
  guideType: GuideType;
  category: Category;
  title: string;
  summary: string;
  content: string;
  keyTakeaways: string[];
  resourceLinks: string[];
}): Promise<string> {
  const guideId = makeDocId('guide');
  const path = `guides/${guideId}`;
  const authorRole = params.author.role === 'alumni' ? 'alumni' : 'senior';

  const payload = {
    id: guideId,
    authorId: params.author.uid,
    authorName: clampString(params.author.displayName, SCHEMA_LIMITS.NAME_MAX),
    authorRole,
    authorBatch: clampString(params.author.batchYear, 16),
    authorDepartment: clampString(params.author.department, SCHEMA_LIMITS.NAME_MAX),
    guideType: params.guideType,
    category: params.category,
    title: clampString(params.title, SCHEMA_LIMITS.TITLE_MAX),
    summary: clampString(params.summary, SCHEMA_LIMITS.GUIDE_SUMMARY_MAX),
    content: clampString(params.content, SCHEMA_LIMITS.GUIDE_CONTENT_MAX),
    keyTakeaways: params.keyTakeaways
      .map((t) => clampString(t, 200))
      .filter(Boolean)
      .slice(0, SCHEMA_LIMITS.MAX_TAKEAWAYS),
    resourceLinks: params.resourceLinks
      .map((r) => clampString(r, 200))
      .filter(Boolean)
      .slice(0, SCHEMA_LIMITS.MAX_RESOURCE_LINKS),
    helpfulCount: 0,
    visibility: 'campus',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'guides', guideId), payload);
    return guideId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleGuideVote(guide: BatchGuide, userId: string): Promise<boolean> {
  const voteRef = doc(db, 'guides', guide.id, 'votes', userId);
  const guideRef = doc(db, 'guides', guide.id);
  const path = `guides/${guide.id}/votes/${userId}`;

  let alreadyVoted = false;
  try {
    const snap = await getDoc(voteRef);
    alreadyVoted = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const batch = writeBatch(db);
  if (alreadyVoted) {
    batch.delete(voteRef);
    batch.update(guideRef, {
      helpfulCount: Math.max(0, guide.helpfulCount - 1),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(voteRef, {
      userId,
      targetId: guide.id,
      createdAt: serverTimestamp(),
    });
    batch.update(guideRef, {
      helpfulCount: guide.helpfulCount + 1,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    return !alreadyVoted;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function toggleBookmark(params: {
  userId: string;
  targetType: 'question' | 'guide';
  targetId: string;
  title: string;
  category: string;
  existingBookmarkId?: string;
}): Promise<boolean> {
  if (params.existingBookmarkId) {
    const path = `bookmarks/${params.existingBookmarkId}`;
    try {
      await deleteDoc(doc(db, 'bookmarks', params.existingBookmarkId));
      return false;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  } else {
    const bookmarkId = `${params.userId}_${params.targetType}_${params.targetId}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, SCHEMA_LIMITS.ID_MAX);
    const path = `bookmarks/${bookmarkId}`;
    try {
      await setDoc(doc(db, 'bookmarks', bookmarkId), {
        id: bookmarkId,
        userId: params.userId,
        targetType: params.targetType,
        targetId: params.targetId,
        title: clampString(params.title, SCHEMA_LIMITS.TITLE_MAX),
        category: clampString(params.category, 40),
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

export async function seedStarterCampusDataIfAdmin(userEmail: string | null | undefined): Promise<boolean> {
  if (userEmail !== 'bp2817433@gmail.com') return false;

  try {
    const existingQ = await getDocs(
      query(collection(db, 'questions'), where('visibility', '==', 'campus'))
    );
    if (!existingQ.empty) return false;

    const batch = writeBatch(db);

    for (const mentor of SEED_MENTORS) {
      batch.set(doc(db, 'users_public', mentor.uid), {
        uid: mentor.uid,
        displayName: mentor.displayName,
        role: mentor.role,
        batchYear: mentor.batchYear,
        department: mentor.department,
        universityName: mentor.universityName,
        collegeDomain: mentor.collegeDomain,
        isCollegeVerified: mentor.isCollegeVerified,
        expertiseCategories: mentor.expertiseCategories,
        bio: mentor.bio,
        ...(mentor.avatarUrl ? { avatarUrl: mentor.avatarUrl } : {}),
        helpfulCount: mentor.helpfulCount,
        visibility: 'campus',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const q of SEED_QUESTIONS) {
      batch.set(doc(db, 'questions', q.id), {
        id: q.id,
        authorId: q.authorId,
        authorName: q.authorName,
        authorRole: q.authorRole,
        authorBatch: q.authorBatch,
        authorVerified: q.authorVerified,
        category: q.category,
        topic: q.topic,
        title: q.title,
        body: q.body,
        routedMentorIds: q.routedMentorIds,
        routedMentorSummary: q.routedMentorSummary,
        status: q.status,
        acceptedAnswerId: q.acceptedAnswerId,
        lastAnswerId: q.lastAnswerId,
        answerCount: q.answerCount,
        helpfulCount: q.helpfulCount,
        visibility: 'campus',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const answers = SEED_ANSWERS[q.id] || [];
      for (const ans of answers) {
        batch.set(doc(db, 'questions', q.id, 'answers', ans.id), {
          id: ans.id,
          questionId: ans.questionId,
          authorId: ans.authorId,
          authorName: ans.authorName,
          authorRole: ans.authorRole,
          authorBatch: ans.authorBatch,
          authorDepartment: ans.authorDepartment,
          authorVerified: ans.authorVerified,
          body: ans.body,
          isAccepted: ans.isAccepted,
          helpfulCount: ans.helpfulCount,
          visibility: 'campus',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    for (const guide of SEED_GUIDES) {
      batch.set(doc(db, 'guides', guide.id), {
        id: guide.id,
        authorId: guide.authorId,
        authorName: guide.authorName,
        authorRole: guide.authorRole,
        authorBatch: guide.authorBatch,
        authorDepartment: guide.authorDepartment,
        guideType: guide.guideType,
        category: guide.category,
        title: guide.title,
        summary: guide.summary,
        content: guide.content,
        keyTakeaways: guide.keyTakeaways,
        resourceLinks: guide.resourceLinks,
        helpfulCount: guide.helpfulCount,
        visibility: 'campus',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedStarterCampusDataIfAdmin');
  }
}
