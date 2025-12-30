// DIAGNOSTIC VERSION - Test if password toggle is blocking autofill
// Replace your login form section with this temporarily to test

<form
  onSubmit={handleSubmit}
  onKeyDown={(e) => loading && e.key === 'Enter' && e.preventDefault()}
  className="space-y-4"
  autoComplete="on"
  name="login"
>
  {/* Email Field */}
  <div>
    <label htmlFor="email" className="sr-only">Email</label>
    <input
      id="email"
      name="email"
      type="text"
      placeholder="Email"
      ref={emailRef}
      disabled={loading}
      className="w-full px-4 py-3 border border-gray-300 rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
      autoComplete="username email"
      inputMode="email"
      autoCapitalize="off"
      spellCheck={false}
      required
    />
  </div>

  {/* Password Field - SIMPLIFIED (no toggle button) */}
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
      required
    />
  </div>

  {/* Submit Button */}
  <button
    type="submit"
    disabled={loading}
    className="w-full py-3 bg-blue-700 text-white rounded-md font-medium hover:bg-blue-800 disabled:opacity-50"
  >
    {loading ? 'Logging in...' : 'Login'}
  </button>
</form>

// TEST THIS:
// 1. Deploy this simplified version
// 2. Click email field
// 3. Select username/password from dropdown
// 4. Does password field auto-fill now?
//
// If YES: The show/hide password toggle is the problem
// If NO: Something else is blocking autofill (browser settings, HTTPS, etc.)
