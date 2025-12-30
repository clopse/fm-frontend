// FILE: src/app/login/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || '';

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

        <form
          method="post"
          action="/login"
          autoComplete="on"
          className="space-y-4"
        >
          <div>
            <label htmlFor="username" className="sr-only">Email</label>
            <input
              id="username"
              name="username"
              type="email"
              placeholder="Email"
              autoFocus
              autoComplete="username"
              inputMode="email"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full px-4 py-3 border border-gray-300 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-700 text-white rounded-md font-medium hover:bg-blue-800 transition"
          >
            Login
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
      </div>
    </div>
  );
}
