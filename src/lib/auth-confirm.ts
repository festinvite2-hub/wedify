import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

type SupportedOtpType = 'email' | 'recovery' | 'invite' | 'email_change' | 'magiclink';

const SUPPORTED_OTP_TYPES: SupportedOtpType[] = ['email', 'recovery', 'invite', 'email_change', 'magiclink'];

function normalizeType(type: string | null): SupportedOtpType | null {
  if (!type) return null;
  if (type === 'signup' || type === 'email_confirmation') return 'email';
  if (SUPPORTED_OTP_TYPES.includes(type as SupportedOtpType)) return type as SupportedOtpType;
  return null;
}

function buildErrorRedirect(request: Request, description?: string | null) {
  const url = new URL('/auth/error', request.url);
  if (description) {
    url.searchParams.set('message', description);
  }
  return NextResponse.redirect(url);
}

export async function handleAuthConfirmation(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = normalizeType(searchParams.get('type'));
  const next = searchParams.get('next') || '/auth/confirmed';

  const externalError = searchParams.get('error_description') || searchParams.get('error');
  if (externalError) {
    return buildErrorRedirect(request, externalError);
  }

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(type === 'recovery' ? '/auth/reset-password' : next, request.url));
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(new URL(type === 'recovery' ? '/auth/reset-password' : next, request.url));
    }
  }

  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (!error) {
      return NextResponse.redirect(new URL(type === 'recovery' ? '/auth/reset-password' : next, request.url));
    }
  }

  return buildErrorRedirect(request);
}
