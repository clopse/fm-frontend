// FILE: src/app/login/page.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlMessage = searchParams.get('message');
    if (!urlMessage) return;
    setMessage(urlMessage);
    const t = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(t);
  }, [searchParams]);

  // If the browser prefilled on mount, clear any stale error
  useEffect(() => {
    if (emailRef.current?.value || passwordRef.current?.value) setError('');
  }, []);

  // Keep this simple. The form POST + redirect is what Chrome likes.
  const handleClientSubmit = () => {
    setLoading(true);
    setError('');
    setMessage('');
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
          method="post"
          action="/auth/login"
          autoComplete="on"
          className="space-y-4"
          onSubmit={handleClientSubmit}
          onKeyDown={(e) => loading && e.key === 'Enter' && e.preventDefault()}
        >
          <div>
            <label htmlFor="username" className="sr-only">Email</label>
            <input
              id="username"
              name="username"
              type="email"
              placeholder="Email"
              ref={emailRef}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              autoFocus
              autoComplete="username"
              inputMode="email"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Email"
              onInput={() => error && setError('')}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              ref={passwordRef}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              autoComplete="current-password"
              aria-label="Password"
              onInput={() => error && setError('')}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 text-white border-none rounded-md font-medium text-base cursor-pointer hover:bg-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
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
            className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
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
