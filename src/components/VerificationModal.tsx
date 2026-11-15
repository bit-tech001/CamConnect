import { useEffect, useState } from 'react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import { CheckCircle2, Mail, ShieldCheck, X } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import {
  extractDomainFromEmail,
  inferUniversityFromDomain,
  isAcademicEmailDomain,
} from '../lib/smartRouting';
import { saveVerifiedUserProfile } from '../services/firestoreService';
import {
  BATCH_YEARS,
  CATEGORIES,
  Category,
  DEPARTMENTS,
  UserPublic,
  UserRole,
} from '../types/camconnect';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser: User | null;
  existingProfile: UserPublic | null;
  onProfileSaved: () => void;
}

export function VerificationModal({
  isOpen,
  onClose,
  firebaseUser,
  existingProfile,
  onProfileSaved,
}: VerificationModalProps) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [collegeEmail, setCollegeEmail] = useState('');
  const [role, setRole] = useState<UserRole>('junior');
  const [batchYear, setBatchYear] = useState('2027');
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [universityName, setUniversityName] = useState('Institute of Technology');
  const [expertiseCategories, setExpertiseCategories] = useState<Category[]>(['Academics']);
  const [bio, setBio] = useState('');

  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [emailVerifiedStep, setEmailVerifiedStep] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAuthError(null);
    setFormError(null);

    if (existingProfile) {
      setDisplayName(existingProfile.displayName);
      setRole(existingProfile.role);
      setBatchYear(existingProfile.batchYear);
      setDepartment(existingProfile.department);
      setUniversityName(existingProfile.universityName);
      setExpertiseCategories(existingProfile.expertiseCategories);
      setBio(existingProfile.bio);
      setEmailVerifiedStep(existingProfile.isCollegeVerified);
    } else if (firebaseUser) {
      setDisplayName(firebaseUser.displayName || 'Campus Student');
      const userEmail = firebaseUser.email || '';
      if (isAcademicEmailDomain(userEmail)) {
        setCollegeEmail(userEmail);
        setUniversityName(inferUniversityFromDomain(extractDomainFromEmail(userEmail)));
        setEmailVerifiedStep(true);
      } else {
        setCollegeEmail('');
        setEmailVerifiedStep(false);
      }
    }
  }, [isOpen, firebaseUser, existingProfile]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in with Google.';
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendVerificationCode = () => {
    setFormError(null);
    const trimmed = collegeEmail.trim().toLowerCase();
    if (!trimmed.includes('@') || trimmed.length < 6) {
      setFormError('Enter a valid college email address (e.g., name@university.edu).');
      return;
    }

    if (isAcademicEmailDomain(trimmed)) {
      const domain = extractDomainFromEmail(trimmed);
      setUniversityName(inferUniversityFromDomain(domain));
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setIssuedCode(code);
    setEnteredCode('');
    setEmailVerifiedStep(false);
  };

  const handleConfirmCode = () => {
    setFormError(null);
    if (!issuedCode || enteredCode.trim() !== issuedCode) {
      setFormError('The 6-digit verification code does not match. Check the issued code above.');
      return;
    }
    setEmailVerifiedStep(true);
    const domain = extractDomainFromEmail(collegeEmail);
    if (domain && universityName === 'Institute of Technology') {
      setUniversityName(inferUniversityFromDomain(domain));
    }
  };

  const toggleExpertise = (cat: Category) => {
    setExpertiseCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.length > 1 ? prev.filter((c) => c !== cat) : prev;
      }
      return prev.length < 6 ? [...prev, cat] : prev;
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setFormError(null);

    if (displayName.trim().length < 2) {
      setFormError('Display name must be at least 2 characters.');
      return;
    }

    const effectiveCollegeEmail =
      collegeEmail.trim() ||
      (existingProfile ? `${existingProfile.uid}@${existingProfile.collegeDomain}` : firebaseUser.email || '');

    if (!emailVerifiedStep && !existingProfile?.isCollegeVerified) {
      setFormError('Please verify your college email ID before saving your campus profile.');
      return;
    }

    const domain = extractDomainFromEmail(effectiveCollegeEmail);
    const autoMethod = isAcademicEmailDomain(firebaseUser.email || '') ? 'domain_auto' : 'campus_code';

    setSaving(true);
    try {
      await saveVerifiedUserProfile({
        uid: firebaseUser.uid,
        authEmail: firebaseUser.email || '',
        collegeEmail: effectiveCollegeEmail,
        verificationMethod: autoMethod,
        displayName: displayName.trim(),
        role,
        batchYear,
        department,
        universityName: universityName.trim() || 'Institute of Technology',
        collegeDomain: domain,
        expertiseCategories: role === 'junior' ? [] : expertiseCategories,
        bio: bio.trim() || `${role === 'junior' ? 'Student' : role === 'senior' ? 'Senior mentor' : 'Alumni'} in ${department} (Class of ${batchYear}).`,
        avatarUrl: firebaseUser.photoURL || existingProfile?.avatarUrl,
      });
      onProfileSaved();
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save campus profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl shadow-xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="verify-modal-title" className="text-lg font-display font-bold text-slate-900">
              {existingProfile ? 'Campus Profile & Verification' : 'Verify Your College Community Access'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified academic identities keep discussions accountable and trusted.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close verification modal"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!firebaseUser ? (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>Step 1 of 2: Authenticate with Google</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Sign in with your Google account first. On the next step, you can link and verify your institutional <span className="font-mono text-xs text-slate-800">.edu</span> or <span className="font-mono text-xs text-slate-800">.ac.in</span> college email ID and batch year.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {authError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={handleGoogleSignIn}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                >
                  {authLoading ? 'Opening Google Sign-In...' : 'Continue with Google'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                <span>
                  Signed in as <strong className="text-slate-900">{firebaseUser.email}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => signOut(auth)}
                  className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  Switch account
                </button>
              </div>

              {/* College Email Verification Box */}
              {!existingProfile?.isCollegeVerified && (
                <div className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <label htmlFor="college-email-input" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-700" />
                      <span>College Email Verification</span>
                    </label>
                    {emailVerifiedStep && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    )}
                  </div>

                  {!emailVerifiedStep ? (
                    <>
                      <div className="flex gap-2">
                        <input
                          id="college-email-input"
                          type="email"
                          value={collegeEmail}
                          onChange={(e) => setCollegeEmail(e.target.value)}
                          placeholder="your.name@university.edu or .ac.in"
                          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                        />
                        <button
                          type="button"
                          onClick={handleSendVerificationCode}
                          className="px-4 py-2 text-sm font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Send Code
                        </button>
                      </div>

                      {issuedCode && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2.5">
                          <p className="text-xs text-blue-900">
                            Verification code dispatched to <strong>{collegeEmail}</strong>. For preview testing, your campus verification code is{' '}
                            <span className="font-mono font-bold text-sm tracking-wider">{issuedCode}</span>.
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={enteredCode}
                              onChange={(e) => setEnteredCode(e.target.value)}
                              placeholder="Enter 6-digit code"
                              maxLength={6}
                              className="w-40 px-3 py-1.5 text-sm font-mono border border-blue-300 rounded-lg bg-white focus:outline-none focus:border-blue-700"
                            />
                            <button
                              type="button"
                              onClick={handleConfirmCode}
                              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                            >
                              Verify Email
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-600">
                      Institutional email <strong className="text-slate-900">{collegeEmail}</strong> verified.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-name" className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={80}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label htmlFor="profile-univ" className="block text-xs font-medium text-slate-700 mb-1">
                    Institution Name
                  </label>
                  <input
                    id="profile-univ"
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={universityName}
                    onChange={(e) => setUniversityName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="profile-role" className="block text-xs font-medium text-slate-700 mb-1">
                    Campus Standing
                  </label>
                  <select
                    id="profile-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-700"
                  >
                    <option value="junior">Junior / Student</option>
                    <option value="senior">Senior Mentor</option>
                    <option value="alumni">Alumni Mentor</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="profile-batch" className="block text-xs font-medium text-slate-700 mb-1">
                    Graduating Batch
                  </label>
                  <select
                    id="profile-batch"
                    value={batchYear}
                    onChange={(e) => setBatchYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-700"
                  >
                    {BATCH_YEARS.map((y) => (
                      <option key={y} value={y}>
                        Class of {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="profile-dept" className="block text-xs font-medium text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    id="profile-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-700"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(role === 'senior' || role === 'alumni') && (
                <div>
                  <span className="block text-xs font-medium text-slate-700 mb-2">
                    Mentorship Categories (questions in these areas route to you)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => {
                      const active = expertiseCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleExpertise(cat)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                            active
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="profile-bio" className="block text-xs font-medium text-slate-700 mb-1">
                  Short Experience Bio (optional)
                </label>
                <textarea
                  id="profile-bio"
                  rows={2}
                  maxLength={400}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share clubs, internships, research areas, or electives you can advise on."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg cursor-pointer"
                >
                  {saving ? 'Saving Profile...' : 'Save Campus Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
