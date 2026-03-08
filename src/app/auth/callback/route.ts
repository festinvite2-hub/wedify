import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const token_hash = searchParams.get('token_hash');
  const redirectType = type === 'signup' ? 'email' : type;

  const redirectAfterAuth = () => {
    if (redirectType === 'recovery') {
      return NextResponse.redirect(new URL('/auth/reset-password', request.url));
    }
    return NextResponse.redirect(new URL('/auth/confirmed', request.url));
  };

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return redirectAfterAuth();
  }

  if (token_hash && type) {
    type TokenHashType = Extract<Parameters<typeof supabase.auth.verifyOtp>[0], { token_hash: string }>['type'];
    const tokenHashTypes: TokenHashType[] = ['signup', 'email', 'recovery', 'invite', 'email_change', 'magiclink'];

    if (tokenHashTypes.includes(type as TokenHashType)) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as TokenHashType });
      if (!error) return redirectAfterAuth();
    }
  }

  return NextResponse.redirect(new URL('/auth/error', request.url));
}
