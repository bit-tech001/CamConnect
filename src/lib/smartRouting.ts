import { Category, UserPublic } from '../types/camconnect';

const ACADEMIC_DOMAIN_PATTERNS = [
  /\.edu$/i,
  /\.edu\.[a-z]{2,3}$/i,
  /\.ac\.[a-z]{2,3}$/i,
  /\.ernet\.in$/i,
];

export function isAcademicEmailDomain(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const atIdx = trimmed.indexOf('@');
  if (atIdx === -1) return false;
  const domain = trimmed.slice(atIdx + 1);
  return ACADEMIC_DOMAIN_PATTERNS.some((pattern) => pattern.test(domain));
}

export function extractDomainFromEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const atIdx = trimmed.indexOf('@');
  if (atIdx === -1) return 'campus.edu';
  return trimmed.slice(atIdx + 1) || 'campus.edu';
}

export function inferUniversityFromDomain(domain: string): string {
  const clean = domain.toLowerCase();
  if (clean.includes('iitb')) return 'IIT Bombay';
  if (clean.includes('iitd')) return 'IIT Delhi';
  if (clean.includes('stanford')) return 'Stanford University';
  if (clean.includes('berkeley')) return 'UC Berkeley';
  if (clean.includes('mit.edu')) return 'MIT';
  if (clean.includes('bits-pilani')) return 'BITS Pilani';
  if (clean.includes('nit')) return 'National Institute of Technology';
  const parts = clean.split('.');
  const root = parts[0] || 'Campus';
  return `${root.toUpperCase()} Campus`;
}

export interface MentorMatchResult {
  mentor: UserPublic;
  score: number;
  reason: string;
}

export function matchMentorsForQuestion(
  category: Category,
  topic: string,
  mentors: UserPublic[],
  preferredMentorId?: string
): {
  matches: MentorMatchResult[];
  routedMentorIds: string[];
  routedMentorSummary: string;
} {
  const topicWords = topic
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2);

  const eligibleMentors = mentors.filter(
    (m) => m.role === 'senior' || m.role === 'alumni'
  );

  const scored: MentorMatchResult[] = eligibleMentors
    .map((mentor) => {
      let score = 0;
      const reasons: string[] = [];

      if (preferredMentorId && mentor.uid === preferredMentorId) {
        score += 100;
        reasons.push('Directly requested');
      }

      if (mentor.expertiseCategories.includes(category)) {
        score += 40;
        reasons.push(`${category} mentor`);
      }

      const searchableText = `${mentor.department} ${mentor.bio} ${mentor.expertiseCategories.join(' ')}`.toLowerCase();
      const matchedKeywords = topicWords.filter((word) => searchableText.includes(word));
      if (matchedKeywords.length > 0) {
        score += matchedKeywords.length * 12;
        reasons.push(`Matches "${matchedKeywords.slice(0, 2).join(', ')}"`);
      }

      if (mentor.isCollegeVerified) {
        score += 10;
      }

      score += Math.min(mentor.helpfulCount, 50) * 0.2;

      return {
        mentor,
        score,
        reason: reasons.length > 0 ? reasons.join(' · ') : `${mentor.department}`,
      };
    })
    .filter((item) => item.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const routedMentorIds = scored.map((item) => item.mentor.uid);
  const routedMentorSummary =
    scored.length > 0
      ? `Routed to ${scored.length} verified ${scored.length === 1 ? 'senior' : 'seniors'} in ${category}`
      : `Queued for verified ${category} mentors`;

  return {
    matches: scored,
    routedMentorIds,
    routedMentorSummary,
  };
}

export function formatRoleLabel(role: 'junior' | 'senior' | 'alumni'): string {
  if (role === 'alumni') return 'Verified Alumni';
  if (role === 'senior') return 'Verified Senior';
  return 'Verified Student';
}

export function formatRelativeDate(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
