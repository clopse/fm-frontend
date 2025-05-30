// FILE: src/app/login/page.tsx
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { userService } from '@/services/userService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Normalize email to lowercase before sending to API
      const normalizedEmail = email.trim().toLowerCase();
      
      // Use the real API login
      const response = await userService.login({
        email: normalizedEmail,
        password
      });

      // Login successful - redirect to dashboard
      window.location.href = '/hotels';
    } catch (err) {
      // Show the actual error from the API
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Store the email as typed (preserving user's input visually)
    // but we'll normalize it when submitting
    setEmail(e.target.value);
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4" 
         style={{ backgroundImage: "url('/background-login.jpg')" }}>
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
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            autoComplete="email"
            autoCapitalize="none"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            autoComplete="current-password"
          />
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 text-white border-none rounded-md font-medium text-base cursor-pointer hover:bg-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
