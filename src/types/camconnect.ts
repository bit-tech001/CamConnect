export const CATEGORIES = [
  'Academics',
  'Internships',
  'Clubs',
  'Projects',
  'Campus Life',
  'Career Guidance',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const GUIDE_TYPES = [
  'Preparation Guide',
  'Internship Experience',
  'Club Documentation',
  'Resources & Advice',
] as const;

export type GuideType = (typeof GUIDE_TYPES)[number];

export type UserRole = 'junior' | 'senior' | 'alumni';

export type QuestionStatus = 'open' | 'answered' | 'archived_faq';

export const BATCH_YEARS = ['2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029'] as const;

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Product & Industrial Design',
  'Mathematics & Computing',
  'Economics & Finance',
  'Biotechnology',
  'Civil & Infrastructure',
] as const;

export const SCHEMA_LIMITS = {
  ID_REGEX: /^[a-zA-Z0-9_-]+$/,
  ID_MAX: 128,
  NAME_MIN: 2,
  NAME_MAX: 80,
  TOPIC_MIN: 2,
  TOPIC_MAX: 60,
  TITLE_MIN: 8,
  TITLE_MAX: 160,
  QUESTION_BODY_MIN: 15,
  QUESTION_BODY_MAX: 4000,
  ANSWER_BODY_MIN: 10,
  ANSWER_BODY_MAX: 5000,
  GUIDE_SUMMARY_MIN: 15,
  GUIDE_SUMMARY_MAX: 400,
  GUIDE_CONTENT_MIN: 30,
  GUIDE_CONTENT_MAX: 8000,
  BIO_MAX: 400,
  MAX_ROUTED_MENTORS: 6,
  MAX_EXPERTISE: 6,
  MAX_TAKEAWAYS: 8,
  MAX_RESOURCE_LINKS: 5,
} as const;

export interface UserPublic {
  uid: string;
  displayName: string;
  role: UserRole;
  batchYear: string;
  department: string;
  universityName: string;
  collegeDomain: string;
  isCollegeVerified: boolean;
  expertiseCategories: Category[];
  bio: string;
  avatarUrl?: string;
  helpfulCount: number;
  visibility: 'campus';
  createdAtMs: number;
  updatedAtMs: number;
}

export interface UserPrivate {
  uid: string;
  authEmail: string;
  collegeEmail: string;
  verificationMethod: 'domain_auto' | 'campus_code';
}

export interface Question {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorBatch: string;
  authorVerified: boolean;
  category: Category;
  topic: string;
  title: string;
  body: string;
  routedMentorIds: string[];
  routedMentorSummary: string;
  status: QuestionStatus;
  acceptedAnswerId: string;
  lastAnswerId: string;
  answerCount: number;
  helpfulCount: number;
  visibility: 'campus';
  createdAtMs: number;
  updatedAtMs: number;
}

export interface Answer {
  id: string;
  questionId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorBatch: string;
  authorDepartment: string;
  authorVerified: boolean;
  body: string;
  isAccepted: boolean;
  helpfulCount: number;
  visibility: 'campus';
  createdAtMs: number;
  updatedAtMs: number;
}

export interface BatchGuide {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'senior' | 'alumni';
  authorBatch: string;
  authorDepartment: string;
  guideType: GuideType;
  category: Category;
  title: string;
  summary: string;
  content: string;
  keyTakeaways: string[];
  resourceLinks: string[];
  helpfulCount: number;
  visibility: 'campus';
  createdAtMs: number;
  updatedAtMs: number;
}

export interface Bookmark {
  id: string;
  userId: string;
  targetType: 'question' | 'guide';
  targetId: string;
  title: string;
  category: string;
  createdAtMs: number;
}

export type AppView =
  | 'overview'
  | 'discussions'
  | 'ask'
  | 'repository'
  | 'handbooks'
  | 'mentors'
  | 'profile';
