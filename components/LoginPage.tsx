import React, { useState } from 'react';
import { authService } from '../src/services/authService';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = isLogin 
      ? await authService.login(email, password)
      : await authService.register(email, password, displayName);

    if (result.success) {
      onLoginSuccess?.();
    } else {
      setError(result.error || 'Errore sconosciuto');
    }
    
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Inserisci la tua email prima');
      return;
    }
    
    setLoading(true);
    const result = await authService.resetPassword(email);
    
    if (result.success) {
      setResetEmailSent(true);
      setError('');
    } else {
      setError(result.error || 'Errore nell\'invio email');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-100 dark:text-white">
              Celerya Syd Platform
            </h1>
            <p className="text-slate-400 dark:text-slate-400 mt-2">
              {isLogin ? 'Accedi al tuo account' : 'Crea un nuovo account'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {resetEmailSent && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg text-green-700 dark:text-green-400 text-sm">
              Email di reset password inviata! Controlla la tua casella di posta.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-700 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Il tuo nome"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-700 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                placeholder="nome@azienda.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-700 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <SpinnerIcon className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? 'Accedi' : 'Registrati'
              )}
            </button>
          </form>

          {/* Additional Actions */}
          <div className="mt-6 space-y-3">
            {isLogin && (
              <button
                onClick={handleResetPassword}
                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
                disabled={loading}
              >
                Password dimenticata?
              </button>
            )}

            <div className="text-center text-sm text-slate-400 dark:text-slate-400">
              {isLogin ? 'Non hai un account?' : 'Hai già un account?'}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setResetEmailSent(false);
                }}
                className="ml-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {isLogin ? 'Registrati' : 'Accedi'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-8">
          © 2024 Celerya. Tutti i diritti riservati.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;