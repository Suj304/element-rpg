import { useState } from 'react';
import { X, Users, Copy, Check } from 'lucide-react';

interface MultiplayerLobbyProps {
  onClose: () => void;
  onCreateSession: () => Promise<string | null>;
  onJoinSession: (code: string) => Promise<boolean>;
  sessionCode: string | null;
}

export function MultiplayerLobby({
  onClose,
  onCreateSession,
  onJoinSession,
  sessionCode,
}: MultiplayerLobbyProps) {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      await onCreateSession();
    } catch (err) {
      setError('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const success = await onJoinSession(joinCode.trim().toUpperCase());
      if (!success) {
        setError('Session not found or full');
      }
    } catch (err) {
      setError('Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Multiplayer</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {sessionCode ? (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-300 text-sm mb-2">Session Code:</p>
              <div className="flex items-center gap-2">
                <code className="text-2xl font-bold text-purple-400 flex-1">
                  {sessionCode}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-slate-400 text-sm text-center">
              Share this code with your friends to play together
            </p>
            <button
              onClick={onClose}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-semibold transition"
            >
              Start Playing
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-4 rounded-xl font-bold text-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Creating...' : 'Create New Session'}
              </button>
              <p className="text-slate-400 text-sm mt-2 text-center">
                Host a game for your friends
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-800 text-slate-400">or</span>
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Join Existing Session
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter session code"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-lg font-mono uppercase"
                maxLength={6}
              />
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full mt-3 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : 'Join Session'}
              </button>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
