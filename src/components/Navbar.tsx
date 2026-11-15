import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { AppView, UserPublic } from '../types/camconnect';

interface NavbarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  userProfile: UserPublic | null;
  isSignedIn: boolean;
  onOpenAuth: () => void;
}

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'discussions', label: 'Discussions' },
  { id: 'ask', label: 'Ask a Senior' },
  { id: 'repository', label: 'Knowledge Base' },
  { id: 'handbooks', label: 'Batch Handbooks' },
  { id: 'mentors', label: 'Mentors' },
];

export function Navbar({
  activeView,
  onNavigate,
  userProfile,
  isSignedIn,
  onOpenAuth,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (view: AppView) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single clean wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('overview')}
          className="text-xl font-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          CamConnect
        </button>

        {/* Zone 2: 5 concise single-line text links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 ${
                  isActive
                    ? 'border-blue-700 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {isSignedIn && userProfile ? (
            <button
              type="button"
              onClick={() => handleNavClick('profile')}
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              <span className="max-w-[160px] truncate">{userProfile.displayName}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              {isSignedIn ? 'Complete Verification' : 'Verify Campus Email'}
            </button>
          )}

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                activeView === item.id
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-200">
            {isSignedIn && userProfile ? (
              <button
                type="button"
                onClick={() => handleNavClick('profile')}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 cursor-pointer"
              >
                Campus Profile ({userProfile.displayName})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenAuth();
                }}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 cursor-pointer"
              >
                {isSignedIn ? 'Complete Campus Verification' : 'Verify Campus Email'}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
