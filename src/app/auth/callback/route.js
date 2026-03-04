import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');

  if (code && type === 'recovery') {
    const url = new URL('/auth/reset-password', request.url);
    url.searchParams.set('code', code);
    return NextResponse.redirect(url);
  }

  if (code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.redirect(new URL('/auth/error', request.url));
}
