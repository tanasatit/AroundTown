'use server';

import { signOut } from '@/lib/auth';

export async function logout() {
  // No redirectTo — just clear the session cookie.
  // Navigation is handled client-side to avoid Vercel deployment-ID redirect issues.
  await signOut({ redirect: false });
}
