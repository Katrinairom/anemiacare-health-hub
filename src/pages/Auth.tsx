import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'login' | 'signup'>(
    searchParams.get('tab') === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [dob, setDob] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (tab === 'signup') {
      if (!name.trim()) return 'Please enter your full name.';
      if (!age || parseInt(age) < 10 || parseInt(age) > 100) return 'Please enter a valid age.';
      if (!dob) return 'Please enter your date of birth.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (tab === 'signup') {
        const { error } = await signUp(email, password, name, parseInt(age), dob);
        if (error) { setError(error); return; }
        navigate('/quiz');
      } else {
        const { error } = await signIn(email, password);
        if (error) { setError(error); return; }
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md fade-in">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <Heart className="h-8 w-8 text-secondary" fill="hsl(var(--secondary))" />
          <span className="font-display text-2xl font-bold text-foreground">AnemiaCare</span>
        </Link>

        {/* Tab Toggle */}
        <div className="mb-6 flex rounded-xl bg-muted p-1">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(''); }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === 'signup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 shadow-sm">
          {tab === 'signup' && (
            <>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  maxLength={100}
                />
              </div>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="28"
                    min={10}
                    max={100}
                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@example.com"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              maxLength={255}
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-lg border bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-secondary py-3 font-display text-sm font-semibold text-secondary-foreground transition-all hover:opacity-90 disabled:opacity-50 btn-hover-scale"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                Please wait...
              </span>
            ) : tab === 'signup' ? 'Create Account' : 'Log In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(''); }}
            className="font-semibold text-foreground underline"
          >
            {tab === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}
