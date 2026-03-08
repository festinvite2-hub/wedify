import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

type SupportedOtpType = 'email' | 'recovery' | 'invite' | 'email_change' | 'magiclink';

const SUPPORTED_OTP_TYPES: SupportedOtpType[] = ['email', 'recovery', 'invite', 'email_change', 'magiclink'];

type DebugPayload = {
  codePresent: boolean;
  tokenHashPresent: boolean;
  accessTokenPresent: boolean;
  refreshTokenPresent: boolean;
  rawType: string | null;
  normalizedType: SupportedOtpType | null;
  next: string;
  stage?: string;
  stageError?: string;
  triedOtpTypes?: SupportedOtpType[];
};

function normalizeType(type: string | null): SupportedOtpType | null {
  if (!type) return null;
  if (type === 'signup' || type === 'email_confirmation') return 'email';
  if (SUPPORTED_OTP_TYPES.includes(type as SupportedOtpType)) return type as SupportedOtpType;
  return null;
}

function serializeDebug(debug: DebugPayload) {
  return Buffer.from(JSON.stringify(debug)).toString('base64url');
}

function buildErrorRedirect(request: Request, description?: string | null, debug?: DebugPayload) {
  const url = new URL('/auth/error', request.url);
  if (description) {
    url.searchParams.set('message', description);
  }
  if (debug) {
    url.searchParams.set('debug', serializeDebug(debug));
  }
  return NextResponse.redirect(url);
}

export async function handleAuthConfirmation(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const rawType = searchParams.get('type');
  const type = normalizeType(rawType);
  const next = searchParams.get('next') || '/auth/confirmed';

  const debugBase: DebugPayload = {
    codePresent: Boolean(code),
    tokenHashPresent: Boolean(tokenHash),
    accessTokenPresent: Boolean(searchParams.get('access_token')),
    refreshTokenPresent: Boolean(searchParams.get('refresh_token')),
    rawType,
    normalizedType: type,
    next,
  };

  const externalError = searchParams.get('error_description') || searchParams.get('error');
  if (externalError) {
    return buildErrorRedirect(request, externalError, { ...debugBase, stage: 'external_error' });
  }

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(type === 'recovery' ? '/auth/reset-password' : next, request.url));
    }
    debugBase.stage = 'exchange_code_for_session';
    debugBase.stageError = error.message;
  }

  if (tokenHash) {
    const candidateTypes: SupportedOtpType[] = type ? [type] : ['email', 'recovery', 'magiclink'];
    debugBase.triedOtpTypes = candidateTypes;

    for (const candidateType of candidateTypes) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: candidateType });
      if (!error) {
        return NextResponse.redirect(new URL(candidateType === 'recovery' ? '/auth/reset-password' : next, request.url));
      }
      debugBase.stage = `verify_otp_${candidateType}`;
      debugBase.stageError = error.message;
    }
  }

  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (!error) {
      return NextResponse.redirect(new URL(type === 'recovery' ? '/auth/reset-password' : next, request.url));
    }
    debugBase.stage = 'set_session';
    debugBase.stageError = error.message;
  }

  return buildErrorRedirect(request, null, debugBase);
}
