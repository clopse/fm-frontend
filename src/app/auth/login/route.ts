// FILE: src/app/login/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get('username') || '').trim().toLowerCase();
  const password = String(form.get('password') || '');

  if (!email || !password) {
    return NextResponse.redirect(new URL('/login?message=Please%20fill%20in%20all%20fields', req.url));
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.jmkfacilities.ie';

  // Call your backend login endpoint
  const r = await fetch(`${apiBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  if (!r.ok) {
    // Keep the message simple to avoid leaking info
    return NextResponse.redirect(new URL('/login?message=Invalid%20email%20or%20password', req.url));
  }

  // Adjust this part to match what your backend returns.
  // Common options:
  // - backend returns { access_token: "...", token_type: "bearer" }
  // - backend sets an HttpOnly cookie itself (best)
  const data = await r.json();

  const res = NextResponse.redirect(new URL('/hotels', req.url));

  // If your backend returns a token, set it as an HttpOnly cookie here.
  // Rename cookie to whatever your app expects.
  if (data?.access_token) {
    res.cookies.set('access_token', data.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  }

  return res;
}
