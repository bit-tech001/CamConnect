import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Search } from 'lucide-react';
import { formatRoleLabel } from '../lib/smartRouting';
import { CATEGORIES, Category, UserPublic } from '../types/camconnect';
import { Avatar } from './Avatar';

interface MentorsViewProps {
  mentors: UserPublic[];
  onAskMentor: (mentorId: string) => void;
}

export function MentorsView({ mentors, onAskMentor }: MentorsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [roleFilter, setRoleFilter] = useState<'all' | 'senior' | 'alumni'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMentors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mentors
      .filter((m) => m.role === 'senior' || m.role === 'alumni')
      .filter((m) => {
        if (roleFilter !== 'all' && m.role !== roleFilter) return false;
        if (selectedCategory !== 'All' && !m.expertiseCategories.includes(selectedCategory)) {
          return false;
        }
        if (q) {
          const hay = `${m.displayName} ${m.department} ${m.bio} ${m.expertiseCategories.join(' ')}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.helpfulCount - a.helpfulCount);
  }, [mentors, selectedCategory, roleFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="max-w-2xl space-y-2 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 text-balance">
          Verified Seniors & Alumni Mentors
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Every mentor is verified through institutional campus credentials. Route a targeted question directly to seniors who have taken the exact courses, internships, or clubs you are navigating.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
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
              All Expertise
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

          <select
            aria-label="Filter mentors by standing"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'senior' | 'alumni')}
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
          >
            <option value="all">Seniors & Alumni</option>
            <option value="senior">Current Seniors</option>
            <option value="alumni">Graduated Alumni</option>
          </select>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, department..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
          />
        </div>
      </div>

      {/* Mentor Cards */}
      {filteredMentors.length === 0 ? (
        <div className="p-10 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <p className="text-base font-display font-semibold text-slate-900">
            No mentors match those criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor.uid}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar name={mentor.displayName} src={mentor.avatarUrl} size="lg" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="text-lg font-display font-bold text-slate-900 truncate">
                      {mentor.displayName}
                    </h2>
                    <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {formatRoleLabel(mentor.role)} · Class of {mentor.batchYear}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 truncate">{mentor.department}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{mentor.bio}</p>

                <div className="text-xs text-slate-500">
                  <span className="font-medium text-slate-800">Mentors in: </span>
                  <span>
                    {mentor.expertiseCategories.length > 0
                      ? mentor.expertiseCategories.join(' · ')
                      : mentor.department}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {mentor.helpfulCount} helpful votes
                </span>
                <button
                  type="button"
                  onClick={() => onAskMentor(mentor.uid)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Route Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
