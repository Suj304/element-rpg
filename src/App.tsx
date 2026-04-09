import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { Player as PlayerData } from './lib/types';
import { CharacterCreation } from './components/CharacterCreation';
import { Game } from './components/Game';
import { Wand2, LogOut } from 'lucide-react';

type AuthState = 'loading' | 'unauthenticated' | 'authenticated' | 'in_game';

function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<any>(null);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          (async () => {
            await loadPlayerData(session.user.id);
          })();
        } else {
          setUser(null);
          setPlayer(null);
          setAuthState('unauthenticated');
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadPlayerData(session.user.id);
      } else {
        setAuthState('unauthenticated');
      }
    } catch (err) {
      setAuthState('unauthenticated');
    }
  };

  const loadPlayerData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading player:', error);
        setAuthState('authenticated');
        return;
      }

      if (data) {
        setPlayer(data);
        setAuthState('in_game');
      } else {
        setAuthState('authenticated');
      }
    } catch (err) {
      setAuthState('authenticated');
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          setError('');
          setEmail('');
          setPassword('');
          setIsSignUp(false);
          setError('Check your email to confirm your account!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setError(error.message);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPlayer(null);
    setAuthState('unauthenticated');
  };

  const handleCharacterCreated = async () => {
    if (user) {
      await loadPlayerData(user.id);
    }
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <Wand2 className="w-16 h-16 text-purple-400 animate-spin mb-4" />
          </div>
          <p className="text-white text-xl font-semibold">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Wand2 className="w-12 h-12 text-purple-400" />
              <h1 className="text-4xl font-bold text-white">Elemental</h1>
            </div>
            <p className="text-slate-300">
              {isSignUp ? 'Create an account' : 'Sign in to your account'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>

            {error && (
              <div className={`px-4 py-3 rounded-lg text-sm ${
                error.includes('Check your email')
                  ? 'bg-green-900/50 border border-green-500 text-green-200'
                  : 'bg-red-900/50 border border-red-500 text-red-200'
              }`}>
                {error}
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-bold hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (isSignUp ? 'Creating...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>

            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="w-full text-purple-400 hover:text-purple-300 font-semibold py-2 transition"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authState === 'authenticated' && !player) {
    return (
      <CharacterCreation
        userId={user.id}
        onCharacterCreated={handleCharacterCreated}
      />
    );
  }

  if (authState === 'in_game' && player) {
    return (
      <div className="relative">
        <Game player={player} />
        <button
          onClick={handleLogout}
          className="fixed top-4 right-4 z-40 bg-slate-900/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-800 transition border border-slate-700"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    );
  }

  return null;
}

export default App;
