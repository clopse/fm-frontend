'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { userService } from '@/services/userService';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlMessage = searchParams.get('message');
    if (!urlMessage) return;
    setMessage(urlMessage);
    const t = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(t);
  }, [searchParams]);

  useEffect(() => {
    if (emailRef.current?.value || passwordRef.current?.value) setError('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const email = (emailRef.current?.value || '').trim().toLowerCase();
      const password = passwordRef.current?.value || '';

      if (!email || !password) throw new Error('Please fill in all fields');

      await userService.login({ email, password });
      const redirect = searchParams.get('redirect');
      router.push(redirect && redirect.startsWith('/') ? redirect : '/hotels');
    } catch (err) {
      let errorMessage = 'Login failed';
      if (err instanceof Error) errorMessage = err.message;
      else if (typeof err === 'string') errorMessage = err;

      const low = errorMessage.toLowerCase();
      if (low.includes('unauthorized') || low.includes('invalid credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (low.includes('network')) {
        errorMessage = 'Connection error. Please check your internet and try again.';
      } else if (low.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4"
      style={{ backgroundImage: "url('/background-login.jpg')" }}
    >
      <div className="bg-white bg-opacity-95 p-6 sm:p-8 rounded-xl shadow-lg text-center w-full max-w-sm mx-auto">
        <div className="mb-1">
          <img
            src="/jmk-logo2.png"
            alt="JMK Logo"
            className="mx-auto w-full max-w-xs h-auto"
          />
        </div>

        <h2 className="mt-0 mb-6 text-xl font-medium text-center text-blue-900">
          Facilities
        </h2>

        {message && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => loading && e.key === 'Enter' && e.preventDefault()}
          className="space-y-4"
          autoComplete="on"
          name="login"
        >
          <input type="hidden" name="form-name" value="login" />
          
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              ref={emailRef}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50"
              autoFocus
              autoComplete="email"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Email"
              onInput={() => error && setError('')}
              required
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              ref={passwordRef}
              disabled={loading}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50"
              autoComplete="current-password"
              aria-label="Password"
              onInput={() => error && setError('')}
              required
            />

            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword((v) => !v)}
              disabled={loading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent text-white border-none rounded-md font-medium text-base cursor-pointer hover:bg-accent-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </div>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-accent hover:text-accent-hover underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded"
          >
            Forgot your password?
          </Link>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>Having trouble logging in?</p>
          <p>Contact your system administrator for assistance.</p>
        </div>
      </div>
    </div>
  );
}
