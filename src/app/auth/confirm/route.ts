import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const code = searchParams.get('code');
  const normalizedType = type === 'signup' ? 'email' : type;

  const supabase = createClient();

  // Handle PKCE code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (normalizedType === 'recovery') {
        return NextResponse.redirect(new URL('/auth/reset-password', request.url));
      }
      return NextResponse.redirect(new URL('/auth/confirmed', request.url));
    }
  }

  // Handle legacy token_hash verification
  if (token_hash && normalizedType) {
    type TokenHashType = Extract<Parameters<typeof supabase.auth.verifyOtp>[0], { token_hash: string }>['type'];
    const tokenHashTypes: TokenHashType[] = ['email', 'recovery', 'invite', 'email_change', 'magiclink'];

    if (tokenHashTypes.includes(normalizedType as TokenHashType)) {
      const { error } = await supabase.auth.verifyOtp({ type: normalizedType as TokenHashType, token_hash });
      if (!error) {
        if (normalizedType === 'recovery') {
          return NextResponse.redirect(new URL('/auth/reset-password', request.url));
        }
        return NextResponse.redirect(new URL('/auth/confirmed', request.url));
      }
    }
  }

  return NextResponse.redirect(new URL('/auth/error', request.url));
}
