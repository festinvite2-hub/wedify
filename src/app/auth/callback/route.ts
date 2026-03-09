import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const token_hash = searchParams.get('token_hash');
  const normalizedType = type === 'signup' ? 'email' : type;

  const redirectAfterAuth = () => {
    if (normalizedType === 'recovery') {
      return NextResponse.redirect(new URL('/auth/reset-password', request.url));
    }
    return NextResponse.redirect(new URL('/auth/confirmed', request.url));
  };

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return redirectAfterAuth();
  }

  if (token_hash && normalizedType) {
    type TokenHashType = Extract<Parameters<typeof supabase.auth.verifyOtp>[0], { token_hash: string }>['type'];
    const tokenHashTypes: TokenHashType[] = ['email', 'recovery', 'invite', 'email_change', 'magiclink'];

    if (tokenHashTypes.includes(normalizedType as TokenHashType)) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type: normalizedType as TokenHashType });
      if (!error) return redirectAfterAuth();
    }
  }

  return NextResponse.redirect(new URL('/auth/error', request.url));
}
