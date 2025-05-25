'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '1234') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('auth', 'true');
      }
      // For demo - would use router.push('/hotels') in real app
      window.location.href = '/hotels';
    } else {
      alert('Incorrect username or password');
    }
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
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <button 
            onClick={handleSubmit}
            className="w-full py-3 bg-blue-700 text-white border-none rounded-md font-medium text-base cursor-pointer hover:bg-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
