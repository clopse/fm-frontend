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
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlMessage = searchParams.get('message');
    if (!urlMessage) return;
    setMessage(urlMessage);
    const t = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const email = (emailRef.current?.value || '').trim().toLowerCase();
      const password = passwordRef.current?.value || '';

      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      await userService.login({ email, password });
      router.push('/hotels');
    } catch (err) {
      let errorMessage = 'Login failed';
      if (err instanceof Error) errorMessage = err.message;

      const low = errorMessage.toLowerCase();
      if (low.includes('unauthorized') || low.includes('invalid credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (low.includes('network')) {
        errorMessage = 'Connection error. Please try again.';
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
      <div className="bg-white bg-opacity-95 p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-sm">
        <img
          src="/jmk-logo2.png"
          alt="JMK Logo"
          className="mx-auto mb-4 w-full max-w-xs"
        />

        <h2 className="mb-6 text-xl font-medium text-center text-blue-900">
          Facilities
        </h2>

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form
          method="post"
          action="/login"
          autoComplete="on"
          onSubmit={handleSubmit}
          className="space-y-4"
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
              autoFocus
              autoComplete="username"
              inputMode="email"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full px-4 py-3 border border-gray-300 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 text-white rounded-md font-medium hover:bg-blue-800 transition disabled:opacity-50"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
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
